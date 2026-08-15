import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
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

export const notificationService = {
  async addNotification(userId: string, data: Omit<Notification, 'id' | 'userId' | 'createdAt' | 'isRead'>) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const newDoc = await addDoc(notificationsRef, {
        userId,
        ...data,
        isRead: false,
        createdAt: new Date().toISOString(), // Fallback
        timestamp: serverTimestamp() // For accurate sorting
      });
      // Try to send push notification directly via server API
      try {
        const tokenDoc = await getDocs(query(collection(db, 'userTokens'), where('__name__', '==', userId)));
        if (!tokenDoc.empty) {
          const userTokenData = tokenDoc.docs[0].data();
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
    
    try {
      const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Partial<Notification>)
      })) as Notification[];
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  onNotificationsChange(userId: string, callback: (notifications: Notification[]) => void) {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }
    
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    return onSnapshot(q, (snapshot: any) => {
      const notifications = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
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
