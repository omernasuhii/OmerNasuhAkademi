import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, History, ArrowDownLeft, ArrowUpRight, Loader2, Gift, Copy, Check, Info, X } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { referralService, ReferralSettings } from '../../services/referralService';
import { AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function ParentWallet() {
  const { userData, user } = useAuth();
  const { selectedStudent } = useStudent();
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [dynamicRefCount, setDynamicRefCount] = useState(0);

  useEffect(() => {
    if (user && selectedStudent?.uid) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user, userData, selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentId = selectedStudent!.uid;
      const profile = await studentDataService.getStudentProfile(studentId);
      setStudentProfile(profile);
      
      const refCode = profile?.referralCode || 'FOCUS' + (studentId.substring(0,4).toUpperCase());

      const [txs, refSettings, usersSnap] = await Promise.all([
        studentDataService.getWalletTransactions(studentId),
        referralService.getSettings(),
        getDocs(query(collection(db, 'users'), where('referredByCode', '==', refCode)))
      ]);
      
      setTransactions(txs);
      setSettings(refSettings);
      
      // Compute dynamic referrals
      if (!usersSnap.empty) {
         setDynamicRefCount(usersSnap.docs.length);
      }
    } catch (err) {
      console.error("Cüzdan/Referans bilgileri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = studentProfile?.walletBalance || 0;
  const refCode = studentProfile?.referralCode || (selectedStudent?.uid ? 'FOCUS' + (selectedStudent.uid.substring(0,4).toUpperCase()) : '2026');
  const myEarnings = studentProfile?.referralEarnings || 0;
  const myRefCount = dynamicRefCount || studentProfile?.referralCount || 0;

  const rewardTypeStr = settings?.rewardType === 'percent' ? '%' : 'TL';
  const rewardAmount = settings?.referrerReward || 10;
  
  const allTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-500 min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Cüzdan Yükleniyor...</h2>
        <p className="text-slate-400 text-sm">Bakiye geçmişiniz derleniyor</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 p-6 md:p-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <WalletIcon size={12} />
            Cüzdan ve Ödüller
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            TL Bakiyem & Davet Ödüllerim
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Sistemdeki TL bakiyenizi görüntüleyebilir, harcama geçmişinizi görebilir ve arkadaşlarınızı davet ederek ödüller kazanabilirsiniz.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between"
        >
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full" />
           <div>
             <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-6 border border-emerald-500/20">
               <WalletIcon size={28} strokeWidth={2.5} />
             </div>
             <p className="text-sm font-bold text-emerald-300 uppercase tracking-widest mb-2">Mevcut TL Bakiyesi</p>
             <div className="flex items-baseline gap-2 mb-2">
               <h2 className="text-5xl font-black text-white">₺{currentBalance.toLocaleString('tr-TR')}</h2>
             </div>
           </div>
           <p className="text-sm text-emerald-200/70 inline-flex items-center gap-1 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/10 mt-4 w-fit">
              Bakiyenizi sadece eğitim koçunuz yükleyebilir.
           </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between group"
        >
           <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full" />
           <div>
             <div className="flex items-center justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <Gift size={28} strokeWidth={2.5} />
                </div>
                <button 
                  onClick={() => setShowInfoModal(true)}
                  className="w-10 h-10 rounded-xl bg-slate-900/50 hover:bg-slate-800 border border-slate-700/50 flex flex-col items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0 z-10"
                >
                  <Info size={20} />
                </button>
             </div>
             
             <div className="flex justify-between items-start">
               <div>
                 <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Başarılı Davet Sayısı</p>
                 <div className="flex items-baseline gap-2 mb-2">
                   <h2 className="text-5xl font-black text-white">{myRefCount}</h2>
                   <span className="text-xl font-medium text-slate-400">Kişi</span>
                 </div>
               </div>
               <div className="text-right shrink-0 z-10 relative">
                 <p className="text-[10px] text-indigo-300 font-bold mb-1 uppercase tracking-widest">Davet Kodun</p>
                 <div className="flex items-center gap-2 bg-indigo-500/20 border border-indigo-500/30 px-3 py-2 rounded-xl cursor-pointer hover:bg-indigo-500/30 transition-colors" onClick={handleCopy}>
                   <span className="text-lg font-mono font-black text-white tracking-widest">{refCode}</span>
                   {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-indigo-300" />}
                 </div>
               </div>
             </div>
           </div>
           
           <p className="text-xs text-indigo-200/80 mt-6 leading-relaxed bg-indigo-500/10 px-4 py-3 rounded-xl border border-indigo-500/20">
              Arkadaşınız sizin kodunuzla kaydolduğunda size özel ayrıcalıklardan faydalanırsınız.
           </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden"
      >
        <div className="p-8 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
               <History className="text-slate-400" size={24} /> 
               İşlem Geçmişi
            </h2>
            <p className="text-slate-500 text-sm mt-1">
               Tüm yükleme ve harcama detaylarınız
            </p>
          </div>
          <div className="text-[10px] font-bold text-slate-400 border border-slate-700 bg-slate-800/50 px-3 py-1.5 rounded-lg uppercase tracking-widest leading-none">
             Toplam {allTransactions.length} İşlem
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          {allTransactions.length > 0 ? (
            allTransactions.map((tx, idx) => (
              <div 
                 key={tx.id || idx} 
                 onClick={() => tx.type === 'WITHDRAWAL' && setSelectedTx(tx)}
                 className={`flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-2xl transition-all group ${tx.type === 'WITHDRAWAL' ? 'cursor-pointer' : ''}`}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                       tx.type === 'DEPOSIT' 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:scale-105' 
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-400 group-hover:scale-105'
                    }`}>
                       {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20} strokeWidth={2.5}/> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{tx.description || (tx.type === 'DEPOSIT' ? 'Bakiye Yükleme' : 'Paket Alımı/Harcama')}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</p>
                    </div>
                 </div>
                 <div className="text-right shrink-0">
                    <p className={`text-base font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount} ₺
                    </p>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md mt-1 inline-block border border-emerald-500/20">
                       Tamamlandı
                    </span>
                 </div>
              </div>
            ))
          ) : (
             <div className="p-10 text-center text-slate-500 font-medium italic">
                Henüz kayıtlı bir işleminiz bulunmuyor.
             </div>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/50 sm:rounded-3xl p-8 w-full max-w-sm h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedTx(null)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="flex flex-col items-center mb-6 mt-4">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-4 ${
                    selectedTx.type === 'DEPOSIT' 
                       ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                       : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                 }`}>
                    {selectedTx.type === 'DEPOSIT' ? <ArrowDownLeft size={32} strokeWidth={2.5}/> : <ArrowUpRight size={32} strokeWidth={2.5} />}
                 </div>
                 <h3 className="text-xl font-bold text-white text-center">İşlem Detayı</h3>
                 <p className="text-slate-400 text-sm">{selectedTx.type === 'DEPOSIT' ? 'Gelen Bakiye' : 'Harcama / Gider'}</p>
                 <div className={`mt-4 text-3xl font-black ${selectedTx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedTx.type === 'DEPOSIT' ? '+' : '-'}{selectedTx.amount} ₺
                 </div>
              </div>
              
              <div className="space-y-4 text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10 mt-4 h-max overflow-y-auto max-h-[40vh]">
                 <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Açıklama</div>
                    <div className="font-medium text-white">{selectedTx.description || 'Detay bulunmuyor'}</div>
                 </div>
                 <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tarih</div>
                    <div className="font-medium text-white">{new Date(selectedTx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</div>
                 </div>
                 {Array.isArray(selectedTx.items) && selectedTx.items.length > 0 && (
                    <div>
                       <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Harcanan Kalemler</div>
                       <div className="space-y-3">
                          {selectedTx.items.map((item: any, i: number) => (
                             <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
                                <div className="flex flex-col">
                                   <span className="font-medium text-slate-200">{item.title}</span>
                                   <span className="text-xs text-slate-500">{item.quantity} Adet</span>
                                </div>
                                <span className="font-medium text-rose-400">{item.price} ₺</span>
                             </div>
                          ))}
                       </div>
                    </div>
                 )}
                 <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 mt-2">Durum</div>
                    <div className="font-medium text-emerald-400 flex items-center gap-1"><Check size={14} /> Başarılı</div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/50 sm:rounded-3xl p-8 w-full max-w-lg h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => setShowInfoModal(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                    <Gift size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-white">Nasıl Ödül Kazanırım?</h3>
              </div>
              
              <div className="space-y-4 text-sm text-slate-300">
                 <p>Size özel oluşturulan kodu çevrenizle paylaşarak ödüller kazanabilirsiniz.</p>
                 <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <ul className="space-y-3">
                       <li className="flex items-start gap-2">
                          <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>Adım 1: Arkadaşınız kayıt olurken sistemdeki <b>"Davet Kodun"</b> kısmındaki kodu kullanmalıdır.</span>
                       </li>
                       <li className="flex items-start gap-2">
                          <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>Adım 2: Davet ettiğiniz kullanıcı mağazadan <b>ilk alışverişini</b> sepette bu kodla tamamlamalıdır.</span>
                       </li>
                       <li className="flex items-start gap-2">
                          <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                          <span>Adım 3: Tamamlanan başarılı işlemlerin ardından kazançlarınız tanımlanacak ve ayrıcalıklarınız hesabınıza işlenecektir (Kazançlar bağlı bulunduğunuz koçun insiyatifinde değişiklik gösterebilir).</span>
                       </li>
                    </ul>
                 </div>
              </div>
              
              <button
                onClick={() => setShowInfoModal(false)}
                className="w-full mt-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Anladım
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

