import { ExternalLink, GraduationCap, Target, Video, FileText, Database, Layers } from 'lucide-react';

export default function MebiPlatform() {
  const features = [
    {
      title: "YKS Hazırlık",
      description: "YKS kapsamındaki tüm derslere ait konu anlatımları, soru çözüm videoları ve testler.",
      url: "https://mebi.eba.gov.tr/",
      icon: <Target className="text-blue-400" size={32} />,
      gradient: "from-blue-600/20 to-blue-900/20",
      borderHover: "hover:border-blue-500/50"
    },
    {
      title: "Okul Derslerine Destek",
      description: "9, 10, 11 ve 12. sınıf müfredatına uygun yardımcı kaynaklar ve konu pekiştirme içerikleri.",
      url: "https://mebi.eba.gov.tr/",
      icon: <GraduationCap className="text-emerald-400" size={32} />,
      gradient: "from-emerald-600/20 to-emerald-900/20",
      borderHover: "hover:border-emerald-500/50"
    },
    {
      title: "Etkileşimli İçerikler",
      description: "Öğrenmeyi kalıcı hale getiren simülasyonlar, animasyonlar ve dijital uygulamalar.",
      url: "https://mebi.eba.gov.tr/",
      icon: <Layers className="text-purple-400" size={32} />,
      gradient: "from-purple-600/20 to-purple-900/20",
      borderHover: "hover:border-purple-500/50"
    },
    {
      title: "Video Kütüphanesi",
      description: "Ders bazlı kategorize edilmiş, istenilen zamanda izlenebilen geniş video arşivi.",
      url: "https://mebi.eba.gov.tr/",
      icon: <Video className="text-indigo-400" size={32} />,
      gradient: "from-indigo-600/20 to-indigo-900/20",
      borderHover: "hover:border-indigo-500/50"
    },
    {
      title: "Dijital Yayınlar",
      description: "PDF formatında konu özetleri, çalışma kağıtları ve MEB ders kitapları desteği.",
      url: "https://mebi.eba.gov.tr/",
      icon: <FileText className="text-orange-400" size={32} />,
      gradient: "from-orange-600/20 to-orange-900/20",
      borderHover: "hover:border-orange-500/50"
    },
    {
      title: "Ölçme ve Değerlendirme",
      description: "Öğrenci gelişimini takip eden tarama testleri ve seviye belirleme uygulamaları.",
      url: "https://mebi.eba.gov.tr/",
      icon: <Database className="text-pink-400" size={32} />,
      gradient: "from-pink-600/20 to-pink-900/20",
      borderHover: "hover:border-pink-500/50"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent inline-flex items-center gap-3">
          MEBİ Bireysel Öğrenme Platformu
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Milli Eğitim Bakanlığı tarafından geliştirilen, öğrencilerin kendi hızlarında öğrenmelerine imkan tanıyan yeni nesil dijital öğrenme ekosistemi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 transition-all duration-300 ${item.borderHover} hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 group relative overflow-hidden`}
          >
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${item.gradient} blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="relative z-10 flex-1">
              <div className="bg-slate-800/80 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-700/50 group-hover:scale-110 transition-transform duration-300">
                {item.icon}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-3 tracking-tight">{item.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {item.description}
              </p>
            </div>
            
            <div className="relative z-10 mt-auto flex items-center gap-2 text-sm font-medium text-slate-300 group-hover:text-white transition-colors border-t border-slate-800/50 pt-4">
              <span>Platforma Git (MEBİ)</span>
              <ExternalLink size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-12 bg-blue-900/10 border border-blue-900/30 rounded-2xl p-6 text-center">
         <p className="text-blue-300/80 text-sm">
           <strong>Not:</strong> MEBİ platformu, lise öğrencilerinin akademik başarılarını destekleyen kapsamlı araçlar sunar. EBA şifrenizle giriş yaparak size özel tanımlanan içeriklere anında ulaşabilirsiniz.
         </p>
      </div>
    </div>
  );
}
