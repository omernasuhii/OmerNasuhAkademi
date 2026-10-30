import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from './appointmentService';
import { notificationService } from './notificationService';

export interface ProgramStep {
  id: string;
  title: string;
  type: 'photo_video' | 'product' | 'appointment' | 'event' | 'quiz' | 'table' | 'file' | 'audio' | 'text';
  content: string; // Generic content string or JSON string for flexibility
  order: number;
}

export interface Program {
  id?: string;
  title: string;
  description: string;
  image?: string;
  completionType: 'flexible' | 'scheduled';
  timeLimitDays?: number;
  startDate?: string;
  endDate?: string;
  rewardName?: string;
  isPaid: boolean;
  price?: number;
  visibility: 'public' | 'private' | 'hidden';
  participantLimit?: number;
  enrolledCount: number;
  orderType: 'any' | 'fixed';
  hideFutureSteps: boolean;
  groupId?: string;
  steps: ProgramStep[];
  createdAt: string;
}

export interface ProgramEnrollment {
  id?: string;
  studentId: string;
  programId: string;
  enrolledAt: string;
  progress: number; // percentage
  completedSteps: string[]; // array of step IDs
  completed: boolean;
  completedAt?: string;
  updatedAt?: string;
}

export const programService = {
  async getPrograms(role: 'admin' | 'student') {
    try {
      const q = role === 'admin' 
        ? query(collection(db, 'programs'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'programs'), where('visibility', '==', 'public'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Program));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'programs');
      return [];
    }
  },

  async getProgramById(id: string) {
    try {
      const docRef = doc(db, 'programs', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Program;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'programs');
      return null;
    }
  },

  async createProgram(programData: Omit<Program, 'id' | 'createdAt' | 'enrolledCount'>) {
    try {
      const newRef = doc(collection(db, 'programs'));
      const program: Program = {
        ...programData,
        id: newRef.id,
        createdAt: new Date().toISOString(),
        enrolledCount: 0,
      };
      await setDoc(newRef, program);

      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const usersSnap = await getDocs(q);
        const notificationPromises = usersSnap.docs.map(userDoc => 
          notificationService.addNotification(userDoc.id, {
             title: 'Yeni Eğitim Eklendi',
             message: `Yepyeni bir Kamp Başlıyor: "${program.title}" sisteme eklendi! Hemen incele.`,
             type: 'system',
             link: '/panel/ogrenci/online-egitimler'
          })
        );
        await Promise.allSettled(notificationPromises);
      } catch (e) {
         console.warn('Failed to send global notification', e);
      }

      return program;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'programs');
      throw error;
    }
  },

  async updateProgram(id: string, updates: Partial<Program>) {
    try {
      const docRef = doc(db, 'programs', id);
      
      try {
         const progSnap = await getDoc(docRef);
         const progData = progSnap.data();
         const existingSteps = Array.isArray(progData?.steps) ? progData.steps : [];
         if (progSnap.exists() && Array.isArray(updates.steps) && updates.steps.length > existingSteps.length) {
            const q = query(collection(db, 'program_enrollments'), where('programId', '==', id));
            const enrSnap = await getDocs(q);
            const notificationPromises = enrSnap.docs.map(doc => 
               notificationService.addNotification(doc.data().studentId, {
                  title: 'Eğitim Güncellendi',
                  message: `Katıldığın "${progData?.title || 'Program'}" programına yepyeni içerikler eklendi, hemen göz at!`,
                  type: 'system',
                  link: '/panel/ogrenci/online-egitimler'
               })
            );
            await Promise.allSettled(notificationPromises);
         }
      } catch (ignored) {}

      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'programs');
      throw error;
    }
  },

  async deleteProgram(id: string) {
    try {
      const docRef = doc(db, 'programs', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'programs');
      throw error;
    }
  },

  async enrollStudent(studentId: string, programId: string) {
    try {
      const enrollmentRef = doc(collection(db, 'program_enrollments'));
      const enrollment: ProgramEnrollment = {
        id: enrollmentRef.id,
        studentId,
        programId,
        enrolledAt: new Date().toISOString(),
        progress: 0,
        completedSteps: [],
        completed: false
      };
      await setDoc(enrollmentRef, enrollment);
      
      const programRef = doc(db, 'programs', programId);
      const programSnap = await getDoc(programRef);
      if (programSnap.exists()) {
        try {
          await updateDoc(programRef, {
            enrolledCount: (programSnap.data().enrolledCount || 0) + 1
          });
        } catch (ignoredError) {
          console.warn('Could not update enrolledCount', ignoredError);
        }
        
        try {
          const programTitle = programSnap.data().title || 'Yeni Eğitim';
          await notificationService.addNotification(studentId, {
            title: 'Eğitime Kayıt Olundu',
            message: `Harika bir karar! "${programTitle}" programına başarıyla katıldın. İlk ders seni bekliyor. 🔥`,
            type: 'system',
            link: '/panel/ogrenci/online-egitimler'
          });
        } catch(ignoredErr) {
          console.warn('Notification failed', ignoredErr);
        }
      }
      return enrollment;
    } catch (error) {
       handleFirestoreError(error, OperationType.CREATE, 'program_enrollments');
       throw error;
    }
  },

  async getStudentEnrollments(studentId: string) {
    try {
      const q = query(collection(db, 'program_enrollments'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgramEnrollment));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'program_enrollments');
      return [];
    }
  },

  async completeStep(enrollmentId: string, stepId: string, totalSteps: number, completedStepsArg: string[]) {
    try {
      const docRef = doc(db, 'program_enrollments', enrollmentId);
      const enrSnapPrev = await getDoc(docRef);
      const prevProgress = enrSnapPrev.exists() ? enrSnapPrev.data().progress : 0;
      const prevCompleted = enrSnapPrev.exists() ? enrSnapPrev.data().completed : false;

      const newCompleted = [...completedStepsArg, stepId];
      const uniqueCompleted = Array.from(new Set(newCompleted));
      const progress = Math.round((uniqueCompleted.length / totalSteps) * 100);
      const isCompleted = progress === 100;
      
      await updateDoc(docRef, {
        completedSteps: uniqueCompleted,
        progress: progress,
        completed: isCompleted,
        updatedAt: new Date().toISOString(),
        ...(!prevCompleted && isCompleted ? { completedAt: new Date().toISOString() } : {})
      });

      try {
        if (enrSnapPrev.exists()) {
          const data = enrSnapPrev.data() as ProgramEnrollment;
          const progSnap = await getDoc(doc(db, 'programs', data.programId));
          const title = progSnap.exists() ? progSnap.data().title : 'Eğitim';

          if (!isCompleted && progress !== 50) {
            await notificationService.addNotification(data.studentId, {
               title: 'Adım Tamamlandı',
               message: `Çok iyi gidiyorsun! "${title}" eğitiminde bir adımı başarıyla bitirdin, hedefe adım adım yaklaşıyorsun.`,
               type: 'success',
               link: '/panel/ogrenci/online-egitimler'
            });
          }

          if (progress >= 50 && prevProgress < 50) {
            await notificationService.addNotification(data.studentId, {
               title: 'Yarıyı Devirdin!',
               message: `Yolun yarısını devirdin! "${title}" programına harika devam ediyorsun, ivmeni kaybetme.`,
               type: 'success',
               link: '/panel/ogrenci/online-egitimler'
            });
          }

          if (!prevCompleted && isCompleted) {
            await notificationService.addNotification(data.studentId, {
               title: 'Büyük Final Tebriği',
               message: `GURUR TABLOSU! "${title}" eğitimini başarıyla bitirdin. 🎓`,
               type: 'success',
               link: '/panel/ogrenci/online-egitimler'
            });
            
            if (progSnap.exists() && progSnap.data().rewardName) {
               await notificationService.addNotification(data.studentId, {
                  title: 'Ödül Kazandın!',
                  message: `Eğitimi tamamladığın için ${progSnap.data().rewardName} ödülünü kazandın ve hesabına eklendi! 🎁`,
                  type: 'success',
                  link: '/panel/ogrenci/cuzdan'
               });
            }
          }
        }
      } catch (ignored) {}

      return { completedSteps: uniqueCompleted, progress, completed: isCompleted };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'program_enrollments');
      throw error;
    }
  }
};
