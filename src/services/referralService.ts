import { doc, getDoc, setDoc, serverTimestamp, updateDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from './appointmentService';
import { notificationService } from './notificationService';

export interface ReferralSettings {
  isActive: boolean;
  rewardType: 'percent' | 'balance';
  referrerReward: number;
  refereeReward: number;
  minUsageThreshold: number;
  expirationDays: number;
  notifyOnSuccess: boolean;
  discountPayer?: 'system' | 'coach' | 'proportional';

  // Coach Referral System Settings
  coachReferralActive?: boolean;
  coachDepositGiftType?: 'percent' | 'amount';
  coachDepositGiftValue?: number;
  coachReferrerRewardValue?: number;
}

export interface ReferralProcessResult {
  success: boolean;
  code: 'INVALID' | 'COACH_CODE' | 'SELF' | 'INACTIVE' | 'SUCCESS' | 'ERROR';
  message: string;
}

export const referralService = {
  getSettings: async (): Promise<ReferralSettings | null> => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'referral'));
      if (snap.exists()) {
        const data = snap.data() as ReferralSettings;
        return {
          ...data,
          discountPayer: data.discountPayer || 'system',
          coachReferralActive: data.coachReferralActive ?? true,
          coachDepositGiftType: data.coachDepositGiftType || 'percent',
          coachDepositGiftValue: data.coachDepositGiftValue ?? 5,
          coachReferrerRewardValue: data.coachReferrerRewardValue ?? 5,
        };
      }
      return {
        isActive: true,
        rewardType: 'percent',
        referrerReward: 10,
        refereeReward: 10,
        minUsageThreshold: 1,
        expirationDays: 30,
        notifyOnSuccess: true,
        discountPayer: 'system',
        coachReferralActive: true,
        coachDepositGiftType: 'percent',
        coachDepositGiftValue: 5,
        coachReferrerRewardValue: 5,
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

  processReferralRegistration: async (newUserId: string, referralCode: string): Promise<ReferralProcessResult> => {
    console.log(`[Referral Process] Başlıyor. newUserId: ${newUserId}, referralCode: ${referralCode}`);
    const cleanCode = referralCode.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, code: 'INVALID', message: 'Davet kodu girilmedi.' };
    }

    try {
      // Get newly registered user data
      const newUserSnap = await getDoc(doc(db, 'users', newUserId));
      const newUserData = newUserSnap.exists() ? newUserSnap.data() : {};
      const newUserRole = newUserData?.role || 'student';

      // Find the referrer
      console.log(`[Referral Process] Referans kodu ile kullanıcı aranıyor: ${cleanCode}`);
      const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        console.log(`[Referral Process] Hata: Bu referans koduna sahip kullanıcı bulunamadı.`);
        return {
          success: false,
          code: 'INVALID',
          message: `Girdiğiniz "${cleanCode}" davet kodu sistemde bulunamadı veya geçersiz.`
        };
      }
      
      const referrerDoc = snap.docs[0];
      const referrerId = referrerDoc.id;
      const referrerData = referrerDoc.data();
      const referrerRole = referrerData?.role || 'student';

      if (referrerId === newUserId) {
        console.log(`[Referral Process] Hata: Kullanıcı kendini davet edemez.`);
        return {
          success: false,
          code: 'SELF',
          message: 'Kendi davet kodunuzu kullanamazsınız.'
        };
      }

      // Strict role separation constraint: Coach invites Coach, Student invites Student
      if (newUserRole === 'coach' && referrerRole !== 'coach') {
        console.log(`[Referral Process] İptal: Koçlar yalnızca bir Koç'un davet kodunu kullanabilir.`);
        return {
          success: false,
          code: 'INVALID',
          message: `Girdiğiniz "${cleanCode}" kodu bir Öğrenci Davet Kodudur. Koç kaydında yalnızca bir Koç'un davet kodunu kullanabilirsiniz.`
        };
      }

      if (newUserRole !== 'coach' && referrerRole === 'coach') {
        console.log(`[Referral Process] İptal: Öğrenciler yalnızca bir Öğrenci'nin davet kodunu kullanabilir.`);
        return {
          success: false,
          code: 'COACH_CODE',
          message: `Girdiğiniz "${cleanCode}" kodu bir Koç Davet Kodudur. Öğrenci davet alanında sadece başka bir öğrencinin davet kodunu kullanabilirsiniz. Koçunuz ile eşleşmek için lütfen "Koç Kodu" alanını kullanınız.`
        };
      }

      // --- COACH REFERRAL LOGIC ---
      if (newUserRole === 'coach' && referrerRole === 'coach') {
        // Update referrer coach's referral count
        const refCount = (referrerData.referralCount || 0) + 1;
        await updateDoc(doc(db, 'users', referrerId), {
          referralCount: refCount,
        });

        // Log to referral_history
        await addDoc(collection(db, 'referral_history'), {
          referrerId,
          refereeId: newUserId,
          type: 'coach_referral',
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });

        // Send notification to referrer coach
        await notificationService.addNotification(referrerId, {
          title: '🎉 Yeni Koç Daveti!',
          message: `${newUserData.firstName || ''} ${newUserData.lastName || ''} sizin davet kodunuzla katıldı! Yapacağı her bakiye yüklemesinde hediye sistem bakiyesi kazanacaksınız.`,
          type: 'system',
          link: '/panel/koc/cuzdan'
        });

        console.log(`[Referral Process] Koç referansı başarıyla işlendi.`);
        return {
          success: true,
          code: 'SUCCESS',
          message: `Davet kodu (${cleanCode}) başarıyla uygulandı!`
        };
      }

      // --- STUDENT REFERRAL LOGIC ---
      const settings = await referralService.getSettings();
      console.log(`[Referral Process] Settings alındı:`, settings);
      if (!settings || !settings.isActive) {
        console.log(`[Referral Process] İptal: Referans sistemi inaktif veya ayarlar alınamadı.`);
        return {
          success: false,
          code: 'INACTIVE',
          message: 'Davet ve referans ödül sistemi şu anda aktif değil.'
        };
      }

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + (settings.expirationDays || 30));
      const endDateIso = expirationDate.toISOString().split('T')[0];

      // Add coupon for the referee (new student)
      const refereeCouponCode = `REF-${newUserId.substring(0, 6).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`[Referral Process] Davet edilen (yeni kayıt) için kupon oluşturuluyor: ${refereeCouponCode}`);
      await addDoc(collection(db, 'coupons'), {
        code: refereeCouponCode,
        name: 'Davet İndirimi (Yeni Kayıt)',
        type: settings.rewardType === 'percent' ? 'percentage' : 'amount',
        discount: settings.refereeReward,
        noEndDate: false,
        endDate: endDateIso,
        limitUsage: true,
        maxUsage: 1,
        currentUsage: 0,
        ownerId: newUserId,
        status: 'active',
        onlyForSubscriptions: true,
        generatedFrom: 'referral',
        createdAt: serverTimestamp(),
      });
      console.log(`[Referral Process] Davet edilenin kuponu başarıyla oluşturuldu.`);

      // Add coupon for the referrer student
      const referrerCouponCode = `REF-${referrerId.substring(0, 6).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
      console.log(`[Referral Process] Davet eden için kupon oluşturuluyor: ${referrerCouponCode}`);
      await addDoc(collection(db, 'coupons'), {
        code: referrerCouponCode,
        name: 'Davet Ödülü',
        type: settings.rewardType === 'percent' ? 'percentage' : 'amount',
        discount: settings.referrerReward,
        noEndDate: false,
        endDate: endDateIso,
        limitUsage: true,
        maxUsage: 1,
        currentUsage: 0,
        ownerId: referrerId,
        status: 'pending', // wait for referee's action
        onlyForSubscriptions: true,
        refereeId: newUserId,
        generatedFrom: 'referral',
        createdAt: serverTimestamp(),
      });
      console.log(`[Referral Process] Davet edenin kuponu başarıyla oluşturuldu.`);

      // Update the referrer's referral count
      console.log(`[Referral Process] Davet edenin referans sayısı güncelleniyor...`);
      const refCount = (referrerData.referralCount || 0) + 1;
      await updateDoc(doc(db, 'users', referrerId), {
        referralCount: refCount,
      });
      console.log(`[Referral Process] Davet edenin referans sayısı başarıyla güncellendi. Yeni sayı: ${refCount}`);

      // Log to referral_history
      console.log(`[Referral Process] Geçmiş (referral_history) tablosuna kayıt ekleniyor...`);
      await addDoc(collection(db, 'referral_history'), {
        referrerId,
        refereeId: newUserId,
        type: 'student_referral',
        date: new Date().toISOString(),
        rewardType: settings.rewardType,
        amount: settings.referrerReward,
        createdAt: serverTimestamp()
      });
      console.log(`[Referral Process] Geçmiş kaydı başarıyla oluşturuldu. İşlem Tümüyle Başarılı!`);

      // Send in-app notification to new student
      await notificationService.addNotification(newUserId, {
        title: '🎉 Davet Kodu Uygulandı!',
        message: `${cleanCode} davet kodu ile kaydolduğunuz için hoş geldin indirim kuponunuz cüzdanınıza tanımlandı.`,
        type: 'system',
        link: '/panel/ogrenci/cuzdan'
      });

      return {
        success: true,
        code: 'SUCCESS',
        message: `Davet kodu (${cleanCode}) başarıyla uygulandı! Hoş geldin indirim kuponunuz cüzdanınıza tanımlandı.`
      };

    } catch (error: any) {
      console.error('[Referral Process] Beklenmeyen Hata Oluştu:', error);
      return {
        success: false,
        code: 'ERROR',
        message: 'Davet kodu işlenirken bir hata oluştu.'
      };
    }
  },

  applyCouponOrReferral: async (code: string, userId: string, totalPrice: number, itemTypes?: string[]) => {
    const cleanCode = code.trim().toUpperCase();
    
    if (cleanCode === 'FOCUS50') return { discountPercent: 50, discountTL: 0, code: cleanCode, type: 'coupon' };
    
    // Fetch user doc once
    let userDocData: any = null;
    try {
      const uSnap = await getDoc(doc(db, 'users', userId));
      if (uSnap.exists()) {
        userDocData = uSnap.data();
      }
    } catch (e) {
      console.error(e);
    }
    
    // First: Check if this is a real coupon in coupons collection
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', cleanCode));
      const snap = await getDocs(q);
      
      let targetCouponDoc = null;
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        
        // Ownership check
        if (data.ownerId && data.ownerId !== userId) {
            continue; // Owned by another user (e.g. referral)
        }

        // Applicability check for admin coupons
        if (!data.ownerId) {
            if (data.userApplicability === 'specific_users') {
              if (!userDocData || !userDocData.email) continue;
              const targets = data.targetUserEmails ? data.targetUserEmails.split(',').map((e:string) => e.trim().toLowerCase()) : [];
              if (!targets.includes(userDocData.email.toLowerCase())) {
                continue;
              }
            } else if (data.userApplicability === 'coach_users') {
              if (!userDocData || userDocData.assignedCoachId !== data.targetCoachId) {
                continue; // Not assigned to this coach
              }
            }
        }
        
        targetCouponDoc = docSnap;
        break;
      }

      if (targetCouponDoc) {
        const couponDoc = targetCouponDoc;
        const coupon = couponDoc.data();

        if (coupon.status === 'pending') {
          throw new Error('Bu kupon şu an beklemede. Davet ettiğiniz kişi koşulları sağladığında aktif olacaktır.');
        }
        if (coupon.status === 'used' || (coupon.limitUsage && (coupon.currentUsage || 0) >= coupon.maxUsage)) {
          throw new Error('Bu kupon zaten kullanılmış veya kullanım limitine ulaşmış.');
        }
        if (!coupon.noEndDate && coupon.endDate && new Date(coupon.endDate) < new Date()) {
          throw new Error('Bu kuponun süresi dolmuş.');
        }
        
        // Check per-user limit
        if (coupon.limitPerUser && coupon.maxUsagePerUser) {
           const myUsage = (coupon.usedBy && coupon.usedBy[userId]) || 0;
           if (myUsage >= coupon.maxUsagePerUser) {
              throw new Error(`Bu kuponu kişi başı maksimum kullanım limitine (${coupon.maxUsagePerUser} kez) ulaştınız.`);
           }
        }

        if (coupon.validity && coupon.validity !== 'all' && coupon.validity !== 'all_purchases' && itemTypes) {
           if (coupon.validity === 'all_subscriptions') {
              const onlySubscriptions = itemTypes.length > 0 && itemTypes.every(i => i === 'subscription');
              if (!onlySubscriptions) throw new Error('Bu kupon yalnızca abonelik alımlarında geçerlidir.');
           }
           else if (coupon.validity === 'all_products') {
              const onlyProducts = itemTypes.length > 0 && itemTypes.every(i => i === 'product');
              if (!onlyProducts) throw new Error('Bu kupon yalnızca mağaza ürünlerinde geçerlidir.');
           }
           else if (coupon.validity === 'all_programs') {
              const onlyPrograms = itemTypes.length > 0 && itemTypes.every(i => i === 'course');
              if (!onlyPrograms) throw new Error('Bu kupon yalnızca program/kurs alımlarında geçerlidir.');
           }
           else if (coupon.validity.includes('event') || coupon.validity.includes('ticket')) {
              const onlyEvents = itemTypes.length > 0 && itemTypes.every(i => i === 'event' || i === 'ticket');
              if (!onlyEvents) throw new Error('Bu kupon yalnızca etkinlik biletlerinde geçerlidir.');
           }
           else if (coupon.validity === 'all_services') {
              const onlyServices = itemTypes.length > 0 && itemTypes.every(i => i === 'service' || i === 'appointment');
              if (!onlyServices) throw new Error('Bu kupon yalnızca hizmet/randevu alımlarında geçerlidir.');
           }
        }

        return {
          discountPercent: coupon.type === 'percentage' ? coupon.discount : 0,
          discountTL: coupon.type === 'amount' ? coupon.discount : 0,
          code: cleanCode,
          type: 'coupon',
          couponId: couponDoc.id
        };
      }
    } catch (error: any) {
      if (error.message.includes('kupon')) throw error;
    }

    // Fallback: Check if it's someone's referral code 
    const settings = await referralService.getSettings();
    if (!settings || !settings.isActive) return null;

    // Check if any user owns this code
    try {
      const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const referrerDoc = snap.docs[0];
        const referrerId = referrerDoc.id;
        const referrerData = referrerDoc.data();

        if (referrerData?.role === 'coach') {
          throw new Error('Koç davet kodları mağaza veya abonelik indirimlerinde kullanılamaz.');
        }

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
    } catch (error: any) {
      if (error?.message) throw error;
      console.error(error);
    }

    return null;
  },

  activatePendingCouponsForReferee: async (refereeId: string) => {
    try {
      const settings = await referralService.getSettings();
      if (!settings || !settings.isActive) return;
      const threshold = settings.minUsageThreshold || 1;

      const q = query(collection(db, 'coupons'), where('refereeId', '==', refereeId), where('status', '==', 'pending'));
      const snap = await getDocs(q);

      for (const docSnap of snap.docs) {
        const couponData = docSnap.data();
        const currentPurchases = (couponData.refereePurchases || 0) + 1;

        if (currentPurchases >= threshold) {
          await updateDoc(docSnap.ref, {
            status: 'active',
            refereePurchases: currentPurchases
          });
          
          // Notice: If rewardType is balance, we should ideally add to wallet, but currently we just activate the coupon.
          // In a real app we'd update referrer's walletBalance here if there's no coupon involved.
        } else {
          await updateDoc(docSnap.ref, {
            refereePurchases: currentPurchases
          });
        }
      }
    } catch (error) {
      console.error('Error activating pending coupons:', error);
    }
  },

  markCouponUsed: async (couponId: string, userId?: string) => {
    try {
      const dbRef = doc(db, 'coupons', couponId);
      const snap = await getDoc(dbRef);
      if (snap.exists()) {
        const data = snap.data();
        let currentUsage = (data.currentUsage || 0) + 1;
        let status = data.status || 'active';
        if (data.limitUsage && currentUsage >= data.maxUsage) {
          status = 'used';
        }
        
        let updates: any = { currentUsage, status };

        if (userId) {
          const usedBy = data.usedBy || {};
          usedBy[userId] = (usedBy[userId] || 0) + 1;
          updates.usedBy = usedBy;
        }

        await updateDoc(dbRef, updates);
      }
    } catch(err) {
      console.error(err);
    }
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
  },

  processCoachDepositReferral: async (coachId: string, depositAmount: number) => {
    if (!coachId || depositAmount <= 0) return;
    try {
      const settings = await referralService.getSettings();
      if (!settings || settings.coachReferralActive === false) return;

      const coachSnap = await getDoc(doc(db, 'users', coachId));
      if (!coachSnap.exists()) return;
      const coachData = coachSnap.data();
      if (coachData?.role !== 'coach') return;

      const cleanCode = coachData.referredByCode ? coachData.referredByCode.trim().toUpperCase() : null;
      if (!cleanCode) return;

      // Find the inviter coach or user
      const q = query(collection(db, 'users'), where('referralCode', '==', cleanCode));
      const snap = await getDocs(q);
      if (snap.empty) return;

      const referrerDoc = snap.docs[0];
      const referrerId = referrerDoc.id;
      const referrerData = referrerDoc.data();
      if (referrerData?.role !== 'coach') return;

      if (referrerId === coachId) return;

      // 1. Calculate gift for depositing coach (ONLY ON FIRST DEPOSIT)
      if (!coachData.hasReceivedFirstDepositGift) {
        // Check previous transactions to ensure they haven't received it before this code change
        const checkQ = query(collection(db, 'wallet_transactions'), where('studentId', '==', coachId), where('type', '==', 'DEPOSIT'));
        const checkSnap = await getDocs(checkQ);
        const hasGottenBefore = checkSnap.docs.some(d => 
          d.data().description?.includes('Davet Bakiye Yükleme Hediyesi') || 
          d.data().description?.includes('İlk Bakiye Yükleme')
        );

        if (!hasGottenBefore) {
          let giftAmount = 0;
          if (settings.coachDepositGiftType === 'amount') {
            giftAmount = settings.coachDepositGiftValue || 50;
          } else {
            const giftPercent = settings.coachDepositGiftValue || 5;
            giftAmount = Math.round(depositAmount * (giftPercent / 100));
          }

          if (giftAmount > 0) {
            const currentBalance = coachData.systemBalance || 0;
            await updateDoc(doc(db, 'users', coachId), {
              systemBalance: currentBalance + giftAmount,
              hasReceivedFirstDepositGift: true,
              updatedAt: serverTimestamp()
            });

            await addDoc(collection(db, 'wallet_transactions'), {
              studentId: coachId,
              coachId: 'SYSTEM',
              amount: giftAmount,
              type: 'DEPOSIT',
              description: `🎁 İlk Bakiye Yükleme Hediyesi (Davet Kodu ile)`,
              date: new Date().toISOString(),
              createdAt: serverTimestamp()
            });

            await notificationService.addNotification(coachId, {
              title: '🎁 İlk Bakiye Yükleme Hediyesi!',
              message: `Tebrikler! Davet referansı ile gerçekleştirdiğiniz ilk bakiye yüklemesine istinaden cüzdanınıza ₺${giftAmount} hediye sistem bakiyesi eklendi!`,
              type: 'payment',
              link: '/panel/koc/cuzdan'
            });
          }
        } else {
          // Flag them so we skip the query next time
          await updateDoc(doc(db, 'users', coachId), {
            hasReceivedFirstDepositGift: true,
            updatedAt: serverTimestamp()
          });
        }
      }

      // 2. Calculate reward for inviter coach (referrer)
      let referrerRewardAmount = 0;
      if (settings.coachDepositGiftType === 'amount') {
        referrerRewardAmount = settings.coachReferrerRewardValue || 50;
      } else {
        const referrerPercent = settings.coachReferrerRewardValue || 5;
        referrerRewardAmount = Math.round(depositAmount * (referrerPercent / 100));
      }

      if (referrerRewardAmount > 0) {
        const currentReferrerBalance = referrerData.systemBalance || 0;
        await updateDoc(doc(db, 'users', referrerId), {
          systemBalance: currentReferrerBalance + referrerRewardAmount,
          updatedAt: serverTimestamp()
        });

        await addDoc(collection(db, 'wallet_transactions'), {
          studentId: referrerId,
          coachId: 'SYSTEM',
          amount: referrerRewardAmount,
          type: 'DEPOSIT',
          description: `🎉 Davet Ettiğiniz Koç Yükleme Ödülü (${coachData.firstName || ''} ${coachData.lastName || ''})`,
          date: new Date().toISOString(),
          createdAt: serverTimestamp()
        });

        await notificationService.addNotification(referrerId, {
          title: '🎉 Referans Koç Bakiye Ödülü!',
          message: `Davet ettiğiniz koç (${coachData.firstName || ''} ${coachData.lastName || ''}) ₺${depositAmount} bakiye yükledi! Cüzdanınıza ₺${referrerRewardAmount} referans hediyesi tanımlandı.`,
          type: 'payment',
          link: '/panel/koc/cuzdan'
        });
      }
    } catch (err) {
      console.error('Error processing coach deposit referral:', err);
    }
  },

  getReferralStats: async () => {
    try {
      // 1. Get coupons created via referral to see referee stats (Student)
      const qCoupons = query(collection(db, 'coupons'), where('description', '>=', 'Referans'), where('description', '<=', 'Referans' + '\uf8ff'));
      const couponsSnap = await getDocs(qCoupons);
      
      let totalStudentDiscounts = 0; // The amount of money discounted for students
      
      couponsSnap.forEach(doc => {
        const data = doc.data();
        if (data.type === 'balance' && data.status === 'used') {
          totalStudentDiscounts += data.value || 0;
        } else if (data.type === 'percent' && data.status === 'used') {
          // If we had the exact original amount we could calculate exact, but let's approximate or just count uses
        }
      });

      // 2. Get wallet_transactions to see system gifts given to coaches/students
      const qSystemTx = query(collection(db, 'wallet_transactions'), where('coachId', '==', 'SYSTEM'));
      const sysTxSnap = await getDocs(qSystemTx);
      
      let totalCoachGifts = 0;
      let totalReferrerRewards = 0;
      
      sysTxSnap.forEach(doc => {
        const data = doc.data();
        if (data.type === 'DEPOSIT') {
          const desc = data.description?.toLowerCase() || '';
          if (desc.includes('ilk bakiye yükleme') || desc.includes('davet bakiye yükleme hediyesi')) {
            totalCoachGifts += data.amount || 0;
          } else if (desc.includes('davet ettiğiniz koç yükleme') || desc.includes('referans koç')) {
            totalReferrerRewards += data.amount || 0;
          }
        }
      });

      return {
        totalStudentDiscounts,
        totalCoachGifts,
        totalReferrerRewards,
        totalGivenAmount: totalStudentDiscounts + totalCoachGifts + totalReferrerRewards
      };
    } catch (err) {
      console.error('Error getting referral stats:', err);
      return {
        totalStudentDiscounts: 0,
        totalCoachGifts: 0,
        totalReferrerRewards: 0,
        totalGivenAmount: 0
      };
    }
  }
};
