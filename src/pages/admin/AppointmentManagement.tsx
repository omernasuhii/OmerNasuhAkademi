import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  Settings,
  Users,
  Filter as FilterIcon,
  X,
  RefreshCw,
  Download,
  Video,
  Monitor,
  Check,
  Clock,
  LayoutTemplate
} from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { appointmentService, Booking, Service } from '../../services/appointmentService';
import { 
  format, 
  addDays, 
  startOfWeek, 
  eachDayOfInterval, 
  isToday
} from 'date-fns';
import { tr } from 'date-fns/locale';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function AppointmentManagement() {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'personnel' | 'timeline'>('weekly');
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [rightSidebarTab, setRightSidebarTab] = useState<'settings' | 'filter'>('filter');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, show: boolean } | null>(null);

  useEffect(() => {
    fetchInitialData();
    
    // Set up real-time listener
    const unsubscribe = appointmentService.onAppointmentsChange('admin', 'all', (apps) => {
      setAppointments(apps);
      // Also update selected services if new ones appear? 
      // Usually better to just update the appointments and let the filter handle it.
      // But if we want to ensure new service IDs are checked by default:
      const serviceIdsFromApps = apps.map(a => a.serviceId);
      setSelectedServices(prev => {
        const next = new Set([...prev, ...serviceIdsFromApps]);
        return Array.from(next);
      });
    });

    return () => unsubscribe();
  }, [services.length]); // Re-run if services list changes to ensure filter state is reasonable

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleGridContentEmptyClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      show: true
    });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [appsData, servicesData] = await Promise.all([
        appointmentService.getAppointments('all', 'admin'),
        appointmentService.getServices()
      ]);
      setAppointments(appsData);
      setServices(servicesData);
      
      // Admin should see everything by default. 
      // Include all IDs from active services and IDs present in appointments.
      const serviceIdsFromApps = appsData.map(a => a.serviceId);
      const activeServiceIds = servicesData.map(s => s.id!);
      const initialSelected = Array.from(new Set([...activeServiceIds, ...serviceIdsFromApps]));
      
      setSelectedServices(initialSelected);
      console.log('Appointments fetched:', appsData.length);
      console.log('Services fetched:', servicesData.length);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: Booking['status']) => {
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    } catch (error) {
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({
      start,
      end: addDays(start, 6)
    });
  }, [currentDate]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      // If service filter is active (not empty), check if app's service is in it.
      // If selectedServices is empty, it means user manually unchecked all, so hide all?
      // Actually, usually if nothing is selected, we show nothing. 
      // But if services list itself is empty, we should show all.
      const matchesService = services.length === 0 || selectedServices.includes(app.serviceId);
      
      const matchesSearch = 
        app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.coachName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesService && matchesSearch && app.status !== 'cancelled';
    });
  }, [appointments, selectedServices, searchQuery, services.length]);

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredAppointments.filter(app => app.date === dateStr);
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setCurrentDate(new Date());
      return;
    }
    const value = viewMode === 'weekly' ? 7 : 1;
    setCurrentDate(prev => direction === 'next' ? addDays(prev, value) : addDays(prev, -value));
  };

  const formatMonthYear = (date: Date) => {
    return format(date, 'MMMM yyyy', { locale: tr });
  };

  const getAppointmentStyle = (app: Booking) => {
    if (!app.startTime || !app.endTime) return { top: '0px', height: '0px' };
    try {
      const [startHour, startMin] = app.startTime.split(':').map(Number);
      const [endHour, endMin] = app.endTime.split(':').map(Number);
      const top = (startHour * 60 + startMin);
      const durationInMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      return { top: `${top}px`, height: `${durationInMinutes}px` };
    } catch (e) {
      return { top: '0px', height: '0px' };
    }
  };

  return (
    <div className="flex flex-col bg-[#020617] h-full w-full overflow-hidden relative">
      <style>{`
        .react-calendar {
          width: 100%;
          background: transparent;
          border: none;
          font-family: inherit;
        }
        .react-calendar__navigation {
          display: flex;
          margin-bottom: 1rem;
        }
        .react-calendar__navigation button {
          color: white;
          min-width: 32px;
          background: none;
          font-size: 14px;
        }
        .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 800;
          font-size: 10px;
          color: #475569;
          padding-bottom: 8px;
        }
        .react-calendar__tile {
          padding: 8px !important;
          background: none;
          color: #94a3b8;
          font-size: 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .react-calendar__tile:enabled:hover {
          background-color: rgba(255,255,255,0.05);
          color: white;
        }
        .react-calendar__tile--now {
          background: rgba(59, 130, 246, 0.1) !important;
          color: #3b82f6 !important;
        }
        .react-calendar__tile--active {
          background: #ef4444 !important;
          color: white !important;
        }
        .calendar-grid-container::-webkit-scrollbar {
          width: 6px;
        }
        .calendar-grid-container::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
      `}</style>

      {/* Top Toolbar */}
      <div className="h-16 bg-[#070b14] border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-40">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setShowLeftSidebar(!showLeftSidebar)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-all shadow-lg"
          >
            <LayoutTemplate size={18} />
          </button>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigateDate('today')}
              className="bg-white/5 hover:bg-white/10 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all tracking-wide"
            >
              Bugün
            </button>
            <h2 className="text-sm font-medium text-white min-w-[140px]">
              {formatMonthYear(currentDate)}
            </h2>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => navigateDate('prev')}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button 
                onClick={() => navigateDate('next')}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <button className="flex items-center gap-8 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5 text-xs font-medium text-white transition-all justify-between min-w-[140px]">
              {viewMode === 'weekly' ? 'Haftalık' : viewMode === 'daily' ? 'Günlük' : viewMode === 'personnel' ? 'Personel' : 'Zamanlama'}
              <ChevronDown size={14} className="text-slate-500 group-hover:text-white" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-full bg-[#070b14] border border-white/10 rounded-xl shadow-2xl py-2 z-50 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all">
              {[
                { id: 'weekly', label: 'Haftalık' },
                { id: 'daily', label: 'Günlük' },
                { id: 'personnel', label: 'Personel' },
                { id: 'timeline', label: 'Zamanlama' }
              ].map(view => (
                <button
                  key={view.id}
                  onClick={() => setViewMode(view.id as any)}
                  className={`w-full text-left px-4 py-2 text-xs font-medium transition-all ${
                    viewMode === view.id 
                      ? 'bg-blue-600/10 text-blue-500' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5 border-l border-white/10 pl-4">
            <button 
              onClick={() => {
                if (showRightSidebar && rightSidebarTab === 'filter') {
                  setShowRightSidebar(false);
                } else {
                  setRightSidebarTab('filter');
                  setShowRightSidebar(true);
                }
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                showRightSidebar && rightSidebarTab === 'filter' 
                  ? 'bg-blue-600/10 text-blue-500' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
                <FilterIcon size={16} />
            </button>
            <button 
              onClick={() => {
                if (showRightSidebar && rightSidebarTab === 'settings') {
                  setShowRightSidebar(false);
                } else {
                  setRightSidebarTab('settings');
                  setShowRightSidebar(true);
                }
              }}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all relative ${
                showRightSidebar && rightSidebarTab === 'settings' 
                  ? 'bg-blue-600/10 text-blue-500' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
                <Settings size={16} />
                <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-[#070b14]">3</div>
            </button>
            
            <div className="w-px h-6 bg-white/10 mx-2" />
            
            <div className="relative group/yonet">
              <button className="bg-transparent hover:bg-white/5 text-blue-400 font-medium text-xs px-4 py-2 rounded-lg transition-all border border-blue-500/30 flex items-center gap-2">
                  Yönet <ChevronDown size={14} />
              </button>
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl py-2 z-50 opacity-0 invisible group-hover/yonet:opacity-100 group-hover/yonet:visible transition-all border border-slate-100">
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Hizmetleri Düzenle</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Personel Üyelerine Git</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Kaynaklar</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Standart Saatleri Güncelle</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Randevu Entegrasyonları Ekle</button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Kişisel Takvimi Senkronize Et</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Randevu Verebilecek Ortak Çalışanları Davet Et</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Randevu Verilerini Dışa Aktar</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Mobil Cihazda Yönet</button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Randevu Ayarlarını Güncelle</button>
              </div>
            </div>

            <div className="relative group/ekle">
              <div className="bg-blue-600 rounded-lg flex overflow-hidden cursor-pointer group-hover/ekle:bg-blue-500 transition-colors">
                <button className="text-white font-medium text-xs px-4 py-2 flex items-center gap-2">
                    Ekle
                </button>
                <div className="w-px bg-white/20 h-full my-auto mx-0" />
                <button className="text-white px-2 py-2 flex items-center justify-center">
                  <ChevronDown size={14} />
                </button>
              </div>
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl py-2 z-50 opacity-0 invisible group-hover/ekle:opacity-100 group-hover/ekle:visible transition-all border border-slate-100">
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Hızlı Satış</button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Kapalı Zaman Dilimi</button>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Randevu</button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">Yeni Hizmet Oluştur</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-stretch min-h-0">
        {/* Left Sidebar */}
        <aside className={`${showLeftSidebar ? 'w-72 border-r border-white/5' : 'w-0 overflow-hidden border-r-0'} flex flex-col shrink-0 bg-[#070b14]/50 transition-all duration-300`}>
          <div className="w-72 p-6 flex flex-col h-full overflow-y-auto scrollbar-hide">
            {/* Mini Calendar */}
            <div className="mb-8">
               <Calendar 
                 onChange={(val: any) => setCurrentDate(val as Date)}
                 value={currentDate}
                 locale="tr-TR"
                 className="shadow-2xl shadow-black/50"
               />
            </div>

            {/* Activity Sections */}
            <div className="space-y-8">
              <div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                  Hareket
                  <ChevronDown size={12} />
                </h3>
                
                <div className="space-y-6">
                   <div className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[11px] font-black text-white/80 uppercase tracking-widest group-hover:text-red-500 transition-colors">Yaklaşan seanslar</span>
                         <ChevronRight size={12} className="text-slate-600" />
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
                         <p className="text-[11px] text-slate-500 font-bold">Yakın zamanda planlanmış seans yok.</p>
                      </div>
                   </div>

                   <div className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[11px] font-black text-white/80 uppercase tracking-widest group-hover:text-red-500 transition-colors">Randevu talepleri</span>
                         <ChevronRight size={12} className="text-slate-600" />
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center gap-3">
                         <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-500">
                            <Clock size={24} />
                         </div>
                         <p className="text-[11px] text-slate-500 font-bold text-center leading-relaxed">Henüz onayınızı bekleyen randevu yok.</p>
                      </div>
                   </div>

                   <div className="group cursor-pointer">
                      <div className="flex items-center justify-between mb-3">
                         <span className="text-[11px] font-black text-white/80 uppercase tracking-widest group-hover:text-red-500 transition-colors">Ders bekleme listeleri</span>
                         <ChevronRight size={12} className="text-slate-600" />
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                         <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500">
                            <Users size={20} />
                         </div>
                         <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Bekleme listesi boş</p>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Calendar Grid Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#020617]">
          {/* Calendar Header (Days) */}
          <div className="flex border-b border-white/5 bg-[#070b14] z-30 shrink-0 pr-[6px]">
             <div className="w-14 shrink-0 flex items-center justify-center border-r border-white/5">
                {/* empty space for time col */}
             </div>
             <div className="flex-1 flex">
                {weekDays.map((day, idx) => (
                   <div key={idx} className={`flex-1 border-r border-white/5 py-3 flex flex-col items-center justify-center ${isToday(day) ? 'bg-blue-600/5' : ''}`}>
                      <span className={`text-[11px] font-medium transition-colors ${isToday(day) ? 'text-blue-500 font-bold border-b-2 border-blue-500 pb-1' : 'text-slate-400'}`}>
                         {format(day, 'E', { locale: tr })}{' '}{format(day, 'd')}
                      </span>
                   </div>
                ))}
             </div>
          </div>

          {/* Time Grid Scrollable Content */}
          <div className="flex-1 overflow-y-auto calendar-grid-container relative">
             <div className="flex min-h-max bg-[#070b14]/50">
                {/* Time Indicators */}
                <div className="w-14 border-r border-white/5 shrink-0 bg-[#070b14]">
                   {HOURS.map(hour => (
                      <div key={hour} className="h-[60px] relative border-b border-white/[0.02]">
                         <span className="absolute -top-[10px] right-2 text-[10px] font-medium text-slate-500">
                            {hour.toString().padStart(2, '0')}
                         </span>
                      </div>
                   ))}
                </div>

                {/* Day Columns */}
                <div className="flex-1 flex" onContextMenu={handleGridContentEmptyClick} onClick={handleGridContentEmptyClick}>
                   {weekDays.map((day, colIdx) => {
                      const dayApps = getAppointmentsForDay(day);
                      return (
                        <div key={colIdx} className={`flex-1 border-r border-white/[0.03] relative group/col ${isToday(day) ? 'bg-blue-600/[0.02]' : ''}`}>
                           {/* Grid Lines */}
                           {HOURS.map(hour => (
                              <div key={hour} className="h-[60px] border-b border-white/[0.02]" />
                           ))}

                           {/* Appointments */}
                           {dayApps.map((app) => {
                              const style = getAppointmentStyle(app);
                              return (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={app.id}
                                  onClick={(e) => { e.stopPropagation(); setSelectedBooking(app); }}
                                  className="absolute left-0.5 right-0.5 rounded p-1.5 overflow-hidden cursor-pointer shadow-sm transition-all z-10 hover:z-20 group/app"
                                  style={{
                                    ...style,
                                    backgroundColor: app.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' : app.isOnline ? 'rgba(59, 130, 246, 0.15)' : 'rgba(241, 245, 249, 0.05)',
                                    borderLeft: `3px solid ${
                                      app.status === 'pending' ? '#f59e0b' : 
                                      app.isOnline ? '#3b82f6' : '#94a3b8'
                                    }`
                                  }}
                                >
                                  <div className="flex flex-col h-full">
                                    <div className="flex items-start justify-between">
                                      <h4 className="text-[10px] font-bold text-white/90 leading-tight truncate px-0.5">
                                        {app.studentName}
                                      </h4>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5 px-0.5">
                                      <span className="text-[9px] text-slate-400 truncate">{app.coachName}</span>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between px-0.5">
                                        <span className="text-[9px] font-medium text-slate-500">
                                            {(app.startTime || '').substring(0, 5)} - {(app.endTime || '').substring(0, 5)}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {app.status === 'pending' && <Clock size={10} className="text-amber-500" />}
                                            {app.isOnline ? <Video size={10} className="text-blue-500/70" /> : <Monitor size={10} className="text-slate-500/70" />}
                                        </div>
                                    </div>
                                  </div>

                                  {/* Hover Actions */}
                                  <div className="absolute top-1 right-1 opacity-0 group-hover/app:opacity-100 transition-opacity flex items-center gap-1 bg-[#020617]/80 backdrop-blur-md rounded border border-white/10 p-0.5">
                                     {app.status === 'pending' && (
                                       <button 
                                         onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id!, 'confirmed'); }}
                                         className="p-1 hover:bg-emerald-500/20 text-emerald-400 rounded"
                                       >
                                         <Check size={12} />
                                       </button>
                                     )}
                                     <button 
                                       onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id!, 'cancelled'); }}
                                       className="p-1 hover:bg-red-500/20 text-red-400 rounded"
                                     >
                                       <X size={12} />
                                     </button>
                                  </div>
                                </motion.div>
                              );
                           })}

                           {/* current time indicator if today */}
                           {isToday(day) && (
                              <div 
                                className="absolute left-0 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                                style={{
                                  top: `${(new Date().getHours() * 60 + new Date().getMinutes())}px`
                                }}
                              >
                                 <div className="w-2 h-2 bg-red-500 rounded-full absolute -left-1 -top-1" />
                              </div>
                           )}
                        </div>
                      );
                   })}
                </div>
             </div>
          </div>
        </div>

        {/* Right Sidebar - Dynamic toggle */}
        <aside className={`${showRightSidebar ? 'w-80 border-l border-white/5' : 'w-0 border-l-0'} flex flex-col shrink-0 transition-all duration-300 bg-[#070b14]/80 overflow-hidden relative`}>
            <div className="w-80 flex flex-col h-full">
               <div className="flex items-center justify-between h-16 border-b border-white/5 shrink-0 px-4">
                  <h3 className="text-sm font-semibold text-white">
                    {rightSidebarTab === 'filter' ? 'Filtrele' : 'Gösterim Ayarları'}
                  </h3>
                  <button 
                    onClick={() => setShowRightSidebar(false)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-all"
                  >
                    <X size={18} />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                  {rightSidebarTab === 'filter' ? (
                     <div className="space-y-8 animate-in slide-in-from-right duration-300">
                        {/* Search */}
                        <div className="space-y-3">
                           <h4 className="text-xs font-medium text-slate-400">Arama</h4>
                           <div className="relative">
                              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                              <input 
                                type="text"
                                placeholder="Hizmet, personel veya müşteri..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#020617] border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:border-blue-500 outline-none transition-all"
                              />
                           </div>
                        </div>

                        {/* Services Filter */}
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <h4 className="text-xs font-medium text-slate-400">Hizmetler</h4>
                           </div>
                           <div className="bg-[#020617] border border-white/10 rounded-lg p-3 space-y-3">
                             <label className="flex items-center gap-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-600/30 bg-slate-900"
                                  checked={selectedServices.length === services.length}
                                  onChange={(e) => {
                                    if(e.target.checked) setSelectedServices(services.map(s => s.id!));
                                    else setSelectedServices([]);
                                  }}
                                />
                                <span className="text-sm text-slate-300">Tümünü Seç</span>
                             </label>
                             <div className="h-px bg-white/10" />
                             {services.map(service => (
                               <label key={service.id} className="flex items-center gap-3 cursor-pointer">
                                     <input 
                                       type="checkbox" 
                                       className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-600/30 bg-slate-900"
                                       checked={selectedServices.includes(service.id!)}
                                       onChange={(e) => {
                                         if (e.target.checked) {
                                           setSelectedServices(prev => [...prev, service.id!]);
                                         } else {
                                           setSelectedServices(prev => prev.filter(id => id !== service.id));
                                         }
                                       }}
                                     />
                                  <div className="flex-1">
                                     <div className="text-sm text-slate-300">{service.title || 'İsimsiz Hizmet'}</div>
                                  </div>
                               </label>
                             ))}
                           </div>
                        </div>

                        {/* Status Filter Placeholder */}
                        <div className="space-y-3">
                           <h4 className="text-xs font-medium text-slate-400">Seans Müsaitliği</h4>
                           <div className="bg-[#020617] border border-white/10 rounded-lg p-3 space-y-3">
                              {['Tümünü Seç', 'Boş seanslar', 'Yer kalan seanslar', 'Dolu seanslar', 'Onay bekleyenler'].map((item, i) => (
                                 <label key={i} className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-600/30 bg-slate-900" />
                                    <span className="text-sm text-slate-300">{item}</span>
                                 </label>
                              ))}
                           </div>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-8 animate-in slide-in-from-right duration-300">
                        <div className="space-y-3">
                           <h4 className="text-xs font-medium text-slate-400">Takvim öğeleri aralığı</h4>
                           <div className="p-3 bg-[#020617] border border-white/10 rounded-lg">
                              <input type="range" className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                              <div className="flex justify-between mt-3 px-1">
                                 <span className="text-[10px] text-slate-500">Kompakt</span>
                                 <span className="text-[10px] text-slate-500">Geniş</span>
                              </div>
                           </div>
                        </div>

                        <div className="space-y-3">
                           <h4 className="text-xs font-medium text-slate-400">Renk paleti</h4>
                           <div className="bg-[#020617] border border-white/10 rounded-lg p-1">
                              {['Modern', 'Klasik'].map((item, i) => (
                                 <label key={i} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-md transition-colors">
                                    <input type="radio" name="color-palette" defaultChecked={i===0} className="w-4 h-4 border-slate-600 text-blue-600 focus:ring-blue-600/30 bg-slate-900" />
                                    <span className="text-sm text-slate-300">{item}</span>
                                 </label>
                              ))}
                           </div>
                        </div>

                        <div className="space-y-3">
                           <h4 className="text-xs font-medium text-slate-400">Izgara zaman dilimi boşluğu</h4>
                           <div className="bg-[#020617] border border-white/10 rounded-lg p-1">
                              {['30 dk.', '15 dk.', '10 dk.', '5 dk.'].map((item, i) => (
                                 <label key={i} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-md transition-colors">
                                    <input type="radio" name="grid-gap" defaultChecked={i===0} className="w-4 h-4 border-slate-600 text-blue-600 focus:ring-blue-600/30 bg-slate-900" />
                                    <span className="text-sm text-slate-300">{item}</span>
                                 </label>
                              ))}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
        </aside>
      </div>

      {loading && (
        <div className="absolute inset-0 bg-[#020617]/50 backdrop-blur-sm z-50 flex items-center justify-center">
           <div className="flex items-center gap-3 bg-[#070b14] px-6 py-4 rounded-2xl border border-white/10 shadow-2xl">
              <RefreshCw className="animate-spin text-blue-500" size={20} />
              <span className="text-sm font-medium text-white">Yükleniyor...</span>
           </div>
        </div>
      )}

      {/* Context Menu for Grid Click */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => setSelectedBooking(null)}></div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-[#070b14] w-full max-w-lg rounded-[32px] border border-white/10 shadow-2xl overflow-hidden z-10"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                      <LayoutTemplate size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white tracking-tight">Randevu Detayları</h3>
                      <p className="text-slate-400 text-xs mt-0.5">#{selectedBooking.id?.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Öğrenci</p>
                      <p className="text-sm font-bold text-white">{selectedBooking.studentName}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Eğitmen</p>
                      <p className="text-sm font-bold text-white">{selectedBooking.coachName}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <CalendarIcon size={16} className="text-blue-500" />
                         <span className="text-sm text-slate-300 font-medium">{format(new Date(selectedBooking.date), 'd MMMM yyyy (EEEE)', { locale: tr })}</span>
                       </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Clock size={16} className="text-emerald-500" />
                         <span className="text-sm text-slate-300 font-medium">{selectedBooking.startTime} - {selectedBooking.endTime || '--:--'}</span>
                       </div>
                       <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {selectedBooking.serviceType === 'one-on-one' ? 'Birebir' : 'Grup'}
                       </span>
                    </div>
                    {selectedBooking.roomName && (
                      <div className="flex items-center gap-3">
                        <Monitor size={16} className="text-purple-500" />
                        <span className="text-sm text-slate-300 font-medium">{selectedBooking.roomName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleStatusUpdate(selectedBooking.id!, 'confirmed').then(() => setSelectedBooking(null))}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                      Onayla
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedBooking.id!, 'cancelled').then(() => setSelectedBooking(null))}
                      className="flex-1 py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl font-bold transition-all"
                    >
                      İptal Et
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {contextMenu?.show && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed bg-white rounded-xl shadow-2xl py-2 z-[60] border border-slate-100 min-w-[180px] overflow-hidden"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Kapalı Zaman Dilimi</button>
            <button className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors">Randevu</button>
            <div className="h-px bg-slate-100 my-1"></div>
            <button className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">Yeni Hizmet Oluştur</button>
            <button className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2">Hizmet Paylaş</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
