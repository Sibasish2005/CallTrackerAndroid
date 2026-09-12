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

class CallTrackerModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    private val telephonyManager: TelephonyManager? =
        reactContext.getSystemService(TelephonyManager::class.java)

    private var telephonyCallback: CallStateCallback? = null

    private var startedAt: Long? = null

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

        try {
            val intent = Intent(
                Intent.ACTION_CALL,
                Uri.fromParts("tel", phoneNumber, null)
            )

            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)

            promise.resolve("call_started")
        } catch (error: Exception) {
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

        Thread {
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
        }.start()
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
        Thread {
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

                if (reactApplicationContext.hasActiveReactInstance()) {
                    val params = Arguments.createMap().apply {
                        putDouble("duration", duration.toDouble())
                        putString("number", number)
                        putString("name", name)
                        putDouble("date", date)
                    }
                    reactApplicationContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("CallEnded", params)
                }
            } catch (e: Exception) {
                if (reactApplicationContext.hasActiveReactInstance()) {
                    val params = Arguments.createMap().apply {
                        putDouble("duration", fallbackDuration.toDouble())
                        putString("number", "")
                        putString("name", "")
                        putDouble("date", System.currentTimeMillis().toDouble())
                    }
                    reactApplicationContext
                        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                        .emit("CallEnded", params)
                }
            }
        }.start()
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