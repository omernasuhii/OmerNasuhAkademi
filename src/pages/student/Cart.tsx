import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Package, Minus, Plus, ChevronRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';
import { storeService } from '../../services/storeService';
import { studentDataService } from '../../services/studentDataService';
import { referralService } from '../../services/referralService';
import { programService } from '../../services/programService';
import { eventService } from '../../services/eventService';
import { notificationService } from '../../services/notificationService';
import { SUBSCRIPTION_PACKAGES } from '../students/Subscription';
import { motion, AnimatePresence } from 'motion/react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function Cart() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { items: cartItems, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
  
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCheckoutConfirm, setShowCheckoutConfirm] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountTL, setDiscountTL] = useState(0);
  const [appliedReferrerId, setAppliedReferrerId] = useState<string | null>(null);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);

  const finalPrice = Math.max(0, totalPrice - (totalPrice * discountPercent / 100) - discountTL);

  const handleApplyCoupon = async () => {
    if (!user?.uid || !couponCode) return;
    try {
      const itemTypes = cartItems.map(i => i.type);
      const res = await referralService.applyCouponOrReferral(couponCode, user.uid, totalPrice, itemTypes);
      if (res) {
        setDiscountPercent(res.discountPercent || 0);
        setDiscountTL(res.discountTL || 0);
        setAppliedReferrerId(res.referrerId || null);
        if (res.couponId) setAppliedCouponId(res.couponId);
        
        const message = res.discountPercent > 0 
           ? `%${res.discountPercent} indirim uygulandı!` 
           : `${res.discountTL} TL indirim uygulandı!`;
        setSuccessMessage(message);
      } else {
        setDiscountPercent(0);
        setDiscountTL(0);
        setAppliedReferrerId(null);
        setAppliedCouponId(null);
        setError('Geçersiz veya süresi dolmuş kupon kodu.');
      }
    } catch (err: any) {
      setDiscountPercent(0);
      setDiscountTL(0);
      setAppliedReferrerId(null);
      setError(err.message || 'Kupon uygulanamadı.');
    }
    setTimeout(() => { setError(null); setSuccessMessage(null); }, 3000);
  };

  const handleCheckout = () => {
    if (!user?.uid || cartItems.length === 0) return;
    setShowCheckoutConfirm(true);
  };

  const executeCheckout = async () => {
    setShowCheckoutConfirm(false);
    try {
      setPurchasing('checkout');
      setError(null);

      const walletBalance = userData?.walletBalance || 0;
      if (walletBalance < finalPrice) {
        throw new Error('Bakiyeniz yetersiz. Koçunuz üzerinden bakiye yükleyebilirsiniz.');
      }

      const totalDiscount = totalPrice - finalPrice;
      let totalCoachDeduction = 0;

      // Fetch dynamic deduction rate
      let dRate = 20;
      let minRateBronze = 1000;
      let minRateSilver = 1500;
      let minRateGold = 2000;
      const rootSnap = await getDoc(doc(db, 'settings', 'financial'));
      if (rootSnap.exists()) {
         const data = rootSnap.data();
         if (data.systemDeductionRate !== undefined) dRate = data.systemDeductionRate;
         if (data.minSystemDeductionBronze !== undefined) minRateBronze = data.minSystemDeductionBronze;
         if (data.minSystemDeductionSilver !== undefined) minRateSilver = data.minSystemDeductionSilver;
         if (data.minSystemDeductionGold !== undefined) minRateGold = data.minSystemDeductionGold;
      }
      
      for (const item of cartItems) {
         let itemTotalPrice = item.price * item.quantity;
         
         if (item.type === 'subscription') {
            const pkg = SUBSCRIPTION_PACKAGES.find(p => p.name === item.title);
            
            let minRate = minRateBronze;
            if (item.title.toLowerCase().includes('bronz')) minRate = minRateBronze;
            else if (item.title.toLowerCase().includes('gümüş')) minRate = minRateSilver;
            else if (item.title.toLowerCase().includes('altın')) minRate = minRateGold;

            if (pkg && pkg.systemDeduction !== undefined) {
               totalCoachDeduction += Math.max(Math.floor(itemTotalPrice * (dRate / 100)), minRate * item.quantity);
            } else {
               totalCoachDeduction += Math.max(Math.floor(itemTotalPrice * (dRate / 100)), minRate * item.quantity); // Fallback
            }
         } else {
            totalCoachDeduction += itemTotalPrice; 
         }
      }
      
      // Referans ayarlarından indirimin kimden kesileceğini öğren
      const refSettings = await referralService.getSettings();
      const payerMode = refSettings?.discountPayer || 'system';

      if (totalDiscount > 0) {
         if (payerMode === 'system') {
            // İndirimi tamamen koçtan alınan ödemeden düşüyoruz (sistem indirim yapıyor, koç zarar etmiyor)
            totalCoachDeduction = Math.max(0, totalCoachDeduction - totalDiscount);
         } else if (payerMode === 'coach') {
            // Koç zarar eder (indirim koça sağlanan tutardan değil sistem dahil hesaplanır, base math holds)
            // Or just leave deduction as is since it was full totalCoachDeduction.
            // Ama indirim koçtan kesilecekse koçun geliri o kadar azalmaz mı? Aslında koçtan sistem komisyonu kesilir.
            // If coach pays the discount, system gets its usual cut. So System gets (FinalPrice - Discount) but wait...
         } else if (payerMode === 'proportional') {
            const activeRatio = totalPrice > 0 ? (finalPrice / totalPrice) : 1;
            totalCoachDeduction = totalCoachDeduction * activeRatio;
         }
      }

      totalCoachDeduction = Math.round(totalCoachDeduction);

      if (finalPrice > 0) {
         const res = await studentDataService.addWalletTransaction(user!.uid, {
            type: 'WITHDRAWAL',
            amount: finalPrice,
            coachDeductionAmount: totalCoachDeduction,
            description: `Sepet Alışverişi`,
            items: cartItems.map(item => ({
               title: item.title,
               quantity: item.quantity,
               price: item.price,
               type: item.type
            }))
         });
         
         if (!res.success) {
           const errMsg = res.error || '';
           if (errMsg.includes('Koç bulunamadı') || errMsg.includes('paket güncellemesi') || errMsg.includes('koçun')) {
             throw new Error('⚠️ İşlem Tamamlanamadı: Koçunuz kaynaklı bir durum sebebiyle satın alımınız/yenilemeniz şu an yapılamıyor. Lütfen doğrudan koçunuzla iletişime geçin.');
           } else {
             throw new Error('İşlem gerçekleştirilemedi: ' + errMsg);
           }
         }
      }

      for (const item of cartItems) {
        if (item.type === 'product') {
          await storeService.purchaseProduct(user!.uid, item.itemId, item.quantity);
        } else if (item.type === 'course') {
          await programService.enrollStudent(user!.uid, item.itemId);
        } else if (item.type === 'subscription') {
          const now = new Date();
          const durationDays = item.metadata?.durationDays || 30;
          const expiration = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
          
          const isUpgrade = userData?.subscriptionStatus === 'active' && userData?.subscriptionPlan !== item.itemId;

          await studentDataService.updateStudentProfile(user!.uid, {
            subscriptionPlan: item.itemId,
            subscriptionStartDate: now.toISOString(),
            subscriptionEndDate: expiration.toISOString(),
            subscriptionStatus: 'active',
            autoRenew: true
          });

          await studentDataService.logSubscriptionHistory({
            studentId: user!.uid,
            studentName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim(),
            oldPlan: isUpgrade ? userData?.subscriptionPlan : undefined,
            newPlan: item.itemId,
            action: isUpgrade ? 'upgraded' : 'started',
            startDate: now.toISOString(),
            endDate: expiration.toISOString()
          });

          await notificationService.addNotification(user!.uid, {
              title: isUpgrade ? 'Abonelik Yükseltme' : 'Abonelik Başlangıcı',
              message: isUpgrade 
                 ? `Tebrikler! ${item.itemId} paketine başarıyla geçiş yaptın. Gelişmiş özelliklerin tadını çıkar.` 
                 : `Harika bir karar! ${item.itemId} planı ile sistemin sınırsız imkanlarına eriştin.`,
              type: 'success',
              link: '/panel/ogrenci/abonelik'
          });
        } else if (item.type === 'event') {
           if (item.metadata?.ticketTypeId && item.metadata?.eventId) {
              await eventService.buyTicket({
                 eventId: item.metadata.eventId,
                 studentId: user!.uid,
                 studentName: userData ? `${userData.firstName} ${userData.lastName}` : 'Öğrenci',
                 ticketTypeId: item.metadata.ticketTypeId,
                 quantity: item.quantity,
                 totalPrice: item.price * item.quantity
              });
           }
        }
      }

      if (appliedReferrerId) {
        await referralService.markReferralUsed(appliedReferrerId, user!.uid);
      }
      
      if (appliedCouponId) {
        await referralService.markCouponUsed(appliedCouponId, user!.uid);
      }

      // Check and activate referrer coupons if this user was a referee
      await referralService.activatePendingCouponsForReferee(user!.uid);

      setSuccessMessage('Siparişiniz başarıyla tamamlandı!');
      clearCart();
      
      setTimeout(() => {
        setSuccessMessage(null);
        navigate('/panel/ogrenci/magaza');
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || 'Sipariş sırasında bir hata oluştu.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6"
          >
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </motion.div>
        )}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3 mb-6"
          >
            <CheckCircle2 className="w-5 h-5" />
            <p>{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          Sepetim
        </h1>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/magaza')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-medium bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl"
          >
            <ChevronLeft size={18} />
            Mağazaya Dön
          </button>
        </div>

        {cartItems.length > 0 ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex gap-4 items-center">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-20 h-20 rounded-lg object-cover" />
                  ) : (
                    <div className="w-20 h-20 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                      <Package className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-lg font-medium text-white">{item.title}</h4>
                    <div className="text-sm text-slate-400">
                      {item.type === 'product' ? 'Ürün' : item.type === 'course' ? 'Online Eğitim' : item.type === 'subscription' ? 'Abonelik Paketi' : 'Etkinlik'}
                    </div>
                    {item.type === 'subscription' && item.metadata?.durationDays && (
                      <div className="text-xs text-indigo-400 mt-1 font-medium bg-indigo-500/10 inline-block px-2 py-0.5 rounded">
                         {item.metadata.durationDays} Gün Süreli Abonelik
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3 text-right">
                    <div className="text-xl font-bold text-indigo-400">
                      {item.price * item.quantity} ₺
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {item.type !== 'subscription' ? (
                        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm font-medium text-white">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-sm font-medium text-slate-400 px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg">
                          1 Adet
                        </div>
                      )}

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-sm px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 font-medium transition"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 sticky top-6">
                <h3 className="text-xl font-bold text-white mb-4">Sipariş Özeti</h3>
                <div className="flex justify-between items-center mb-2 text-slate-300">
                  <span>Toplam Ürün</span>
                  <span>{totalItems} adet</span>
                </div>
                <div className="flex justify-between items-center mb-4 text-slate-300">
                  <span>Ürünler Toplamı</span>
                  <span className="font-bold">{totalPrice} ₺</span>
                </div>
                
                {discountPercent > 0 && (
                   <div className="flex justify-between items-center mb-4 text-emerald-400">
                     <span>İndirim (%{discountPercent})</span>
                     <span className="font-bold">-{totalPrice * discountPercent / 100} ₺</span>
                   </div>
                )}

                {discountTL > 0 && (
                   <div className="flex justify-between items-center mb-4 text-emerald-400">
                     <span>İndirim Tutarı</span>
                     <span className="font-bold">-{discountTL} ₺</span>
                   </div>
                )}

                <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-700 text-slate-100">
                  <span>Ödenecek Tutar</span>
                  <span className="text-2xl font-bold text-indigo-400">{finalPrice} ₺</span>
                </div>

                <div className="mb-6">
                  <label className="text-xs text-slate-400 mb-2 block">İndirim / Davet Kuponu</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Kupon Kodu"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap"
                    >
                      Uygula
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={purchasing === 'checkout'}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center gap-2"
                >
                  {purchasing === 'checkout' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      İşleniyor...
                    </>
                  ) : (
                    <>Sepeti Onayla <ChevronRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
           <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
             <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
               <ShoppingBag className="w-10 h-10 text-slate-400" />
             </div>
             <h3 className="text-xl font-medium text-white mb-2">Sepetiniz Boş</h3>
             <p className="text-slate-400 mb-6">İhtiyacınız olan ürünleri sepetinize ekleyebilirsiniz.</p>
             <button 
               onClick={() => navigate('/panel/ogrenci/magaza')}
               className="px-6 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl font-medium transition"
             >
               Mağazaya Göz At
             </button>
           </div>
        )}
      </div>

      <AnimatePresence>
        {showCheckoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex justify-center items-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white text-center">Siparişi Onayla</h3>
              </div>
              <p className="text-slate-300 mb-8 text-center text-lg break-words">
                Sepetinizdeki <span className="font-bold text-indigo-400">{totalItems} ürün/hizmet</span> için {(discountPercent > 0 || discountTL > 0) ? (
                  <span>
                    <span className="line-through text-slate-500 text-sm mr-2">{totalPrice} ₺</span>
                    <span className="font-bold text-emerald-400">{finalPrice} ₺</span>
                  </span>
                ) : (
                  <span className="font-bold text-emerald-400">{finalPrice} ₺</span>
                )} tutarındaki siparişi onaylıyor musunuz?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={purchasing === 'checkout'}
                  onClick={() => setShowCheckoutConfirm(false)}
                  className="px-5 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 hover:text-white transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={executeCheckout}
                  disabled={purchasing === 'checkout'}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {purchasing === 'checkout' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Onaylanıyor...
                    </>
                  ) : (
                    'Siparişi Onayla'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
