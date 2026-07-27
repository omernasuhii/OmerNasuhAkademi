import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { useNavigate } from 'react-router-dom';
import { safeStorage } from '../../lib/localStorage';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  TrendingUp, 
  Calendar,
  MoreVertical,
  MessageCircle,
  UserPlus
} from 'lucide-react';
import { motion } from 'motion/react';

export default function CoachStudents() {
  const { user, userData } = useAuth();
  const { setSelectedStudent } = useStudent();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userData) fetchStudents();
  }, [user, userData]);

  const fetchStudents = async () => {
    try {
      const q = userData?.role === 'admin'
        ? query(collection(db, 'users'), where('role', '==', 'student'))
        : query(collection(db, 'users'), where('coachId', '==', user!.uid));
        
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({
        uid: doc.id,
        ...doc.data(),
        displayName: doc.data().displayName || (doc.data().firstName || doc.data().lastName ? `${doc.data().firstName || ''} ${doc.data().lastName || ''}`.trim() : 'İsimsiz Öğrenci')
      }));

      const enrichedStudents = await Promise.all(data.map(async (student) => {
         // Fetch parent info
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

         const examsRef = collection(db, 'exam_results');
         const qExams = query(examsRef, where('studentId', '==', student.uid));
         const examsSnap = await getDocs(qExams);
         
         let latestScore: number | null = null;
         let progress: string | null = null;
         
         if (!examsSnap.empty) {
             const exams = examsSnap.docs.map(e => e.data())
                                          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
             
             const getScore = (e: any) => {
                 if (e.examType === 'TYT' || e.examType === 'AYT') {
                    let total = 0;
                    if (e.scores) {
                         Object.values(e.scores).forEach((s: any) => {
                              total += parseFloat(s.n || 0);
                         });
                    }
                    return total || parseFloat(e.score) || 0;
                 }
                 return parseFloat(e.score) || 0;
             };
             
             const recentExamsCount = exams.filter(e => e.examType === 'TYT' || e.examType === 'AYT' || e.examType === 'YKS');
             if (recentExamsCount.length > 0) {
                 latestScore = getScore(recentExamsCount[0]);
             }
             
             const recentExamsForPercentile = exams.filter(e => (e.examType === 'TYT' || e.examType === 'AYT' || e.examType === 'YKS') && e.percentile != null).slice(0, 2);
             if (recentExamsForPercentile.length >= 2) {
                 const p1 = parseFloat(recentExamsForPercentile[0].percentile);
                 const p2 = parseFloat(recentExamsForPercentile[1].percentile);
                 if (!isNaN(p1) && !isNaN(p2)) {
                      progress = (p2 - p1).toFixed(1);
                 }
             }
         }
         
         let nextAppt = null;
         try {
             const userStr = safeStorage.getItem('user');
             const currentUser = userStr ? JSON.parse(userStr) : null;
             const apptsRef = collection(db, 'appointments');
             const qAppts = query(apptsRef, where('studentId', '==', student.uid));
             const apptsSnap = await getDocs(qAppts);
             if (!apptsSnap.empty) {
                 const appts = apptsSnap.docs.map(d => d.data())
                                            .filter(a => ['pending', 'confirmed'].includes(a.status || ''))
                                            .filter(a => currentUser?.uid ? a.coachId === currentUser.uid : true)
                                            .filter(a => new Date(a.date) >= new Date(new Date().toISOString().split('T')[0]))
                                            .sort((a,b) => new Date(a.date + 'T' + a.startTime).getTime() - new Date(b.date + 'T' + b.startTime).getTime());
                 if (appts.length > 0) {
                     nextAppt = appts[0];
                 }
             }
         } catch(e) {}
         
         return {
             ...student,
             latestScore,
             progress,
             nextAppt,
             parentUid,
             parentFirstName,
             parentLastName
         };
      }));

      setStudents(enrichedStudents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (student: any) => {
    setSelectedStudent(student);
    navigate('/panel/koc/ogrenci');
  };

  const filteredStudents = students.filter(s => 
    s.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             ÖĞRENCİLERİM
          </h1>
          <p className="text-slate-500 mt-1">Sorumluluğunuzdaki tüm öğrencilerin listesi ve durum özetleri.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
           <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
           <input 
             type="text" 
             placeholder="Öğrenci ara..."
             className="w-full bg-slate-900/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none focus:border-emerald-500/30 transition-all font-bold"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
        <button className="bg-slate-900/40 border border-white/5 hover:bg-white/5 px-6 rounded-2xl flex items-center gap-2 text-slate-400 font-bold transition-all">
           <Filter size={18} /> Filtrele
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-900/40 border border-white/5 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student, i) => (
            <motion.div 
              key={student.uid}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleStudentClick(student)}
              className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:bg-emerald-600/5 hover:border-emerald-500/20 transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                 <button className="p-2 text-slate-600 hover:text-white transition-colors">
                    <MoreVertical size={20} />
                 </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 font-black text-2xl group-hover:scale-105 transition-all overflow-hidden relative">
                    {student.photoURL ? (
                       <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                       student.displayName.charAt(0)
                    )}
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight">{student.displayName}</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                      {student.branch || 'Alan Yok'} • {student.grade || 'Sınıf Yok'}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Son Deneme</p>
                    <p className="text-sm font-bold text-white">{student.latestScore ? `${Number(student.latestScore).toFixed(1)} Net` : '-'}</p>
                 </div>
                 <div className="bg-white/5 rounded-2xl p-3 border border-white/5" title="Son 2 deneme (TYT, AYT, YKS) arasındaki yüzdelik dilim değişimi">
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Gelişim</p>
                    <p className={`text-sm font-bold ${student.progress && Number(student.progress) > 0 ? 'text-emerald-500' : student.progress && Number(student.progress) < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      {student.progress ? `${Number(student.progress) > 0 ? '+' : ''}${student.progress}%` : '-'}
                    </p>
                 </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center">
                       <Calendar size={14} className="text-slate-400" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest leading-none mb-1">En Yakın Randevu</span>
                      <span className="text-[11px] font-bold text-slate-300 leading-none">
                        {student.nextAppt ? (
                           (() => {
                             const d = new Date(student.nextAppt.date);
                             const isToday = d.toDateString() === new Date().toDateString();
                             const isTomorrow = new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() === d.toDateString();
                             
                             let dateStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
                             if (isToday) dateStr = 'Bugün';
                             else if (isTomorrow) dateStr = 'Yarın';
                             
                             return `${dateStr} ${student.nextAppt.startTime}`;
                           })()
                        ) : (
                          'Randevu Yok'
                        )}
                      </span>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-emerald-500">
                    <span className="text-[10px] font-black uppercase tracking-widest">Yönet</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </div>
              </div>
            </motion.div>
          ))}
          
          {filteredStudents.length === 0 && (
             <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
                <Users size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 font-medium italic">Öğrenci bulunamadı.</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
}
