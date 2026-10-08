import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export const OWNER_EMAIL = 'jassmeinnour@gmail.com';
export const OWNER_DEBUG_LOGS_COLLECTION = 'owner_debug_logs';
const STORAGE_KEY_OWNER_DEBUG_LOGS = 'merchant_radar_owner_debug_logs_v1';

export type OwnerDebugLogType =
  | 'console_error'
  | 'console_warn'
  | 'api_failure'
  | 'runtime_exception'
  | 'unhandled_rejection'
  | 'state_snapshot'
  | 'manual_diagnostic';

export type OwnerDebugSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface OwnerDebugLogEntry {
  id: string;
  ownerEmail: string;
  ownerUid?: string;
  logType: OwnerDebugLogType;
  severity: OwnerDebugSeverity;
  message: string;
  stackOrDetails?: string;
  affectedComponent?: string;
  activeTab?: string;
  appStateSnapshot?: string;
  userAgent?: string;
  url?: string;
  createdAt: string;
}

export interface RecordOwnerDebugLogInput {
  logType: OwnerDebugLogType;
  severity?: OwnerDebugSeverity;
  message: string;
  stackOrDetails?: string;
  affectedComponent?: string;
  activeTab?: string;
  appStateSnapshot?: string;
  ownerEmail?: string;
  ownerUid?: string;
}

export interface AppRuntimeDiagnosticsContext {
  activeTab: string;
  activeTabLabel?: string;
  currentProductTitle?: string;
  currentProductId?: string;
  activeMerchantId?: string;
  activeMerchantName?: string;
  connectedPlatformsCount?: number;
  totalPlatformsCount?: number;
  errorPlatformsCount?: number;
  unresolvedApiErrorsCount?: number;
  isDbConnected?: boolean;
  userEmail?: string;
  userUid?: string;
}

// Keep current app runtime context updated for automatic captures
let currentRuntimeContext: AppRuntimeDiagnosticsContext = {
  activeTab: 'radar',
};

export function updateOwnerDiagnosticsRuntimeContext(ctx: Partial<AppRuntimeDiagnosticsContext>): void {
  currentRuntimeContext = {
    ...currentRuntimeContext,
    ...ctx,
  };
}

export function getOwnerDiagnosticsRuntimeContext(): AppRuntimeDiagnosticsContext {
  return currentRuntimeContext;
}

// Map active tab to affected component file path in codebase for AI Studio prompt
export const TAB_TO_COMPONENT_FILE_MAP: Record<string, string> = {
  radar: 'src/App.tsx & src/components/CompetitorRadar.tsx',
  order_fulfillment: 'src/components/OrderFulfillmentTracker.tsx',
  admin_error_logs: 'src/components/AdminApiErrorDashboard.tsx & src/services/apiErrorLoggingService.ts',
  user_logs: 'src/components/UserLogsManager.tsx & src/services/userLogsService.ts',
  remote_merchants: 'src/components/RemoteMerchantsManager.tsx',
  sales_dashboard: 'src/components/SalesDashboard.tsx',
  archived_products: 'src/components/ArchivedProductsVault.tsx',
  platform_commissions: 'src/components/PlatformCommissionCalculator.tsx',
  seasonal_forecast: 'src/components/SeasonalDemandForecast.tsx',
  market_trends: 'src/components/MarketTrendsRadar.tsx',
  order_scheduling: 'src/components/OrderSchedulingWaybills.tsx',
  pricing_guardrails: 'src/components/PricingGuardrailsManager.tsx',
  marketer_hub: 'src/components/MarketerRbacAndAuditHub.tsx',
  profit_simulator: 'src/components/ProfitProjectionSimulator.tsx',
  periodic_reports: 'src/components/PeriodicPerformanceReports.tsx',
  bulk_repricing: 'src/components/BulkPriceUpdateManager.tsx',
  watchlist: 'src/components/WatchlistManager.tsx',
  wishlist: 'src/components/WishlistManager.tsx & src/services/wishlistService.ts',
  seo_keywords: 'src/components/SeoKeywordIntelligence.tsx',
  seo_listing: 'src/components/PlatformListingGenerator.tsx',
  image_studio: 'src/components/MerchantImageStudio.tsx',
  inventory: 'src/components/InventoryTracker.tsx',
  suppliers_hub: 'src/components/FurnitureSuppliersHub.tsx',
  wholesale: 'src/components/EgyptWholesaleLocations.tsx',
  price_alerts: 'src/components/PriceAlertManager.tsx',
  platforms_guide: 'src/components/PlatformsOnboardingGuide.tsx',
};

export function inferAffectedComponentFromStackOrTab(stack?: string, activeTab?: string): string {
  if (stack) {
    const fileMatch = stack.match(/src\/[a-zA-Z0-9_/.-]+\.(tsx|ts)/);
    if (fileMatch && fileMatch[0]) {
      return fileMatch[0];
    }
  }
  const tab = activeTab || currentRuntimeContext.activeTab || 'radar';
  return TAB_TO_COMPONENT_FILE_MAP[tab] || `src/App.tsx (Tab: ${tab})`;
}

export function loadLocalOwnerDebugLogs(): OwnerDebugLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OWNER_DEBUG_LOGS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalOwnerDebugLogs(logs: OwnerDebugLogEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_OWNER_DEBUG_LOGS, JSON.stringify(logs.slice(0, 120)));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Checks whether the currently active user/session belongs to the App Owner (jassmeinnour@gmail.com)
 */
export function isCurrentSessionOwner(explicitEmail?: string | null): boolean {
  const emailToCheck = (
    explicitEmail ||
    currentRuntimeContext.userEmail ||
    auth.currentUser?.email ||
    ''
  )
    .trim()
    .toLowerCase();
  return emailToCheck === OWNER_EMAIL;
}

/**
 * Saves a debug log entry to local cache and to the Firestore `owner_debug_logs` collection
 */
export async function recordOwnerDebugLog(
  input: RecordOwnerDebugLogInput
): Promise<OwnerDebugLogEntry | null> {
  const now = new Date().toISOString();
  const safeId = `odbg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const effectiveEmail = (
    input.ownerEmail ||
    currentRuntimeContext.userEmail ||
    auth.currentUser?.email ||
    OWNER_EMAIL
  )
    .trim()
    .toLowerCase();

  const activeTab = (input.activeTab || currentRuntimeContext.activeTab || 'radar').slice(0, 100);
  const affectedComponent = (
    input.affectedComponent ||
    inferAffectedComponentFromStackOrTab(input.stackOrDetails, activeTab)
  ).slice(0, 300);

  let stateSnapStr = input.appStateSnapshot;
  if (!stateSnapStr) {
    try {
      stateSnapStr = JSON.stringify(
        {
          ...currentRuntimeContext,
          viewport:
            typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
          online: typeof navigator !== 'undefined' ? navigator.onLine : true,
          capturedAt: now,
        },
        null,
        2
      );
    } catch {
      stateSnapStr = '{}';
    }
  }

  const entry: OwnerDebugLogEntry = {
    id: safeId,
    ownerEmail: OWNER_EMAIL,
    ownerUid: (input.ownerUid || currentRuntimeContext.userUid || auth.currentUser?.uid || 'owner_session').slice(
      0,
      128
    ),
    logType: input.logType,
    severity: input.severity || (input.logType === 'console_warn' ? 'medium' : 'high'),
    message: (input.message || 'Unspecified diagnostic event').slice(0, 3900),
    stackOrDetails: input.stackOrDetails ? input.stackOrDetails.slice(0, 9500) : undefined,
    affectedComponent,
    activeTab,
    appStateSnapshot: stateSnapStr ? stateSnapStr.slice(0, 9500) : undefined,
    userAgent:
      typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 480) : 'Browser Client',
    url: typeof window !== 'undefined' ? window.location.href.slice(0, 950) : '',
    createdAt: now,
  };

  // 1. Update local cache immediately
  const existing = loadLocalOwnerDebugLogs();
  const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, 120);
  saveLocalOwnerDebugLogs(updated);

  // Notify UI listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('owner_debug_log_recorded', {
        detail: entry,
      })
    );
  }

  // 2. Persist to Firestore `owner_debug_logs` collection if owner is active
  if (effectiveEmail === OWNER_EMAIL) {
    const path = `${OWNER_DEBUG_LOGS_COLLECTION}/${entry.id}`;
    try {
      const docRef = doc(db, OWNER_DEBUG_LOGS_COLLECTION, entry.id);
      const firestorePayload: Record<string, any> = {
        id: entry.id,
        ownerEmail: OWNER_EMAIL,
        ownerUid: entry.ownerUid || 'owner_session',
        logType: entry.logType,
        severity: entry.severity,
        message: entry.message,
        affectedComponent: entry.affectedComponent || 'src/App.tsx',
        activeTab: entry.activeTab || 'radar',
        userAgent: entry.userAgent || 'Browser',
        url: entry.url || '',
        createdAt: entry.createdAt,
      };
      if (entry.stackOrDetails) {
        firestorePayload.stackOrDetails = entry.stackOrDetails;
      }
      if (entry.appStateSnapshot) {
        firestorePayload.appStateSnapshot = entry.appStateSnapshot;
      }

      await setDoc(docRef, firestorePayload);
    } catch (err) {
      try {
        handleFirestoreError(err, OperationType.WRITE, path);
      } catch {
        // Logged via handleFirestoreError
      }
    }
  }

  return entry;
}

/**
 * Real-time subscription to `owner_debug_logs` in Firebase Firestore
 */
export function subscribeToOwnerDebugLogs(
  onUpdate: (logs: OwnerDebugLogEntry[]) => void
): () => void {
  const initialLocal = loadLocalOwnerDebugLogs();
  onUpdate(initialLocal);

  const handleLocalEvent = () => {
    onUpdate(loadLocalOwnerDebugLogs());
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('owner_debug_log_recorded', handleLocalEvent);
  }

  try {
    const q = query(
      collection(db, OWNER_DEBUG_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(60)
    );

    const unsubscribeSnapshot = onSnapshot(
      q,
      (snapshot) => {
        const cloudLogs: OwnerDebugLogEntry[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as OwnerDebugLogEntry;
          if (data && data.id) {
            cloudLogs.push(data);
          }
        });

        const localLogs = loadLocalOwnerDebugLogs();
        const mergedMap = new Map<string, OwnerDebugLogEntry>();

        cloudLogs.forEach((item) => mergedMap.set(item.id, item));
        localLogs.forEach((item) => {
          if (!mergedMap.has(item.id)) {
            mergedMap.set(item.id, item);
          }
        });

        const merged = Array.from(mergedMap.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 120);

        saveLocalOwnerDebugLogs(merged);
        onUpdate(merged);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, OWNER_DEBUG_LOGS_COLLECTION);
        } catch {
          // Fallback to local logs if offline
        }
        onUpdate(loadLocalOwnerDebugLogs());
      }
    );

    return () => {
      unsubscribeSnapshot();
      if (typeof window !== 'undefined') {
        window.removeEventListener('owner_debug_log_recorded', handleLocalEvent);
      }
    };
  } catch {
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('owner_debug_log_recorded', handleLocalEvent);
      }
    };
  }
}

/**
 * Deletes a single debug log from Firestore `owner_debug_logs` and local cache
 */
export async function deleteOwnerDebugLog(logId: string): Promise<boolean> {
  const current = loadLocalOwnerDebugLogs().filter((l) => l.id !== logId);
  saveLocalOwnerDebugLogs(current);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('owner_debug_log_recorded'));
  }

  try {
    const docRef = doc(db, OWNER_DEBUG_LOGS_COLLECTION, logId);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    try {
      handleFirestoreError(err, OperationType.DELETE, `${OWNER_DEBUG_LOGS_COLLECTION}/${logId}`);
    } catch {
      // handled
    }
    return false;
  }
}

/**
 * Clears all owner debug logs from local cache and Firestore
 */
export async function clearAllOwnerDebugLogs(logsToDelete: OwnerDebugLogEntry[]): Promise<void> {
  saveLocalOwnerDebugLogs([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('owner_debug_log_recorded'));
  }

  for (const item of logsToDelete.slice(0, 30)) {
    try {
      await deleteDoc(doc(db, OWNER_DEBUG_LOGS_COLLECTION, item.id));
    } catch {
      // continue
    }
  }
}

// Singleton guard so global interceptors are installed only once
let interceptorsInstalled = false;
let isInternalLogging = false;

/**
 * Installs automatic browser diagnostics interceptors for Console Errors,
 * Failed Fetch/API Responses, Unhandled Promise Rejections, and Runtime Errors.
 */
export function installOwnerDiagnosticsInterceptors(): void {
  if (typeof window === 'undefined' || interceptorsInstalled) return;
  interceptorsInstalled = true;

  const isIgnoredNoise = (msg: string): boolean => {
    return (
      msg.includes('ResizeObserver') ||
      msg.includes('Could not reach Cloud Firestore backend') ||
      msg.includes('The client will operate in offline mode') ||
      msg.includes('failed to connect to websocket') ||
      msg.includes('WebSocket') ||
      msg.includes('AudioContext') ||
      msg.includes('owner_debug_logs')
    );
  };

  // 1. Intercept console.error
  const prevConsoleError = console.error;
  console.error = (...args: any[]) => {
    prevConsoleError.apply(console, args);
    if (isInternalLogging || !isCurrentSessionOwner()) return;

    try {
      isInternalLogging = true;
      const text = args
        .map((a) => {
          if (typeof a === 'string') return a;
          if (a instanceof Error) return `${a.name}: ${a.message}`;
          try {
            return JSON.stringify(a);
          } catch {
            return String(a);
          }
        })
        .join(' ');

      if (!text || isIgnoredNoise(text)) return;

      const firstErr = args.find((a) => a instanceof Error) as Error | undefined;
      const stack = firstErr?.stack || new Error().stack || '';

      recordOwnerDebugLog({
        logType: 'console_error',
        severity: 'high',
        message: text.slice(0, 2000),
        stackOrDetails: stack,
      }).catch(() => {});
    } finally {
      isInternalLogging = false;
    }
  };

  // 2. Intercept failed fetch / API responses
  const prevFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const startMs = performance.now();
    const urlStr =
      typeof input === 'string'
        ? input
        : input instanceof URL
        ? input.toString()
        : input?.url || '';
    const method = init?.method || 'GET';

    try {
      const response = await prevFetch(input, init);
      if (!response.ok && isCurrentSessionOwner() && !urlStr.includes('firestore.googleapis.com')) {
        const elapsed = Math.round(performance.now() - startMs);
        let bodyPreview = '';
        try {
          const cloned = response.clone();
          bodyPreview = (await cloned.text()).slice(0, 1500);
        } catch {
          bodyPreview = '';
        }

        recordOwnerDebugLog({
          logType: 'api_failure',
          severity: response.status >= 500 ? 'critical' : 'high',
          message: `HTTP ${response.status} (${response.statusText || 'Failed'}) on ${method} ${urlStr}`,
          stackOrDetails: JSON.stringify(
            {
              endpoint: urlStr,
              method,
              status: response.status,
              statusText: response.statusText,
              durationMs: elapsed,
              responsePreview: bodyPreview,
            },
            null,
            2
          ),
        }).catch(() => {});
      }
      return response;
    } catch (fetchErr: any) {
      if (isCurrentSessionOwner() && !urlStr.includes('firestore.googleapis.com')) {
        const elapsed = Math.round(performance.now() - startMs);
        recordOwnerDebugLog({
          logType: 'api_failure',
          severity: 'critical',
          message: `Network / Fetch Failure on ${method} ${urlStr}: ${fetchErr?.message || String(fetchErr)}`,
          stackOrDetails: JSON.stringify(
            {
              endpoint: urlStr,
              method,
              durationMs: elapsed,
              error: fetchErr?.message || String(fetchErr),
              stack: fetchErr?.stack,
            },
            null,
            2
          ),
        }).catch(() => {});
      }
      throw fetchErr;
    }
  };

  // 3. Listen to platform API sync error events from apiErrorLoggingService
  window.addEventListener('merchant_api_sync_error_recorded', (ev: any) => {
    if (!isCurrentSessionOwner()) return;
    const item = ev?.detail;
    if (!item) return;

    recordOwnerDebugLog({
      logType: 'api_failure',
      severity: item.severity === 'critical' ? 'critical' : 'high',
      message: `[${item.platformName || item.platform}] ${item.errorCode}: ${item.errorMessage}`,
      stackOrDetails: item.errorDetails || `Endpoint: ${item.endpoint}`,
      affectedComponent: 'src/services/apiErrorLoggingService.ts',
    }).catch(() => {});
  });

  // 4. Listen to runtime window errors & unhandled rejections
  window.addEventListener('error', (event: ErrorEvent) => {
    if (!isCurrentSessionOwner()) return;
    const msg = String(event.error?.message || event.message || '');
    if (!msg || isIgnoredNoise(msg)) return;

    recordOwnerDebugLog({
      logType: 'runtime_exception',
      severity: 'critical',
      message: msg,
      stackOrDetails:
        event.error?.stack || `File: ${event.filename || 'unknown'}:${event.lineno || 0}:${event.colno || 0}`,
    }).catch(() => {});
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (!isCurrentSessionOwner()) return;
    const reason = event.reason;
    const msg = String(reason?.message || reason || '');
    if (!msg || isIgnoredNoise(msg)) return;

    recordOwnerDebugLog({
      logType: 'unhandled_rejection',
      severity: 'high',
      message: `Unhandled Promise Rejection: ${msg}`,
      stackOrDetails: reason?.stack || String(reason),
    }).catch(() => {});
  });
}

/**
 * Generates a ready-to-copy Markdown diagnostic report tailored for Google AI Studio
 */
export function generateAiStudioDebugPrompt(params: {
  logs: OwnerDebugLogEntry[];
  apiErrorsCount: number;
  selectedLog?: OwnerDebugLogEntry | null;
  customOwnerNote?: string;
}): string {
  const ctx = getOwnerDiagnosticsRuntimeContext();
  const nowReadable = new Date().toLocaleString('ar-EG');
  const recentLogs = params.selectedLog ? [params.selectedLog] : params.logs.slice(0, 6);
  const primaryComponent =
    params.selectedLog?.affectedComponent ||
    inferAffectedComponentFromStackOrTab(undefined, ctx.activeTab);

  const logsFormatted =
    recentLogs.length > 0
      ? recentLogs
          .map(
            (l, idx) =>
              `### [${idx + 1}] ${l.logType.toUpperCase()} (${l.severity.toUpperCase()}) - ${new Date(
                l.createdAt
              ).toLocaleTimeString('ar-EG')}
- **الرسالة (Message):** \`${l.message}\`
- **المكون / الملف المتأثر (Affected Code):** \`${l.affectedComponent || primaryComponent}\`
- **الشاشة النشطة (Active Tab):** \`${l.activeTab || ctx.activeTab}\`
${
  l.stackOrDetails
    ? `- **التفاصيل التقنية / Stack Trace:**\n\`\`\`json\n${l.stackOrDetails.slice(0, 1200)}\n\`\`\``
    : ''
}`
          )
          .join('\n\n')
      : `- لا توجد أخطاء حرجة مسجلة حالياً في الـ Console (النظام في حالة استقرار، فحص تشخيصي وقائي).`;

  return `# 🛠️ تقرير تشخيص فوري لـ Google AI Studio — رادار التاجر الذكي مصر (Merchant Radar Egypt)

يرجى فحص وتحليل تقرير التشخيص التالي الملتقط تلقائياً من حساب مالكة التطبيق (\`${OWNER_EMAIL}\`) وتوليد الحل البرمجي المباشر في الكود:

${params.customOwnerNote ? `## 📝 ملاحظة وطلب مالكة التطبيق:\n> ${params.customOwnerNote}\n` : ''}
## 1. الكود والملفات المتأثرة (Affected Code & ComponentContext)
- **الملف / المكون المتأثر الرئيسي:** \`${primaryComponent}\`
- **التبويب النشط حالياً (Active Tab):** \`${ctx.activeTab}\` (${ctx.activeTabLabel || 'لوحة الرادار'})
- **المنتج النشط حالياً:** \`${ctx.currentProductTitle || 'غير محدد'}\` (ID: \`${ctx.currentProductId || 'N/A'}\`)
- **المتجر النشط (Active Merchant):** \`${ctx.activeMerchantName || 'المتجر الرئيسي'}\` (\`${ctx.activeMerchantId || 'default'}\`)

## 2. أحدث الأخطاء الملتقطة والاستجابات الفاشلة (Captured Console & API Errors)
${logsFormatted}

## 3. حالة التطبيق اللحظية (Current Application State Dump)
\`\`\`json
${JSON.stringify(
  {
    timestamp: nowReadable,
    ownerEmail: OWNER_EMAIL,
    activeTab: ctx.activeTab,
    firebaseFirestoreConnected: ctx.isDbConnected,
    connectedPlatforms: `${ctx.connectedPlatformsCount ?? 0}/${ctx.totalPlatformsCount ?? 0}`,
    platformsWithSyncErrors: ctx.errorPlatformsCount ?? 0,
    unresolvedApiSyncErrors: params.apiErrorsCount,
    totalOwnerDebugLogsInFirestore: params.logs.length,
    url: typeof window !== 'undefined' ? window.location.href : '',
    viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  },
  null,
  2
)}
\`\`\`

## 4. المطلوب من Google AI Studio:
1. تحليل السبب الجذري (Root Cause) للخطأ أو الاستجابة الفاشلة الموضحة أعلاه في \`${primaryComponent}\`.
2. تطبيق التعديل البرمجي اللازم مباشرة مع الحفاظ على استقرار باقي المكونات وقواعد \`firestore.rules\`.`;
}
