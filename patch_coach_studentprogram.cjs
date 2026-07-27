const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/StudentProgram.tsx', 'utf8');

const targetStr = `      {task.isExtra && (
        <div className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-lg z-10 flex items-center gap-0.5">
           <Sparkles size={8} /> Öğrenci Ekledi
        </div>
      )}`;

const insertStr = `      {task.isExtra && (
        <div className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-lg z-10 flex items-center gap-0.5">
           <Sparkles size={8} /> Öğrenci Ekledi
        </div>
      )}
      {task.isWaitingResult && (
        <div className="absolute -bottom-2 -left-2 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-lg z-10 flex items-center gap-0.5">
           Sonuç Bekleniyor
        </div>
      )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found for coach student program');
}

fs.writeFileSync('src/pages/coach/StudentProgram.tsx', content);
