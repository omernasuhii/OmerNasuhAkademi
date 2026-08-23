import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FileText, Download, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react";

export default function PublicReportViewer() {
  const params = useParams();
  const rawReportId = params.reportId || params["*"] || "";
  const [isLoading, setIsLoading] = useState(true);

  let cleanId = rawReportId;
  if (cleanId.includes("rep_")) {
    cleanId = "rep_" + cleanId.split("rep_")[1];
  }
  cleanId = cleanId.split("?")[0].split("/")[0].trim();

  const pdfUrl = `/api/reports/pdf/${cleanId}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start py-6 px-4 sm:px-6">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 p-2 flex items-center justify-center">
              <img src="/images/ON-Logo.png" alt="ON Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck size={12} /> Onaylı Rapor
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
              <h1 className="text-xl font-black text-white mt-1">
                Haftalık Öğrenci Gelişim & Koçluk Raporu
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                FocusON Akademi Rehberlik & Koçluk Birimi
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`FocusON_Haftalik_Veli_Raporu_${cleanId}.pdf`}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
            >
              <Download size={18} />
              PDF İndir / Tam Ekran Aç
            </a>
            <Link
              to="/veli-girisi"
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-sm transition-all"
            >
              <ExternalLink size={18} />
              Veli Paneline Git
            </Link>
          </div>
        </div>

        {/* Embedded PDF Viewer Frame */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2 sm:p-4 shadow-2xl overflow-hidden relative">
          {cleanId ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-10 space-y-3">
                  <RefreshCw className="animate-spin text-purple-400" size={32} />
                  <p className="text-sm font-medium text-slate-300">Rapor PDF'i hazırlanıyor ve yükleniyor...</p>
                </div>
              )}
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=0`}
                title="FocusON Haftalık Veli Raporu PDF"
                className="w-full h-[75vh] min-h-[600px] rounded-2xl border-0 bg-slate-950"
                onLoad={() => setIsLoading(false)}
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

        {/* Mobile notice */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400">
            💡 Mobil cihazınızda (iOS / Android) PDF önizlemesi doğrudan görünmüyorsa yukarıdaki{" "}
            <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-purple-400 font-bold underline">
              "PDF İndir / Tam Ekran Aç"
            </a>{" "}
            butonuna dokunarak raporu cihazınızda görüntüleyebilir veya indirebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
