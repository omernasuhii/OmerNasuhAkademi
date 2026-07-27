import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Building2, 
  GraduationCap, 
  FileText, 
  Calendar, 
  User, 
  Award,
  Download,
  Share2
} from "lucide-react";
import { Department } from "../../pages/students/TercihRobotu";

interface PrintablePreferenceViewProps {
  isOpen: boolean;
  onClose: () => void;
  preferenceList: (Department | null)[];
  basketList: Department[];
  source?: "list" | "basket";
}

export const PrintablePreferenceView: React.FC<PrintablePreferenceViewProps> = ({
  isOpen,
  onClose,
  preferenceList,
  basketList,
  source = "list"
}) => {
  const [studentName, setStudentName] = useState("Öğrenci Adı Soyadı");
  const [studentScore, setStudentScore] = useState("");
  const [studentRank, setStudentRank] = useState("");
  const [targetPointType, setTargetPointType] = useState("SAY");
  const [currentSource, setCurrentSource] = useState<"list" | "basket">(source);

  if (!isOpen) return null;

  // Hangi liste gösterilecek?
  const displayItems: { slotNumber: number; dept: Department | null }[] = 
    currentSource === "list"
      ? preferenceList.map((dept, idx) => ({ slotNumber: idx + 1, dept }))
      : basketList.map((dept, idx) => ({ slotNumber: idx + 1, dept }));

  const validDepts = displayItems.map((i) => i.dept).filter(Boolean) as Department[];

  // Helper functions for 2026 Quota, 2025 Quota Difference, and 2025 Rank
  const parseNum = (val: any): number | null => {
    if (val === null || val === undefined || val === "") return null;
    let rawVal = typeof val === "object" && val !== null ? val.val : val;
    if (rawVal === null || rawVal === undefined || rawVal === "") return null;
    const strVal = String(rawVal).split("+")[0];
    const n = Number(strVal);
    return !isNaN(n) && n >= 0 ? n : null;
  };

  const getQuotaInfo = (dept: Department) => {
    let q2026: number | null = parseNum(dept.quota) ?? parseNum((dept as any).quota2026) ?? parseNum((dept as any).kontenjan2026) ?? parseNum((dept as any).kontenjan);
    let q2025: number | null = parseNum(dept.lastQuota) ?? parseNum((dept as any).quota2025) ?? parseNum((dept as any).kontenjan2025);

    if (Array.isArray(dept.departmentPoints) && dept.departmentPoints.length > 0) {
      const p2026 = dept.departmentPoints.find((p) => String(p.year) === "2026");
      if (p2026) {
        const val = parseNum(p2026.quota) ?? parseNum(p2026.lastQuota) ?? parseNum((p2026 as any).kontenjan) ?? parseNum(p2026.settled);
        if (val !== null) q2026 = val;
      }
      
      const pastPoints = [...dept.departmentPoints]
        .filter((p) => String(p.year) !== "2026")
        .sort((a, b) => Number(b.year) - Number(a.year));

      if (pastPoints.length > 0) {
        const val = parseNum(pastPoints[0].quota) ?? parseNum(pastPoints[0].lastQuota) ?? parseNum((pastPoints[0] as any).kontenjan) ?? parseNum(pastPoints[0].settled);
        if (val !== null) q2025 = val;
      }
    }

    let diff: number | null = null;
    if (q2026 !== null && q2025 !== null) {
      diff = q2026 - q2025;
    }

    return { q2026, q2025, diff };
  };

  const getRank2025 = (dept: Department): number | null => {
    if (Array.isArray(dept.departmentPoints) && dept.departmentPoints.length > 0) {
      const p2025 = dept.departmentPoints.find((p) => String(p.year) === "2025");
      if (p2025) {
        const val = parseNum(p2025.basePointOrder) ?? parseNum(p2025.lastBasePointOrder);
        if (val !== null) return val;
      }
      const sortedPoints = [...dept.departmentPoints]
        .filter((p) => String(p.year) !== "2026")
        .sort((a, b) => Number(b.year) - Number(a.year));
      if (sortedPoints.length > 0) {
        const val = parseNum(sortedPoints[0].basePointOrder) ?? parseNum(sortedPoints[0].lastBasePointOrder);
        if (val !== null) return val;
      }
    }
    return parseNum(dept.lastBasePointOrder);
  };

  const getPoint2025 = (dept: Department): number | string | null => {
    if (Array.isArray(dept.departmentPoints) && dept.departmentPoints.length > 0) {
      const p2025 = dept.departmentPoints.find((p) => String(p.year) === "2025");
      if (p2025) {
        const val = p2025.basePoint ?? p2025.lastBasePoint;
        if (val !== null && val !== undefined) return val;
      }
      const sortedPoints = [...dept.departmentPoints]
        .filter((p) => String(p.year) !== "2026")
        .sort((a, b) => Number(b.year) - Number(a.year));
      if (sortedPoints.length > 0) {
        const val = sortedPoints[0].basePoint ?? sortedPoints[0].lastBasePoint;
        if (val !== null && val !== undefined) return val;
      }
    }
    if (dept.lastBasePoint !== null && dept.lastBasePoint !== undefined) {
      return dept.lastBasePoint;
    }
    return null;
  };

  // Sıralama İstatistikleri (2025 Başarı Sırasına Göre)
  const ranks = validDepts
    .map((d) => getRank2025(d))
    .filter((r): r is number => typeof r === "number" && r > 0);

  const minRank = ranks.length > 0 ? Math.min(...ranks) : 0;
  const maxRank = ranks.length > 0 ? Math.max(...ranks) : 0;
  const avgRank = ranks.length > 0 ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : 0;

  const handlePrint = () => {
    window.print();
  };

  const currentDate = new Date().toLocaleDateString("tr-TR", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return createPortal(
    <div className="print-portal-container fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/90 backdrop-blur-md flex flex-col items-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:inset-auto">
      
      {/* CSS For Print Rules - Strictly isolate the selected printable area */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }

          /* Hide all sibling elements of the print portal container */
          body > *:not(.print-portal-container) {
            display: none !important;
          }

          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Inter', system-ui, sans-serif !important;
            font-size: 11px !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
          }

          .print-portal-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            background-color: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
            box-shadow: none !important;
          }

          /* Hide UI control headers and non-printable elements */
          .no-print,
          .no-print * {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .printable-document {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }

          .printable-document * {
            color: #0f172a !important;
          }

          table {
            border-collapse: collapse !important;
            width: 100% !important;
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 8px 8px !important;
            color: #0f172a !important;
            vertical-align: middle !important;
          }

          th {
            background-color: #0f172a !important;
            color: #ffffff !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            font-size: 10px !important;
          }
          
          th * {
            color: #ffffff !important;
          }

          tbody tr:nth-child(even) {
            background-color: #f8fafc !important;
          }

          .print-header {
            border-bottom: 3px solid #0f172a !important;
            padding-bottom: 16px !important;
            margin-bottom: 24px !important;
          }
          
          .print-info-box {
            background-color: #f8fafc !important;
            border: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>

      {/* Control Header Bar (Hidden in Print) */}
      <div className="no-print w-full max-w-5xl mb-4 bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-100 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              YKS Tercih Listesi Yazdırma & PDF Görünümü
            </h3>
            <p className="text-xs text-slate-400">
              Resmi formatta basılmaya veya PDF olarak kaydedilmeye hazır tercih belgeniz.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <div className="bg-slate-950 p-1 rounded-xl border border-white/10 flex items-center text-xs">
            <button
              onClick={() => setCurrentSource("list")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                currentSource === "list" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Tercih Listesi ({preferenceList.filter(Boolean).length})
            </button>
            <button
              onClick={() => setCurrentSource("basket")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                currentSource === "basket" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Tercih Sepeti ({basketList.length})
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Yazdır / PDF İndir
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PRINTABLE DOCUMENT CARD */}
      <div className="printable-document w-full max-w-5xl bg-slate-900 border border-white/10 rounded-2xl p-6 sm:p-10 text-slate-100 shadow-2xl space-y-6">
        
        {/* Document Header */}
        <div className="print-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-6">
            <img src="/images/ON-Logo.png" alt="ON Logo" className="h-14 object-contain print:h-16" />
            <div className="space-y-1 border-l border-white/10 print:border-slate-300 pl-6">
              <h2 className="text-xl sm:text-2xl font-black text-white print:text-slate-900 tracking-tight uppercase">
                2026 YKS Tercih Formu
              </h2>
              <p className="text-sm text-slate-400 print:text-slate-600 font-medium">
                Yükseköğretim Kurumları Sınavı (YKS) Resmi Tercih Taslağı
              </p>
            </div>
          </div>

          <div className="print-info-box text-right space-y-1.5 text-xs text-slate-400 print:text-slate-700 bg-slate-950/50 print:bg-slate-50 p-4 rounded-xl border border-white/5 print:border-slate-200">
            <div className="flex items-center gap-2 justify-end font-medium">
              <Calendar className="w-4 h-4 text-blue-400 print:text-blue-600" />
              <span>Tarih:</span> <strong className="text-slate-200 print:text-slate-900">{currentDate}</strong>
            </div>
            <div className="flex items-center gap-2 justify-end font-medium">
              <FileText className="w-4 h-4 text-emerald-400 print:text-emerald-600" />
              <span>Belge Tipi:</span> <strong className="text-slate-200 print:text-slate-900">YKS Tercih Çalışması</strong>
            </div>
            <div className="flex items-center gap-2 justify-end font-medium">
              <Award className="w-4 h-4 text-amber-400 print:text-amber-600" />
              <span>Toplam Tercih:</span> <strong className="text-blue-400 print:text-blue-700">{validDepts.length} Program</strong>
            </div>
          </div>
        </div>

        {/* Student Information Fields (Editable in UI, Static in Print) */}
        <div className="print-info-box grid grid-cols-1 sm:grid-cols-3 gap-6 p-5 bg-slate-950/60 print:bg-slate-50 rounded-xl border border-white/5 print:border-slate-200">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest block">
              Öğrenci Adı Soyadı
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full bg-slate-900 print:bg-transparent border border-white/10 print:border-none rounded-lg px-3 py-2 text-sm font-bold text-white print:text-slate-900 focus:outline-none placeholder:text-slate-500"
              placeholder="Öğrenci Adı Soyadı Giriniz"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest block">
              Hedef Puan Türü / Başarı Sıralaması
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetPointType}
                onChange={(e) => setTargetPointType(e.target.value)}
                className="w-16 bg-slate-900 print:bg-transparent border border-white/10 print:border-none rounded-lg px-2 py-2 text-sm font-bold text-blue-400 print:text-blue-700 focus:outline-none text-center uppercase"
              />
              <span className="text-slate-500 print:text-slate-400 font-medium">/</span>
              <input
                type="text"
                value={studentRank}
                onChange={(e) => setStudentRank(e.target.value)}
                placeholder="Örn: 24.500"
                className="flex-1 bg-slate-900 print:bg-transparent border border-white/10 print:border-none rounded-lg px-3 py-2 text-sm font-bold text-white print:text-slate-900 focus:outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 print:text-slate-500 uppercase tracking-widest block">
              Tercih Aralığı (Sıralamalar)
            </label>
            <div className="text-sm font-bold text-emerald-400 print:text-emerald-700 py-2 px-3">
              {minRank > 0 ? `${minRank.toLocaleString("tr-TR")} - ${maxRank.toLocaleString("tr-TR")}` : "Tercih Eklendiğinde Hesaplanır"}
            </div>
          </div>
        </div>

        {/* Preference Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 print:bg-slate-200 border-b border-white/10 print:border-slate-400 text-slate-300 print:text-black uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3 text-center w-12 font-bold">Sıra</th>
                <th className="py-2.5 px-3 font-bold w-28">YÖP Kodu</th>
                <th className="py-2.5 px-3 font-bold">Üniversite Adı</th>
                <th className="py-2.5 px-3 font-bold">Bölüm & Program</th>
                <th className="py-2.5 px-3 font-bold w-24">Şehir / Tür</th>
                <th className="py-2.5 px-3 text-center font-bold w-16">P.Türü</th>
                <th className="py-2.5 px-3 text-center font-bold w-24">2026 Kontenjan</th>
                <th className="py-2.5 px-3 text-right font-bold w-28">2025 Başarı Sırası</th>
                <th className="py-2.5 px-3 text-right font-bold w-24">2025 Taban Puan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 print:divide-slate-300">
              {displayItems.map(({ slotNumber, dept }) => {
                return (
                  <tr
                    key={`print-row-${slotNumber}`}
                    className={
                      dept
                        ? "hover:bg-slate-800/30 print:hover:bg-transparent"
                        : "opacity-40 print:opacity-20"
                    }
                  >
                    <td className="py-2.5 px-3 text-center font-black text-blue-400 print:text-black">
                      {slotNumber}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-slate-300 print:text-black">
                      {dept?.departmentCode || "-"}
                    </td>

                    <td className="py-2.5 px-3 font-bold text-white print:text-black">
                      {dept?.universityName || dept?.university?.name || "-"}
                    </td>

                    <td className="py-2.5 px-3 font-semibold text-blue-200 print:text-black">
                      {dept ? (
                        <div>
                          <div>{dept.name}</div>
                          {dept.feeType && (
                            <span className="text-[10px] text-emerald-400 print:text-slate-700 font-normal">
                              ({dept.feeType})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="italic text-slate-600 print:text-slate-400">Boş Tercih Slotu</span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-slate-300 print:text-black">
                      {dept ? (
                        <div>
                          <div>{dept.university?.city?.name || dept.city?.name || "-"}</div>
                          <div className="text-[10px] text-slate-500 print:text-slate-700">{dept.typeName || dept.university?.typeName || "-"}</div>
                        </div>
                      ) : "-"}
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold text-blue-400 print:text-black">
                      {dept?.pointName || "-"}
                    </td>

                    <td className="py-2.5 px-3 text-center text-slate-300 print:text-black font-medium">
                      {dept ? (
                        (() => {
                          const { q2026, diff } = getQuotaInfo(dept);
                          if (q2026 !== null && q2026 !== undefined) {
                            return (
                              <span className="font-semibold flex items-center justify-center gap-1">
                                {q2026}
                                {diff !== null && diff !== 0 && (
                                  <span className={`text-[10px] font-bold ${diff > 0 ? "text-emerald-400 print:text-green-700" : "text-rose-400 print:text-red-700"}`}>
                                    ({diff > 0 ? `+${diff}` : diff})
                                  </span>
                                )}
                              </span>
                            );
                          }
                          return "-";
                        })()
                      ) : "-"}
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold text-slate-100 print:text-black">
                      {dept ? (
                        (() => {
                          const r2025 = getRank2025(dept);
                          return r2025 ? r2025.toLocaleString("tr-TR") : "-";
                        })()
                      ) : "-"}
                    </td>

                    <td className="py-2.5 px-3 text-right text-slate-300 print:text-black">
                      {dept ? (
                        (() => {
                          const pt2025 = getPoint2025(dept);
                          return pt2025 !== null ? pt2025 : "-";
                        })()
                      ) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="pt-6 mt-8 border-t border-white/10 print:border-slate-300 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 print:text-slate-600">
            <div className="space-y-1 max-w-xl">
              <p className="font-bold text-slate-300 print:text-slate-800">
                * ÖSYM YKS Tercih Rehberliği Bilgilendirmesi:
              </p>
              <p className="text-[10px] print:text-[11px] leading-relaxed">
                Bu belge FocusON Akademi Tercih Robotu tarafından bilgilendirme amacıyla hazırlanmıştır. Resmi tercih bildirim işleminizi ÖSYM Aday İşlemleri Sistemi (https://ais.osym.gov.tr) üzerinden onaylamayı unutmayınız.
              </p>
            </div>
            <div className="text-right text-[10px] print:text-[11px] font-medium text-slate-500 print:text-slate-600 shrink-0 space-y-0.5">
              <p>FocusON Akademi Tercih Sistemi</p>
              <p className="text-blue-400 print:text-blue-600 font-bold">omernasuhakademi.com</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 print:from-blue-50 print:to-slate-50 rounded-xl p-5 border border-blue-500/20 print:border-blue-200 shadow-sm print:shadow-inner mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-blue-500/20 print:bg-blue-100 p-3 rounded-xl shrink-0">
                <GraduationCap className="w-8 h-8 text-blue-400 print:text-blue-600" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-white print:text-slate-900">Sen de FocusON Akademi Ailesine Katıl! 🚀</h3>
                <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                  YKS hazırlık sürecinde yapay zeka destekli analizler, kişiselleştirilmiş programlar ve deneme takip sistemiyle bir adım öne geç. Koçun varsa, FocusON Akademi sistemini kullanarak sürecini çok daha profesyonel yönetmesini isteyebilirsin.
                </p>
              </div>
              <div className="shrink-0 pt-2 sm:pt-0">
                <a href="https://omernasuhakademi.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 print:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors shadow-md">
                  Sistemi Keşfet
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
