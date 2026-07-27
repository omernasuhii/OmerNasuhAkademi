import { CalendarDays, BookOpen, MonitorPlay, Bot, PartyPopper, CreditCard, FolderOpen, Target } from 'lucide-react';
import { motion } from 'motion/react';

export default function Services() {
  const services = [
    {
      icon: <Target size={20} className="text-amber-300" />,
      title: "Eğitim Koçluğu",
      desc: "Bireysel potansiyeli maksimize eden, hedeflerinize özel stratejik ve planlı bir başarı programı."
    },
    {
      icon: <MonitorPlay size={20} className="text-emerald-300" />,
      title: "Online Akademi",
      desc: "İnteraktif dökümanlar, özel içerikler ve hedefe yönelik eğitimlerle kesintisiz dijital öğrenme deneyimi."
    },
    {
      icon: <Bot size={20} className="text-purple-300" />,
      title: "Yapay Zeka Asistan",
      desc: "Sorularınıza anında yanıt veren, analitik geri bildirimlerle size özel stratejiler çizen akıllı rehber."
    },
    {
      icon: <CalendarDays size={20} className="text-blue-300" />,
      title: "Randevu Sistemi",
      desc: "Danışmanlık ve rehberlik görüşmelerinizi kolayca planlayın, hedeflerinize uzman desteğiyle yürüyün."
    },
    {
      icon: <CreditCard size={20} className="text-rose-300" />,
      title: "Abonelikler",
      desc: "YKS hazırlık sürecinde uzun vadeli, daha ekonomik ve planlı bir yol haritası sunan üyelik paketleri."
    },
    {
      icon: <BookOpen size={20} className="text-indigo-300" />,
      title: "Kitap Mağazası",
      desc: "Akademi tarafından özenle seçilmiş nitelikli yayınlar, denemeler ve özel kitaplarla eksiksiz hazırlanın."
    },
    {
      icon: <FolderOpen size={20} className="text-cyan-300" />,
      title: "Dosya Paylaşımı",
      desc: "Güncel ders notları, zaman yönetimi çizelgeleri ve özel çalışma rehberlerine her an elinizin altında erişin."
    }
  ];

  return (
    <section id="services" className="py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3 md:mb-4">
            <span className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest">Geniş Yelpaze</span>
          </div>
          <h2 className="text-2xl md:text-5xl font-extrabold mb-3 md:mb-4 tracking-tight">Hizmetlerimiz</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-lg">
            Eğitimden kişisel gelişime, teknolojiden sosyal aktivitelere kadar geniş
            yelpazede hizmet sunuyoruz
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {services.map((service, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 4) * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all duration-300 rounded-[16px] md:rounded-[32px] p-4 md:p-8 flex flex-col gap-3 md:gap-6 group hover:shadow-2xl hover:shadow-blue-500/10 items-center text-center md:items-start md:text-left"
            >
              <div className="bg-slate-800/80 border border-white/5 w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-inner mx-auto md:mx-0">
                {service.icon}
              </div>
              <div>
                <h3 className="font-bold text-sm md:text-xl mb-1.5 md:mb-3 tracking-wide">{service.title}</h3>
                <p className="text-slate-400 text-[10px] md:text-sm leading-relaxed">{service.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
