import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { 
  CalendarDays, 
  TrendingUp, 
  Bot, 
  FileText, 
  BookOpenCheck, 
  Clock, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  GraduationCap, 
  Users, 
  MessageSquareShare,
  Layers,
  Award
} from 'lucide-react';

export default function CoachSection() {
  const coachAdvantages = [
    {
      icon: <CalendarDays className="text-emerald-400" size={24} />,
      badge: "Zaman Tasarrufu",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      title: "Akıllı & Esnek Programlama",
      desc: "Dakikalar içinde sürükle-bırak haftalık programlar oluşturun. Taslak üzerinde çalışın, dilediğiniz an yayınlayın. Öğrencinizin kendi eklediği çalışmalar asla kaybolmaz."
    },
    {
      icon: <TrendingUp className="text-blue-400" size={24} />,
      badge: "Otomatik Analiz",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      title: "Detaylı Deneme & Net Takibi",
      desc: "TYT, AYT ve branş denemelerini ders, konu ve net bazında otomatik grafiklere dönüştürün. Öğrencinin gelişim eğrisini ve kritik eksiklerini anında görün."
    },
    {
      icon: <Bot className="text-purple-400" size={24} />,
      badge: "Yapay Zeka Gücü",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      title: "7/24 AI Asistan Entegrasyonu",
      desc: "Öğrenci ve velileriniz sistemdeki AI asistanla soru çözümlerini, program detaylarını konuşabilir. Koç olarak tüm AI sohbetlerini panelinizden şeffafça izleyin."
    },
    {
      icon: <FileText className="text-amber-400" size={24} />,
      badge: "Veli Memnuniyeti",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      title: "Tek Tıkla Veli Raporlaması",
      desc: "Velilere tek tıkla şeffaf ve profesyonel dijital karneler, analiz linkleri ve WhatsApp bildirimleri iletin. Kurumsal güven ve memnuniyeti en üst seviyeye çıkarın."
    },
    {
      icon: <BookOpenCheck className="text-rose-400" size={24} />,
      badge: "Hazır Kütüphane",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      title: "Müfredat & Kitap Havuzu",
      desc: "MEB ve ÖSYM müfredatına tam uyumlu kaynak havuzu, hazır kitaplar ve test dağılımları ile öğrencinizin kaynak takip sürecini uçtan uca yönetin."
    },
    {
      icon: <Clock className="text-cyan-400" size={24} />,
      badge: "Düzenli Takvim",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      title: "Randevu & Seans Yönetimi",
      desc: "Birebir koçluk görüşmelerinizi takvim üzerinden planlayın, seans notlarını ve hedefleri tek merkezde dijital arşivinizde saklayın."
    }
  ];

  const quickStats = [
    { label: "Operasyonel Tasarruf", value: "%70+", desc: "Excel ve manuel işlere son" },
    { label: "Veli Şeffaflığı", value: "%100", desc: "Anlık raporlama & güven" },
    { label: "Akıllı Asistan", value: "7/24", desc: "AI destekli analiz ve takip" },
    { label: "Öğrenci Kapasitesi", value: "Sınırsız", desc: "Tek panelden kolay yönetim" }
  ];

  return (
    <section id="for-coaches" className="py-16 md:py-28 relative overflow-hidden bg-slate-950/60 border-y border-white/5">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 md:px-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4 md:mb-5">
            <GraduationCap className="text-emerald-400" size={16} />
            <span className="text-xs font-bold text-emerald-400 tracking-wider uppercase">
              Eğitim Koçları & Rehberler İçin
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 md:mb-6">
            Kendi Öğrencilerinizi <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">FocusON Altyapısıyla</span> Yönetin
          </h2>

          <p className="text-slate-300 text-sm md:text-lg leading-relaxed">
            FocusON Akademi sistemi yalnızca kendi öğrencilerimize değil; eğitim koçluğu, danışmanlık ve rehberlik hizmeti veren tüm profesyonellere açıktır. Dağınık mesajlaşma gruplarına ve karmaşık tablolara veda edin; tüm süreçlerinizi modern bir dijital koçluk platformuna taşıyın.
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-12 md:mb-16">
          {quickStats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/60 border border-white/10 rounded-2xl p-4 md:p-6 text-center hover:border-emerald-500/30 transition-all group"
            >
              <div className="text-2xl md:text-4xl font-extrabold text-white group-hover:text-emerald-400 transition-colors mb-1">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm font-semibold text-slate-200 mb-1">
                {stat.label}
              </div>
              <div className="text-[11px] md:text-xs text-slate-400">
                {stat.desc}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12 md:mb-16">
          {coachAdvantages.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-5 md:p-7 hover:border-emerald-500/30 hover:bg-slate-900/80 transition-all flex flex-col justify-between group shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-white/5 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>

                <h3 className="text-base md:text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call To Action Box for Coaches */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden p-6 md:p-12 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900 shadow-2xl"
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold mb-3">
                <Sparkles size={14} /> Koç Ailemize Katılın
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-3">
                Kendi Koçluk Markanızı Dijitalin Gücüyle Büyütün
              </h3>
              <p className="text-slate-300 text-xs md:text-base leading-relaxed mb-4">
                Siz sadece öğrencilerinize rehberlik etmeye odaklanın; takip, analiz, veli iletişimi ve programlama yükünü FocusON'a bırakın. Hemen başvurarak sistemimizi deneyimleyin.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Sıfır Kurulum Maliyeti</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Öğrenci Başına Esnek Kullanım</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span>Mobil & Masaüstü Uyumlu</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full lg:w-auto shrink-0">
              <Link
                to="/koclar-icin"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-emerald-500/30 font-semibold text-sm md:text-base transition-all hover:border-emerald-400"
              >
                <span>Sistemi Detaylı İncele</span>
                <ArrowRight size={18} className="text-emerald-400" />
              </Link>

              <Link
                to="/koc-basvuru"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm md:text-base transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                <span>Koç Başvurusu Yap</span>
              </Link>
              
              <a
                href="https://wa.me/905432073748?text=Merhaba,%20FocusON%20Akademi%20koçluk%20sistemi%20hakkında%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 font-semibold text-sm md:text-base transition-all"
                title="WhatsApp Danışma"
              >
                <MessageSquareShare size={18} />
              </a>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
