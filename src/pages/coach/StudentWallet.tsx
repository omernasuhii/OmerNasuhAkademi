import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { Wallet, Plus, Loader2, ArrowUpRight, ArrowDownLeft, CheckCircle2, History, X, Check, CreditCard } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { isSubscriptionActive, checkAndRenewSubscription } from '../../services/subscriptionService';
import { motion, AnimatePresence } from 'motion/react';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import NoStudentSelected from '../../components/NoStudentSelected';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';

const DEMO_TRANSACTIONS = [
  {
    id: 'tx-1',
    amount: 1500,
    type: 'DEPOSIT',
    description: 'Koç tarafından bakiye eklendi (Abonelik Katkısı)',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 2 }
  },
  {
    id: 'tx-2',
    amount: 750,
    type: 'WITHDRAWAL',
    description: 'YKS Koçluk Abonelik Otomatik Tahsilatı',
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 86400 * 15 }
  }
];

export default function StudentWallet() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [fetchingTransactions, setFetchingTransactions] = useState(true);

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);

  useEffect(() => {
    if (!selectedStudent && (location.state?.startTour || location.state?.isDemo)) {
      setSelectedStudent(SAMPLE_DEMO_STUDENT);
    }
  }, [selectedStudent, setSelectedStudent, location.state]);

  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_wallet', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_wallet', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-wallet-header',
      title: 'Ön Ödemeli Cüzdan Paneli',
      description: `${activeStudent?.displayName || 'Seçili öğrenci'} için hesap bakiyesi ve finansal işlem geçmişinin yönetildiği merkezdir.`,
      position: 'bottom'
    },
    {
      targetId: 'tour-wallet-balance',
      title: 'Güncel Cüzdan Bakiyesi',
      description: 'Öğrencinin hesabındaki aktif bakiye gösterilir. İleri tarihli abonelik yenilemeleri ve koçluk paket ödemeleri bu bakiyeden otomatik olarak tahsil edilir.',
      position: 'bottom'
    },
    {
      targetId: 'tour-wallet-add',
      title: 'Bakiye Yükleme Formu',
      description: 'Koç veya yönetici olarak öğrenci cüzdanına anında bakiye ekleyebilirsiniz. Ekleme sonrası varsa vadesi gelen abonelik otomatik aktifleşir.',
      position: 'top'
    },
    {
      targetId: 'tour-wallet-subscription',
      title: 'Mevcut Abonelik Paketi & Durumu',
      description: 'Öğrencinin tanımlı paketi, başlangıç ve bitiş tarihleri ile aboneliğin aktiflik durumu burada yer alır.',
      position: 'top'
    },
    {
      targetId: 'tour-wallet-transactions',
      title: 'İşlem Geçmişi & Harcama Takibi',
      description: 'Cüzdana yapılan tüm bakiye yüklemeleri ve otomatik çekilen abonelik tahsilatları tarih detaylarıyla listelenir. İşleme tıklayarak harcama kalemlerini inceleyebilirsiniz.',
      position: 'top'
    }
  ];

  useEffect(() => {
    if (activeStudent?.uid) {
      loadTransactions();
    } else {
      setFetchingTransactions(false);
    }
  }, [activeStudent?.uid]);

  const loadTransactions = async () => {
    if (!activeStudent) return;
    setFetchingTransactions(true);
    try {
      const txs = await studentDataService.getWalletTransactions(activeStudent.uid);
      if (txs && txs.length > 0) {
        setTransactions(txs);
      } else if (location.state?.startTour || location.state?.isDemo) {
        setTransactions(DEMO_TRANSACTIONS);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(err);
      if (location.state?.startTour || location.state?.isDemo) {
        setTransactions(DEMO_TRANSACTIONS);
      }
    }
    setFetchingTransactions(false);
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudent || !amountToAdd || isNaN(Number(amountToAdd)) || Number(amountToAdd) <= 0) return;
    
    setLoading(true);
    try {
      const amount = parseFloat(amountToAdd);
      
      const res = await studentDataService.addWalletTransaction(
        activeStudent.uid,
        {
          amount,
          type: 'DEPOSIT',
          description: 'Koç tarafından bakiye eklendi'
        }
      );
      
      if (res.success && res.newBalance !== undefined) {
        const updatedStudent = {
          ...activeStudent,
          walletBalance: res.newBalance
        };
        setSelectedStudent(updatedStudent);
        setSuccess(true);
        setAmountToAdd('');
        setTimeout(() => setSuccess(false), 3000);
        loadTransactions();

        // Check auto-renew after deposit
        checkAndRenewSubscription(updatedStudent, activeStudent.uid).catch(console.error);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!activeStudent) {
    return <NoStudentSelected />;
  }

  const currentBalance = activeStudent.walletBalance ?? 750;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Belirtilmedi';
    try {
      if (typeof dateVal === 'object' && dateVal.seconds) {
        return new Date(dateVal.seconds * 1000).toLocaleDateString('tr-TR');
      }
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('tr-TR');
      }
    } catch (e) {
      return 'Belirtilmedi';
    }
    return 'Belirtilmedi';
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_wallet', user?.uid);
          navigate('/panel/koc/asistan', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="ON Asistan Turu"
        tourKey="student_wallet"
      />

      <div id="tour-wallet-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Wallet className="text-emerald-500" size={32} />
            Ön Ödemeli Cüzdan
          </h2>
          <p className="text-slate-400 mt-2 flex items-center gap-2">
            Öğrencinin bakiyesi ileri tarihli abonelik tahsilatları için kullanılır.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card */}
           <div id="tour-wallet-balance" className="bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-500" />
             <p className="text-emerald-500/70 font-black text-[10px] uppercase tracking-[0.2em] mb-2 flex items-center gap-2 relative z-10">
                GÜNCEL BAKİYE
             </p>
             <div className="flex items-baseline gap-2 relative z-10">
               <span className="text-5xl font-black text-white">{currentBalance.toFixed(2)}</span>
               <span className="text-xl font-bold text-emerald-500">₺</span>
             </div>
           </div>

           {/* Add Balance Form */}
           <form id="tour-wallet-add" onSubmit={handleAddBalance} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Plus className="text-blue-500" size={20} />
                Bakiye Ekle
              </h3>
              
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                      Eklenecek Tutar (₺)
                    </label>
                    <input 
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amountToAdd}
                      onChange={(e) => setAmountToAdd(e.target.value)}
                      placeholder="Örn: 500"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:border-blue-500/50 outline-none transition-all placeholder:text-slate-600 focus:bg-blue-500/5"
                    />
                 </div>
                 
                 <button 
                   type="submit"
                   disabled={loading || !amountToAdd}
                   className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                 >
                   {loading ? (
                     <Loader2 size={18} className="animate-spin" /> 
                   ) : (
                     <Plus size={18} className="group-hover:scale-110 transition-transform" />
                   )}
                   {loading ? 'Ekleniyor...' : 'Bakiyeyi Ekle'}
                 </button>

                 {success && (
                   <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-center gap-2 text-emerald-400 text-sm font-bold animate-in fade-in">
                     <CheckCircle2 size={16} /> Bakiye başarıyla eklendi!
                   </div>
                 )}
              </div>
           </form>
        </div>

        {/* Right Column - Subscription Info & Transactions */}
        <div className="lg:col-span-2 space-y-6">
           {/* Student Subscription Status Card */}
           <div id="tour-wallet-subscription" className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                 <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                       <CreditCard size={14} /> MEVCUT ABONELİK DURUMU
                    </p>
                    <h3 className="text-xl font-bold text-white capitalize">
                       {activeStudent.subscriptionPlan || 'YKS Derece Paketi (VIP)'}
                    </h3>
                 </div>
                 <div>
                    {(() => {
                       const subActive = isSubscriptionActive(activeStudent) || activeStudent === SAMPLE_DEMO_STUDENT;
                       const isExpired = activeStudent.subscriptionStatus === 'expired';
                       return (
                         <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                            subActive 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : isExpired
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-slate-800 text-slate-400 border border-white/10'
                         }`}>
                            <span className={`w-2 h-2 rounded-full ${
                               subActive ? 'bg-emerald-400 animate-pulse' : isExpired ? 'bg-red-400' : 'bg-slate-500'
                            }`} />
                            {subActive ? 'Aktif Abonelik' : isExpired ? 'Süresi Doldu' : 'Pasif / Yok'}
                         </span>
                       );
                    })()}
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-xs">
                 <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-slate-400 block mb-1 font-medium">Başlangıç Tarihi</span>
                    <span className="text-white font-black text-sm">{formatDate(activeStudent.subscriptionStartDate || new Date('2026-01-01'))}</span>
                 </div>
                 <div className="bg-white/5 p-3.5 rounded-2xl border border-white/5">
                    <span className="text-slate-400 block mb-1 font-medium">Bitiş Tarihi</span>
                    <span className="text-white font-black text-sm">{formatDate(activeStudent.subscriptionEndDate || new Date('2026-12-31'))}</span>
                 </div>
              </div>
           </div>

           {/* Son İşlemler */}
           <div id="tour-wallet-transactions" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <History className="text-slate-400" size={20} />
                Son İşlemler
              </h3>
              
              {fetchingTransactions ? (
                <div className="flex items-center justify-center h-40 text-slate-500">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <div 
                      key={tx.id} 
                      onClick={() => tx.type === 'WITHDRAWAL' && setSelectedTx(tx)}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all ${tx.type === 'WITHDRAWAL' ? 'cursor-pointer' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                          tx.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10' : 'bg-red-500/20 text-red-400 shadow-red-500/10'
                        }`}>
                          {tx.type === 'DEPOSIT' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{tx.description || (tx.type === 'DEPOSIT' ? 'Bakiye Eklendi' : 'Ödeme Alındı')}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(tx.createdAt?.seconds ? tx.createdAt.seconds * 1000 : tx.date || Date.now()).toLocaleString('tr-TR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-lg font-black ${tx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount.toFixed(2)} ₺
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center">
                  <Wallet className="mx-auto text-slate-600 mb-3" size={32} />
                  <p className="text-slate-400 text-sm font-medium">Henüz hiçbir işlem bulunmuyor.</p>
                  <p className="text-slate-500 text-xs mt-1">Cüzdana bakiye eklendikçe burada listelenecektir.</p>
                </div>
              )}
           </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                       : 'bg-red-500/10 border-red-500/20 text-red-400'
                 }`}>
                    {selectedTx.type === 'DEPOSIT' ? <ArrowDownLeft size={32} strokeWidth={2.5}/> : <ArrowUpRight size={32} strokeWidth={2.5} />}
                 </div>
                 <h3 className="text-xl font-bold text-white text-center">İşlem Detayı</h3>
                 <p className="text-slate-400 text-sm">{selectedTx.type === 'DEPOSIT' ? 'Gelen Bakiye' : 'Öğrenci Harcaması'}</p>
                 <div className={`mt-4 text-3xl font-black ${selectedTx.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {selectedTx.type === 'DEPOSIT' ? '+' : '-'}{selectedTx.amount.toFixed(2)} ₺
                 </div>
              </div>
              
              <div className="space-y-4 text-sm text-slate-300 bg-white/5 p-4 rounded-xl border border-white/10 mt-4 h-max overflow-y-auto max-h-[40vh]">
                 <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Açıklama</div>
                    <div className="font-medium text-white">{selectedTx.description || 'Detay bulunmuyor'}</div>
                 </div>
                 <div>
                    <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Tarih</div>
                    <div className="font-medium text-white">{new Date(selectedTx.createdAt?.seconds ? selectedTx.createdAt.seconds * 1000 : selectedTx.date || Date.now()).toLocaleString('tr-TR')}</div>
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
                                <span className="font-medium text-red-400">{item.price} ₺</span>
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
    </div>
  );
}
