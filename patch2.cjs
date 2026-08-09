const fs = require('fs');
let code = fs.readFileSync('src/pages/students/TercihRobotu.tsx', 'utf8');

code = code.replace(
  'const [minTolerancePercent, setMinTolerancePercent] = useState<number>(30);',
  'const [minTolerancePercent, setMinTolerancePercent] = useState<number>(20);'
);

code = code.replace(
  'const [maxTolerancePercent, setMaxTolerancePercent] = useState<number>(50);',
  'const [maxTolerancePercent, setMaxTolerancePercent] = useState<number>(10);'
);

const flexRegex = /<div className="flex flex-wrap gap-2">([\s\S]*?)<\/div>\s*\{Object\.keys\(studentRanks\)[\s\S]*?\)\}/m;

const match = code.match(flexRegex);

if (match) {
  const replacement = `<div className="flex flex-wrap gap-2 items-center">
                      {selectedPointTypes.map(pType => (
                        <div key={\`rank-input-\${pType}\`} className="flex-1 min-w-[130px] flex items-center bg-slate-900/80 rounded-lg p-1.5 border border-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                          <div className="bg-blue-600 text-white font-black text-[10px] uppercase px-2 py-1.5 rounded-md text-center shadow-sm">
                            {pType}
                          </div>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Sıralama..."
                              value={studentRanks[pType] || ""}
                              onChange={(e) => handleStudentRankChange(pType, e.target.value)}
                              className="w-full bg-transparent border-none py-1 pl-2 pr-6 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-0 font-mono font-medium"
                            />
                            {studentRanks[pType] && (
                              <Check size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Esneklik Ayarı (Aynı Satırda) */}
                      <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg p-1.5 border border-white/5 ml-auto shrink-0 mt-2 sm:mt-0">
                        <div className="flex items-center gap-1.5" title="Sıralamanızın % kaç altına inilebileceğini belirler">
                          <span className="text-[9px] text-rose-400 font-bold uppercase whitespace-nowrap">Alt (Kötü) %</span>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={maxTolerancePercent}
                            onChange={(e) => handleMaxToleranceChange(Number(e.target.value))}
                            className="w-12 bg-slate-950/50 border border-white/10 rounded py-1 px-1 text-xs text-center text-white focus:outline-none focus:border-rose-500/50 font-mono"
                          />
                        </div>
                        <div className="w-px h-4 bg-white/10"></div>
                        <div className="flex items-center gap-1.5" title="Sıralamanızın % kaç üstüne çıkılabileceğini belirler">
                          <span className="text-[9px] text-emerald-400 font-bold uppercase whitespace-nowrap">Üst (İyi) %</span>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={minTolerancePercent}
                            onChange={(e) => handleMinToleranceChange(Number(e.target.value))}
                            className="w-12 bg-slate-950/50 border border-white/10 rounded py-1 px-1 text-xs text-center text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                          />
                        </div>
                      </div>
                    </div>`;
  
  code = code.replace(match[0], replacement);
  fs.writeFileSync('src/pages/students/TercihRobotu.tsx', code);
  console.log("Success");
} else {
  console.log("Match not found");
}
