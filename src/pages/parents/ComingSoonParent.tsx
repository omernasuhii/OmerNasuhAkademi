import { motion } from 'motion/react';
import { Construction } from 'lucide-react';

export default function ComingSoonParent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-slate-900/20 rounded-3xl border border-white/5">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-6"
      >
        <Construction size={40} />
      </motion.div>
      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Gelişme Aşamasında</h2>
      <p className="text-slate-400 max-w-sm">
        Veli Bilgilendirme portalımızın bu bölümü şu anda yapım aşamasındadır.
      </p>
    </div>
  );
}
