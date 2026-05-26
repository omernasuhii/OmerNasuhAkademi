import { Trophy, Star, Users, GraduationCap, Award, ChartBar, MapPin, University, Target } from 'lucide-react';
import { motion } from 'motion/react';

const stats = [
  { icon: <Users size={24} />, value: "5000+", label: "Öğrenci" },
  { icon: <University size={24} />, value: "350+", label: "Tıp Fakültesi" },
  { icon: <Award size={24} />, value: "850+", label: "Mühendislik" },
  { icon: <Star size={24} />, value: "1500+", label: "Diğer Lisans" }
];

const rankings = [
  { year: "2023", rank: "Türkiye 14.sü", student: "Elif S.", field: "SAY" },
  { year: "2023", rank: "Türkiye 89.su", student: "Mert Y.", field: "EA" },
  { year: "2022", rank: "Türkiye 102.si", student: "Zeynep K.", field: "SÖZ" },
  { year: "2022", rank: "Türkiye 245.si", student: "Can A.", field: "DİL" }
];

const stories = [
  {
    name: "Ayşe Ersoy",
    university: "Hacettepe Tıp",
    quote: "FocusON ile disiplinli çalışmayı öğrendim. Koçumun her hafta hazırladığı programlar sayesinde eksiklerimi çok hızlı kapattım.",
    year: "2023 Mezunu"
  },
  {
    name: "Burak Çetin",
    university: "Boğaziçi Bilgisayar",
    quote: "Deneme analizleri hayatımı kurtardı. Nerede hata yaptığımı somut olarak görmek, netlerimi 30 artırmamı sağladı.",
    year: "2023 Mezunu"
  },
  {
    name: "Derya Yıldız",
    university: "ODTÜ Mimarlık",
    quote: "Mezun senemde FocusON'a başladım. Psikolojik destek ve motivasyon seansları olmasaydı bu stresle başa çıkamazdım.",
    year: "2022 Mezunu"
  }
];

export default function SuccessStories() {
  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-yellow-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-sm font-semibold tracking-wide mb-6 uppercase">
              <Trophy size={16} />
              Gurur Tablomuz
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              FocusON İle <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
                Gelen Başarılar
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Binlerce öğrencimizin hayallerine ortak olduk. İşte disiplinli çalışmanın, 
              doğru stratejinin ve azmin sonuçları.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-4xl mx-auto">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + (idx * 0.1) }}
                className="p-6 bg-slate-900/40 border border-white/5 rounded-3xl"
              >
                <div className="text-amber-500 mb-2 flex justify-center">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Rankings */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Derecelerimiz</h2>
              <p className="text-slate-400">Her yıl Türkiye genelinde ilk binlerde yer alan öğrencilerimiz.</p>
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-bold bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
              <Star size={18} fill="currentColor" />
              <span>YKS Şampiyonları</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {rankings.map((it, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl relative group overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-16 h-16 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors rounded-full blur-xl"></div>
                <div className="text-xs text-slate-500 font-bold mb-4">{it.year} YKS</div>
                <div className="text-2xl font-black text-amber-500 mb-2">{it.rank}</div>
                <div className="text-white font-bold text-lg">{it.student}</div>
                <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mt-1">Sınav Türü: {it.field}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-24 bg-slate-900/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Öğrenci Görüşleri</h2>
            <div className="w-20 h-1 bg-amber-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stories.map((story, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="p-8 bg-slate-950 border border-slate-800 rounded-[2.5rem] relative"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-white text-slate-950 flex items-center justify-center rounded-2xl shadow-xl font-serif text-3xl">"</div>
                <p className="text-slate-400 italic mb-8 relative z-10 leading-relaxed text-lg">
                  {story.quote}
                </p>
                <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold text-xl border border-amber-500/20">
                    {story.name[0]}
                  </div>
                  <div>
                    <div className="text-white font-bold">{story.name}</div>
                    <div className="text-xs text-blue-400 font-semibold">{story.university}</div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{story.year}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* University Map Concept */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <ChartBar size={300} />
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-blue-400 font-bold tracking-widest text-sm uppercase">
                  <MapPin size={16} />
                  Kazanılan Üniversiteler
                </div>
                <h2 className="text-4xl font-extrabold text-white leading-tight">Mezunlarımız Nerede?</h2>
                <p className="text-slate-400 leading-relaxed text-lg">
                  Her yıl Türkiye'nin dört bir yanındaki devlet ve vakıf üniversitelerine 
                  yüzlerce öğrenci uğurluyoruz. Mezunlarımızın %92'si hedefledikleri 
                  ilk 3 tercihlerinden birine yerleşti.
                </p>
                <div className="space-y-4 text-left">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">İstanbul / Ankara Üniversiteleri</span>
                    <span className="text-white font-bold">%45</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 w-[45%]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Diğer Büyükşehir Üniversiteleri</span>
                    <span className="text-white font-bold">%35</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 w-[35%]"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="aspect-square bg-slate-800/20 rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6 text-center group hover:bg-slate-800/40 transition-all">
                    <GraduationCap size={32} className="text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold text-white tracking-widest">TIP</div>
                 </div>
                 <div className="aspect-square bg-slate-800/20 rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6 text-center group hover:bg-slate-800/40 transition-all">
                    <Star size={32} className="text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold text-white tracking-widest">HUKUK</div>
                 </div>
                 <div className="aspect-square bg-slate-800/20 rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6 text-center group hover:bg-slate-800/40 transition-all">
                    <Target size={32} className="text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold text-white tracking-widest">MÜH.</div>
                 </div>
                 <div className="aspect-square bg-slate-800/20 rounded-3xl border border-white/5 flex flex-col items-center justify-center p-6 text-center group hover:bg-slate-800/40 transition-all">
                    <ChartBar size={32} className="text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-2xl font-bold text-white tracking-widest">EĞİT.</div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
