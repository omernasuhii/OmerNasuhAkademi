import { ExternalLink, BookOpen, GraduationCap, Target, Heart, Footprints, Scale } from 'lucide-react';

export default function MebCurriculum() {
  const sections = [
    {
      title: "Öğretim Programları",
      description: "Okul öncesinden liseye kadar tüm kademelerdeki yeni müfredat programlarını ve ders içeriklerini inceleyin.",
      url: "https://tymm.meb.gov.tr/ogretim-programlari/ortaogretim",
      icon: <BookOpen className="text-amber-400" size={32} />,
      gradient: "from-amber-600/20 to-amber-900/20",
      borderHover: "hover:border-amber-500/50"
    },
    {
      title: "Öğrenci Profili",
      description: "Yetkin ve erdemli insan yetiştirmeyi hedefleyen yeni eğitim vizyonundaki öğrenci özelliklerini keşfedin.",
      url: "https://tymm.meb.gov.tr/ogrenci-profili",
      icon: <GraduationCap className="text-blue-400" size={32} />,
      gradient: "from-blue-600/20 to-blue-900/20",
      borderHover: "hover:border-blue-500/50"
    },
    {
      title: "Beceriler Çerçevesi",
      description: "Kavramsal, fiziksel ve sosyal-duygusal becerilerin eğitim süreçlerine nasıl entegre edildiğini görün.",
      url: "https://tymm.meb.gov.tr/",
      icon: <Target className="text-emerald-400" size={32} />,
      gradient: "from-emerald-600/20 to-emerald-900/20",
      borderHover: "hover:border-emerald-500/50"
    },
    {
      title: "Erdem-Değer-Eylem Çerçevesi",
      description: "Eğitimin temelini oluşturan değerler, erdemler ve eylemler arasındaki bütüncül ilişkiyi inceleyin.",
      url: "https://tymm.meb.gov.tr/",
      icon: <Heart className="text-red-400" size={32} />,
      gradient: "from-red-600/20 to-red-900/20",
      borderHover: "hover:border-red-500/50"
    },
    {
      title: "Temel Yaklaşım",
      description: "Türkiye Yüzyılı Maarif Modeli'nin felsefesi, bütüncül eğitim yaklaşımı ve yapılandırmacı temelleri.",
      url: "https://tymm.meb.gov.tr/temel-yaklasim",
      icon: <Scale className="text-purple-400" size={32} />,
      gradient: "from-purple-600/20 to-purple-900/20",
      borderHover: "hover:border-purple-500/50"
    },
    {
      title: "Yıllık Planlar",
      description: "Yeni müfredatın okullarda uygulanması, ölçme-değerlendirme süreçleri ve geçiş planlamaları.",
      url: "https://tymm.meb.gov.tr/taslak-cerceve-planlari",
      icon: <Footprints className="text-orange-400" size={32} />,
      gradient: "from-orange-600/20 to-orange-900/20",
      borderHover: "hover:border-orange-500/50"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10 text-center space-y-4">
        <div className="inline-block px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold tracking-wide mb-2 uppercase">
          Yeni Müfredat Sistemi
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent leading-tight">
          Türkiye Yüzyılı Maarif Modeli
        </h1>
        <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
          MEB tarafından hayata geçirilen, öğrenciyi merkeze alan, beceri odaklı ve milli-manevi değerlerle harmanlanmış bütüncül eğitim modeline dair tüm detaylara buradan ulaşabilirsiniz.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex flex-col h-full bg-slate-900/50 border border-slate-800 rounded-2xl p-6 transition-all duration-300 ${item.borderHover} hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 group relative overflow-hidden`}
          >
            {/* Background Gradient Blob */}
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
              <span>Resmi Sayfayı İncele</span>
              <ExternalLink size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-12 bg-amber-900/10 border border-amber-900/30 rounded-2xl p-8 max-w-4xl mx-auto">
         <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="shrink-0 w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
               <BookOpen className="text-amber-400" size={32} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-white mb-1">Müfredatın Temeli: Bütüncül Eğitim</h3>
               <p className="text-amber-300/80 text-sm leading-relaxed">
                  Zihinsel, sosyal, duygusal, fiziksel ve ruhsal gelişimin bir bütün olarak ele alındığı yeni modelde; sadece bilgi aktarımı değil, bilgiyi beceriye dönüştüren ve değerlerle anlamlandıran bir süreç hedeflenmektedir.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

