import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, AlertTriangle, MessageSquare, Link, Users } from 'lucide-react';

interface CommunityRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommunityRulesModal({ isOpen, onClose }: CommunityRulesModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        ></motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-slate-900 border border-white/10 sm:rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-2xl h-full sm:h-auto sm:max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">Topluluk Kuralları</h2>
                <p className="text-xs md:text-sm text-slate-400">FocusON Akademi Sosyal Ekosistemi</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              FocusON Akademi topluluğu, sadece eğitim, rehberlik, motivasyon ve akademik dayanışma amacıyla kurulmuş özel bir sosyal ağdır. Bu platformda herkesin güvende hissetmesi ve amacına uygun içerik tüketebilmesi için aşağıdaki kurallara harfiyen uyulması gerekmektedir.
            </p>

            <div className="space-y-4">
               {/* 1 */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                 <div className="flex items-start gap-4">
                   <div className="text-blue-400 mt-1 shrink-0">
                     <Users size={20} />
                   </div>
                   <div>
                     <h3 className="text-white font-bold mb-2">1. Saygı, Nezaket ve Etik</h3>
                     <p className="text-sm text-slate-400 leading-relaxed">
                       Siyasi, dini veya ayrımcı tartışmalara kesinlikle yer verilmemelidir. Diğer katılımcılara karşı her zaman yapıcı, nazik ve saygılı olunmalıdır. Hakaret, küfür, argo veya zorbalık içeren hiçbir ifadeye müsamaha gösterilmez.
                     </p>
                   </div>
                 </div>
               </div>

               {/* 2 */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                 <div className="flex items-start gap-4">
                   <div className="text-emerald-400 mt-1 shrink-0">
                     <MessageSquare size={20} />
                   </div>
                   <div>
                     <h3 className="text-white font-bold mb-2">2. Sadece Eğitim Odaklı İçerik</h3>
                     <p className="text-sm text-slate-400 leading-relaxed">
                       Bu topluluk kişisel sohbet, magazin veya eğitim dışı konularda paylaşım yapılacak bir yer değildir. Paylaşımlarınız çalışma teknikleri, kaynak önerileri, motivasyon, YKS hazırlık süreci, sorular ve akademik konular ekseninde olmalıdır.
                     </p>
                   </div>
                 </div>
               </div>

               {/* 3 */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                 <div className="flex items-start gap-4">
                   <div className="text-red-400 mt-1 shrink-0">
                     <AlertTriangle size={20} />
                   </div>
                   <div>
                     <h3 className="text-white font-bold mb-2">3. Reklam ve Spam Yasaktır</h3>
                     <p className="text-sm text-slate-400 leading-relaxed">
                       Başka kurumların kurumsal reklamları, ücretli ürün tanıtımları veya herhangi bir şekilde ticari reklam paylaşılamaz. Aynı mesajın veya konunun tekrar tekrar gönderilmesi (spam) yasaktır.
                     </p>
                   </div>
                 </div>
               </div>

               {/* 4 */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                 <div className="flex items-start gap-4">
                   <div className="text-amber-400 mt-1 shrink-0">
                     <Link size={20} />
                   </div>
                   <div>
                     <h3 className="text-white font-bold mb-2">4. Harici Linkler ve İhlaller</h3>
                     <p className="text-sm text-slate-400 leading-relaxed">
                       Telif hakkı ihlali içeren veya yasadışı PDF/doküman paylaşımları tamamen yasaktır. Zararlı ve ilgisiz bağlantılar moderatörler tarafından anında silinecek ve kullanıcının hesabı uyarılacaktır.
                     </p>
                   </div>
                 </div>
               </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm italic">
               Kurallara uymayan kullanıcıların içerikleri moderatörler tarafından kaldırılabilir ve ihlallerin devamı durumunda platformdan uzaklaştırma işlemi uygulanabilir. Birlikte güvenli bir öğrenme alanı oluşturalım.
            </div>
          </div>
          
          {/* Footer */}
          <div className="pt-6 mt-6 border-t border-white/10 flex justify-end shrink-0">
             <button
               onClick={onClose}
               className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold shadow-lg shadow-indigo-600/20"
             >
               Anladım
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
