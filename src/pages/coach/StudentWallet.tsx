import React, { useState, useEffect } from 'react';
import { useStudent } from '../../lib/StudentContext';
import { Wallet, Plus, Loader2, ArrowUpRight, CheckCircle2, History } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';

export default function StudentWallet() {
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [amountToAdd, setAmountToAdd] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [fetchingTransactions, setFetchingTransactions] = useState(true);

  useEffect(() => {
    if (selectedStudent?.uid) {
      loadTransactions();
    }
  }, [selectedStudent?.uid]);

  const loadTransactions = async () => {
    if (!selectedStudent) return;
    setFetchingTransactions(true);
    try {
      const txs = await studentDataService.getWalletTransactions(selectedStudent.uid);
      setTransactions(txs);
    } catch (err) {
      console.error(err);
    }
    setFetchingTransactions(false);
  };

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !amountToAdd || isNaN(Number(amountToAdd)) || Number(amountToAdd) <= 0) return;
    
    setLoading(true);
    try {
      const amount = parseFloat(amountToAdd);
      
      const res = await studentDataService.addWalletTransaction(
        selectedStudent.uid,
        {
          amount,
          type: 'DEPOSIT',
          description: 'Koç tarafından bakiye eklendi'
        }
      );
      
      if (res.success && res.newBalance !== undefined) {
        setSelectedStudent({
          ...selectedStudent,
          walletBalance: res.newBalance
        });
        setSuccess(true);
        setAmountToAdd('');
        setTimeout(() => setSuccess(false), 3000);
        loadTransactions();
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 text-sm italic">
        Lütfen önce bir öğrenci seçin.
      </div>
    );
  }

  const currentBalance = selectedStudent.walletBalance || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
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
           <div className="bg-slate-900/40 border border-emerald-500/20 rounded-3xl p-8 relative overflow-hidden group">
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
           <form onSubmit={handleAddBalance} className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
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

        {/* Right Column - Transactions */}
        <div className="lg:col-span-2">
           <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full">
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
                    <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                          tx.type === 'DEPOSIT' ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/10' : 'bg-red-500/20 text-red-400 shadow-red-500/10'
                        }`}>
                          <ArrowUpRight size={20} className={tx.type === 'DEPOSIT' ? 'rotate-45' : 'rotate-[135deg]'} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{tx.description || (tx.type === 'DEPOSIT' ? 'Bakiye Eklendi' : 'Ödeme Alındı')}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {new Date(tx.createdAt?.seconds ? tx.createdAt.seconds * 1000 : tx.date).toLocaleString('tr-TR')}
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
    </div>
  );
}
