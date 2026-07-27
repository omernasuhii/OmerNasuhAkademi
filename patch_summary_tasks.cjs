const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

const targetStr = `<div key={idx} className={\`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group \${task.isDone ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}\`}>`;
const insertStr = `<div key={idx} className={\`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group \${task.isWaitingResult ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/30' : task.isDone ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}\`}>`;

const targetStr2 = `<div className={\`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors shadow-sm \${task.isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20' : 'border-slate-500/50 text-transparent bg-black/20 group-hover:border-slate-400'}\`}>`;
const insertStr2 = `<div className={\`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors shadow-sm \${task.isWaitingResult ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20' : task.isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20' : 'border-slate-500/50 text-transparent bg-black/20 group-hover:border-slate-400'}\`}>`;

const targetStr3 = `<h4 className={\`text-sm font-bold truncate transition-colors \${task.isDone ? 'text-emerald-400' : 'text-white'}\`}>{task.subject}</h4>`;
const insertStr3 = `
<div className="flex items-center gap-2">
  <h4 className={\`text-sm font-bold truncate transition-colors \${task.isWaitingResult ? 'text-amber-400' : task.isDone ? 'text-emerald-400' : 'text-white'}\`}>{task.subject}</h4>
  {task.isWaitingResult && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Sonuç Bekleniyor</span>}
</div>
`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found');
}
if (content.includes(targetStr2)) {
  content = content.replace(targetStr2, insertStr2);
} else {
  console.log('targetStr2 not found');
}
if (content.includes(targetStr3)) {
  content = content.replace(targetStr3, insertStr3);
} else {
  console.log('targetStr3 not found');
}

fs.writeFileSync('src/pages/students/Summary.tsx', content);
