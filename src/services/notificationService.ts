import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  serverTimestamp, 
  deleteDoc, 
  writeBatch, 
  onSnapshot 
} from 'firebase/firestore';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'appointment' | 'system' | 'message' | 'payment' | 'exam' | 'success';
  isRead: boolean;
  createdAt: string;
  link?: string;
  studentId?: string;
  coachId?: string;

  // Announcement specific fields
  announcementId?: string;
  category?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  summary?: string;
  content?: string;
  bannerUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
}

// In-memory cache for archive status to prevent redundant Firestore queries
const archiveCache = new Map<string, { isArchived: boolean; timestamp: number }>();

export const notificationService = {
  /**
   * Checks whether a student or user is marked as archived.
   * Caches the result in memory for 30 seconds for high-performance suppression.
   */
  async isUserArchived(userId: string): Promise<boolean> {
    if (!userId || userId === 'SYSTEM') return false;
    const now = Date.now();
    const cached = archiveCache.get(userId);
    if (cached && now - cached.timestamp < 30000) {
      return cached.isArchived;
    }

    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        const d = snap.data();
        const archived = !!(d?.isArchived === true || d?.archived === true);
        archiveCache.set(userId, { isArchived: archived, timestamp: now });
        return archived;
      }
    } catch (e) {
      console.warn('[NotificationService] Error checking archive status for', userId, e);
    }
    return false;
  },

  /**
   * Clears or updates the local archive cache (e.g. after toggling archive status).
   */
  setCachedArchiveStatus(userId: string, isArchived: boolean) {
    if (userId) {
      archiveCache.set(userId, { isArchived, timestamp: Date.now() });
    }
  },

  clearArchiveCache() {
    archiveCache.clear();
  },

  // Send direct FCM WebPush / Mobile Push to user's device without creating an in-app notification doc
  async sendPushNotification(userId: string, data: { title: string; message: string; link?: string }) {
    try {
      // Suppress push notification if recipient is an archived student
      if (await this.isUserArchived(userId)) {
        return { success: false, reason: 'archived_suppressed' };
      }

      const res = await fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          title: data.title,
          body: data.message,
          link: data.link || '/panel'
        })
      });
      return await res.json();
    } catch (err) {
      console.warn('[NotificationService] Direct push failed:', err);
      return { success: false, error: err };
    }
  },

  async addNotification(userId: string, data: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>, skipPush: boolean = false) {
    try {
      // 1. Suppress notifications sent TO an archived student
      if (await this.isUserArchived(userId)) {
        console.log(`[NotificationService] Suppressed notification for archived student: ${userId}`);
        return null;
      }

      // 2. Suppress notifications sent to COACH or others regarding an ARCHIVED student
      const studentId = (data as any).studentId || (data as any).relatedStudentId;
      if (studentId && await this.isUserArchived(studentId)) {
        console.log(`[NotificationService] Suppressed coach/system notification for archived student ${studentId} directed to: ${userId}`);
        return null;
      }

      const notificationsRef = collection(db, 'notifications');
      const newDoc = await addDoc(notificationsRef, {
        userId,
        ...data,
        isRead: false,
        createdAt: new Date().toISOString(), // Fallback
        timestamp: serverTimestamp() // For accurate sorting
      });
      // Try to send push notification directly via server API if not skipped
      if (!skipPush) {
        try {
          const tokenSnap = await getDoc(doc(db, 'userTokens', userId));
          if (tokenSnap.exists()) {
            const userTokenData = tokenSnap.data();
            if (userTokenData && userTokenData.token) {
              await fetch('/api/send-push', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: userTokenData.token,
                  title: data.title,
                  body: data.message,
                  link: data.link || '/'
                })
              }).catch(e => console.warn('Could not trigger push on server', e));
            }
          }
        } catch (pushErr: any) {
          if (pushErr?.code !== 'permission-denied' && !pushErr?.message?.toLowerCase().includes('permission')) {
            console.warn('Push notification trigger skipped:', pushErr);
          }
        }
      }
      return newDoc;
    } catch (error: any) {
      if (error?.code !== "permission-denied" && !error?.message?.toLowerCase().includes("permission")) {
        console.error('Error adding notification:', error);
      }
      throw error;
    }
  },

  async getNotifications(userId: string): Promise<Notification[]> {
    if (!auth.currentUser) return [];
    if (await this.isUserArchived(userId)) return [];
    
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as Partial<Notification>)
        }))
        .filter(n => n.type !== 'message') as Notification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  onNotificationsChange(userId: string, callback: (notifications: Notification[]) => void) {
    if (!userId) {
      callback([]);
      return () => {};
    }

    // Check archive status
    let isArchived = false;
    this.isUserArchived(userId).then(archived => {
      isArchived = archived;
      if (archived) {
        callback([]);
      }
    });
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot: any) => {
      if (isArchived) {
        callback([]);
        return;
      }
      const notifications = (snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[]).filter(n => n.type !== 'message');
      callback(notifications);
    }, (error: any) => {
      console.error('Error listening to notifications:', error);
    });
  },

  async markAsRead(notificationId: string) {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead(userId: string) {
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return;

      const batch = writeBatch(db);
      snapshot.docs.forEach(document => {
        batch.update(document.ref, { isRead: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId: string) {
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
};
