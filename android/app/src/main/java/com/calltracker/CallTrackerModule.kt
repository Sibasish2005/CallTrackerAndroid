package com.calltracker

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.CallLog
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.PermissionAwareActivity
import com.facebook.react.modules.core.PermissionListener
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CallTrackerModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val telephonyManager: TelephonyManager? =
        reactContext.getSystemService(TelephonyManager::class.java)

    @Volatile
    private var telephonyCallback: CallStateCallback? = null

    @Volatile
    private var startedAt: Long? = null

    // Track active call dialed through HEEYAKU app with volatile memory visibility
    @Volatile
    private var isAppInitiatedCall: Boolean = false
    @Volatile
    private var appInitiatedNumber: String? = null
    @Volatile
    private var appCallDialedTime: Long = 0L

    // Dedicated single-thread executor to eliminate unpooled thread churn
    private val bgExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private val storageLock = Any()

    // SharedPreferences for persistent app call storage
    private val prefs by lazy {
        reactApplicationContext.getSharedPreferences("heeyaku_app_calls", android.content.Context.MODE_PRIVATE)
    }

    override fun getName(): String = "CallTracker"

    @ReactMethod
    fun getPlatform(promise: Promise) {
        promise.resolve("Android")
    }

    @ReactMethod
    fun checkPermissions(promise: Promise) {
        val permissions = arrayOf(
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_CALL_LOG
        )

        val missing = permissions.any {
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                it
            ) != PackageManager.PERMISSION_GRANTED
        }

        promise.resolve(if (!missing) "granted" else "denied")
    }

    @ReactMethod
    fun requestPhoneStatePermission(promise: Promise) {
        val activity = reactApplicationContext.currentActivity

        if (activity == null) {
            promise.reject(
                "NO_ACTIVITY",
                "No current Android Activity"
            )
            return
        }

        val permissions = arrayOf(
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.READ_CALL_LOG
        )

        val missingPermissions = permissions.filter {
            ContextCompat.checkSelfPermission(
                activity,
                it
            ) != PackageManager.PERMISSION_GRANTED
        }

        if (missingPermissions.isEmpty()) {
            promise.resolve("granted")
            return
        }

        val permissionAware = activity as? PermissionAwareActivity
        if (permissionAware != null) {
            permissionAware.requestPermissions(
                missingPermissions.toTypedArray(),
                PHONE_STATE_PERMISSION_REQUEST,
                PermissionListener { requestCode, _, grantResults ->
                    if (requestCode == PHONE_STATE_PERMISSION_REQUEST) {
                        val allGranted = grantResults.isNotEmpty() &&
                            grantResults.all { it == PackageManager.PERMISSION_GRANTED }
                        if (allGranted) {
                            promise.resolve("granted")
                        } else {
                            promise.resolve("denied")
                        }
                        true
                    } else {
                        false
                    }
                }
            )
        } else {
            ActivityCompat.requestPermissions(
                activity,
                missingPermissions.toTypedArray(),
                PHONE_STATE_PERMISSION_REQUEST
            )
            promise.resolve("requested")
        }
    }

    @ReactMethod
    fun startCallStateListener(promise: Promise) {
        if (
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.READ_PHONE_STATE
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            promise.reject(
                "PERMISSION_DENIED",
                "READ_PHONE_STATE permission is required"
            )
            return
        }

        if (telephonyManager == null) {
            promise.reject(
                "NO_TELEPHONY",
                "Telephony service is not available on this device"
            )
            return
        }

        if (telephonyCallback != null) {
            promise.resolve("already_listening")
            return
        }

        val callback = CallStateCallback()
        telephonyCallback = callback

        telephonyManager.registerTelephonyCallback(
            reactApplicationContext.mainExecutor,
            callback
        )

        promise.resolve("listening")
    }

    @ReactMethod
    fun stopCallStateListener(promise: Promise) {
        val callback = telephonyCallback
        if (callback != null) {
            telephonyManager?.unregisterTelephonyCallback(callback)
            telephonyCallback = null
            promise.resolve("stopped")
        } else {
            promise.resolve("not_listening")
        }
    }

    @ReactMethod
    fun startCall(phoneNumber: String, promise: Promise) {
        if (
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.CALL_PHONE
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            promise.reject(
                "CALL_PERMISSION_DENIED",
                "CALL_PHONE permission is required"
            )
            return
        }

        // Automatically ensure listener is active when starting a call
        if (telephonyCallback == null && telephonyManager != null &&
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.READ_PHONE_STATE
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            try {
                val callback = CallStateCallback()
                telephonyCallback = callback
                telephonyManager.registerTelephonyCallback(
                    reactApplicationContext.mainExecutor,
                    callback
                )
            } catch (e: Exception) {
                android.util.Log.e("CallTracker", "Failed to auto-register listener: ${e.message}")
            }
        }

        val sanitized = phoneNumber.replace(Regex("[^0-9+*#,;]"), "")
        if (sanitized.isBlank() || sanitized.length > 32) {
            promise.reject("INVALID_NUMBER", "Phone number is invalid or exceeds safe length")
            return
        }

        try {
            // Flag that this call was explicitly initiated from HEEYAKU app
            isAppInitiatedCall = true
            appInitiatedNumber = sanitized
            appCallDialedTime = System.currentTimeMillis()

            val intent = Intent(
                Intent.ACTION_CALL,
                Uri.fromParts("tel", sanitized, null)
            )

            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)

            promise.resolve("call_started")
        } catch (error: Exception) {
            isAppInitiatedCall = false
            appInitiatedNumber = null
            appCallDialedTime = 0L
            promise.reject(
                "CALL_FAILED",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun getCallHistory(limit: Int, promise: Promise) {
        // STRICT PRIVACY & INTEGRITY: Never return personal device-wide call logs.
        // Return only HEEYAKU app-initiated calls from local storage.
        bgExecutor.execute {
            synchronized(storageLock) {
                try {
                    val jsonStr = prefs.getString("calls_list", "[]") ?: "[]"
                    val jsonArray = JSONArray(jsonStr)
                    val outcomeMapStr = prefs.getString("outcome_map", "{}") ?: "{}"
                    val outcomeMap = JSONObject(outcomeMapStr)
                    val array = Arguments.createArray()
                    val safeLimit = if (limit > 0) Math.min(limit, jsonArray.length()) else jsonArray.length()

                    for (i in 0 until safeLimit) {
                        val obj = jsonArray.getJSONObject(i)
                        val id = obj.optString("id")

                        var outcomeId = if (obj.has("outcomeId")) obj.optString("outcomeId") else null
                        var outcomeLabel = if (obj.has("outcomeLabel")) obj.optString("outcomeLabel") else null
                        var notes = if (obj.has("notes")) obj.optString("notes") else null

                        // If not on object, check outcome_map
                        if (outcomeId.isNullOrBlank() && outcomeMap.has(id)) {
                            val mapObj = outcomeMap.getJSONObject(id)
                            outcomeId = mapObj.optString("outcomeId")
                            outcomeLabel = mapObj.optString("outcomeLabel")
                            if (mapObj.has("notes")) notes = mapObj.optString("notes")
                        }

                        val map = Arguments.createMap().apply {
                            putString("id", id)
                            putString("number", obj.optString("number"))
                            putString("name", obj.optString("name"))
                            putDouble("date", obj.optDouble("date", 0.0))
                            putDouble("duration", obj.optDouble("duration", 0.0))
                            putInt("type", obj.optInt("type", 2))
                            putBoolean("connected", obj.optBoolean("connected", false))
                            if (!outcomeId.isNullOrBlank()) putString("outcomeId", outcomeId)
                            if (!outcomeLabel.isNullOrBlank()) putString("outcomeLabel", outcomeLabel)
                            if (!notes.isNullOrBlank()) putString("notes", notes)
                        }
                        array.pushMap(map)
                    }
                    promise.resolve(array)
                } catch (e: Exception) {
                    promise.reject("APP_CALLS_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun clearAppCalls(promise: Promise) {
        bgExecutor.execute {
            synchronized(storageLock) {
                try {
                    prefs.edit().remove("calls_list").remove("outcome_map").apply()
                    promise.resolve(true)
                } catch (e: Exception) {
                    promise.reject("STORAGE_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun getAppCalls(promise: Promise) {
        bgExecutor.execute {
            synchronized(storageLock) {
                try {
                    val jsonStr = prefs.getString("calls_list", "[]") ?: "[]"
                    val jsonArray = JSONArray(jsonStr)
                    val outcomeMapStr = prefs.getString("outcome_map", "{}") ?: "{}"
                    val outcomeMap = JSONObject(outcomeMapStr)
                    val array = Arguments.createArray()

                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        val id = obj.optString("id")

                        var outcomeId = if (obj.has("outcomeId")) obj.optString("outcomeId") else null
                        var outcomeLabel = if (obj.has("outcomeLabel")) obj.optString("outcomeLabel") else null
                        var notes = if (obj.has("notes")) obj.optString("notes") else null

                        // If not on object, check outcome_map
                        if (outcomeId.isNullOrBlank() && outcomeMap.has(id)) {
                            val mapObj = outcomeMap.getJSONObject(id)
                            outcomeId = mapObj.optString("outcomeId")
                            outcomeLabel = mapObj.optString("outcomeLabel")
                            if (mapObj.has("notes")) notes = mapObj.optString("notes")
                        }

                        val map = Arguments.createMap().apply {
                            putString("id", id)
                            putString("number", obj.optString("number"))
                            putString("name", obj.optString("name"))
                            putDouble("date", obj.optDouble("date", 0.0))
                            putDouble("duration", obj.optDouble("duration", 0.0))
                            putInt("type", obj.optInt("type", 2))
                            putBoolean("connected", obj.optBoolean("connected", false))
                            if (!outcomeId.isNullOrBlank()) putString("outcomeId", outcomeId)
                            if (!outcomeLabel.isNullOrBlank()) putString("outcomeLabel", outcomeLabel)
                            if (!notes.isNullOrBlank()) putString("notes", notes)
                        }
                        array.pushMap(map)
                    }
                    promise.resolve(array)
                } catch (e: Exception) {
                    promise.reject("APP_CALLS_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun updateAppCallOutcome(callId: String, outcomeId: String, outcomeLabel: String, notes: String?, promise: Promise) {
        bgExecutor.execute {
            synchronized(storageLock) {
                try {
                    val jsonStr = prefs.getString("calls_list", "[]") ?: "[]"
                    val jsonArray = JSONArray(jsonStr)
                    var updated = false

                    for (i in 0 until jsonArray.length()) {
                        val obj = jsonArray.getJSONObject(i)
                        if (obj.optString("id") == callId) {
                            obj.put("outcomeId", outcomeId)
                            obj.put("outcomeLabel", outcomeLabel)
                            if (notes != null) obj.put("notes", notes)
                            updated = true
                            break
                        }
                    }

                    // Fallback: If ID didn't match directly, update the most recent call record in calls_list
                    if (!updated && jsonArray.length() > 0) {
                        val latestObj = jsonArray.getJSONObject(0)
                        latestObj.put("outcomeId", outcomeId)
                        latestObj.put("outcomeLabel", outcomeLabel)
                        if (notes != null) latestObj.put("notes", notes)
                        updated = true
                    }

                    if (updated) {
                        prefs.edit().putString("calls_list", jsonArray.toString()).apply()
                    }

                    // Also store in standalone outcome map by callId
                    val outcomeMapStr = prefs.getString("outcome_map", "{}") ?: "{}"
                    val outcomeMap = JSONObject(outcomeMapStr)
                    val item = JSONObject().apply {
                        put("outcomeId", outcomeId)
                        put("outcomeLabel", outcomeLabel)
                        if (notes != null) put("notes", notes)
                    }
                    outcomeMap.put(callId, item)
                    prefs.edit().putString("outcome_map", outcomeMap.toString()).apply()

                    promise.resolve("updated")
                } catch (e: Exception) {
                    promise.reject("OUTCOME_UPDATE_ERROR", e.message, e)
                }
            }
        }
    }

    @ReactMethod
    fun setItem(key: String, value: String, promise: Promise) {
        bgExecutor.execute {
            try {
                prefs.edit().putString(key, value).apply()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STORAGE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getItem(key: String, promise: Promise) {
        bgExecutor.execute {
            try {
                val value = prefs.getString(key, null)
                promise.resolve(value)
            } catch (e: Exception) {
                promise.reject("STORAGE_ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun removeItem(key: String, promise: Promise) {
        bgExecutor.execute {
            try {
                prefs.edit().remove(key).apply()
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("STORAGE_ERROR", e.message, e)
            }
        }
    }

    private fun persistAppCallRecord(record: JSONObject) {
        synchronized(storageLock) {
            try {
                val jsonStr = prefs.getString("calls_list", "[]") ?: "[]"
                val jsonArray = JSONArray(jsonStr)
                
                // Check for outcome in standalone outcome map
                val outcomeMapStr = prefs.getString("outcome_map", "{}") ?: "{}"
                val outcomeMap = JSONObject(outcomeMapStr)
                val callId = record.optString("id")
                if (outcomeMap.has(callId)) {
                    val outcomeObj = outcomeMap.getJSONObject(callId)
                    record.put("outcomeId", outcomeObj.optString("outcomeId"))
                    record.put("outcomeLabel", outcomeObj.optString("outcomeLabel"))
                    if (outcomeObj.has("notes")) record.put("notes", outcomeObj.optString("notes"))
                }

                // Put new call at the beginning (most recent first)
                val newArray = JSONArray()
                newArray.put(record)
                for (i in 0 until jsonArray.length()) {
                    val existing = jsonArray.getJSONObject(i)
                    if (existing.optString("id") != callId) {
                        newArray.put(existing)
                    }
                }

                prefs.edit().putString("calls_list", newArray.toString()).apply()
            } catch (e: Exception) {
                android.util.Log.e("CallTracker", "Failed to persist app call: ${e.message}")
            }
        }
    }

    @ReactMethod
    fun addListener(eventName: String) {
        // Required for RN built-in Event Emitter calls
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN built-in Event Emitter calls
    }

    override fun invalidate() {
        super.invalidate()
        telephonyCallback?.let {
            telephonyManager?.unregisterTelephonyCallback(it)
            telephonyCallback = null
        }
        try {
            bgExecutor.shutdown()
        } catch (e: Exception) {
            // Ignore
        }
    }

    private fun sendCallState(state: String) {
        if (reactApplicationContext.hasActiveReactInstance()) {
            reactApplicationContext
                .getJSModule(
                    DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
                )
                .emit("CallStateChanged", state)
        }
    }

    private fun fetchLatestCallLogAndEmit(targetNumber: String, dialedTime: Long) {
        bgExecutor.execute {
            try {
                val hasCallLogPerm = ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.READ_CALL_LOG
                ) == PackageManager.PERMISSION_GRANTED

                var realDuration = 0L
                var isConnected = false
                var contactName = ""
                var finalNumber = targetNumber
                var callDate = if (dialedTime > 0) dialedTime.toDouble() else System.currentTimeMillis().toDouble()
                var callFound = false
                var attempts = 0

                val cleanTarget = targetNumber.replace(Regex("[^0-9]"), "")
                val targetLast10 = if (cleanTarget.length >= 10) cleanTarget.takeLast(10) else cleanTarget

                val projection = arrayOf(
                    CallLog.Calls._ID,
                    CallLog.Calls.NUMBER,
                    CallLog.Calls.CACHED_NAME,
                    CallLog.Calls.DURATION,
                    CallLog.Calls.DATE,
                    CallLog.Calls.TYPE
                )

                // Poll CallLog with retries (Android OS takes 300ms - 1500ms to commit call duration after IDLE)
                while (attempts < 4 && !callFound) {
                    Thread.sleep(if (attempts == 0) 600 else 500)
                    attempts++

                    if (hasCallLogPerm) {
                        val minDate = (if (dialedTime > 0) dialedTime - 10000 else System.currentTimeMillis() - 30000).toString()
                        val cursor = reactApplicationContext.contentResolver.query(
                            CallLog.Calls.CONTENT_URI,
                            projection,
                            "${CallLog.Calls.DATE} >= ?",
                            arrayOf(minDate),
                            "${CallLog.Calls.DATE} DESC"
                        )

                        cursor?.use {
                            val durIdx = it.getColumnIndex(CallLog.Calls.DURATION)
                            val numIdx = it.getColumnIndex(CallLog.Calls.NUMBER)
                            val nameIdx = it.getColumnIndex(CallLog.Calls.CACHED_NAME)
                            val dateIdx = it.getColumnIndex(CallLog.Calls.DATE)
                            val typeIdx = it.getColumnIndex(CallLog.Calls.TYPE)

                            while (it.moveToNext()) {
                                val rowNum = if (numIdx >= 0) it.getString(numIdx) ?: "" else ""
                                val cleanRow = rowNum.replace(Regex("[^0-9]"), "")
                                val rowLast10 = if (cleanRow.length >= 10) cleanRow.takeLast(10) else cleanRow

                                if (targetLast10.isNotEmpty() && (rowLast10 == targetLast10 || cleanRow.contains(targetLast10))) {
                                    callFound = true
                                    val dur = if (durIdx >= 0) it.getLong(durIdx) else 0L
                                    val callType = if (typeIdx >= 0) it.getInt(typeIdx) else CallLog.Calls.OUTGOING_TYPE

                                    // Android CallLog.Calls.DURATION is strictly the connected talk time in seconds.
                                    // 0 = unanswered / busy / rejected / ringing hangup.
                                    // >0 = real connected talk time (seconds actually spoken).
                                    if (dur > 0L && callType != CallLog.Calls.MISSED_TYPE && callType != CallLog.Calls.REJECTED_TYPE) {
                                        realDuration = dur
                                        isConnected = true
                                    } else {
                                        realDuration = 0L
                                        isConnected = false
                                    }

                                    if (dateIdx >= 0) callDate = it.getLong(dateIdx).toDouble()
                                    if (nameIdx >= 0) contactName = it.getString(nameIdx) ?: ""
                                    if (rowNum.isNotBlank()) finalNumber = rowNum
                                    break
                                }
                            }
                        }
                    }
                }

                // Reset app call flags now that call processing is done
                isAppInitiatedCall = false
                appInitiatedNumber = null
                appCallDialedTime = 0L

                val generatedCallId = "${callDate.toLong()}_${System.currentTimeMillis()}"

                // Save app call permanently to lifetime storage
                val recordObj = JSONObject().apply {
                    put("id", generatedCallId)
                    put("number", finalNumber)
                    put("name", contactName)
                    put("date", callDate)
                    put("duration", realDuration.toDouble())
                    put("type", 2)
                    put("connected", isConnected)
                }
                persistAppCallRecord(recordObj)

                if (reactApplicationContext.hasActiveReactInstance()) {
                    val params = Arguments.createMap().apply {
                        putString("id", generatedCallId)
                        putDouble("duration", realDuration.toDouble())
                        putString("number", finalNumber)
                        putString("name", contactName)
                        putDouble("date", callDate)
                        putBoolean("isAppInitiated", true)
                        putBoolean("connected", isConnected)
                    }
                    reactApplicationContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("CallEnded", params)
                }
            } catch (e: Exception) {
                isAppInitiatedCall = false
                appInitiatedNumber = null
                appCallDialedTime = 0L
                android.util.Log.e("CallTracker", "Error processing app call ended: ${e.message}")
            }
        }
    }

    private inner class CallStateCallback :
        TelephonyCallback(),
        TelephonyCallback.CallStateListener {

        override fun onCallStateChanged(state: Int) {
            val stateName = when (state) {
                TelephonyManager.CALL_STATE_IDLE -> "IDLE"
                TelephonyManager.CALL_STATE_RINGING -> "RINGING"
                TelephonyManager.CALL_STATE_OFFHOOK -> "OFFHOOK"
                else -> "UNKNOWN"
            }

            android.util.Log.d(
                "CallTracker",
                "CALL STATE: $stateName (isAppCall=$isAppInitiatedCall)"
            )

            // STRICT FILTER: Personal calls (incoming, non-app outgoing) are completely ignored.
            // Never alter app state, never track, never emit for calls outside HEEYAKU.
            if (!isAppInitiatedCall) {
                return
            }

            when (state) {
                TelephonyManager.CALL_STATE_OFFHOOK -> {
                    startedAt = System.currentTimeMillis()
                    sendCallState(stateName)
                }

                TelephonyManager.CALL_STATE_IDLE -> {
                    startedAt = null
                    val targetNum = appInitiatedNumber ?: ""
                    val dialedTime = appCallDialedTime
                    sendCallState(stateName)
                    fetchLatestCallLogAndEmit(targetNum, dialedTime)
                }

                else -> {
                    sendCallState(stateName)
                }
            }
        }
    }

    companion object {
        private const val PHONE_STATE_PERMISSION_REQUEST = 1001
    }
}