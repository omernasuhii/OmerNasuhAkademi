import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UserPresenceData {
  isOnline?: boolean;
  lastSeenAt?: any;
  lastLoginAt?: any;
  [key: string]: any;
}

let heartbeatInterval: any = null;
let currentUserId: string | null = null;

export const presenceService = {
  /**
   * Send presence update to Firestore
   */
  updatePresence: async (userId: string, isOnline: boolean) => {
    if (!userId) return;
    try {
      await setDoc(
        doc(db, 'users', userId),
        {
          isOnline,
          lastSeenAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      console.warn('[Presence] Update presence error:', err);
    }
  },

  /**
   * Start automatic real-time presence tracking heartbeat
   */
  startTracker: (userId: string) => {
    if (!userId) return () => {};

    // Stop existing tracker if any
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }

    currentUserId = userId;

    // Send immediate online signal
    presenceService.updatePresence(userId, true);

    // Heartbeat every 30 seconds while page is active
    heartbeatInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        presenceService.updatePresence(userId, true);
      }
    }, 30000);

    // Event handlers for tab focus/blur/visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        presenceService.updatePresence(userId, true);
      } else {
        presenceService.updatePresence(userId, false);
      }
    };

    const handleFocus = () => {
      presenceService.updatePresence(userId, true);
    };

    const handlePageHide = () => {
      presenceService.updatePresence(userId, false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handlePageHide);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handlePageHide);
      window.removeEventListener('pagehide', handlePageHide);

      if (currentUserId) {
        presenceService.updatePresence(currentUserId, false);
        currentUserId = null;
      }
    };
  },

  /**
   * Evaluates whether a user is online in real time.
   * Considers explicit isOnline flag AND freshness of lastSeenAt / lastLoginAt (within 2.5 mins).
   */
  isOnline: (user: UserPresenceData | null | undefined): boolean => {
    if (!user) return false;
    if (user.isOnline === false) return false;

    const lastSeen = user.lastSeenAt || user.lastLoginAt;
    if (!lastSeen) return false;

    let timeMs = 0;
    if (typeof lastSeen === 'number') {
      timeMs = lastSeen;
    } else if (lastSeen.seconds) {
      timeMs = lastSeen.seconds * 1000;
    } else if (lastSeen.toDate) {
      timeMs = lastSeen.toDate().getTime();
    } else if (typeof lastSeen === 'string') {
      timeMs = new Date(lastSeen).getTime();
    }

    if (!timeMs || isNaN(timeMs)) return false;

    const diffSeconds = (Date.now() - timeMs) / 1000;
    // Active if last update was within 150 seconds (2.5 mins)
    return diffSeconds >= 0 && diffSeconds <= 150;
  },

  /**
   * Formats the user's last seen status into readable Turkish text.
   * e.g., "Çevrimiçi", "Son görülme: Bugün 14:20", "Son görülme: Dün 19:45"
   */
  formatLastSeen: (user: UserPresenceData | null | undefined): string => {
    if (presenceService.isOnline(user)) {
      return 'Çevrimiçi';
    }

    const lastSeen = user?.lastSeenAt || user?.lastLoginAt;
    if (!lastSeen) return 'Çevrimdışı';

    let timeMs = 0;
    if (typeof lastSeen === 'number') {
      timeMs = lastSeen;
    } else if (lastSeen.seconds) {
      timeMs = lastSeen.seconds * 1000;
    } else if (lastSeen.toDate) {
      timeMs = lastSeen.toDate().getTime();
    } else if (typeof lastSeen === 'string') {
      timeMs = new Date(lastSeen).getTime();
    }

    if (!timeMs || isNaN(timeMs)) return 'Çevrimdışı';

    const date = new Date(timeMs);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Son görülme: Bugün ${timeStr}`;
    } else if (isYesterday) {
      return `Son görülme: Dün ${timeStr}`;
    } else {
      return `Son görülme: ${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} ${timeStr}`;
    }
  }
};
