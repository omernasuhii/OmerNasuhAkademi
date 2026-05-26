import React from 'react';
import { motion } from 'motion/react';
import { Globe, Lightbulb } from 'lucide-react';

export default function ComingSoonCommunity() {
  return (
    <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-md rounded-[32px] border border-white/5 p-8 text-center"
      >
        <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto mb-6 shadow-xl shadow-indigo-500/20">
          <Lightbulb size={32} />
        </div>
        <h2 className="text-2xl font-black text-white mb-4">Yakında Eklenecek</h2>
        <p className="text-slate-400 leading-relaxed mb-8">
          Bu alan şu anda yapım aşamasında. Çok yakında burada toplulukla etkileşime geçebileceğiniz yepyeni özellikler olacak.
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-slate-500 font-bold uppercase tracking-widest">
          Geliştirme Aşamasında
        </div>
      </motion.div>
    </div>
  );
}
