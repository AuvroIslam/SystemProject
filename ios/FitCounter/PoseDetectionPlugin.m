/**
 * Register the PoseDetectionPlugin with VisionCamera's frame processor runtime.
 * This Obj-C file uses the VISION_EXPORT_FRAME_PROCESSOR macro which handles
 * the static registration automatically.
 */

#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>

// Import the Swift-generated header from the bridging header
#import "FitCounter-Swift.h"

VISION_EXPORT_FRAME_PROCESSOR(PoseDetectionPlugin, detectPose)
