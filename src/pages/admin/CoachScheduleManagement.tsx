import React, { useState, useEffect } from 'react';
import { Users, Search, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import CoachScheduleManager from '../../components/appointments/CoachScheduleManager';

interface Coach {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

export default function CoachScheduleManagement() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);

  useEffect(() => {
    async function loadCoaches() {
      try {
        const data = await appointmentService.getCoaches();
        setCoaches(data);
      } catch (err) {
        console.error("Load coaches error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCoaches();
  }, []);

  const filteredCoaches = coaches.filter(c => 
    c.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Personel Çalışma Programları</h1>
        <p className="text-slate-400 mt-2">Personellerin haftalık müsaitlik durumlarını yönetin.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coach List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Personel ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/5 bg-white/5">
              <h3 className="font-bold text-sm text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} /> Personel Listesi
              </h3>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs text-slate-500 font-medium tracking-wide">Yükleniyor...</p>
                </div>
              ) : filteredCoaches.length > 0 ? (
                filteredCoaches.map((coach) => (
                  <button
                    key={coach.uid}
                    onClick={() => setSelectedCoach(coach)}
                    className={`w-full flex items-center gap-4 p-4 text-left transition-all group ${
                      selectedCoach?.uid === coach.uid 
                        ? 'bg-blue-600/10 border-l-4 border-blue-500' 
                        : 'hover:bg-white/5 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden shadow-inner">
                      {coach.photoURL ? (
                        <img src={coach.photoURL} alt={coach.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{coach.displayName?.charAt(0) || 'P'}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold truncate ${selectedCoach?.uid === coach.uid ? 'text-blue-400' : 'text-slate-200'}`}>
                        {coach.displayName || 'İsimsiz Personel'}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{coach.email}</p>
                    </div>
                    <ChevronRight size={16} className={`transition-transform duration-300 ${selectedCoach?.uid === coach.uid ? 'text-blue-500 rotate-90' : 'text-slate-600 group-hover:translate-x-1'}`} />
                  </button>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Clock className="mx-auto text-slate-700 mb-4" size={40} />
                  <p className="text-slate-500 text-sm font-medium">Personel bulunamadı.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Editor */}
        <div className="lg:col-span-8">
          {selectedCoach ? (
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] pointer-events-none group-hover:bg-blue-600/10 transition-colors duration-500" />
              <CoachScheduleManager 
                coachId={selectedCoach.uid} 
                coachName={selectedCoach.displayName} 
              />
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-16 text-center shadow-2xl backdrop-blur-sm">
              <div className="w-24 h-24 bg-blue-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-inner">
                <Users className="text-blue-500" size={48} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Düzenlemek için Personel Seçin</h3>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                Haftalık çalışma saatlerini, müsaitlik durumunu ve randevu slotlarını görüntülemek veya değiştirmek için soldaki listeden bir personel seçin.
              </p>
              
              <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-start gap-4 max-w-lg mx-auto text-left">
                <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
                <p className="text-blue-200/60 text-sm leading-relaxed">
                  <span className="font-bold text-blue-400">İpucu:</span> Çalışma saatleri güncellendiğinde, personel bir sonraki randevu alımında yeni saatleri üzerinden hizmet verecektir. Geçmiş randevular etkilenmez.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
