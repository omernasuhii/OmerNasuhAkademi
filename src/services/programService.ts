import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from './appointmentService';

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
      return program;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'programs');
      throw error;
    }
  },

  async updateProgram(id: string, updates: Partial<Program>) {
    try {
      const docRef = doc(db, 'programs', id);
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
      const newCompleted = [...completedStepsArg, stepId];
      const uniqueCompleted = Array.from(new Set(newCompleted));
      const progress = Math.round((uniqueCompleted.length / totalSteps) * 100);
      const isCompleted = progress === 100;
      
      await updateDoc(docRef, {
        completedSteps: uniqueCompleted,
        progress: progress,
        completed: isCompleted,
        ...(isCompleted ? { completedAt: new Date().toISOString() } : {})
      });
      return { completedSteps: uniqueCompleted, progress, completed: isCompleted };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'program_enrollments');
      throw error;
    }
  }
};
