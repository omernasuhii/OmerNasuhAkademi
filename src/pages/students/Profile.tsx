import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { GraduationCap, Target, Save, Loader2, Check, BrainCircuit, AlertTriangle, TrendingUp, Compass, Zap, Activity, Clock, BarChart3, ChevronRight, Flame, ShieldAlert, Sparkles, BookOpen, Brain, Snowflake, Flower, Dumbbell, Star, ArrowRight, Lightbulb, Users, Fingerprint, Layers, ShieldCheck } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { studentDataService } from '../../services/studentDataService';
import { analysisService } from '../../services/analysisService';

const safeGetTime = (dateVal: any) => {
  if (!dateVal) return 0;
  if (dateVal.toDate && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().getTime();
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export default function Profile() {
  const { userData, user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'kisilik' | 'akademik'>('kisilik');

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [examData, setExamData] = useState<any[]>([]);
  const [analysisData, setAnalysisData] = useState<any[]>([]);

  const [academicInfo, setAcademicInfo] = useState({
    grade: '',
    branch: '',
    ydtLanguage: '',
    targetUniversity: '',
    targetDepartment: '',
    targetTyt: '',
    targetAyt: ''
  });

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const [exams, analyses] = await Promise.all([
          studentDataService.getExamResults(user.uid),
          analysisService.getResults(user.uid)
        ]);
        setExamData(exams || []);
        setAnalysisData((analyses || []).filter((a: any) => !['PARENT_REPORT', 'COACH_REPORT'].includes(a.analysisType)));
      } catch (err) {
        console.error("Data fetch error", err);
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, [user]);

  useEffect(() => {
    if (userData) {
      setAcademicInfo({
        grade: userData.grade || '',
        branch: userData.branch || '',
        ydtLanguage: userData.ydtLanguage || '',
        targetUniversity: userData.targetUniversity || '',
        targetDepartment: userData.targetDepartment || '',
        targetTyt: userData.targetTyt?.toString() || '',
        targetAyt: userData.targetAyt?.toString() || ''
      });
    }
  }, [userData]);

  if (!userData) return null;

  // --- Real Data Bindings ---
  
  // VAK-S Analysis (Öğrenme Stili)
  const vakAnalysis = analysisData.find(a => a.analysisType === 'VAK-S')?.data?.results;
  const vakData = vakAnalysis ? [
    { name: 'Görsel', value: vakAnalysis.counts?.G || 0, color: '#3b82f6' },
    { name: 'İşitsel', value: vakAnalysis.counts?.İ || 0, color: '#8b5cf6' },
    { name: 'Kinestetik', value: vakAnalysis.counts?.K || 0, color: '#10b981' }
  ] : [
    { name: 'Görsel', value: 0, color: '#3b82f6' },
    { name: 'İşitsel', value: 0, color: '#8b5cf6' },
    { name: 'Kinestetik', value: 0, color: '#10b981' }
  ];

  // ÇZ-8 Analysis (Çoklu Zeka)
  const cz8Analysis = analysisData.find(a => a.analysisType === 'ÇZ-8')?.data?.scores;
  const intelligenceData = cz8Analysis ? [
    { name: 'Sözel', value: cz8Analysis.S || 0, color: '#8b5cf6' },
    { name: 'Mantıksal', value: cz8Analysis.M || 0, color: '#3b82f6' },
    { name: 'Görsel', value: cz8Analysis.G || 0, color: '#10b981' },
    { name: 'Müziksel', value: cz8Analysis.R || 0, color: '#ec4899' },
    { name: 'Bedensel', value: cz8Analysis.B || 0, color: '#f59e0b' },
    { name: 'Sosyal', value: cz8Analysis.K || 0, color: '#14b8a6' },
    { name: 'İçsel', value: cz8Analysis.I || 0, color: '#6366f1' },
    { name: 'Doğa', value: cz8Analysis.D || 0, color: '#84cc16' }
  ] : [
    { name: 'Sözel', value: 0, color: '#8b5cf6' },
    { name: 'Mantıksal', value: 0, color: '#3b82f6' },
    { name: 'Görsel', value: 0, color: '#10b981' },
    { name: 'Müziksel', value: 0, color: '#ec4899' },
    { name: 'Bedensel', value: 0, color: '#f59e0b' },
    { name: 'Sosyal', value: 0, color: '#14b8a6' },
    { name: 'İçsel', value: 0, color: '#6366f1' },
    { name: 'Doğa', value: 0, color: '#84cc16' }
  ];

  // Additional Analyses for Radar
  const cdoeAnalysis = analysisData.find(a => a.analysisType === 'ÇDÖ-E')?.data?.scores;
  const spbeAnalysis = analysisData.find(a => a.analysisType === 'SP-BE')?.data?.results;
  const agMotAnalysis = analysisData.find(a => a.analysisType === 'AG-MOT')?.data?.scores;

  // Personality Radar Mapping
  const radarDataPersonality = [
    { trait: 'Analitik Düşünce', score: cz8Analysis?.M ? (cz8Analysis.M * 10) : 65, fullMark: 100 },
    { trait: 'Stres Yönetimi', score: spbeAnalysis?.dominantType === 'Halterci' ? 90 : (spbeAnalysis?.dominantType === 'Volkan' ? 40 : 70), fullMark: 100 },
    { trait: 'Öz Disiplin', score: cdoeAnalysis?.discipline ? (cdoeAnalysis.discipline / 40 * 100) : 60, fullMark: 100 },
    { trait: 'Odak Süresi', score: cdoeAnalysis?.continuity ? (cdoeAnalysis.continuity / 40 * 100) : 60, fullMark: 100 },
    { trait: 'Motivasyon', score: agMotAnalysis?.motivation ? agMotAnalysis.motivation : 75, fullMark: 100 },
    { trait: 'Planlama', score: cdoeAnalysis?.planning ? (cdoeAnalysis.planning / 40 * 100) : 55, fullMark: 100 },
  ];

  // Exams Data Processing
  const sortedTytExams = examData.filter(e => e.examType === 'TYT' || e.examType === 'YKS').sort((a,b) => safeGetTime(a.date) - safeGetTime(b.date));
  const lastTyt = sortedTytExams.length > 0 ? sortedTytExams[sortedTytExams.length - 1] : null;

  const getPercentage = (scoreObj: any, max: number) => {
    const val = scoreObj?.n || 0;
    return parseFloat(Math.max(0, (val / max) * 100).toFixed(1));
  };

  const getTytMetric = (subjectKey: string) => {
    if (!lastTyt || !lastTyt.scores) return { n: 0 };
    if (lastTyt.examType === 'YKS') {
       return lastTyt.scores[`TYT ${subjectKey}`] || { n: 0 };
    }
    if (subjectKey === 'Matematik' && lastTyt.scores['Temel Matematik (TYT)']) {
       return lastTyt.scores['Temel Matematik (TYT)'];
    }
    return lastTyt.scores[subjectKey] || lastTyt.scores[`${subjectKey} (TYT)`] || { n: 0 };
  };

  const getPercentageNumber = (n: number, max: number) => {
    return parseFloat(Math.max(0, (n / max) * 100).toFixed(1));
  };

  const radarDataTYT = lastTyt ? [
    { subject: 'Tür', score: getPercentageNumber(getTytMetric('Türkçe').n, 40), fullMark: 100, rawScore: getTytMetric('Türkçe').n },
    { subject: 'Tar', score: getPercentageNumber(getTytMetric('Tarih').n, 5), fullMark: 100, rawScore: getTytMetric('Tarih').n },
    { subject: 'Coğ', score: getPercentageNumber(getTytMetric('Coğrafya').n, 5), fullMark: 100, rawScore: getTytMetric('Coğrafya').n },
    { subject: 'Fel', score: getPercentageNumber(getTytMetric('Felsefe').n, 5), fullMark: 100, rawScore: getTytMetric('Felsefe').n },
    { subject: 'Din', score: getPercentageNumber(getTytMetric('Din').n, 5), fullMark: 100, rawScore: getTytMetric('Din').n },
    { subject: 'Mat', score: getPercentageNumber(getTytMetric('Matematik').n, 30), fullMark: 100, rawScore: getTytMetric('Matematik').n },
    { subject: 'Geo', score: getPercentageNumber(getTytMetric('Geometri').n, 10), fullMark: 100, rawScore: getTytMetric('Geometri').n },
    { subject: 'Fiz', score: getPercentageNumber(getTytMetric('Fizik').n, 7), fullMark: 100, rawScore: getTytMetric('Fizik').n },
    { subject: 'Kim', score: getPercentageNumber(getTytMetric('Kimya').n, 7), fullMark: 100, rawScore: getTytMetric('Kimya').n },
    { subject: 'Biy', score: getPercentageNumber(getTytMetric('Biyoloji').n, 6), fullMark: 100, rawScore: getTytMetric('Biyoloji').n },
  ] : [
    { subject: 'Tür', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Tar', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Coğ', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Fel', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Din', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Mat', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Geo', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Fiz', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Kim', score: 0, fullMark: 100, rawScore: 0 },
    { subject: 'Biy', score: 0, fullMark: 100, rawScore: 0 },
  ];

  const sortedAytExams = examData.filter(e => e.examType === 'AYT' || e.examType === 'YKS').sort((a,b) => safeGetTime(a.date) - safeGetTime(b.date));
  const lastAyt = sortedAytExams.length > 0 ? sortedAytExams[sortedAytExams.length - 1] : null;

  const aytScores = lastAyt?.examType === 'AYT' ? lastAyt?.scores : (lastAyt?.examType === 'YKS' ? {
    'Matematik': lastAyt.scores?.['AYT Matematik'],
    'Fizik': lastAyt.scores?.['AYT Fizik'],
    'Kimya': lastAyt.scores?.['AYT Kimya'],
    'Biyoloji': lastAyt.scores?.['AYT Biyoloji'],
    'Edebiyat': lastAyt.scores?.['AYT Edebiyat'],
    'Tarih-1': lastAyt.scores?.['AYT Tarih-1'],
    'Coğrafya-1': lastAyt.scores?.['AYT Coğrafya-1'],
    'Tarih-2': lastAyt.scores?.['AYT Tarih-2'],
    'Coğrafya-2': lastAyt.scores?.['AYT Coğrafya-2'],
    'Felsefe Grubu': lastAyt.scores?.['AYT Felsefe'],
    'Din Kültürü': lastAyt.scores?.['AYT Din']
  } : {});

  const getBarDataAYT = (branch: string) => {
    switch (branch) {
      case 'EŞİT AĞIRLIK':
        return [
          { subject: 'Matematik', score: aytScores?.['Matematik']?.n || 0, max: 40 },
          { subject: 'Edebiyat', score: aytScores?.['Edebiyat']?.n || 0, max: 24 },
          { subject: 'Tarih-1', score: aytScores?.['Tarih-1']?.n || 0, max: 10 },
          { subject: 'Coğrafya-1', score: aytScores?.['Coğrafya-1']?.n || 0, max: 6 },
        ];
      case 'SÖZEL':
        return [
          { subject: 'Edebiyat', score: aytScores?.['Edebiyat']?.n || 0, max: 24 },
          { subject: 'Tarih-2', score: aytScores?.['Tarih-2']?.n || 0, max: 11 },
          { subject: 'Coğrafya-2', score: aytScores?.['Coğrafya-2']?.n || 0, max: 11 },
          { subject: 'Felsefe Grubu', score: aytScores?.['Felsefe Grubu']?.n || 0, max: 12 },
          { subject: 'Din Kültürü', score: aytScores?.['Din Kültürü']?.n || 0, max: 6 },
        ];
      case 'DİL':
        return [
          { subject: 'Yabancı Dil', score: aytScores?.['Yabancı Dil']?.n || 0, max: 80 },
        ];
      case 'SAYISAL':
      default:
        return [
          { subject: 'Matematik', score: aytScores?.['Matematik']?.n || 0, max: 40 },
          { subject: 'Fizik', score: aytScores?.['Fizik']?.n || 0, max: 14 },
          { subject: 'Kimya', score: aytScores?.['Kimya']?.n || 0, max: 13 },
          { subject: 'Biyoloji', score: aytScores?.['Biyoloji']?.n || 0, max: 13 },
        ];
    }
  };

  const aytBarData = getBarDataAYT(academicInfo.branch);
  const sonAytNet = lastAyt ? aytBarData.reduce((sum, item) => sum + item.score, 0) : 0;

  // Performance Trend
  const performanceData = sortedTytExams.map((exam: any) => {
    // If it's TYT, it's totalNet
    // If it's YKS, we sum up TYT components to get a net
    if (exam.examType === 'TYT') {
      return {
        name: new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short' }),
        fullDate: exam.date,
        net: exam.totalNet || 0
      };
    } else {
      let total = 0;
      ['TYT Türkçe', 'TYT Tarih', 'TYT Coğrafya', 'TYT Felsefe', 'TYT Din', 'TYT Matematik', 'TYT Geometri', 'TYT Fizik', 'TYT Kimya', 'TYT Biyoloji'].forEach(f => {
        total += exam.scores?.[f]?.n || 0;
      });
      return {
        name: new Date(exam.date).toLocaleDateString('tr-TR', { month: 'short' }),
        fullDate: exam.date,
        net: parseFloat(total.toFixed(2))
      };
    }
  });

  // Keep last 6 exams for chart
  const recentPerformanceData = performanceData.slice(-6);


  const canChangeGrade = useMemo(() => {
    if (userData?.role === 'admin' || userData?.role === 'coach') return true;
    if (!userData?.gradeUpdatedAt) return true;
    const lastUpdate = userData.gradeUpdatedAt.toDate ? userData.gradeUpdatedAt.toDate() : new Date(userData.gradeUpdatedAt);
    const now = new Date();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    return (now.getTime() - lastUpdate.getTime()) > oneYearInMs;
  }, [userData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates: any = {
        ...academicInfo,
        targetTyt: parseInt(academicInfo.targetTyt) || 0,
        targetAyt: parseInt(academicInfo.targetAyt) || 0,
        updatedAt: new Date()
      };
      
      if (academicInfo.grade !== userData?.grade) {
        if (!canChangeGrade) {
          alert('Sınıf seviyesini yılda sadece 1 kez değiştirebilirsiniz.');
          setSaving(false);
          return;
        }
        updates.gradeUpdatedAt = new Date();
      }

      await updateDoc(doc(db, 'users', user!.uid), updates);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header Profile Summary */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative bg-slate-900 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl p-8 lg:p-10"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl shadow-purple-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
              <span className="text-4xl text-white font-black">{userData.name?.[0] || 'Ö'}</span>
            </div>
            <div>
               <div className="flex items-center gap-3 mb-1">
                 <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                   {userData.name || 'Öğrenci Profili'}
                 </h1>
                 <span className="bg-white/10 text-white text-xs px-3 py-1 rounded-full font-bold border border-white/10 backdrop-blur-md">
                   {academicInfo.grade || 'Sınıf Belirtilmedi'}
                 </span>
               </div>
              <p className="text-slate-400 mt-2 text-base sm:text-lg max-w-xl leading-relaxed">
                <span className="font-medium text-slate-300">Hoş Geldin!</span> Burası senin dijital ikizin. Kişilik testlerin, akademik hedeflerin ve AI tabanlı projeksiyonların yer aldığı kontrol merkezin.
              </p>
            </div>
          </div>

          <div className="flex gap-4 shrink-0 mt-4 md:mt-0">
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 text-center transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer group">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 group-hover:text-slate-400">Genel XP</p>
               <p className="text-2xl font-black text-emerald-400 flex items-center justify-center gap-2">
                 <Zap size={20} className="fill-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" /> {userData.xp || 12450}
               </p>
             </div>
             <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 text-center transition-all hover:bg-white/10 hover:border-white/20 cursor-pointer group">
               <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 group-hover:text-slate-400">Çalışma Serisi</p>
               <p className="text-2xl font-black text-orange-400 flex items-center justify-center gap-2">
                 <Flame size={20} className="fill-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" /> {userData.streak || 14} <span className="text-sm text-slate-400 ml-1">Gün</span>
               </p>
             </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Column: Editable Targets (Sticky Sidebar) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="sticky top-6">
            <motion.form 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleUpdateProfile} 
              className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/30 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-700"></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10 pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                     <Compass size={20} className="text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight">Rota Belirle</h3>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Akademik Pusula</p>
                  </div>
                </div>
                {success && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/20 flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                    <Check size={12} strokeWidth={3} /> Kaydedildi
                  </span>
                )}
              </div>
              
              <div className="space-y-5 relative z-10">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                      Sınıf {(!canChangeGrade && academicInfo.grade === userData?.grade) && <span className="text-amber-500 lowercase normal-case text-[9px]">(Bu yıl değiştirilemez)</span>}
                    </label>
                    <select 
                      value={academicInfo.grade}
                      disabled={!canChangeGrade && academicInfo.grade === userData?.grade}
                      onChange={(e) => {
                        const newGrade = e.target.value;
                        setAcademicInfo({
                          ...academicInfo, 
                          grade: newGrade,
                          branch: (newGrade === '9. Sınıf' || newGrade === '10. Sınıf') ? 'Alan Yok' : academicInfo.branch
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-all hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="" className="bg-slate-900">Seçiniz...</option>
                      {['9. Sınıf', '10. Sınıf', '11. Sınıf', '12. Sınıf', 'Mezun'].map(g => (
                        <option key={g} value={g} className="bg-slate-900">{g}</option>
                      ))}
                    </select>
                  </div>

                  {academicInfo.grade && academicInfo.grade !== '9. Sınıf' && academicInfo.grade !== '10. Sınıf' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Alan</label>
                      <select 
                        value={academicInfo.branch}
                        onChange={(e) => setAcademicInfo({...academicInfo, branch: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-all hover:bg-white/10"
                      >
                        <option value="" className="bg-slate-900">Seçiniz...</option>
                        {['SAYISAL', 'EŞİT AĞIRLIK', 'SÖZEL', 'DİL'].map(b => (
                          <option key={b} value={b} className="bg-slate-900">{b}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {academicInfo.branch === 'DİL' && academicInfo.grade !== '9. Sınıf' && academicInfo.grade !== '10. Sınıf' && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Çalışılan Yabancı Dil</label>
                    <select 
                      value={academicInfo.ydtLanguage}
                      onChange={(e) => setAcademicInfo({...academicInfo, ydtLanguage: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 focus:bg-white/10 outline-none transition-all hover:bg-white/10"
                    >
                      <option value="" className="bg-slate-900">Seçiniz...</option>
                      {['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça'].map(l => (
                        <option key={l} value={l} className="bg-slate-900">{l}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hedef Üniversite</label>
                    <input 
                      type="text"
                      value={academicInfo.targetUniversity}
                      onChange={(e) => setAcademicInfo({...academicInfo, targetUniversity: e.target.value})}
                      placeholder="Örn: ODTÜ"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:bg-white/10 outline-none transition-all hover:bg-white/10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Hedef Bölüm</label>
                    <input 
                      type="text"
                      value={academicInfo.targetDepartment}
                      onChange={(e) => setAcademicInfo({...academicInfo, targetDepartment: e.target.value})}
                      placeholder="Örn: Bilgisayar Mühendisliği"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:bg-white/10 outline-none transition-all hover:bg-white/10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center justify-between">
                      Hedef TYT <span className="text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">Net</span>
                    </label>
                    <input 
                      type="number"
                      value={academicInfo.targetTyt}
                      onChange={(e) => setAcademicInfo({...academicInfo, targetTyt: e.target.value})}
                      placeholder="85"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-4 text-2xl text-white focus:border-blue-500 outline-none transition-all text-center font-black tracking-tight hover:bg-slate-900 shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center justify-between">
                      Hedef AYT <span className="text-purple-500 bg-purple-500/10 px-1.5 py-0.5 rounded">Net</span>
                    </label>
                    <input 
                      type="number"
                      value={academicInfo.targetAyt}
                      onChange={(e) => setAcademicInfo({...academicInfo, targetAyt: e.target.value})}
                      placeholder="65"
                      className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-4 text-2xl text-white focus:border-purple-500 outline-none transition-all text-center font-black tracking-tight hover:bg-slate-900 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={saving}
                className="w-full mt-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 relative z-10 group/btn"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover/btn:scale-110 transition-transform" />}
                <span className="tracking-wide">Hedefleri Kaydet</span>
              </button>
            </motion.form>
          </div>
        </div>

        {/* Right Column: Main Profile Area with Tabs */}
        <div className="xl:col-span-8 space-y-6">
           
           {/* Custom Tabs */}
           <div className="bg-slate-900/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 inline-flex shadow-lg mb-2">
             <button
               onClick={() => setActiveTab('kisilik')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                 activeTab === 'kisilik' 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
             >
               <Fingerprint size={18} />
               Kişilik Analizi Profili
             </button>
             <button
               onClick={() => setActiveTab('akademik')}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                 activeTab === 'akademik' 
                  ? 'bg-indigo-500 text-white shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
               }`}
             >
               <Activity size={18} />
               Akademik Performans
             </button>
           </div>

           <AnimatePresence mode="wait">
             
             {/* KİŞİLİK PROFİLİ TAB */}
             {activeTab === 'kisilik' && (
               <motion.div
                 key="kisilik"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 transition={{ duration: 0.3 }}
                 className="space-y-6"
               >
                 {/* Top Summary Stats for Personality */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-3xl p-6 relative overflow-hidden group">
                       <BrainCircuit className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-500/10 transform group-hover:scale-110 transition-transform duration-500" />
                       <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 relative z-10">Öğrenme Stili</h4>
                       <p className="text-2xl font-black text-white relative z-10">{vakAnalysis?.dominantStyle || 'Belirlenmedi'}</p>
                       <p className="text-xs text-slate-400 mt-2 relative z-10">
                         {vakAnalysis?.dominantStyle === 'Görsel' ? 'Bilgiyi resimler, şemalar ve görsel notlarla daha iyi hatırlarsınız.' : 
                          (vakAnalysis?.dominantStyle === 'İşitsel' ? 'Sözel tekrarlar ve dinleme yoluyla daha kalıcı öğrenirsiniz.' : 
                           (vakAnalysis?.dominantStyle === 'Kinestetik' ? 'Deneyimleyerek ve hareket ederek daha iyi anlarsınız.' : 'Analiz sonucunuz bekleniyor.'))}
                       </p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden group">
                       <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/10 transform group-hover:scale-110 transition-transform duration-500" />
                       <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 relative z-10">Baskın Zeka Tipi</h4>
                       <p className="text-2xl font-black text-white relative z-10 text-ellipsis overflow-hidden whitespace-nowrap">
                         {cz8Analysis ? Object.entries(cz8Analysis).sort((a: any, b: any) => b[1] - a[1]).slice(0, 2).map(([k]) => k === 'S' ? 'Sözel' : k === 'M' ? 'Mantıksal' : k === 'G' ? 'Görsel' : k === 'R' ? 'Müzik' : k === 'B' ? 'Bedensel' : k === 'K' ? 'Sosyal' : k === 'I' ? 'İçsel' : 'Doğa').join(' / ') : 'Belirlenmedi'}
                       </p>
                       <p className="text-xs text-slate-400 mt-2 relative z-10">
                         Çoklu zeka profilinize göre en güçlü iki alanınız.
                       </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-transparent border border-orange-500/20 rounded-3xl p-6 relative overflow-hidden group">
                       <Flame className="absolute -right-4 -bottom-4 w-24 h-24 text-orange-500/10 transform group-hover:scale-110 transition-transform duration-500" />
                       <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1 relative z-10">Sınav Stresi</h4>
                       <p className="text-2xl font-black text-white relative z-10">
                         {spbeAnalysis?.dominantType || 'Belirlenmedi'}
                       </p>
                       <p className="text-xs text-slate-400 mt-2 relative z-10">Sınav anındaki stres yönetim tipiniz.</p>
                    </div>
                 </div>

                 {/* Charts Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Psikolojik Radar */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl h-96 flex flex-col">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Compass size={18} className="text-blue-400" /> Psikolojik Esneklik
                           </h3>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Öğrenci 360 Karakter Analizi</p>
                         </div>
                       </div>
                       
                       <div className="flex-1 w-full min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarDataPersonality}>
                              <PolarGrid stroke="#334155" />
                              <PolarAngleAxis dataKey="trait" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                              <Radar
                                name="Skor"
                                dataKey="score"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                fill="#3b82f6"
                                fillOpacity={0.3}
                              />
                              <RechartsTooltip 
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                                itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                              />
                            </RadarChart>
                         </ResponsiveContainer>
                       </div>
                    </div>

                    {/* VAK Donut */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl h-96 flex flex-col">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Layers size={18} className="text-indigo-400" /> VAK-S Bilgi İşleme
                           </h3>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Dünyayı algılama ve öğrenme kanalları</p>
                         </div>
                       </div>
                       
                       <div className="flex flex-col items-center flex-1 w-full min-h-0 justify-center">
                         <div className="h-[200px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={vakData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={85}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                                >
                                  {vakData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <RechartsTooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                  itemStyle={{ fontWeight: 'bold' }}
                                />
                              </PieChart>
                           </ResponsiveContainer>
                         </div>
                         <div className="flex gap-4 mt-2 bg-white/5 px-4 py-2 rounded-xl">
                           {vakData.map(item => (
                             <div key={item.name} className="flex items-center gap-1.5">
                               <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                               <span className="text-xs text-slate-300 font-bold">{item.name} <span className="text-slate-500 ml-1">%{item.value}</span></span>
                             </div>
                           ))}
                         </div>
                       </div>
                    </div>

                    {/* Çoklu Zeka Bar Chart */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl h-80 flex flex-col md:col-span-2">
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Brain size={18} className="text-emerald-400" /> Çoklu Zeka Dağılımı
                           </h3>
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Hangi zeka türlerinde doğal bir yatkınlığınız var?</p>
                         </div>
                       </div>
                       
                       <div className="flex-1 w-full min-h-0 pt-4">
                         <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={intelligenceData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                              <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                              <RechartsTooltip 
                                cursor={{ fill: '#1e293b', opacity: 0.4 }}
                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ fontWeight: 'bold' }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                                 {intelligenceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                 ))}
                              </Bar>
                            </BarChart>
                         </ResponsiveContainer>
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}

             {/* AKADEMİK PROFİL TAB */}
             {activeTab === 'akademik' && (
               <motion.div
                 key="akademik"
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.98 }}
                 transition={{ duration: 0.3 }}
                 className="space-y-6"
               >
                 
                  {/* Predictive Engine */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-blue-500/20 rounded-3xl p-5 lg:p-6 shadow-xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors"></div>
                       <h4 className="text-[10px] text-blue-400 font-black uppercase tracking-widest flex items-center gap-2 mb-2"><TrendingUp size={16}/> Son TYT Neti</h4>
                       <div className="flex items-end gap-3">
                         <p className="text-3xl lg:text-4xl font-black text-white tracking-tighter">
                           {lastTyt ? (lastTyt.totalNet || 0)?.toFixed(1)?.split('.')[0] : '-'}
                           <span className="text-xl text-slate-500">.{lastTyt ? (lastTyt.totalNet || 0)?.toFixed(1)?.split('.')[1] : '0'}</span>
                         </p>
                       </div>
                       <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Hedef: <strong className="text-white">{academicInfo.targetTyt || '-'}</strong></span>
                          {academicInfo.targetTyt && lastTyt ? (
                            parseInt(academicInfo.targetTyt) > (lastTyt.totalNet || 0) ? (
                              <span className="text-orange-400 font-bold">Fark: {(parseInt(academicInfo.targetTyt) - (lastTyt.totalNet || 0)).toFixed(1)}</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Hedefe Ulaşıldı</span>
                            )
                          ) : null}
                       </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-purple-500/20 rounded-3xl p-5 lg:p-6 shadow-xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-purple-500/20 transition-colors"></div>
                       <h4 className="text-[10px] text-purple-400 font-black uppercase tracking-widest flex items-center gap-2 mb-2"><TrendingUp size={16} /> Son AYT Neti ({academicInfo.branch || 'Sayısal'})</h4>
                       <div className="flex items-end gap-3">
                         <p className="text-3xl lg:text-4xl font-black text-white tracking-tighter">
                            {lastAyt ? sonAytNet.toFixed(1)?.split('.')[0] : '-'}
                            <span className="text-xl text-slate-500">.{lastAyt ? sonAytNet.toFixed(1)?.split('.')[1] : '0'}</span>
                         </p>
                       </div>
                       <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Hedef: <strong className="text-white">{academicInfo.targetAyt || '-'}</strong></span>
                          {academicInfo.targetAyt && lastAyt ? (
                            parseInt(academicInfo.targetAyt) > sonAytNet ? (
                              <span className="text-orange-400 font-bold">Fark: {(parseInt(academicInfo.targetAyt) - sonAytNet).toFixed(1)}</span>
                            ) : (
                              <span className="text-emerald-400 font-bold">Hedefe Ulaşıldı</span>
                            )
                          ) : null}
                       </div>
                    </div>

                    <div className="bg-slate-900/50 backdrop-blur-xl border border-orange-500/20 rounded-3xl p-5 lg:p-6 shadow-xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-orange-500/20 transition-colors"></div>
                       <h4 className="text-[10px] text-orange-400 font-black uppercase tracking-widest flex items-center gap-2 mb-2"><Target size={16}/> Sınav Katılımı</h4>
                       <div className="flex items-end gap-3">
                         <p className="text-3xl lg:text-4xl font-black text-white tracking-tighter">{examData.length}<span className="text-xl text-slate-500"></span></p>
                         <p className="text-emerald-400 text-xs font-bold mb-1.5 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Aktif Deneme Çözücü</p>
                       </div>
                       <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Bu Ay: <strong className="text-white">{examData.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).length} Deneme</strong></span>
                       </div>
                    </div>
                  </div>

                  {/* Area Chart - Performance Trend */}
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl h-80 flex flex-col relative w-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Activity size={18} className="text-emerald-400" /> Panoramik Gelişim Trendi
                        </h3>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Aylara göre deneme net ortalamalarınız</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={recentPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                            itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="net" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNet)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Main Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    
                    {/* TYT Radar Chart */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl h-80 flex flex-col relative">
                       <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                         <Target size={18} className="text-blue-400" /> TYT Yetkinlik Dağılımı
                       </h3>
                       <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest font-black">Branşlara Göre Radar</p>
                       <div className="flex-1 w-full min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                           <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarDataTYT}>
                             <PolarGrid stroke="#334155" />
                             <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                             <Radar
                               name="Başarı"
                               dataKey="score"
                               stroke="#3b82f6"
                               strokeWidth={2}
                               fill="#3b82f6"
                               fillOpacity={0.3}
                             />
                             <RechartsTooltip 
                               contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                               itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                             />
                           </RadarChart>
                         </ResponsiveContainer>
                       </div>
                    </div>

                    {/* AYT Bar Chart */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl h-80 flex flex-col relative">
                       <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                         <Target size={18} className="text-purple-400" /> AYT {academicInfo.branch || 'Alan'} Dağılımı
                       </h3>
                       <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-widest font-black">Branşlara Göre Performans</p>
                       <div className="flex-1 w-full min-h-0">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={aytBarData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                             <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                             <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                             <YAxis dataKey="subject" type="category" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={90} />
                             <RechartsTooltip 
                               cursor={{ fill: '#1e293b', opacity: 0.4 }}
                               contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                               itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                             />
                             <Bar dataKey="score" fill="#a855f7" radius={[0, 4, 4, 0]} barSize={16}>
                               {aytBarData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#a855f7' : '#c084fc'} />
                               ))}
                             </Bar>
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                    </div>

                  </div>

               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
