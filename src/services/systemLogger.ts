import { collection, addDoc, serverTimestamp, getDocs, updateDoc, deleteDoc, doc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';
export type ErrorStatus = 'new' | 'investigating' | 'resolved' | 'ignored';

export interface SystemErrorLog {
  id?: string;
  errorCode: string;
  timestamp: string; // ISO string
  createdAt?: any;
  severity: ErrorSeverity;
  status: ErrorStatus;
  
  // What caused it / error description
  errorMessage: string;
  errorName?: string;
  errorStack?: string;
  category?: 'ai' | 'network' | 'auth' | 'ui' | 'payment' | 'database' | 'system' | 'other';
  source: string; // Component or function name (e.g., 'AIAssistant', 'GlobalError', 'PaymentGateway')
  
  // Where it occurred
  pageUrl: string;
  pathname: string;
  
  // Who encountered it
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  
  // Environment / Client device
  userAgent?: string;
  browser?: string;
  os?: string;
  screenSize?: string;
  isOnline?: boolean;
  
  // Action context / extra data
  metadata?: Record<string, any>;
  adminNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// Memory cache for recent error hashes to prevent spam loops (e.g. infinite re-render errors)
const recentErrorSignatures = new Map<string, number>();

function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { browser: 'Server', os: 'Server', screenSize: 'N/A' };
  }

  const ua = navigator.userAgent;
  let browser = 'Bilinmeyen Tarayıcı';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Bilinmeyen İşletim Sistemi';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  const screenSize = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`;

  return { browser, os, screenSize, userAgent: ua, isOnline: navigator.onLine };
}

function generateErrorCode(prefix: string = 'ERR'): string {
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timePart}-${randomPart}`;
}

let activeUserContext: {
  uid?: string;
  name?: string;
  email?: string;
  role?: string;
} | null = null;

export const systemLogger = {
  /**
   * Set global active user context (called in AuthContext or app entry)
   */
  setUserContext(user: { uid?: string; name?: string; email?: string; role?: string } | null) {
    activeUserContext = user;
  },

  /**
   * Main error recording function
   */
  async logError(params: {
    message: string;
    error?: any;
    source: string;
    category?: 'ai' | 'network' | 'auth' | 'ui' | 'payment' | 'database' | 'system' | 'other';
    severity?: ErrorSeverity;
    pageUrl?: string;
    pathname?: string;
    user?: { uid?: string; name?: string; email?: string; role?: string };
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const {
        message,
        error,
        source,
        category = 'other',
        severity = 'error',
        pageUrl = typeof window !== 'undefined' ? window.location.href : '',
        pathname = typeof window !== 'undefined' ? window.location.pathname : '',
        user = activeUserContext,
        metadata = {}
      } = params;

      // Extract stack & name
      let errorStack = '';
      let errorName = '';
      if (error instanceof Error) {
        errorStack = error.stack || '';
        errorName = error.name || 'Error';
      } else if (typeof error === 'object' && error !== null) {
        errorStack = error.stack || JSON.stringify(error);
        errorName = error.name || 'UnknownError';
      }

      // Deduplication signature (prevent spamming same error in 5 seconds)
      const errorSignature = `${source}:${pathname}:${message}`;
      const now = Date.now();
      const lastLogged = recentErrorSignatures.get(errorSignature);
      if (lastLogged && now - lastLogged < 5000) {
        // Return existing code without flooding
        return 'ERR-DEDUP';
      }
      recentErrorSignatures.set(errorSignature, now);

      // Clean old signatures
      if (recentErrorSignatures.size > 200) {
        recentErrorSignatures.clear();
      }

      const errorCode = generateErrorCode(severity === 'critical' ? 'CRIT' : 'ERR');
      const deviceInfo = getDeviceInfo();

      const logEntry: SystemErrorLog = {
        errorCode,
        timestamp: new Date().toISOString(),
        severity,
        status: 'new',
        errorMessage: message || 'Bilinmeyen sistem hatası',
        errorName: errorName || 'SystemError',
        errorStack,
        category,
        source,
        pageUrl,
        pathname,
        userId: user?.uid || 'anonymous',
        userName: user?.name || 'Misafir Kullanıcı',
        userEmail: user?.email || '',
        userRole: user?.role || 'guest',
        ...deviceInfo,
        metadata
      };

      // 1. Direct Firestore write (primary real-time database)
      let directWriteSuccess = false;
      try {
        if (db) {
          await addDoc(collection(db, 'system_error_logs'), {
            ...logEntry,
            createdAt: serverTimestamp()
          });
          directWriteSuccess = true;
        }
      } catch (fErr) {
        // Fallback to backend telemetry below
      }

      // 2. Fallback / Server-side Telemetry API call (guarantees write with admin privileges if client direct write fails)
      if (!directWriteSuccess) {
        try {
          fetch('/api/log-system-error', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
          }).catch(() => {});
        } catch {
          // silently ignore telemetry fetch issues
        }
      }

      return errorCode;
    } catch (unexpectedLoggerErr) {
      console.error('[SystemLogger] Critical logger error:', unexpectedLoggerErr);
      return 'ERR-LOG-FAIL';
    }
  },

  /**
   * Log a warning (non-fatal issue or unexpected response)
   */
  async logWarning(source: string, message: string, metadata?: Record<string, any>) {
    return this.logError({
      source,
      message,
      severity: 'warning',
      metadata
    });
  },

  /**
   * Log critical crash (e.g. React ErrorBoundary catch)
   */
  async logCrash(source: string, error: any, metadata?: Record<string, any>) {
    return this.logError({
      source,
      message: error?.message || 'Sayfa çökmesi / Kritik bileşen hatası',
      error,
      severity: 'critical',
      category: 'ui',
      metadata
    });
  },

  /**
   * Update error status (e.g. 'resolved', 'investigating')
   */
  async updateErrorStatus(logId: string, status: ErrorStatus, adminNotes?: string, adminName?: string) {
    if (!logId) return;
    
    // Try direct Firestore update
    try {
      if (db) {
        const docRef = doc(db, 'system_error_logs', logId);
        const updates: any = {
          status
        };
        if (adminNotes !== undefined) {
          updates.adminNotes = adminNotes;
        }
        if (status === 'resolved') {
          updates.resolvedAt = new Date().toISOString();
          updates.resolvedBy = adminName || 'Yönetici';
        }
        await updateDoc(docRef, updates);
        return;
      }
    } catch {
      // fallback to server endpoint
    }

    // Server-side fallback with admin privileges
    await fetch('/api/admin/system-error-logs/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId, status, adminNotes, adminName })
    });
  },

  /**
   * Delete error log
   */
  async deleteLog(logId: string) {
    if (!logId) return;

    // Try direct Firestore delete
    try {
      if (db) {
        const docRef = doc(db, 'system_error_logs', logId);
        await deleteDoc(docRef);
        return;
      }
    } catch {
      // fallback to server endpoint
    }

    // Server-side fallback with admin privileges
    await fetch('/api/admin/system-error-logs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logId })
    });
  },

  /**
   * Initialize safe global window error listeners
   */
  initGlobalListeners() {
    if (typeof window === 'undefined') return;

    // Window unhandled errors (syntax, runtime script errors)
    window.addEventListener('error', (event) => {
      // Ignore cross-origin script error noise or extensions
      if (event.filename && (event.filename.includes('extensions::') || event.filename.includes('chrome-extension:'))) {
        return;
      }
      
      const message = event.message || 'Bilinmeyen runtime script hatası';
      systemLogger.logError({
        source: 'WindowRuntimeError',
        message,
        error: event.error || { message: event.message, filename: event.filename, lineno: event.lineno, colno: event.colno },
        category: 'system',
        severity: 'error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Window unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let message = 'İşlenmemiş Promise reddi';
      if (typeof reason === 'string') {
        message = reason;
      } else if (reason?.message) {
        message = reason.message;
      }

      systemLogger.logError({
        source: 'UnhandledPromiseRejection',
        message,
        error: reason,
        category: 'network',
        severity: 'warning'
      });
    });
  }
};
