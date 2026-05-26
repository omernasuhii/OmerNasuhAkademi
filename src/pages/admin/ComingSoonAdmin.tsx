import React from 'react';
import { motion } from 'motion/react';
import { Construction, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ComingSoonAdmin() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-24 h-24 bg-red-600/10 rounded-[32px] flex items-center justify-center text-red-500 mb-8 shadow-2xl shadow-red-600/10 border border-red-600/20"
      >
        <Construction size={48} />
      </motion.div>
      
      <h1 className="text-4xl font-black text-white mb-4 tracking-tight">Bu Modül Yapım Aşamasında</h1>
      <p className="text-slate-500 max-w-md mx-auto mb-10 font-medium leading-relaxed">
        Seçtiğiniz yönetim modülü şu anda geliştirme aşamasındadır. En kısa sürede tüm fonksiyonlarıyla burada olacak.
      </p>
      
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-2xl transition-all border border-white/10 font-bold group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
        Geri Dön
      </button>
    </div>
  );
}
