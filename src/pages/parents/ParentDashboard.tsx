import React, { useState, useEffect } from 'react';
import { AlertTriangle, 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  CheckCircle2,
  AlertCircle,
  FileText,
  Target,
  RefreshCw,
  Award,
  Zap,
  ChevronRight,
  Clock
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { NotificationPrompt } from '../../components/NotificationPrompt';

export default function ParentDashboard() {
  const { userData } = useAuth();
  const { selectedStudent } = useStudent();
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [pendingResultsCount, setPendingResultsCount] = useState(0);
  const [expiredWaitingCount, setExpiredWaitingCount] = useState(0);
  const [weeklyStats, setWeeklyStats] = useState({
    targetQuestions: 0,
    solvedQuestions: 0,
    completedTasks: 0,
    totalTasks: 0
  });
  const [coachName, setCoachName] = useState<string>('Koç');

  useEffect(() => {
    async function loadData() {
      if (!selectedStudent?.uid) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [profile, examData, weeklyData, reports] = await Promise.all([
          studentDataService.getStudentProfile(selectedStudent.uid),
          studentDataService.getExamResults(selectedStudent.uid),
          studentDataService.getAllDailyPrograms(selectedStudent.uid),
          studentDataService.getWeeklyReports(selectedStudent.uid)
        ]);
        
        setStudentProfile(profile);
        setExams(examData || []);
        setFeedbacks(reports || []);
        
        // Compute weekly stats (last 7 days)
        const now = new Date();
        now.setHours(0,0,0,0);
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          last7Days.push(d.toISOString().split('T')[0]);
        }
        
        let tQ = 0, sQ = 0, cT = 0, tT = 0;
        
        let pCount = 0;
        let eCount = 0;
        const todayObj = new Date();
        const todayZero = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());

        weeklyData?.forEach((prog: any) => {
           const progParts = (prog.date || '').split('-');
           let diffDays = 0;
           if (progParts.length === 3) {
             const pDateObj = new Date(Number(progParts[0]), Number(progParts[1]) - 1, Number(progParts[2]));
             diffDays = Math.floor((todayZero.getTime() - pDateObj.getTime()) / (1000 * 3600 * 24));
           }

           (prog.tasks || []).forEach((t: any) => {
               if (t.isWaitingResult) {
                 if (diffDays >= 5) {
                   eCount++;
                 } else {
                   pCount++;
                 }
               }
           });
           if (last7Days.includes(prog.date)) {
               (prog.tasks || []).forEach((t: any) => {
                   tT++;
                   if (t.isDone) cT++;
                   
                   const target = Number(t.targetCount) || 0;
                   tQ += target;
                   
                   if (t.isDone) {
                       sQ += Math.max(target, Number(t.completedCount) || 0);
                   } else {
                       sQ += Number(t.completedCount) || 0;
                   }
               });
           }
        });
        
        setPendingResultsCount(pCount);
        setExpiredWaitingCount(eCount);
        setWeeklyStats({
            targetQuestions: tQ,
            solvedQuestions: sQ,
            completedTasks: cT,
            totalTasks: tT
        });

        if (profile?.coachId) {
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../../lib/firebase');
            const coachSnap = await getDoc(doc(db, 'users', profile.coachId));
            if (coachSnap.exists()) {
                setCoachName(coachSnap.data().firstName + ' ' + coachSnap.data().lastName);
            }
        }
        
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [userData, selectedStudent]);

  if (loading) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center animate-in fade-in duration-500 min-h-[50vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4 relative z-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Öğrenci Verileri Yükleniyor...</h2>
        <p className="text-slate-400 text-sm">Lütfen bekleyin, güncel durum analiz ediliyor.</p>
      </div>
    );
  }

  const sortedExams = [...exams].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
  const latestExams = sortedExams.slice(0, 3);
  const qPct = weeklyStats.targetQuestions > 0 ? Math.round((weeklyStats.solvedQuestions / weeklyStats.targetQuestions) * 100) : 0;
  const tPct = weeklyStats.totalTasks > 0 ? Math.round((weeklyStats.completedTasks / weeklyStats.totalTasks) * 100) : 0;
  
  const getExamNet = (exam: any, type: string) => {
    if (!exam) return 0;
    if (exam.examType === type) return parseFloat(exam.totalNet || '0');
    if (exam.examType === 'YKS' && exam.scores) {
       let sum = 0;
       Object.keys(exam.scores).forEach(key => {
          if (key.startsWith(`${type} `)) sum += parseFloat(exam.scores[key].n) || 0;
       });
       return sum;
    }
    return 0;
  };

  // Calculate average of last 3 TYT exams to show progress towards target
  const tytExams = sortedExams.filter(e => e.examType === 'TYT' || e.examType === 'YKS').slice(0, 3);
  const avgTytNet = tytExams.length > 0 ? (tytExams.reduce((acc, curr) => acc + getExamNet(curr, 'TYT'), 0) / tytExams.length) : 0;
  const targetTyt = studentProfile?.targetTyt || 120;
  const targetPct = Math.min(100, Math.round((avgTytNet / targetTyt) * 100));
  const aytExams = sortedExams.filter(e => e.examType === 'AYT' || e.examType === 'YKS').slice(0, 3);
  const avgAytNet = aytExams.length > 0 ? (aytExams.reduce((acc, curr) => acc + getExamNet(curr, 'AYT'), 0) / aytExams.length) : 0;
  const targetAyt = studentProfile?.targetAyt || 80;
  const targetAytPct = Math.min(100, Math.round((avgAytNet / targetAyt) * 100));

  const latestTytRaw = sortedExams.find(e => e.examType === 'TYT' || e.examType === 'YKS');
  const latestAytRaw = sortedExams.find(e => e.examType === 'AYT' || e.examType === 'YKS');
  const latestYdtRaw = sortedExams.find(e => e.examType === 'YDT' || e.examType === 'YKS');
  
  const studentField = studentProfile?.field || ''; 
  const isLanguageStudent = studentField.toLowerCase().includes('dil') || studentField === 'DİL' || studentField === 'YDT';
  
  const latestSecondRaw = isLanguageStudent ? (latestYdtRaw || latestAytRaw) : (latestAytRaw || latestYdtRaw);
  
  const latestTytNet = getExamNet(latestTytRaw, 'TYT');
  const latestSecondType = isLanguageStudent ? (latestYdtRaw ? 'YDT' : 'AYT') : (latestAytRaw ? 'AYT' : 'YDT');
  const latestSecondNet = getExamNet(latestSecondRaw, latestSecondType);
  
  const totalYksNet = (latestTytNet + latestSecondNet).toFixed(2);
  
  const displayExams = [];
  if (latestTytRaw) {
    displayExams.push({
      examType: 'TYT',
      title: latestTytRaw.examType === 'YKS' ? `${latestTytRaw.title || 'YKS Denemesi'} (TYT)` : (latestTytRaw.title || 'TYT Denemesi'),
      date: latestTytRaw.date,
      totalNet: latestTytNet.toFixed(2),
      rank: latestTytRaw.rank
    });
  }
  
  if (latestSecondRaw && (latestSecondRaw !== latestTytRaw || latestSecondNet > 0)) {
    displayExams.push({
      examType: latestSecondType,
      title: latestSecondRaw.examType === 'YKS' ? `${latestSecondRaw.title || 'YKS Denemesi'} (${latestSecondType})` : (latestSecondRaw.title || `${latestSecondType} Denemesi`),
      date: latestSecondRaw.date,
      totalNet: latestSecondNet.toFixed(2),
      rank: latestSecondRaw.rank
    });
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-6 lg:p-8 animate-in fade-in duration-700">
      <NotificationPrompt />
      {(pendingResultsCount > 0 || expiredWaitingCount > 0) && (
        <div className="space-y-2">
          {pendingResultsCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
              <AlertTriangle className="text-amber-400 shrink-0" size={18} />
              <div className="text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wide mr-2">Sonuç Bekleyen Denemeler ({pendingResultsCount}):</span>
                <span className="text-slate-300">Öğrencinin henüz sonuç açıklanmamış/girilmemiş deneme görevleri bulunuyor.</span>
              </div>
            </div>
          )}
          {expiredWaitingCount > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center gap-3">
              <AlertTriangle className="text-red-400 shrink-0" size={18} />
              <div className="text-xs">
                <span className="font-bold text-red-400 uppercase tracking-wide mr-2">5 Günü Geçen Bekleyen Görevler ({expiredWaitingCount}):</span>
                <span className="text-slate-300">5 gün içerisinde sonucu girilmeyen denemeler yapılmadı olarak işaretlenmiştir.</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Premium Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-[32px] p-8 md:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Zap size={12} className="fill-blue-400/30" />
              Genel Durum Özeti
            </div>
            
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase italic leading-tight">
                {studentProfile?.firstName || 'Öğrenci'} {studentProfile?.lastName || ''}
              </h1>
              <p className="text-slate-400 font-medium text-sm md:text-base mt-2 flex items-center gap-2">
                <Target size={16} className="text-indigo-400" />
                Hedef: <span className="text-white font-bold">{studentProfile?.targetUniversity || 'Üniversite Belirtilmedi'} - {studentProfile?.targetDepartment || 'Bölüm'}</span>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
          {/* Target Progress Circular/Bar */}
          <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl min-w-[280px] w-full md:w-auto backdrop-blur-xl">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">TYT Hedef İlerlemesi</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">{avgTytNet.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-500">/ {targetTyt} Net</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-black text-lg px-3 py-1 rounded-xl">
                  %{targetPct}
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${targetPct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              />
            </div>
          </div>
          <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl min-w-[280px] w-full md:w-auto backdrop-blur-xl">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">AYT Hedef İlerlemesi</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">{avgAytNet.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-500">/ {targetAyt} Net</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-black text-lg px-3 py-1 rounded-xl">
                  %{targetAytPct}
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${targetAytPct}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px] relative overflow-hidden group hover:border-blue-500/30 transition-colors"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full group-hover:bg-blue-500/10 transition-colors" />
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 w-fit mb-4 relative z-10">
            <BookOpen size={20} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Haftalık Soru Çözümü</p>
          <div className="flex items-end gap-2 relative z-10">
             <h3 className="text-2xl font-black text-white tabular-nums">{weeklyStats.solvedQuestions}<span className="text-sm text-slate-500">/{weeklyStats.targetQuestions}</span></h3>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-4 overflow-hidden relative z-10">
             <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.min(100, qPct)}%` }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px] relative overflow-hidden group hover:border-emerald-500/30 transition-colors"
        >
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full group-hover:bg-emerald-500/10 transition-colors" />
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit mb-4 relative z-10">
            <CheckCircle2 size={20} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">Tamamlanan Görevler</p>
          <div className="flex items-end gap-2 relative z-10">
             <h3 className="text-2xl font-black text-white tabular-nums">{weeklyStats.completedTasks}<span className="text-sm text-slate-500">/{weeklyStats.totalTasks}</span></h3>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full mt-4 overflow-hidden relative z-10">
             <div className="bg-emerald-500 h-full transition-all" style={{ width: `${Math.min(100, tPct)}%` }} />
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-slate-900/40 border border-white/5 p-6 rounded-[24px] relative overflow-hidden group hover:border-amber-500/30 transition-colors lg:col-span-2 flex flex-col justify-between"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full group-hover:bg-amber-500/10 transition-colors" />
          
          <div className="flex justify-between items-start relative z-10">
            <div>
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 w-fit mb-4">
                <Award size={20} />
              </div>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Koç Geri Bildirimi</p>
            </div>
            {feedbacks.length > 0 && (
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg">
                <Clock size={10} /> {new Date(feedbacks[0].date).toLocaleDateString('tr-TR')}
              </span>
            )}
          </div>
          
          <div className="relative z-10 mt-2">
            {feedbacks.length > 0 ? (
              <p className="text-sm text-slate-300 font-medium leading-relaxed line-clamp-2">
                "{feedbacks[0].notes || 'Haftalık değerlendirme notu bulunmuyor.'}"
              </p>
            ) : (
              <p className="text-sm text-slate-500 italic">Henüz koç değerlendirmesi girilmemiş.</p>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Recent Exams List */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-[32px] p-6 md:p-8 flex flex-col">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-400" /> Son Sınav Sonuçları
            </h3>
            <Link to="/panel/veli/deneme-sonuclari" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>
          
          <div className="flex-1">
            {displayExams.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {/* Total YKS Summary Card */}
                  {latestTytRaw && latestSecondRaw && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 md:p-5 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-2xl group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center font-black text-indigo-400 border border-indigo-500/30">
                          YKS
                        </div>
                        <div>
                            <h4 className="text-sm md:text-base font-bold text-white">Toplam YKS Neti</h4>
                            <p className="text-[10px] text-indigo-300/70 font-bold uppercase tracking-wide mt-1">
                                Son TYT ve {latestSecondType} Toplamı
                            </p>
                        </div>
                      </div>
                      <div className="text-right">
                          <p className="text-lg font-black text-indigo-400">{totalYksNet} <span className="text-[10px] text-indigo-500 uppercase tracking-widest font-bold">Net</span></p>
                      </div>
                    </motion.div>
                  )}

                  {/* Individual Exams */}
                  <div className="grid gap-4 mt-2">
                  {displayExams.map((exam, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-4 md:p-5 bg-slate-950/50 border border-white/5 rounded-2xl hover:border-white/10 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-slate-400 border border-white/5 group-hover:bg-slate-700 transition-colors">
                            {exam.examType || 'TYT'}
                          </div>
                          <div>
                              <h4 className="text-sm md:text-base font-bold text-white">{exam.title || exam.examType + ' Denemesi'}</h4>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">
                                  {exam.date ? new Date(exam.date).toLocaleDateString('tr-TR') : 'Tarih Yok'}
                              </p>
                          </div>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-black text-white">{exam.totalNet || 0} <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Net</span></p>
                            {exam.rank && <p className="text-[10px] text-slate-400 font-bold mt-1">Sıralama: <span className="text-slate-300">{exam.rank}</span></p>}
                        </div>
                      </motion.div>
                  ))}
                  </div>
                </div>
            ) : (
                <div className="h-full flex flex-col items-center justify-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                    <AlertCircle className="w-8 h-8 text-slate-500 mb-3" />
                    <p className="text-slate-400 font-medium text-sm">Henüz sınav sonucu eklenmemiş.</p>
                </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Info Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-8 text-white flex flex-col relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex-1">
            <h3 className="text-xl font-black tracking-tight uppercase italic mb-2">Veli Asistanı</h3>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed mb-6">
              Öğrencinizin gelişimi hakkında daha detaylı bilgi almak, sınav analizlerini incelemek ve yapay zeka destekli tavsiyeler almak için Veli Asistanı ile görüşün.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <Target size={16} className="text-white" />
                </div>
                <p className="text-xs font-medium">Hedef analizleri ve tavsiyeler</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                  <BookOpen size={16} className="text-white" />
                </div>
                <p className="text-xs font-medium">Günlük görev takibi</p>
              </div>
            </div>
          </div>
          
          <Link 
            to="/panel/veli/asistan" 
            className="mt-8 relative z-10 w-full py-4 bg-white text-indigo-600 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors shadow-lg"
          >
            Asistana Sor <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

