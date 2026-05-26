import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  TrendingUp, 
  Target,
  ChevronRight,
  Sparkles,
  BrainCircuit,
  BarChart3,
  Calendar,
  CheckCircle2,
  PieChart,
  Activity,
  History,
  AlertCircle,
  Trophy,
  Zap,
  Quote
} from 'lucide-react';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { Link } from 'react-router-dom';

export default function StudentSummary() {
  const { selectedStudent } = useStudent();
  const [books, setBooks] = useState<any[]>([]);
  const [program, setProgram] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [dailyPrograms, setDailyPrograms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyGoal, setMonthlyGoal] = useState<any>(null);

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (selectedStudent) {
      setLoading(true);
      Promise.all([
        studentDataService.getBookTracking(selectedStudent.uid),
        studentDataService.getWeeklyPrograms(selectedStudent.uid),
        studentDataService.getWeeklyReports(selectedStudent.uid),
        studentDataService.getAllDailyPrograms(selectedStudent.uid),
        studentDataService.getExamResults(selectedStudent.uid),
        studentDataService.getMonthlyGoal(selectedStudent.uid, currentMonthStr)
      ]).then(([booksData, programData, reportsData, dailyProgramsData, examsData, monthlyGoalData]) => {
        setBooks(booksData);
        setProgram(programData[0] || null);
        setReports(reportsData);
        setDailyPrograms(dailyProgramsData);
        setExams(examsData);
        setMonthlyGoal(monthlyGoalData);
        setLoading(false);
      });
    }
  }, [selectedStudent, currentMonthStr]);

  // Goal Progress Calculations
  const topicGoalsCount = monthlyGoal?.topicGoals?.length || 0;
  const completedTopicGoals = monthlyGoal?.topicGoals?.filter((t: any) => t.isCompleted)?.length || 0;
  const topicProgress = topicGoalsCount > 0 ? Math.round((completedTopicGoals / topicGoalsCount) * 100) : 0;

  const bookGoalsCount = monthlyGoal?.bookGoals?.length || 0;
  const avgBookProgress = bookGoalsCount > 0 
    ? Math.round(monthlyGoal.bookGoals.reduce((acc: number, b: any) => acc + (b.progress || 0), 0) / bookGoalsCount)
    : 0;

  // Daily Programs Statistics Calculations
  const statsFromPrograms = useMemo(() => {
    let globalSolved = 0;
    let globalTarget = 0;
    let globalTaskDone = 0;
    let globalTaskNotDone = 0;
    let globalUnsolved = 0;
    let firstDate: Date | null = null;
    
    // Group programs by week
    const weeklyData: Record<string, { target: number, solved: number, unsolved: number, taskDone: number, taskNotDone: number, earnedPoints: number, targetPoints: number }> = {};

    dailyPrograms.forEach(dp => {
      const dpParts = dp.date.split('-');
      const dpDate = new Date(Date.UTC(Number(dpParts[0]), Number(dpParts[1]) - 1, Number(dpParts[2])));
      if (!firstDate || dpDate < firstDate) firstDate = dpDate;
      
      // Calculate start of week (Monday) in UTC
      const day = dpDate.getUTCDay();
      const diff = dpDate.getUTCDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(Date.UTC(dpDate.getUTCFullYear(), dpDate.getUTCMonth(), diff)).toISOString().split('T')[0];

      if (!weeklyData[weekStart]) {
        weeklyData[weekStart] = { target: 0, solved: 0, unsolved: 0, taskDone: 0, taskNotDone: 0, earnedPoints: 0, targetPoints: 0 };
      }

      const weekStats = weeklyData[weekStart];

      if (dp.tasks) {
        dp.tasks.forEach((task: any) => {
          let isQuestion = task.type === 'Soru Çözümü';

          if (isQuestion) {
            let solved = 0;
            let target = 0;
            if (!task.isExtra) {
              target = Number(task.targetCount) || 0;
              solved = task.isDone ? Math.max(target, Number(task.completedCount) || 0) : (Number(task.completedCount) || 0);
              weekStats.target += target;
              globalTarget += target;
              
              const taskUnsolved = Math.max(0, target - solved);
              weekStats.unsolved += taskUnsolved;
              globalUnsolved += taskUnsolved;
            } else {
              solved = Number(task.completedCount) || 0;
            }
            
            weekStats.solved += solved;
            globalSolved += solved;

            weekStats.targetPoints += target;
            weekStats.earnedPoints += Math.min(solved, target); 
            if(task.isExtra) {
              weekStats.earnedPoints += solved;
            }
          } else {
            if (!task.isExtra) {
               if (task.isDone) {
                 weekStats.taskDone += 1;
                 globalTaskDone += 1;
               } else {
                 weekStats.taskNotDone += 1;
                 globalTaskNotDone += 1;
               }
               // Target point based on weight (simplified)
               let point = task.type === 'Konu Çalışması' || task.type?.includes('Video') ? 2 : 1;
               weekStats.targetPoints += point;
               if (task.isDone) weekStats.earnedPoints += point;
            } else {
               if (task.isDone) {
                  weekStats.taskDone += 1;
                  globalTaskDone += 1;
                  let point = task.type === 'Konu Çalışması' || task.type?.includes('Video') ? 2 : 1;
                  weekStats.earnedPoints += point;
               }
            }
          }
        });
      }
    });

    let weekCount = 1;
    const startDate = selectedStudent?.createdAt ? new Date(selectedStudent.createdAt.seconds ? selectedStudent.createdAt.seconds * 1000 : selectedStudent.createdAt) : firstDate;
    if (startDate && !isNaN(startDate.getTime())) {
      const diffMs = new Date().getTime() - startDate.getTime();
      weekCount = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 7)));
    }

    // Weekly Averages from data
    const weeksList = Object.values(weeklyData);
    const overallAvgCompletion = weeksList.length > 0 
      ? Math.round((weeksList.reduce((acc, w) => acc + (w.targetPoints > 0 ? (w.earnedPoints / w.targetPoints) : (w.earnedPoints > 0 ? 1 : 0)), 0) / weeksList.length) * 100)
      : 0;

    // Sort weeks descending to get last 4
    const sortedWeeks = Object.keys(weeklyData).sort((a, b) => b.localeCompare(a)).slice(0, 4);
    const last4AvgCompletion = sortedWeeks.length > 0
      ? Math.round((sortedWeeks.reduce((acc, wStart) => {
          const w = weeklyData[wStart];
          return acc + (w.targetPoints > 0 ? (w.earnedPoints / w.targetPoints) : (w.earnedPoints > 0 ? 1 : 0));
        }, 0) / sortedWeeks.length) * 100)
      : 0;

    const weeklyReportsArray = Object.keys(weeklyData).sort((a, b) => b.localeCompare(a)).map(weekStart => {
      const w = weeklyData[weekStart];
      const wParts = weekStart.split('-');
      const d = new Date(Date.UTC(Number(wParts[0]), Number(wParts[1]) - 1, Number(wParts[2])));
      
      const startStr = `${d.getUTCDate().toString().padStart(2, '0')}.${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      d.setUTCDate(d.getUTCDate() + 6);
      const endStr = `${d.getUTCDate().toString().padStart(2, '0')}.${(d.getUTCMonth() + 1).toString().padStart(2, '0')}`;
      const successPercentage = w.targetPoints > 0 ? Math.round((w.earnedPoints / w.targetPoints) * 100) : (w.earnedPoints > 0 ? 100 : 0);

      return {
        date: `${startStr} - ${endStr}`,
        weekNumber: '', 
        solvedCount: w.solved,
        unsolvedCount: w.unsolved,
        taskDone: w.taskDone,
        taskNotDone: w.taskNotDone,
        successPercentage: Math.min(successPercentage, 100)
      };
    });

    return {
      totalSolved: globalSolved,
      totalUnsolved: globalUnsolved,
      avgSolved: Math.round(globalSolved / weekCount),
      avgUnsolved: Math.round(globalUnsolved / weekCount),
      overallAvgCompletion: Math.min(overallAvgCompletion, 100),
      last4AvgCompletion: Math.min(last4AvgCompletion, 100),
      derivedWeeklyReports: weeklyReportsArray
    };
  }, [dailyPrograms, selectedStudent]);

  const { totalSolved, totalUnsolved, avgSolved, avgUnsolved, overallAvgCompletion, last4AvgCompletion, derivedWeeklyReports } = statsFromPrograms;

  // Exam Average Calculations (Latest up to 4)
  const getExamAverages = (type: string, subjects: Record<string, string[]>) => {
    // Sort exams by date descending to get the latest ones
    const relevantExams = exams
      .filter(e => e.examType === type || e.examType === 'YKS')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);

    if (relevantExams.length === 0) return null;

    const avgs: any = {};
    
    Object.keys(subjects).forEach(sub => {
      const keysToSum = subjects[sub];
      const sum = relevantExams.reduce((acc, e) => {
        let eSum = 0;
        keysToSum.forEach(k => {
          let score = 0;
          if (e.examType === 'YKS') {
            const yksKey = `${type} ${k}`;
            if (e.scores?.[yksKey]) score = parseFloat(e.scores[yksKey].n) || 0;
            else if (e.scores?.[k]) score = parseFloat(e.scores[k].n) || 0;
          } else {
            if (e.scores?.[k]) score = parseFloat(e.scores[k].n) || 0;
          }
          eSum += score;
        });
        return acc + eSum;
      }, 0);
      avgs[sub] = (sum / relevantExams.length).toFixed(2);
    });

    avgs.totalNet = (relevantExams.reduce((acc, e) => {
      if (e.examType === 'YKS') {
        // Estimate total net for the sub-type if it's YKS, this is an approximation, better to use exact sum.
        let subTypeSum = 0;
        Object.keys(subjects).forEach(sub => {
          subjects[sub].forEach(k => {
             const yksKey = `${type} ${k}`;
             if (e.scores?.[yksKey]) subTypeSum += parseFloat(e.scores[yksKey].n) || 0;
             else if (e.scores?.[k]) subTypeSum += parseFloat(e.scores[k].n) || 0;
          });
        });
        return acc + subTypeSum;
      }
      return acc + (e.totalNet || 0);
    }, 0) / relevantExams.length).toFixed(2);
    
    avgs.percentile = (relevantExams.reduce((acc, e) => acc + (e.percentile || 0), 0) / relevantExams.length).toFixed(2);

    return avgs;
  };

  const tytAvgs = getExamAverages('TYT', {
    'Türkçe': ['Türkçe'],
    'Matematik': ['Matematik', 'Geometri'],
    'Fen Bilimleri': ['Fizik', 'Kimya', 'Biyoloji'],
    'Sosyal Bilimler': ['Tarih', 'Coğrafya', 'Felsefe', 'Din']
  });
  
  const aytAvgs = getExamAverages('AYT', {
    'Sos-1': ['Edebiyat', 'Tarih-1', 'Coğrafya-1'],
    'Sos-2': ['Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Din (Seçmeli)'],
    'Matematik': ['Matematik', 'Geometri'],
    'Fen Bilimleri': ['Fizik', 'Kimya', 'Biyoloji'],
    'Dil': ['Yabancı Dil']
  });

  const quickStats = [
    { 
      label: 'Toplam Yapılan', 
      value: totalSolved.toLocaleString(), 
      icon: CheckCircle2, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10' 
    },
    { 
      label: 'Eksik Soru Sayısı', 
      value: totalUnsolved.toLocaleString(), 
      icon: History, 
      color: 'text-red-400', 
      bg: 'bg-red-400/10' 
    },
    { 
      label: 'Ortalama Yapılan', 
      value: avgSolved.toLocaleString(), 
      icon: TrendingUp, 
      color: 'text-blue-400', 
      bg: 'bg-blue-400/10' 
    },
    { 
      label: 'Ortalama Yapılmayan', 
      value: avgUnsolved.toLocaleString(), 
      icon: AlertCircle, 
      color: 'text-amber-400', 
      bg: 'bg-amber-400/10' 
    },
    { 
      label: 'Ortalama Program Bitirme', 
      value: `%${overallAvgCompletion}`, 
      icon: PieChart, 
      color: 'text-indigo-400', 
      bg: 'bg-indigo-400/10' 
    },
    { 
      label: 'Son 4 Hafta Ortalaması', 
      value: `%${last4AvgCompletion}`, 
      icon: Activity, 
      color: 'text-fuchsia-400', 
      bg: 'bg-fuchsia-400/10' 
    }
  ];

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold italic animate-pulse">Veriler Yükleniyor...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Student ID Card & Target Progress */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ID Card */}
        <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-600/10 to-transparent blur-3xl -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
          <div className="relative flex flex-col md:flex-row gap-10">
            {/* Photo & Basic Info */}
            <div className="space-y-6 shrink-0 text-center md:text-left">
              <div className="relative inline-block group/photo">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-[32px] blur opacity-25 group-hover/photo:opacity-50 transition duration-500" />
                <div className="relative w-32 h-32 rounded-[30px] overflow-hidden border-2 border-white/10 bg-slate-800">
                  <img src={selectedStudent?.photoURL || `https://ui-avatars.com/api/?name=${selectedStudent?.displayName}&background=070b14&color=fff&size=128&bold=true`} alt={selectedStudent?.displayName} className="w-full h-full object-cover" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedStudent?.displayName}</h2>
                <div className="flex items-center gap-2 mt-3 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded-lg border border-blue-500/20 uppercase tracking-widest">{selectedStudent?.grade || 'Sınıf Belirtilmedi'}</span>
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-lg border border-indigo-500/20 uppercase tracking-widest">{selectedStudent?.branch || 'Alan Belirtilmedi'}</span>
                </div>
              </div>
            </div>

            {/* Target Details */}
            <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-6 pt-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Target size={12} className="text-blue-500" /> Hedef Üniversite / Bölüm
                </p>
                <p className="text-sm font-bold text-slate-200 uppercase truncate">{selectedStudent?.targetDepartment || 'Belirtilmedi'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Trophy size={12} className="text-amber-500" /> Mevcut Başarı Puanı
                </p>
                <p className="text-sm font-bold text-white uppercase italic">478.250</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">TYT Net Hedefi</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white italic leading-none">{selectedStudent?.targetTyt || 0}</span>
                  <span className="text-[10px] font-bold text-slate-500 pb-1 italic">/ 120 Net</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">AYT Net Hedefi</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white italic leading-none">{selectedStudent?.targetAyt || 0}</span>
                  <span className="text-[10px] font-bold text-slate-500 pb-1 italic">/ 80 Net</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Target Progress Bars */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 flex flex-col justify-between">
           <div className="space-y-6">
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aylık Konu Tamamlama</span>
                    <span className="text-xs font-black text-emerald-400 italic">%{topicProgress}</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${topicProgress}%` }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    />
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aylık Kitap Bitirme</span>
                    <span className="text-xs font-black text-amber-400 italic">%{avgBookProgress}</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${avgBookProgress}%` }}
                      className="h-full bg-gradient-to-r from-amber-600 to-orange-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    />
                 </div>
              </div>
              <div className="space-y-3">
                 <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TYT Hedef Yakınlığı</span>
                    <span className="text-xs font-black text-blue-400 italic">%{Math.round((parseFloat(tytAvgs?.totalNet) / (selectedStudent?.targetTyt || 120)) * 100) || 0}</span>
                 </div>
                 <div className="h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (parseFloat(tytAvgs?.totalNet) / (selectedStudent?.targetTyt || 120)) * 100) || 0}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                    />
                 </div>
              </div>
           </div>
           <div className="mt-8 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                 <Sparkles size={20} />
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                "Ulaşılacak hiçbir yer yoktur ki, büyük adımlarla gidilsin."
              </p>
           </div>
        </div>
      </div>

      {/* Question Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[24px] p-5 relative overflow-hidden group hover:border-white/10 hover:bg-slate-800/80 transition-all shadow-xl shadow-black/20"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rotate-[30deg] translate-x-12 -translate-y-12 group-hover:scale-110 group-hover:rotate-[45deg] transition-transform duration-700 pointer-events-none" />
             <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className={`${stat.bg} ${stat.color} w-10 h-10 rounded-[14px] flex items-center justify-center shadow-lg shadow-black/20 shrink-0`}>
                   <stat.icon size={18} strokeWidth={2.5} />
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 mb-1 leading-snug line-clamp-2 h-7">{stat.label}</p>
             <div className="flex items-end gap-2 relative z-10">
                <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
             </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* TYT Stat Table */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <BarChart3 className="text-blue-500" /> TYT Son 4 Deneme Ortalamaları
           </h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                       <th className="pb-4">Branş</th>
                       <th className="pb-4 text-center">Ortalama Net</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      { label: 'Türkçe', value: tytAvgs?.Türkçe },
                      { label: 'Matematik', value: tytAvgs?.Matematik },
                      { label: 'Fen Bilimleri', value: tytAvgs?.['Fen Bilimleri'] },
                      { label: 'Sosyal Bilimler', value: tytAvgs?.['Sosyal Bilimler'] },
                      { label: 'Toplam Net', value: tytAvgs?.totalNet, highlight: true },
                      { label: 'Sıralama (%)', value: tytAvgs?.percentile ? `%${tytAvgs.percentile}` : '-', highlight: true },
                    ].map((row, i) => (
                      <tr key={i} className={`group hover:bg-white/[0.02] ${row.highlight ? 'bg-blue-500/5' : ''}`}>
                         <td className={`py-4 font-bold ${row.highlight ? 'text-blue-400' : 'text-slate-400'}`}>{row.label}</td>
                         <td className={`py-4 text-center font-black ${row.highlight ? 'text-white' : 'text-slate-200'}`}>{row.value || '0.00'}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>

        {/* AYT Stat Table */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
           <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <BarChart3 className="text-indigo-500" /> AYT Son 4 Deneme Ortalamaları
           </h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                       <th className="pb-4">Branş</th>
                       <th className="pb-4 text-center">Ortalama Net</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5 text-sm">
                    {[
                      { label: 'Matematik', value: aytAvgs?.Matematik },
                      { label: 'Fen Bilimleri', value: aytAvgs?.['Fen Bilimleri'] },
                      { label: 'Edebiyat-Sos 1', value: aytAvgs?.['Sos-1'] },
                      { label: 'Sosyal 2', value: aytAvgs?.['Sos-2'] },
                      { label: 'Yabancı Dil', value: aytAvgs?.Dil },
                    ].map((row, i) => (
                      <tr key={i} className="group hover:bg-white/[0.02]">
                         <td className="py-4 font-bold text-slate-400">{row.label}</td>
                         <td className="py-4 text-center font-black text-slate-200">{row.value || '0.00'}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                  { 
                    label: 'SAY', 
                    value: (parseFloat(aytAvgs?.Matematik || '0') + parseFloat(aytAvgs?.['Fen Bilimleri'] || '0')).toFixed(2), 
                    isActive: selectedStudent?.branch === 'SAYISAL' || selectedStudent?.branch === 'SAY' 
                  },
                  { 
                    label: 'EA', 
                    value: (parseFloat(aytAvgs?.Matematik || '0') + parseFloat(aytAvgs?.['Sos-1'] || '0')).toFixed(2), 
                    isActive: selectedStudent?.branch === 'EŞİT AĞIRLIK' || selectedStudent?.branch === 'EA' 
                  },
                  { 
                    label: 'SÖZ', 
                    value: (parseFloat(aytAvgs?.['Sos-1'] || '0') + parseFloat(aytAvgs?.['Sos-2'] || '0')).toFixed(2), 
                    isActive: selectedStudent?.branch === 'SÖZEL' || selectedStudent?.branch === 'SÖZ' 
                  },
                  { 
                    label: 'DİL', 
                    value: (parseFloat(aytAvgs?.Dil || '0')).toFixed(2), 
                    isActive: selectedStudent?.branch === 'DİL' || selectedStudent?.branch === 'DIL' 
                  },
              ].map((box, i) => (
                <div key={i} className={`rounded-2xl p-4 flex flex-col justify-center items-center gap-1 border transition-all ${box.isActive ? 'bg-indigo-500/20 border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'}`}>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${box.isActive ? 'text-indigo-400' : 'text-slate-500'}`}>AYT {box.label}</span>
                    <span className={`text-xl font-black ${box.isActive ? 'text-white' : 'text-slate-300'}`}>{box.value}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Monthly Assessment & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coach Note */}
        <div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                 <Quote className="text-purple-500" /> Koçun Notu (Bu Ay)
              </h3>
           </div>
           <div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5 relative">
              <Sparkles size={24} className="absolute -top-3 -right-3 text-purple-500/50" />
              {monthlyGoal?.coachNote ? (
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{monthlyGoal.coachNote}"
                </p>
              ) : (
                <p className="text-sm text-slate-500 leading-relaxed italic text-center py-10">
                  Bu ay için henüz bir değerlendirme notu girilmemiş.
                </p>
              )}
           </div>
           <Link to="hedefler" className="mt-6 text-[10px] font-black text-purple-400 hover:text-purple-300 uppercase tracking-widest flex items-center justify-center gap-1 transition-colors bg-white/5 py-3 rounded-xl border border-white/5">
              Notu Düzenle <ChevronRight size={14} />
           </Link>
        </div>

        {/* Weekly Reports Table */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-8">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-xl font-bold flex items-center gap-3">
              <History className="text-emerald-500" /> Haftalık Performans Özeti
           </h3>
           <Link to="program" className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-1 transition-colors">
              Programa Git <ChevronRight size={14} />
           </Link>
        </div>
        
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <th className="pb-4 px-4">Tarih</th>
                    <th className="pb-4 px-4 text-center">Çözülen Soru</th>
                    <th className="pb-4 px-4 text-center">Eksik Soru</th>
                    <th className="pb-4 px-4 text-center">Biten Görev</th>
                    <th className="pb-4 px-4 text-center">Eksik Görev</th>
                    <th className="pb-4 px-4 text-center">Başarı Oranı</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                 {derivedWeeklyReports.map((report, i) => (
                    <tr key={i} className="group hover:bg-white/[0.02]">
                       <td className="py-4 px-4">
                          <span className="font-bold text-slate-300 block">{report.date}</span>
                          
                       </td>
                       <td className="py-4 px-4 text-center font-black text-emerald-400">{report.solvedCount || 0}</td>
                       <td className="py-4 px-4 text-center font-black text-red-400">{report.unsolvedCount || 0}</td>
                       <td className="py-4 px-4 text-center font-black text-emerald-400">{report.taskDone || 0}</td>
                       <td className="py-4 px-4 text-center font-black text-red-400">{report.taskNotDone || 0}</td>
                       <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                             <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                                <div className="h-full bg-emerald-500" style={{ width: `${report.successPercentage}%` }} />
                             </div>
                             <span className="font-black text-white">%{report.successPercentage || 0}</span>
                          </div>
                       </td>
                    </tr>
                 ))}
                 {derivedWeeklyReports.length === 0 && (
                    <tr>
                       <td colSpan={6} className="py-20 text-center text-slate-600 italic">Henüz program verisi bulunmuyor.</td>
                    </tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  </div>
);
}
