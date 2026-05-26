import { db } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';

export interface AnalysisResult {
  userId: string;
  analysisType: string; // e.g., 'OZ-AF'
  data: any;
  timestamp: any;
}

export const analysisService = {
  async saveResult(userId: string, type: string, data: any): Promise<{ id: string }> {
    try {
      const docRef = await addDoc(collection(db, 'user_analyses'), {
        userId,
        analysisType: type,
        data,
        timestamp: Timestamp.now()
      });
      return { id: docRef.id };
    } catch (error) {
      console.error('Error saving analysis result:', error);
      throw error;
    }
  },

  async getResults(userId: string, type?: string): Promise<any[]> {
    try {
      let q = query(
        collection(db, 'user_analyses'), 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      if (type) {
        q = query(
          collection(db, 'user_analyses'),
          where('userId', '==', userId),
          where('analysisType', '==', type),
          orderBy('timestamp', 'desc')
        );
      }
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching analysis results:', error);
      throw error;
    }
  },

  async getResultById(id: string): Promise<any> {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(doc(db, 'user_analyses', id));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error fetching analysis result by id:', error);
      throw error;
    }
  },

  async updateResult(id: string, updateData: any) {
    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'user_analyses', id), updateData);
    } catch (error) {
      console.error('Error updating analysis result:', error);
      throw error;
    }
  }
};
