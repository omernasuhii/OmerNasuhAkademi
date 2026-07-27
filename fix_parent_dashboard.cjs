const fs = require('fs');
let code = fs.readFileSync('src/pages/parents/ParentDashboard.tsx', 'utf8');

const tytCalcStr = `const tytExams = sortedExams.filter(e => e.examType === 'TYT' || e.examType === 'YKS').slice(0, 3);
  const avgTytNet = tytExams.length > 0 ? (tytExams.reduce((acc, curr) => acc + getExamNet(curr, 'TYT'), 0) / tytExams.length) : 0;
  const targetTyt = studentProfile?.targetTyt || 120;
  const targetPct = Math.min(100, Math.round((avgTytNet / targetTyt) * 100));`;

const aytCalcStr = tytCalcStr + `
  const aytExams = sortedExams.filter(e => e.examType === 'AYT' || e.examType === 'YKS').slice(0, 3);
  const avgAytNet = aytExams.length > 0 ? (aytExams.reduce((acc, curr) => acc + getExamNet(curr, 'AYT'), 0) / aytExams.length) : 0;
  const targetAyt = studentProfile?.targetAyt || 80;
  const targetAytPct = Math.min(100, Math.round((avgAytNet / targetAyt) * 100));`;

code = code.replace(tytCalcStr, aytCalcStr);

const tytDomStr = `{/* Target Progress Circular/Bar */}
          <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl min-w-[280px] w-full md:w-auto backdrop-blur-xl">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">TYT Hedef İlerlemesi</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">{avgTytNet.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-500">/ {targetTyt} Net</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-black text-lg px-3 py-1 rounded-xl">
                  %{targetPct}
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: \`\${targetPct}%\` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
              />
            </div>
          </div>`;

const aytDomStr = `<div className="flex flex-col gap-3">
          ${tytDomStr}
          <div className="bg-slate-950/50 border border-white/5 p-6 rounded-3xl min-w-[280px] w-full md:w-auto backdrop-blur-xl">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">AYT Hedef İlerlemesi</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white tabular-nums leading-none">{avgAytNet.toFixed(1)}</span>
                  <span className="text-xs font-bold text-slate-500">/ {targetAyt} Net</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center justify-center bg-emerald-500/10 text-emerald-400 font-black text-lg px-3 py-1 rounded-xl">
                  %{targetAytPct}
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: \`\${targetAytPct}%\` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            </div>
          </div>
          </div>`;

code = code.replace(tytDomStr, aytDomStr);

fs.writeFileSync('src/pages/parents/ParentDashboard.tsx', code);
