import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  Timestamp, 
  doc, 
  setDoc, 
  getDoc, 
  runTransaction 
} from 'firebase/firestore';

export interface BankTransaction {
  id?: string;
  userId: string;
  amount: number; // Positive for income, negative for expense
  description: string;
  type: 'income' | 'expense';
  timestamp: any;
}

export interface BankState {
  balance: number;
  lastUpdated: any;
}

export const chocolateBankService = {
  async getBankStatus(userId: string) {
    try {
      const docRef = doc(db, 'chocolate_bank_status', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data() as BankState;
      } else {
        // Initialize if not exists
        const initialState = { balance: 0, lastUpdated: Timestamp.now() };
        await setDoc(docRef, initialState);
        return initialState;
      }
    } catch (error) {
      console.error('Error getting bank status:', error);
      throw error;
    }
  },

  async getTransactions(userId: string, limit = 50) {
    try {
      const q = query(
        collection(db, 'chocolate_bank_transactions'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BankTransaction[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  async addTransaction(userId: string, amount: number, description: string, type: 'income' | 'expense') {
    try {
      await runTransaction(db, async (transaction) => {
        const statusRef = doc(db, 'chocolate_bank_status', userId);
        const statusDoc = await transaction.get(statusRef);
        
        let currentBalance = 0;
        if (statusDoc.exists()) {
          currentBalance = statusDoc.data().balance || 0;
        }

        const newBalance = currentBalance + amount;
        
        // Final Rule 1 Check: No credit allowed
        if (newBalance < 0 && type === 'expense') {
          const bizError = new Error('Yetersiz Çikolata Puanı! Önce çalışarak puan kazanmalısın.');
          (bizError as any).isBusinessRule = true;
          throw bizError;
        }

        // Update status
        transaction.set(statusRef, {
          balance: newBalance,
          lastUpdated: Timestamp.now()
        }, { merge: true });

        // Add transaction log
        const logRef = doc(collection(db, 'chocolate_bank_transactions'));
        transaction.set(logRef, {
          userId,
          amount,
          description,
          type,
          timestamp: Timestamp.now()
        });
      });
    } catch (error: any) {
      if (!error.isBusinessRule) {
        console.error('Transaction failed:', error);
      }
      throw error;
    }
  }
};
