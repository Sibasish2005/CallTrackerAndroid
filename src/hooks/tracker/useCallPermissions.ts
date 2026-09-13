import { useCallback, useState } from 'react';
import { NativeModules } from 'react-native';

const { CallTracker } = NativeModules;

export interface UseCallPermissionsReturn {
  permissionGranted: boolean;
  setPermissionGranted: (granted: boolean) => void;
  statusMessage: string;
  setStatusMessage: (msg: string) => void;
  requestPermissions: (onGranted?: () => void) => Promise<string>;
  checkPermissions: () => Promise<string>;
}

export function useCallPermissions(): UseCallPermissionsReturn {
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Initializing...');

  const checkPermissions = useCallback(async (): Promise<string> => {
    try {
      if (CallTracker?.checkPermissions) {
        const status: string = await CallTracker.checkPermissions();
        if (status === 'granted') {
          setPermissionGranted(true);
        }
        return status;
      }
      return 'unavailable';
    } catch (err: any) {
      console.log('Check permissions error:', err?.message);
      return 'error';
    }
  }, []);

  const requestPermissions = useCallback(async (onGranted?: () => void): Promise<string> => {
    try {
      setStatusMessage('Requesting permissions...');
      if (CallTracker?.requestPhoneStatePermission) {
        const result: string = await CallTracker.requestPhoneStatePermission();
        setStatusMessage(`Permissions: ${result}`);
        if (result === 'granted') {
          setPermissionGranted(true);
          onGranted?.();
        }
        return result;
      }
      return 'unavailable';
    } catch (error: any) {
      setStatusMessage(`Permission error: ${error?.message || error}`);
      return 'error';
    }
  }, []);

  return {
    permissionGranted,
    setPermissionGranted,
    statusMessage,
    setStatusMessage,
    requestPermissions,
    checkPermissions,
  };
}
