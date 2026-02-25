import {
  Camera,
  type PermissionResponse,
} from 'expo-camera';

export type CameraPermissionSnapshot = Pick<
  PermissionResponse,
  'status' | 'granted' | 'canAskAgain' | 'expires'
> & {
  isAvailable: true;
};

export async function getCameraPermissionSnapshot(): Promise<CameraPermissionSnapshot> {
  const permission = await Camera.getCameraPermissionsAsync();

  return {
    status: permission.status,
    granted: permission.granted,
    canAskAgain: permission.canAskAgain,
    expires: permission.expires,
    isAvailable: true,
  };
}

export async function requestCameraPermissionSnapshot(): Promise<CameraPermissionSnapshot> {
  const permission = await Camera.requestCameraPermissionsAsync();

  return {
    status: permission.status,
    granted: permission.granted,
    canAskAgain: permission.canAskAgain,
    expires: permission.expires,
    isAvailable: true,
  };
}
