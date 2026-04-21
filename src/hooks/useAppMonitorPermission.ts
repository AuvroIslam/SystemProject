import { useState, useEffect, useCallback } from 'react';
import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

const { AppMonitor } = NativeModules;

export function useAppMonitorPermission() {
  const [hasPermission, setHasPermission] = useState(false);
  const [checked, setChecked] = useState(false);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(false);
      setChecked(true);
      return;
    }
    try {
      const granted = await AppMonitor.hasUsagePermission();
      setHasPermission(granted);
    } catch {
      setHasPermission(false);
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  const requestPermission = useCallback(() => {
    AppMonitor.requestUsagePermission();
    // User goes to settings — recheck after a delay when they return
    const interval = setInterval(async () => {
      try {
        const granted = await AppMonitor.hasUsagePermission();
        if (granted) {
          setHasPermission(true);
          clearInterval(interval);
        }
      } catch { /* ignore */ }
    }, 1000);
    // Stop polling after 60 seconds
    setTimeout(() => clearInterval(interval), 60000);
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
  }, []);

  return { hasPermission, checked, check, requestPermission, requestNotificationPermission };
}
