import { useState } from 'react';
import { Search, Book, Briefcase, FileText, ExternalLink } from 'lucide-react';

export default function JobGuide() {
  const [activeTab, setActiveTab] = useState<'search' | 'iskur'>('search');

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent flex items-center gap-3">
          <Briefcase className="text-teal-400" />
          Meslek Rehberi
        </h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          Geleceğinizi şekillendirirken size en uygun mesleği keşfedin. İŞKUR'un resmi meslek rehberi kaynaklarına buradan erişebilirsiniz.
        </p>
      </div>

      <div className="flex gap-4 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab('search')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 ${
            activeTab === 'search'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          Seçili Meslekler (Hızlı Bakış)
        </button>
        <button
          onClick={() => setActiveTab('iskur')}
          className={`px-6 py-3 font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'iskur'
              ? 'border-teal-500 text-teal-400'
              : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          İŞKUR Meslek Sistemi <ExternalLink size={14} />
        </button>
      </div>

      {activeTab === 'search' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example professions that we can manually curate or add */}
          {[
            {
              title: "Bilgisayar Mühendisi",
              desc: "Yazılım ve donanım geliştirme, sistem analizi.",
              iskurId: "0" // Placeholder
            },
            {
              title: "Tıp Doktoru",
              desc: "İnsan sağlığını koruma, hastalıkları teşhis ve tedavi etme.",
              iskurId: "0"
            },
            {
              title: "Psikolog",
              desc: "İnsan davranışlarını ve zihinsel süreçlerini inceleme.",
              iskurId: "0"
            },
            {
              title: "Hukukçu (Avukat/Hakim)",
              desc: "Adalet sisteminde birey ve toplum haklarını savunma.",
              iskurId: "0"
            },
            {
              title: "Endüstri Mühendisi",
              desc: "Üretim ve hizmet süreçlerini optimize etme.",
              iskurId: "0"
            },
            {
              title: "Mimarlık",
              desc: "Yaşam alanlarını tasarlama ve inşa süreçlerini yönetme.",
              iskurId: "0"
            }
          ].map((job, idx) => (
            <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl hover:border-teal-500/50 transition-colors group">
              <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{job.title}</h3>
              <p className="text-slate-400 text-sm mb-6">{job.desc}</p>
              
              <a 
                href="https://esube.iskur.gov.tr/Meslek/MeslekleriTaniyalim.aspx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-teal-400 hover:text-teal-300 text-sm font-medium"
              >
                <FileText size={16} />
                <span>İŞKUR Detaylarında Ara</span>
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/50 p-2 rounded-2xl border border-slate-800 h-[2000px] overflow-hidden relative">
           <div className="absolute top-0 left-0 right-0 bg-slate-800 text-slate-300 text-xs py-2 px-4 flex justify-between items-center z-10">
              <span className="flex items-center gap-2"><Book size={14}/> İŞKUR Sistemi bağlantısı iframe içerisinde gösterilmektedir.</span>
              <a href="https://esube.iskur.gov.tr/Meslek/MeslekleriTaniyalim.aspx" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline flex items-center gap-1">Yeni Sekmede Aç <ExternalLink size={12}/></a>
           </div>
           <iframe 
             src="https://esube.iskur.gov.tr/Meslek/MeslekleriTaniyalim.aspx"
             className="w-full h-full bg-white mt-8 rounded-b-xl"
             title="İŞKUR Meslek Rehberi"
           />
        </div>
      )}
    </div>
  );
}
