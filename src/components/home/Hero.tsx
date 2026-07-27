import { Phone, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import GoldenStrip from './GoldenStrip';
import FreeAppointmentModal from './FreeAppointmentModal';

export default function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const scrollToServices = () => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <div className="pt-10 pb-8 md:pt-20 md:pb-16 px-4 md:px-12 flex flex-col lg:flex-row items-center max-w-7xl mx-auto gap-8 md:gap-12 text-center lg:text-left">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-4 md:space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[9px] md:text-[10px] font-bold text-blue-400 uppercase tracking-widest">Geleceğin Eğitim Platformu</span>
          </div>

          <h1 className="text-[2.25rem] leading-[1.1] md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            Odaktan <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Netliğe</span>, <br />Kendini Keşfetmenin Yolculuğu
          </h1>
          <p className="text-slate-400 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto lg:mx-0">
            FocusON Akademi olarak, öğrencilerin akademik başarılarını artırmak ve kişisel gelişimlerini desteklemek için kapsamlı eğitim hizmetleri sunuyoruz. YKS sınavlarına hazırlık sürecinde uzman danışmanlarımızla birlikte hedeflerinize odaklanın.
          </p>
          <button onClick={scrollToServices} className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 transition-shadow text-white font-semibold text-sm md:text-base shadow-lg shadow-blue-500/20 inline-block w-full sm:w-auto">
            Hizmetlerimiz
          </button>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 w-full max-w-[280px] sm:max-w-md lg:max-w-xl mx-auto"
        >
          <div className="w-full aspect-square relative flex justify-center items-center">
             <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl md:blur-3xl z-0"></div>
             <img src="/images/hero.png" alt="Students studying together" className="rounded-[24px] md:rounded-[32px] shadow-2xl z-10 object-cover w-full h-full border border-white/10" />
          </div>
        </motion.div>
      </div>

      <GoldenStrip className="mt-8 md:mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-row items-center justify-between gap-4 w-full">
          <div className="flex flex-col items-center gap-1.5 md:flex-row md:gap-8 text-center md:text-left">
            <span className="flex flex-col md:flex-row items-center gap-1 md:gap-3 font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider text-center">
              <Phone className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
              Detaylı Bilgi
            </span>
            <span className="text-sm md:text-2xl font-bold text-yellow-400 tracking-widest">+90 545 448 7886</span>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 border border-yellow-500/50 hover:bg-yellow-500/20 text-yellow-100 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-full transition-colors font-semibold text-[9px] md:text-sm uppercase tracking-widest shadow-[0_0_15px_rgba(250,204,21,0.1)] text-center">
            <Calendar className="text-yellow-400 w-4 h-4 md:w-6 md:h-6" />
            Ücretsiz<br className="md:hidden" />Randevu
          </button>
        </div>
      </GoldenStrip>

      <FreeAppointmentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
