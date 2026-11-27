export type NativeHapticStyle = 'light' | 'medium' | 'heavy';
export type NativeHapticReason =
  | 'NO_BRIDGE'
  | 'NON_PLATFORM'
  | 'UNAVAILABLE'
  | 'PERMISSION_DENIED'
  | 'INVALID_PARAMS'
  | 'INTERNAL_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'NOT_FOUND'
  | 'UNKNOWN';

type NativeRuntime = {
  host: 'rn-webview' | 'browser';
  version: string;
};

type NativeBridge = {
  version: string;
  invoke<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
  isAvailable(method: string): boolean;
  getRuntime(): NativeRuntime;
  reportReady(payload?: Record<string, unknown>): Record<string, unknown>;
  dispose(): void;
};

type HapticResult =
  | { ok: true }
  | { ok: false; reason: NativeHapticReason; error?: unknown };

declare global {
  interface Window {
    NativeBridge?: NativeBridge;
    NativeBridgeSDK?: NativeBridge;
  }
}

function getNativeBridge() {
  return window.NativeBridge || window.NativeBridgeSDK || null;
}

function reasonFor(error: unknown): NativeHapticReason {
  const code = (error as { code?: string } | null)?.code;
  if (
    code === 'UNAVAILABLE'
    || code === 'PERMISSION_DENIED'
    || code === 'INVALID_PARAMS'
    || code === 'INTERNAL_ERROR'
    || code === 'TIMEOUT'
    || code === 'CANCELLED'
    || code === 'NOT_FOUND'
  ) {
    return code;
  }
  return 'UNKNOWN';
}

export async function invokesNativeVibration(style: NativeHapticStyle): Promise<HapticResult> {
  const bridge = getNativeBridge();
  if (!bridge) return { ok: false, reason: 'NO_BRIDGE' };

  const runtime = bridge.getRuntime();
  if (runtime.host === 'browser') return { ok: false, reason: 'NON_PLATFORM' };

  try {
    await bridge.invoke('vibrate', { style });
    return { ok: true };
  } catch (error) {
    const reason = reasonFor(error);
    console.warn('[NativeBridge] vibrate', reason, error);
    return { ok: false, reason, error };
  }
}

export async function initializeNativeVibration(): Promise<HapticResult> {
  const bridge = getNativeBridge();
  if (!bridge) return { ok: false, reason: 'NO_BRIDGE' };

  const runtime = bridge.getRuntime();
  if (runtime.host === 'browser') return { ok: false, reason: 'NON_PLATFORM' };

  const result = await invokesNativeVibration('light');
  bridge.reportReady({
    scene: 'gu-memory',
    host: runtime.host,
    capability: 'vibrate',
  });
  return result;
}

export function disposeNativeBridge() {
  const bridge = getNativeBridge();
  try {
    bridge?.dispose();
  } catch {
    // Host disposal is best effort during page teardown.
  }
}
