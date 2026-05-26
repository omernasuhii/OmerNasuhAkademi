import { ExternalLink, BookOpen, Target, BrainCircuit, PlayCircle, ClipboardList, PenTool } from 'lucide-react';

export default function EbaAcademicSupport() {
  const features = [
    {
      title: "Akıllı Çalışma Planı",
      description: "Yapay zeka destekli sistem ile hedefinize ve seviyenize uygun kişiselleştirilmiş çalışma programı oluşturun.",
      url: "https://akademikdestek.eba.gov.tr/",
      icon: <BrainCircuit className="text-purple-400" size={32} />,
      gradient: "from-purple-600/20 to-purple-900/20",
      borderHover: "hover:border-purple-500/50"
    },
    {
      title: "Deneme Sınavları",
      description: "Türkiye geneli çevrimiçi deneme sınavlarına katılın, eksiklerinizi anında görün ve sıralamanızı takip edin.",
      url: "https://akademikdestek.eba.gov.tr/",
      icon: <PenTool className="text-blue-400" size={32} />,
      gradient: "from-blue-600/20 to-blue-900/20",
      borderHover: "hover:border-blue-500/50"
    },
    {
      title: "Konu Anlatımları",
      description: "MEB müfredatına tam uyumlu, uzman öğretmenler tarafından hazırlanan konu anlatım videoları ve özetler.",
      url: "https://akademikdestek.eba.gov.tr/",
      icon: <PlayCircle className="text-emerald-400" size={32} />,
      gradient: "from-emerald-600/20 to-emerald-900/20",
      borderHover: "hover:border-emerald-500/50"
    },
    {
      title: "Hedef Belirleme",
      description: "Hayalinizdeki üniversite ve bölümü hedefinize ekleyin, mevcut netlerinizle hedefinize ne kadar yakın olduğunuzu görün.",
      url: "https://akademikdestek.eba.gov.tr/",
      icon: <Target className="text-orange-400" size={32} />,
      gradient: "from-orange-600/20 to-orange-900/20",
      borderHover: "hover:border-orange-500/50"
    },
    {
      title: "Soru Bankası & Testler",
      description: "On binlerce çözümlü sorudan oluşan havuz ile bol bol pratik yapın ve soru çözme hızınızı artırın.",
      url: "https://akademikdestek.eba.gov.tr/",
      icon: <ClipboardList className="text-pink-400" size={32} />,
      gradient: "from-pink-600/20 to-pink-900/20",
      borderHover: "hover:border-pink-500/50"
    },
    {
      title: "Eksik Giderme",
      description: "Sistem, çözdüğünüz testlerdeki hatalarınızı analiz eder ve sadece eksik olduğunuz konulara yönelik içerikler sunar.",
      url: "https://akademikdestek.eba.gov.tr/",
      icon: <BookOpen className="text-cyan-400" size={32} />,
      gradient: "from-cyan-600/20 to-cyan-900/20",
      borderHover: "hover:border-cyan-500/50"
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10 text-center space-y-4">
        <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent inline-flex items-center gap-3">
          EBA Akademik Destek
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Milli Eğitim Bakanlığı tarafından 11. ve 12. sınıf öğrencileri ile lise mezunlarına özel hazırlanan, YKS'ye yönelik yeni nesil dijital eğitim platformu.
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
              <span>Sisteme Git (EBA)</span>
              <ExternalLink size={16} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
          </a>
        ))}
      </div>
      
      <div className="mt-12 bg-purple-900/10 border border-purple-900/30 rounded-2xl p-6 text-center">
         <p className="text-purple-300/80 text-sm">
           <strong>Not:</strong> EBA Akademik Destek sistemine giriş yapmak için e-Devlet şifrenizle veya okulunuzdan alacağınız EBA şifrenizle giriş yapabilirsiniz. Puanlı deneme sınavlarına zamanında katılmak gelişiminizi ölçmeniz için çok önemlidir.
         </p>
      </div>
    </div>
  );
}
