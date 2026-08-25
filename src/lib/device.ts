/**
 * Returns a stable per-browser device ID, generating and persisting one
 * on first use. This is what a license key gets "bound" to.
 */
export function getDeviceId(): string {
  const STORAGE_KEY = "device_id";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export function getStoredLicenseKey(): string | null {
  return localStorage.getItem("license_key");
}

export function setStoredLicenseKey(key: string): void {
  localStorage.setItem("license_key", key);
  localStorage.setItem("license_activated", "yes");
}

export function isLocallyActivated(): boolean {
  return Boolean(localStorage.getItem("license_key")) && localStorage.getItem("license_activated") === "yes";
}

export function clearActivation(): void {
  localStorage.removeItem("license_activated");
}
