import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  Check, 
  Loader2, 
  AlertCircle,
  Search,
  ChevronRight,
  Info,
  Users,
  Repeat,
  LayoutGrid,
  Video,
  MapPin,
  CreditCard
} from 'lucide-react';
import { appointmentService, Booking, CoachSchedule, Service } from '../../services/appointmentService';
import { useAuth } from '../../lib/AuthContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialBooking?: Booking;
}

export default function BookingModal({ isOpen, onClose, initialBooking }: BookingModalProps) {
  const { user, userData } = useAuth();
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedType, setSelectedType] = useState<'one-on-one' | 'lesson' | 'course' | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isOnline, setIsOnline] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [coachSchedule, setCoachSchedule] = useState<CoachSchedule | null>(null);
  const [bookedAppointments, setBookedAppointments] = useState<Booking[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadServices();
      
      if (initialBooking) {
        setSelectedType(initialBooking.serviceType);
        setSelectedDate(initialBooking.date);
        setParticipantCount(initialBooking.participantCount);
        setIsOnline(initialBooking.isOnline);
        setStep(initialBooking.serviceType === 'one-on-one' ? 3 : 2); // Skip type selection
      } else {
        setStep(1);
        setSelectedType(null);
        setSelectedService(null);
        setSelectedCoach(null);
        setSelectedSlot(null);
        setParticipantCount(1);
        setSelectedDate('');
        setIsOnline(false);
      }
    }
  }, [isOpen, initialBooking]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getServices();
      setServices(data);
      
      if (initialBooking) {
        const service = data.find(s => s.id === initialBooking.serviceId);
        if (service) {
          setSelectedService(service);
          // If service is loaded, load coaches for this service
          const coachesData = await appointmentService.getCoaches();
          const filtered = service.assignedCoachIds.length > 0 
            ? coachesData.filter(c => service.assignedCoachIds.includes(c.uid))
            : coachesData;
          setCoaches(filtered);
          
          if (initialBooking.coachId) {
            const coach = filtered.find(c => c.uid === initialBooking.coachId);
            if (coach) {
              setSelectedCoach(coach);
              setStep(4); // Go straight to calendar
              loadAvailability(coach.uid, initialBooking.date);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCoaches = async () => {
    try {
      const data = await appointmentService.getCoaches();
      // Filter coaches assigned to this service if applicable
      if (selectedService && selectedService.assignedCoachIds.length > 0) {
        setCoaches(data.filter(c => selectedService.assignedCoachIds.includes(c.uid)));
      } else {
        setCoaches(data);
      }
    } catch (err) {
      console.error("Load coaches error:", err);
    }
  };

  const loadAvailability = async (coachId: string, date: string) => {
    setLoading(true);
    try {
      const schedule = await appointmentService.getCoachSchedule(coachId);
      setCoachSchedule(schedule);
      const allApps = await appointmentService.getAppointments(coachId, 'coach');
      setBookedAppointments(allApps.filter(a => 
        a.date === date && 
        a.status !== 'cancelled' && 
        (!initialBooking || a.id !== initialBooking.id)
      ));
    } catch (err) {
      console.error("Load availability error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectType = (type: any) => {
    setSelectedType(type);
    setStep(2);
  };

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setIsOnline(false);
    loadCoaches();
    setStep(3);
  };

  const handleSelectCoach = (coach: any) => {
    setSelectedCoach(coach);
    setStep(4);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedCoach) {
      loadAvailability(selectedCoach.uid, date);
    }
  };

  const parseTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const formatTime = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getAvailableSlots = () => {
    if (!coachSchedule || !selectedDate || !selectedService) return [];
    
    const dayName = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const workingBlocks = coachSchedule.weeklyHours[dayName] || [];
    
    const { duration = 60, bufferTime = 0 } = selectedService;
    const totalSlotTime = duration + bufferTime;
    
    // Check if date is blocked completely
    let isDayCompletelyBlocked = false;
    if (coachSchedule.blockedDates) {
      const selectedTime = new Date(`${selectedDate}T00:00:00`).getTime();
      isDayCompletelyBlocked = coachSchedule.blockedDates.some(bd => {
         if (bd.isAllDay !== false) {
             const start = new Date(`${bd.startDate}T00:00:00`).getTime();
             const endDateObj = new Date(`${bd.endDate}T23:59:59`); // including end date fully
             const end = endDateObj.getTime();
             return selectedTime >= start && selectedTime <= end;
         }
         return false;
      });
    }

    if (isDayCompletelyBlocked) return [];

    const generatedSlots: {start: string, end: string, isBooked: boolean}[] = [];
    
    workingBlocks.forEach(block => {
      let currentMin = parseTime(block.start);
      const endMin = parseTime(block.end);
      
      while (currentMin + duration <= endMin) {
        const slotStart = formatTime(currentMin);
        const slotEnd = formatTime(currentMin + duration);
        
        let isBooked = false;
        
        // Time-based blocked check
        if (coachSchedule.blockedDates) {
            const currentDayObj = new Date(`${selectedDate}T00:00:00`).getTime();
            const slotBlockedByTime = coachSchedule.blockedDates.some(bd => {
                if (bd.isAllDay === false && bd.startTime && bd.endTime) {
                    const blockStartDate = new Date(`${bd.startDate}T00:00:00`).getTime();
                    const blockEndDate = new Date(`${bd.endDate}T23:59:59`).getTime();
                    
                    if (currentDayObj >= blockStartDate && currentDayObj <= blockEndDate) {
                         const blockStartMin = parseTime(bd.startTime);
                         const blockEndMin = parseTime(bd.endTime);
                         // Check overlap
                         return Math.max(currentMin, blockStartMin) < Math.min(currentMin + duration, blockEndMin);
                    }
                }
                return false;
            });
            if (slotBlockedByTime) {
                isBooked = true;
            }
        }
        
        if (!isBooked) {
            for (const app of bookedAppointments) {
              const appStartMin = parseTime(app.startTime);
              const appEndMin = app.endTime ? parseTime(app.endTime) : appStartMin + duration; 
              
              // Strict overlap check
              const overlap = Math.max(currentMin, appStartMin) < Math.min(currentMin + duration, appEndMin);
              
              if (overlap) {
                if (!selectedService.multipleRequestsPerSession) {
                  isBooked = true;
                  break;
                } else {
                  const participantsInSlot = bookedAppointments
                    .filter(a => parseTime(a.startTime) === appStartMin)
                    .reduce((sum, a) => sum + (a.participantCount || 1), 0);
                    
                  if (participantsInSlot >= (selectedService.maxParticipants || 1)) {
                    isBooked = true;
                    break;
                  }
                }
              }
            }
        }
        
        generatedSlots.push({ start: slotStart, end: slotEnd, isBooked });
        currentMin += totalSlotTime; 
      }
    });
    
    return generatedSlots;
  };

  const handleBook = async () => {
    if (!user || !userData || !selectedService || !selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      const endTime = formatTime(parseTime(selectedSlot) + (selectedService.duration || 60));
      
      if (initialBooking) {
        await appointmentService.updateAppointment(initialBooking.id!, {
          date: selectedDate,
          startTime: selectedSlot,
          endTime,
          isOnline,
          participantCount,
          updatedAt: new Date()
        });
        alert("Randevunuz başarıyla güncellendi.");
      } else {
        await appointmentService.bookAppointment({
          studentId: user.uid,
          studentName: `${userData.firstName} ${userData.lastName}`,
          serviceId: selectedService.id!,
          serviceType: selectedService.type,
          coachId: selectedCoach?.uid,
          coachName: selectedCoach ? (selectedCoach.firstName ? `${selectedCoach.firstName} ${selectedCoach.lastName}` : (selectedCoach.displayName || 'İsimsiz Personel')) : 'Atanmamış',
          date: selectedDate,
          startTime: selectedSlot,
          endTime,
          status: selectedService.approvalType === 'automatic' ? 'confirmed' : 'pending',
          participantCount,
          isOnline,
          paymentStatus: 'unpaid'
        });
        alert("Randevu talebiniz başarıyla oluşturuldu.");
      }
      onClose();
    } catch (err) {
      alert(initialBooking ? "Randevu güncellenirken bir hata oluştu." : "Randevu oluşturulurken bir hata oluştu.");
    } finally {
      setBooking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">{initialBooking ? 'Tarih Değiştir' : 'Yeni Randevu'}</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">
              {initialBooking ? 'Yeni bir zaman dilimi seçin' : `Adım ${step} / 4`}
            </p>
          </div>
          <button onClick={onClose} className="bg-slate-950 p-3 rounded-2xl text-slate-500 hover:text-white transition-all border border-white/5">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto no-scrollbar flex-1">
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {[
                 { id: 'one-on-one', label: 'Birebir Randevu', icon: User, desc: 'Özel birebir görüşmeler' },
                 { id: 'lesson', label: 'Ders / Grup', icon: Users, desc: 'Gruplara yönelik ortak seanslar' },
                 { id: 'course', label: 'Kurs / Paket', icon: Repeat, desc: 'Program bazlı seans setleri' }
               ].map((type) => (
                 <button 
                   key={type.id}
                   onClick={() => handleSelectType(type.id)}
                   className="flex items-center gap-6 p-6 bg-slate-950/40 border border-white/5 rounded-[32px] hover:bg-white/[0.04] hover:border-blue-500/30 transition-all group text-left"
                 >
                   <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <type.icon size={28} />
                   </div>
                   <div>
                      <h4 className="font-bold text-white text-lg tracking-tight">{type.label}</h4>
                      <p className="text-slate-500 text-sm font-medium">{type.desc}</p>
                   </div>
                   <ChevronRight className="ml-auto text-slate-700 group-hover:text-blue-400 transition-all" />
                 </button>
               ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <button onClick={() => setStep(1)} className="text-xs font-bold text-blue-400 hover:underline mb-2">← Geri Dön</button>
               <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Hizmet Seçin</h3>
               <div className="grid grid-cols-1 gap-3">
                 {services.filter(s => s.type === selectedType).map(service => (
                   <button 
                     key={service.id}
                     onClick={() => handleSelectService(service)}
                     className="w-full bg-slate-950/50 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all group"
                   >
                     <div className="text-left">
                       <h4 className="font-bold text-white">{service.title}</h4>
                       <p className="text-xs text-slate-500 mt-1">{service.duration} Dakika • {service.basePrice} ₺</p>
                     </div>
                     <ChevronRight size={18} className="text-slate-700 group-hover:text-white" />
                   </button>
                 ))}
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <button onClick={() => setStep(2)} className="text-xs font-bold text-blue-400 hover:underline mb-2">← Geri Dön</button>
               <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">Eğitmen / Koç Seçin</h3>
               <div className="grid grid-cols-1 gap-3">
                 {coaches.map(coach => (
                    <button 
                      key={coach.uid}
                      onClick={() => handleSelectCoach(coach)}
                      className="flex items-center gap-4 p-4 bg-slate-950/50 border border-white/5 rounded-2xl hover:bg-white/5 transition-all group w-full text-left"
                    >
                       <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold overflow-hidden shadow-inner">
                          {coach.photoURL ? (
                             <img src={coach.photoURL} className="w-full h-full object-cover" />
                          ) : (
                             coach.firstName ? coach.firstName.charAt(0) : (coach.displayName ? coach.displayName.charAt(0) : '?')
                          )}
                       </div>
                       <div className="flex-1">
                          <h4 className="font-bold text-white">{coach.firstName} {coach.lastName}</h4>
                          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sorumlu Eğitmen</p>
                       </div>
                       <ChevronRight className="text-slate-700 group-hover:text-white" />
                    </button>
                 ))}
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl">
                       {selectedService?.title[0]}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-lg tracking-tight">{selectedService?.title}</h4>
                        <p className="text-xs text-blue-400 font-bold uppercase tracking-widest">
                           {selectedCoach?.firstName ? `${selectedCoach.firstName} ${selectedCoach.lastName}` : (selectedCoach?.displayName || 'İsimsiz Personel')}
                         </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 py-4 border-t border-white/5">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Clock size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">{selectedService?.duration} Dakika</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <CreditCard size={14} /> <span className="text-[10px] font-bold uppercase tracking-widest">{selectedService?.basePrice} ₺</span>
                      </div>
                  </div>
               </div>

               <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-1">Tarih Seçin</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold appearance-none outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                 </div>

                 {selectedDate && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 px-1">Saat Seçin</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                         {getAvailableSlots().map((slot, idx) => (
                           <button
                             key={idx}
                             disabled={slot.isBooked}
                             onClick={() => setSelectedSlot(slot.start)}
                             className={`p-3 rounded-xl border text-sm font-bold transition-all ${
                               slot.isBooked 
                                 ? 'bg-slate-950 border-white/5 text-slate-700 cursor-not-allowed' 
                                 : selectedSlot === slot.start
                                   ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                                   : 'bg-slate-950/50 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                             }`}
                           >
                             {slot.start}
                           </button>
                         ))}
                      </div>
                    </div>
                 )}

                 {selectedService?.isOnlineAvailable && (
                   <div className="bg-slate-950/40 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400">
                          <Video size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">Online Görüşme İstiyorum</h4>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Zoom Entegrasyonu Kullanılacak</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isOnline}
                        onChange={(e) => setIsOnline(e.target.checked)}
                        className="w-6 h-6 rounded-lg bg-slate-900 border-white/10 text-blue-600 focus:ring-0"
                      />
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 relative z-10 shrink-0">
          {step === 4 && selectedSlot && (
            <button 
              onClick={handleBook}
              disabled={booking}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {booking ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
              {booking 
                ? (initialBooking ? 'Güncelleniyor...' : 'Randevu Alınıyor...') 
                : (initialBooking ? 'Değişikliği Kaydet' : 'Randevuyu Onayla ve Oluştur')}
            </button>
          )}
          {step < 4 && (
             <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Önceki Adımları Tamamlayın</p>
          )}
          {step === 4 && !selectedSlot && (
            <p className="text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Lütfen tarih ve saat seçin</p>
          )}
        </div>
      </div>
    </div>
  );
}
