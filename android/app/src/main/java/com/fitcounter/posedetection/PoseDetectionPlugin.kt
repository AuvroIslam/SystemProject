package com.fitcounter.posedetection

import android.media.Image
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.accurate.AccuratePoseDetectorOptions
import com.mrousavy.camera.core.types.Orientation
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

class PoseDetectionPlugin(
    proxy: VisionCameraProxy,
    options: Map<String, Any>?
) : FrameProcessorPlugin() {

    private val detector: PoseDetector

    init {
        val opts = AccuratePoseDetectorOptions.Builder()
            .setDetectorMode(AccuratePoseDetectorOptions.STREAM_MODE)
            .build()
        detector = PoseDetection.getClient(opts)
    }

    private fun orientationToDegrees(orientation: Orientation): Int =
        when (orientation) {
            Orientation.PORTRAIT -> 0
            Orientation.LANDSCAPE_LEFT -> 90
            Orientation.PORTRAIT_UPSIDE_DOWN -> 180
            Orientation.LANDSCAPE_RIGHT -> 270
        }

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
        val mediaImage: Image
        try {
            mediaImage = frame.image
        } catch (e: Exception) {
            return null
        }

        val width = frame.width.toFloat()
        val height = frame.height.toFloat()
        val rotation = orientationToDegrees(frame.orientation)
        val inputImage = InputImage.fromMediaImage(mediaImage, rotation)

        return try {
            val pose = Tasks.await(detector.process(inputImage))
            val landmarks = pose.allPoseLandmarks

            if (landmarks.isEmpty()) return null

            val result = ArrayList<Map<String, Any>>(landmarks.size)
            for (lm in landmarks) {
                val map = HashMap<String, Any>(4)
                map["x"] = (lm.position.x / width).toDouble()
                map["y"] = (lm.position.y / height).toDouble()
                map["z"] = lm.position3D.z.toDouble()
                map["visibility"] = lm.inFrameLikelihood.toDouble()
                result.add(map)
            }
            result
        } catch (e: Exception) {
            null
        }
    }
}
