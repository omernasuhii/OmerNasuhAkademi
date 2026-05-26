import { motion } from 'motion/react';
import { Clock } from 'lucide-react';
import CoachScheduleManager from '../../components/appointments/CoachScheduleManager';

export default function SchedulePage() {
  return (
    <div className="flex-1 p-6 md:p-10 mt-6 max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
      <header>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-500/10 p-2 rounded-lg">
              <Clock className="text-emerald-500" size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white uppercase">
              Çalışma Saatlerim
            </h1>
          </div>
          <p className="text-slate-400">
            Haftalık müsaitlik durumunuzu ve randevu saatlerinizi buradan yönetebilirsiniz.
          </p>
        </motion.div>
      </header>

      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12">
        <CoachScheduleManager />
      </div>
    </div>
  );
}
