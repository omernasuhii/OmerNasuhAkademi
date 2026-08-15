import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { tourService } from "../../services/tourService";
import { useStudent } from "../../lib/StudentContext";
import { analysisService } from "../../services/analysisService";
import { Brain, FileText, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { OnboardingTour, TourStep } from "../../components/OnboardingTour";
import NoStudentSelected from "../../components/NoStudentSelected";
import { SAMPLE_DEMO_STUDENT } from "./CoachStudents";

const DEMO_ANALYSES = [
  { id: 'demo-1', analysisType: 'Öğrenme Stilleri Envanteri', timestamp: new Date() },
  { id: 'demo-2', analysisType: 'Sınav Kaygısı Ölçeği', timestamp: new Date() },
  { id: 'demo-3', analysisType: 'Holland Mesleki İlgi Envanteri', timestamp: new Date() }
];

const DEMO_REPORT = `### 🧠 Yapay Zeka Koç Değerlendirme & Rehberlik Raporu

**1. Öğrenme Profili (Görsel & İşitsel):**
Öğrenciniz %48 oranında Görsel, %36 oranında İşitsel öğrenme ağırlıklıdır. Ders çalışırken renkli kodlama, kavram haritaları ve sesli özet dinleme teknikleri ders verimini artırmaktadır.

**2. Sınav Kaygısı & Psikolojik Dayanıklılık:**
Sınav kaygısı "Orta-Düşük" seviyededir. Özellikle deneme sınavlarının ilk 15 dakikasındaki odaklanmayı artırmak için nefes egzersizi ve soru turu stratejisi önerilir.

**3. Koç Rehberlik Tavsiyesi:**
Öğrencinin güçlü mantıksal zekası ve araştırma merakı Holland envanterinde Araştırmacı (Investigative) tiplemesini öne çıkarmaktadır. Hedeflenen mühendislik/bilim bölümleri çalışma motivasyonunu desteklemektedir.`;

export default function CoachPersonality() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [report, setReport] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);

  useEffect(() => {
    if (!selectedStudent && (location.state?.startTour || location.state?.isDemo)) {
      setSelectedStudent(SAMPLE_DEMO_STUDENT);
    }
  }, [selectedStudent, setSelectedStudent, location.state]);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('coach_personality', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('coach_personality', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-personality-header',
      title: 'Kişilik & Rehberlik Analiz Paneli',
      description: `${activeStudent?.displayName || 'Seçili öğrenci'} tarafından doldurulan mizaç, öğrenme stili ve rehberlik testlerinin koç değerlendirme merkezidir.`,
      position: 'bottom'
    },
    {
      targetId: 'tour-personality-list',
      title: 'Tamamlanan Analizler & Envanterler',
      description: 'Öğrencinin tamamladığı Öğrenme Stilleri, Sınav Kaygısı ve Holland Mesleki İlgi gibi testler burada listelenir.',
      position: 'top'
    },
    {
      targetId: 'tour-personality-report',
      title: 'Yapay Zeka Destekli Bütünleşik Koç Raporu',
      description: 'Yapay Zeka, öğrencinin tüm test verilerini harmanlayarak koç için kişiselleştirilmiş rehberlik tavsiyeleri ve pedagojik stratejiler üretir.',
      position: 'top'
    },
    {
      targetId: 'tour-personality-generate-btn',
      title: 'Koç Raporu Oluştur & Güncelle',
      description: 'Öğrenci yeni testler tamamladıkça tek tıkla "Koç Raporu Oluştur/Güncelle" butonuna basarak sentez raporunu güncelleyebilirsiniz.',
      position: 'bottom'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [userData, activeStudent]);

  const fetchData = async () => {
    if (!activeStudent?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const results = await analysisService.getResults(activeStudent.uid);
      setAnalyses(results || []);
      
      const savedReport = await analysisService.getResults(activeStudent.uid, 'COACH_REPORT');
      if (savedReport && savedReport.length > 0) {
        setReport(savedReport[0].data.reportText);
      }
    } catch (error: any) {
      console.error("Analizler yüklenirken hata oluştu:", error);
      if (error.message?.includes('Missing or insufficient permissions')) {
        setReport("Firebase Güvenlik Kuralları henüz güncellenmedi.");
      }
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    if (!selectedStudent?.uid || analyses.length === 0) return;

    const validAnalyses = analyses.filter(a => !['PARENT_REPORT', 'COACH_REPORT'].includes(a.analysisType));
    const coachReport = analyses.find(a => a.analysisType === 'COACH_REPORT');

    let currentIsUpToDate = false;
    if (coachReport && validAnalyses.length > 0) {
      const reportDate = coachReport.timestamp?.toDate ? coachReport.timestamp.toDate().getTime() : 
                         (coachReport.timestamp instanceof Date ? coachReport.timestamp.getTime() : 
                         (typeof coachReport.timestamp === 'number' ? coachReport.timestamp : 0));
      
      const latestAnalysis = validAnalyses.reduce((latest, current) => {
        const currentTimestamp = current.timestamp?.toDate ? current.timestamp.toDate().getTime() : 
                                 (current.timestamp instanceof Date ? current.timestamp.getTime() : 
                                 (typeof current.timestamp === 'number' ? current.timestamp : 0));
        const latestTimestamp = latest.timestamp?.toDate ? latest.timestamp.toDate().getTime() : 
                                (latest.timestamp instanceof Date ? latest.timestamp.getTime() : 
                                (typeof latest.timestamp === 'number' ? latest.timestamp : 0));
        return currentTimestamp > latestTimestamp ? current : latest;
      }, validAnalyses[0]);
      
      const latestAnalysisDate = latestAnalysis.timestamp?.toDate ? latestAnalysis.timestamp.toDate().getTime() : 
                                 (latestAnalysis.timestamp instanceof Date ? latestAnalysis.timestamp.getTime() : 
                                 (typeof latestAnalysis.timestamp === 'number' ? latestAnalysis.timestamp : 0));

      if (reportDate >= latestAnalysisDate) {
        currentIsUpToDate = true;
      }
    }

    if (currentIsUpToDate) {
      alert("Yeni bir analiz verisi bulunmadığı için mevcut raporunuz zaten günceldir.");
      return;
    }

    setGenerating(true);
    try {
      // Filter out previous parent reports so we don't send them to the AI
      const relevantAnalyses = analyses
        .filter(a => !['PARENT_REPORT', 'COACH_REPORT'].includes(a.analysisType))
        .map(a => ({
          type: a.analysisType,
          date: a.timestamp?.toDate ? a.timestamp.toDate().toLocaleDateString('tr-TR') : a.timestamp,
          summary: a.data?.resultSummary || a.data // You might need to adjust based on real data structure
        }));

      const response = await fetch('/api/coach-report-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: userData.studentName || 'Öğrenci',
          analysesData: relevantAnalyses
        })
      });

      if (!response.ok) {
        throw new Error("Rapor oluşturulamadı");
      }

      const data = await response.json();
      const generatedText = data.text;
      
      setReport(generatedText);

      // Save it to firestore
      await analysisService.saveResult(selectedStudent.uid, 'COACH_REPORT', { reportText: generatedText });
      
      // Refresh to update local state (including analyses array so isUpToDate becomes true)
      await fetchData();
      
    } catch (error) {
      console.error("Rapor oluşturma hatası:", error);
      alert("Rapor oluşturulurken bir hata meydana geldi.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!activeStudent) {
    return <NoStudentSelected />;
  }

  const fetchedValidAnalyses = analyses.filter(a => !['PARENT_REPORT', 'COACH_REPORT'].includes(a.analysisType));
  const isDemoMode = isTourOpen;

  const validAnalyses = fetchedValidAnalyses.length > 0 
    ? fetchedValidAnalyses 
    : (isDemoMode ? DEMO_ANALYSES : []);

  const displayReport = report || (isDemoMode ? DEMO_REPORT : null);

  const coachReport = analyses.find(a => a.analysisType === 'COACH_REPORT');

  let isUpToDate = false;
  if (coachReport && validAnalyses.length > 0) {
    const reportDate = coachReport.timestamp?.toDate ? coachReport.timestamp.toDate().getTime() : 0;
    
    const latestAnalysis = validAnalyses.reduce((latest, current) => {
      const currentTimestamp = current.timestamp?.toDate ? current.timestamp.toDate().getTime() : 0;
      const latestTimestamp = latest.timestamp?.toDate ? latest.timestamp.toDate().getTime() : 0;
      return currentTimestamp > latestTimestamp ? current : latest;
    }, validAnalyses[0]);
    
    const latestAnalysisDate = latestAnalysis.timestamp?.toDate ? latestAnalysis.timestamp.toDate().getTime() : 0;

    if (reportDate >= latestAnalysisDate) {
      isUpToDate = true;
    }
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('coach_personality', user?.uid);
          navigate('/panel/koc/ogrenci/hedefler', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Hedefler & Takip Turu"
        tourKey="coach_personality"
      />

      <div id="tour-personality-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="text-indigo-400" />
            Kişilik & Rehberlik Analizi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {activeStudent?.displayName || 'Öğrenci'} için tamamlanan analizlerin koç değerlendirme raporu
          </p>
        </div>
        
        {validAnalyses.length > 0 && (
          <div className="flex flex-col items-end">
            <button
              id="tour-personality-generate-btn"
              onClick={generateReport}
              disabled={generating || isUpToDate}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
              title={isUpToDate ? "Yeni bir analiz verisi bulunmadığı için raporunuz günceldir" : "Raporu güncelle"}
            >
              {generating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCw size={16} />
              )}
              {displayReport ? "Raporu Güncelle" : "Koç Raporu Oluştur"}
            </button>
            {isUpToDate && (
              <span className="text-xs text-emerald-400 mt-2 font-medium">
                ✨ Raporunuz güncel.
              </span>
            )}
          </div>
        )}
      </div>

      {validAnalyses.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
          <Brain size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">Henüz Analiz Bulunmuyor</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Öğrenciniz henüz bir kişilik veya rehberlik analizi tamamlamamış. Analizler tamamlandığında burada yapay zeka destekli koç bilgilendirme raporları görebileceksiniz.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {displayReport ? (
              <div id="tour-personality-report" className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-2xl"></div>
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
                  <div className="bg-indigo-500/20 p-3 rounded-xl border border-indigo-500/30">
                    <FileText className="text-indigo-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Yapay Zeka Destekli Koç Raporu</h2>
                    <p className="text-xs text-slate-400">Öğrencinizin tüm analiz verileri harmanlanarak size özel hazırlanmıştır.</p>
                  </div>
                </div>
                
                <div className="prose prose-invert prose-indigo max-w-none">
                  <ReactMarkdown>{displayReport}</ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-12 text-center shadow-xl">
                <FileText size={48} className="mx-auto text-indigo-500/50 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Koç Raporu Hazır Değil</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  Öğrencinizin analiz sonuçları mevcut. Bu sonuçları yorumlayarak size özel bir değerlendirme raporu oluşturabilirsiniz.
                </p>
                <button
                  onClick={generateReport}
                  disabled={generating || isUpToDate}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl inline-flex items-center gap-2 font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Brain size={20} />
                  )}
                  {generating ? "Rapor Hazırlanıyor..." : "Yapay Zeka Raporunu Oluştur"}
                </button>
              </div>
            )}
          </div>
          
          <div id="tour-personality-list" className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2">
              Tamamlanan Analizler
            </h3>
            {validAnalyses.map((analysis, idx) => (
              <div key={analysis.id || idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-700/50 p-2 rounded-lg text-slate-300">
                    <Brain size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{analysis.analysisType}</p>
                    <p className="text-xs text-slate-500">
                      {analysis.timestamp?.toDate ? analysis.timestamp.toDate().toLocaleDateString('tr-TR') : (analysis.timestamp instanceof Date ? analysis.timestamp.toLocaleDateString('tr-TR') : '10.05.2026')}
                    </p>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
