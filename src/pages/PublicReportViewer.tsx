import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  BookOpen, 
  Video, 
  Award, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  Eye,
  Check,
  ClipboardList
} from "lucide-react";

interface ReportData {
  studentName: string;
  periodStr: string;
  totalTarget: number;
  totalCompleted: number;
  completionRate: number;
  totalTasks: number;
  taskCompletionRate: number;
  examsCount: number;
  aiAnalysisText: string;
  subjectsBreakdown: { subject: string; target: number; completed: number }[];
  studentGrade?: string;
  studentBranch?: string;
  studentTarget?: string;
  studentPackage?: string;
  dailyTasks?: { date: string; displayDate: string; tasks: any[] }[];
  exams?: any[];
  denemeAverages?: {
    tytGenel?: string;
    aytGenel?: string;
    ydtGenel?: string;
    tytBrans?: string;
    aytBrans?: string;
    ydtBrans?: string;
  };
}

function getTaskBadge(task: any) {
  const rawType = (task.type || task.taskType || '').toString().toLowerCase();
  if (rawType.includes('video') || rawType.includes('youtube') || rawType.includes('ders')) {
    return { label: 'Video/Ders', unit: 'Video', icon: Video, style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
  }
  if (rawType.includes('sayfa') || rawType.includes('kitap') || rawType.includes('okuma') || rawType.includes('konu')) {
    return { label: 'Sayfa / Konu', unit: 'Sayfa', icon: BookOpen, style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  }
  if (rawType.includes('deneme') || rawType.includes('exam')) {
    return { label: 'Deneme Sınavı', unit: 'Deneme', icon: Award, style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  }
  return { label: 'Soru Bankası', unit: 'Soru', icon: CheckCircle2, style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
}

export default function PublicReportViewer() {
  const params = useParams();
  const rawReportId = params.reportId || params["*"] || "";
  const [isLoadingPdf, setIsLoadingPdf] = useState(true);
  const [activeTab, setActiveTab] = useState<"digital" | "pdf">("digital");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  let cleanId = rawReportId;
  if (cleanId.includes("rep_")) {
    cleanId = "rep_" + cleanId.split("rep_")[1];
  }
  cleanId = cleanId.split("?")[0].split("/")[0].trim();

  const pdfUrl = `/api/reports/pdf/${cleanId}`;
  const dataUrl = `/api/reports/data/${cleanId}`;

  useEffect(() => {
    if (!cleanId) {
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    fetch(dataUrl)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.report) {
          setReportData(json.report);
        }
      })
      .catch(err => {
        console.warn("Could not fetch structured report JSON:", err);
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [cleanId, dataUrl]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start py-6 px-4 sm:px-6">
      <div className="w-full max-w-5xl space-y-6">
        
        {/* Top Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/90 border border-slate-700 p-2 flex items-center justify-center shrink-0 shadow-inner">
              <img src="/images/ON-Logo.png" alt="ON Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck size={12} /> Onaylı Resmi Rapor
                </span>
                <a
                  href="https://www.omernasuhakademi.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold hover:underline"
                >
                  www.omernasuhakademi.com
                </a>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
                {reportData?.studentName || "Öğrenci"} - Haftalık Gelişim & Koçluk Raporu
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>FocusON Akademi Rehberlik & Koçluk Birimi</span>
                {reportData?.periodStr && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">{reportData.periodStr}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`FocusON_Haftalik_Veli_Raporu_${cleanId}.pdf`}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Download size={16} />
              PDF İndir
            </a>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              <ExternalLink size={16} />
              Tam Ekranda Aç
            </a>
            <Link
              to="/veli-girisi"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm transition-all"
            >
              Veli Paneli
            </Link>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full sm:w-fit">
          <button
            onClick={() => setActiveTab("digital")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "digital"
                ? "bg-slate-800 text-emerald-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles size={16} />
            Mobil / Web Görünümü
          </button>
          <button
            onClick={() => setActiveTab("pdf")}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "pdf"
                ? "bg-slate-800 text-purple-400 shadow-md border border-slate-700"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText size={16} />
            Resmi PDF Önizleme
          </button>
        </div>

        {/* Content Views */}
        {activeTab === "digital" ? (
          <div className="space-y-6">
            {loadingData ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
                <RefreshCw className="animate-spin text-emerald-400 mx-auto" size={36} />
                <p className="text-sm font-medium text-slate-300">Rapor bilgileri yükleniyor...</p>
              </div>
            ) : reportData ? (
              <>
                {/* 1. Student Identity Header Banner */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 font-black text-lg">
                          {(reportData.studentName || "Ö").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-white">{reportData.studentName}</h2>
                          <p className="text-xs text-slate-400">
                            {reportData.studentGrade || "12. Sınıf"} • {reportData.studentBranch || "SAYISAL"} • Hedef: {reportData.studentTarget || "Belirtilmedi"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="sm:text-right">
                      <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                        {reportData.studentPackage || "Sınırsız Zirve VIP (Altın Paket)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Summary KPI Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soru Çözümü</p>
                    <p className="text-xl sm:text-2xl font-black text-white">
                      {reportData.totalCompleted} <span className="text-xs text-slate-400 font-normal">/ {reportData.totalTarget}</span>
                    </p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(reportData.completionRate, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-emerald-400 font-medium">Hedefe Ulaşma: %{reportData.completionRate}</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Görev Sadakati</p>
                    <p className="text-xl sm:text-2xl font-black text-white">
                      %{reportData.taskCompletionRate || 0}
                    </p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${Math.min(reportData.taskCompletionRate || 0, 100)}%` }} />
                    </div>
                    <p className="text-[11px] text-purple-400 font-medium">{reportData.totalTasks} Planlanan Görev</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deneme Sınavları</p>
                    <p className="text-xl sm:text-2xl font-black text-white">
                      {reportData.exams?.length || reportData.examsCount || 0} <span className="text-xs text-slate-400 font-normal">Sınav</span>
                    </p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(reportData.exams?.length || 0) > 0 ? 100 : 0}%` }} />
                    </div>
                    <p className="text-[11px] text-amber-400 font-medium">Haftalık Sınavlar</p>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Müfredat Uyumu</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-400">
                      Aktif
                    </p>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: '100%' }} />
                    </div>
                    <p className="text-[11px] text-sky-400 font-medium">Koçluk Doğrulaması</p>
                  </div>
                </div>

                {/* 3. AI & Coach Evaluation Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Koç Değerlendirmesi & Yapay Zekâ Analiz Raporu</h3>
                      <p className="text-xs text-slate-400">Öğrencinin haftalık çalışma ritmi ve pedagojik koçluk geri bildirimi</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 sm:p-5 text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {reportData.aiAnalysisText || "Öğrencimizin haftalık soru çözümü ve koçluk hedeflerine uyumu başarıyla analiz edilmiştir."}
                  </div>
                </div>

                {/* 4. Haftalık Deneme Ortalamaları (Sadece Rapor Haftası) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Genel Deneme Ortalamaları */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Award size={14} className="text-emerald-400" />
                      Haftalık Genel Deneme Ortalamaları
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400">TYT GENEL</p>
                        <p className="text-sm sm:text-base font-black text-emerald-400">{reportData.denemeAverages?.tytGenel || "-"}</p>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400">AYT GENEL</p>
                        <p className="text-sm sm:text-base font-black text-emerald-400">{reportData.denemeAverages?.aytGenel || "-"}</p>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400">YDT GENEL</p>
                        <p className="text-sm sm:text-base font-black text-emerald-400">{reportData.denemeAverages?.ydtGenel || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Branş Deneme Ortalamaları */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={14} className="text-sky-400" />
                      Haftalık Branş / Ders Deneme Ortalamaları
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400">TYT BRANŞ</p>
                        <p className="text-sm sm:text-base font-black text-sky-400">{reportData.denemeAverages?.tytBrans || "-"}</p>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400">AYT BRANŞ</p>
                        <p className="text-sm sm:text-base font-black text-sky-400">{reportData.denemeAverages?.aytBrans || "-"}</p>
                      </div>
                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 text-center space-y-1">
                        <p className="text-[10px] font-bold text-slate-400">YDT BRANŞ</p>
                        <p className="text-sm sm:text-base font-black text-sky-400">{reportData.denemeAverages?.ydtBrans || "-"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Haftalık Girilen Deneme Sınavları Listesi (Geniş Kutucuk) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Award size={18} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Haftalık Girilen Deneme Sınavları</h3>
                        <p className="text-xs text-slate-400">Öğrencimizin rapor haftasında sisteme işlenen deneme ve tarama sınavı sonuçları</p>
                      </div>
                    </div>
                  </div>

                  {reportData.exams && reportData.exams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-3 font-semibold">SINAV ADI</th>
                            <th className="pb-3 font-semibold">TÜR</th>
                            <th className="pb-3 font-semibold">TARİH</th>
                            <th className="pb-3 font-semibold">TOPLAM NET</th>
                            <th className="pb-3 font-semibold">SIRA / KATILIM</th>
                            <th className="pb-3 font-semibold text-right">DİLİM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {reportData.exams.map((ex, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                              <td className="py-3 font-medium text-white">{ex.examName || "Deneme Sınavı"}</td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[11px] font-bold">
                                  {(ex.examType || "GENEL").toUpperCase()}
                                </span>
                              </td>
                              <td className="py-3 text-slate-400 text-xs">{ex.date || "-"}</td>
                              <td className="py-3 font-bold text-emerald-400">
                                {ex.totalNet !== undefined && ex.totalNet !== null ? `${Number(ex.totalNet).toFixed(1)} Net` : (ex.completedCount ? `${ex.completedCount} Soru` : "-")}
                              </td>
                              <td className="py-3 text-slate-400 text-xs">
                                {ex.rank ? `${ex.rank}${ex.participantCount ? ` / ${Number(ex.participantCount).toLocaleString("tr-TR")}` : ""}` : "-"}
                              </td>
                              <td className="py-3 text-right font-bold text-slate-300 text-xs">
                                {ex.percentile ? `%${Number(ex.percentile).toFixed(1)}` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-center space-y-1">
                      <p className="text-sm font-semibold text-slate-400">Bu rapor haftası içerisinde girilmiş herhangi bir deneme sınavı verisi bulunmamaktadır.</p>
                      <p className="text-xs text-slate-500">Öğrenci deneme sınavına girdiğinde netleri ve sıralaması bu alanda detaylı listelenir.</p>
                    </div>
                  )}
                </div>

                {/* 6. Subject Breakdown Table */}
                {reportData.subjectsBreakdown && reportData.subjectsBreakdown.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <BookOpen size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">1. Ders Bazlı Soru & Hedef Başarı Analizi</h3>
                          <p className="text-xs text-slate-400">Haftalık planlanan hedefler ve tamamlanan soru sayıları</p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400">
                            <th className="pb-3 font-semibold">DERS</th>
                            <th className="pb-3 font-semibold">HEDEF</th>
                            <th className="pb-3 font-semibold">ÇÖZÜLEN</th>
                            <th className="pb-3 font-semibold">BAŞARI</th>
                            <th className="pb-3 font-semibold">DURUM</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {reportData.subjectsBreakdown.map((s, idx) => {
                            const rate = s.target > 0 ? Math.round((s.completed / s.target) * 100) : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-3 font-medium text-white">{s.subject}</td>
                                <td className="py-3 text-slate-400">{s.target}</td>
                                <td className="py-3 font-bold text-emerald-400">{s.completed}</td>
                                <td className="py-3">
                                  <span className={`font-bold ${rate >= 70 ? 'text-emerald-400' : rate >= 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                                    %{rate}
                                  </span>
                                </td>
                                <td className="py-3 w-32">
                                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${rate >= 70 ? 'bg-emerald-500' : rate >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                      style={{ width: `${Math.min(rate, 100)}%` }} 
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 7. Günlük Görev ve Çalışma Raporu Detayları (ParentReports.tsx standardında) */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <ClipboardList size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">2. Günlük Görev ve Çalışma Raporu Detayları</h3>
                      <p className="text-xs text-slate-400">Pazartesi - Pazar aralığında koç tarafından planlanıp tamamlanan görev listesi.</p>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-800/60 p-2 sm:p-4">
                    {reportData.dailyTasks && reportData.dailyTasks.length > 0 ? (
                      reportData.dailyTasks.map((day, dIdx) => {
                        const dayTasks = day.tasks || [];
                        const doneCount = dayTasks.filter((t: any) => t.isDone).length;
                        const dayPct = dayTasks.length > 0 ? Math.round((doneCount / dayTasks.length) * 100) : 0;

                        return (
                          <div key={dIdx} className="p-4 flex flex-col md:flex-row gap-4 items-start justify-between">
                            <div className="w-48 shrink-0">
                              <span className="text-sm font-bold text-emerald-400 block">{day.displayDate}</span>
                              <span className="text-xs text-slate-400">
                                {dayTasks.length > 0
                                  ? `${doneCount} / ${dayTasks.length} Görev Yapıldı (%${dayPct})`
                                  : "Planlanmış Görev Yok"}
                              </span>
                            </div>
                            <div className="flex-1 w-full">
                              {dayTasks.length === 0 ? (
                                <div className="p-3.5 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-xs text-slate-500 text-center">
                                  Bu gün için planlanan herhangi bir çalışma görevi bulunmamaktadır.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                  {dayTasks.map((task: any, tIdx: number) => {
                                    const meta = getTaskBadge(task);
                                    const IconComp = meta.icon;
                                    const isStudentTask = Boolean(task.isExtra || task.addedBy === 'student' || task.isStudentAdded || task.addedByStudent || task.createdBy === 'student');

                                    return (
                                      <div
                                        key={tIdx}
                                        className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs transition-all ${
                                          task.isDone
                                            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                                            : "bg-slate-950/60 border-slate-800/80 text-slate-400"
                                        }`}
                                      >
                                        {/* Checkbox */}
                                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                                          task.isDone
                                            ? "bg-emerald-500 border-emerald-500 text-slate-950"
                                            : "border-slate-700 text-transparent"
                                        }`}>
                                          <Check className="w-3 h-3" strokeWidth={3} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-1.5 flex-wrap mb-1">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span className="font-black uppercase text-[10px] text-indigo-300 tracking-wider">
                                                {task.subject || "DERS"}
                                              </span>
                                              <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${meta.style}`}>
                                                <IconComp className="w-2.5 h-2.5 shrink-0" />
                                                <span>{meta.label}</span>
                                              </span>
                                            </div>

                                            {isStudentTask && (
                                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                                <Sparkles size={9} className="shrink-0 text-amber-400" />
                                                <span>Öğrenci Ekledi</span>
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-white mt-0.5 font-semibold text-xs">{task.topic || "Konu belirtilmemiş"}</p>
                                          <p className="text-[11px] text-slate-400 mt-1">
                                            Hedef: <strong className="text-slate-200">{task.targetCount || '-'} {meta.unit}</strong>
                                            {(task.isDone || task.completedCount > 0) && (
                                              <span className="text-emerald-400 ml-1.5 font-semibold">
                                                | Yapılan: {task.completedCount || (task.isDone ? task.targetCount : 0)} {meta.unit}
                                              </span>
                                            )}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-slate-500 text-xs">
                        Haftalık görev kaydı bulunamadı.
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-3">
                <FileText className="mx-auto text-slate-500" size={40} />
                <p className="text-base font-semibold">Rapor Verisi Bulunamadı.</p>
                <p className="text-xs text-slate-500">Lütfen WhatsApp üzerinden gelen bağlantıyı kontrol ediniz.</p>
              </div>
            )}
          </div>
        ) : (
          /* PDF Viewer Tab */
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2 sm:p-4 shadow-2xl overflow-hidden relative">
            {cleanId ? (
              <>
                {isLoadingPdf && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 space-y-3">
                    <RefreshCw className="animate-spin text-purple-400" size={32} />
                    <p className="text-sm font-medium text-slate-300">Resmi PDF belgesi hazırlanıyor...</p>
                  </div>
                )}
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=0`}
                  title="FocusON Haftalık Veli Raporu PDF"
                  className="w-full h-[75vh] min-h-[600px] rounded-2xl border-0 bg-slate-950"
                  onLoad={() => setIsLoadingPdf(false)}
                />
              </>
            ) : (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <FileText className="mx-auto text-slate-500" size={40} />
                <p className="text-base font-semibold">Rapor Kimliği Bulunamadı.</p>
                <p className="text-xs text-slate-500">Lütfen WhatsApp mesajınızdaki bağlantıyı kontrol ediniz.</p>
              </div>
            )}
          </div>
        )}

        {/* Mobile Info Banner */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400">
            💡 Mobil cihazınızda (iOS / Android) PDF dosyasını kaydetmek için yukarıdaki{" "}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold underline">
              "PDF İndir"
            </a>{" "}
            butonuna dokunarak resmi raporu cihazınıza indirebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
