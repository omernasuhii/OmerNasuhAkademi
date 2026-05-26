import React from 'react';
import { 
  TrendingUp, 
  Calendar, 
  BookOpen, 
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export default function ParentDashboard() {
  const { userData } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Özet Gözlemi</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">{userData?.studentName} için güncel akademi verileri.</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all">
          <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500 w-fit mb-4">
            <BookOpen size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Haftalık Soru Hedefi</p>
          <div className="flex items-end gap-2 mt-1">
             <h3 className="text-3xl font-black text-white tabular-nums">450/600</h3>
             <span className="text-blue-500 text-xs font-bold mb-1">%75</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
             <div className="bg-blue-500 h-full w-[75%]" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 w-fit mb-4">
            <CheckCircle2 size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Tamamlanan Ödevler</p>
          <h3 className="text-3xl font-black text-white mt-1 tabular-nums">12/14</h3>
          <p className="text-slate-500 text-xs mt-2 font-medium">Bu dönem toplam 86 ödev tamamlandı.</p>
        </div>

        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 w-fit mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Başarı Puanı</p>
          <h3 className="text-3xl font-black text-white mt-1 tabular-nums">84.5</h3>
          <p className="text-slate-500 text-xs mt-2 font-medium">Son sınavlara göre ortalama puan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Performance */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" /> Son Deneme Sınavları
          </h3>
          <div className="space-y-4">
            {[
              { name: 'TYT Deneme - 8', score: '385.25', rank: '12/450', date: '15 Mart' },
              { name: 'AYT Sayısal - 4', score: '412.50', rank: '8/320', date: '8 Mart' },
              { name: 'TYT Deneme - 7', score: '372.10', rank: '24/450', date: '1 Mart' },
            ].map((exam, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-white">{exam.name}</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{exam.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">{exam.score}</p>
                  <p className="text-[10px] text-slate-400 font-bold">Sıralama: {exam.rank}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-3 bg-white/5 border border-white/5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-all">
            Tüm Sınav Karnelerini Gör
          </button>
        </div>

        {/* Coach Feedbacks */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
             <FileText size={20} className="text-blue-500" /> Koç Değerlendirmeleri
          </h3>
          <div className="space-y-6">
            {[
              { coach: 'İlgün Koç', date: 'Bugün', note: 'Öğrenci bu hafta Matematik konularında büyük bir ivme kazandı. Problem çözme hızı arttı.', alert: false },
              { coach: 'Sistem', date: '2 gün önce', note: 'Haftalık soru hedefinin %75\'ine ulaşıldı. Motivasyon desteği gerekebilir.', alert: true },
            ].map((feedback, i) => (
              <div key={i} className="relative pl-6 border-l-2 border-slate-800 last:pb-0 pb-6 group">
                <div className={`absolute left-[-5px] top-0 w-2 h-2 rounded-full ${feedback.alert ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <div className="flex justify-between items-center mb-1">
                   <h4 className="text-xs font-black text-slate-300 uppercase tracking-tight">{feedback.coach}</h4>
                   <span className="text-[10px] text-slate-500 font-bold">{feedback.date}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium group-hover:text-slate-300 transition-colors">
                  {feedback.note}
                </p>
              </div>
            ))}
          </div>
          <p className="text-center text-[10px] text-slate-600 mt-6 font-bold uppercase tracking-widest italic">
            * Son 7 günlük değerlendirmeler gösterilmektedir.
          </p>
        </div>
      </div>
    </div>
  );
}
