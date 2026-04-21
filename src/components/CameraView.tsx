import React, { useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  VisionCameraProxy,
} from 'react-native-vision-camera';
import { useRunOnJS } from 'react-native-worklets-core';
import { PoseLandmarks, Landmark } from '../types/pose';

// Initialise the native frame processor plugin (runs once)
const posePlugin = VisionCameraProxy.initFrameProcessorPlugin('detectPose', {});

interface Props {
  onPoseDetected: (landmarks: PoseLandmarks) => void;
  isActive: boolean;
}

/**
 * Full-screen camera with native ML Kit pose detection frame processor.
 *
 * The "detectPose" plugin is registered natively on both Android (Kotlin)
 * and iOS (Swift). It returns 33 normalised landmarks per frame.
 */
function CameraViewInner({ onPoseDetected, isActive }: Props) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Bridge from worklet thread → JS thread
  const handlePose = useRunOnJS(
    useCallback(
      (landmarks: PoseLandmarks) => {
        onPoseDetected(landmarks);
      },
      [onPoseDetected],
    ),
    [],
  );

  // VisionCamera frame processor — runs on a separate native thread
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (posePlugin == null) return;

      const result = posePlugin.call(frame) as Landmark[] | undefined | null;

      if (result && Array.isArray(result) && result.length >= 33) {
        handlePose(result as PoseLandmarks);
      }
    },
    [handlePose],
  );

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>Camera permission is required</Text>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.msg}>No camera found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
        outputOrientation="device"
      />
    </View>
  );
}

export const CameraView = React.memo(CameraViewInner);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  msg: { color: '#fff', fontSize: 16 },
});
