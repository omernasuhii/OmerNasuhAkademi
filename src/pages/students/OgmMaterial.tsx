import { ExternalLink, BookOpen, Layers, Lightbulb, FileSearch, Library, MonitorPlay } from 'lucide-react';

export default function OgmMaterial() {
  const materials = [
    {
      title: "Etkileşimli Kitaplar",
      description: "Zenginleştirilmiş, animasyon ve videolarla desteklenmiş dijital ders kitapları.",
      url: "https://ogmmateryal.eba.gov.tr/etkilesimli-kitap",
      icon: <BookOpen className="text-blue-400" size={32} />,
      gradient: "from-blue-600/20 to-blue-900/20",
      borderHover: "hover:border-blue-500/50"
    },
    {
      title: "Soru Bankası",
      description: "Tüm derslere ait binlerce kazanım odaklı test sorusu ve deneme sınavları.",
      url: "https://ogmmateryal.eba.gov.tr/soru-bankasi",
      icon: <Layers className="text-emerald-400" size={32} />,
      gradient: "from-emerald-600/20 to-emerald-900/20",
      borderHover: "hover:border-emerald-500/50"
    },
    {
      title: "Konu Özetleri",
      description: "Derslerin en kritik noktalarını içeren, hızlı tekrar yapmanızı sağlayan özet içerikler.",
      url: "https://ogmmateryal.eba.gov.tr/konu-ozetleri",
      icon: <FileSearch className="text-purple-400" size={32} />,
      gradient: "from-purple-600/20 to-purple-900/20",
      borderHover: "hover:border-purple-500/50"
    },
    {
      title: "3D Modeller & Deneyler",
      description: "Fen bilimleri ve diğer teknik dersler için görselleştirilmiş 3 boyutlu içerikler.",
      url: "https://ogmmateryal.eba.gov.tr/3d-modeller",
      icon: <Lightbulb className="text-orange-400" size={32} />,
      gradient: "from-orange-600/20 to-orange-900/20",
      borderHover: "hover:border-orange-500/50"
    },
    {
      title: "YKS Hazırlık Kitapları",
      description: "Alanında uzman öğretmenler tarafından hazırlanan özel YKS hazırlık fasikülleri.",
      url: "https://ogmmateryal.eba.gov.tr/yks-hazirlik-kitaplari",
      icon: <Library className="text-pink-400" size={32} />,
      gradient: "from-pink-600/20 to-pink-900/20",
      borderHover: "hover:border-pink-500/50"
    },
    {
      title: "Canlı Ders Videoları",
      description: "Önceki dönemlerde yayınlanmış veya güncel canlı ders kayıtları arşivi.",
      url: "https://ogmmateryal.eba.gov.tr/canli-ders-videolari",
      icon: <MonitorPlay className="text-indigo-400" size={32} />,
      gradient: "from-indigo-600/20 to-indigo-900/20",
      borderHover: "hover:border-indigo-500/50"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-blue-400 to-teal-400 bg-clip-text text-transparent inline-flex items-center gap-3">
          OGM Materyal Portal
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Milli Eğitim Bakanlığı Ortaöğretim Genel Müdürlüğü tarafından lise öğrencileri ve öğretmenleri için hazırlanan devasa bir dijital eğitim kütüphanesi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((item, idx) => (
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
              <span>Hemen İncele</span>
              <ExternalLink size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-12 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl p-6 text-center">
         <p className="text-emerald-300/80 text-sm">
           <strong>Kayıt ve Giriş:</strong> OGM Materyal portalına giriş yapmadan da birçok içeriğe erişebilirsiniz. Ancak kişisel çalışma takibi ve test sonuçları için EBA giriş imkanı da sunulmaktadır.
         </p>
      </div>
    </div>
  );
}
