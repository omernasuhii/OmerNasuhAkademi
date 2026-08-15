import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { studentDataService } from './studentDataService';
import { notificationService } from './notificationService';
import { SUBSCRIPTION_PACKAGES, SubscriptionPackage } from '../pages/students/Subscription';

/**
 * Checks if a student's subscription is currently active and within its valid date range.
 */
export function matchPackage(planName: string, packages: SubscriptionPackage[]): SubscriptionPackage {
  if (!planName) return packages[1];
  
  const norm = planName.toLowerCase()
    .replace(/gümüş/g, 'gumus')
    .replace(/altın/g, 'altin')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u');

  // Check exact names or if plan contains package name
  for (const pkg of packages) {
    const pkgNorm = pkg.name.toLowerCase()
      .replace(/gümüş/g, 'gumus')
      .replace(/altın/g, 'altin')
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u');
      
    if (norm === pkgNorm || norm.includes(pkgNorm) || pkgNorm.includes(norm)) {
      return pkg;
    }
  }

  // Fallback to keyword matching
  if (norm.includes('altin') || norm.includes('gold')) {
    return packages.find(p => p.name.includes('Altın')) || packages[2];
  }
  if (norm.includes('gumus') || norm.includes('silver')) {
    return packages.find(p => p.name.includes('Gümüş')) || packages[1];
  }
  if (norm.includes('bronz') || norm.includes('bronze')) {
    return packages.find(p => p.name.includes('Bronz')) || packages[0];
  }

  return packages[1];
}

/**
 * Checks if a student's subscription is currently active and within its valid date range.
 */
export function isSubscriptionActive(studentData: any): boolean {
  if (!studentData || !studentData.subscriptionPlan) return false;
  if (studentData.subscriptionStatus !== 'active') return false;
  if (!studentData.subscriptionEndDate) return false;
  
  const endDate = new Date(studentData.subscriptionEndDate);
  return endDate.getTime() > Date.now();
}

let isChecking = false;

/**
 * Checks if subscription is expired.
 * If expired and student has enough wallet balance + autoRenew enabled,
 * automatically renews the subscription and deducts the balance.
 * If balance is insufficient or autoRenew disabled, marks subscriptionStatus as 'expired'.
 */
export async function checkAndRenewSubscription(
  userData: any, 
  userUid: string
): Promise<{ success: boolean; renewed?: boolean; message?: string }> {
  if (!userData || !userUid || isChecking) return { success: false };
  
  // Only process student profiles
  if (userData.role && userData.role !== 'student') return { success: false };

  const { subscriptionPlan, subscriptionEndDate, subscriptionStatus, autoRenew } = userData;

  if (!subscriptionPlan) return { success: false };

  const now = new Date();
  const endDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
  const isExpired = !endDate || now > endDate || subscriptionStatus === 'expired';

  // If subscription is currently valid and active, no action needed
  if (!isExpired && subscriptionStatus === 'active') {
    return { success: true };
  }

  isChecking = true;

  try {
    // 1. Calculate current pricing for packages
    let pBronze = 3000, pSilver = 4500, pGold = 6000;
    let rate = 20;
    let minRateBronze = 1000, minRateSilver = 1500, minRateGold = 2000;

    try {
      const finDoc = await getDoc(doc(db, 'settings', 'financial'));
      if (finDoc.exists()) {
        const data = finDoc.data();
        if (data.systemDeductionRate !== undefined) rate = data.systemDeductionRate;
        if (data.minSystemDeductionBronze !== undefined) minRateBronze = data.minSystemDeductionBronze;
        if (data.minSystemDeductionSilver !== undefined) minRateSilver = data.minSystemDeductionSilver;
        if (data.minSystemDeductionGold !== undefined) minRateGold = data.minSystemDeductionGold;
      } else {
        const sysDoc = await getDoc(doc(db, 'settings', 'system'));
        if (sysDoc.exists()) {
          const data = sysDoc.data();
          if (data.systemDeductionRate !== undefined) rate = data.systemDeductionRate;
          if (data.minSystemDeductionBronze !== undefined) minRateBronze = data.minSystemDeductionBronze;
          if (data.minSystemDeductionSilver !== undefined) minRateSilver = data.minSystemDeductionSilver;
          if (data.minSystemDeductionGold !== undefined) minRateGold = data.minSystemDeductionGold;
        }
      }

      const coachId = userData?.assignedCoachId || userData?.coachId;
      if (coachId) {
        const coachDoc = await getDoc(doc(db, 'users', coachId));
        if (coachDoc.exists()) {
          const cData = coachDoc.data();
          pBronze = cData.bronzePrice || 3000;
          pSilver = cData.silverPrice || 4500;
          pGold = cData.goldPrice || 6000;
          if (cData.specialDeductionRate !== undefined) rate = cData.specialDeductionRate;
          if (cData.specialMinDeductionBronze !== undefined) minRateBronze = cData.specialMinDeductionBronze;
          if (cData.specialMinDeductionSilver !== undefined) minRateSilver = cData.specialMinDeductionSilver;
          if (cData.specialMinDeductionGold !== undefined) minRateGold = cData.specialMinDeductionGold;
        }
      } else {
        const q = query(collection(db, 'users'), where('role', '==', 'coach'));
        const snapshot = await getDocs(q);
        let minB = 3000, minS = 4500, minG = 6000;
        let foundCoach = false;
        snapshot.forEach(d_doc => {
          const d = d_doc.data();
          foundCoach = true;
          if (d.bronzePrice && d.bronzePrice < minB) minB = d.bronzePrice;
          if (d.silverPrice && d.silverPrice < minS) minS = d.silverPrice;
          if (d.goldPrice && d.goldPrice < minG) minG = d.goldPrice;
        });
        if (foundCoach) {
          pBronze = Math.max(1000, minB);
          pSilver = Math.max(1500, minS);
          pGold = Math.max(2000, minG);
        }
      }
    } catch (e) {
      console.error("Error loading pricing for subscription check:", e);
    }

    const specialDiscounts = userData.specialDiscounts || {};
    const dBronze = specialDiscounts.bronze ? Math.floor(pBronze * (specialDiscounts.bronze / 100)) : 0;
    const dSilver = specialDiscounts.silver ? Math.floor(pSilver * (specialDiscounts.silver / 100)) : 0;
    const dGold = specialDiscounts.gold ? Math.floor(pGold * (specialDiscounts.gold / 100)) : 0;

    const packages: SubscriptionPackage[] = [
      { ...SUBSCRIPTION_PACKAGES[0], price: pBronze - dBronze, systemDeduction: Math.max(Math.floor(pBronze * (rate / 100)), minRateBronze) },
      { ...SUBSCRIPTION_PACKAGES[1], price: pSilver - dSilver, systemDeduction: Math.max(Math.floor(pSilver * (rate / 100)), minRateSilver) },
      { ...SUBSCRIPTION_PACKAGES[2], price: pGold - dGold, systemDeduction: Math.max(Math.floor(pGold * (rate / 100)), minRateGold) }
    ];

    const currentPkg = matchPackage(subscriptionPlan, packages);
    const cost = currentPkg.price;
    const systemDeduction = currentPkg.systemDeduction || 0;

    const walletBalance = userData.walletBalance || 0;

    // Auto-renew if permitted and student has sufficient balance
    if (autoRenew !== false && walletBalance >= cost) {
      const txResult = await studentDataService.addWalletTransaction(userUid, {
        amount: cost,
        type: 'WITHDRAWAL',
        description: `Otomatik Abonelik Yenileme: ${subscriptionPlan}`,
        coachDeductionAmount: systemDeduction,
        items: [{
          title: subscriptionPlan,
          quantity: 1,
          price: cost,
          type: 'subscription'
        }]
      });

      if (txResult.success) {
        const newStartDate = new Date().toISOString();
        const newEndDate = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();

        await studentDataService.updateStudentProfile(userUid, {
          subscriptionStartDate: newStartDate,
          subscriptionEndDate: newEndDate,
          subscriptionStatus: 'active',
          askedAiQuestionsCount: 0
        });

        await studentDataService.logSubscriptionHistory({
          studentId: userUid,
          studentName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Öğrenci',
          oldPlan: subscriptionPlan || 'Yok',
          newPlan: subscriptionPlan || 'Bilinmiyor',
          action: 'renewed',
          startDate: newStartDate,
          endDate: newEndDate
        });

        await notificationService.addNotification(userUid, {
          title: 'Abonelik Yenilendi',
          message: `Harika! ${subscriptionPlan} paketin cüzdan bakiyen ile otomatik yenilendi. Kesintisiz eğitime devam edebilirsin. 🚀`,
          type: 'success',
          link: '/panel/ogrenci/abonelik'
        });

        return { success: true, renewed: true, message: `Aboneliğiniz ₺${cost} karşılığında başarıyla yenilendi.` };
      } else {
        if (subscriptionStatus !== 'expired') {
          await studentDataService.updateStudentProfile(userUid, {
            subscriptionStatus: 'expired'
          });

          await notificationService.addNotification(userUid, {
            title: 'Abonelik Yenilenemedi',
            message: `⚠️ İşlem Tamamlanamadı: Koçunuz kaynaklı bir durum sebebiyle yenileme yapılamadı. Lütfen koçunuzla iletişime geçin.`,
            type: 'payment',
            link: '/panel/ogrenci/abonelik'
          });
        }
        return { success: false, message: txResult.error || 'Yenileme işlemi yapılamadı.' };
      }
    } else {
      // Balance insufficient or autoRenew disabled -> set status to expired
      if (subscriptionStatus !== 'expired') {
        await studentDataService.updateStudentProfile(userUid, {
          subscriptionStatus: 'expired'
        });

        await notificationService.addNotification(userUid, {
          title: autoRenew === false ? 'Abonelik Sona Erdi' : 'Abonelik Süresi Doldu',
          message: autoRenew === false
            ? `${subscriptionPlan} paketinizin süresi doldu ve otomatik yenileme kapalı olduğu için aboneliğiniz sona erdi.`
            : `Cüzdanınızda yeterli bakiye (Gerekli: ₺${cost}) bulunmadığı için ${subscriptionPlan} paketiniz yenilenemedi. Cüzdanınıza bakiye yükleyerek hemen aktif edebilirsiniz.`,
          type: 'payment',
          link: '/panel/ogrenci/abonelik'
        });
      }
      return { success: false, message: `Yetersiz bakiye (Gerekli: ₺${cost}) veya otomatik yenileme kapalı.` };
    }
  } catch (err) {
    console.error("checkAndRenewSubscription error:", err);
    return { success: false };
  } finally {
    isChecking = false;
  }
}
