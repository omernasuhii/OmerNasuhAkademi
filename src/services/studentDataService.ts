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
import { notificationService } from './notificationService';
import { generateAllDefaultResources } from '../constants/youtubeChannels';

function sanitizeFirestorePayload(data: any): any {
  if (!data) return data;
  if (typeof data === 'string') {
    if (data.length > 950000) {
      if (data.startsWith('data:image/') || data.startsWith('data:audio/')) {
        return null;
      }
      return data.slice(0, 100000);
    }
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeFirestorePayload(item));
  }
  if (typeof data === 'object' && data !== null) {
    const cleaned: any = {};
    for (const key of Object.keys(data)) {
      cleaned[key] = sanitizeFirestorePayload(data[key]);
    }
    return cleaned;
  }
  return data;
}

export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (obj.constructor && obj.constructor.name !== 'Object' && !Array.isArray(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)).filter(item => item !== undefined) as any;
  }
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj as Record<string, any>)) {
    const value = (obj as Record<string, any>)[key];
    if (value !== undefined) {
      result[key] = cleanUndefined(value);
    }
  }
  return result as T;
}

export const studentDataService = {
  async getWeeklyEvaluation(studentId: string, weekStartDate: string): Promise<any | null> {
    try {
      const q = query(collection(db, "weeklyEvaluations"), where("studentId", "==", studentId), where("weekStartDate", "==", weekStartDate));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
  async saveWeeklyEvaluation(studentId: string, weekStartDate: string, evaluation: string): Promise<void> {
    try {
      const existing = await this.getWeeklyEvaluation(studentId, weekStartDate);
      if (existing) {
        await updateDoc(doc(db, "weeklyEvaluations", existing.id), {
          evaluation,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, "weeklyEvaluations"), {
          studentId,
          weekStartDate,
          evaluation,
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      console.error(e);
    }
  },

  // CABA Test Results
  async getCabaTestResult(studentId: string): Promise<any | null> {
    const path = 'caba_tests';
    try {
      const docRef = doc(db, path, studentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (error) {
      console.error("CABA testi çekilirken hata:", error);
      return null;
    }
  },

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
      const sanitized = cleanUndefined(program);
      const docId = sanitized.id || `${sanitized.studentId}_${sanitized.date}`;
      const ref = doc(db, path, docId);
      const { id, ...updateData } = sanitized;
      await setDoc(ref, {
        ...updateData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return docId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveDailyProgramDraft(studentId: string, date: string, draftTasks: any[], draftCoachNote?: string) {
    const path = 'daily_programs';
    try {
      const docId = `${studentId}_${date}`;
      const ref = doc(db, path, docId);
      const sanitizedTasks = cleanUndefined(draftTasks || []);
      const payload: any = {
        studentId,
        date,
        draftTasks: sanitizedTasks,
        hasDraft: true,
        draftUpdatedAt: serverTimestamp()
      };
      if (draftCoachNote !== undefined) {
        payload.draftCoachNote = draftCoachNote;
      }
      await setDoc(ref, payload, { merge: true });
      return docId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveBatchDailyProgramDrafts(studentId: string, daysDrafts: Array<{ date: string; draftTasks: any[]; draftCoachNote?: string }>) {
    const path = 'daily_programs';
    try {
      const promises = daysDrafts.map(async (d) => {
        const docId = `${studentId}_${d.date}`;
        const ref = doc(db, path, docId);
        const sanitizedTasks = cleanUndefined(d.draftTasks || []);
        const payload: any = {
          studentId,
          date: d.date,
          draftTasks: sanitizedTasks,
          hasDraft: true,
          draftUpdatedAt: serverTimestamp()
        };
        if (d.draftCoachNote !== undefined) {
          payload.draftCoachNote = d.draftCoachNote;
        }
        await setDoc(ref, payload, { merge: true });
      });
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async publishDailyPrograms(studentId: string, daysData: Array<{ date: string; tasks: any[]; coachNote?: string; studentNote?: string }>) {
    const path = 'daily_programs';
    try {
      const promises = daysData.map(async (day) => {
        const docId = `${studentId}_${day.date}`;
        const ref = doc(db, path, docId);
        const sanitizedTasks = cleanUndefined(day.tasks || []);

        let finalTasks = sanitizedTasks;
        let preservedStudentNote = day.studentNote || '';

        try {
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const existingData = snap.data();
            const existingTasks = existingData.tasks || [];
            const currentIds = new Set(sanitizedTasks.map((t: any) => t.id));

            // Sync completion progress if task was already completed by student
            const existingMap = new Map(existingTasks.map((et: any) => [et.id, et]));
            finalTasks = finalTasks.map((t: any) => {
              const existing: any = existingMap.get(t.id);
              if (existing && existing.isDone !== undefined && t.isDone === undefined) {
                return {
                  ...t,
                  isDone: existing.isDone,
                  completedCount: existing.completedCount !== undefined ? existing.completedCount : t.completedCount,
                  isWaitingResult: existing.isWaitingResult !== undefined ? existing.isWaitingResult : t.isWaitingResult,
                  studentNote: existing.studentNote || t.studentNote || ''
                };
              }
              return t;
            });

            // Find any student-added extra tasks that are in Firestore but not in the published list
            const existingStudentTasks = existingTasks.filter((et: any) => {
              const isStudent = Boolean(et.isExtra || et.addedBy === 'student' || et.isStudentAdded || et.addedByStudent || et.createdBy === 'student');
              return isStudent && !currentIds.has(et.id);
            });

            if (existingStudentTasks.length > 0) {
              finalTasks = [...finalTasks, ...existingStudentTasks];
            }

            if (!preservedStudentNote && existingData.studentNote) {
              preservedStudentNote = existingData.studentNote;
            }
          }
        } catch (e) {
          console.warn("Existing doc check error in publishDailyPrograms:", e);
        }

        await setDoc(ref, {
          studentId,
          date: day.date,
          tasks: finalTasks,
          coachNote: day.coachNote || '',
          studentNote: preservedStudentNote,
          draftTasks: finalTasks,
          draftCoachNote: day.coachNote || '',
          hasDraft: false,
          isPublished: true,
          publishedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      });
      await Promise.all(promises);
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
    if (!studentId) return [];
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

  async ensureUniqueExamName(studentId: string, examName: string, excludeId?: string): Promise<string> {
    const path = 'exam_results';
    try {
      const q = query(collection(db, path), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      const existingNames = snap.docs
        .filter(doc => !excludeId || doc.id !== excludeId)
        .map(doc => doc.data().examName)
        .filter(Boolean);

      if (!existingNames.includes(examName)) {
        return examName;
      }

      let counter = 2;
      let newName = `${examName} (${counter})`;
      while (existingNames.includes(newName)) {
        counter++;
        newName = `${examName} (${counter})`;
      }
      return newName;
    } catch (e) {
      console.error('Error ensuring unique exam name:', e);
      return examName;
    }
  },

  async addExamResult(result: any) {
    const path = 'exam_results';
    const { id, ...cleanData } = result;
    try {
      if (cleanData.studentId && cleanData.examName) {
        cleanData.examName = await this.ensureUniqueExamName(cleanData.studentId, cleanData.examName);
      }
      const ref = await addDoc(collection(db, path), {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
      
      // Award XP for adding a trial exam
      if (cleanData.studentId) {
        const isBranch = cleanData.examType === 'BRANŞ' || cleanData.examType === 'DERS';
        await this.awardXP(cleanData.studentId, isBranch ? 20 : 50, 'Deneme Sınavı Eklendi');
      }
      
      return ref.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateExamResult(id: string, result: any) {
    const path = 'exam_results';
    try {
      if (result.studentId && result.examName) {
        result.examName = await this.ensureUniqueExamName(result.studentId, result.examName, id);
      } else if (result.examName) {
        // If studentId isn't provided, fetch existing doc to get studentId
        const examSnap = await getDoc(doc(db, path, id));
        if (examSnap.exists()) {
          const studentId = examSnap.data().studentId;
          if (studentId) {
            result.examName = await this.ensureUniqueExamName(studentId, result.examName, id);
          }
        }
      }
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
      const examSnap = await getDoc(doc(db, path, id));
      if (examSnap.exists()) {
        const data = examSnap.data();
        const isBranch = data.examType === 'BRANŞ' || data.examType === 'DERS';
        
        let xpToDeduct = isBranch ? 20 : 50;
        if (data.analyzed) {
          xpToDeduct += isBranch ? 40 : 150;
          
          // Clean up the analysis document as well
          const analysesQuery = query(collection(db, 'exam_analyses'), where('examId', '==', id));
          const analysesSnap = await getDocs(analysesQuery);
          analysesSnap.forEach(async (analysisDoc) => {
             await deleteDoc(doc(db, 'exam_analyses', analysisDoc.id));
          });
        }
        
        if (data.studentId) {
          await this.awardXP(data.studentId, -xpToDeduct, 'Deneme Sınavı Silindi');
        }
      }

      await deleteDoc(doc(db, path, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Weekly Reports (Solved/Unsolved)
  async getWeeklyReports(studentId: string) {
    if (!studentId) return [];
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

  async logSubscriptionHistory(data: {
    studentId: string;
    studentName: string;
    oldPlan?: string;
    newPlan: string;
    action: 'started' | 'renewed' | 'upgraded' | 'expired' | 'cancelled';
    startDate: string;
    endDate: string;
  }) {
    try {
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      const ref = doc(db, 'users', data.studentId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
         const userData = snap.data();
         const history = userData.subscriptionHistory || [];
         const entry: any = {
            id: Math.random().toString(36).substring(2, 11),
            studentId: data.studentId || '',
            studentName: data.studentName || '',
            oldPlan: data.oldPlan || 'Yok',
            newPlan: data.newPlan || '',
            action: data.action,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            createdAt: new Date().toISOString()
         };
         history.push(entry);
         await updateDoc(ref, { subscriptionHistory: history });
      }
    } catch (error) {
       console.error("Error logging subscription history", error);
    }
  },

  async awardXP(uid: string, amount: number, reason: string = '') {
    const path = 'users';
    try {
      const ref = doc(db, path, uid);
      const userSnap = await getDoc(ref);
      if (userSnap.exists()) {
        const currentXP = userSnap.data().xp || 0;
        await updateDoc(ref, {
          xp: currentXP + amount,
          updatedAt: serverTimestamp()
        });
        
        // Optional: you can store XP history in a subcollection or array 
        // to track "reason" and avoid spam, but simplified here.
        return currentXP + amount;
      }
      return 0;
    } catch (error) {
      console.error("awardXP error", error);
      return 0;
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

  async getCurriculum() {
    const path = 'settings';
    try {
      const snap = await getDoc(doc(db, path, 'curriculum'));
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        subjects: (data.subjects as Record<string, string[]>) || null,
        subtopics: (data.subtopics as Record<string, string[]>) || null
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async saveCurriculumSubject(subject: string, topics: string[]) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'curriculum');
      const snap = await getDoc(ref);
      let subjects = snap.exists() ? snap.data().subjects || {} : {};
      subjects[subject] = topics;
      await setDoc(ref, { subjects, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveCurriculumSubtopics(topic: string, subtopicsList: string[]) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'curriculum');
      const snap = await getDoc(ref);
      let subtopics = snap.exists() ? snap.data().subtopics || {} : {};
      subtopics[topic] = subtopicsList;
      await setDoc(ref, { subtopics, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveAllSubtopics(newSubtopics: Record<string, string[]>) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'curriculum');
      await setDoc(ref, { subtopics: newSubtopics, updatedAt: serverTimestamp() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async resetCurriculumToDefaults(defaultCurriculum: Record<string, string[]>, defaultSubtopics: Record<string, string[]>) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'curriculum');
      await setDoc(ref, { 
        subjects: defaultCurriculum, 
        subtopics: defaultSubtopics, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteCurriculumSubject(subject: string) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'curriculum');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let subjects = snap.data().subjects || {};
        delete subjects[subject];
        await setDoc(ref, { subjects, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Global Books
  async getGlobalBooks() {
    const path = 'global_books';
    const cleanIsbn = (s: string) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    try {
      const snap = await getDocs(collection(db, path));
      const firestoreBooks: any[] = snap.docs.map(doc => {
        const data = doc.data() as any;
        // Strip legacy ISBNs from youtube resources or resources with channel titles/videos
        const isYoutubeResource = data.resourceType === 'youtube' || 
                                  Boolean(data.channelTitle) || 
                                  (Array.isArray(data.videos) && data.videos.length > 0) || 
                                  (data.isbn && data.isbn.startsWith('youtube_'));

        if (isYoutubeResource) {
          data.isbn = '';
          data.resourceType = 'youtube';
        }
        return { id: doc.id, ...data };
      });
      
      const defaultResources = generateAllDefaultResources();
      const firestoreKeys = new Set(
        firestoreBooks.map(b => (b.id || '').toLowerCase())
      );
      const firestoreNameSubjects = new Set(
        firestoreBooks.map(b => `${(b.name || '').trim().toLowerCase()}___${(b.subject || '').trim().toLowerCase()}`)
      );

      const missingDefaults = defaultResources.filter(d => {
        if (firestoreKeys.has((d.id || '').toLowerCase())) return false;
        const key = `${(d.name || '').trim().toLowerCase()}___${(d.subject || '').trim().toLowerCase()}`;
        if (firestoreNameSubjects.has(key)) return false;
        return true;
      });

      return [...firestoreBooks, ...missingDefaults];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return generateAllDefaultResources();
    }
  },

  async getGlobalCurriculumPlans() {
    const path = 'settings';
    try {
      const snap = await getDoc(doc(db, path, 'curriculum_plans_data'));
      if (!snap.exists()) return [];
      return snap.data().plans || [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async saveGlobalCurriculumPlan(planData: any) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'curriculum_plans_data');
      const snap = await getDoc(ref);
      let plans = snap.exists() ? snap.data().plans || [] : [];
      
      if (planData.id) {
        const index = plans.findIndex((p: any) => p.id === planData.id);
        if (index > -1) {
          plans[index] = { ...planData, updatedAt: new Date().toISOString() };
        } else {
          plans.push({ ...planData, updatedAt: new Date().toISOString() });
        }
      } else {
        const newId = Math.random().toString(36).substring(2, 15);
        planData.id = newId;
        plans.push({ ...planData, id: newId, updatedAt: new Date().toISOString() });
      }
      
      await setDoc(ref, { plans }, { merge: true });
      return planData.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteGlobalCurriculumPlan(planId: string) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'curriculum_plans_data');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let plans = snap.data().plans || [];
        plans = plans.filter((p: any) => p.id !== planId);
        await setDoc(ref, { plans }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getGlobalQuestions() {
    const path = 'settings';
    try {
      const snap = await getDoc(doc(db, path, 'global_questions_data'));
      if (!snap.exists()) return [];
      return snap.data().questions || [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async saveGlobalQuestion(questionData: any) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'global_questions_data');
      const snap = await getDoc(ref);
      let questions = snap.exists() ? snap.data().questions || [] : [];
      
      if (questionData.id) {
        const index = questions.findIndex((q: any) => q.id === questionData.id);
        if (index > -1) {
          questions[index] = { ...questionData, updatedAt: new Date().toISOString() };
        } else {
          questions.push({ ...questionData, updatedAt: new Date().toISOString() });
        }
      } else {
        const newId = Math.random().toString(36).substring(2, 15);
        questionData.id = newId;
        questions.push({ ...questionData, id: newId, updatedAt: new Date().toISOString() });
      }
      
      await setDoc(ref, { questions }, { merge: true });
      return questionData.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteGlobalQuestion(questionId: string) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'global_questions_data');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let questions = snap.data().questions || [];
        questions = questions.filter((q: any) => q.id !== questionId);
        await setDoc(ref, { questions }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async getGlobalAcademicExams() {
    const path = 'settings';
    try {
      const snap = await getDoc(doc(db, path, 'global_academic_exams_data'));
      if (!snap.exists()) return [];
      return snap.data().exams || [];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  async saveGlobalAcademicExam(examData: any) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'global_academic_exams_data');
      const snap = await getDoc(ref);
      let exams = snap.exists() ? snap.data().exams || [] : [];
      
      if (examData.id) {
        const index = exams.findIndex((e: any) => e.id === examData.id);
        if (index > -1) {
          exams[index] = { ...examData, updatedAt: new Date().toISOString() };
        } else {
          exams.push({ ...examData, updatedAt: new Date().toISOString() });
        }
      } else {
        const newId = Math.random().toString(36).substring(2, 15);
        examData.id = newId;
        exams.push({ ...examData, id: newId, updatedAt: new Date().toISOString() });
      }
      
      await setDoc(ref, { exams }, { merge: true });
      return examData.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteGlobalAcademicExam(examId: string) {
    const path = 'settings';
    try {
      const ref = doc(db, path, 'global_academic_exams_data');
      const snap = await getDoc(ref);
      if (snap.exists()) {
        let exams = snap.data().exams || [];
        exams = exams.filter((e: any) => e.id !== examId);
        await setDoc(ref, { exams }, { merge: true });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveGlobalBook(bookData: any) {
    const path = 'global_books';
    try {
      if (bookData.id) {
        const ref = doc(db, path, bookData.id);
        const { id, ...cleanData } = bookData;
        await setDoc(ref, {
          ...cleanData,
          updatedAt: serverTimestamp()
        }, { merge: true });
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

  async updateGlobalBookTopicCounts(bookId: string, counts: Record<string, number>, fallbackBookData?: any) {
    const path = 'global_books';
    try {
      const ref = doc(db, path, bookId);
      const dataToSave: any = {
        topicQuestionCounts: counts,
        updatedAt: serverTimestamp()
      };
      if (fallbackBookData) {
        if (fallbackBookData.name || fallbackBookData.bookName) {
          dataToSave.name = fallbackBookData.name || fallbackBookData.bookName;
        }
        if (fallbackBookData.subject) {
          dataToSave.subject = fallbackBookData.subject;
        }
        if (fallbackBookData.type || fallbackBookData.resourceType) {
          dataToSave.type = fallbackBookData.type || fallbackBookData.resourceType;
        }
      }
      await setDoc(ref, dataToSave, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async deleteGlobalBook(bookId: string) {
    const path = 'global_books';
    try {
      await deleteDoc(doc(db, path, bookId));
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

  async deleteBookTracking(trackId: string) {
    const path = 'book_tracking';
    try {
      await deleteDoc(doc(db, path, trackId));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async updateBookProgress(trackId: string | null, data: any) {
    const path = 'book_tracking';
    const { id, ...cleanData } = data;
    try {
      if (trackId) {
        const ref = doc(db, path, trackId);
        await setDoc(ref, {
          ...cleanData,
          updatedAt: serverTimestamp()
        }, { merge: true });
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
  async getExamAnalysis(examId: string, studentId?: string) {
    const path = 'exam_analyses';
    try {
      const targetStudentId = studentId || auth.currentUser?.uid;
      if (!targetStudentId) return null;
      
      const q = query(
        collection(db, path), 
        where('examId', '==', examId),
        where('studentId', '==', targetStudentId)
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
        
        const examSnap = await getDoc(doc(db, 'exam_results', analysis.examId));
        let xpEarned = 100;
        if (examSnap.exists()) {
           const examType = examSnap.data().examType;
           xpEarned = (examType === 'BRANŞ' || examType === 'DERS') ? 80 : 300; // İki katına çıkarıldı
        }
        
        if (analysis.studentId) {
            await this.awardXP(analysis.studentId, xpEarned, 'Deneme Sınavı Analizi');
        }
        return ref.id;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async syncDailyProgramsWithExams(studentId: string, dates: string[], userData?: any) {
    if (!studentId || !dates || dates.length === 0) return;
    try {
      const allExams = await this.getExamResults(studentId);
      for (const dateStr of dates) {
        if (!dateStr) continue;

        const dateExams = allExams.filter((e: any) => 
          e.date === dateStr || (e.examType === 'YKS' && e.aytDate === dateStr)
        );

        const programs = await this.getDailyPrograms(studentId, [dateStr]);
        const program = (programs && programs.length > 0) ? programs[0] : null;
        const existingTasks = program?.tasks || [];

        const isDenemeTask = (t: any) => 
          t.topic?.includes('Deneme') || t.subject?.includes('Genel') || t.subject?.includes('YDT') || t.branch === 'Denemeler' || t.type === 'Deneme';

        const assignedDenemeTasks = existingTasks.filter((t: any) => isDenemeTask(t) && !t.id?.startsWith('exam-sync-'));
        const nonDenemeTasks = existingTasks.filter((t: any) => !isDenemeTask(t));

        const updatedDenemeTasks: any[] = [];

        for (let i = 0; i < dateExams.length; i++) {
          const exam = dateExams[i];

          const totalSolved = Object.values(exam.scores || {}).reduce((acc: number, curr: any) => {
            const c = Number((curr as any).c) || Number((curr as any).correct) || 0;
            const i = Number((curr as any).i) || Number((curr as any).incorrect) || 0;
            return acc + c + i;
          }, 0);

          const totalQuestions = Object.values(exam.scores || {}).reduce((acc: number, curr: any) => {
            const c = Number((curr as any).c) || Number((curr as any).correct) || 0;
            const i = Number((curr as any).i) || Number((curr as any).incorrect) || 0;
            const b = Number((curr as any).b) || Number((curr as any).blank) || 0;
            return acc + c + i + b;
          }, 0);

          const countToUse = exam.analyzed ? totalQuestions : totalSolved;

          if (i < assignedDenemeTasks.length) {
            updatedDenemeTasks.push({
              ...assignedDenemeTasks[i],
              isDone: true,
              isWaitingResult: false,
              completedCount: countToUse || assignedDenemeTasks[i].completedCount || 1,
              targetCount: countToUse || assignedDenemeTasks[i].targetCount || 1,
              examId: exam.id
            });
          } else {
            const subjectName = exam.examName || (dateStr === exam.aytDate ? (userData?.branch === 'DİL' ? 'YDT Genel Deneme' : 'AYT Genel Deneme') : (exam.examType === 'TYT' || exam.examType === 'YKS' ? 'TYT Genel Deneme' : exam.examType === 'YDT' ? 'YDT Genel Deneme' : 'Genel Deneme'));
            updatedDenemeTasks.push({
              id: 'exam-sync-' + exam.id,
              examId: exam.id,
              subject: subjectName,
              topic: 'Deneme Çözümü',
              type: 'Deneme',
              isDone: true,
              isExtra: true,
              targetCount: countToUse || 1,
              completedCount: countToUse || 1
            });
          }
        }

        for (let j = dateExams.length; j < assignedDenemeTasks.length; j++) {
          const taskToUpdate = { ...assignedDenemeTasks[j] };
          delete taskToUpdate.examId;
          const isWaiting = !!taskToUpdate.isWaitingResult;
          updatedDenemeTasks.push({
            ...taskToUpdate,
            isDone: isWaiting ? true : false,
            isWaitingResult: isWaiting,
            completedCount: isWaiting ? (taskToUpdate.completedCount || 0) : 0
          });
        }

        const finalTasks = [...nonDenemeTasks, ...updatedDenemeTasks];

        if (program) {
          await this.saveDailyProgram({ ...program, tasks: finalTasks });
        } else if (finalTasks.length > 0) {
          await this.saveDailyProgram({
            studentId,
            date: dateStr,
            tasks: finalTasks
          });
        }
      }
    } catch (err) {
      console.error('syncDailyProgramsWithExams error:', err);
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

  async autoCompleteMonthlyTopicGoal(studentId: string, subject: string, topic: string, dateStr: string, isDone: boolean) {
    const path = 'monthly_goals';
    try {
      const yearMonth = dateStr.slice(0, 7); // e.g. "2026-07"
      const docId = `${studentId}_${yearMonth}`;
      const ref = doc(db, path, docId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const goalData = snap.data();
        let topicGoals = goalData.topicGoals || [];
        let updated = false;
        topicGoals = topicGoals.map((tg: any) => {
          if (tg.subject?.trim().toLowerCase() === subject?.trim().toLowerCase() && 
              tg.topic?.trim().toLowerCase() === topic?.trim().toLowerCase()) {
            if (tg.isCompleted !== isDone) {
              updated = true;
              return { ...tg, isCompleted: isDone };
            }
          }
          return tg;
        });
        if (updated) {
          await updateDoc(ref, { topicGoals, updatedAt: serverTimestamp() });
        }
      }
    } catch (error) {
      console.error("Error auto completing monthly topic goal:", error);
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
      const coachId = studentData.coachId || studentData.assignedCoachId;

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
           await notificationService.addNotification(coachId, {
               title: 'Yetersiz Sistem Bakiyesi',
               message: `❌ İşlem Başarısız: Cüzdanınızda yeterli bakiye bulunmadığı için öğrenciniz '${studentData.firstName || ''} ${studentData.lastName || ''}'ın abonelik/satın alma işlemi gerçekleştirilemedi. Lütfen sisteme bakiye yükleyin.`,
               type: 'payment',
               link: '/panel/koc/cuzdan'
           });
           return { success: false, error: "Bu işlemi gerçekleştirebilmek için bağlı olduğunuz kurumun/koçun paket güncellemesi (veya ek yetkilendirmesi) gerekmektedir. Lütfen eğitim koçunuza bilgi veriniz." };
        }
        
        // Deduct from coach systematically
        await updateDoc(doc(db, usersPath, coachId), {
           systemBalance: currentSystemBalance - coachDeduction,
           updatedAt: serverTimestamp()
        });

        // Notify coach of successful deduction
        await notificationService.addNotification(coachId, {
            title: 'Satın Alım/Yenileme Kesintisi',
            message: `🧾 İşlem Başarılı: Öğrenciniz '${studentData.firstName || ''} ${studentData.lastName || ''}'ın ödemesi sebebiyle cüzdanınızdan ${coachDeduction} ₺ sistem payı kesildi.`,
            type: 'payment',
            link: '/panel/koc/cuzdan'
        });
        
        // Check critical balance warning
        const newCoachBalance = currentSystemBalance - coachDeduction;
        if (newCoachBalance < 500 && currentSystemBalance >= 500) { // arbitrary threshold, triggers once passing it
            await notificationService.addNotification(coachId, {
                title: 'Kritik Bakiye Uyarısı',
                message: `⚠️ Cüzdan bakiyeniz kritik seviyeye (${newCoachBalance} ₺) düşmüştür. Öğrencilerinizin yaklaşan abonelik yenilemelerinde kesinti yaşanmaması için lütfen bakiye yüklemesi yapın.`,
                type: 'system',
                link: '/panel/koc/cuzdan'
            });
        }
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
  },

  async getAIAssistantChatHistory(studentId: string) {
    const path = 'ai_chat_history';
    try {
      const snap = await getDoc(doc(db, path, studentId));
      if (snap.exists()) {
        return snap.data().messages || [];
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async saveAIAssistantChatHistory(studentId: string, messages: any[]) {
    messages = JSON.parse(JSON.stringify(messages));
    const path = 'ai_chat_history';
    try {
      await setDoc(doc(db, path, studentId), {
        messages,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error(error);
    }
  },

  async getParentAIAssistantChatHistory(parentId: string) {
    const path = 'parent_ai_chat_history';
    try {
      const snap = await getDoc(doc(db, path, parentId));
      if (snap.exists()) {
        return snap.data().messages || [];
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async saveParentAIAssistantChatHistory(parentId: string, messages: any[]) {
    messages = JSON.parse(JSON.stringify(messages));
    const path = 'parent_ai_chat_history';
    try {
      await setDoc(doc(db, path, parentId), {
        messages,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error(error);
    }
  },

  async getCoachAIChatViewCount(coachId: string, targetId: string) {
    try {
      const snap = await getDoc(doc(db, 'users', coachId, 'ai_chat_views', targetId));
      if (snap.exists()) {
        return snap.data().lastViewedMessageCount || 0;
      }
      return 0;
    } catch (error) {
      console.error(error);
      return 0;
    }
  },

  async updateCoachAIChatViewCount(coachId: string, targetId: string, count: number) {
    try {
      await setDoc(doc(db, 'users', coachId, 'ai_chat_views', targetId), {
        lastViewedMessageCount: count
      }, { merge: true });
    } catch (error) {
      console.error(error);
    }
  },

  async getAIAssistantSolverState(studentId: string) {
    const path = 'ai_solver_state';
    try {
      const snap = await getDoc(doc(db, path, studentId));
      if (snap.exists()) {
        return snap.data() || null;
      }
      return null;
    } catch (error) {
      console.error("Error fetching solver state:", error);
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async saveAIAssistantSolverState(studentId: string, state: any) {
    const cleanedState = sanitizeFirestorePayload(JSON.parse(JSON.stringify(state)));
    const path = 'ai_solver_state';
    try {
      await setDoc(doc(db, path, studentId), {
        ...cleanedState,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error saving solver state:", error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async saveSolvedQuestionHistory(studentId: string, item: {
    id?: string;
    subject: string;
    qText: string;
    qImagePreview?: string | null;
    solverResult: any;
    followUpMessages?: any[];
  }) {
    const path = `users/${studentId}/solved_questions`;
    try {
      const qId = item.id || Date.now().toString() + Math.random().toString(36).substring(2, 7);
      const rawData = {
        id: qId,
        subject: item.subject || 'Genel',
        qText: item.qText || '',
        qImagePreview: item.qImagePreview || null,
        solverResult: item.solverResult || null,
        followUpMessages: item.followUpMessages || [],
        createdAt: new Date().toISOString()
      };
      const cleanData = sanitizeFirestorePayload(JSON.parse(JSON.stringify(rawData)));

      await setDoc(doc(db, 'users', studentId, 'solved_questions', qId), {
        ...cleanData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      return qId;
    } catch (error) {
      console.error("Error saving solved question history:", error);
      handleFirestoreError(error, OperationType.WRITE, path);
      return null;
    }
  },

  async getSolvedQuestionHistory(studentId: string) {
    const path = `users/${studentId}/solved_questions`;
    try {
      const ref = collection(db, 'users', studentId, 'solved_questions');
      const q = query(ref, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const rawItems: any[] = [];
      snap.forEach(d => {
        rawItems.push({ id: d.id, ...d.data() });
      });

      // Deduplicate by ID and content signature
      const seenIds = new Set<string>();
      const deduplicatedMap = new Map<string, any>();

      for (const item of rawItems) {
        if (!item || !item.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);

        const textSig = `${(item.qText || '').trim()}|||${(item.solverResult?.text || '').trim()}`;
        if (textSig.length > 5) {
          if (deduplicatedMap.has(textSig)) {
            const existing = deduplicatedMap.get(textSig);
            // If current item has audio while existing doesn't, upgrade to current item
            if (!existing.solverResult?.audioDataUrl && item.solverResult?.audioDataUrl) {
              deduplicatedMap.set(textSig, item);
            }
          } else {
            deduplicatedMap.set(textSig, item);
          }
        } else {
          deduplicatedMap.set(item.id, item);
        }
      }

      return Array.from(deduplicatedMap.values());
    } catch (error) {
      console.error("Error getting solved question history:", error);
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async deleteSolvedQuestionHistory(studentId: string, questionId: string) {
    const path = `users/${studentId}/solved_questions/${questionId}`;
    try {
      await deleteDoc(doc(db, 'users', studentId, 'solved_questions', questionId));
      return true;
    } catch (error) {
      console.error("Error deleting solved question history:", error);
      handleFirestoreError(error, OperationType.DELETE, path);
      return false;
    }
  }
};
