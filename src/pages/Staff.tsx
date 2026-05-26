import { Mail, Linkedin, Twitter, GraduationCap, Award, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

const staffMembers = [
  {
    name: "Ömer Nasuh AĞIR",
    role: "Kurucu & Baş Danışman",
    specialty: "Uzman Eğitim Koçu & Psikolojik Danışman",
    bio: "Eğitim bilimleri alanında 15 yıllık tecrübe. Binlerce öğrencinin kariyer planlamasına rehberlik etti.",
    avatar: "https://images.unsplash.com/photo-1544717297-fa154da09f9d?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:ahmet@focuson.com" }
  },
  {
    name: "Zeynep Demir",
    role: "Kıdemli Eğitim Koçu",
    specialty: "Psikolojik Danışmanlık",
    bio: "Sınav kaygısı ve motivasyon yönetimi konusunda uzman. Öğrenci odaklı rehberlik yaklaşımını benimser.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:zeynep@focuson.com" }
  },
  {
    name: "Caner Özkan",
    role: "Matematik Bölüm Başkanı",
    specialty: "YKS Matematik & Geometri",
    bio: "Karmaşık matematiksel problemleri basitleştirme ve mantık yürütme becerilerini geliştirme uzmanı.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:caner@focuson.com" }
  },
  {
    name: "Merve Aydın",
    role: "Dil Bilimleri Koordinatörü",
    specialty: "TYT Türkçe & YDT İngilizce",
    bio: "Okuma anlama teknikleri ve dil bilgisi konusunda yenilikçi metodolojiler geliştirmektedir.",
    avatar: "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:merve@focuson.com" }
  },
  {
    name: "Burak Şahin",
    role: "Eğitim Teknolojileri Uzmanı",
    specialty: "Dijital Öğrenme Platformları",
    bio: "FocusON platformunun teknik altyapısı ve yapay zeka destekli analiz sistemlerinden sorumlu.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:burak@focuson.com" }
  },
  {
    name: "Selin Yıldız",
    role: "Rehberlik Uzmanı",
    specialty: "Tercih & Kariyer Danışmanlığı",
    bio: "YÖK Atlas verileri ve üniversite kontenjan analizleri konusunda derinlemesine bilgi sahibi.",
    avatar: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:selin@focuson.com" }
  }
];

export default function Staff() {
  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <section className="relative py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-semibold tracking-wide mb-6 uppercase">
              <Award size={16} />
              Uzman Kadromuz
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Başarınızın Arkasındaki <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Profesyonel Ekip
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Her biri kendi alanında uzman, tecrübeli ve dinamik ekibimizle, 
              geleceğe emin adımlarla ilerlemenizi sağlıyoruz.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Staff Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {staffMembers.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                    <div className="relative w-24 h-24 rounded-3xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-300">
                       <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={member.social.mail} className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white hover:bg-blue-500/20 transition-all">
                      <Mail size={18} />
                    </a>
                    <a href={member.social.linkedin} className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-[#0077b5] hover:bg-blue-500/20 transition-all">
                      <Linkedin size={18} />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{member.name}</h3>
                    <p className="text-blue-500 font-medium text-sm mt-1">{member.role}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 py-1 px-3 bg-slate-800/50 rounded-lg w-fit border border-white/5">
                    <BookOpen size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-300 font-medium">{member.specialty}</span>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {member.bio}
                  </p>

                  <div className="pt-4 flex items-center gap-2 text-xs text-slate-500 font-semibold tracking-widest uppercase">
                    <GraduationCap size={14} />
                    <span>Onaylı FocusON Eğitmeni</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the team banner */}
      <section className="container mx-auto px-4 max-w-5xl mt-10">
        <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-white/10 rounded-[2.5rem] p-10 text-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
           <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">FocusON Ekibine Katılmak İster Misiniz?</h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                Eğitim vizyonumuzun bir parçası olmak ve öğrencilerin hayatlarına dokunmak istiyorsanız 
                bizimle iletişime geçin.
              </p>
              <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-blue-50 transition-colors">
                 Başvuru Yap
              </button>
           </div>
        </div>
      </section>
    </div>
  );
}
