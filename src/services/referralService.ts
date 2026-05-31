import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from './appointmentService';

export interface ReferralSettings {
  isActive: boolean;
  rewardType: 'percent' | 'balance';
  referrerReward: number;
  refereeReward: number;
  minUsageThreshold: number;
  expirationDays: number;
  notifyOnSuccess: boolean;
}

export const referralService = {
  getSettings: async (): Promise<ReferralSettings | null> => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'referral'));
      if (snap.exists()) {
        return snap.data() as ReferralSettings;
      }
      return {
        isActive: true,
        rewardType: 'percent',
        referrerReward: 10,
        refereeReward: 10,
        minUsageThreshold: 1,
        expirationDays: 30,
        notifyOnSuccess: true,
      };
    } catch (error) {
      console.error('Error fetching referral settings:', error);
      return null;
    }
  },

  updateSettings: async (settings: ReferralSettings): Promise<void> => {
    try {
      await setDoc(doc(db, 'settings', 'referral'), {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating referral settings:', error);
    }
  },

  processReferralUsage: async (userId: string, code: string) => {
    // When the referred user completes a task or registers, check the referral
  },

  applyCouponOrReferral: async (code: string, userId: string, totalPrice: number) => {
    // This is essentially just querying if the code matches a global coupon or a user's referral code.
    const cleanCode = code.trim().toUpperCase();
    
    // First, check if it's a fixed coupon (e.g. FOCUS50, REF10)
    // For demo purposes, keeping hardcoded ones or searching coupons
    if (cleanCode === 'FOCUS50') return { discountPercent: 50, discountTL: 0, code: cleanCode, type: 'coupon' };
    
    // Second, if it's a referral code
    const settings = await referralService.getSettings();
    if (!settings || !settings.isActive) return null;

    // Check if any user owns this code
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const referrerId = snap.docs[0].id;
        if (referrerId === userId) {
          // Cannot use own code
          throw new Error('Kendi davet kodunuzu kullanamazsınız.');
        }

        // Return the specific discount for the Referee
        if (settings.rewardType === 'percent') {
          return { discountPercent: settings.refereeReward, discountTL: 0, code: cleanCode, type: 'referral', referrerId };
        } else {
          return { discountPercent: 0, discountTL: settings.refereeReward, code: cleanCode, type: 'referral', referrerId };
        }
      }
    } catch (error) {
      console.error(error);
    }

    return null;
  },

  markReferralUsed: async (referrerId: string, refereeId: string) => {
    // Increment the usage for the referrer
    const settings = await referralService.getSettings();
    if (!settings || !settings.isActive) return;

    try {
      const dbRef = doc(db, 'users', referrerId);
      const userSnap = await getDoc(dbRef);
      if (userSnap.exists()) {
         const data = userSnap.data();
         let refCount = data.referralCount || 0;
         let refEarnings = data.referralEarnings || 0;

         refCount += 1;
         if (settings.rewardType === 'percent') {
            // Can't just "add percent" to earnings. Percent coupons given to referrer?
            // Actually, if a referee finishes a purchase, the referrer gets a reward.
            // Maybe we just log that they earned a reward. For now, just increment count.
         } else {
            refEarnings += settings.referrerReward;
            // add to wallet?
            const currentWallet = data.walletBalance || 0;
            updateDoc(dbRef, { walletBalance: currentWallet + settings.referrerReward });
         }

         await updateDoc(dbRef, {
           referralCount: refCount,
           referralEarnings: refEarnings,
         });

         // Log to referral_history
         await addDoc(collection(db, 'referral_history'), {
            referrerId,
            refereeId,
            date: new Date().toISOString(),
            rewardType: settings.rewardType,
            amount: settings.referrerReward,
            createdAt: serverTimestamp()
         });
      }
    } catch(err) {
      console.error(err);
    }
  }
};
