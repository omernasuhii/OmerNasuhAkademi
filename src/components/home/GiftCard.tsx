import { Gift, CreditCard, Sparkles, Heart } from 'lucide-react';
import GoldenStrip from './GoldenStrip';

export default function GiftCard() {
  return (
    <section className="relative">
      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Gift className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Hediye</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Sparkles className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Motivasyon</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Heart className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Destek</span>
          </div>
        </div>
      </GoldenStrip>

      <div className="bg-white/5 backdrop-blur-md py-24 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-yellow-500/10 blur-[120px] rounded-full w-[40%] h-[80%] mx-auto pointer-events-none"></div>
        
        <div className="max-w-3xl mx-auto flex flex-col items-center relative z-10">
          <div className="w-20 h-20 bg-yellow-500/20 rounded-2xl flex items-center justify-center mb-8 border border-yellow-500/30">
            <Gift size={40} className="text-yellow-400" />
          </div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">Hediye Kartı</h2>
          <p className="text-slate-400 text-lg mb-12 text-center max-w-xl leading-relaxed">
            Sevdiklerinize eğitim hediye edin. FocusON Akademi hediye kartları ile
            onların başarı yolculuğuna katkıda bulunun.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto justify-center">
            <button className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 px-8 rounded-full flex items-center justify-center gap-3 transition-colors shadow-lg shadow-yellow-500/20">
              <Gift size={20} />
              Hediye Kartı Satın Al
            </button>
            <button className="bg-transparent hover:bg-white/10 border border-slate-600 text-white font-bold py-4 px-8 rounded-full flex items-center justify-center gap-3 transition-colors">
              <CreditCard size={20} className="text-slate-400" />
              Hediye Kartı Kullan
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
