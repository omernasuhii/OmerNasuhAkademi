import { ExternalLink, Home, FileCheck, CreditCard, HelpCircle, MapPin, Search } from 'lucide-react';

export default function KykDorms() {
  const categories = [
    {
      title: "Yurt Başvurusu",
      description: "e-Devlet üzerinden güncel dönem KYK yurt başvurunuzu yapabilirsiniz.",
      url: "https://www.turkiye.gov.tr/gsb-yurt-basvurusu",
      icon: <FileCheck className="text-emerald-400" size={32} />,
      gradient: "from-emerald-600/20 to-emerald-900/20",
      borderHover: "hover:border-emerald-500/50"
    },
    {
      title: "Başvuru Sonuçları",
      description: "KYK yurt başvuru ve yerleştirme sonuçlarınızı e-Devlet kapısından sorgulayın.",
      url: "https://www.turkiye.gov.tr/gsb-yurt-basvuru-sonucu-sorgulama",
      icon: <Search className="text-blue-400" size={32} />,
      gradient: "from-blue-600/20 to-blue-900/20",
      borderHover: "hover:border-blue-500/50"
    },
    {
      title: "Yurt Müdürlükleri (İl Şube)",
      description: "Tüm Türkiye'deki güncel KYK İl Müdürlükleri iletişim ve adres bilgileri.",
      url: "https://kygm.gsb.gov.tr/YurtMudurlukleri",
      icon: <MapPin className="text-orange-400" size={32} />,
      gradient: "from-orange-600/20 to-orange-900/20",
      borderHover: "hover:border-orange-500/50"
    },
    {
      title: "Kredi ve Burs Başvurusu",
      description: "Öğrenim Kredisi ve Burs başvurularınızı da yine e-Devlet KYGM sayfasından yapabilirsiniz.",
      url: "https://www.turkiye.gov.tr/kyk-krediburs-basvurusu",
      icon: <Home className="text-pink-400" size={32} />,
      gradient: "from-pink-600/20 to-pink-900/20",
      borderHover: "hover:border-pink-500/50"
    },
    {
      title: "Kredi ve Burs Sonuçları",
      description: "Öğrenim Kredisi ve Burs başvuru sonuçlarınızı e-Devlet kapısından sorgulayın.",
      url: "https://www.turkiye.gov.tr/genclik-ve-spor-burs-ogrenim-kredisi-basvuru-sonucu-sorgulama",
      icon: <CreditCard className="text-purple-400" size={32} />,
      gradient: "from-purple-600/20 to-purple-900/20",
      borderHover: "hover:border-purple-500/50"
    },
    {
      title: "Sıkça Sorulan Sorular",
      description: "Yurt başvuru şartları, kimlerin başvurabileceği ve kurallar hakkındaki resmi SSS sayfası.",
      url: "https://kygm.gsb.gov.tr/Sayfalar/2678/3200/sikca-sorulan-sorular-yurt.aspx",
      icon: <HelpCircle className="text-indigo-400" size={32} />,
      gradient: "from-indigo-600/20 to-indigo-900/20",
      borderHover: "hover:border-indigo-500/50"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent inline-flex items-center gap-3">
          KYK Yurtları ve Barınma
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Gençlik ve Spor Bakanlığı (GSB) Kredi ve Yurtlar Genel Müdürlüğü hizmetlerine nhanh ve güvenli bir şekilde erişin. Tüm başvurular resmi e-Devlet kapısı üzerinden yapılmaktadır.
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
      
      <div className="mt-12 bg-emerald-900/10 border border-emerald-900/30 rounded-2xl p-6 text-center">
         <p className="text-emerald-300/80 text-sm">
           Dikkat: Başvurular GSB resmi duyurusu ile açılmaktadır. Sahte başvuru sitelerine itibar etmeyiniz; başvurularınızı yalnızca <strong>turkiye.gov.tr</strong> adresi üzerinden yapınız.
         </p>
      </div>
    </div>
  );
}
