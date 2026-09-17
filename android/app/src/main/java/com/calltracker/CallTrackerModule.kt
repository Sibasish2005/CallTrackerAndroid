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
            promise.reject(
                "CALL_FAILED",
                error.message,
                error
            )
        }
    }

    @ReactMethod
    fun getCallHistory(limit: Int, promise: Promise) {
        if (
            ContextCompat.checkSelfPermission(
                reactApplicationContext,
                Manifest.permission.READ_CALL_LOG
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            promise.reject(
                "PERMISSION_DENIED",
                "READ_CALL_LOG permission is required"
            )
            return
        }

        bgExecutor.execute {
            try {
                val array = Arguments.createArray()
                val projection = arrayOf(
                    CallLog.Calls._ID,
                    CallLog.Calls.NUMBER,
                    CallLog.Calls.CACHED_NAME,
                    CallLog.Calls.DATE,
                    CallLog.Calls.DURATION,
                    CallLog.Calls.TYPE
                )

                val cursor = reactApplicationContext.contentResolver.query(
                    CallLog.Calls.CONTENT_URI,
                    projection,
                    null,
                    null,
                    "${CallLog.Calls.DATE} DESC"
                )

                var count = 0
                val safeLimit = if (limit > 0) limit else 50

                cursor?.use {
                    val idIdx = it.getColumnIndex(CallLog.Calls._ID)
                    val numIdx = it.getColumnIndex(CallLog.Calls.NUMBER)
                    val nameIdx = it.getColumnIndex(CallLog.Calls.CACHED_NAME)
                    val dateIdx = it.getColumnIndex(CallLog.Calls.DATE)
                    val durIdx = it.getColumnIndex(CallLog.Calls.DURATION)
                    val typeIdx = it.getColumnIndex(CallLog.Calls.TYPE)

                    while (it.moveToNext() && count < safeLimit) {
                        val map = Arguments.createMap().apply {
                            putString("id", if (idIdx >= 0) it.getString(idIdx) else count.toString())
                            putString("number", if (numIdx >= 0) it.getString(numIdx) ?: "Unknown" else "Unknown")
                            putString("name", if (nameIdx >= 0) it.getString(nameIdx) ?: "" else "")
                            putDouble("date", if (dateIdx >= 0) it.getLong(dateIdx).toDouble() else 0.0)
                            putDouble("duration", if (durIdx >= 0) it.getLong(durIdx).toDouble() else 0.0)
                            putInt("type", if (typeIdx >= 0) it.getInt(typeIdx) else 0)
                        }
                        array.pushMap(map)
                        count++
                    }
                }

                promise.resolve(array)
            } catch (e: Exception) {
                promise.reject("CALL_LOG_ERROR", e.message, e)
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

    private fun fetchLatestCallLogAndEmit(fallbackDuration: Long) {
        bgExecutor.execute {
            try {
                // Allow Android system time to commit the completed call to CallLog ContentProvider
                Thread.sleep(700)

                val hasCallLogPerm = ContextCompat.checkSelfPermission(
                    reactApplicationContext,
                    Manifest.permission.READ_CALL_LOG
                ) == PackageManager.PERMISSION_GRANTED

                var duration = fallbackDuration
                var number = ""
                var name = ""
                var date = System.currentTimeMillis().toDouble()

                if (hasCallLogPerm) {
                    val projection = arrayOf(
                        CallLog.Calls._ID,
                        CallLog.Calls.NUMBER,
                        CallLog.Calls.CACHED_NAME,
                        CallLog.Calls.DURATION,
                        CallLog.Calls.DATE
                    )
                    val cursor = reactApplicationContext.contentResolver.query(
                        CallLog.Calls.CONTENT_URI,
                        projection,
                        null,
                        null,
                        "${CallLog.Calls.DATE} DESC"
                    )

                    cursor?.use {
                        if (it.moveToNext()) {
                            val durIdx = it.getColumnIndex(CallLog.Calls.DURATION)
                            val numIdx = it.getColumnIndex(CallLog.Calls.NUMBER)
                            val nameIdx = it.getColumnIndex(CallLog.Calls.CACHED_NAME)
                            val dateIdx = it.getColumnIndex(CallLog.Calls.DATE)

                            if (durIdx >= 0) duration = it.getLong(durIdx)
                            if (numIdx >= 0) number = it.getString(numIdx) ?: ""
                            if (nameIdx >= 0) name = it.getString(nameIdx) ?: ""
                            if (dateIdx >= 0) date = it.getLong(dateIdx).toDouble()
                        }
                    }
                }

                val isAppCall = isAppInitiatedCall
                val appNumber = appInitiatedNumber
                // Reset flags for next call
                isAppInitiatedCall = false
                appInitiatedNumber = null

                val finalNumber = if (number.isNotBlank()) number else (appNumber ?: "Outgoing Call")
                val isConnected = duration > 0

                val generatedCallId = "${date.toLong()}_${System.currentTimeMillis()}"

                // If this call was initiated from HEEYAKU, save it permanently to lifetime app storage
                if (isAppCall) {
                    try {
                        val recordObj = JSONObject().apply {
                            put("id", generatedCallId)
                            put("number", finalNumber)
                            put("name", name)
                            put("date", date)
                            put("duration", duration.toDouble())
                            put("type", 2)
                            put("connected", isConnected)
                        }
                        persistAppCallRecord(recordObj)
                    } catch (err: Exception) {
                        android.util.Log.e("CallTracker", "Error auto-saving app call: ${err.message}")
                    }
                }

                if (reactApplicationContext.hasActiveReactInstance()) {
                    val params = Arguments.createMap().apply {
                        putString("id", generatedCallId)
                        putDouble("duration", duration.toDouble())
                        putString("number", finalNumber)
                        putString("name", name)
                        putDouble("date", date)
                        putBoolean("isAppInitiated", isAppCall)
                        putBoolean("connected", isConnected)
                    }
                    reactApplicationContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("CallEnded", params)
                }
            } catch (e: Exception) {
                val isAppCall = isAppInitiatedCall
                val appNumber = appInitiatedNumber
                isAppInitiatedCall = false
                appInitiatedNumber = null
                val fallbackId = "${System.currentTimeMillis()}_fallback"

                if (reactApplicationContext.hasActiveReactInstance()) {
                    val params = Arguments.createMap().apply {
                        putString("id", fallbackId)
                        putDouble("duration", fallbackDuration.toDouble())
                        putString("number", appNumber ?: "")
                        putString("name", "")
                        putDouble("date", System.currentTimeMillis().toDouble())
                        putBoolean("isAppInitiated", isAppCall)
                        putBoolean("connected", fallbackDuration > 0)
                    }
                    reactApplicationContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("CallEnded", params)
                }
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
                "CALL STATE: $stateName"
            )

            when (state) {
                TelephonyManager.CALL_STATE_OFFHOOK -> {
                    startedAt = System.currentTimeMillis()

                    android.util.Log.d(
                        "CallTracker",
                        "CALL STARTED AT: $startedAt"
                    )
                }

                TelephonyManager.CALL_STATE_IDLE -> {
                    val start = startedAt
                    val durationSeconds = if (start != null) {
                        (System.currentTimeMillis() - start) / 1000
                    } else {
                        0L
                    }

                    android.util.Log.d(
                        "CallTracker",
                        "CALL ENDED. Measured duration: ${durationSeconds}s"
                    )

                    startedAt = null
                    fetchLatestCallLogAndEmit(durationSeconds)
                }
            }

            sendCallState(stateName)
        }
    }

    companion object {
        private const val PHONE_STATE_PERMISSION_REQUEST = 1001
    }
}