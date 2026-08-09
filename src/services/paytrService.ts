import { doc, getDoc, setDoc, addDoc, collection, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface PayTRSettings {
  merchantId: string;
  merchantKey: string;
  merchantSalt: string;
  isTestMode: boolean;
  isActive: boolean;
}

export interface PayTRPaymentRequest {
  coachId: string;
  coachEmail: string;
  coachName: string;
  coachPhone?: string;
  amount: number; // TL
}

export const paytrService = {
  getSettings: async (): Promise<PayTRSettings> => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'paytr'));
      if (snap.exists()) {
        return snap.data() as PayTRSettings;
      }
    } catch (e) {
      console.error('Error fetching PayTR settings:', e);
    }
    return {
      merchantId: process.env.PAYTR_MERCHANT_ID || '342819',
      merchantKey: process.env.PAYTR_MERCHANT_KEY || 'MOCK_KEY_123',
      merchantSalt: process.env.PAYTR_MERCHANT_SALT || 'MOCK_SALT_123',
      isTestMode: true,
      isActive: true
    };
  },

  saveSettings: async (settings: PayTRSettings): Promise<boolean> => {
    try {
      await setDoc(doc(db, 'settings', 'paytr'), settings, { merge: true });
      return true;
    } catch (e) {
      console.error('Error saving PayTR settings:', e);
      return false;
    }
  },

  /**
   * Generates a payment order and requests a PayTR token
   */
  createPaymentToken: async (req: PayTRPaymentRequest) => {
    try {
      const merchantOid = 'POS-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      
      const res = await fetch('/api/paytr/create-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...req,
          merchantOid
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'PayTR token oluşturulamadı');
      }

      const data = await res.json();
      return {
        success: true,
        token: data.token,
        iframeUrl: data.iframeUrl || `https://www.paytr.com/iframe/${data.token}`,
        merchantOid
      };
    } catch (err: any) {
      console.error('PayTR payment token error:', err);
      return {
        success: false,
        error: err.message || 'Ödeme başlatılamadı'
      };
    }
  },

  /**
   * Complete test payment (Used in preview/test mode before live merchant activation)
   */
  completeTestPayment: async (coachId: string, amount: number, merchantOid: string) => {
    try {
      const coachRef = doc(db, 'users', coachId);
      await updateDoc(coachRef, {
        systemBalance: increment(amount)
      });

      // Record transaction
      await addDoc(collection(db, 'wallet_transactions'), {
        studentId: coachId, // studentId holds recipient ID in sys txs
        coachId: 'SYSTEM',
        amount: amount,
        type: 'DEPOSIT',
        description: `💳 Kredi Kartı ile Bakiye Yükleme (PayTR 3D Secure - ${merchantOid})`,
        date: new Date().toISOString(),
        paymentProvider: 'PayTR',
        merchantOid: merchantOid,
        status: 'SUCCESS'
      });

      // Trigger referral bonus for coach deposit if applicable
      try {
        const { referralService } = await import('./referralService');
        await referralService.processCoachDepositReferral(coachId, amount);
      } catch (refErr) {
        console.error('Referral deposit bonus error:', refErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error('Error completing test deposit payment:', err);
      return { success: false, error: err.message };
    }
  }
};
