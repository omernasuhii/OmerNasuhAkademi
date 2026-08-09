import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import AppointmentList from '../../components/appointments/AppointmentList';
import CoachScheduleManager from '../../components/appointments/CoachScheduleManager';
import { Calendar, Download, Sparkles, Settings, ListFilter, PlusCircle } from 'lucide-react';
import CoachBookingModal from '../../components/appointments/CoachBookingModal';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';

export default function CoachAppointments() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'list' | 'settings'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('coach_appointments', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('coach_appointments', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-appointments-header',
      title: 'Randevu Takvimi Yönetimi',
      description: 'Tüm öğrenci görüşmelerinizi, canlı seanslarınızı, veli toplantılarınızı ve takvim ayarlarınızı buradan kapsayıcı şekilde takip edebilirsiniz.',
      position: 'bottom'
    },
    {
      targetId: 'tour-appointments-tabs',
      title: 'Sekmeler & Takvim Ayarları',
      description: 'Görüşmeler listeniz ile Çalışma Saatleri / Randevu Ayarları arasında geçiş yapabilirsiniz.',
      position: 'bottom'
    },
    {
      targetId: 'tour-appointments-add',
      title: 'Yeni Randevu Ekleme Ekranı',
      description: 'Öğrenci veya velileriniz için tarih, saat ve online/yüz yüze modunu belirleyerek anında yeni randevu veya seans atayabilirsiniz.',
      position: 'left'
    },
    {
      targetId: 'tour-appointments-list',
      title: 'Randevu Durumları & Kayıtlar',
      description: 'Randevu listenizde 5 temel durum bulunur:\n• Beklemede (Öğrenci/veli talebi)\n• Onaylandı (Görüşme zamanı bekleniyor)\n• Katıldı (Seans başarıyla tamamlandı)\n• Katılmadı (Görüşmeye gelinmedi)\n• İptal Edildi (Reddedilen veya iptal seanslar).',
      position: 'top'
    },
    {
      targetId: 'tour-appointments-settings-tab',
      title: 'Randevu & Çalışma Saati Ayarları',
      description: 'Öğrencilerin randevu alabileceği haftalık uygun saatlerinizi belirleyebilir, resmi tatil ve kapalı günlerinizi tanımayabilirsiniz.',
      position: 'left'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('coach_appointments', user?.uid);
          navigate('/panel/koc/degerlendirme', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Genel Değerlendirme Turu"
        tourKey="coach_appointments"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div id="tour-appointments-header">
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             RANDEVU TAKVİMİM
          </h1>
          <p className="text-slate-500 mt-1">Gelecek seanslarınız, geçmiş görüşme kayıtlarınız ve çalışma saati ayarlarınız.</p>
        </div>

        <div className="flex items-center gap-3">
           <button 
             id="tour-appointments-add"
             onClick={() => setIsModalOpen(true)}
             className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
           >
              <Calendar size={20} /> Yeni Randevu Ekle
           </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div id="tour-appointments-tabs" className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <ListFilter size={18} />
            Randevu Listesi
          </button>
          <button
            id="tour-appointments-settings-tab"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-900/60 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Settings size={18} />
            Çalışma Saatleri & Ayarlar
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 gap-8">
           <div id="tour-appointments-list" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                 <div>
                   <h3 className="text-xl font-bold text-white uppercase italic tracking-tight">Görüşme Listesi</h3>
                   <p className="text-xs text-slate-500 mt-0.5">Tüm durum lardaki (Beklemede, Onaylandı, Katıldı, Katılmadı, İptal) randevularınız.</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Sırala:</span>
                    <select className="bg-slate-950 text-xs font-bold text-slate-400 outline-none cursor-pointer border border-white/10 rounded-lg p-2">
                       <option>En Yakın Tarih</option>
                       <option>Geçmiş Randevular</option>
                    </select>
                 </div>
              </div>
              
              <AppointmentList key={refreshKey} role="coach" showSamples={isTourOpen || location.state?.isDemo || location.state?.startTour} />
           </div>
        </div>
      ) : (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
          <CoachScheduleManager />
        </div>
      )}

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
