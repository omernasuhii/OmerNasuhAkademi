import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  addDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { OperationType, handleFirestoreError } from './appointmentService';

export const studentDataService = {
  // Daily Programs & Routines
  async getDailyPrograms(studentId: string, dates: string[]): Promise<any[]> {
    const path = 'daily_programs';
    if (!dates || dates.length === 0) return [];
    
    try {
      const q = query(
        collection(db, path), 
        where('studentId', '==', studentId),
        where('date', 'in', dates)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getAllDailyPrograms(studentId: string): Promise<any[]> {
    const path = 'daily_programs';
    try {
      const q = query(
        collection(db, path), 
        where('studentId', '==', studentId)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveDailyProgram(program: any) {
    const path = 'daily_programs';
    try {
      if (program.id) {
        const ref = doc(db, path, program.id);
        const { id, ...updateData } = program;
        await updateDoc(ref, { ...updateData, updatedAt: serverTimestamp() });
        return program.id;
      } else {
        // Document ID should ideally be studentId_date if we want uniqueness, 
        // but we can just use setDoc with a custom ID so we don't accidentally create duplicates.
        const docId = `${program.studentId}_${program.date}`;
        const ref = doc(db, path, docId);
        await setDoc(ref, {
          ...program,
          updatedAt: serverTimestamp()
        });
        return docId;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getRoutines(studentId: string) {
    const path = 'routines';
    try {
      const snap = await getDoc(doc(db, path, studentId));
      if (snap.exists()) {
        return snap.data();
      }
      // Default routines if not found
      return {
        tasks: [
          { subject: 'Türkçe', topic: 'Paragraf', targetCount: 40, type: 'Soru Çözümü' },
          { subject: 'Matematik (TYT)', topic: 'Problemler', targetCount: 20, type: 'Soru Çözümü' }
        ]
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async saveRoutines(studentId: string, routines: any) {
    const path = 'routines';
    try {
      const ref = doc(db, path, studentId);
      await setDoc(ref, { ...routines, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Weekly Programs (Legacy support or completely replaced)
  async getWeeklyPrograms(studentId: string, startDate?: string) {
    const path = 'weekly_programs';
    try {
      let q;
      if (startDate) {
        q = query(
          collection(db, path), 
          where('studentId', '==', studentId),
          where('weekStartDate', '==', startDate)
        );
      } else {
        q = query(
          collection(db, path), 
          where('studentId', '==', studentId),
          orderBy('weekStartDate', 'desc'),
          limit(1)
        );
      }
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveWeeklyProgram(program: any) {
    const path = 'weekly_programs';
    try {
      const data = {
        ...program,
        updatedAt: serverTimestamp()
      };
      if (program.id) {
        const ref = doc(db, path, program.id);
        const { id, ...updateData } = data;
        await updateDoc(ref, updateData);
        return program.id;
      } else {
        const ref = await addDoc(collection(db, path), data);
        return ref.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Exam Results
  async getExamResults(studentId: string) {
    const path = 'exam_results';
    try {
      const q = query(
        collection(db, path), 
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addExamResult(result: any) {
    const path = 'exam_results';
    const { id, ...cleanData } = result;
    try {
      const ref = await addDoc(collection(db, path), {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
      return ref.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateExamResult(id: string, result: any) {
    const path = 'exam_results';
    try {
      await updateDoc(doc(db, path, id), {
        ...result,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteExamResult(id: string) {
    const path = 'exam_results';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Weekly Reports (Solved/Unsolved)
  async getWeeklyReports(studentId: string) {
    const path = 'weekly_reports';
    try {
      const q = query(
        collection(db, path), 
        where('studentId', '==', studentId),
        orderBy('date', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addWeeklyReport(report: any) {
    const path = 'weekly_reports';
    try {
      const ref = await addDoc(collection(db, path), {
        ...report,
        updatedAt: serverTimestamp()
      });
      return ref.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateStudentProfile(uid: string, profileData: any) {
    const path = 'users';
    try {
      const ref = doc(db, path, uid);
      await updateDoc(ref, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return false;
    }
  },

  async getStudentProfile(uid: string) {
    const path = 'users';
    try {
      const snap = await getDoc(doc(db, path, uid));
      if (snap.exists()) {
        return { uid: snap.id, ...snap.data() } as any;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Global Books
  async getGlobalBooks() {
    const path = 'global_books';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveGlobalBook(bookData: any) {
    const path = 'global_books';
    try {
      if (bookData.id) {
        const ref = doc(db, path, bookData.id);
        const { id, ...cleanData } = bookData;
        await updateDoc(ref, {
          ...cleanData,
          updatedAt: serverTimestamp()
        });
        return bookData.id;
      } else {
        const ref = await addDoc(collection(db, path), {
          ...bookData,
          updatedAt: serverTimestamp()
        });
        return ref.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateGlobalBookTopicCounts(bookId: string, counts: Record<string, number>) {
    const path = 'global_books';
    try {
      const ref = doc(db, path, bookId);
      await updateDoc(ref, { topicQuestionCounts: counts, updatedAt: serverTimestamp() });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Book Tracking
  async getBookTracking(studentId: string) {
    const path = 'book_tracking';
    try {
      const q = query(collection(db, path), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async updateBookProgress(trackId: string | null, data: any) {
    const path = 'book_tracking';
    const { id, ...cleanData } = data;
    try {
      if (trackId) {
        const ref = doc(db, path, trackId);
        await updateDoc(ref, {
          ...cleanData,
          updatedAt: serverTimestamp()
        });
        return trackId;
      } else {
        const ref = await addDoc(collection(db, path), {
          ...cleanData,
          updatedAt: serverTimestamp()
        });
        return ref.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Exam Analysis
  async getExamAnalysis(examId: string) {
    const path = 'exam_analyses';
    try {
      const user = auth.currentUser;
      if (!user) return null;
      
      const q = query(
        collection(db, path), 
        where('examId', '==', examId),
        where('studentId', '==', user.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...(snap.docs[0].data() as any) };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return null;
    }
  },

  async getStudentAnalyses(studentId: string) {
    const path = 'exam_analyses';
    try {
      const q = query(collection(db, path), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async saveExamAnalysis(analysis: any) {
    const path = 'exam_analyses';
    try {
      const data = {
        ...analysis,
        updatedAt: serverTimestamp()
      };
      if (analysis.id) {
        const ref = doc(db, path, analysis.id);
        const { id, ...updateData } = data;
        await updateDoc(ref, updateData);
        return analysis.id;
      } else {
        const ref = await addDoc(collection(db, path), data);
        // Also update the exam result to mark it as analyzed
        await this.updateExamResult(analysis.examId, { analyzed: true });
        return ref.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Monthly Goals
  async getMonthlyGoal(studentId: string, month: string) {
    const path = 'monthly_goals';
    try {
      // Use predefined docId to ensure one goal per month per student
      const docId = `${studentId}_${month}`;
      const snap = await getDoc(doc(db, path, docId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as any;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async saveMonthlyGoal(goal: any) {
    const path = 'monthly_goals';
    try {
      const docId = `${goal.studentId}_${goal.month}`;
      const ref = doc(db, path, docId);
      const data = {
        ...goal,
        updatedAt: serverTimestamp()
      };
      await setDoc(ref, data, { merge: true });
      return docId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Wallet Transactions
  async getWalletTransactions(studentId: string) {
    const path = 'wallet_transactions';
    try {
      const q = query(
        collection(db, path),
        where('studentId', '==', studentId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addWalletTransaction(studentId: string, transaction: { amount: number; type: 'DEPOSIT' | 'WITHDRAWAL'; description: string; coachDeductionAmount?: number; items?: any[] }) {
    const path = 'wallet_transactions';
    try {
      const usersPath = 'users';
      const studentSnap = await getDoc(doc(db, usersPath, studentId));
      
      if (!studentSnap.exists()) {
        return { success: false, error: 'Öğrenci bulunamadı' };
      }
      
      const studentData = studentSnap.data();
      const coachId = studentData.coachId;

      let currentBalance = studentData.walletBalance || 0;
      
      if (transaction.type === 'WITHDRAWAL') {
        if (!coachId) {
          return { success: false, error: "Koç atanmamış, işlem yapılamaz." };
        }

        if (currentBalance < transaction.amount) {
           return { success: false, error: "Bakiyeniz yetersiz. Eksi bakiyeye izin verilmemektedir." };
        }
        
        // Coach System Balance check
        const coachSnap = await getDoc(doc(db, usersPath, coachId));
        if (!coachSnap.exists()) {
          return { success: false, error: "Koç bulunamadı." };
        }
        
        const coachData = coachSnap.data();
        const currentSystemBalance = coachData.systemBalance || 0;
        
        const coachDeduction = transaction.coachDeductionAmount !== undefined ? transaction.coachDeductionAmount : transaction.amount;

        if (currentSystemBalance < coachDeduction) {
           return { success: false, error: "Bu işlemi gerçekleştirebilmek için bağlı olduğunuz kurumun/koçun paket güncellemesi (veya ek yetkilendirmesi) gerekmektedir. Lütfen eğitim koçunuza bilgi veriniz." };
        }
        
        // Deduct from coach systematically
        await updateDoc(doc(db, usersPath, coachId), {
           systemBalance: currentSystemBalance - coachDeduction,
           updatedAt: serverTimestamp()
        });
      }

      // Create student transaction log
      const ref = await addDoc(collection(db, path), {
        studentId,
        coachId,
        ...transaction,
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      if (transaction.type === 'DEPOSIT') {
        currentBalance += transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL') {
        currentBalance -= transaction.amount;
      }

      // Update student balance
      await updateDoc(doc(db, usersPath, studentId), {
        walletBalance: currentBalance,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, newBalance: currentBalance, transactionId: ref.id };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      return { success: false, error: error };
    }
  },

  // Generic Data Retrieval for CMS
  async getAllCollectionData(collectionPath: string, sortingField: string = 'updatedAt', resultLimit: number = 50) {
    try {
      let q;
      if (sortingField) {
        q = query(
          collection(db, collectionPath),
          orderBy(sortingField, 'desc'),
          limit(resultLimit)
        );
      } else {
        q = query(
          collection(db, collectionPath),
          limit(resultLimit)
        );
      }
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    } catch (error) {
      console.error(`Error fetching collection ${collectionPath}:`, error);
      // Try without sorting if sorting fails (field missing or index missing)
      try {
        const q = query(collection(db, collectionPath), limit(resultLimit));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
      } catch (innerError) {
        console.error(`Fallback failed for ${collectionPath}:`, innerError);
        return [];
      }
    }
  }
};
