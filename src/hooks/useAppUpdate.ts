import { useState, useEffect, useCallback, useRef } from 'react';
import { onPWAUpdateAvailable, triggerPWARefresh, isPWAUpdateAvailable } from '../pwaRegister';

export interface AppUpdateState {
  hasUpdate: boolean;
  isChecking: boolean;
  isUpdating: boolean;
  updateSource: 'service_worker' | 'server_build' | 'manual' | null;
  currentVersion: string;
  serverVersion: string | null;
  lastChecked: Date | null;
  isBannerDismissed: boolean;
  dismissBanner: () => void;
  reopenBanner: () => void;
  checkForUpdates: (isManual?: boolean) => Promise<boolean>;
  applyUpdate: () => Promise<void>;
}

const CLIENT_VERSION = '2.5.0';
const BOOT_TIME_STORAGE_KEY = 'merchant_radar_server_boot_time';
const DISMISSED_SESSION_KEY = 'merchant_radar_update_banner_dismissed';

export function useAppUpdate(onShowToast?: (msg: string) => void): AppUpdateState {
  const [hasUpdate, setHasUpdate] = useState<boolean>(() => isPWAUpdateAvailable());
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateSource, setUpdateSource] = useState<'service_worker' | 'server_build' | 'manual' | null>(
    isPWAUpdateAvailable() ? 'service_worker' : null
  );
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISSED_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const initialBootTimeRef = useRef<number | null>(null);

  // Check server version & build timestamp endpoint
  const checkServerVersion = useCallback(async (isManual = false): Promise<boolean> => {
    try {
      const response = await fetch(`/api/app-version?_t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) return false;
      const data = await response.json();
      setLastChecked(new Date());

      if (data && data.success) {
        setServerVersion(data.version || CLIENT_VERSION);

        // First time loading - capture current server boot time
        if (initialBootTimeRef.current === null) {
          const storedBootTime = sessionStorage.getItem(BOOT_TIME_STORAGE_KEY);
          if (storedBootTime) {
            initialBootTimeRef.current = Number(storedBootTime);
          } else {
            initialBootTimeRef.current = data.bootTime;
            sessionStorage.setItem(BOOT_TIME_STORAGE_KEY, String(data.bootTime));
          }
        }

        // If server was restarted with new code/build (in Google AI Studio or deployment)
        if (initialBootTimeRef.current && data.bootTime && data.bootTime !== initialBootTimeRef.current) {
          setHasUpdate(true);
          setUpdateSource('server_build');
          setIsBannerDismissed(false);
          try {
            sessionStorage.removeItem(DISMISSED_SESSION_KEY);
          } catch {
            // ignore
          }
          if (isManual) {
            onShowToast?.('تم اكتشاف إصدار وتحديث جديد متاح للمشروع! 🚀');
          }
          return true;
        }

        // If version tag changed
        if (data.version && data.version !== CLIENT_VERSION) {
          setHasUpdate(true);
          setUpdateSource('server_build');
          setIsBannerDismissed(false);
          if (isManual) {
            onShowToast?.('تم اكتشاف إصدار أحدث للمنصة! 🚀');
          }
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  }, [onShowToast]);

  // Comprehensive check for updates (Service Worker + Server Endpoint)
  const checkForUpdates = useCallback(async (isManual = false): Promise<boolean> => {
    setIsChecking(true);
    let found = false;

    // 1. Check Service Worker registration update (only if not in iframe)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && window.self === window.top) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          if (registration.waiting) {
            setHasUpdate(true);
            setUpdateSource('service_worker');
            setIsBannerDismissed(false);
            found = true;
          }
        }
      } catch {
        // Safe silent fallback in restricted environments
      }
    }

    // 2. Check Server Version endpoint
    const serverHasUpdate = await checkServerVersion(isManual);
    found = found || serverHasUpdate;

    setIsChecking(false);

    if (isManual && !found && !hasUpdate) {
      onShowToast?.('أنت تستخدم بالفعل أحدث إصدار من رادار التاجر الذكي ✓');
    }

    return found || hasUpdate;
  }, [checkServerVersion, hasUpdate, onShowToast]);

  // Apply update, purge old caches, and reload cleanly
  const applyUpdate = useCallback(async () => {
    setIsUpdating(true);
    onShowToast?.('جاري تفريغ الذاكرة المؤقتة (Cache) وتحميل التحديث الجديد... ⚡');

    try {
      // 1. Trigger Vite PWA service worker refresh (skipWaiting)
      await triggerPWARefresh();

      // 2. Unregister older service workers to ensure zero stale proxying
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
          // Also unregister existing registrations
          await reg.unregister();
        }
      }

      // 3. Clear CacheStorage (purges all cached chunks, css, html, images)
      if (typeof window !== 'undefined' && 'caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((name) => window.caches.delete(name)));
      }

      // 4. Update session storage boot time with current timestamp
      try {
        sessionStorage.removeItem(BOOT_TIME_STORAGE_KEY);
        sessionStorage.removeItem(DISMISSED_SESSION_KEY);
      } catch {
        // ignore
      }

      // 5. Short pause to allow unregistration to settle smoothly
      await new Promise((r) => setTimeout(r, 600));

      // 6. Hard reload with cache-busting timestamp parameter
      const updateTimestamp = Date.now();
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('v', updateTimestamp.toString());
      window.location.replace(currentUrl.toString());
    } catch (error) {
      console.error('Error while applying update:', error);
      // Fallback reload
      window.location.reload();
    }
  }, [onShowToast]);

  // Dismiss update banner for this session
  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      sessionStorage.setItem(DISMISSED_SESSION_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const reopenBanner = useCallback(() => {
    setIsBannerDismissed(false);
    try {
      sessionStorage.removeItem(DISMISSED_SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Listen for PWA service worker update event & window custom events
  useEffect(() => {
    const cleanup = onPWAUpdateAvailable(() => {
      setHasUpdate(true);
      setUpdateSource('service_worker');
      setIsBannerDismissed(false);
    });

    const handleCustomUpdateEvent = (e: any) => {
      setHasUpdate(true);
      setUpdateSource(e.detail?.source || 'service_worker');
      setIsBannerDismissed(false);
    };

    window.addEventListener('app_update_available', handleCustomUpdateEvent);

    // Initial check on mount
    checkServerVersion(false);

    // Check on window focus and visibilitychange (e.g. user returns to tab after making edits in Google Studio)
    const handleFocus = () => {
      checkServerVersion(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkServerVersion(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check every 25 seconds for live studio changes
    const intervalId = setInterval(() => {
      checkServerVersion(false);
    }, 25000);

    return () => {
      cleanup();
      window.removeEventListener('app_update_available', handleCustomUpdateEvent);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [checkServerVersion]);

  return {
    hasUpdate,
    isChecking,
    isUpdating,
    updateSource,
    currentVersion: CLIENT_VERSION,
    serverVersion,
    lastChecked,
    isBannerDismissed,
    dismissBanner,
    reopenBanner,
    checkForUpdates,
    applyUpdate,
  };
}
