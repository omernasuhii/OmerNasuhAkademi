import { BookOpen, Users, MessageCircle, ShieldCheck, Target, Clock, Zap, Instagram, Youtube, Twitter } from 'lucide-react';
import { motion } from 'motion/react';
import GoldenStrip from './GoldenStrip';

export default function Community() {
  const commItems = [
    {
      icon: <BookOpen className="text-blue-400" size={32} />,
      title: "Blog",
      desc: "Eğitim ipuçları ve başarı hikayeleri"
    },
    {
      icon: <Users className="text-emerald-400" size={32} />,
      title: "Gruplar",
      desc: "Çalışma grupları ve sosyal aktiviteler"
    },
    {
      icon: <MessageCircle className="text-indigo-400" size={32} />,
      title: "Forum",
      desc: "Toplulukla etkileşimde bulunun, tecrübelerinizi paylaşın"
    },
    {
      icon: <ShieldCheck className="text-purple-400" size={32} />,
      title: "Üyeler",
      desc: "Özel üye alanı ve avantajlar"
    }
  ];

  return (
    <section className="relative">
      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Target className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Strateji</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Clock className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Zaman</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Zap className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Performans</span>
          </div>
        </div>
      </GoldenStrip>

      <div className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/10 blur-[120px] rounded-full w-2/3 h-2/3 right-[-10%] top-1/4 pointer-events-none z-0"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Birlikte Büyüyoruz</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Topluluğumuz</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg mb-10 md:mb-16">
            Birlikte daha güçlü büyüyoruz. Sosyal medya etkileşimlerimizden blog yazılarımıza, forum tartışmalarından grup çalışmalarına kadar...
          </p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8 md:mb-12 w-full overflow-hidden relative bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-white/10 rounded-[24px] md:rounded-[40px] p-6 md:p-12 shadow-2xl hover:border-white/20 transition-all flex flex-col md:flex-row items-center justify-between text-left group"
          >
             <div className="flex-1 w-full text-center md:text-left md:pr-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Özel Platformumuz</span>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-white mb-3 tracking-tight">Sosyal Medyamız</h3>
                <p className="text-slate-400 text-sm md:text-lg max-w-2xl mx-auto md:mx-0 leading-relaxed">
                  Tamamen kendi kurduğumuz ve diğer platformlardan bağımsız olarak sadece eğitim alanına özel tasarlanmış sosyal medya ekosistemimiz. Öğrencilerimizle güvenli, motivasyon dolu ve başarı odaklı bir ağda buluşuyoruz.
                </p>
             </div>
             
             <div className="flex items-center justify-center shrink-0 mt-6 md:mt-0 relative">
               <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-tr from-blue-500 to-indigo-500 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-lg shadow-blue-500/20 z-10 relative">
                 <Users size={32} className="text-white md:w-12 md:h-12" />
               </div>
               <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full animate-pulse z-0"></div>
             </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
            {commItems.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[16px] md:rounded-[32px] p-4 md:p-8 shadow-xl hover:bg-white/10 hover:border-blue-500/30 transition-all flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="bg-slate-800/80 border border-white/5 p-3 md:p-5 rounded-xl md:rounded-2xl mb-3 md:mb-6 group-hover:scale-110 transition-transform shadow-inner">
                  {item.icon}
                </div>
                <h3 className="font-bold text-sm md:text-xl mb-1.5 md:mb-2 text-white">{item.title}</h3>
                <p className="text-slate-400 text-[10px] md:text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
