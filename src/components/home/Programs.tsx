import { Users, Heart, ArrowRight, Zap, Target, BookOpen, User, LineChart } from 'lucide-react';
import { motion } from 'motion/react';
import GoldenStrip from './GoldenStrip';

export default function Programs() {
  return (
    <section>
      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Zap className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Gelişim</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Target className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Farkındalık</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <ArrowRight className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Potansiyel</span>
          </div>
        </div>
      </GoldenStrip>

      <div className="py-12 md:py-24 px-4 md:px-6 relative">
        <div className="absolute inset-0 bg-blue-600/10 blur-[100px] z-0 rounded-full w-1/2 h-1/2 left-1/4 top-1/4 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full mb-3 md:mb-4">
            <span className="text-[9px] md:text-[10px] font-bold text-rose-400 uppercase tracking-widest">Motivasyon</span>
          </div>
          <h2 className="text-2xl md:text-5xl font-extrabold mb-3 md:mb-6 tracking-tight">Özel Programlarımız</h2>
          <p className="text-slate-400 mb-8 md:mb-12 text-sm md:text-lg max-w-2xl mx-auto">
            Eğlenceli ve ödüllü programlarla motivasyonunuzu yüksek tutun
          </p>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-8 text-center md:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-10 rounded-[16px] md:rounded-[32px] relative overflow-hidden shadow-2xl hover:border-blue-500/30 transition-colors group flex flex-col"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6 mb-3 md:mb-6 relative z-10 text-center md:text-left">
                <div className="bg-blue-500/20 border border-blue-500/30 text-blue-400 p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner group-hover:scale-110 transition-transform mx-auto md:mx-0">
                  <Users className="w-5 h-5 md:w-8 md:h-8" />
                </div>
                <div>
                  <h3 className="text-sm md:text-2xl font-bold tracking-tight">Dostluk Programı</h3>
                  <p className="text-blue-400 text-[9px] md:text-sm font-medium mt-1">Arkadaşını getir, birlikte kazan</p>
                </div>
              </div>
              <p className="text-slate-400 text-[10px] md:text-sm relative z-10 leading-relaxed md:block md:w-full hidden">
                Arkadaşlarınızı FocusON Akademi'ye davet edin. Her başarılı davet için hem siz hem de arkadaşınız özel bonuslar ve indirimler kazanın.
              </p>
              <div className="absolute right-0 top-0 opacity-[0.03] transform scale-150 -translate-y-4">
                <Users size={150} className="md:w-[200px] md:h-[200px]" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 md:p-10 rounded-[16px] md:rounded-[32px] relative overflow-hidden shadow-2xl hover:border-indigo-500/30 transition-colors group flex flex-col"
            >
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 md:gap-6 mb-3 md:mb-6 relative z-10 text-center md:text-left">
                <div className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-inner group-hover:scale-110 transition-transform mx-auto md:mx-0">
                  <Heart className="w-5 h-5 md:w-8 md:h-8" />
                </div>
                <div>
                  <h3 className="text-sm md:text-2xl font-bold tracking-tight">Sadakat Programı</h3>
                  <p className="text-indigo-400 text-[9px] md:text-sm font-medium mt-1">Görevleri tamamla, puan kazan</p>
                </div>
              </div>
              <p className="text-slate-400 text-[10px] md:text-sm relative z-10 leading-relaxed md:block hidden md:w-full">
                Her tamamladığınız görev, katıldığınız ders ve başardığınız hedef size puan kazandırır. Bu puanları hediye kartları, indirimler ve özel içerikler için kullanabilirsiniz.
              </p>
              <div className="absolute right-0 top-0 opacity-[0.03] transform scale-150 -translate-y-4">
                <Heart size={150} className="md:w-[200px] md:h-[200px]" />
              </div>
            </motion.div>
          </div>

          <button className="mt-8 md:mt-12 px-6 py-3 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors text-xs md:text-sm font-semibold tracking-wide w-full sm:w-auto">
            Puanları Görüntüle
          </button>
        </div>
      </div>
    </section>
  );
}
