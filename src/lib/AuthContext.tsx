import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { sessionTracker } from '../services/sessionTracker';
import { presenceService } from '../services/presenceService';
import { safeStorage } from './localStorage';
import { checkAndRenewSubscription } from '../services/subscriptionService';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  realUser: User | null;
  realUserData: any | null;
  systemSettings: any | null;
  loading: boolean;
  isAdmin: boolean;
  isImpersonating: boolean;
  impersonatedStudent: any | null;
  setImpersonatedStudent: (student: any | null) => void;
  clearImpersonation: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [actualUserData, setActualUserData] = useState<any | null>(null);
  const [impersonatedStudent, setImpersonatedStudentState] = useState<any | null>(() => {
    const saved = safeStorage.getItem('admin_impersonated_student');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [systemSettings, setSystemSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const setImpersonatedStudent = (student: any | null) => {
    setImpersonatedStudentState(student);
    if (student) {
      safeStorage.setItem('admin_impersonated_student', JSON.stringify(student));
      safeStorage.setItem('coach_selected_student', JSON.stringify(student));
    } else {
      safeStorage.removeItem('admin_impersonated_student');
      safeStorage.removeItem('coach_selected_student');
    }
  };

  const clearImpersonation = () => {
    setImpersonatedStudent(null);
  };

  // Real-time listener for impersonated student document if an admin is inspecting
  useEffect(() => {
    if (actualUserData?.role === 'admin' && impersonatedStudent?.uid) {
      const unsub = onSnapshot(doc(db, 'users', impersonatedStudent.uid), (snap) => {
        if (snap.exists()) {
          const freshData = { uid: snap.id, ...snap.data() };
          setImpersonatedStudentState((prev: any) => ({ ...prev, ...freshData }));
          safeStorage.setItem('admin_impersonated_student', JSON.stringify({ ...impersonatedStudent, ...freshData }));
        }
      }, (err) => {
        console.warn("Impersonated student snapshot error:", err);
      });
      return () => unsub();
    }
  }, [actualUserData?.role, impersonatedStudent?.uid]);

  useEffect(() => {
    // Fetch global system settings once when provider mounts
    const unsubscribeSystem = onSnapshot(doc(db, 'settings', 'system'), (snapshot) => {
      if (snapshot.exists()) {
        setSystemSettings(snapshot.data());
      }
    });

    let unsubscribeDoc: (() => void) | undefined;
    let stopPresence: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeDoc) unsubscribeDoc();
      if (stopPresence) {
        stopPresence();
        stopPresence = undefined;
      }

      if (firebaseUser) {
        setLoading(true);
        // Start presence tracker for real-time heartbeat
        stopPresence = presenceService.startTracker(firebaseUser.uid);

        // Log login only if we haven't done it this session
        if (!safeStorage.getSessionItem(`session_logged_${firebaseUser.uid}`)) {
          sessionTracker.logLogin(firebaseUser.uid, firebaseUser.email || '');
          safeStorage.setSessionItem(`session_logged_${firebaseUser.uid}`, 'true');
        }

        const loadUserData = async (snapshot: any) => {
          if (snapshot.exists() && snapshot.data()?.role) {
            const data: any = { uid: firebaseUser.uid, ...snapshot.data() };
            
            setActualUserData((prevData: any) => {
              if (!prevData) return data;
              
              // Normalize and compare core identity & authorization properties
              const keysToIgnore = new Set(['isOnline', 'lastSeenAt', 'lastLoginAt', 'updatedAt']);
              
              const prevFiltered: any = {};
              for (const [k, v] of Object.entries(prevData)) {
                if (!keysToIgnore.has(k)) {
                  prevFiltered[k] = v;
                }
              }
              const newFiltered: any = {};
              for (const [k, v] of Object.entries(data)) {
                if (!keysToIgnore.has(k)) {
                  newFiltered[k] = v;
                }
              }
              
              const prevKeys = Object.keys(prevFiltered);
              const newKeys = Object.keys(newFiltered);
              if (prevKeys.length === newKeys.length) {
                const isIdentical = prevKeys.every(key => {
                  const valA = prevFiltered[key];
                  const valB = newFiltered[key];
                  if (valA === valB) return true;
                  if (valA && valB && typeof valA === 'object' && typeof valB === 'object') {
                    try {
                      return JSON.stringify(valA) === JSON.stringify(valB);
                    } catch {
                      return false;
                    }
                  }
                  return false;
                });
                if (isIdentical) {
                  return prevData; // Keep reference to prevent re-renders
                }
              }
              return data;
            });
            
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
                  setActualUserData(data);
                  setLoading(false);
                  return;
                }
              }
            } catch (fallbackErr) {
              console.warn("AuthContext email fallback search error:", fallbackErr);
            }
          }

          setActualUserData(null);
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
              setActualUserData(null);
              setLoading(false);
            }
          }, 500);
        });
      } else {
        setActualUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSystem();
      if (unsubscribeDoc) unsubscribeDoc();
      if (stopPresence) stopPresence();
    };
  }, []);

  const logout = async () => {
    if (user) {
      await sessionTracker.logLogout(user.uid);
      safeStorage.removeSessionItem(`session_logged_${user.uid}`);
    }
    safeStorage.removeItem('coach_selected_student');
    safeStorage.removeItem('admin_impersonated_student');
    setImpersonatedStudentState(null);
    await auth.signOut();
  };

  const isAdmin = actualUserData?.role === 'admin';
  const isImpersonating = isAdmin && !!impersonatedStudent;

  // Derive effective user and userData:
  // When an admin selects a student to troubleshoot, userData points to that student
  const effectiveUserData = isImpersonating ? { ...impersonatedStudent, isImpersonated: true } : actualUserData;
  const effectiveUser = isImpersonating && user ? {
    ...user,
    uid: impersonatedStudent.uid,
    email: impersonatedStudent.email || user.email,
    displayName: impersonatedStudent.displayName || (impersonatedStudent.firstName ? `${impersonatedStudent.firstName} ${impersonatedStudent.lastName || ''}`.trim() : user.displayName),
    photoURL: impersonatedStudent.photoURL || user.photoURL,
  } : user;

  return (
    <AuthContext.Provider value={{ 
      user: effectiveUser as User | null, 
      userData: effectiveUserData,
      realUser: user,
      realUserData: actualUserData,
      systemSettings, 
      loading, 
      isAdmin,
      isImpersonating,
      impersonatedStudent,
      setImpersonatedStudent,
      clearImpersonation,
      logout 
    }}>
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
