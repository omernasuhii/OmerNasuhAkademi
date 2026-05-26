import { Info, Target, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import GoldenStrip from './GoldenStrip';

export default function Events() {
  const events = [
    {
      image: "/images/event-1.jpg",
      title: "Deneme Maratonları",
      desc: "Tarih ve saat henüz belli değil · Konum henüz belli değil"
    },
    {
      image: "/images/event-2.jpg",
      title: "Atölyeler",
      desc: "Tarih ve saat henüz belli değil · Konum henüz belli değil"
    },
    {
      image: "/images/event-3.jpg",
      title: "Odak Seansları",
      desc: "Tarih ve saat henüz belli değil · Konum henüz belli değil"
    }
  ];

  return (
    <section>
      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Info className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Bilgi</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Target className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Hedef</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Trophy className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Zafer</span>
          </div>
        </div>
      </GoldenStrip>

      <div className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Takvim</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">Etkinliklerimiz</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
            {events.map((ev, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={`bg-white/5 backdrop-blur-xl rounded-[16px] md:rounded-[32px] overflow-hidden border border-white/10 shadow-xl flex flex-col group hover:border-blue-500/30 transition-colors ${idx === 2 ? "col-span-2 md:col-span-1" : ""}`}
              >
                <div className="h-24 md:h-56 overflow-hidden relative">
                  <div className="absolute inset-0 bg-blue-900/40 mix-blend-multiply z-10 group-hover:opacity-0 transition-opacity duration-500"></div>
                  <img src={ev.image} alt={ev.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="p-4 md:p-8 flex flex-col flex-grow">
                  <h3 className="font-bold text-sm md:text-xl mb-1.5 md:mb-3">{ev.title}</h3>
                  <p className="text-slate-400 text-[10px] md:text-sm mb-3 md:mb-6 leading-relaxed hidden md:block">{ev.desc}</p>
                  
                  <div className="mt-auto flex flex-col gap-2 md:gap-4">
                    <a href="#" className="text-[10px] md:text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                      Daha Fazla<span className="hidden md:inline"> Bilgi</span> &rarr;
                    </a>
                    <button className="bg-slate-800 text-slate-400 px-2 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-full text-[9px] md:text-sm font-semibold border border-slate-700 cursor-not-allowed">
                      Kayıt Kapalı
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>


    </section>
  );
}
