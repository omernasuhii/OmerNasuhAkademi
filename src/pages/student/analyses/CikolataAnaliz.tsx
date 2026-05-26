import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Plus, 
  Minus, 
  History, 
  Zap, 
  Info,
  Flame,
  Candy,
  Coins,
  Store,
  Timer,
  Smartphone,
  Gamepad2,
  Tv,
  Coffee,
  Heart,
  Target,
  Brain,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  HelpCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { chocolateBankService, BankTransaction } from '../../../services/chocolateBankService';
import { useNavigate } from 'react-router-dom';
import { analysisService } from '../../../services/analysisService';
import Markdown from 'react-markdown';

const INCOME_ITEMS = [
  { id: 'focus_block', label: 'Odaklanmış Blok Çalışma (40 dk)', cp: 50, icon: Timer },
  { id: 'math_science', label: 'Matematik/Fen Sorusu (Tane)', cp: 2, icon: Target },
  { id: 'verbal', label: 'Sözel Ders Sorusu (Tane)', cp: 1, icon: Brain },
  { id: 'wakeup', label: 'Erken Kalkmak (07:00 öncesi)', cp: 30, icon: Flame },
  { id: 'exam', label: 'Deneme Sınavı (Analiz Dahil)', cp: 200, icon: ShieldCheck },
  { id: 'reading', label: 'Kitap Okumak (Sayfa Başı)', cp: 1, icon: Plus },
  { id: 'weekly_goal', label: 'Haftalık Hedef %100 (Bonus)', cp: 500, icon: Zap },
];

const EXPENSE_ITEMS = [
  { id: 'social_media', label: 'Instagram / YouTube (15 dk)', cp: 50, icon: Smartphone },
  { id: 'gaming', label: 'Bilgisayar Oyunu (30 dk)', cp: 150, icon: Gamepad2 },
  { id: 'series', label: 'Dizi / Film (1 Bölüm)', cp: 200, icon: Tv },
  { id: 'social_out', label: 'Arkadaşlar / Dışarı (Yarım Gün)', cp: 500, icon: Coffee },
  { id: 'candy_real', label: 'Gerçek Çikolata / Tatlı Yemek', cp: 50, icon: Candy },
  { id: 'sleep_late', label: 'Sabah Geç Kalkmak (Uyku)', cp: 100, icon: ArrowDownCircle },
];

export default function CikolataAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<'income' | 'expense' | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [amountInput, setAmountInput] = useState<number>(1);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (user) {
      loadBankData();
    }
  }, [user]);

  const loadBankData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const status = await chocolateBankService.getBankStatus(user.uid);
      const history = await chocolateBankService.getTransactions(user.uid);
      setBalance(status.balance);
      setTransactions(history);
    } catch (error) {
      console.error("Bank verisi yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async () => {
    if (!user || !selectedItem) return;
    
    const totalAmount = selectedItem.cp * amountInput;
    const finalAmount = showModal === 'income' ? totalAmount : -totalAmount;
    const description = `${amountInput}x ${selectedItem.label}`;
    
    try {
      await chocolateBankService.addTransaction(
        user.uid, 
        finalAmount, 
        description, 
        showModal as 'income' | 'expense'
      );
      await loadBankData();
      setShowModal(null);
      setSelectedItem(null);
      setAmountInput(1);
    } catch (error: any) {
      alert(error.message || "İşlem sırasında bir hata oluştu.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin text-amber-500">
           <Zap size={40} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-32 pt-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-4">
        <div className="space-y-2">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em] mb-4"
          >
            <ChevronLeft size={16} />
            Akademi Paneli
          </button>
          <h1 className="text-4xl font-black text-white italic tracking-tight">
            ÇİKOLATA <span className="text-amber-500">BANKASI</span>
          </h1>
          <p className="text-slate-400 font-medium text-sm">Ödül Ekonomisi Takip ve İrade Yönetim Merkezi</p>
        </div>
        <button 
           onClick={() => setShowRules(true)}
           className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
        >
          <Info size={16} className="text-amber-500" />
          Banka Kuralları
        </button>
      </header>
      <div className="mx-4 relative group">
        <div className="absolute inset-0 bg-amber-500/20 blur-[100px] animate-pulse pointer-events-none" />
        <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-[48px] p-10 md:p-16 overflow-hidden">
           {/* Abstract Background Elements */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rotate-45 translate-x-32 -translate-y-32" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 -rotate-45 -translate-x-32 translate-y-32" />

           <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-8">
              <div className="space-y-2">
                 <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.4em]">MEVCUT BAKİYE</span>
                 <div className="flex items-center justify-center gap-4">
                    <Coins size={48} className="text-amber-500" />
                    <span className="text-7xl md:text-8xl font-black text-white italic tracking-tighter">
                       {balance}
                    </span>
                    <span className="text-2xl font-black text-amber-500 mt-6 italic">ÇP</span>
                 </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                  <button 
                    onClick={() => setShowModal('income')}
                    className="flex items-center justify-center gap-3 px-8 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[24px] font-black text-lg transition-all hover:scale-[1.02] shadow-xl shadow-emerald-600/20 group"
                  >
                     <Plus size={24} className="group-hover:rotate-90 transition-transform" />
                     ÇP KAZAN
                  </button>
                  <button 
                    onClick={() => setShowModal('expense')}
                    className="flex items-center justify-center gap-3 px-8 py-6 bg-rose-600 hover:bg-rose-500 text-white rounded-[24px] font-black text-lg transition-all hover:scale-[1.02] shadow-xl shadow-rose-600/20 group"
                  >
                     <Minus size={24} className="group-hover:scale-110 transition-transform" />
                     ÇP HARCA
                  </button>
               </div>
           </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="mx-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Transaction History */}
         <div className="lg:col-span-2 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-2">
                 <History size={18} className="text-amber-500" />
                 <h3 className="text-sm font-black text-white uppercase tracking-widest">SON İŞLEMLER</h3>
              </div>
              <div className="bg-slate-900 border border-white/5 rounded-[32px] overflow-hidden">
                 {transactions.length > 0 ? (
                   <div className="divide-y divide-white/5">
                     {transactions.map((tx) => (
                       <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-white/5 transition-all">
                          <div className="flex items-center gap-4">
                             <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {tx.type === 'income' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                             </div>
                             <div>
                                <p className="text-white font-bold text-sm tracking-tight">{tx.description}</p>
                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                                  {tx.timestamp.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </div>
                          </div>
                          <div className={`font-black text-lg italic ${tx.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {tx.type === 'income' ? '+' : ''}{tx.amount}
                          </div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="p-16 text-center space-y-4">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-700">
                         <History size={32} />
                      </div>
                      <p className="text-slate-500 text-sm font-medium italic">Henüz bir işlem kaydı bulunmuyor.</p>
                   </div>
                 )}
              </div>
            </section>
         </div>

         {/* Sidebar Stats / Info */}
         <div className="space-y-6">
            <div className="bg-amber-600/10 border border-amber-600/20 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-3">
                   <TrendingUp size={18} className="text-amber-500" />
                   <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">HAFTALIK ÖZET</h3>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Toplam Kazanç</span>
                      <span className="text-emerald-500 font-black italic">
                        +{transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0)} ÇP
                      </span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400 font-medium">Toplam Harcama</span>
                      <span className="text-rose-500 font-black italic">
                        {transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0)} ÇP
                      </span>
                   </div>
                   <div className="pt-4 border-t border-amber-500/10 text-center">
                       <p className="text-[10px] text-amber-500/50 font-black uppercase tracking-widest mb-2">AKADEMİ MOTTO</p>
                       <p className="text-slate-200 text-sm font-bold italic leading-relaxed">
                         "İraden en büyük sermayendir. Onu akıllıca harca."
                       </p>
                   </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[32px] p-6 space-y-4">
               <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PREMACK İLKESİ</h3>
               <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                 "Ispanağını yersen (ders), çikolatanı yiyebilirsin (ödül)."
               </p>
            </div>
         </div>
      </div>

      {/* Transaction Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
               onClick={() => setShowModal(null)}
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
            >
               <div className="p-8 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-white italic">
                     {showModal === 'income' ? 'PUAN KAZAN' : 'ÖDÜL HARCA'}
                  </h3>
                  <button onClick={() => setShowModal(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                     <Plus size={24} className="rotate-45 text-slate-500" />
                  </button>
               </div>

               <div className="p-8 space-y-6">
                  {selectedItem ? (
                    <div className="space-y-8">
                       <div className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${showModal === 'income' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                             <selectedItem.icon size={32} />
                          </div>
                          <div className="flex-1">
                             <h4 className="text-xl font-black text-white">{selectedItem.label}</h4>
                             <p className={`font-black ${showModal === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {showModal === 'income' ? '+' : '-'}{selectedItem.cp} ÇP
                             </p>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2">MİKTAR / ADET</label>
                          <div className="flex items-center gap-4">
                             <button 
                                onClick={() => setAmountInput(Math.max(1, amountInput - 1))}
                                className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
                             >
                                <Minus size={24} />
                             </button>
                             <div className="flex-1 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-3xl font-black text-white italic">
                                {amountInput}
                             </div>
                             <button 
                                onClick={() => setAmountInput(amountInput + 1)}
                                className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all"
                             >
                                <Plus size={24} />
                             </button>
                          </div>
                       </div>

                       <div className="pt-4 space-y-4">
                          <div className="flex justify-between items-center px-4">
                             <div className="space-y-1">
                                <span className="text-slate-400 font-bold block text-sm">Toplam Tutar:</span>
                                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Mevcut Bakiye: {balance} ÇP</span>
                             </div>
                             <span className={`text-3xl font-black italic ${showModal === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {showModal === 'income' ? '+' : '-'}{selectedItem.cp * amountInput} ÇP
                             </span>
                          </div>
                          
                          {showModal === 'expense' && balance < (selectedItem.cp * amountInput) && (
                            <div className="px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
                               <AlertCircle size={18} />
                               <p className="text-xs font-bold uppercase tracking-tight">Bu ödül için yeterli bakiyen yok!</p>
                            </div>
                          )}

                          <button 
                            onClick={handleTransaction}
                            disabled={showModal === 'expense' && balance < (selectedItem.cp * amountInput)}
                            className={`w-full py-6 rounded-[24px] font-black text-xl transition-all shadow-xl disabled:opacity-30 disabled:grayscale disabled:scale-100 ${
                               showModal === 'income' 
                               ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                               : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                            }`}
                          >
                             {showModal === 'expense' && balance < (selectedItem.cp * amountInput) ? 'BAKİYE YETERSİZ' : 'İŞLEMİ ONAYLA'}
                          </button>
                          <button 
                             onClick={() => setSelectedItem(null)}
                             className="w-full py-4 text-slate-500 font-bold hover:text-white transition-colors"
                          >
                             Vazgeç
                          </button>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                       {(showModal === 'income' ? INCOME_ITEMS : EXPENSE_ITEMS).map((item) => {
                         const cannotAfford = showModal === 'expense' && balance < item.cp;
                         return (
                           <button
                             key={item.id}
                             onClick={() => setSelectedItem(item)}
                             className={`p-4 rounded-2xl bg-white/5 border border-white/5 transition-all flex items-center gap-4 text-left group ${
                               cannotAfford ? 'opacity-40 grayscale-[0.5]' : 'hover:border-white/20'
                             }`}
                           >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${showModal === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                 <item.icon size={20} />
                              </div>
                              <div className="flex-1">
                                 <p className="text-xs font-black text-white uppercase tracking-tight leading-tight">{item.label}</p>
                                 <p className={`text-[10px] font-black ${showModal === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                   {showModal === 'income' ? '+' : '-'}{item.cp} ÇP
                                 </p>
                              </div>
                              {cannotAfford && <AlertCircle size={14} className="text-rose-500" />}
                           </button>
                         );
                       })}
                    </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
               onClick={() => setShowRules(false)}
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
               className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[40px] p-10 space-y-8"
            >
               <div className="text-center space-y-2">
                 <h3 className="text-3xl font-black text-white italic">BANKA KURALLARI</h3>
                 <p className="text-amber-500 font-bold text-xs uppercase tracking-widest">DİSİPLİN ANAYASASI</p>
               </div>
               <div className="space-y-6">
                  <div className="space-y-4">
                     <div className="flex gap-4 p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                        <AlertCircle className="text-rose-500 shrink-0" size={24} />
                        <div>
                           <p className="text-white font-black text-sm uppercase tracking-tight">KURAL 1: KREDİ YOK</p>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed">
                             Bakiye sıfırsa ödül alınamaz. "Yarın çalışıp öderim" diyerek eksiye düşmek yasaktır. Önce hak edilir.
                           </p>
                        </div>
                     </div>
                     <div className="flex gap-4 p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                        <ShieldCheck className="text-blue-500 shrink-0" size={24} />
                        <div>
                           <p className="text-white font-black text-sm uppercase tracking-tight">KURAL 2: TEMEL İHTİYAÇLAR</p>
                           <p className="text-xs text-slate-400 font-medium leading-relaxed">
                             Yemek, tuvalet, uyku (makul saatte) ve aile sohbeti puanla satılamaz. Bunlar haktır.
                           </p>
                        </div>
                     </div>
                  </div>
                  <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-3xl text-center">
                      <p className="text-amber-500 text-xs font-black uppercase tracking-widest mb-2">KURAMSAL DAYANAK</p>
                      <p className="text-slate-400 text-sm font-medium italic leading-relaxed">
                        Walter Mischel'in 'Marshmallow Deneyi' sonucuna göre, hazzı erteleyen bireyler hayatta daha başarılı olur. Bu banka o iradeyi güçlendirir.
                      </p>
                  </div>
               </div>
               <button 
                 onClick={() => setShowRules(false)}
                 className="w-full py-4 bg-white text-slate-950 rounded-2xl font-black uppercase tracking-widest"
               >
                 Anladım
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
