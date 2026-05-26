import { Users, Target, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export default function About() {
  const values = [
    {
      icon: <Target className="text-blue-400" />,
      title: "Vizyonumuz",
      desc: "Öğrencilerin sadece sınav başarısı değil, hayat boyu öğrenme tutkusuna sahip bireyler olmalarını sağlamak."
    },
    {
      icon: <ShieldCheck className="text-emerald-400" />,
      title: "Güvenilir Rehberlik",
      desc: "Eğitim yolculuğunda her adımda yanlarında olan, veriye dayalı ve şeffaf bir rehberlik anlayışı."
    },
    {
      icon: <Heart className="text-rose-400" />,
      title: "Öğrenci Odaklılık",
      desc: "Her öğrencinin farklı bir potansiyeli olduğuna inanıyor, bireysel gelişimlerine odaklanıyoruz."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-indigo-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-semibold tracking-wide mb-6 inline-block uppercase">
              Kurumsal
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
              Odaktan Başarıya: <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Biz Kimiz?
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-3xl mx-auto leading-relaxed">
              FocusON Akademi, eğitim teknolojileri ve profesyonel koçluk hizmetlerini bir araya getirerek 
              öğrencilerin potansiyellerini en üst seviyeye çıkarmayı amaçlayan yenilikçi bir eğitim platformudur.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 bg-slate-900/30">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 text-indigo-400 font-semibold text-lg">
                <Users size={24} />
                <span>FocusON Akademi Hikayesi</span>
              </div>
              <h2 className="text-3xl font-bold text-white">Eğitimde Dönüşümün Öncüsü</h2>
              <p className="text-slate-400 leading-relaxed text-lg">
                Sınav hazırlık sürecinin sadece soru çözmekten ibaret olmadığını biliyoruz. Bu süreç; psikolojik dayanıklılık, 
                doğru planlama ve sürekli motivasyon gerektiren uzun bir yolculuktur.
              </p>
              <p className="text-slate-400 leading-relaxed text-lg">
                Kuruluşumuzdan bu yana, binlerce öğrencinin kendi öğrenme stillerini keşfetmelerine ve hedeflerine 
                ulaşmalarına yardımcı olduk. Teknolojiyi eğitimin kalbine yerleştirerek, her öğrenciye 
                özel bir deneyim sunuyoruz.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/5 flex items-center justify-center relative overflow-hidden group">
                 <Sparkles className="text-blue-400/20 absolute -right-10 -bottom-10 w-64 h-64 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                 <div className="relative text-center p-8 space-y-4">
                    <div className="text-6xl font-bold text-white leading-none">FocusON</div>
                    <div className="text-xl text-blue-400 font-medium tracking-widest uppercase">Akademi</div>
                    <div className="w-12 h-1 bg-blue-500 mx-auto rounded-full mt-4"></div>
                 </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Temel Değerlerimiz</h2>
            <div className="w-20 h-1 bg-indigo-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 bg-slate-900/50 border border-slate-800 rounded-3xl hover:border-indigo-500/30 transition-all group"
              >
                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
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
