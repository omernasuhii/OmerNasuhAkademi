import { ExternalLink, University, GraduationCap, BarChart, Calculator, Map, Building2 } from 'lucide-react';

export default function YokAtlas() {
  const categories = [
    {
      title: "Lisans Atlası",
      description: "4 yıllık lisans programlarına yerleşenlerin detaylı istatistiklerini, net ortalamalarını ve profillerini inceleyin.",
      url: "https://yokatlas.yok.gov.tr/lisans-anasayfa.php",
      icon: <GraduationCap className="text-blue-400" size={32} />,
      gradient: "from-blue-600/20 to-blue-900/20",
      borderHover: "hover:border-blue-500/50"
    },
    {
      title: "Önlisans Atlası",
      description: "2 yıllık önlisans programlarına yerleşenlerin detaylı istatistikleri ve profil profilleri.",
      url: "https://yokatlas.yok.gov.tr/onlisans-anasayfa.php",
      icon: <University className="text-emerald-400" size={32} />,
      gradient: "from-emerald-600/20 to-emerald-900/20",
      borderHover: "hover:border-emerald-500/50"
    },
    {
      title: "YKS Net Sihirbazı",
      description: "Geçen yıl bölümlere yerleşen son kişinin net sayılarını görün, hedefinizi belirleyin.",
      url: "https://yokatlas.yok.gov.tr/netler.php",
      icon: <Calculator className="text-purple-400" size={32} />,
      gradient: "from-purple-600/20 to-purple-900/20",
      borderHover: "hover:border-purple-500/50"
    },
    {
      title: "Meslek Atlası",
      description: "Meslek bazında üniversitelerin rekabet durumunu ve sıralamalarını karşılaştırın.",
      url: "https://yokatlas.yok.gov.tr/meslek-anasayfa.php",
      icon: <Map className="text-orange-400" size={32} />,
      gradient: "from-orange-600/20 to-orange-900/20",
      borderHover: "hover:border-orange-500/50"
    },
    {
      title: "Tercih Sihirbazı",
      description: "Puan türü, kontenjan, sıralama gibi kriterlere göre tüm bölümleri listeleyip filtreleyin.",
      url: "https://yokatlas.yok.gov.tr/tercih-sihirbazi-t4-tablo.php",
      icon: <BarChart className="text-pink-400" size={32} />,
      gradient: "from-pink-600/20 to-pink-900/20",
      borderHover: "hover:border-pink-500/50"
    },
    {
      title: "Üniversitelerimiz",
      description: "Türkiye'deki tüm üniversitelerin genel bilgilerine, fakülte ve bölüm listelerine ulaşın.",
      url: "https://yokatlas.yok.gov.tr/universite.php",
      icon: <Building2 className="text-indigo-400" size={32} />,
      gradient: "from-indigo-600/20 to-indigo-900/20",
      borderHover: "hover:border-indigo-500/50"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent inline-flex items-center gap-3">
          YÖK Atlas Rehberi
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          YÖK Atlas sistemi, resmi YÖK veritabanını kullanarak hedeflerinize uygun üniversite ve bölümleri analiz etmenizi sağlar. Güvenlik politikaları gereği veriler yeni sekmede açılacaktır.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, idx) => (
          <a
            key={idx}
            href={cat.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 transition-all duration-300 ${cat.borderHover} hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 group relative overflow-hidden`}
          >
            {/* Background Gradient Blob */}
            <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full bg-gradient-to-br ${cat.gradient} blur-2xl group-hover:scale-150 transition-transform duration-500`}></div>
            
            <div className="relative z-10 flex-1">
              <div className="bg-slate-800/80 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-slate-700/50 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              
              <h2 className="text-xl font-bold text-white mb-3 tracking-tight">{cat.title}</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {cat.description}
              </p>
            </div>
            
            <div className="relative z-10 mt-auto flex items-center gap-2 text-sm font-medium text-slate-300 group-hover:text-white transition-colors border-t border-slate-800/50 pt-4">
              <span>Sisteme Git</span>
              <ExternalLink size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-12 bg-blue-900/10 border border-blue-900/30 rounded-2xl p-6 text-center">
         <p className="text-blue-300/80 text-sm">
           Tüm veriler T.C. Yükseköğretim Kurulu (YÖK) tarafından sağlanmaktadır. YÖK Atlas, YKS tercihlerinde adaylara rehberlik amacıyla hazırlanmış resmi bir kaynak olup, her yıl sınav sonuçları açıklandıktan sonra güncellenir.
         </p>
      </div>
    </div>
  );
}
