import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Trash2,
  Check,
  X,
  LayoutTemplate,
  Monitor
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { appointmentService, Booking, Service } from '../../services/appointmentService';
// Coaches will be fetched as any from appointmentService.getCoaches()

const STATUS_COLORS = {
  confirmed: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  cancelled: 'text-red-500 bg-red-500/10 border-red-500/20',
  completed: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
};

const STATUS_LABELS = {
  confirmed: 'Onaylandı',
  pending: 'Bekliyor',
  cancelled: 'İptal Edildi',
  completed: 'Tamamlandı',
};

export default function AppointmentList() {
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [coachFilter, setCoachFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Booking | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesData, coachesData] = await Promise.all([
          appointmentService.getServices(),
          appointmentService.getCoaches()
        ]);
        console.log('AppointmentList - Services:', servicesData.length);
        console.log('AppointmentList - Coaches:', coachesData.length);
        setServices(servicesData);
        setCoaches(coachesData);
      } catch (error) {
        console.error('Data fetch error:', error);
      }
    };

    fetchData();

    const unsubscribe = appointmentService.onAppointmentsChange('admin', 'all', (apps) => {
      setAppointments(apps);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const formatDateSafely = (dateVal: any, formatStr: string) => {
    if (!dateVal) return '---';
    try {
      const d = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return '---';
      return format(d, formatStr, { locale: tr });
    } catch (e) {
      return '---';
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      const matchesSearch = 
        app.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        app.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.id?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const matchesService = serviceFilter === 'all' || app.serviceId === serviceFilter;
      const matchesCoach = coachFilter === 'all' || app.coachId === coachFilter;

      return matchesSearch && matchesStatus && matchesService && matchesCoach;
    });
  }, [appointments, searchQuery, statusFilter, serviceFilter, coachFilter]);

  const handleStatusUpdate = async (id: string, status: Booking['status']) => {
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      setSelectedAppointment(null);
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Randevu Listesi</h1>
          <p className="text-slate-400 text-sm mt-1">Sistemdeki tüm randevuları yönetin ve takip edin.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-white/10 text-sm font-medium">
            <Download size={18} />
            Dışa Aktar
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-[#070b14] rounded-3xl border border-white/5 p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Arama</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input
                type="text"
                placeholder="Öğrenci, eğitmen veya ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Durum</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-300"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="confirmed">Onaylandı</option>
              <option value="pending">Bekliyor</option>
              <option value="cancelled">İptal Edildi</option>
              <option value="completed">Tamamlandı</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Hizmet</label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-300"
            >
              <option value="all">Tüm Hizmetler</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>{service.title}</option>
              ))}
            </select>
          </div>

          {/* Coach Filter */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Eğitmen</label>
            <select
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
              className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/10 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-300"
            >
              <option value="all">Tüm Eğitmenler</option>
              {coaches.map(coach => (
                <option key={coach.uid} value={coach.uid}>
                  {coach.firstName || ''} {coach.lastName || ''} {!(coach.firstName || coach.lastName) && coach.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-[#070b14] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Randevu Bilgisi</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Öğrenci & Eğitmen</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Hizmet & Tür</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tarih & Saat</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Durum</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white mb-0.5 leading-none">#{app.id?.slice(-6).toUpperCase()}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Oluşturma: {formatDateSafely(app.createdAt, 'dd.MM.yyyy')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-blue-500" />
                          <span className="text-sm font-medium text-slate-200">{app.studentName}</span>
                        </div>
                        <div className="flex items-center gap-2 opacity-60">
                          <LayoutTemplate size={14} className="text-slate-400" />
                          <span className="text-xs text-slate-400">{app.coachName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <span className="text-sm text-slate-300 block">{services.find(s => s.id === app.serviceId)?.title || 'İsimsiz Hizmet'}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${app.serviceType === 'one-on-one' ? 'text-indigo-400' : 'text-purple-400'}`}>
                          {app.serviceType === 'one-on-one' ? 'Birebir' : 'Grup'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CalendarIcon size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-300">{formatDateSafely(app.date, 'd MMM yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-emerald-500" />
                          <span className="text-xs font-bold text-slate-300">{app.startTime} - {app.endTime}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${STATUS_COLORS[app.status as keyof typeof STATUS_COLORS]}`}>
                        {STATUS_LABELS[app.status as keyof typeof STATUS_LABELS]}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedAppointment(app)}
                          className="p-2 hover:bg-blue-600/10 hover:text-blue-500 text-slate-500 rounded-xl transition-all"
                        >
                          <Eye size={18} />
                        </button>
                        <button className="p-2 hover:bg-red-600/10 hover:text-red-500 text-slate-500 rounded-xl transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-slate-500">
                        <CalendarIcon size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-white">Sonuç Bulunamadı</p>
                        <p className="text-slate-500 text-sm">Farklı filtreler deneyebilir veya arama teriminizi değiştirebilirsiniz.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Detail Modal */}
      <AnimatePresence>
        {selectedAppointment && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)}></div>
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
                      <p className="text-slate-400 text-xs mt-0.5">#{selectedAppointment.id?.slice(-6).toUpperCase()}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Öğrenci</p>
                      <p className="text-sm font-bold text-white">{selectedAppointment.studentName}</p>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Eğitmen</p>
                      <p className="text-sm font-bold text-white">{selectedAppointment.coachName}</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <CalendarIcon size={16} className="text-blue-500" />
                         <span className="text-sm text-slate-300 font-medium">{formatDateSafely(selectedAppointment.date, 'd MMMM yyyy (EEEE)')}</span>
                       </div>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                         <Clock size={16} className="text-emerald-500" />
                         <span className="text-sm text-slate-300 font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime || '--:--'}</span>
                       </div>
                       <span className="px-2 py-1 bg-white/5 rounded-md text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {selectedAppointment.serviceType === 'one-on-one' ? 'Birebir' : 'Grup'}
                       </span>
                    </div>
                    {selectedAppointment.roomName && (
                      <div className="flex items-center gap-3">
                        <Monitor size={16} className="text-purple-500" />
                        <span className="text-sm text-slate-300 font-medium">{selectedAppointment.roomName}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleStatusUpdate(selectedAppointment.id!, 'confirmed')}
                      className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/20"
                    >
                      Onayla
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate(selectedAppointment.id!, 'cancelled')}
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
      </AnimatePresence>
    </div>
  );
}
