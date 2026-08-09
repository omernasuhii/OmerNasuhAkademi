import React from "react";
import { useParams, Link } from "react-router-dom";
import { FileText, Download, ExternalLink, ShieldCheck } from "lucide-react";

export default function PublicReportViewer() {
  const params = useParams();
  const rawReportId = params.reportId || params["*"] || "";

  let cleanId = rawReportId;
  if (cleanId.includes("rep_")) {
    cleanId = "rep_" + cleanId.split("rep_")[1];
  }
  cleanId = cleanId.split("?")[0].split("/")[0];

  const pdfUrl = `/api/reports/pdf/${cleanId}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-start py-8 px-4 sm:px-6">
      <div className="w-full max-w-5xl space-y-6">
        {/* Header Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                  <ShieldCheck size={12} /> Onaylı Rapor
                </span>
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
              download
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 transition-all"
            >
              <Download size={18} />
              PDF İndir / Aç
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

        {/* Embedded PDF Viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-2 sm:p-4 shadow-2xl overflow-hidden">
          {cleanId ? (
            <iframe
              src={`${pdfUrl}#toolbar=1`}
              title="FocusON Haftalık Veli Raporu PDF"
              className="w-full h-[75vh] min-h-[600px] rounded-2xl border-0 bg-slate-950"
            />
          ) : (
            <div className="py-20 text-center text-slate-400">
              Rapor Kimliği Bulunamadı.
            </div>
          )}
        </div>

        {/* Mobile notice */}
        <p className="text-center text-xs text-slate-500">
          Mobil cihazınızda PDF önizlemesi doğrudan açılmıyorsa yukarıdaki{" "}
          <strong className="text-purple-400">"PDF İndir / Aç"</strong> butonunu
          kullanarak raporu cihazınıza indirebilirsiniz.
        </p>
      </div>
    </div>
  );
}
