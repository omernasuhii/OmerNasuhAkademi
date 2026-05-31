import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Info, Search, Plus, Loader2, ArrowUpRight, CheckCircle2, TrendingUp, Users, History, ArrowDownLeft, Clock, X } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';

export default function FinancialStatus() {
  const { user } = useAuth();
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showInfo, setShowInfo] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  
  const [amount, setAmount] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [success, setSuccess] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [coachStudents, setCoachStudents] = useState<any[]>([]);
  const [txFilter, setTxFilter] = useState<'all' | 'system' | 'student'>('all');
  const [showCoachModal, setShowCoachModal] = useState(false);

  const [globalTransactions, setGlobalTransactions] = useState<any[]>([]);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  useEffect(() => {
    loadCoaches();
    loadGlobalTransactions();
  }, []);

  const loadGlobalTransactions = async () => {
    try {
      const q = query(
        collection(db, 'wallet_transactions'), 
        where('coachId', '==', 'SYSTEM')
      );
      const snap = await getDocs(q);
      const txs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setGlobalTransactions(txs);
    } catch (err) {
      console.error("Global loglar yüklenirken hata:", err);
    }
  };

  useEffect(() => {
    if (selectedCoach) {
      loadTransactions();
    } else {
      setTransactions([]);
      setCoachStudents([]);
    }
  }, [selectedCoach]);

  const loadTransactions = async () => {
    if (!selectedCoach) return;
    setLoadingTransactions(true);
    try {
      const sq = query(collection(db, 'users'), where('coachId', '==', selectedCoach.uid));
      const ssap = await getDocs(sq);
      setCoachStudents(ssap.docs.map(doc => ({ uid: doc.id, ...doc.data() })));

      const q1 = query(collection(db, 'wallet_transactions'), where('coachId', '==', selectedCoach.uid));
      const snap1 = await getDocs(q1);

      const q2 = query(collection(db, 'wallet_transactions'), where('studentId', '==', selectedCoach.uid));
      const snap2 = await getDocs(q2);

      const allTxs = [
        ...snap1.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];

      const uniqueTxs = Array.from(new Map(allTxs.map(item => [item.id, item])).values());
      const txs = uniqueTxs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(txs);
    } catch (err) {
      console.error("İşlemler yüklenirken hata:", err);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadCoaches = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'coach'));
      const snap = await getDocs(q);
      const coachData = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setCoaches(coachData);
    } catch (err) {
      console.error("Koçlar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedCoach || isAdding) return;

    setIsAdding(true);
    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) throw new Error("Geçersiz bakiye");

      const coachRef = doc(db, 'users', selectedCoach.uid);
      const snap = await getDoc(coachRef);
      const currentSystemBalance = snap.data()?.systemBalance || 0;
      
      await updateDoc(coachRef, {
        systemBalance: currentSystemBalance + numAmount,
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(db, 'wallet_transactions'), {
        studentId: selectedCoach.uid,
        coachId: 'SYSTEM',
        amount: numAmount,
        type: 'DEPOSIT',
        description: 'Yönetici tarafından sistem bakiyesi eklendi',
        date: new Date().toISOString(),
        createdAt: serverTimestamp()
      });

      setSuccess(true);
      loadTransactions();
      loadGlobalTransactions();
      setTimeout(() => {
        setSuccess(false);
        setAmount('');
        loadCoaches();
      }, 2000);
      
    } catch (error) {
      console.error("Bakiye yüklenirken hata:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const filteredCoaches = coaches.filter(c => {
    const name = c.displayName || (c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : c.firstName || '');
    return name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.email?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalEarnings = transactions
    .filter(tx => tx.type === 'DEPOSIT' && tx.coachId !== 'SYSTEM' && tx.coachId === selectedCoach?.uid)
    .reduce((sum, tx) => sum + tx.amount, 0);

  const filteredTxs = transactions.filter(tx => {
    if (txFilter === 'all') return true;
    if (txFilter === 'system') {
       // system deposit to coach OR withdrawal from student where coach deduction applies
       return tx.coachId === 'SYSTEM' || (tx.type === 'WITHDRAWAL' && tx.coachId === selectedCoach?.uid);
    }
    if (txFilter === 'student') {
       // student deposit or withdrawal (but student deposit is mainly what goes to student)
       return tx.coachId === selectedCoach?.uid && tx.coachId !== 'SYSTEM';
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <Wallet size={12} />
            Mali Durum & Cüzdan
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            Ön Ödemeli Cüzdan Sistemi
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Sistemdeki koçların "Sistem Bakiyesini" (Kredi) yönetin ve bakiye yüklemelerini gerçekleştirin.
          </p>
        </motion.div>

        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative"
        >
          <div className="flex gap-2">
            <button 
              onClick={() => setShowGlobalHistory(true)}
              className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all"
            >
               <History size={18} />
               Tüm Loglar
            </button>
            <button 
               onClick={() => setShowInfo(!showInfo)}
               className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:border-emerald-500/30 transition-all group"
            >
               <Info className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
          
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-16 w-80 sm:w-96 p-6 rounded-3xl bg-slate-900 border border-white/10 shadow-2xl z-50 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 blur-3xl rounded-full" />
                <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
                   <Info size={18} className="text-emerald-400" /> Sistemi Anlayın
                </h3>
                <div className="space-y-3 text-sm text-slate-400 font-medium leading-relaxed relative z-10">
                   <p>Bu sistem <strong className="text-emerald-400">Önce parayı öde, sonra hizmeti al (B2B2C)</strong> kurgusuyla çalışır:</p>
                   <ul className="list-disc pl-4 space-y-1">
                     <li>Yönetici parayı aldığı koça "Sistem Bakiyesi" ekler.</li>
                     <li>Koç, parayı aldığı öğrencisine "TL Bakiyesi" ekler.</li>
                     <li>Öğrenci işlem/paket satın aldığında, öğrencinin TL bakiyesinden düşülür. <strong>Eşzamanlı</strong> olarak Koçun hesabından da (Sistem Bakiyesi) aynı bedel düşülür.</li>
                   </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-8">
         <div className="space-y-6">
            <div className="bg-[#070b14] border border-white/5 rounded-[32px] p-4 flex items-center">
               <Search className="text-slate-500 ml-4 mr-3" size={20} />
               <input 
                 type="text" 
                 placeholder="Koç adı veya e-posta ara..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="flex-1 bg-transparent border-none text-white outline-none placeholder:text-slate-500 font-medium text-sm"
               />
            </div>

            <div className="grid gap-4">
              {loading ? (
                 <div className="p-10 text-center flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    <span className="text-slate-400 font-medium">Koçlar yükleniyor...</span>
                 </div>
              ) : filteredCoaches.length > 0 ? (
                 filteredCoaches.map((coach) => (
                   <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={coach.uid}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-3xl border transition-all cursor-pointer ${selectedCoach?.uid === coach.uid && !showCoachModal ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/10' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                      onClick={() => { setSelectedCoach(coach); setShowCoachModal(true); }}
                   >
                     <div className="flex items-center gap-4 mb-4 sm:mb-0">
                       <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 font-black text-lg uppercase">
                         {(coach.displayName || coach.firstName || coach.email)?.charAt(0)}
                       </div>
                       <div>
                         <h3 className="font-bold text-white text-lg">
                           {coach.displayName || (coach.firstName && coach.lastName ? `${coach.firstName} ${coach.lastName}` : (coach.firstName || coach.email?.split('@')[0] || 'Bilinmiyor'))}
                         </h3>
                         <p className="text-xs font-medium text-slate-500">{coach.email}</p>
                       </div>
                     </div>
                     <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                        <div className="text-left sm:text-right">
                           <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Cari / Sistem Bakiyesi</p>
                           <p className={`text-xl font-black ${(coach.systemBalance || 0) < 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                             ₺{(coach.systemBalance || 0).toLocaleString('tr-TR')}
                           </p>
                        </div>
                     </div>
                   </motion.div>
                 ))
              ) : (
                 <div className="p-10 text-center text-slate-500 font-medium italic">
                    Eşleşen kayıt bulunamadı.
                 </div>
              )}
            </div>
         </div>
      </div>
      {/* Show Coach Details Modal */}
      <AnimatePresence>
        {showCoachModal && selectedCoach && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b101b] border border-white/10 rounded-[32px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-xl uppercase border border-emerald-500/20">
                    {(selectedCoach.displayName || selectedCoach.firstName || selectedCoach.email)?.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white">
                      {selectedCoach.displayName || (selectedCoach.firstName && selectedCoach.lastName ? `${selectedCoach.firstName} ${selectedCoach.lastName}` : (selectedCoach.firstName || selectedCoach.email))}
                    </h2>
                    <p className="text-sm font-medium text-slate-400">{selectedCoach.email}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowCoachModal(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  X
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <Wallet size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sistem Bakiyesi</span>
                    </div>
                    <p className={`text-4xl font-black ${(selectedCoach.systemBalance || 0) < 500 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      ₺{(selectedCoach.systemBalance || 0).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  
                  <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <TrendingUp size={20} />
                      </div>
                      <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Toplam Kazanç</span>
                    </div>
                    <p className="text-4xl font-black text-blue-400">
                      ₺{totalEarnings.toLocaleString('tr-TR')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left: Operations & Filters */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-[24px]">
                      <h3 className="text-sm font-black text-white flex items-center gap-2 mb-4">
                         <Plus className="text-emerald-500" />
                         Sisteme Bakiye Yükle
                      </h3>
                      <form onSubmit={handleAddBalance} className="space-y-4">
                         <div>
                           <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black">₺</span>
                             <input
                               type="number"
                               required
                               min="1"
                               value={amount}
                               onChange={(e) => setAmount(e.target.value)}
                               className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white hover:border-emerald-500/30 focus:border-emerald-500 text-lg font-black outline-none transition-all"
                               placeholder="0"
                             />
                           </div>
                         </div>
                         <button
                           type="submit"
                           disabled={isAdding || success}
                           className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl py-3 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                         >
                           {isAdding ? <Loader2 className="animate-spin" size={16} /> : success ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                           {success ? 'Yüklendi' : 'Yükle'}
                         </button>
                      </form>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-[24px]">
                       <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 px-2">Filtreler</h3>
                       <div className="space-y-2">
                         <button 
                            onClick={() => setTxFilter('all')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${txFilter === 'all' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                         >
                           Tüm İşlemler
                         </button>
                         <button 
                            onClick={() => setTxFilter('system')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${txFilter === 'system' ? 'bg-yellow-500/20 text-yellow-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                         >
                           Sistem Bakiyesi Hrk.
                         </button>
                         <button 
                            onClick={() => setTxFilter('student')}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${txFilter === 'student' ? 'bg-blue-500/20 text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                         >
                           Öğrenci Bakiyesi Hrk.
                         </button>
                       </div>
                    </div>
                  </div>

                  {/* Right: Transactions List */}
                  <div className="lg:col-span-8">
                     <h3 className="text-lg font-black text-white flex items-center gap-2 mb-4">
                         <History className="text-slate-400" /> İşlem Geçmişi
                     </h3>

                     {loadingTransactions ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-emerald-500" /></div>
                     ) : filteredTxs.length > 0 ? (
                        <div className="space-y-3">
                           {filteredTxs.map(tx => {
                             let isSystem = false;
                             let dir = 'out';
                             let category = 'student';
                             
                             if (tx.coachId === 'SYSTEM' && tx.type === 'DEPOSIT') {
                               isSystem = true;
                               dir = 'in'; // System deposit
                               category = 'system';
                             } else if (tx.type === 'WITHDRAWAL' && tx.coachId !== 'SYSTEM') {
                               dir = 'out'; // Student withdrawal & System deduction
                               category = 'student'; // basically meaning it deducts from both
                             } else if (tx.type === 'DEPOSIT' && tx.coachId !== 'SYSTEM') {
                               dir = 'in'; // Student deposit
                               category = 'student';
                             }

                             let matchedStudent = coachStudents.find(s => s.uid === tx.studentId);
                             let relatedName = isSystem ? 'Sistem' : (matchedStudent?.displayName || matchedStudent?.firstName || 'Öğrenci');

                             return (
                               <div 
                                 key={tx.id} 
                                 className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors gap-4 ${dir === 'out' ? 'cursor-pointer' : ''}`}
                                 onClick={() => dir === 'out' && setSelectedTx({...tx, dir, isSystem, relatedName})}
                               >
                                  <div className="flex items-center gap-4">
                                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
                                       category === 'system' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' : 
                                       'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                     }`}>
                                       {dir === 'in' ? <ArrowDownLeft size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                                     </div>
                                     <div className="min-w-0">
                                        <p className="text-sm font-bold text-white truncate">
                                          {isSystem ? 'Sistem Yüklemesi' : `Öğrenci İşlemi - ${relatedName}`}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate max-w-sm">{tx.description || 'Açıklama yok'}</p>
                                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">
                                          {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year:'numeric', hour:'2-digit', minute:'2-digit'})}
                                        </p>
                                     </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className={`text-lg font-black ${dir === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {dir === 'in' ? '+' : '-'}{tx.amount.toFixed(2)} ₺
                                    </p>
                                    {tx.type === 'WITHDRAWAL' && tx.coachDeductionAmount !== undefined && tx.coachDeductionAmount !== tx.amount && (
                                       <p className="text-[10px] text-yellow-400 mt-0.5">
                                         Sistem Kesintisi: -{tx.coachDeductionAmount.toFixed(2)} ₺
                                       </p>
                                    )}
                                  </div>
                               </div>
                             );
                           })}
                        </div>
                     ) : (
                        <div className="p-10 text-center border border-dashed border-white/10 rounded-[24px]">
                          <p className="text-slate-400 font-medium">Bu filtrelere uygun işlem bulunamadı.</p>
                        </div>
                     )}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    selectedTx.dir === 'in' 
                       ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                       : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                 }`}>
                    {selectedTx.dir === 'in' ? <ArrowDownLeft size={32} strokeWidth={2.5}/> : <ArrowUpRight size={32} strokeWidth={2.5} />}
                 </div>
                 <h3 className="text-xl font-bold text-white text-center">İşlem Detayı</h3>
                 <p className="text-slate-400 text-sm">{selectedTx.isSystem ? 'Sistem Yüklemesi' : `Öğrenci İşlemi - ${selectedTx.relatedName}`}</p>
                 <div className={`mt-4 text-3xl font-black ${selectedTx.dir === 'in' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedTx.dir === 'in' ? '+' : '-'}{selectedTx.amount.toFixed(2)} ₺
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
                       <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3 mt-2">Harcanan Kalemler</div>
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
                 {selectedTx.type === 'WITHDRAWAL' && selectedTx.coachDeductionAmount !== undefined && selectedTx.coachDeductionAmount !== selectedTx.amount && (
                    <div>
                       <div className="text-yellow-500 text-xs font-bold uppercase tracking-widest mb-1 mt-2">Sistem Kesintisi</div>
                       <div className="font-medium text-yellow-400">-{selectedTx.coachDeductionAmount.toFixed(2)} ₺</div>
                    </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global History Modal */}
      <AnimatePresence>
        {showGlobalHistory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-[32px] p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-2">
                    <History className="text-emerald-500" />
                    Tüm Sistem Yüklemeleri Logs
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Yönetici tarafından koçlara yapılan tüm bakiye yüklemeleri liste halindedir.
                  </p>
                </div>
                <button 
                  onClick={() => setShowGlobalHistory(false)}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/30 transition-all"
                >
                  X
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {globalTransactions.length > 0 ? (
                  globalTransactions.map(tx => {
                    const matchedCoach = coaches.find(c => c.uid === tx.studentId);
                    const coachName = matchedCoach 
                      ? (matchedCoach.displayName || (matchedCoach.firstName ? `${matchedCoach.firstName} ${matchedCoach.lastName}` : matchedCoach.email)) 
                      : 'Bilinmeyen Koç';
                    
                    return (
                      <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors gap-4">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-400`}>
                            <ArrowDownLeft size={20} strokeWidth={2.5} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-white truncate">Koç: {coachName}</p>
                            <p className="text-xs text-slate-400">{tx.description || 'Sistem Yüklemesi'}</p>
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                              <Clock size={10}/>
                              {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour:'2-digit', minute:'2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className={`text-lg font-black shrink-0 sm:text-right text-emerald-400`}>
                          +{tx.amount} ₺
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm font-medium text-slate-500 text-center py-10">Sistem yükleme geçmişi bulunmuyor.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
