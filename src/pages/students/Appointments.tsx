import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import BookingModal from '../../components/appointments/BookingModal';
import AppointmentList from '../../components/appointments/AppointmentList';
import { Booking, appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../lib/AuthContext';

export default function Appointments() {
  const { user } = useAuth();
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Booking | undefined>(undefined);
  const [appointments, setAppointments] = useState<Booking[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = appointmentService.onAppointmentsChange('student', user.uid, (data) => {
      setAppointments(data);
    });
    return () => unsubscribe();
  }, [user]);

  const stats = {
    active: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    pending: appointments.filter(a => a.status === 'pending').length
  };

  const handleOpenBooking = () => {
    setRescheduleAppointment(undefined);
    setIsBookingOpen(true);
  };

  const handleReschedule = (app: Booking) => {
    setRescheduleAppointment(app);
    setIsBookingOpen(true);
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase">
            Randevu Yönetimi
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Koçlarınızla olan görüşmelerinizi planlayın ve takip edin.
          </p>
        </div>
        <button 
          onClick={handleOpenBooking}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" /> 
          Randevu Al
        </button>
      </header>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Aktif Randevular', value: stats.active, icon: Clock, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Tamamlanan', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Bekleyen Talepler', value: stats.pending, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-slate-900/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
            <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
              <stat.icon size={20} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-slate-900/20 border border-white/5 rounded-[40px] p-8">
        <div className="flex items-center gap-3 mb-8 px-2">
          <Calendar className="text-blue-400" size={24} />
          <h2 className="text-xl font-bold text-white">Randevu Geçmişi ve Planlananlar</h2>
        </div>
        
        <AppointmentList 
          role="student" 
          onReschedule={handleReschedule}
          limit={5}
          statuses={['confirmed', 'completed']}
        />
      </div>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        initialBooking={rescheduleAppointment}
      />
    </div>
  );
}
