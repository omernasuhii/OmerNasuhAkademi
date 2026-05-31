import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, History, ArrowDownLeft, ArrowUpRight, CreditCard, Users, Loader2, X, Check } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { studentDataService } from '../../services/studentDataService';

export default function CoachWallet() {
  const { userData, user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [rawTransactions, setRawTransactions] = useState<any[]>([]);
  const [systemBalance, setSystemBalance] = useState(0); 
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    if (user && userData) {
      setSystemBalance(userData?.systemBalance || 0);
      loadData();
    }
  }, [user, userData]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Koçun öğrencilerini çek
      const q = query(collection(db, 'users'), where('coachId', '==', user!.uid));
      const snap = await getDocs(q);
      const studentDocs = snap.docs.map(doc => ({ 
        uid: doc.id, 
        ...doc.data(),
        displayName: doc.data().displayName || `${doc.data().firstName} ${doc.data().lastName}`
      }));
      setStudents(studentDocs);

      // 2. Txs
      let allTxs: any[] = [];

      // Get student transactions
      for (const student of studentDocs) {
        const qTxs = query(collection(db, 'wallet_transactions'), where('studentId', '==', student.uid));
        const snapTxs = await getDocs(qTxs);
        
        const stTxs = snapTxs.docs.map(doc => ({
           id: doc.id,
           ...doc.data(),
           studentName: student.displayName
        }));
        allTxs = [...allTxs, ...stTxs];
      }

      // Get system deposits
      try {
        const qSysTxs = query(collection(db, 'wallet_transactions'), where('studentId', '==', user!.uid));
        const snapSysTxs = await getDocs(qSysTxs);
        const sysTxs = snapSysTxs.docs
          .map(doc => ({ id: doc.id, ...doc.data(), studentName: 'Sistem' }))
          .filter((doc: any) => doc.coachId === 'SYSTEM');
        allTxs = [...allTxs, ...sysTxs];
      } catch (e) {
        console.error("System TX fetch error:", e);
      }
      
      let uniqueTxs = Array.from(new Map(allTxs.map(tx => [tx.id, tx])).values());
      setRawTransactions(uniqueTxs);

    } catch (err) {
      console.error("Cüzdan verileri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  // Hesaplamalar
  const totalEarnings = rawTransactions
    .filter(tx => tx.type === 'DEPOSIT' && tx.coachId !== 'SYSTEM')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const monthlyEarnings = rawTransactions
    .filter(tx => tx.type === 'DEPOSIT' && tx.coachId !== 'SYSTEM' && tx.date.startsWith(currentMonthStr))
    .reduce((sum, tx) => sum + tx.amount, 0);

  const currentSystemBalance = systemBalance;

  // İşlemleri Birleştir (Öğrenci ödemeleri ve Sistem Bakiyesi hareketleri)
  const formattedStudentTxs = rawTransactions.flatMap(tx => {
    const items = [];
    if (tx.coachId === 'SYSTEM' && tx.type === 'DEPOSIT') {
       items.push({
          id: tx.id + '_sys_dep',
          category: 'system', // sari icon bg
          direction: 'in', // giren ok, yesil tutar
          amount: tx.amount,
          subject: `Sistem Yüklemesi`,
          description: tx.description || 'Yönetici tarafından sistem bakiyesi eklendi',
          date: tx.date,
       });
    } else if (tx.type === 'DEPOSIT') {
       items.push({
          id: tx.id + '_dep',
          category: 'student', // mavi icon bg
          direction: 'in', // giren ok, yesil tutar
          amount: tx.amount,
          subject: `Öğrenci Yüklemesi - ${tx.studentName}`,
          description: tx.description,
          date: tx.date,
       });
    } else if (tx.type === 'WITHDRAWAL') {
       items.push({
          id: tx.id + '_with',
          category: 'student', // mavi icon bg
          direction: 'out', // cikan ok, kirmizi tutar
          amount: tx.amount,
          subject: `Öğrenci İşlemi - ${tx.studentName}`,
          description: tx.description,
          date: tx.date,
       });
       
       const deduction = tx.coachDeductionAmount !== undefined ? tx.coachDeductionAmount : tx.amount;
       items.push({
          id: tx.id + '_sys_with',
          category: 'system', // sari icon bg
          direction: 'out', // cikan ok, kirmizi tutar
          amount: deduction,
          subject: `Sistem Kesintisi`,
          description: `İşlem: ${tx.description} (${tx.studentName})`,
          date: tx.date,
       });
    }
    return items;
  });

  const recentTransactions = [...formattedStudentTxs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-500 min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Cüzdan Verileri Yükleniyor...</h2>
        <p className="text-slate-400 text-sm">Finansal hareketleriniz derleniyor</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <Wallet size={12} />
            Cüzdan & Kazanç
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Finansal Özet
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Öğrencilerinizden elde ettiğiniz kazançları ve sistem kullanım bakiyenizi buradan görüntüleyebilirsiniz.
          </p>
        </motion.div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings Card */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between"
        >
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full" />
           <div>
             <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-6 border border-indigo-500/20">
               <TrendingUp size={28} strokeWidth={2.5} />
             </div>
             <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest mb-2">Toplam Kazanç</p>
             <div className="flex items-baseline gap-2 mb-2">
               <h2 className="text-5xl font-black text-white">₺{totalEarnings.toLocaleString('tr-TR')}</h2>
             </div>
           </div>
           <p className="text-sm text-indigo-200/70 inline-flex items-center gap-1 font-medium bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/10 mt-4 w-fit">
              <ArrowUpRight size={16} className="text-indigo-400" />
              Bu ay ₺{monthlyEarnings.toLocaleString('tr-TR')} tahsilat
           </p>
        </motion.div>

        {/* System Balance Card */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between"
        >
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full" />
           <div>
             <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-6 border border-amber-500/20">
               <CreditCard size={28} strokeWidth={2.5} />
             </div>
             <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-bold text-amber-300 uppercase tracking-widest">Sistem İçi Bakiye</p>
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                   <Users size={12} /> {students.length} Öğrenci
                </div>
             </div>
             <div className="flex items-baseline gap-2 mb-2">
               <h2 className={`text-5xl font-black text-white`}>
                 ₺{currentSystemBalance.toLocaleString('tr-TR')}
               </h2>
             </div>
           </div>
           <p className="text-sm text-amber-200/70 inline-flex items-center gap-1 font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/10 mt-4 w-fit">
             Öğrencileriniz sistem içi işlem yaptıkça tahsil edilir.
           </p>
        </motion.div>
      </div>

      {/* Transaction History */}
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
               Son İşlemler
            </h2>
            <p className="text-slate-500 text-sm mt-1">
               Öğrenci ödemeleri ve sistem bakiyesi hareketleri
            </p>
          </div>
          <div className="text-[10px] font-bold text-slate-400 border border-slate-700 bg-slate-800/50 px-3 py-1.5 rounded-lg uppercase tracking-widest leading-none">
             Toplam {recentTransactions.length} İşlem
          </div>
        </div>
        
        <div className="p-4 space-y-2">
          {recentTransactions.length > 0 ? (
            recentTransactions.map((tx, idx) => (
              <div 
                key={tx.id || idx} 
                className={`flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-2xl transition-all group ${tx.direction === 'out' ? 'cursor-pointer' : ''}`}
                onClick={() => tx.direction === 'out' && setSelectedTx(tx)}
              >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                       tx.category === 'student' 
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 group-hover:scale-105' 
                          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400 group-hover:scale-105'
                    }`}>
                       {tx.direction === 'in' ? <ArrowDownLeft size={20} strokeWidth={2.5}/> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{tx.subject}</h4>
                      <p className="text-xs text-slate-400 font-medium mb-1">{tx.description}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                 </div>
                 <div className="text-right shrink-0">
                    <p className={`text-base font-black ${tx.direction === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {tx.direction === 'in' ? '+' : '-'}{tx.amount.toFixed(2)} ₺
                    </p>
                 </div>
              </div>
            ))
          ) : (
             <div className="p-10 text-center text-slate-500 font-medium italic">
                Henüz kayıtlı bir işlem bulunmuyor.
             </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
            >
              <button 
                onClick={() => setSelectedTx(null)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
              
              <div className="flex flex-col items-center mb-6 mt-4">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border mb-4 ${
                    selectedTx.direction === 'in' 
                       ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                       : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                 }`}>
                    {selectedTx.direction === 'in' ? <ArrowDownLeft size={32} strokeWidth={2.5}/> : <ArrowUpRight size={32} strokeWidth={2.5} />}
                 </div>
                 <h3 className="text-xl font-bold text-white text-center">İşlem Detayı</h3>
                 <p className="text-slate-400 text-sm">{selectedTx.subject}</p>
                 <div className={`mt-4 text-3xl font-black ${selectedTx.direction === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedTx.direction === 'in' ? '+' : '-'}{selectedTx.amount.toFixed(2)} ₺
                 </div>
              </div>
              
              <div className="space-y-4 text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10 mt-4 h-max overflow-y-auto max-h-[40vh]">
                 <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Açıklama</div>
                    <div className="font-medium text-white">{selectedTx.description || 'Detay bulunmuyor'}</div>
                 </div>
                 <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tarih</div>
                    <div className="font-medium text-white">{new Date(selectedTx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                 </div>
                 {selectedTx.items && selectedTx.items.length > 0 && (
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
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1 mt-2">Kategori</div>
                    <div className="font-medium text-white">{selectedTx.category === 'student' ? 'Öğrenci' : 'Sistem'}</div>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

