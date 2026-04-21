package com.fitcounter.appmonitor

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class AppMonitorModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppMonitor"

    /**
     * Check if PACKAGE_USAGE_STATS permission is granted.
     */
    @ReactMethod
    fun hasUsagePermission(promise: Promise) {
        promise.resolve(checkUsagePermission())
    }

    /**
     * Open the system settings page where user grants usage access.
     */
    @ReactMethod
    fun requestUsagePermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        reactContext.startActivity(intent)
    }

    /**
     * Start the foreground service that monitors blocked apps.
     */
    @ReactMethod
    fun startMonitoring(blockedApps: ReadableArray) {
        val packages = ArrayList<String>()
        for (i in 0 until blockedApps.size()) {
            blockedApps.getString(i)?.let { packages.add(it) }
        }

        // Set up violation callback → emit JS event
        AppMonitorService.onViolation = { packageName ->
            sendEvent("onAppViolation", Arguments.createMap().apply {
                putString("packageName", packageName)
            })
        }

        val intent = Intent(reactContext, AppMonitorService::class.java).apply {
            putStringArrayListExtra(AppMonitorService.EXTRA_BLOCKED_PACKAGES, packages)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            reactContext.startForegroundService(intent)
        } else {
            reactContext.startService(intent)
        }
    }

    /**
     * Stop the monitoring service.
     */
    @ReactMethod
    fun stopMonitoring() {
        AppMonitorService.onViolation = null
        val intent = Intent(reactContext, AppMonitorService::class.java)
        reactContext.stopService(intent)
    }

    /**
     * Check if the monitoring service is currently running.
     */
    @ReactMethod
    fun isMonitoring(promise: Promise) {
        promise.resolve(AppMonitorService.isRunning)
    }

    private fun checkUsagePermission(): Boolean {
        val appOps = reactContext.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactContext.packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun sendEvent(eventName: String, params: WritableMap) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }

    /**
     * Required for NativeEventEmitter on iOS — no-op on Android but must exist.
     */
    @ReactMethod
    fun addListener(eventName: String) { /* no-op */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* no-op */ }
}
