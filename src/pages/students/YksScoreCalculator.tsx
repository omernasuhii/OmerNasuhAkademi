import { useState } from 'react';
import { Netleri, calculateScores, ScoreResult } from '../../lib/yksCalculator';
import { Calculator, ChevronDown, ChevronUp, RefreshCw, Award, Target, BookOpen, Brain, BookMarked } from 'lucide-react';

export default function YksScoreCalculator() {
  const [nets, setNets] = useState<Netleri>({
    obp: 100,
    kirikOBP: false,
    tytTr: 0, tytSos: 0, tytMat: 0, tytFen: 0,
    aytMat: 0, aytFiz: 0, aytKim: 0, aytBiy: 0,
    aytEd: 0, aytTar1: 0, aytCog1: 0, aytTar2: 0, aytCog2: 0, aytFel: 0, aytDin: 0,
    ydt: 0
  });

  const [results, setResults] = useState<ScoreResult[] | null>(null);
  const [activeTab, setActiveTab] = useState<'tyt' | 'say' | 'ea' | 'soz' | 'dil'>('say');
  const [expandedSections, setExpandedSections] = useState({ tyt: true, ayt: true, ydt: false });
  const [isCalculating, setIsCalculating] = useState(false);

  const handleInputChange = (field: keyof Netleri, value: string) => {
    let num = parseFloat(value);
    if (isNaN(num)) num = 0;
    
    // Bounds checking
    if (field === 'obp' && num > 100) num = 100;
    if (field === 'obp' && num < 50 && value.length > 2) num = 50; 
    
    // TYT maxes
    if (field === 'tytTr' && num > 40) num = 40;
    if (field === 'tytSos' && num > 20) num = 20;
    if (field === 'tytMat' && num > 40) num = 40;
    if (field === 'tytFen' && num > 20) num = 20;

    // AYT maxes
    if (field === 'aytMat' && num > 40) num = 40;
    if (field === 'aytFiz' && num > 14) num = 14;
    if (field === 'aytKim' && num > 13) num = 13;
    if (field === 'aytBiy' && num > 13) num = 13;
    
    if (field === 'aytEd' && num > 24) num = 24;
    if (field === 'aytTar1' && num > 10) num = 10;
    if (field === 'aytCog1' && num > 6) num = 6;
    if (field === 'aytTar2' && num > 11) num = 11;
    if (field === 'aytCog2' && num > 11) num = 11;
    if (field === 'aytFel' && num > 12) num = 12;
    if (field === 'aytDin' && num > 6) num = 6;
    
    // YDT max
    if (field === 'ydt' && num > 80) num = 80;

    setNets(prev => ({ ...prev, [field]: num }));
  };

  const handleCalculate = async () => {
    try {
      setIsCalculating(true);
      const data = await calculateScores(nets);
      setResults(data);
    } catch (e) {
      console.error(e);
      alert("Puan hesaplanırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsCalculating(false);
    }
  };

  const renderInput = (label: string, field: keyof Netleri, max: number) => (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center text-xs">
        <label className="text-slate-300 font-medium">{label}</label>
        <span className="text-slate-500">{max} Soru</span>
      </div>
      <input
        type="number"
        step="0.25"
        min="-10"
        max={max}
        value={typeof nets[field] === 'number' ? nets[field] : ''}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
        placeholder="Net..."
      />
    </div>
  );

  const formatNumber = (num: number | string) => {
    const n = typeof num === 'string' ? Number(num) : num;
    if (isNaN(n)) return '-';
    return n.toLocaleString('tr-TR', { maximumFractionDigits: 3 });
  };
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-3">
          <Calculator className="text-blue-400" />
          YKS Puan & Sıralama Hesaplama
        </h1>
        <p className="text-slate-400 mt-2">
          Tahmini yks puanı ve geçmiş yıllara göre (2023-2026) sıralamanızı hesaplayın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
               <Award className="text-yellow-400" size={20} />
               Diploma Notu (OBP)
            </h2>
            <div className="flex items-center gap-4">
               <input
                type="number"
                step="0.1"
                min="50"
                max="100"
                value={typeof nets.obp === 'number' ? nets.obp : ''}
                onChange={(e) => handleInputChange('obp', e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-blue-500 transition-all"
                placeholder="50 - 100 arası"
              />
            </div>
            <div className="flex items-center gap-2 mt-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
               <input 
                 type="checkbox" 
                 id="kirikOBP" 
                 checked={nets.kirikOBP} 
                 onChange={(e) => setNets(prev => ({ ...prev, kirikOBP: e.target.checked }))}
                 className="w-4 h-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500 bg-slate-700" 
               />
               <label htmlFor="kirikOBP" className="text-sm text-slate-300 font-medium cursor-pointer">
                 Geçen yıl bir bölüme yerleştim (OBP Yarıya Düşer)
               </label>
            </div>
            <p className="text-xs text-slate-500 mt-2">Diploma puanınızı girin (maksimum 60 puan eklenir).</p>
          </div>

          {/* TYT Inputs */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setExpandedSections(prev => ({ ...prev, tyt: !prev.tyt }))}
              className="w-full px-6 py-4 flex items-center justify-between text-lg font-semibold text-white bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="text-blue-400" size={20} />
                TYT Netleri
              </div>
              {expandedSections.tyt ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            
            {expandedSections.tyt && (
              <div className="p-6 grid grid-cols-2 gap-4">
                {renderInput('Türkçe', 'tytTr', 40)}
                {renderInput('Sosyal', 'tytSos', 20)}
                {renderInput('Matematik', 'tytMat', 40)}
                {renderInput('Fen', 'tytFen', 20)}
              </div>
            )}
          </div>

          {/* AYT Inputs */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setExpandedSections(prev => ({ ...prev, ayt: !prev.ayt }))}
              className="w-full px-6 py-4 flex items-center justify-between text-lg font-semibold text-white bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Brain className="text-purple-400" size={20} />
                AYT Netleri
              </div>
              {expandedSections.ayt ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            
            {expandedSections.ayt && (
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Matematik & Fen</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderInput('Matematik', 'aytMat', 40)}
                    {renderInput('Fizik', 'aytFiz', 14)}
                    {renderInput('Kimya', 'aytKim', 13)}
                    {renderInput('Biyoloji', 'aytBiy', 13)}
                  </div>
                </div>

                <div className="h-px bg-slate-800 w-full"></div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Edebiyat & Sosyal Bilimler</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {renderInput('Edebiyat', 'aytEd', 24)}
                    {renderInput('Tarih-1', 'aytTar1', 10)}
                    {renderInput('Coğrafya-1', 'aytCog1', 6)}
                    {renderInput('Tarih-2', 'aytTar2', 11)}
                    {renderInput('Coğrafya-2', 'aytCog2', 11)}
                    {renderInput('Felsefe Grubu', 'aytFel', 12)}
                    {renderInput('Din Kültürü', 'aytDin', 6)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* YDT Inputs */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
            <button 
              onClick={() => setExpandedSections(prev => ({ ...prev, ydt: !prev.ydt }))}
              className="w-full px-6 py-4 flex items-center justify-between text-lg font-semibold text-white bg-slate-800/20 hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookMarked className="text-pink-400" size={20} />
                YDT Netleri
              </div>
              {expandedSections.ydt ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            
            {expandedSections.ydt && (
              <div className="p-6">
                {renderInput('Yabancı Dil', 'ydt', 80)}
              </div>
            )}
          </div>

          <button 
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 px-6 rounded-2xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
          >
            <RefreshCw size={20} className={isCalculating ? "animate-spin" : ""} /> 
            {isCalculating ? "Hesaplanıyor..." : "Puanları Hesapla"}
          </button>
        </div>

        {/* Right Side: Results */}
        <div className="lg:col-span-8">
          {!results ? (
            <div className="bg-slate-900/30 border border-slate-800/50 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <Calculator size={40} className="text-slate-500" />
              </div>
              <h3 className="text-xl font-medium text-slate-300">Hesaplama İçin Bekleniyor</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Sol taraftan netlerinizi girerek "Puanları Hesapla" butonuna tıklayın. Yıllara göre tahmini sıralamalarınızı görün.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 p-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl">
                {(['tyt', 'say', 'ea', 'soz', 'dil'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[80px] py-2.5 px-4 rounded-lg font-medium text-sm transition-all capitalize ${
                      activeTab === tab 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Latest Year Highlight */}
              <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded uppercase tracking-wider font-bold">Milli Eğitim Kaynağı Tahmini</span>
                    {activeTab.toUpperCase()} Sonuçlarınız
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                    <p className="text-slate-400 text-sm font-medium mb-1">Yerleşme Puanı</p>
                    <p className="text-3xl font-bold text-white">{formatNumber(results[0][activeTab].yerlestirme)}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                    <p className="text-slate-400 text-sm font-medium mb-1">Ham Puan</p>
                    <p className="text-3xl font-bold text-slate-300">{formatNumber(results[0][activeTab].ham)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-xl p-5 border border-indigo-500/20">
                    <p className="text-indigo-300 text-sm font-medium mb-1 flex items-center gap-2">Tahmini Sıralama</p>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                      {results[0][activeTab].siralama === 3000000 ? 'Baraj Altı' : results[0][activeTab].siralama}
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 text-xs text-slate-500 border-t border-slate-800 pt-4 flex gap-2 relative z-10">
                   <Target size={16} className="text-indigo-400 flex-shrink-0" /> 
                   <span>Bu tahmini sıralamalar ve puanlar <strong>Milli Eğitim Bakanlığı OGM Materyal</strong> altyapısı üzerinden 2026 yılına yönelik öngörü yapılarak anlık olarak hesaplanmaktadır.</span>
                </div>
              </div>

              {/* Data Table for All Years */}
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                   <h3 className="text-lg font-semibold text-white">Geçmiş Yıllara Göre Sıralama Karşılaştırması</h3>
                   <span className="text-xs text-slate-500 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">Aynı netlerle elde edilen sıralamalar</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/30 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-6 py-4 font-medium border-b border-slate-800">Yıl</th>
                        <th className="px-6 py-4 font-medium border-b border-slate-800 text-right">Sıralama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {results.slice(1).map((res) => (
                        <tr key={res.year} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-white font-medium">{res.year}</td>
                          <td className="px-6 py-4 text-right font-bold text-indigo-400 font-mono text-lg">
                             {res[activeTab].siralama === 3000000 ? 'Baraj Altı' : formatNumber(res[activeTab].siralama)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
