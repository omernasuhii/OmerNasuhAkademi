import { Target, Compass, Sparkles, ShieldCheck, Zap, Heart } from 'lucide-react';
import { motion } from 'motion/react';

export default function VisionMission() {
  const values = [
    {
      icon: <Zap className="text-amber-400" />,
      title: "Yenilikçilik",
      desc: "Eğitim teknolojilerini yakından takip ediyor, en güncel yöntemleri sistemimize entegre ediyoruz."
    },
    {
      icon: <Target className="text-blue-400" />,
      title: "Sonuç Odaklılık",
      desc: "Öğrencilerimizin hedeflerine giden yolda, somut verilerle ve gerçekçi stratejilerle ilerliyoruz."
    },
    {
      icon: <Heart className="text-rose-400" />,
      title: "Empati",
      desc: "Sınav sürecinin getirdiği zorlukları biliyor, öğrencilerimize sadece hoca değil, yol arkadaşı oluyoruz."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-semibold tracking-wide mb-6 inline-block uppercase">
              Hedeflerimiz
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Vizyonumuz & <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">
                Misyonumuz
              </span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Vision & Mission Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
              <Compass className="text-emerald-400 mb-6" size={48} />
              <h2 className="text-3xl font-bold text-white mb-6">Vizyonumuz</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Eğitimi, sadece sınav kazanma aracı değil; bir gelişim ve kendini keşfetme yolculuğu olarak gören 
                öncü bir kurum olmak. Teknolojinin gücüyle, her öğrencinin sınırlarını zorlayabileceği bir 
                öğrenme ekosistemi yaratmak.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5"></div>
                  <span className="text-slate-300">Türkiye'nin en başarılı dijital eğitim platformu olmak.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5"></div>
                  <span className="text-slate-300">Global eğitim trendlerini ülkemize uyarlamak.</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-slate-900/50 border border-slate-800 p-10 rounded-[2.5rem] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
              <ShieldCheck className="text-blue-400 mb-6" size={48} />
              <h2 className="text-3xl font-bold text-white mb-6">Misyonumuz</h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Öğrencilerimize sınav maratonunda ihtiyaç duydukları akademik destek, psikolojik rehberlik ve 
                stratejik planlamayı sağlayarak, hayallerindeki üniversitelere giden yolu aydınlatmak. 
                FocusON disiplinini her öğrenciye aşılamak.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5"></div>
                  <span className="text-slate-300">Bireysel potansiyeli başarıya dönüştüren sistemler kurmak.</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2.5"></div>
                  <span className="text-slate-300">Erişilebilir ve kaliteli eğitim desteği sunmak.</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 bg-slate-900/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <Sparkles className="text-emerald-400 mx-auto mb-4" size={32} />
            <h2 className="text-3xl font-bold text-white mb-4">FocusON İlkeleri</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-emerald-400 to-blue-400 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 bg-slate-800/40 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all group"
              >
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-slate-400 leading-relaxed">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
