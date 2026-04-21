package com.fitcounter.posedetection

import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.FrameProcessorPluginRegistry
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

/**
 * Registers the PoseDetectionPlugin so it can be used as a VisionCamera
 * frame processor plugin named "detectPose".
 *
 * This class is loaded via the static initializer, so it runs automatically
 * before any JS code accesses the plugin.
 */
class PoseDetectionPluginPackage {
    companion object {
        init {
            FrameProcessorPluginRegistry.addFrameProcessorPlugin("detectPose") {
                proxy: VisionCameraProxy, options: Map<String, Any>? ->
                PoseDetectionPlugin(proxy, options)
            }
        }
    }
}
