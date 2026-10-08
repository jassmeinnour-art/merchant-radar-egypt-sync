import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../db';
import { UserActivityLog, UserActionType, UserActionSeverity } from '../types';

const LOCAL_STORAGE_KEY = 'merchant_radar_user_activity_logs_v1';

// Clean production state: No mock or fake user activity logs
const DEFAULT_INITIAL_LOGS: UserActivityLog[] = [];

export function getLocalCachedUserLogs(): UserActivityLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read cached user logs from localStorage:', err);
  }
  return DEFAULT_INITIAL_LOGS;
}

export function saveLocalCachedUserLogs(logs: UserActivityLog[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs.slice(0, 200)));
  } catch (err) {
    console.warn('Failed to save user logs to localStorage:', err);
  }
}

export interface LogUserActivityInput {
  actionType: UserActionType;
  actionTitle?: string;
  title?: string;
  details: string;
  platform?: string;
  status?: UserActionSeverity;
  metadata?: Record<string, any>;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Records a new user activity log entry to Firestore and local storage.
 */
export async function logUserActivity(input: LogUserActivityInput): Promise<UserActivityLog> {
  const currentUid = input.userId || auth.currentUser?.uid || 'guest-merchant';
  const email = input.userEmail || auth.currentUser?.email || 'guest@radar.eg';
  const name = input.userName || auth.currentUser?.displayName || 'تاجر رادار مصر';
  const actionTitle = input.actionTitle ?? input.title ?? 'إجراء مستخدم';

  const logId = `act-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const newLog: UserActivityLog = {
    id: logId,
    userId: currentUid,
    userEmail: email,
    userName: name,
    actionType: input.actionType,
    actionTitle,
    details: input.details,
    platform: input.platform || 'web',
    deviceInfo: typeof navigator !== 'undefined' ? `${navigator.userAgent.slice(0, 60)}` : 'Client Web',
    status: input.status || 'info',
    metadata: input.metadata,
    createdAt: nowIso,
  };

  // 1. Update local cache immediately
  const existing = getLocalCachedUserLogs();
  const updated = [newLog, ...existing.filter(item => item.id !== newLog.id)].slice(0, 200);
  saveLocalCachedUserLogs(updated);

  // 2. Dispatch custom event for real-time UI listening
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('merchant_user_activity_logged', { detail: newLog }));
  }

  // 3. Persist to Firestore if user is authenticated
  if (auth.currentUser && auth.currentUser.uid === currentUid) {
    const userLogPath = `users/${currentUid}/activity_logs`;
    try {
      const docRef = doc(db, userLogPath, logId);
      await setDoc(docRef, {
        ...newLog,
        firestoreCreatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Could not persist activity log to Firestore:', err);
      // Non-fatal: local cache is already saved
    }

    // Attempt top-level user_logs audit trail write
    try {
      const topRef = doc(db, 'user_logs', logId);
      await setDoc(topRef, {
        ...newLog,
        firestoreCreatedAt: serverTimestamp(),
      });
    } catch {
      // safe fallback if top-level write blocked
    }
  }

  return newLog;
}

/**
 * Subscribes to user activity logs from Firestore with fallback to localStorage.
 */
export function subscribeToUserLogs(
  userId: string | null | undefined,
  callback: (logs: UserActivityLog[]) => void
): () => void {
  // Always emit cached logs first
  callback(getLocalCachedUserLogs());

  if (!userId || !auth.currentUser) {
    // Listen to local window events
    const handleLocalLog = () => {
      callback(getLocalCachedUserLogs());
    };
    window.addEventListener('merchant_user_activity_logged', handleLocalLog);
    return () => {
      window.removeEventListener('merchant_user_activity_logged', handleLocalLog);
    };
  }

  const path = `users/${userId}/activity_logs`;
  try {
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: UserActivityLog[] = [];
          snapshot.forEach((snap) => {
            list.push(snap.data() as UserActivityLog);
          });
          saveLocalCachedUserLogs(list);
          callback(list);
        } else {
          callback(getLocalCachedUserLogs());
        }
      },
      (error) => {
        console.warn('Firestore activity log subscription error, using local logs:', error);
        callback(getLocalCachedUserLogs());
      }
    );

    return unsub;
  } catch (err) {
    console.warn('Failed to initialize Firestore listener for logs:', err);
    return () => {};
  }
}

/**
 * Clears all user activity logs locally and attempts Firestore deletion.
 */
export async function clearUserLogs(userId?: string): Promise<void> {
  const currentUid = userId || auth.currentUser?.uid;
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  
  if (currentUid && auth.currentUser) {
    const path = `users/${currentUid}/activity_logs`;
    try {
      const snap = await getDocs(collection(db, path));
      const deletes = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletes);
    } catch (err) {
      console.warn('Error clearing Firestore activity logs:', err);
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('merchant_user_activity_logged', { detail: null }));
  }
}

/**
 * Exports user activity logs to formatted Arabic CSV.
 */
export function exportUserLogsToCSV(logs: UserActivityLog[]): void {
  const BOM = '\uFEFF';
  const headers = [
    'معرف السجل',
    'التاريخ والوقت',
    'المستخدم',
    'البريد الإلكتروني',
    'نوع العملية',
    'عنوان الإجراء',
    'التفاصيل والوصف',
    'المنصة',
    'الحالة',
    'معلومات الجهاز',
  ];

  const rows = logs.map(log => [
    `"${log.id}"`,
    `"${new Date(log.createdAt).toLocaleString('ar-EG')}"`,
    `"${(log.userName || 'تاجر').replace(/"/g, '""')}"`,
    `"${(log.userEmail || '').replace(/"/g, '""')}"`,
    `"${log.actionType}"`,
    `"${(log.actionTitle || '').replace(/"/g, '""')}"`,
    `"${(log.details || '').replace(/"/g, '""')}"`,
    `"${log.platform || 'عام'}"`,
    `"${log.status === 'success' ? 'نجاح' : log.status === 'error' ? 'خطأ' : log.status === 'warning' ? 'تحذير' : 'معلومات'}"`,
    `"${(log.deviceInfo || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `سجل_نشاط_المستخدمين_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
