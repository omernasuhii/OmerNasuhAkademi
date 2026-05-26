import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calculator, 
  Download, 
  ChevronRight, 
  Search, 
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { appointmentService, Booking } from '../../services/appointmentService';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function PayrollManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    loadBookings();
  }, [selectedMonth]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      // For now, load all and filter in client (production should use Firestore queries)
      const data = await appointmentService.getAppointments('', 'admin');
      const start = startOfMonth(new Date(selectedMonth));
      const end = endOfMonth(new Date(selectedMonth));
      
      const filtered = data.filter(b => {
        const bDate = new Date(b.date);
        return bDate >= start && bDate <= end && b.status === 'completed';
      });
      setBookings(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCoachPayroll = () => {
    const payroll: { [key: string]: { name: string, count: number, total: number } } = {};
    
    bookings.forEach(b => {
      if (!b.coachId) return;
      if (!payroll[b.coachId]) {
        payroll[b.coachId] = { name: b.coachName || 'Bilinmeyen', count: 0, total: 0 };
      }
      payroll[b.coachId].count += 1;
      // Total calculation logic (could be more complex like % based)
      // For now using basePrice of the booking or a mock 100/app
      payroll[b.coachId].total += 100; // Mock: Every app completed adds 100 to coach
    });

    return Object.entries(payroll).map(([id, data]) => ({ id, ...data }));
  };

  const payrollData = getCoachPayroll();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Personel Bordro & Hakediş</h1>
          <p className="text-slate-500 mt-2 font-medium">Koçların aylık performans ve hakediş raporlarını yönetin.</p>
        </div>

        <div className="flex items-center gap-4">
           <div className="relative">
             <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input 
               type="month" 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               className="bg-slate-900 border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-600/50"
             />
           </div>
           <button className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-white/5 transition-all">
             <Download size={18} /> İndir
           </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px]">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-600/10 p-2 rounded-lg text-blue-400"><TrendingUp size={20} /></div>
            <span className="text-[10px] font-black text-blue-500 tracking-widest uppercase">Toplam Hakediş</span>
          </div>
          <h3 className="text-3xl font-black text-white font-mono">{payrollData.reduce((acc, curr) => acc + curr.total, 0)} ₺</h3>
          <p className="text-xs text-slate-500 mt-2">Bu ay dağıtılacak toplam tutar</p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px]">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-600/10 p-2 rounded-lg text-amber-400"><Briefcase size={20} /></div>
            <span className="text-[10px] font-black text-amber-500 tracking-widest uppercase">Eğitim Sayısı</span>
          </div>
          <h3 className="text-3xl font-black text-white font-mono">{bookings.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Tamamlanan toplam seans sayısı</p>
        </div>

        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[40px]">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-600/10 p-2 rounded-lg text-purple-400"><Users size={20} /></div>
            <span className="text-[10px] font-black text-purple-500 tracking-widest uppercase">Aktif Koç</span>
          </div>
          <h3 className="text-3xl font-black text-white font-mono">{payrollData.length}</h3>
          <p className="text-xs text-slate-500 mt-2">Bu ay hizmet veren personel sayısı</p>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
           <h2 className="text-xl font-bold text-white uppercase tracking-tight">Personel Listesi</h2>
           <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-950 px-4 py-2 rounded-full border border-white/5">
             <DollarSign size={14} className="text-emerald-500" />
             Seans Başı Sabit Hakediş: <span className="font-bold text-white">100 ₺</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Koç / Eğitmen</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tamamlanan Seans</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Birim Ücret</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Toplam Hakediş</th>
              </tr>
            </thead>
            <tbody>
              {payrollData.map((item) => (
                <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {item.name[0]}
                      </div>
                      <span className="font-bold text-white">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="bg-white/5 text-white px-4 py-1.5 rounded-full text-xs font-bold border border-white/5">{item.count} Adet</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-slate-500 font-mono">100 ₺</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="text-lg font-black text-white font-mono">{item.total} ₺</span>
                  </td>
                </tr>
              ))}

              {payrollData.length === 0 && !loading && (
                <tr>
                   <td colSpan={4} className="px-8 py-20 text-center">
                      <Calculator className="mx-auto text-slate-700 mb-4" size={48} />
                      <h3 className="text-xl font-bold text-white italic opacity-50">Bu ay için henüz veri yok.</h3>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
