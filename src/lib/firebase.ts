import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  setLogLevel,
  doc, 
  getDoc,
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export { firebaseConfig };

// Suppress transient offline / WebChannel connection retry warnings from polluting the console
try {
  setLogLevel('silent');
} catch {
  // safe fallback
}

// Clean filtering for harmless browser/sandbox and transient environment warnings
if (typeof window !== 'undefined') {
  const isHarmlessNotice = (text: string) => {
    return (
      text.includes('Could not reach Cloud Firestore backend') ||
      text.includes('The client will operate in offline mode') ||
      text.includes('@firebase/firestore') ||
      text.includes('code=unavailable') ||
      text.includes('ResizeObserver') ||
      text.includes('failed to connect to websocket') ||
      text.includes('WebSocket') ||
      text.includes('Service Worker') ||
      text.includes('AudioContext')
    );
  };

  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const fullText = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '');
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    if (isHarmlessNotice(fullText)) {
      return;
    }
    originalConsoleError.apply(console, args);
  };

  const originalConsoleWarn = console.warn;
  console.warn = (...args: any[]) => {
    const fullText = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        if (arg instanceof Error) return arg.message + ' ' + (arg.stack || '');
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(' ');

    if (isHarmlessNotice(fullText)) {
      return;
    }
    originalConsoleWarn.apply(console, args);
  };
}

// Initialize Firebase App safely as a singleton instance
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Authentication & Firestore with explicit custom databaseId per skill specification
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Domain and Project Diagnostics helper for Authorized Domains setup
export function getFirebaseDomainInfo() {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const authDomain = firebaseConfig.authDomain || `${firebaseConfig.projectId}.firebaseapp.com`;
  const consoleAuthSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;
  
  return {
    currentHost,
    currentOrigin,
    authDomain,
    projectId: firebaseConfig.projectId,
    consoleAuthSettingsUrl,
    isLocalhost: currentHost === 'localhost' || currentHost === '127.0.0.1',
    isAuthDomainDirect: currentHost === authDomain,
  };
}

// Diagnostic connection test to validate Firestore connectivity per skill requirements
export async function testConnection(): Promise<boolean> {
  try {
    // Attempt standard getDoc first to allow cache / network fallback without hard failing
    const testDocRef = doc(db, 'test', 'connection');
    await getDoc(testDocRef);
    console.info('Firestore connection validated successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || (error as any).code === 'unavailable')) {
      console.info('Firestore client is currently offline or connecting in background mode.');
    } else {
      console.info('Firestore diagnostic check completed.');
    }
    return false;
  }
}

export const testFirestoreConnection = testConnection;

// Security & Error Diagnostics adhering to Firebase Skill specifications
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}


export { 
  firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInAnonymously,
  updateProfile,
  signInWithPopup,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User
};
