import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Loader2, Check, User, Video } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { useAuth } from '../../lib/AuthContext';
import { notificationService } from '../../services/notificationService';

interface CoachBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CoachBookingModal({ isOpen, onClose, onSuccess }: CoachBookingModalProps) {
  const { user, userData } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [isParentMeeting, setIsParentMeeting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadStudents();
    }
  }, [isOpen, user]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await appointmentService.getCoachStudents(user!.uid);
      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!user || !selectedStudent || !selectedDate || !selectedTime) return;
    
    setSubmitting(true);
    try {
      const student = students.find(s => s.uid === selectedStudent);
      
      const startTime = selectedTime;
      const [h, m] = startTime.split(':').map(Number);
      const totalMin = h * 60 + m + 60;
      const endH = Math.floor(totalMin / 60);
      const endM = totalMin % 60;
      const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

      await appointmentService.bookAppointment({
        studentId: student.uid,
        requesterId: isParentMeeting && student.parentUid ? student.parentUid : student.uid,
        requesterRole: isParentMeeting ? 'parent' : 'student',
        studentName: isParentMeeting && student.parentFirstName ? `${student.parentFirstName} ${student.parentLastName}` : `${student.firstName} ${student.lastName}`,
        serviceId: 'custom-appointment',
        serviceType: 'one-on-one',
        coachId: user.uid,
        coachName: `${userData?.firstName} ${userData?.lastName}`,
        date: selectedDate,
        startTime,
        endTime,
        status: 'confirmed',
        participantCount: 1,
        isOnline,
        paymentStatus: 'unpaid'
      });
      
      if (isParentMeeting && student.parentUid) {
         await notificationService.addNotification(student.parentUid, {
            title: 'Yeni Veli Görüşmesi Atandı',
            message: `Öğrencinizin koçu ${userData?.firstName} ${userData?.lastName}, ${selectedDate} tarihi saat ${startTime} için yeni bir veli görüşmesi atadı.`,
            type: 'appointment',
            link: '/panel/veli/randevular'
         });
      }

      await notificationService.addNotification(student.uid, {
         title: isParentMeeting ? 'Yeni Veli Görüşmesi Atandı' : 'Yeni Randevu Atandı',
         message: isParentMeeting 
           ? `Koçun ${userData?.firstName}, velin ile ${selectedDate} tarihi saat ${startTime} için bir görüşme planladı.`
           : `Koçun ${userData?.firstName} sana ${selectedDate} tarihi saat ${startTime} için yeni bir randevu atadı.`,
         type: 'appointment',
         link: '/panel/ogrenci/randevular'
      });
      
      if (onSuccess) onSuccess();
      onClose();
      
      // Reset
      setSelectedStudent('');
      setSelectedDate('');
      setSelectedTime('');
      setIsOnline(false);
      setIsParentMeeting(false);
    } catch (err) {
      alert("Randevu oluşturulurken bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-slate-900 border border-white/10 w-full max-w-md sm:rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-tight uppercase">Yeni Randevu Ekle</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
              ÖĞRENCİNİZE RANDEVU ATAYIN
            </p>
          </div>
          <button onClick={onClose} className="bg-slate-950 p-2 rounded-xl text-slate-500 hover:text-white transition-all border border-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Öğrenci Seç</label>
                <select 
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">-- Öğrenci Seçin --</option>
                  {students.map(s => (
                    <option key={s.uid} value={s.uid}>{s.firstName} {s.lastName}</option>
                  ))}
                </select>
                {students.length === 0 && <p className="text-xs text-amber-500 mt-2">Henüz öğrenciniz bulunmuyor.</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Tarih</label>
                <input 
                  ref={dateInputRef}
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  // showPicker is blocked in cross-origin iframes
                  onClick={() => {}}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Saat</label>
                <input 
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-blue-500/50"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-500/10 p-2 rounded-lg text-purple-400">
                      <Video size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Online Görüşme</h4>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isOnline}
                    onChange={(e) => setIsOnline(e.target.checked)}
                    className="w-5 h-5 rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0"
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-lg text-indigo-400">
                      <User size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Veli Görüşmesi</h4>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={isParentMeeting}
                    onChange={(e) => setIsParentMeeting(e.target.checked)}
                    className="w-5 h-5 rounded bg-slate-900 border-white/10 text-blue-600 focus:ring-0"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-8 border-t border-white/5 bg-slate-900/50 flex">
          <button 
            onClick={handleBook}
            disabled={submitting || !selectedStudent || !selectedDate || !selectedTime}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            Randevu Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}
