import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { NotificationPrompt } from '../components/NotificationPrompt';
import { 
  Users, 
  Calendar, 
  Clock,
  ArrowRight,
  TrendingUp,
  Award,
  Video,
  User
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useStudent } from '../lib/StudentContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { appointmentService } from '../services/appointmentService';
import { useNavigate } from 'react-router-dom';

export default function CoachDashboard() {
  const { user, userData } = useAuth();
  const { setSelectedStudent } = useStudent();
  const [students, setStudents] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const q = userData?.role === 'admin' 
        ? query(collection(db, 'users'), where('role', '==', 'student'))
        : query(collection(db, 'users'), where('coachId', '==', user!.uid));
      
      const snap = await getDocs(q);
      const studentDataPromises = snap.docs.map(async (docSnap) => {
        const student = { uid: docSnap.id, ...docSnap.data() } as any;
        student.displayName = student.displayName || `${student.firstName} ${student.lastName}`;
        
        let parentUid = undefined;
        let parentFirstName = undefined;
        let parentLastName = undefined;
        try {
           const usersRef = collection(db, 'users');
           const qParent = query(usersRef, where('role', '==', 'parent'), where('studentUid', '==', student.uid));
           const parentSnap = await getDocs(qParent);
           if (!parentSnap.empty) {
             const parentData = parentSnap.docs[0].data();
             parentUid = parentSnap.docs[0].id;
             parentFirstName = parentData.firstName;
             parentLastName = parentData.lastName;
           }
        } catch(e) {}
        
        return {
           ...student,
           parentUid,
           parentFirstName,
           parentLastName
        };
      });
      const studentData = await Promise.all(studentDataPromises);
      setStudents(studentData);

      // Fetch appointments
      const appts = await appointmentService.getAppointments(user!.uid, userData?.role === 'admin' ? 'admin' : 'coach');
      setAppointments(appts || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    navigate('/panel/koc/ogrenci');
  };

  const pendingAppointments = appointments.filter(a => a.status === 'pending');
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const upcomingAppointments = appointments.filter(a => 
    a.status === 'confirmed' && new Date(`${a.date}T${a.startTime}`) > new Date()
  ).sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const todaysAppointments = upcomingAppointments.filter(a => a.date === new Date().toISOString().split('T')[0]);

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-500 min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Pano Hazırlanıyor...</h2>
        <p className="text-slate-400 text-sm">Verileriniz derleniyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      <NotificationPrompt />
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Aktif
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            İyi Günler, {userData?.firstName}
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Öğrencilerinizin gelişimi ve koçluk sürecinizle ilgili tüm özet veriler burada. 
            Bugün {todaysAppointments.length} randevunuz bulunuyor.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <button 
            onClick={() => navigate('/panel/koc/musaitlik')}
            className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl"
          >
            <Clock size={18} className="text-emerald-400" /> 
            <span>Müsaitlik</span>
          </button>
        </motion.div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Aktif Öğrenci', value: students.length, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Yeni Randevu Talebi', value: pendingAppointments.length, icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          { label: 'Yaklaşan Seans', value: upcomingAppointments.length, icon: Video, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Tamamlanan Seans', value: completedAppointments.length, icon: Award, color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-[24px] p-6 hover:bg-slate-800/50 transition-colors group"
          >
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-[16px] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={22} strokeWidth={2.5} />
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* MAIN BENTO GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* STUDENTS LIST */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden relative">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500/50 via-emerald-500/50 to-purple-500/50" />
           
           <div className="p-8 flex items-center justify-between border-b border-white/5">
             <div>
               <h2 className="text-xl font-bold text-white flex items-center gap-3">
                 <Users className="text-emerald-400" size={24} /> 
                 Öğrencilerim
               </h2>
               <p className="text-slate-500 text-sm mt-1">Gelişimini takip ettiğiniz aktif öğrenciler</p>
             </div>
             <button 
               onClick={() => navigate('/panel/koc/ogrenciler')}
               className="text-[10px] font-black uppercase text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl"
             >
               Tümünü Gör <ArrowRight size={14} />
             </button>
           </div>

           <div className="p-4 space-y-2 flex-1 max-h-[500px] overflow-y-auto no-scrollbar">
             {students.length > 0 ? (
               students.map((student) => (
                 <div
                   key={student.uid}
                   onClick={() => handleStudentClick(student)}
                   className="group flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/10 rounded-2xl cursor-pointer transition-all"
                 >
                   <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-400 overflow-hidden group-hover:scale-105 transition-transform">
                       {student.photoURL ? (
                         <img src={student.photoURL} alt={student.displayName} className="w-full h-full object-cover" />
                       ) : (
                         student.displayName.charAt(0)
                       )}
                     </div>
                     <div>
                       <h3 className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{student.displayName}</h3>
                       <div className="flex items-center gap-2 mt-1">
                         <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md">
                           {student.grade || 'Sınıf Yok'}
                         </span>
                         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                           {student.branch || 'Alan Yok'}
                         </span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                     <ArrowRight size={14} />
                   </div>
                 </div>
               ))
             ) : (
                <div className="p-10 flex flex-col items-center justify-center text-center h-full">
                  <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center mb-4">
                    <Users size={32} className="text-slate-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-300">Öğrenci Bulunmuyor</h3>
                  <p className="text-sm text-slate-500 mt-2">Henüz size atanmış bir öğrenci yok.</p>
                </div>
             )}
           </div>
        </div>

        {/* APPOINTMENTS SIDEBAR */}
        <div className="flex flex-col bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden">
           <div className="p-8 border-b border-white/5">
             <h2 className="text-xl font-bold text-white flex items-center gap-3 mb-2">
               <Calendar className="text-amber-400" size={24} /> 
               Yaklaşan Görüşmeler
             </h2>
             <p className="text-slate-500 text-sm">
               Tüm randevuları görmek için <button onClick={() => navigate('/panel/koc/randevular')} className="text-amber-400 font-medium hover:underline">tıklayın</button>.
             </p>
           </div>
           
           <div className="p-6 space-y-4 flex-1">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.slice(0, 5).map(app => (
                  <div key={app.id} className="relative pl-6 py-2">
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-white/10" />
                    <div className="absolute left-[-4px] top-6 w-2 h-2 rounded-full bg-amber-400 ring-4 ring-slate-900" />
                    
                    <div className="bg-slate-800/40 rounded-2xl p-4 border border-white/5 hover:bg-slate-800/80 transition-colors group">
                      <div className="flex items-start justify-between gap-4 mb-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase tracking-widest w-fit border border-amber-500/20">{app.date.split('-').reverse().join('.')}</span>
                            <div className="flex items-center gap-1 text-slate-300 text-sm font-bold bg-white/5 px-2 py-1 rounded-lg w-fit border border-white/5">
                               <Clock size={14} className="text-amber-400" />
                               {app.startTime}
                            </div>
                         </div>
                         <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                            <User size={14} className="text-blue-400" />
                         </div>
                      </div>
                      <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">{app.studentName || 'Bilinmeyen Öğrenci'}</h4>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Video size={14} className="text-slate-500" />
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{app.serviceType === 'one-on-one' ? 'Birebir Görüşme' : app.serviceType === 'interview' ? 'Öğrenci Görüşmesi' : app.serviceType === 'lesson' ? 'Birebir Ders' : 'Görüşme'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10">
                   <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                     <Calendar className="text-slate-600" size={24} />
                   </div>
                   <p className="text-sm font-bold text-slate-400">Yaklaşan onaylı randevu yok</p>
                </div>
              )}
           </div>

           {pendingAppointments.length > 0 && (
             <div className="p-6 bg-amber-500/10 border-t border-amber-500/20">
                <div className="flex items-center justify-between">
                   <div>
                     <h4 className="text-sm font-bold text-amber-400">Onay Bekleyenler var</h4>
                     <p className="text-xs text-amber-400/80 mt-1">{pendingAppointments.length} randevu incelenmeyi bekliyor.</p>
                   </div>
                   <button 
                     onClick={() => navigate('/panel/koc/randevular')}
                     className="bg-amber-500 text-amber-950 font-bold text-xs px-4 py-2 rounded-xl"
                   >
                     İncele
                   </button>
                </div>
             </div>
           )}
        </div>

      </div>
    </div>
  );
}
