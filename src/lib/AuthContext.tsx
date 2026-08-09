import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { sessionTracker } from '../services/sessionTracker';
import { safeStorage } from './localStorage';
import { checkAndRenewSubscription } from '../services/subscriptionService';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  systemSettings: any | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [systemSettings, setSystemSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch global system settings once when provider mounts
    const unsubscribeSystem = onSnapshot(doc(db, 'settings', 'system'), (snapshot) => {
      if (snapshot.exists()) {
        setSystemSettings(snapshot.data());
      }
    });

    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeDoc) unsubscribeDoc();

      if (firebaseUser) {
        setLoading(true);
        // Log login only if we haven't done it this session
        if (!safeStorage.getSessionItem(`session_logged_${firebaseUser.uid}`)) {
          sessionTracker.logLogin(firebaseUser.uid, firebaseUser.email || '');
          safeStorage.setSessionItem(`session_logged_${firebaseUser.uid}`, 'true');
        }

        const loadUserData = async (snapshot: any) => {
          if (snapshot.exists() && snapshot.data()?.role) {
            const data: any = { uid: firebaseUser.uid, ...snapshot.data() };
            setUserData(data);
            if (data.role === 'student' && data.subscriptionPlan) {
              checkAndRenewSubscription(data, firebaseUser.uid).catch(console.error);
            }
            setLoading(false);
            return;
          }

          // Fallback: search users collection by email if uid match failed or doc not found yet
          if (firebaseUser.email) {
            try {
              const { collection, query, where, getDocs } = await import('firebase/firestore');
              const q = query(collection(db, 'users'), where('email', '==', firebaseUser.email.toLowerCase()));
              const querySnap = await getDocs(q);
              if (!querySnap.empty) {
                const firstDoc = querySnap.docs[0];
                if (firstDoc.exists() && firstDoc.data()?.role) {
                  const data: any = { uid: firstDoc.id, ...firstDoc.data() };
                  setUserData(data);
                  setLoading(false);
                  return;
                }
              }
            } catch (fallbackErr) {
              console.warn("AuthContext email fallback search error:", fallbackErr);
            }
          }

          setUserData(null);
          setLoading(false);
        };

        unsubscribeDoc = onSnapshot(doc(db, 'users', firebaseUser.uid), (snapshot) => {
          loadUserData(snapshot);
        }, async (err) => {
          console.error("AuthContext user doc snapshot error, attempting retry:", err);
          // Wait 500ms and retry once with getDoc in case of initial token sync latency
          setTimeout(async () => {
            try {
              const { getDoc } = await import('firebase/firestore');
              const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
              await loadUserData(userDoc);
            } catch (retryErr) {
              console.error("AuthContext user doc retry failed:", retryErr);
              setUserData(null);
              setLoading(false);
            }
          }, 500);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSystem();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, []);

  const logout = async () => {
    if (user) {
      await sessionTracker.logLogout(user.uid);
      safeStorage.removeSessionItem(`session_logged_${user.uid}`);
    }
    safeStorage.removeItem('coach_selected_student');
    await auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, userData, systemSettings, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
