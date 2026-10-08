import { registerSW } from 'virtual:pwa-register';

type UpdateCallback = () => void;
const updateCallbacks = new Set<UpdateCallback>();
let globalUpdateSW: ((reloadPage?: boolean) => Promise<void>) | null = null;
let isUpdatePending = false;

export function onPWAUpdateAvailable(cb: UpdateCallback): () => void {
  updateCallbacks.add(cb);
  if (isUpdatePending) {
    try {
      cb();
    } catch {
      // ignore
    }
  }
  return () => {
    updateCallbacks.delete(cb);
  };
}

export function isPWAUpdateAvailable(): boolean {
  return isUpdatePending;
}

export async function triggerPWARefresh(): Promise<void> {
  if (globalUpdateSW) {
    await globalUpdateSW(true);
  }
}

export function setupPWA(onNeedRefresh?: () => void) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // In iframe or sandboxed environments, Service Worker registration is blocked by browser policies
    const isIframe = window.self !== window.top;
    if (isIframe) {
      return () => Promise.resolve();
    }

    try {
      globalUpdateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          isUpdatePending = true;
          onNeedRefresh?.();
          updateCallbacks.forEach((cb) => {
            try {
              cb();
            } catch {
              // safe fallback
            }
          });
          window.dispatchEvent(new CustomEvent('app_update_available', { detail: { source: 'service_worker' } }));
        },
        onOfflineReady() {
          // Ready silently
        },
        onRegisterError() {
          // Handled silently to avoid polluting developer console
        },
      });

      return globalUpdateSW;
    } catch {
      return () => Promise.resolve();
    }
  }
  return () => Promise.resolve();
}

