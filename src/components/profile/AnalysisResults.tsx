import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { analysisService } from '../../services/analysisService';
import { useAuth } from '../../lib/AuthContext';
import { Brain, FileText, Calendar, ChevronRight, Activity, Target, AlertCircle, Star, Heart, GraduationCap, ShieldCheck, Zap, BarChart3, Scale, Search, PenTool, Gavel, Clock, ShieldAlert, BookOpen, Users, Monitor, UserCheck, Candy, ShieldCheck as ShieldIcon, Eye, Compass, Snowflake, Puzzle, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyses, categoryMap } from '../../pages/student/Analyses';

export default function AnalysisResults({ searchTerm = '', selectedCategory = 'Tümü' }: { searchTerm?: string, selectedCategory?: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadResults();
    }
  }, [user]);

  const loadResults = async () => {
    try {
      const data = await analysisService.getResults(user!.uid);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <Activity className="animate-spin text-blue-500" size={32} />
    </div>
  );

  if (results.length === 0) return (
    <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center">
      <Brain className="mx-auto text-slate-600 mb-4" size={48} />
      <h3 className="text-lg font-bold text-slate-400">Henüz Analiz Tamamlamadın</h3>
      <p className="text-sm text-slate-500 mt-2">Laboratuvar kısmına giderek ilk analizini yapabilirsin.</p>
    </div>
  );

  const filteredResults = results.filter((result) => {
    const analysisDef = analyses.find((a) => a.id === result.analysisType);
    const category = categoryMap[result.analysisType] || 'Genel Değerlendirme';
    
    const matchesCategory = selectedCategory === 'Tümü' || category === selectedCategory;
    const matchesSearch = !searchTerm || 
      (analysisDef && (
        analysisDef.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        analysisDef.description.toLowerCase().includes(searchTerm.toLowerCase())
      ));
      
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
         <h3 className="text-xl font-bold text-white flex items-center gap-2">
           <Brain className="text-blue-400" size={24} />
           Tamamlanan Analiz Çıktıları
         </h3>
         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
           Toplam {filteredResults.length} Analiz
         </span>
      </div>

      {filteredResults.length === 0 ? (
        <div className="bg-slate-900/50 border border-dashed border-white/10 rounded-[32px] p-12 flex flex-col items-center justify-center text-center gap-4">
           <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-500 mb-2">
            <Search className="h-8 w-8" />
           </div>
           <h3 className="text-xl font-bold text-white">Sonuç Bulunamadı</h3>
           <p className="text-slate-400 max-w-md mx-auto">
             "{searchTerm}" aramasına ve seçilen kategoriye uygun tamamlanmış analiz bulunamadı.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((result) => (
            <motion.div
            key={result.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:border-blue-500/30 transition-all group"
          >
            {result.analysisType === 'OZ-AF' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">360° ÖZ-AF</div>
                    <h4 className="text-white font-bold">Öz-Analiz Raporu</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/10">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter mb-1">Güçlü Yön</p>
                    <p className="text-xs text-white font-medium truncate">{result.data.swot.strengths[0] || 'Belirtilmemiş'}</p>
                  </div>
                  <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/10">
                    <p className="text-[10px] font-black text-red-400 uppercase tracking-tighter mb-1">Zayıf Yön</p>
                    <p className="text-xs text-white font-medium truncate">{result.data.swot.weaknesses[0] || 'Belirtilmemiş'}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Target size={12} /> Yaşam Çarkı Başarı Oranı
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ 
                        width: `${(Object.values(result.data.wheel).reduce((a: any, b: any) => a + b, 0) as number / 60) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Dürüstlük Rozeti">
                        <Star size={12} className="text-white fill-white" />
                      </div>
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Analiz Rozeti">
                        <Brain size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-300 transition-colors"
                   >
                     Detaylı Raporu Gör <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}

            {result.analysisType === 'ABBA' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ABBA ENVANTERİ</div>
                    <h4 className="text-white font-bold">Aile ve Benlik Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="bg-pink-500/10 rounded-xl p-2 border border-pink-500/10 flex flex-col items-center">
                    <Heart size={14} className="text-pink-400 mb-1" />
                    <p className="text-[10px] font-black text-pink-400 uppercase tracking-tighter">Aile</p>
                    <p className="text-sm text-white font-black">{(result.data.averages.family || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-indigo-500/10 rounded-xl p-2 border border-indigo-500/10 flex flex-col items-center">
                    <ShieldCheck size={14} className="text-indigo-400 mb-1" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Benlik</p>
                    <p className="text-sm text-white font-black">{(result.data.averages.self || 0).toFixed(1)}</p>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-2 border border-emerald-500/10 flex flex-col items-center">
                    <GraduationCap size={14} className="text-emerald-400 mb-1" />
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter">Akademik</p>
                    <p className="text-sm text-white font-black">{(result.data.averages.academic || 0).toFixed(1)}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Bilinç Rozeti">
                        <Activity size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                   >
                     Analizi Detaylandır <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}

            {result.analysisType === 'AG-MOT' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-red-400 uppercase tracking-widest">AG-MOT ÖLÇEĞİ</div>
                    <h4 className="text-white font-bold">Motivasyon Blokajları</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Seviyesi</p>
                    <p className={`text-lg font-black ${result.data.riskColor}`}>{result.data.riskLevel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toplam Skor</p>
                    <p className="text-lg font-black text-white">{result.data.totalScore}/100</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Motivasyon">
                        <Zap size={12} className="text-white fill-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1 hover:text-red-300 transition-colors"
                   >
                     Detaylı İncele <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'HIRAT' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">HİRAT TABLOSU</div>
                    <h4 className="text-white font-bold">Haftalık Performans</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex flex-col items-center">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-tighter mb-1">Gereçekleşme (HPP)</p>
                    <p className="text-2xl font-black text-white">%{Math.round(result.data.hpp)}</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Risk Durumu</p>
                    <p className={`text-xs font-black uppercase text-center ${result.data.riskColor}`}>{result.data.riskLevel.split(' ')[0]}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Verimlilik">
                        <BarChart3 size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300 transition-colors"
                   >
                     Raporu Detaylandır <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'AID-Y' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest">AİD-Y ATÖLYESİ</div>
                    <h4 className="text-white font-bold">İnanç Dönüşümü</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Çalışılan İnanç</p>
                   <p className="text-xs text-white font-medium italic line-clamp-2">"{result.data.negativeBelief}"</p>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Zihinsel">
                        <Scale size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1 hover:text-orange-300 transition-colors"
                   >
                     Atölyeyi İncele <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'ADTE-20' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">ADTE-20 TARAMASI</div>
                    <h4 className="text-white font-bold">Odak ve Dikkat Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/10 flex flex-col items-center justify-center space-y-1">
                      <p className="text-[10px] font-black text-purple-400 uppercase tracking-tighter">Dikkat (Bölüm A)</p>
                      <p className="text-xl text-white font-black">{result.data.scores.partA}/30</p>
                   </div>
                   <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/10 flex flex-col items-center justify-center space-y-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Dürtü (Bölüm B)</p>
                      <p className="text-xl text-white font-black">{result.data.scores.partB}/30</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Odak">
                        <Clock size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1 hover:text-purple-300 transition-colors"
                   >
                     Riski Analiz Et <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'APEA-3D' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">APEA-3D ANALİZİ</div>
                    <h4 className="text-white font-bold">Performans Engel Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   <div className="bg-blue-500/10 rounded-2xl p-4 border border-blue-500/10 flex flex-col items-center justify-center space-y-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Bilişsel</p>
                      <p className="text-xl text-white font-black">{result.data.scores.cognitive}/50</p>
                   </div>
                   <div className="bg-pink-500/10 rounded-2xl p-4 border border-pink-500/10 flex flex-col items-center justify-center space-y-1">
                      <p className="text-[10px] font-black text-pink-400 uppercase tracking-tighter">Duygusal</p>
                      <p className="text-xl text-white font-black">{result.data.scores.emotional}/50</p>
                   </div>
                   <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/10 flex flex-col items-center justify-center space-y-1">
                      <p className="text-[10px] font-black text-amber-400 uppercase tracking-tighter">Davranış</p>
                      <p className="text-xl text-white font-black">{result.data.scores.behavioral}/50</p>
                   </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Analiz">
                        <ShieldAlert size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                   >
                     Raporu Detaylandır <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'APK-S' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">APK-S ÖLÇEĞİ</div>
                    <h4 className="text-white font-bold">Sınav Kaygısı Stresi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Risk Durumu</p>
                    <p className="text-lg font-black text-rose-400">
                      {result.data.riskLevel || 'Hesaplanıyor'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Skor</p>
                    <p className="text-lg font-black text-white">{result.data.scores?.total || 0}/120</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Kaygı Analizi">
                        <Activity size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 hover:text-rose-300 transition-colors"
                   >
                     Raporu Görüntüle <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'AB-CTE' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">AB-CTE ÇALIŞMASI</div>
                    <h4 className="text-white font-bold">İçgörü Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Çalışma Durumu</p>
                   <p className="text-xs text-white font-medium italic">Bilinçaltı Yansımalar ve Tamamlamalar</p>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="İçgörü">
                        <PenTool size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 hover:text-cyan-300 transition-colors"
                   >
                     İncelemeyi Gör <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'AS-EQ' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AS-EQ ENVANTERİ</div>
                    <h4 className="text-white font-bold">Duygusal Zekâ Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">EQ Skoru</p>
                    <p className={`text-lg font-black ${result.data.scores.total >= 100 ? 'text-emerald-400' : result.data.scores.total >= 75 ? 'text-blue-400' : 'text-red-400'}`}>
                      {result.data.scores.total >= 100 ? 'Yüksek' : result.data.scores.total >= 75 ? 'Orta' : 'Düşük'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toplam</p>
                    <p className="text-lg font-black text-white">{result.data.scores.total}/125</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="EQ Profili">
                        <Brain size={12} className="text-white fill-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300 transition-colors"
                   >
                     Raporu Görüntüle <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'AYCE' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest">AYÇE ENVANTERİ</div>
                    <h4 className="text-white font-bold">Çalışma Stratejisi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Strateji Skoru</p>
                    <p className={`text-lg font-black ${result.data.scores.total >= 76 ? 'text-emerald-400' : result.data.scores.total >= 51 ? 'text-orange-400' : 'text-red-400'}`}>
                      {result.data.scores.total >= 76 ? 'Profesyonel' : result.data.scores.total >= 51 ? 'Gelişmekte' : 'Amatör'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toplam</p>
                    <p className="text-lg font-black text-white">{result.data.scores.total}/100</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Strateji Profili">
                        <BookOpen size={12} className="text-white fill-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1 hover:text-orange-300 transition-colors"
                   >
                     Raporu Görüntüle <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'AT-CM' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AT-ÇM MODÜLÜ</div>
                    <h4 className="text-white font-bold">Akıllı Tuş / Çıpalama</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Eşleşen Duygu</p>
                    <p className="text-lg font-black text-indigo-400">
                      {result.data.answers.chosenEmotion}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tuş Konumu</p>
                    <p className="text-xs font-bold text-white truncate max-w-[100px]">{result.data.answers.chosenAnchor}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Akıllı Tuş">
                        <Zap size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                   >
                     Detayları Gör <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'ADDE-20' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">ADDE-20 ÖLÇEĞİ</div>
                    <h4 className="text-white font-bold">Aile Destek Algısı</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Destek Profili</p>
                    <p className="text-sm font-black text-white truncate max-w-[150px]">
                      {result.data.profile}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Skor</p>
                    <p className="text-lg font-black text-rose-400">{result.data.scores.total}/100</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Aile Desteği">
                        <Users size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 hover:text-rose-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'ADT-Ö' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ADT-Ö ANALİZİ</div>
                    <h4 className="text-white font-bold">Branş Bazlı Tutum</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kritik Teşhis</p>
                    <p className="text-sm font-black text-white uppercase tracking-tighter">
                      {result.data.diagnosis[0] || 'BELİRGİN DİRENÇ YOK'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branş Sayısı</p>
                    <p className="text-lg font-black text-indigo-400">
                      {Object.keys(result.data.ratings).length}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Branş Analizi">
                        <BookOpen size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'B-AVO' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">B-AVO MODÜLÜ</div>
                    <h4 className="text-white font-bold">Bilişsel Anti-Virüs</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temizlik Durumu</p>
                    <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter">
                      SİSTEM TEMİZ
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kaygı Azalması</p>
                    <p className="text-lg font-black text-emerald-400">
                      -{result.data.scores.drop} PK
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Zihinsel Güvenlik">
                        <ShieldIcon size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'ÇDÖ-E' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ÇDÖ-E ENVANTERİ</div>
                    <h4 className="text-white font-bold">Öz-Disiplin Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">İrade Profili</p>
                    <p className="text-sm font-black text-white uppercase tracking-tighter">
                      {result.data.profile}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Toplam Skor</p>
                    <p className="text-lg font-black text-emerald-400">
                      {result.data.scores.total}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Akademik Disiplin">
                        <UserCheck size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'AMID' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest">AMİD MODÜLÜ</div>
                    <h4 className="text-white font-bold">İnanç Değişim Protokolü</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yeni İnanç</p>
                    <p className="text-xs font-black text-emerald-400 truncate max-w-[150px]">
                      {result.data.answers.newBelief}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Değişim Oranı</p>
                    <p className="text-lg font-black text-violet-400">
                      %{Math.round(((result.data.answers.preScore - result.data.answers.postScore) / 10) * 100)}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="İnanç Değişimi">
                        <Monitor size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-1 hover:text-violet-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'Ç-MOD-AI-AUDIT' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Ç-MOD ANALİZİ</div>
                    <h4 className="text-white font-bold">Çikolata Modeli AI İçgörüsü</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">İRADE DEĞERLENDİRMESİ</p>
                    <p className="text-sm font-black text-emerald-400 uppercase tracking-tighter">
                      AI MÜFETTİŞ RAPORU
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Haz Yönetimi">
                        <Candy size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1 hover:text-amber-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'ÇZ-8' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">ÇZ-8 ENVANTERİ</div>
                    <h4 className="text-white font-bold">Çoklu Zekâ Alanları</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Baskın Zekâ</p>
                    <p className="text-sm font-black text-indigo-400 uppercase tracking-tighter truncate max-w-[150px]">
                      {result.data.scores ? 
                        Object.entries(result.data.scores as Record<string, number>).sort(([,a], [,b]) => b - a)[0][0].replace('S', 'Sözel').replace('M', 'Mantıksal').replace('G', 'Görsel').replace('R', 'Müziksel').replace('B', 'Bedensel').replace('K', 'Sosyal').replace('I', 'İçsel').replace('D', 'Doğacı')
                        : 'Belirlenmedi'
                      }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Puan</p>
                    <p className="text-lg font-black text-white">
                      {result.data.scores ? 
                        Object.entries(result.data.scores as Record<string, number>).sort(([,a], [,b]) => b - a)[0][1]
                        : '0'
                      }/15
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Zeka Profili">
                        <Brain size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'DART' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">DART ENVANTERİ</div>
                    <h4 className="text-white font-bold">Hedef ve Eylem Planı</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Makro Hedef</p>
                    <p className="text-sm font-black text-rose-400 uppercase tracking-tighter line-clamp-1 max-w-[200px]">
                      {result.data.answers?.makro || 'Belirtilmedi'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Hedef Profili">
                        <Target size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 hover:text-rose-300 transition-colors"
                   >
                     AI Raporunu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'DOPA' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">DOPA ENVANTERİ</div>
                    <h4 className="text-white font-bold">Dikkat Odaklanma</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atlanan (Omission)</p>
                    <p className="text-lg font-black text-orange-400">
                      {result.data.performance?.totalOmissions}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yanlış (Commission)</p>
                    <p className="text-lg font-black text-rose-400">
                      {result.data.performance?.totalCommissions}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Dikkat Profili">
                        <Eye size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 hover:text-cyan-300 transition-colors"
                   >
                     Raporu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'GTS-36' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">GTS-36 SİMÜLASYONU</div>
                    <h4 className="text-white font-bold">Tercih ve Gelecek</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hedef Meslek</p>
                    <p className="text-sm font-black text-indigo-400 uppercase tracking-tighter line-clamp-1 max-w-[200px]">
                      {result.data.answers?.targetProfession || 'Belirtilmedi'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Tercih Simülasyonu">
                        <Compass size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                   >
                     AI Raporunu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'IM-OM' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest">İM-OM MODÜLÜ</div>
                    <h4 className="text-white font-bold">İçsel Motor</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atalet Skoru</p>
                    <p className="text-xl font-black text-rose-400">
                      {result.data.totalScore}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Durum</p>
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                       {result.data.totalScore >= 40 ? 'Bozuk' : result.data.totalScore >= 25 ? 'İstek Var' : 'Çalışıyor'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Oto-Motivasyon">
                        <Zap size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1 hover:text-rose-300 transition-colors"
                   >
                     AI Raporunu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'K-E-A' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">K-E-A MODÜLÜ</div>
                    <h4 className="text-white font-bold">Kartopu Etkisi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Görev Sayısı</p>
                    <p className="text-xl font-black text-cyan-400">
                      {[1, 2, 3].filter(n => result.data.answers?.[`subject${n}`]).length} Adet
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Durum</p>
                    <p className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                       Zincir Başladı
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Alışkanlık">
                        <Snowflake size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-cyan-400 uppercase tracking-widest flex items-center gap-1 hover:text-cyan-300 transition-colors"
                   >
                     AI Raporunu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'KOLB-DÖSE' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest">KOLB-DÖSE</div>
                    <h4 className="text-white font-bold">Öğrenme Stilleri</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Baskın Stiliniz</p>
                    <p className="text-base font-black text-fuchsia-400">
                      {result.data.resultsData?.typeTitle?.split(' (')[0] || 'Hesaplanıyor'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-fuchsia-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Öğrenme Stili">
                        <Puzzle size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-fuchsia-400 uppercase tracking-widest flex items-center gap-1 hover:text-fuchsia-300 transition-colors"
                   >
                     AI Raporunu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'MERCEK' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">MERCEK</div>
                    <h4 className="text-white font-bold">Bakış Açısı Esnekliği</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Yük Değişimi</p>
                    <p className="text-lg font-black text-indigo-400">
                      { (result.data.form?.preScore || 0) } → { (result.data.form?.postScore || 0) }
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fark</p>
                    <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                       -{ (result.data.form?.preScore || 0) - (result.data.form?.postScore || 0) } Birim
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Zihinsel Esneklik">
                        <Eye size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-300 transition-colors"
                   >
                     AI Raporunu Oku <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'ÖTI-A' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ÖTI-A</div>
                    <h4 className="text-white font-bold">Öğrenci Ön Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1 text-center flex-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Disiplin Skoru</p>
                    <p className={`text-base font-black ${(result.data.behaviorScore || 0) < 26 ? 'text-rose-400' : (result.data.behaviorScore || 0) < 40 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {result.data.behaviorScore || result.data.form?.behaviorScore}/50
                    </p>
                  </div>
                  <div className="flex items-center justify-center flex-1">
                     <BarChart3 size={24} className="text-emerald-400" />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                       <UserCheck size={14} className="text-emerald-500" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{result.data.form?.academic?.target?.substring(0, 15)}...</span>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 hover:text-emerald-400 transition-colors"
                   >
                     Stratejini Gör <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}
            {result.analysisType === 'MÇ-ZP' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">MÇ-ZP</div>
                    <h4 className="text-white font-bold">Mükemmellik Çemberi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="space-y-1 text-center flex-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kaynak Duygu</p>
                    <p className="text-base font-black text-yellow-400">
                      {result.data.form?.neededEmotion?.label}
                    </p>
                  </div>
                  <div className="flex items-center justify-center -space-x-4 flex-1">
                     <div className={`w-10 h-10 rounded-full blur-xl animate-pulse ${result.data.form?.circleColor?.class}`} />
                     <Sparkles size={16} className="text-yellow-400 relative z-10" />
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                   <div className="flex -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center ring-2 ring-slate-900 border border-white/10" title="Özgüven Çapası">
                        <Zap size={12} className="text-white" />
                      </div>
                   </div>
                   <button 
                     onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                     className="text-[10px] font-black text-yellow-500 uppercase tracking-widest flex items-center gap-1 hover:text-yellow-300 transition-colors"
                   >
                     Portalına Gir <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            )}

            {/* Yeni Eklenen Analiz Türleri İçin Bloklar */}
            {result.analysisType === 'VAK-S' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">VAK-S</div>
                    <h4 className="text-white font-bold">Öğrenme Stilleri Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                    <Calendar size={12} />
                    {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                  </div>
                </div>
                <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/10 flex items-center justify-between">
                   <div className="text-center flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Görsel</p>
                      <p className="text-lg font-black text-white">{result.data.results?.counts?.G || 0}</p>
                   </div>
                   <div className="text-center flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">İşitsel</p>
                      <p className="text-lg font-black text-white">{result.data.results?.counts?.İ || 0}</p>
                   </div>
                   <div className="text-center flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Kinestetik</p>
                      <p className="text-lg font-black text-white">{result.data.results?.counts?.K || 0}</p>
                   </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-end">
                   <button onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">Raporu Gör <ChevronRight size={14} /></button>
                </div>
              </div>
            )}

            {result.analysisType === 'SP-BE' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest">SP-BE</div>
                    <h4 className="text-white font-bold">Stres Profili Analizi</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium"><Calendar size={12} />{result.timestamp?.toDate().toLocaleDateString('tr-TR')}</div>
                </div>
                <div className="bg-rose-500/10 p-4 rounded-2xl border border-rose-500/10 flex items-center justify-between">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase">Stres Tipi</p>
                      <p className="text-sm font-black text-white uppercase italic">{result.data.results?.dominantType || 'Hesaplanıyor'}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-500 uppercase">SAVAŞ</p>
                      <p className="text-lg font-black text-rose-500">{result.data.results?.counts?.A || 0}/6</p>
                   </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-end">
                   <button onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)} className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-1">Strateji Planını Gör <ChevronRight size={14} /></button>
                </div>
              </div>
            )}

            {result.analysisType === 'KLS' && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">KLS</div>
                    <h4 className="text-white font-bold">Kariyer Seçim Laboratuvarı</h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium"><Calendar size={12} />{result.timestamp?.toDate().toLocaleDateString('tr-TR')}</div>
                </div>
                <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/10">
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Mizaç ve Kariyer Odak Noktası</p>
                   <p className="text-sm font-medium text-white italic">Yetenek ve değerlerini kapsayan mesleki haritanız oluşturuldu.</p>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-end">
                   <button onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">Kariyer Yolunu Gör <ChevronRight size={14} /></button>
                </div>
              </div>
            )}

            {['ZS-ODO', 'SI-GOZ', 'SW-D', 'TOTE', 'WD-3D', 'T-LINE', 'VGF-E', 'SOC-A', 'PDAR-360', 'SS-DKM', 'SZP-30', 'ZG-ZP', 'SCM', 'SD-SYE'].includes(result.analysisType) && (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{result.analysisType}</div>
                    <h4 className="text-white font-bold">
                        {result.analysisType === 'ZS-ODO' ? 'Zihinsel Sabotaj Analizi' :
                         result.analysisType === 'SI-GOZ' ? 'Sihirli Gözlükler' :
                         result.analysisType === 'SW-D' ? 'SWISH İmaj Dönüştürme' :
                         result.analysisType === 'TOTE' ? 'TOTE Döngü Analizi' :
                         result.analysisType === 'WD-3D' ? 'Walt Disney Planlama' :
                         result.analysisType === 'T-LINE' ? 'Zaman Çizgisi Motivasyonu' :
                         result.analysisType === 'VGF-E' ? 'Veli Gözlem Envanteri' :
                         result.analysisType === 'SOC-A' ? 'Soru Okuma Stratejisi' :
                         result.analysisType === 'PDAR-360' ? 'Panoramik Deneme Analizi' :
                         result.analysisType === 'SS-DKM' ? 'Sınav Sonrası Karar Matrisi' :
                         result.analysisType === 'SZP-30' ? 'Son 30 Gün Zirve Performans' :
                         result.analysisType === 'ZG-ZP' ? 'Zor Gün Zafer Planı' :
                         result.analysisType === 'SCM' ? 'Sınav Check-up ve Motivasyon' :
                         result.analysisType === 'SD-SYE' ? 'Stratejik Sınav Yönetimi' : 'Psikolojik Analiz Raporu'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium"><Calendar size={12} />{result.timestamp?.toDate().toLocaleDateString('tr-TR')}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                         {result.analysisType === 'SI-GOZ' ? <Eye size={20} /> : <Brain size={20} />}
                      </div>
                      <p className="text-xs font-medium text-slate-300">Analiz başarıyla tamamlandı ve raporunuz oluşturuldu.</p>
                   </div>
                </div>
                <div className="pt-4 border-t border-white/5 flex justify-end">
                   <button onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)} className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">AI Geri Bildirimini Gör <ChevronRight size={14} /></button>
                </div>
              </div>
            )}

            {/* Fallback card for undefined or non-mapped types */}
            {!['OZ-AF', 'ABBA', 'AG-MOT', 'HIRAT', 'AID-Y', 'ADTE-20', 'APEA-3D', 'APK-S', 'AB-CTE', 'AS-EQ', 'AYCE', 'AT-CM', 'ADDE-20', 'ADT-Ö', 'B-AVO', 'ÇDÖ-E', 'AMID', 'Ç-MOD-AI-AUDIT', 'ÇZ-8', 'DART', 'DOPA', 'GTS-36', 'IM-OM', 'K-E-A', 'KOLB-DÖSE', 'MERCEK', 'ÖTI-A', 'MÇ-ZP', 'VAK-S', 'SP-BE', 'KLS', 'ZS-ODO', 'SI-GOZ', 'SW-D', 'TOTE', 'WD-3D', 'T-LINE', 'VGF-E', 'SOC-A', 'PDAR-360', 'SS-DKM', 'SZP-30', 'ZG-ZP', 'SCM', 'SD-SYE'].includes(result.analysisType) && (
               <div className="space-y-4">
                 <div className="flex justify-between items-start">
                   <div className="space-y-1">
                     <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{result.analysisType}</div>
                     <h4 className="text-white font-bold">Analiz Raporu</h4>
                   </div>
                   <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                     <Calendar size={12} />
                     {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
                   </div>
                 </div>
                 <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <Brain className="text-slate-500" size={24} />
                    <p className="text-xs text-white font-medium italic">Bu analiz için otomatik rapor oluşturuldu.</p>
                 </div>
                 <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button 
                      onClick={() => navigate(`/panel/ogrenci/analizler/sonuc/${result.id}`)}
                      className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1 hover:text-blue-300 transition-colors"
                    >
                      Raporu Görüntüle <ChevronRight size={14} />
                    </button>
                 </div>
               </div>
            )}
          </motion.div>
        ))}
      </div>
      )}

      
      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
        <AlertCircle className="text-amber-500 shrink-0" size={18} />
        <p className="text-[10px] text-amber-200/70 leading-relaxed font-medium">
          <strong>Önemli Laboratuvar Notu:</strong> Yukarıdaki çıktılar öz-analiz araçlarıdır. Klinik teşhis içermez. Eğer akademik kaygı veya stres seviyende aşırı yükselme hissedersen mutlaka bir uzman psikolojik danışmanla veya koçunla görüşmelisin.
        </p>
      </div>
    </div>
  );
}
