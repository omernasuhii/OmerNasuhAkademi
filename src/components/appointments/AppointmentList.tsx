import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock3, 
  AlertCircle,
  Loader2,
  Trash2,
  Check,
  Video,
  MapPin,
  Users,
  Repeat,
  Edit2,
  X
} from 'lucide-react';
import { appointmentService, Booking } from '../../services/appointmentService';
import { useAuth } from '../../lib/AuthContext';

interface AppointmentListProps {
  role: 'student' | 'coach' | 'admin';
  studentId?: string;
  studentIds?: string[];
  targetUserId?: string;
  onReschedule?: (booking: Booking) => void;
  limit?: number;
  statuses?: string[];
  readOnly?: boolean;
  filterRequesterRole?: 'parent' | 'student';
}

export default function AppointmentList({ role, studentId, studentIds, targetUserId, onReschedule, limit, statuses, readOnly, filterRequesterRole }: AppointmentListProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState<Booking | null>(null);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const fetchId = targetUserId || user.uid;
    const unsubscribe = appointmentService.onAppointmentsChange(role, fetchId, async (data) => {
      let filteredData = data;
      
      if (studentId) {
        filteredData = filteredData.filter(app => app.studentId === studentId);
      }
      if (studentIds && studentIds.length > 0) {
        filteredData = filteredData.filter(app => studentIds.includes(app.studentId));
      }
      if (filterRequesterRole === 'parent') {
        filteredData = filteredData.filter(app => app.requesterRole === 'parent');
      } else if (filterRequesterRole === 'student') {
        filteredData = filteredData.filter(app => app.requesterRole !== 'parent');
      }
      
      const now = new Date();

      let processedData = await Promise.all(filteredData.map(async (app) => {
        if (app.status === 'confirmed' && app.date && app.startTime) {
          try {
            // Compare date and time
            const appointmentDateTime = new Date(`${app.date}T${app.endTime || app.startTime}`);
            if (appointmentDateTime < now) {
              await appointmentService.updateAppointmentStatus(app.id!, 'completed');
              return { ...app, status: 'completed' } as Booking;
            }
          } catch (e) {
            // Ignore format errors
          }
        }
        return app;
      }));
      
      if (statuses && statuses.length > 0) {
        processedData = processedData.filter(app => statuses.includes(app.status));
      }
      
      if (limit) {
        processedData = processedData.slice(0, limit);
      }

      setAppointments(processedData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, studentId, targetUserId, studentIds, filterRequesterRole, role, limit, statuses]);

  const handleStatusUpdate = async (id: string, status: Booking['status']) => {
    // Policy check for student cancellation
    if (role === 'student' && status === 'cancelled') {
      const app = appointments.find(a => a.id === id);
      if (app && !canRescheduleOrCancel(app)) {
        alert("Politika Gereği: Randevunuza 24 saatten az süre kaldığı için iptal işlemi gerçekleştiremezsiniz. Lütfen kurum ile iletişime geçin.");
        return;
      }
    }

    try {
      await appointmentService.updateAppointmentStatus(id, status);
      setAppointments(prev => prev.map(app => app.id === id ? { ...app, status } : app));
    } catch (err) {
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };

  const canRescheduleOrCancel = (app: Booking) => {
    if (role === 'admin' || role === 'coach') return true;
    if (app.status === 'completed' || app.status === 'cancelled' || app.status === 'missed') return false;
    
    try {
      const appDateTime = new Date(`${app.date}T${app.startTime}`);
      const now = new Date();
      const diffInHours = (appDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffInHours >= 24;
    } catch (e) {
      return true;
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAppointment) return;

    try {
      await appointmentService.updateAppointment(editingAppointment.id!, {
        date: editingAppointment.date,
        startTime: editingAppointment.startTime,
        status: editingAppointment.status
      });
      setAppointments(prev => prev.map(app => app.id === editingAppointment.id ? editingAppointment : app));
      setEditingAppointment(null);
    } catch (err) {
      alert("Randevu güncellenirken bir hata oluştu.");
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle size={12} /> Onaylandı</span>;
      case 'cancelled':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><XCircle size={12} /> İptal Edildi</span>;
      case 'completed':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><CheckCircle size={12} /> Katıldı</span>;
      case 'missed':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><XCircle size={12} /> Katılmadı</span>;
      default:
        return <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock3 size={12} /> Beklemede</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border border-white/5 rounded-[32px]">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-slate-500 font-medium">Randevular yükleniyor...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-white/5 rounded-[32px] text-center px-6">
        <div className="bg-slate-950 w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 border border-white/10 shadow-inner">
          <Calendar className="text-slate-700" size={32} />
        </div>
        <h4 className="text-xl font-bold text-white mb-2">Randevu Seçilmedi</h4>
        <p className="text-slate-500 max-w-xs mx-auto">Henüz herhangi bir randevu kaydı bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((app) => (
        <div key={app.id} className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.04] transition-all group">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-inner group-hover:scale-105 transition-transform ${
              app.serviceType === 'one-on-one' ? 'bg-blue-500/10 text-blue-400' :
              app.serviceType === 'lesson' ? 'bg-amber-500/10 text-amber-400' :
              'bg-purple-500/10 text-purple-400'
            }`}>
              {app.serviceType === 'one-on-one' ? <User size={24} /> : app.serviceType === 'lesson' ? <Clock size={24} /> : <Repeat size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h4 className="font-bold text-white tracking-tight flex items-center gap-2">
                  {role === 'student' ? app.coachName : app.studentName}
                  {role !== 'student' && app.requesterRole === 'parent' && (
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                      <User size={10} /> Veli
                    </span>
                  )}
                </h4>
                {getStatusBadge(app.status)}
                {app.isOnline && (
                  <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 rounded-md text-[8px] font-black uppercase tracking-tighter flex items-center gap-1">
                    <Video size={10} /> Online
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-slate-600" /> {app.date}</span>
                <span className="flex items-center gap-1.5"><Clock size={14} className="text-slate-600" /> {app.startTime}</span>
                <span className="flex items-center gap-1.5 text-blue-400/70 border-l border-white/10 pl-4">
                  {app.serviceType === 'one-on-one' ? (app.requesterRole === 'parent' ? 'Veli Görüşmesi' : 'Öğrenci Koçluğu') : 'Grup'}
                </span>
                {app.participantCount > 1 && (
                  <span className="flex items-center gap-1.5"><Users size={14} /> {app.participantCount} Katılımcı</span>
                )}
              </div>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              {(role === 'coach' || role === 'admin') && app.status === 'pending' && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(app.id!, 'confirmed')}
                    className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <Check size={14} /> Onayla
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate(app.id!, 'cancelled')}
                    className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <XCircle size={14} /> Reddet
                  </button>
                </>
              )}
              
              {app.status === 'confirmed' && (role === 'coach' || role === 'admin') && (
                <>
                  <button 
                    onClick={() => handleStatusUpdate(app.id!, 'completed')}
                    className="bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white border border-blue-500/20 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <CheckCircle size={14} /> Katıldı
                  </button>
                </>
              )}

              {app.status !== 'cancelled' && app.status !== 'completed' && app.status !== 'missed' && (
                <button 
                  onClick={() => handleStatusUpdate(app.id!, 'cancelled')}
                  className={`p-2 rounded-xl transition-all border ${
                    role === 'student' && !canRescheduleOrCancel(app)
                      ? 'bg-slate-950 text-slate-700 border-white/5 cursor-not-allowed opacity-50'
                      : 'bg-slate-950 hover:bg-red-500/10 text-slate-500 hover:text-red-400 border-white/5 shadow-sm'
                  }`}
                  title={role === 'student' && !canRescheduleOrCancel(app) ? "24 saat kala iptal edilemez" : "İptal Et"}
                  disabled={role === 'student' && !canRescheduleOrCancel(app)}
                >
                  <Trash2 size={16} />
                </button>
              )}

              {role === 'student' && (app.status === 'confirmed' || app.status === 'pending') && onReschedule && (
                <button 
                  onClick={() => {
                    if (canRescheduleOrCancel(app)) {
                      onReschedule(app);
                    } else {
                      alert("Politika Gereği: Randevunuza 24 saatten az süre kaldığı için değişiklik yapamazsınız.");
                    }
                  }}
                  className={`p-2 rounded-xl transition-all border ${
                    !canRescheduleOrCancel(app)
                      ? 'bg-slate-950 text-slate-700 border-white/5 cursor-not-allowed opacity-50'
                      : 'bg-slate-950 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 border-white/5'
                  }`}
                  title={!canRescheduleOrCancel(app) ? "24 saat kala değişiklik yapılamaz" : "Tarih Değiştir"}
                >
                  <Edit2 size={16} />
                </button>
              )}

              {(role === 'admin' || role === 'coach') && (
                <button 
                  onClick={() => setEditingAppointment({ ...app })}
                  className="bg-slate-950 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 border border-white/5 p-2 rounded-xl transition-all"
                  title="Düzenle"
                >
                  <Edit2 size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {editingAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-3xl p-6 w-full h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto max-w-md animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Randevuyu Düzenle</h3>
              <button onClick={() => setEditingAppointment(null)} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Tarih</label>
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={editingAppointment.date}
                  onClick={(e) => {
                    const target = e.target as HTMLInputElement;
                    // showPicker is blocked in cross-origin iframes
                  }}
                  onChange={e => setEditingAppointment({...editingAppointment, date: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none"
                  style={{ colorScheme: 'dark' }}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Saat</label>
                <input 
                  type="time" 
                  value={editingAppointment.startTime}
                  onChange={e => setEditingAppointment({...editingAppointment, startTime: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1 mb-2">Durum</label>
                <select 
                  value={editingAppointment.status}
                  onChange={e => setEditingAppointment({...editingAppointment, status: e.target.value as Booking['status']})}
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none"
                >
                  <option value="pending">Beklemede</option>
                  <option value="confirmed">Onaylandı</option>
                  <option value="completed">Katıldı</option>
                  <option value="missed">Katılmadı</option>
                  <option value="cancelled">İptal Edildi</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingAppointment(null)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold bg-slate-950 text-slate-400 hover:text-white transition-all"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
