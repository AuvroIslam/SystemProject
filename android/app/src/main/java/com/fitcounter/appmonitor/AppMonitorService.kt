package com.fitcounter.appmonitor

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import androidx.core.app.NotificationCompat

class AppMonitorService : Service() {

    companion object {
        const val CHANNEL_ID = "focus_monitor"
        const val NOTIFICATION_ID = 1001
        const val EXTRA_BLOCKED_PACKAGES = "blocked_packages"
        var onViolation: ((String) -> Unit)? = null
        var isRunning = false
    }

    private val handler = Handler(Looper.getMainLooper())
    private var blockedPackages: Set<String> = emptySet()
    private var lastViolatedPackage: String? = null
    private var lastViolationTime: Long = 0L
    private val VIOLATION_COOLDOWN_MS = 10_000L // 10 seconds between same-app violations

    private val checkRunnable = object : Runnable {
        override fun run() {
            checkForegroundApp()
            handler.postDelayed(this, 1500) // Check every 1.5 seconds
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val packages = intent?.getStringArrayListExtra(EXTRA_BLOCKED_PACKAGES)
        blockedPackages = packages?.toSet() ?: emptySet()

        val notification = buildNotification()
        startForeground(NOTIFICATION_ID, notification)

        isRunning = true
        handler.removeCallbacks(checkRunnable)
        handler.post(checkRunnable)

        return START_STICKY
    }

    override fun onDestroy() {
        isRunning = false
        handler.removeCallbacks(checkRunnable)
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun checkForegroundApp() {
        val foregroundPackage = getForegroundPackageName() ?: return
        if (foregroundPackage in blockedPackages) {
            val now = System.currentTimeMillis()
            // Cooldown: don't spam violations for the same app
            if (foregroundPackage != lastViolatedPackage ||
                now - lastViolationTime > VIOLATION_COOLDOWN_MS
            ) {
                lastViolatedPackage = foregroundPackage
                lastViolationTime = now
                onViolation?.invoke(foregroundPackage)
            }
        }
    }

    private fun getForegroundPackageName(): String? {
        val usm = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return null

        val now = System.currentTimeMillis()
        val stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            now - 60_000, // last 60 seconds
            now
        )

        if (stats.isNullOrEmpty()) return null

        // Find the most recently used app
        return stats.maxByOrNull { it.lastTimeUsed }?.packageName
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Focus Monitor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Monitors app usage during focus sessions"
                setShowBadge(false)
            }
            val nm = getSystemService(NotificationManager::class.java)
            nm.createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Focus Mode Active")
            .setContentText("Monitoring for blocked apps...")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
}
