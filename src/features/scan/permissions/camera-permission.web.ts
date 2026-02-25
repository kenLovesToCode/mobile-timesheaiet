export type CameraPermissionSnapshot = {
  status: 'undetermined';
  granted: false;
  canAskAgain: false;
  expires: 'never';
  isAvailable: false;
};

const unsupportedPermissionSnapshot: CameraPermissionSnapshot = {
  status: 'undetermined',
  granted: false,
  canAskAgain: false,
  expires: 'never',
  isAvailable: false,
};

export async function getCameraPermissionSnapshot(): Promise<CameraPermissionSnapshot> {
  return unsupportedPermissionSnapshot;
}

export async function requestCameraPermissionSnapshot(): Promise<CameraPermissionSnapshot> {
  return unsupportedPermissionSnapshot;
}

