import { User, Activity, Target, Users, Focus, Compass, Sparkles, Trophy, Lightbulb } from 'lucide-react';
import { motion } from 'motion/react';
import GoldenStrip from './GoldenStrip';

export default function AboutTeacher() {
  const points = [
    {
      icon: <User className="text-blue-400" size={20} />,
      title: "Bireysel Danışmanlık ve Koçluk",
      desc: "YKS ve ara sınıf öğrencilerine özel programlarla kişiye uygun çalışma planı ve koçlarımızla birebir motivasyon desteği sunuyoruz."
    },
    {
      icon: <Activity className="text-emerald-400" size={20} />,
      title: "Deneme Analizi ve Sınav Takibi",
      desc: "Öğrencilerimizin yaptığı deneme sınavlarını detaylı analiz ederek eksikleri ortaya çıkarıyor, düzenli raporlamalarla ilerlemelerini takip ediyoruz."
    },
    {
      icon: <Target className="text-indigo-400" size={20} />,
      title: "Hedef Belirleme & Motivasyon Çalışmaları",
      desc: "Öğrencilerimizin uzun vadeli hedeflerini belirlemelerine yardımcı oluyor, süreç içinde motivasyonlarını korumalarını sağlıyoruz."
    },
    {
      icon: <Users className="text-purple-400" size={20} />,
      title: "Veli Bilgilendirme ve Takip",
      desc: "Velilerimize düzenli bilgilendirme ve şeffaf takip sistemi sunarak öğrencinin gelişim sürecine birlikte katkıda bulunuyoruz."
    },
    {
      icon: <Focus className="text-blue-400" size={20} />,
      title: "Odak ve Disiplin Çalışmaları",
      desc: "Ders dışındaki dikkat ve çalışma alışkanlıklarını geliştirici özel koçluk teknikleri ve takip mekanizmaları uyguluyoruz."
    },
    {
      icon: <Lightbulb className="text-amber-400" size={20} />,
      title: "Psikolojik Destek ve Sınav Stratejisi",
      desc: "Sınav kaygısını yönetme ve doğru stratejilerle zihinsel dayanıklılığı artırarak öğrencinin potansiyelini maksimuma taşıyoruz."
    }
  ];

  return (
    <section>
      <div className="py-10 md:py-20 px-4 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-10 lg:gap-16">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-20 items-start w-full">
            {/* Image Container */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full max-w-[320px] mx-auto lg:w-4/12 relative lg:sticky lg:top-32 shrink-0"
            >
              <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/20 to-indigo-500/20 blur-2xl md:blur-3xl z-0 rounded-full"></div>
              <div className="relative z-10 rounded-[2rem] md:rounded-[2.5rem] bg-slate-900/50 p-2 border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]">
                 <img 
                   src="/images/teacher.jpg" 
                   alt="Ömer Nasuh AĞIR" 
                   className="rounded-[1.5rem] md:rounded-[2rem] w-full object-cover aspect-square md:aspect-[4/5]"
                 />
                 {/* Decorative floating badge */}
                 <div className="absolute -bottom-4 md:-bottom-6 -right-4 md:-right-8 bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 md:p-4 rounded-xl md:rounded-2xl shadow-xl flex items-center gap-2 md:gap-3">
                   <div className="bg-yellow-500/20 p-2 rounded-lg md:rounded-xl text-yellow-400">
                     <Trophy size={20} className="md:w-6 md:h-6" />
                   </div>
                   <div>
                     <div className="text-white font-bold text-xs md:text-sm tracking-widest uppercase">Kurucu & PDR Uzmanı</div>
                     <div className="text-slate-400 text-[10px] md:text-xs">FocusON Akademi</div>
                   </div>
                 </div>
              </div>
            </motion.div>
            
            {/* Content Container */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="w-full lg:w-8/12 space-y-6 md:space-y-8 mt-6 lg:mt-0"
            >
              <div>
                <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 md:mb-6 text-center lg:text-left">Ömer Nasuh <span className="text-blue-400">AĞIR</span> Kimdir?</h2>
                <div className="space-y-4 text-slate-400 leading-relaxed text-sm md:text-lg text-center lg:text-left">
                  <p>
                    Ben Ömer Nasuh Ağır. Psikolojik Danışmanlık ve Rehberlik (PDR) alanındaki uzmanlığım ve uzun yıllara dayanan rehberlik tecrübemle, öğrencilerin sınav hazırlık süreçlerini daha verimli, planlı ve profesyonel kılmak amacıyla bu koçluk ve takip sistemini hazırladım.
                  </p>
                  <p>
                    FocusON Akademi çatısı altında, alanında uzman eğitim koçlarımızla birlikte öğrencilerimizin yalnızca ders başarısını değil; motivasyonlarını, özgüvenlerini ve zaman yönetimlerini de güçlendiriyoruz. Geliştirdiğimiz bu yenilikçi sistem ve uzman koç kadromuzla; her öğrencimize özel çalışma rotaları çiziyor, velilerimize şeffaf ve güvenilir bir takip imkânı sunuyor ve başarıya giden yolda öğrencilerimizle birlikte yürüyoruz.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4"
          >
            {points.map((point, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 md:gap-4 items-center sm:items-start text-center sm:text-left bg-white/5 backdrop-blur-md border border-white/10 p-4 md:p-5 rounded-xl md:rounded-2xl hover:bg-white/[0.08] transition-colors">
                <div className="bg-slate-800 p-2.5 rounded-[14px] shrink-0 shadow-inner border border-white/5">
                  {point.icon}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm md:text-base tracking-wide leading-tight">{point.title}</h3>
                  <p className="text-xs md:text-sm text-slate-400 mt-1.5 leading-relaxed">{point.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Compass className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Rehberlik</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Sparkles className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Odak</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Trophy className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Başarı</span>
          </div>
        </div>
      </GoldenStrip>
    </section>
  );
}
