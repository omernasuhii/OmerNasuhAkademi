import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const sessionTracker = {
  logLogin: async (userId: string, email: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        lastLoginAt: serverTimestamp(),
        isOnline: true
      }, { merge: true });
    } catch (err) {
      console.error('User update error during login track:', err);
    }
    
    try {
      await addDoc(collection(db, 'user_sessions'), {
        userId,
        email,
        type: 'login',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Session track addDoc error:', err);
    }
  },
  
  logLogout: async (userId: string) => {
    try {
      await setDoc(doc(db, 'users', userId), {
        lastLogoutAt: serverTimestamp(),
        isOnline: false
      }, { merge: true });
    } catch (err) {
      console.error('User update error during logout track:', err);
    }
    
    try {
      await addDoc(collection(db, 'user_sessions'), {
        userId,
        type: 'logout',
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Session track addDoc error:', err);
    }
  }
};
