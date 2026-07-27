import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useStudent } from "../../lib/StudentContext";
import { analysisService } from "../../services/analysisService";
import { Brain, FileText, Loader2, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function CoachPersonality() {
  const { userData } = useAuth();
  const { selectedStudent } = useStudent();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [report, setReport] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [userData, selectedStudent]);

  const fetchData = async () => {
    if (!selectedStudent?.uid) return;
    setLoading(true);
    try {
      const results = await analysisService.getResults(selectedStudent.uid);
      setAnalyses(results || []);
      
      // Check if we have a saved parent report
      // For simplicity, we can fetch a specific analysis type 'COACH_REPORT'
      const savedReport = await analysisService.getResults(selectedStudent.uid, 'COACH_REPORT');
      if (savedReport && savedReport.length > 0) {
        setReport(savedReport[0].data.reportText);
      }
    } catch (error: any) {
      console.error("Analizler yüklenirken hata oluştu:", error);
      if (error.message?.includes('Missing or insufficient permissions')) {
        setReport("Firebase Güvenlik Kuralları henüz güncellenmedi. Lütfen projenizin 'firestore.rules' dosyasındaki kuralları Firebase Console üzerinden yayınlayın.");
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

  const validAnalyses = analyses.filter(a => !['PARENT_REPORT', 'COACH_REPORT'].includes(a.analysisType));
  const coachReport = analyses.find(a => a.analysisType === 'COACH_REPORT');

  let isUpToDate = false;
  if (coachReport && validAnalyses.length > 0) {
    const reportDate = coachReport.timestamp?.toDate ? coachReport.timestamp.toDate().getTime() : 0;
    
    // validAnalyses is already sorted by timestamp desc from the service, but let's be safe
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="text-indigo-400" />
            Kişilik & Rehberlik Analizi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Öğrencinizin tamamladığı analizlerin koç değerlendirme raporu
          </p>
        </div>
        
        {validAnalyses.length > 0 && (
          <div className="flex flex-col items-end">
            <button
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
              {report ? "Raporu Güncelle" : "Koç Raporu Oluştur"}
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
            {report ? (
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
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
                  <ReactMarkdown>{report}</ReactMarkdown>
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
          
          <div className="lg:col-span-1 space-y-4">
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
                      {analysis.timestamp?.toDate ? analysis.timestamp.toDate().toLocaleDateString('tr-TR') : ''}
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
