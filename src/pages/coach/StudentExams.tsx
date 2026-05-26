import React, { useState, useEffect, useMemo } from 'react';
import { useStudent } from '../../lib/StudentContext';
import { BarChart3, TrendingUp, ChevronRight, Activity, CalendarDays, ClipboardCheck, Target, Filter } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { useNavigate } from 'react-router-dom';

const EXAM_STRUCTURE: any = {
  'TYT': [
    { category: 'Türkçe', fields: [{ name: 'Türkçe', max: 40 }] },
    { category: 'Sosyal Bilimler', fields: [{ name: 'Tarih', max: 5 }, { name: 'Coğrafya', max: 5 }, { name: 'Felsefe', max: 5 }, { name: 'Din', max: 5 }] },
    { category: 'Temel Matematik', fields: [{ name: 'Matematik', max: 30 }, { name: 'Geometri', max: 10 }] },
    { category: 'Fen Bilimleri', fields: [{ name: 'Fizik', max: 7 }, { name: 'Kimya', max: 7 }, { name: 'Biyoloji', max: 6 }] }
  ],
  'AYT': [
    { category: 'Ed-Sos-1', fields: [{ name: 'Edebiyat', max: 24 }, { name: 'Tarih-1', max: 10 }, { name: 'Coğrafya-1', max: 6 }] },
    { category: 'Sosyal-2', fields: [{ name: 'Tarih-2', max: 11 }, { name: 'Coğrafya-2', max: 11 }, { name: 'Felsefe Grubu', max: 12 }, { name: 'Din (Seçmeli)', max: 6 }] },
    { category: 'Matematik', fields: [{ name: 'Matematik', max: 30 }, { name: 'Geometri', max: 10 }] },
    { category: 'Fen Bilimleri', fields: [{ name: 'Fizik', max: 14 }, { name: 'Kimya', max: 13 }, { name: 'Biyoloji', max: 13 }] }
  ],
  'YDT': [
    { category: 'Yabancı Dil', fields: [{ name: 'Yabancı Dil', max: 80 }] }
  ]
};

const BRANCH_CATEGORIES = [
  {
    category: 'TYT Denemeleri',
    exams: [
      { name: 'Türkçe (TYT)', max: 40 },
      { name: 'Temel Matematik (TYT)', max: 40 },
      { name: 'Sosyal Bilimler (TYT)', max: 20 },
      { name: 'Fen Bilimleri (TYT)', max: 20 },
      { name: 'Tarih (TYT)', max: 5 },
      { name: 'Coğrafya (TYT)', max: 5 },
      { name: 'Felsefe (TYT)', max: 5 },
      { name: 'Din (TYT)', max: 5 },
      { name: 'Fizik (TYT)', max: 7 },
      { name: 'Kimya (TYT)', max: 7 },
      { name: 'Biyoloji (TYT)', max: 6 },
      { name: 'Geometri (TYT)', max: 10 }
    ]
  },
  {
    category: 'AYT Denemeleri',
    exams: [
      { name: 'Matematik (AYT)', max: 30 },
      { name: 'Edebiyat-Sosyal-1 (AYT)', max: 40 },
      { name: 'Sosyal-2 (AYT)', max: 40 },
      { name: 'Fen Bilimleri (AYT)', max: 40 },
      { name: 'Edebiyat (AYT)', max: 24 },
      { name: 'Tarih-1 (AYT)', max: 10 },
      { name: 'Coğrafya-1 (AYT)', max: 6 },
      { name: 'Tarih-2 (AYT)', max: 11 },
      { name: 'Coğrafya-2 (AYT)', max: 11 },
      { name: 'Felsefe Grubu (AYT)', max: 12 },
      { name: 'Din (Seçmeli) (AYT)', max: 6 },
      { name: 'Fizik (AYT)', max: 14 },
      { name: 'Kimya (AYT)', max: 13 },
      { name: 'Biyoloji (AYT)', max: 13 },
      { name: 'Geometri (AYT)', max: 10 }
    ]
  },
  {
    category: 'YDT Denemeleri',
    exams: [
      { name: 'İngilizce (YDT)', max: 80 },
      { name: 'Almanca (YDT)', max: 80 },
      { name: 'Fransızca (YDT)', max: 80 },
      { name: 'Arapça (YDT)', max: 80 },
      { name: 'Rusça (YDT)', max: 80 }
    ]
  }
];

const BRANCH_COMPOSITES: Record<string, string[]> = {
  'Temel Matematik (TYT)': ['Matematik (TYT)', 'Geometri (TYT)'],
  'Sosyal Bilimler (TYT)': ['Tarih (TYT)', 'Coğrafya (TYT)', 'Felsefe (TYT)', 'Din (TYT)'],
  'Fen Bilimleri (TYT)': ['Fizik (TYT)', 'Kimya (TYT)', 'Biyoloji (TYT)'],
  'Edebiyat-Sosyal-1 (AYT)': ['Edebiyat (AYT)', 'Tarih-1 (AYT)', 'Coğrafya-1 (AYT)'],
  'Sosyal-2 (AYT)': ['Tarih-2 (AYT)', 'Coğrafya-2 (AYT)', 'Felsefe Grubu (AYT)', 'Din (Seçmeli) (AYT)'],
  'Fen Bilimleri (AYT)': ['Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)']
};

export default function StudentExams() {
  const { selectedStudent } = useStudent();
  const navigate = useNavigate();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExamType, setActiveExamType] = useState('TYT');
  
  // Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [countFilter, setCountFilter] = useState('all');
  const [chartMetric, setChartMetric] = useState('net'); // 'net' or 'percentile'
  const [branchAreaFilter, setBranchAreaFilter] = useState('auto'); // 'auto', 'SAY', 'EA', 'SÖZ', 'ALL'
  
  // Branş Analysis states
  const [selectedBranchTarget, setSelectedBranchTarget] = useState('Türkçe (TYT)');
  const [branchSourceFilter, setBranchSourceFilter] = useState('hepsi'); // 'hepsi', 'genel', 'brans', 'ders'


  useEffect(() => {
    const fetchData = async () => {
      if (selectedStudent) {
        setLoading(true);
        const results = await studentDataService.getExamResults(selectedStudent.uid);
        setExams(results.reverse()); // Chronological order
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedStudent]);

  // Filter exams by type
  let filteredExams: any[] = [];
  if (activeExamType === 'BRANŞ') {
     filteredExams = exams.filter(e => {
        if (!e.scores) return false;
        
        let isGenel = e.examType === 'TYT' || e.examType === 'AYT' || e.examType === 'YDT' || e.examType === 'YKS';
        let isBransType = e.examType === 'BRANŞ';
        
        if (isBransType) {
           const examBaseName = e.examName ? e.examName.replace(' Denemesi', '') : '';
           const isComposite = BRANCH_COMPOSITES[examBaseName] !== undefined;
           
           if (branchSourceFilter === 'brans' && !isComposite) return false;
           if (branchSourceFilter === 'ders' && isComposite) return false;
        }

        // Match base logic with source filter
        if (branchSourceFilter === 'genel' && !isGenel) return false;
        if (branchSourceFilter === 'brans' && !isBransType) return false;
        if (branchSourceFilter === 'ders' && !isBransType) return false;
        
        return true;
     });
  } else {
     filteredExams = exams.filter(e => e.examType === activeExamType || e.examType === 'YKS');
  }

  // Date filter
  if (dateFilter !== 'all') {
     const cutoffDate = new Date();
     if (dateFilter === '1month') cutoffDate.setMonth(cutoffDate.getMonth() - 1);
     if (dateFilter === '3months') cutoffDate.setMonth(cutoffDate.getMonth() - 3);
     if (dateFilter === '6months') cutoffDate.setMonth(cutoffDate.getMonth() - 6);
     
     filteredExams = filteredExams.filter(e => new Date(e.date) >= cutoffDate);
  }

  // Count filter (last X exams)
  if (countFilter !== 'all') {
     const count = parseInt(countFilter, 10);
     filteredExams = filteredExams.slice(-count);
  }

  // Calculate Average Branch Performance
  // Use all filteredExams for the average, or if there's no filter, use all available
  const recentExams = [...filteredExams];
  let subjData: any = {};
  
  const getSubjectNet = (exam: any, subjectStr: string): number | null => {
      if (!exam || !exam.scores) return null;
      
      const match = subjectStr.match(/(.+)\s\((TYT|AYT|YDT)\)/);
      if (!match) return null;
      const baseSubj = match[1]; // e.g. 'Fizik'
      const examCat = match[2]; // e.g. 'TYT'

      if (exam.examType === 'BRANŞ') {
         if (exam.scores[subjectStr] !== undefined) return parseFloat(exam.scores[subjectStr].n) || 0;
         
         const composites = BRANCH_COMPOSITES[subjectStr];
         if (composites) { // e.g. Fen Bilimleri (TYT)
            let total = 0;
            let foundAny = false;
            let missingAny = false;
            composites.forEach(c => {
               if (exam.scores[c] !== undefined) {
                  total += parseFloat(exam.scores[c].n) || 0;
                  foundAny = true;
               } else {
                  missingAny = true;
               }
            });
            if (!missingAny && foundAny) return total;
            return null;
         }
         return null;
      }
      
      let targetKeyToFind = '';
      if (exam.examType === 'YKS') {
         targetKeyToFind = `${examCat} ${baseSubj}`;
      } else if (exam.examType === examCat) {
         targetKeyToFind = baseSubj;
      } else {
         return null;
      }
      
      if (exam.scores[targetKeyToFind] !== undefined) return parseFloat(exam.scores[targetKeyToFind].n) || 0;
      
      // Handle composite search in YKS/TYT
      const composites = BRANCH_COMPOSITES[subjectStr];
      if (composites) {
          let total = 0;
          let foundAny = false;
          composites.forEach(c => {
              const baseMatch = c.match(/(.+)\s\((TYT|AYT|YDT)\)/);
              if (baseMatch) {
                  const sBase = baseMatch[1];
                  const key = exam.examType === 'YKS' ? `${examCat} ${sBase}` : sBase;
                  if (exam.scores[key] !== undefined) {
                      total += parseFloat(exam.scores[key].n) || 0;
                      foundAny = true;
                  }
               }
          });
          if (foundAny) return total;
      }
      
      return null;
  };
  
  // Initialize subjData based on EXAM_STRUCTURE
  if (activeExamType !== 'BRANŞ') {
    (EXAM_STRUCTURE[activeExamType] || []).forEach((cat: any) => {
        cat.fields.forEach((f: any) => {
            // color mapping
            let color = 'bg-slate-500';
            if (f.name.includes('Sosy') || f.name.includes('Tarih') || f.name.includes('Coğ') || f.name.includes('Felsefe') || f.name.includes('Din')) color = 'bg-amber-500';
            else if (f.name.includes('Mat') || f.name.includes('Geo')) color = 'bg-emerald-500';
            else if (f.name.includes('Türkçe') || f.name.includes('Edebiyat')) color = 'bg-blue-500';
            else if (f.name.includes('Fizik') || f.name.includes('Kimya') || f.name.includes('Biyo') || f.name.includes('Fen')) color = 'bg-purple-500';
            else if (f.name.includes('Dil')) color = 'bg-rose-500';
            
            subjData[f.name] = { total: 0, count: 0, goal: f.max, color, category: cat.category };
        });
    });
  }

  const activeBranch = (selectedStudent?.branch === 'SAYISAL' ? 'SAY' : 
     selectedStudent?.branch === 'EŞİT AĞIRLIK' ? 'EA' : 
     selectedStudent?.branch === 'SÖZEL' ? 'SÖZ' : 
     selectedStudent?.branch === 'DİL' ? 'DİL' : 'SAY');

  const metricOptions: any[] = [
    { value: 'net', label: activeExamType === 'AYT' ? `Kendi Alanı (${activeBranch}) Toplam Net` : 'Toplam Net' },
    { value: 'percentile', label: 'Yüzdelik Dilim' }
  ];

  if (activeExamType === 'AYT') {
      if (activeBranch !== 'SAY') metricOptions.push({ value: 'ayt-say', label: 'Sayısal Puan Türü (80 Soru)' });
      if (activeBranch !== 'EA') metricOptions.push({ value: 'ayt-ea', label: 'Eşit Ağırlık Puan Türü (80 Soru)' });
      if (activeBranch !== 'SÖZ') metricOptions.push({ value: 'ayt-soz', label: 'Sözel Puan Türü (80 Soru)' });
  }

  Object.keys(subjData).forEach(subjName => {
    metricOptions.push({ value: subjName, label: `${subjName} Neti` });
  });

  // Calculate Chart Data
  let chartData: any[] = [];
  if (activeExamType === 'BRANŞ') {
     chartData = filteredExams.map(exam => {
        let net = getSubjectNet(exam, selectedBranchTarget);
        if (net === null) return null; // skip exams that don't have this subject
        
        // Provide short date
        let dateLabel = exam.date;
        try {
          dateLabel = new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
        } catch(e) {}
        
        return {
           name: exam.examName || dateLabel,
           net,
           percentile: exam.percentile ? parseFloat(exam.percentile) : null,
        }
     }).filter(Boolean);
  } else {
    chartData = filteredExams.map(exam => {
       let totalNet = 0;
       let aytSay = 0;
       let aytEa = 0;
       let aytSoz = 0;
       const branchNets: any = {};
  
       if (exam.scores) {
           Object.keys(subjData).forEach(subjName => {
               let score = 0;
               if (exam.scores[subjName]) {
                   score = parseFloat(exam.scores[subjName].n) || 0;
               } else if (exam.examType === 'YKS') {
                   if (activeExamType === 'TYT' && exam.scores[`TYT ${subjName}`]) {
                       score = parseFloat(exam.scores[`TYT ${subjName}`].n) || 0;
                   } else if (activeExamType === 'AYT') {
                       if (exam.scores[`AYT ${subjName}`]) score = parseFloat(exam.scores[`AYT ${subjName}`].n) || 0;
                       else if (exam.scores[subjName]) score = parseFloat(exam.scores[subjName].n) || 0;
                   } else if (activeExamType === 'YDT') {
                       if (exam.scores[`YDT ${subjName}`]) score = parseFloat(exam.scores[`YDT ${subjName}`].n) || 0;
                       else if (exam.scores[subjName]) score = parseFloat(exam.scores[subjName].n) || 0;
                   }
               }
               branchNets[subjName] = score;
               if (activeExamType !== 'AYT') {
                   totalNet += score;
               }
           });
           
           if (activeExamType === 'AYT') {
               aytSay = (branchNets['Matematik'] || 0) + (branchNets['Geometri'] || 0) + (branchNets['Fizik'] || 0) + (branchNets['Kimya'] || 0) + (branchNets['Biyoloji'] || 0);
               aytEa = (branchNets['Matematik'] || 0) + (branchNets['Geometri'] || 0) + (branchNets['Edebiyat'] || 0) + (branchNets['Tarih-1'] || 0) + (branchNets['Coğrafya-1'] || 0);
               aytSoz = (branchNets['Edebiyat'] || 0) + (branchNets['Tarih-1'] || 0) + (branchNets['Coğrafya-1'] || 0) + (branchNets['Tarih-2'] || 0) + (branchNets['Coğrafya-2'] || 0) + (branchNets['Felsefe Grubu'] || 0) + (branchNets['Din (Seçmeli)'] || 0);
               
               if (activeBranch === 'SAY') totalNet = aytSay;
               else if (activeBranch === 'EA') totalNet = aytEa;
               else if (activeBranch === 'SÖZ') totalNet = aytSoz;
               else totalNet = aytSay;
           }
       }
       
       // Provide short date
       let dateLabel = exam.date;
       try {
         dateLabel = new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
       } catch(e) {}
       
       return {
          name: exam.examName || dateLabel,
          net: parseFloat(totalNet.toFixed(2)),
          'ayt-say': parseFloat(aytSay.toFixed(2)),
          'ayt-ea': parseFloat(aytEa.toFixed(2)),
          'ayt-soz': parseFloat(aytSoz.toFixed(2)),
          percentile: exam.percentile ? parseFloat(exam.percentile) : null,
          ...branchNets
       }
    });
  }

  recentExams.forEach(e => {
     if (e.scores) {
         Object.keys(subjData).forEach(subj => {
             let score = undefined;
             if (e.examType === 'YKS') {
                 if (activeExamType === 'TYT') score = e.scores[`TYT ${subj}`];
                 else if (activeExamType === 'AYT') score = e.scores[`AYT ${subj}`] || e.scores[subj];
                 else if (activeExamType === 'YDT') score = e.scores[`YDT ${subj}`] || e.scores[subj];
             } else {
                 score = e.scores[subj];
             }
             if (score) {
                 subjData[subj].total += parseFloat(score.n || 0);
                 subjData[subj].count++;
             }
         });
     }
  });

  const branchPerformance = Object.keys(subjData).map(key => {
      const { total, count, goal, color, category } = subjData[key];
      return {
          name: key,
          avg: count > 0 ? (total / count).toFixed(1) : '0.0',
          goal: goal.toFixed(1),
          color,
          category
      }
  });

  const groupedBranches: any = {};
  branchPerformance.forEach(b => {
     if (!groupedBranches[b.category]) groupedBranches[b.category] = [];
     groupedBranches[b.category].push(b);
  });

  const weakBranches = branchPerformance.map(b => {
      const percentage = (parseFloat(b.avg) / parseFloat(b.goal)) * 100;
      return { subject: b.name, category: b.category, urgency: percentage < 50 ? 'high' : percentage < 80 ? 'medium' : 'low', score: `%${percentage.toFixed(0)} Başarı` };
  }).filter(b => b.urgency !== 'low').sort((a,b) => (a.urgency === 'high' ? -1 : 1));

  let filteredGroupedBranches = { ...groupedBranches };
  let activeWeakBranches = weakBranches;

  if (activeExamType === 'AYT') {
     const filterToApply = branchAreaFilter === 'auto' ? activeBranch : branchAreaFilter;
     let includedCats: string[] = [];
     if (filterToApply === 'SAY') includedCats = ['Matematik', 'Fen Bilimleri'];
     else if (filterToApply === 'EA') includedCats = ['Matematik', 'Ed-Sos-1'];
     else if (filterToApply === 'SÖZ') includedCats = ['Ed-Sos-1', 'Sosyal-2'];
     
     if (includedCats.length > 0 && filterToApply !== 'ALL') {
         Object.keys(filteredGroupedBranches).forEach(cat => {
            if (!includedCats.includes(cat)) delete filteredGroupedBranches[cat];
         });
         activeWeakBranches = weakBranches.filter(b => includedCats.includes(b.category || ''));
     }
  }

  // Calculate Trend Line if at least 3 exams
  const finalChartData = useMemo(() => {
    const dataKey = activeExamType === 'BRANŞ' ? 'net' : chartMetric;
    if (chartData.length < 3) return chartData;

    try {
      const n = chartData.length;
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;

      const validDataPoints = chartData.filter(d => d[dataKey] !== null && d[dataKey] !== undefined);
      if (validDataPoints.length < 3) return chartData;

      validDataPoints.forEach((d, i) => {
        const y = d[dataKey];
        sumX += i;
        sumY += y;
        sumXY += i * y;
        sumXX += i * i;
      });

      const m = (validDataPoints.length * sumXY - sumX * sumY) / (validDataPoints.length * sumXX - sumX * sumX);
      const b = (sumY - m * sumX) / validDataPoints.length;

      return chartData.map((d, i) => {
        const targetPoint = validDataPoints.findIndex(p => p === d);
        if (targetPoint === -1) return d;
        return {
          ...d,
          trendValue: parseFloat((m * targetPoint + b).toFixed(2))
        };
      });
    } catch (e) {
      console.error("Trend line calculation error", e);
      return chartData;
    }
  }, [chartData, activeExamType, chartMetric, selectedBranchTarget]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             SINAV ANALİZLERİ
          </h1>
          <p className="text-slate-500 mt-1">{selectedStudent?.displayName} son deneme sonuçları ve branş başarı analizi.</p>
        </div>
        <button 
          onClick={() => navigate('/panel/koc/ogrenci/sonuclar')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 transition-all shrink-0"
        >
          <ClipboardCheck size={18} />
          Tüm Sonuçları Gör
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between md:items-center">
        <div className="flex flex-wrap bg-slate-900/60 p-1 rounded-xl border border-white/5 w-fit">
           {['TYT', 'AYT', 'YDT', 'BRANŞ'].map(tab => (
              <button
                 key={tab}
                 onClick={() => setActiveExamType(tab)}
                 className={`px-3 md:px-6 py-2.5 rounded-lg text-xs md:text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeExamType === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                 {tab} ANALİZİ
              </button>
           ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-xl px-3 py-1.5 relative z-10">
             <Filter size={16} className="text-slate-400" />
             <select 
               value={dateFilter}
               onChange={(e) => setDateFilter(e.target.value)}
               className="bg-transparent text-sm font-bold text-white outline-none border-none cursor-pointer min-w-[120px]"
             >
               <option value="all" className="bg-slate-900">Tüm Zamanlar</option>
               <option value="1month" className="bg-slate-900">Son 1 Ay</option>
               <option value="3months" className="bg-slate-900">Son 3 Ay</option>
               <option value="6months" className="bg-slate-900">Son 6 Ay</option>
             </select>
          </div>
          <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-xl px-2 py-1.5 relative z-10">
             <select 
               value={countFilter}
               onChange={(e) => setCountFilter(e.target.value)}
               className="bg-transparent text-sm font-bold text-white outline-none border-none cursor-pointer min-w-[120px]"
             >
               <option value="all" className="bg-slate-900">Tüm Denemeler</option>
               <option value="5" className="bg-slate-900">Son 5 Deneme</option>
               <option value="10" className="bg-slate-900">Son 10 Deneme</option>
               <option value="20" className="bg-slate-900">Son 20 Deneme</option>
             </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold italic animate-pulse">Analizler Yükleniyor...</div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl m-6 bg-slate-900/20">
           <BarChart3 size={48} className="mx-auto text-slate-700 mb-4" />
           <p className="text-slate-400 font-bold text-sm">Öğrencinin analiz edilecek {activeExamType} denemesi bulunmuyor.</p>
           <p className="text-slate-500 text-xs mt-2">Öğrenci veri girişi sayfasından deneme ekleyebilirsiniz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={activeExamType === 'BRANŞ' ? "lg:col-span-full space-y-6" : "lg:col-span-2 space-y-6"}>
             {/* Chart */}
             <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px]" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                   <h3 className="text-lg font-bold text-white flex items-center gap-2">
                       <Activity className="text-indigo-400" size={20} />
                       {activeExamType !== 'BRANŞ' ? `${activeExamType} Gelişim Grafiği` : 'Branş Net Gelişimi'}
                   </h3>
                   <div className="flex gap-2 flex-wrap items-center relative z-20">
                      {activeExamType === 'BRANŞ' ? (
                        <>
                          <div className="flex p-1 bg-white/5 rounded-lg border border-white/5">
                             <select 
                                value={selectedBranchTarget}
                                onChange={(e) => setSelectedBranchTarget(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-300 outline-none border-none py-1.5 px-3 cursor-pointer min-w-[140px]"
                             >
                                {BRANCH_CATEGORIES.map(category => (
                                  <optgroup key={category.category} label={category.category} className="bg-slate-900 border-none text-indigo-400 font-bold">
                                    {category.exams.map(b => (
                                      <option key={b.name} value={b.name} className="bg-slate-900 text-white font-normal">{b.name}</option>
                                    ))}
                                  </optgroup>
                                ))}
                             </select>
                          </div>
                          <div className="flex p-1 bg-white/5 rounded-lg border border-white/5">
                             <select 
                                value={branchSourceFilter}
                                onChange={(e) => setBranchSourceFilter(e.target.value)}
                                className="bg-transparent text-xs font-bold text-slate-300 outline-none border-none py-1.5 px-3 cursor-pointer min-w-[140px]"
                             >
                                <option value="hepsi" className="bg-slate-900 text-white">Hepsi (Tüm Kaynaklar)</option>
                                <option value="genel" className="bg-slate-900 text-white">Genel Denemeler</option>
                                <option value="brans" className="bg-slate-900 text-white">Branş Testleri/Karma</option>
                                <option value="ders" className="bg-slate-900 text-white">Ders Testleri</option>
                             </select>
                          </div>
                        </>
                      ) : (
                        <div className="flex p-1 bg-white/5 rounded-lg border border-white/5">
                           <select 
                              value={chartMetric}
                              onChange={(e) => setChartMetric(e.target.value)}
                              className="bg-transparent text-xs font-bold text-slate-300 outline-none border-none py-1.5 px-3 cursor-pointer min-w-[140px]"
                           >
                              {metricOptions.map(opt => (
                                 <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
                                    {opt.label}
                                 </option>
                              ))}
                           </select>
                        </div>
                      )}
                   </div>
                </div>
                <div className="h-80 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={finalChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                       <defs>
                         <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor={chartMetric === 'net' ? "#6366f1" : (chartMetric === 'percentile' ? "#10b981" : "#f59e0b")} stopOpacity={0.3}/>
                           <stop offset="95%" stopColor={chartMetric === 'net' ? "#6366f1" : (chartMetric === 'percentile' ? "#10b981" : "#f59e0b")} stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                       <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                       {chartMetric === 'percentile' ? (
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} reversed={true} domain={[0, 100]} />
                       ) : (
                          <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                       )}
                       <RechartsTooltip 
                         contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                         itemStyle={{ color: chartMetric === 'net' ? '#818cf8' : (chartMetric === 'percentile' ? '#34d399' : '#fbbf24'), fontWeight: 'bold' }}
                         labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                       />
                       <Area 
                         type="monotone" 
                         dataKey={activeExamType === 'BRANŞ' ? 'net' : chartMetric} 
                         name={activeExamType === 'BRANŞ' ? selectedBranchTarget : (metricOptions.find(o => o.value === chartMetric)?.label || 'Net')}
                         stroke={chartMetric === 'net' ? '#6366f1' : (chartMetric === 'percentile' ? '#10b981' : '#f59e0b')} 
                         strokeWidth={3}
                         fillOpacity={1} 
                         fill="url(#colorNet)" 
                         activeDot={{ r: 6, fill: chartMetric === 'net' ? '#6366f1' : (chartMetric === 'percentile' ? '#10b981' : '#f59e0b'), stroke: '#fff', strokeWidth: 2 }}
                       />
                       {finalChartData.some(d => d.trendValue !== undefined) && (
                         <Line
                           type="monotone"
                           dataKey="trendValue"
                           name="Performans Trendi"
                           stroke="#ffffff80"
                           strokeWidth={2}
                           strokeDasharray="5 5"
                           dot={false}
                           activeDot={{ r: 4, fill: "#fff" }}
                         />
                       )}
                     </ComposedChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Branch Performance */}
             {activeExamType !== 'BRANŞ' && (
                 <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                       <h3 className="text-xl font-bold">({countFilter !== 'all' ? `Son ${countFilter} Sınav ` : 'Tüm Sınavların '}) Branş Ortalamaları</h3>
                       {activeExamType === 'AYT' && (
                         <div className="flex p-1 bg-white/5 rounded-lg border border-white/5 relative z-10 shrink-0">
                           <select 
                              value={branchAreaFilter}
                              onChange={(e) => setBranchAreaFilter(e.target.value)}
                              className="bg-transparent text-xs font-bold text-slate-300 outline-none border-none py-1.5 px-3 cursor-pointer min-w-[140px]"
                           >
                              <option value="auto" className="bg-slate-900">Kendi Alanım ({activeBranch})</option>
                              <option value="SAY" className="bg-slate-900 text-white">Sayısal (SAY)</option>
                              <option value="EA" className="bg-slate-900 text-white">Eşit Ağırlık (EA)</option>
                              <option value="SÖZ" className="bg-slate-900 text-white">Sözel (SÖZ)</option>
                              <option value="ALL" className="bg-slate-900 text-white">Tüm Dersler</option>
                           </select>
                         </div>
                       )}
                    </div>
                    <div className="space-y-8">
                       {Object.keys(filteredGroupedBranches).map(category => (
                         <div key={category} className="space-y-4">
                            <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest border-b border-white/5 pb-2">{category}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {filteredGroupedBranches[category].map((branch: any, i: number) => (
                                 <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                       <h4 className="font-bold text-slate-200">{branch.name}</h4>
                                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ort: {branch.avg}</span>
                                    </div>
                                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-px">
                                       <div 
                                         className={`h-full ${branch.color} rounded-full opacity-80`}
                                         style={{ width: `${Math.min(100, (parseFloat(branch.avg) / parseFloat(branch.goal)) * 100)}%` }}
                                       />
                                    </div>
                                    <div className="flex justify-between mt-2">
                                       <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">İdeal Hedef: {branch.goal}</span>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
             )}
          </div>

          {activeExamType !== 'BRANŞ' && (
              <div className="space-y-6">
                 <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                       <TrendingUp size={20} className="text-red-500" /> Dikkat Çeken Zayıflıklar
                    </h3>
                    {activeWeakBranches.length > 0 ? (
                        <div className="space-y-4">
                           {activeWeakBranches.map((item, i) => (
                              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5">
                                 <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${item.urgency === 'high' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                                    <span className="text-sm font-bold text-slate-200">{item.subject}</span>
                                 </div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Başarı: {item.score}</p>
                              </div>
                           ))}
                           <p className="text-[10px] text-slate-500 uppercase tracking-widest leading-relaxed mt-4 bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                              Bu derslerdeki ortalama netler beklenen ideal hedeflerin oldukça altında. Çalışma programında bu derslere ağırlık verilmesi tavsiye edilir.
                           </p>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                            <Target size={32} className="mx-auto text-emerald-500 mb-3" />
                            <p className="text-sm font-bold text-slate-300">Harika İlerleme!</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Belirgin bir zayıflık bulunmuyor.</p>
                        </div>
                    )}
                    
                    <button 
                      onClick={() => navigate('/panel/koc/ogrenci/program')}
                      className="w-full mt-8 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                       Programa Görev Ekle
                    </button>
                 </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
}

