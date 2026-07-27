import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import AppointmentList from '../../components/appointments/AppointmentList';
import { Calendar, Filter, Download } from 'lucide-react';
import CoachBookingModal from '../../components/appointments/CoachBookingModal';

export default function CoachAppointments() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             RANDEVU TAKVİMİM
          </h1>
          <p className="text-slate-500 mt-1">Gelecek seanslarınız ve geçmiş görüşme kayıtlarınız.</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-white/5 hover:bg-white/10 border border-white/5 p-3 rounded-2xl text-slate-400 transition-all">
              <Download size={20} />
           </button>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
           >
              <Calendar size={20} /> Yeni Randevu Ekle
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
         <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Görüşme Listesi</h3>
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sırala:</span>
                  <select className="bg-transparent text-xs font-bold text-slate-400 outline-none cursor-pointer">
                     <option>En Yakın Tarih</option>
                     <option>Geçmiş Randevular</option>
                  </select>
               </div>
            </div>
            
            <AppointmentList key={refreshKey} role="coach" />
         </div>
      </div>

      <CoachBookingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
           setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}
