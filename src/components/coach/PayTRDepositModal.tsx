import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, ShieldCheck, X, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

interface PayTRDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  coachId?: string;
  coachEmail?: string;
  coachName?: string;
  onSuccess?: () => void;
}

export default function PayTRDepositModal({
  isOpen,
  onClose
}: PayTRDepositModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
        >
          {/* Top Decorative Glow */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-500/10 blur-[90px] rounded-full pointer-events-none" />

          {/* Modal Header */}
          <div className="p-6 border-b border-white/5 flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard size={12} />
                  PayTR Altyapısı
                </span>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm">
                  <Sparkles size={11} />
                  Yakında
                </span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Kredi Kartı ile Ödeme
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                PayTR Sanal POS entegrasyonu hazırlanıyor.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5 relative z-10">
            {/* Soon Notice Banner */}
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2.5 bg-amber-500/20 text-amber-300 rounded-xl shrink-0 mt-0.5">
                <Lock size={20} />
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-200 text-sm">
                  Çok Yakında Hizmetinizde!
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  PayTR Sanal POS ve 3D Secure kredi kartı ödeme altyapımız hazırlanmıştır. Canlı kart tahsilatları ve taksitli yükleme seçeneği çok yakında aktif edilecektir.
                </p>
              </div>
            </div>

            {/* Infrastructure Features List */}
            <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Hazırlanan Altyapı Özellikleri
              </p>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>256-bit SSL ve PayTR 3D Secure Güvenlik</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Tüm Kredi & Banka Kartları (Visa, MasterCard, Troy)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>12 Aya Kadar Taksit Seçenekleri</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>Anında Otomatik Sistem Bakiyesi Tanımlama</span>
                </li>
              </ul>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-3.5 rounded-2xl uppercase tracking-wider text-xs transition-all border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Tamam, Anladım
            </button>

            {/* Security Footer Badges */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-bold">
              <span className="flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-500" />
                PayTR Güvenli Altyapı
              </span>
              <span className="tracking-wider uppercase">MasterCard / VISA / Troy</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
