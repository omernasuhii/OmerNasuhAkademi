import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { 
  Target, 
  Flag, 
  CheckCircle2, 
  Circle, 
  Trophy, 
  BookOpen, 
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  GraduationCap,
  LineChart as LineChartIcon,
  TrendingUp,
  Award
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TopicGoal {
  subject: string;
  topic: string;
  isCompleted: boolean;
}

interface BookGoal {
  bookId: string;
  bookName: string;
  subject?: string;
  targetDescription: string;
  progress: number;
  isCompleted: boolean;
  startPage?: number;
  endPage?: number;
  currentPage?: number;
}

export default function ParentGoals() {
  const { userData } = useAuth();
  const { selectedStudent } = useStudent();
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [topicGoals, setTopicGoals] = useState<TopicGoal[]>([]);
  const [bookGoals, setBookGoals] = useState<BookGoal[]>([]);
  const [coachNote, setCoachNote] = useState('');
  const [studentBooks, setStudentBooks] = useState<any[]>([]);
  
  // New state for Academic & Exam data
  const [academicInfo, setAcademicInfo] = useState<any>({});
  const [examResults, setExamResults] = useState<any[]>([]);

  useEffect(() => {
    if (selectedStudent?.uid) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [userData, currentMonth, selectedStudent]);

  const loadData = async () => {
    setLoading(true);
    try {
      const studentUid = selectedStudent!.uid!;
      
      const [goalData, profile, exams, books] = await Promise.all([
        studentDataService.getMonthlyGoal(studentUid, currentMonth),
        studentDataService.getStudentProfile(studentUid),
        studentDataService.getExamResults(studentUid),
        studentDataService.getBookTracking(studentUid)
      ]);

      if (goalData) {
        setTopicGoals(goalData.topicGoals || []);
        setBookGoals(goalData.bookGoals || []);
        setCoachNote(goalData.coachNote || '');
      } else {
        setTopicGoals([]);
        setBookGoals([]);
        setCoachNote('');
      }

      setAcademicInfo(profile || {});
      setExamResults(exams || []);
      setStudentBooks(books || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const sortedTopicGoals = useMemo(() => {
    return [...topicGoals].sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));
  }, [topicGoals]);

  const sortedBookGoals = useMemo(() => {
    return [...bookGoals].sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));
  }, [bookGoals]);

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  const parseDate = (val: any) => {
    if (!val) return new Date();
    if (typeof val?.toDate === 'function') return val.toDate();
    if (val?.seconds) return new Date(val.seconds * 1000);
    return new Date(val);
  };

  const tytExams = useMemo(() => {
    return [...examResults]
      .filter(e => e.examType === 'TYT' || (e.examType === 'YKS' && e.scores && Object.keys(e.scores).some(k => k.includes('TYT'))))
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
      .map((exam, i) => {
         let net = 0;
         if (exam.scores) {
            Object.entries(exam.scores).forEach(([k,v]: [string, any]) => {
               if (exam.examType === 'YKS') {
                   if (k.includes('TYT')) {
                       net += parseFloat(v.n) || 0;
                   }
               } else if (exam.examType === 'TYT') {
                   net += parseFloat(v.n) || 0;
               }
            });
         }
         return {
          name: exam.examName || `D${i + 1}`,
          net: Number(net.toFixed(2)),
          date: parseDate(exam.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
          ...exam
         };
      });
  }, [examResults]);

  const aytExams = useMemo(() => {
    return [...examResults]
      .filter(e => e.examType === 'AYT' || (e.examType === 'YKS' && e.scores && Object.keys(e.scores).some(k => k.includes('AYT'))))
      .sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime())
      .map((exam, i) => {
         let net = 0;
         const branchNets: any = {};
         
         if (exam.scores) {
            Object.entries(exam.scores).forEach(([k,v]: [string, any]) => {
               const score = parseFloat(v.n) || 0;
               if (exam.examType === 'YKS') {
                   if (k.includes('AYT')) {
                       const subjName = k.replace('AYT ', '');
                       branchNets[subjName] = score;
                   }
               } else if (exam.examType === 'AYT') {
                   branchNets[k] = score;
               }
            });
            
            const aytSay = (branchNets['Matematik'] || 0) + (branchNets['Geometri'] || 0) + (branchNets['Fizik'] || 0) + (branchNets['Kimya'] || 0) + (branchNets['Biyoloji'] || 0);
            const aytEa = (branchNets['Matematik'] || 0) + (branchNets['Geometri'] || 0) + (branchNets['Edebiyat'] || 0) + (branchNets['Tarih-1'] || 0) + (branchNets['Coğrafya-1'] || 0);
            const aytSoz = (branchNets['Edebiyat'] || 0) + (branchNets['Tarih-1'] || 0) + (branchNets['Coğrafya-1'] || 0) + (branchNets['Tarih-2'] || 0) + (branchNets['Coğrafya-2'] || 0) + (branchNets['Felsefe Grubu'] || 0) + (branchNets['Din (Seçmeli)'] || 0);
            
            const branch = academicInfo?.branch;
            if (branch === 'SAYISAL' || branch === 'SAY') net = aytSay;
            else if (branch === 'EŞİT AĞIRLIK' || branch === 'EA') net = aytEa;
            else if (branch === 'SÖZEL' || branch === 'SÖZ') net = aytSoz;
            else net = aytSay; // default
         }
         
         return {
          name: exam.examName || `D${i + 1}`,
          net: Number(net.toFixed(2)),
          date: parseDate(exam.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
          ...exam
         };
      });
  }, [examResults, academicInfo?.branch]);

  const overallProgressData = useMemo(() => {
    const totalGoals = topicGoals.length + bookGoals.length;
    if (totalGoals === 0) return [];
    
    const completed = topicGoals.filter(t => t.isCompleted).length + bookGoals.filter(b => b.isCompleted).length;
    const remaining = totalGoals - completed;
    
    return [
      { name: 'Tamamlanan', value: completed, color: '#10b981' }, // emerald-500
      { name: 'Kalan', value: remaining, color: '#1e293b' } // slate-800
    ];
  }, [topicGoals, bookGoals]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={40} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!selectedStudent?.uid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p>Öğrenci bilgisi bulunamadı. Lütfen öğrencinizle eşleştiğinizden emin olun.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             HEDEFLER & İLERLEME
          </h1>
          <p className="text-slate-500 mt-1">{userData?.studentName || 'Öğrencinin'} akademik hedefleri ve {monthLabel} dönemi planı.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-2xl border border-white/5">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">{monthLabel}</span>
          </div>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Academic Goals & Exam Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <GraduationCap size={120} className="text-emerald-500" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                <Target size={20} />
              </div>
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Akademik Hedef</h3>
            </div>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hedef Üniversite</p>
            <p className="text-2xl font-black text-white italic uppercase leading-tight mb-4">
              {academicInfo?.targetUniversity || 'Belirlenmedi'}
            </p>
            
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Hedef Bölüm</p>
            <p className="text-lg font-bold text-slate-300 uppercase leading-tight">
              {academicInfo?.targetDepartment || 'Belirlenmedi'}
            </p>
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Award size={120} className="text-blue-500" />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                <Target size={20} />
              </div>
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest">Hedef Netler</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TYT Hedefi</p>
                <p className="text-4xl font-black text-white italic">{academicInfo?.targetTyt || '-'}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col justify-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AYT Hedefi</p>
                <p className="text-4xl font-black text-white italic">{academicInfo?.targetAyt || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: Monthly Topic Goals */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                  <Flag size={20} />
                </div>
                <h3 className="text-xl font-bold">Aylık Konu Hedefleri</h3>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                 {topicGoals.filter(t => t.isCompleted).length} / {topicGoals.length} TAMAMLANDI
              </span>
            </div>
            
            <div className="space-y-3 flex-1">
              {sortedTopicGoals.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl italic text-sm">
                  Bu ay için henüz konu hedefi eklenmemiş.
                </div>
              ) : (
                sortedTopicGoals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all">
                    <div className={`transition-all ${goal.isCompleted ? 'text-emerald-500' : 'text-slate-600'}`}>
                      {goal.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{goal.subject}</p>
                      <p className={`text-sm font-bold truncate ${goal.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {goal.topic}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Book Completion Program */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                <BookOpen size={20} />
              </div>
              <h3 className="text-xl font-bold">Aylık Kitap Bitirme Programı</h3>
            </div>
            
            <div className="space-y-6 flex-1">
              { (sortedBookGoals.length === 0) ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl italic text-sm">
                  Bu ay için henüz kitap bitirme hedefi eklenmemiş.
                </div>
              ) : (
                sortedBookGoals.map((goal, i) => {
                  const hasPageTracking = goal.startPage !== undefined && goal.endPage !== undefined;
                  const bookInfo = studentBooks.find(b => b.id === goal.bookId);
                  const subjectToShow = goal.subject || bookInfo?.subject;
                  return (
                    <div key={i} className="space-y-4 p-5 rounded-3xl bg-white/5 border border-white/5 relative">
                      <div className="flex justify-between items-start">
                        <div>
                          {subjectToShow && (
                            <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">
                              {subjectToShow}
                            </span>
                          )}
                          <h4 className="text-sm font-bold text-slate-200">{goal.bookName}</h4>
                          {hasPageTracking ? (
                            <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                              <span>Hedef: Sayfa {goal.startPage} - {goal.endPage}</span>
                              <span className="text-amber-500 font-semibold">Mevcut Sayfa: {goal.currentPage ?? goal.startPage} / {goal.endPage}</span>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500 mt-1">Hedef: {goal.targetDescription}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${goal.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {goal.isCompleted ? 'BİTTİ' : `%${goal.progress} TAMAM`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-px">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${goal.isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}
                            style={{ width: `${goal.progress}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Coach's Monthly Assessment & Overall Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-8">
           <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                 <Trophy size={20} />
              </div>
              <h3 className="text-xl font-bold">Koçun Aylık Değerlendirmesi & Notu</h3>
           </div>
           {coachNote ? (
             <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 whitespace-pre-wrap">
               {coachNote}
             </div>
           ) : (
             <div className="text-slate-500 italic text-sm border-2 border-dashed border-white/5 rounded-2xl p-6 text-center">
               Koç tarafından henüz bir değerlendirme notu eklenmemiş.
             </div>
           )}
        </div>

        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 self-start w-full text-center">Hedef Tamamlama Oranı</h3>
           {overallProgressData.length > 0 ? (
             <div className="h-[180px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={overallProgressData}
                     cx="50%"
                     cy="50%"
                     innerRadius={55}
                     outerRadius={80}
                     paddingAngle={5}
                     dataKey="value"
                     stroke="none"
                   >
                     {overallProgressData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                   />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-2xl font-black text-white">
                   %{Math.round((overallProgressData[0].value / (overallProgressData[0].value + overallProgressData[1].value)) * 100) || 0}
                 </span>
                 <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Başarı</span>
               </div>
             </div>
           ) : (
             <div className="text-slate-500 italic text-sm text-center">Hedef bulunmuyor</div>
           )}
        </div>
      </div>

      {/* Progress Charts */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
           <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
             <TrendingUp size={24} />
           </div>
           <div>
             <h2 className="text-2xl font-bold text-white tracking-tight">Gelişim Analizi</h2>
             <p className="text-slate-500 text-sm">Öğrencinin katıldığı denemelerdeki net artış grafikleri.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">TYT Deneme İlerlemesi</h3>
            <div className="h-[250px] w-full">
              {tytExams.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tytExams} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                    />
                    {academicInfo?.targetTyt && (
                      <ReferenceLine y={Number(academicInfo.targetTyt)} stroke="#3b82f6" strokeDasharray="3 3" opacity={0.5} label={{ position: 'top', value: 'Hedef', fill: '#3b82f6', fontSize: 10 }} />
                    )}
                    <Line type="monotone" dataKey="net" name="TYT Net" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm italic border-2 border-dashed border-white/5 rounded-2xl">
                  Henüz TYT deneme verisi bulunmuyor.
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">
              AYT {academicInfo?.branch && `(${academicInfo.branch})`} Deneme İlerlemesi
            </h3>
            <div className="h-[250px] w-full">
              {aytExams.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={aytExams} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff20', borderRadius: '12px' }}
                      itemStyle={{ color: '#c084fc', fontWeight: 'bold' }}
                    />
                    {academicInfo?.targetAyt && (
                      <ReferenceLine y={Number(academicInfo.targetAyt)} stroke="#a855f7" strokeDasharray="3 3" opacity={0.5} label={{ position: 'top', value: 'Hedef', fill: '#a855f7', fontSize: 10 }} />
                    )}
                    <Line type="monotone" dataKey="net" name="AYT Net" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm italic border-2 border-dashed border-white/5 rounded-2xl">
                  Henüz AYT deneme verisi bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
