import React from 'react';
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NoStudentSelected() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-slate-900/40 border border-white/5 rounded-[40px] text-center p-8 space-y-6 animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
        <Compass size={32} />
      </div>
      <div className="max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-white">Seçili Öğrenci Bulunamadı</h2>
        <p className="text-slate-400 text-sm">
          Örnek öğrenci profili sistem turu tamamlandığı için kapatılmıştır. Bir öğrenci detayı görüntülemek için lütfen listenizden seçim yapın.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          to="/panel/koc/ogrenciler"
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-lg"
        >
          Öğrencilerim Sayfasına Git
        </Link>
        <Link
          to="/panel/koc"
          className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 transition-all"
        >
          Koç Paneline Dön
        </Link>
      </div>
    </div>
  );
}