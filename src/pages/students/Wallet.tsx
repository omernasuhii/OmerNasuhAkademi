import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Wallet as WalletIcon, History, ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { studentDataService } from '../../services/studentDataService';

export default function Wallet() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const txs = await studentDataService.getWalletTransactions(user!.uid);
      setTransactions(txs);
    } catch (err) {
      console.error("Cüzdan işlemleri yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentBalance = userData?.walletBalance || 0;
  
  const allTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            Cüzdan
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            TL Bakiyem
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Sistemdeki TL bakiyenizi ve harcama/yükleme geçmişinizi buradan görüntüleyebilirsiniz. Yeni paketler bu bakiye üzerinden tahsil edilir. Eğitim koçunuz tarafından tanımlama yapılır.
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
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
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
              <div key={tx.id || idx} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-2xl transition-all group">
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
    </div>
  );
}
