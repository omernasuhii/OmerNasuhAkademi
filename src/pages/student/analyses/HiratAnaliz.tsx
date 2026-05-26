import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Sparkles, ChevronRight, ChevronLeft, Save, AlertCircle, CheckCircle2, BarChart3, Target, Calendar, Info, Calculator } from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';

const categories = [
  { id: 'math', label: 'MATEMATİK (Soru)', unit: 'Soru' },
  { id: 'turkish', label: 'TÜRKÇE (Paragraf)', unit: 'Soru' },
  { id: 'subject', label: 'KONU (Video/Okuma)', unit: 'Dakika' },
  { id: 'exam', label: 'DENEME (Adet)', unit: 'Adet' },
  { id: 'revision', label: 'TEKRAR (Hata Analizi)', unit: 'Dakika' },
  { id: 'sleep', label: 'UYKU (Günlük Ort.)', unit: 'Saat' },
  { id: 'focus', label: 'DİKKAT (Pomodoro)', unit: 'Adet' }
];

export default function HiratAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  
  const [data, setData] = useState<Record<string, { target: number; actual: number; quality: number }>>(
    categories.reduce((acc, cat) => ({
      ...acc,
      [cat.id]: { target: 0, actual: 0, quality: 0 }
    }), {})
  );

  const calculateResults = () => {
    let totalTarget = 0;
    let totalActual = 0;
    
    // We only sum numerical targets like questions, minutes, etc. 
    // Sleep and focus are different but for a general score we can weigh them or just skip.
    // Let's sum everything for a raw HPP as per doc.
    Object.values(data).forEach(row => {
      totalTarget += row.target;
      totalActual += row.actual;
    });

    const hpp = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    
    let riskLevel = 'YEŞİL (Güvenli)';
    let riskColor = 'text-emerald-400';
    
    if (hpp > 110) {
      riskLevel = 'MAVİ (Aşırı Yükleme)';
      riskColor = 'text-blue-400';
    } else if (hpp < 70) {
      riskLevel = 'KIRMIZI (Kritik Risk)';
      riskColor = 'text-red-500';
    } else if (hpp < 90) {
      riskLevel = 'SARI (Takip Gerekli)';
      riskColor = 'text-amber-400';
    }

    return { hpp, riskLevel, riskColor };
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const results = calculateResults();
      await analysisService.saveResult(user.uid, 'HIRAT', {
        categories: data,
        ...results,
        week: new Date().toISOString().split('T')[0]
      });
      setCompleted(true);
      setTimeout(() => navigate('/panel/ogrenci/analizler'), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white">Haftalık Rapor Kaydedildi!</h2>
          <p className="text-slate-400 font-medium">Verilerin koçuna iletildi. Bir sonraki seansında bu tabloyu yorumlayacaksınız.</p>
        </div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Laboratuvara Dön
          </button>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">HEDEF İZLEME VE RİSK ANALİZ TABLOSU (HİRAT)</h1>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <BarChart3 size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Analiz Amacı</h3>
                  <p className="text-slate-400 leading-relaxed font-medium text-sm">
                    Haftalık çalışma performansını sayısal verilere dökerek, hedeften sapma oranını hesaplar. "Çalışıyorum ama yetişmiyor" kaygısını somut verilere dönüştürür.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                  <Brain size={24} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Bilimsel Temel</h3>
                  <p className="text-slate-400 leading-relaxed font-medium text-sm">
                    <strong>Sibernetik Kontrol Kuramı</strong> ve <strong>SMART Hedef Yönetimi</strong> prensiplerine dayanır. Erken uyarı sistemi ile başarısızlık riskini önceden tespit eder.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 shadow-lg">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calculator size={14} className="text-emerald-500" />
                  Performans Skalası
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-slate-300">%90 - %100: Hedef Tuttu (Yeşil)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-300">%70 - %89: Sinyal Modu (Sarı)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-slate-300">%0 - %69: Kritik Risk (Kırmızı)</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-500">
                  <Info size={18} />
                  <h4 className="text-sm font-black uppercase tracking-widest">Nasıl Uygulanır?</h4>
                </div>
                <p className="text-[11px] text-emerald-200/70 leading-relaxed font-medium">
                  Haftalık çalışma planındaki hedeflerini (Soru, Dakika vb.) ilgili alanlara gir. Haftanın sonunda gerçekleşen rakamları ve kaliteni (Doğru %) dürüstçe yaz.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
            <button
              onClick={() => setShowIntro(false)}
              className="w-full md:w-auto px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3"
            >
              Haftalık Kapanışa Başla
              <ChevronRight size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="space-y-4">
        <button 
          onClick={() => setShowIntro(true)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Tanıtıma Dön
        </button>
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <BarChart3 size={12} />
              HİRAT TABLOSU
            </div>
            <h1 className="text-3xl font-black text-white">Haftalık Performans Girişi</h1>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5 font-black text-xs text-slate-500 uppercase tracking-widest">
            <Calendar size={14} />
            BU HAFTA
          </div>
        </div>
      </header>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-6 md:p-10 overflow-x-auto shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-6 px-4 text-xs font-black text-slate-500 uppercase tracking-widest">KATEGORİ</th>
              <th className="text-center py-6 px-4 text-xs font-black text-slate-500 uppercase tracking-widest w-40">HEDEF (Plan)</th>
              <th className="text-center py-6 px-4 text-xs font-black text-slate-500 uppercase tracking-widest w-40">GERÇEKLEŞEN</th>
              <th className="text-center py-6 px-4 text-xs font-black text-slate-500 uppercase tracking-widest w-40">KALİTE (Doğru %)</th>
              <th className="text-center py-6 px-4 text-xs font-black text-slate-500 uppercase tracking-widest w-32">BAŞARI %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {categories.map((cat) => {
                const row = data[cat.id];
                const successRate = row.target > 0 ? (row.actual / row.target) * 100 : 0;
                
                return (
                    <tr key={cat.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-6 px-4">
                            <div className="space-y-1">
                                <p className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{cat.label}</p>
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{cat.unit} bazında</p>
                            </div>
                        </td>
                        <td className="py-6 px-4">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={row.target === 0 ? '' : row.target}
                                    onChange={(e) => setData(p => ({ ...p, [cat.id]: { ...p[cat.id], target: parseInt(e.target.value) || 0 } }))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white font-black text-lg focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5"
                                />
                            </div>
                        </td>
                        <td className="py-6 px-4">
                            <div className="relative">
                                <input
                                    type="number"
                                    value={row.actual === 0 ? '' : row.actual}
                                    onChange={(e) => setData(p => ({ ...p, [cat.id]: { ...p[cat.id], actual: parseInt(e.target.value) || 0 } }))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white font-black text-lg focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5"
                                />
                            </div>
                        </td>
                        <td className="py-6 px-4">
                            <div className="relative">
                                <input
                                    type="number"
                                    max="100"
                                    min="0"
                                    value={row.quality === 0 ? '' : row.quality}
                                    onChange={(e) => setData(p => ({ ...p, [cat.id]: { ...p[cat.id], quality: Math.min(100, parseInt(e.target.value) || 0) } }))}
                                    className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white font-black text-lg focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-black">%</span>
                            </div>
                        </td>
                        <td className="py-6 px-4 text-center">
                            <span className={`text-xl font-black ${
                                successRate >= 90 ? 'text-emerald-400' :
                                successRate >= 70 ? 'text-amber-400' :
                                successRate > 0 ? 'text-red-400' : 'text-slate-700'
                            }`}>
                                {Math.round(successRate)}%
                            </span>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>

        <div className="mt-10 pt-10 border-t border-white/10 flex justify-end gap-4">
            <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-3 px-10 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-lg shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50"
            >
                {loading ? 'Sistem İşleniyor...' : 'Haftayı Kapat ve Verileri Kaydet'}
                <Save size={24} />
            </button>
        </div>
      </div>
    </div>
  );
}
