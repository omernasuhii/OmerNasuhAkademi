const fs = require('fs');
let code = fs.readFileSync('src/pages/students/ExamMetronomeApp.tsx', 'utf8');

code = code.replace(
  '<div className="w-full @container bg-slate-900 border border-amber-500/30 aspect-[2/1] sm:aspect-[2.5/1] flex items-center justify-center rounded-[3rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden shadow-amber-500/10">',
  '<div className="w-full @container bg-slate-900 border border-amber-500/30 aspect-[2/1] sm:aspect-[3/1] flex items-center justify-center rounded-[3rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden shadow-amber-500/10 p-4 sm:p-8">'
);

code = code.replace(
  '<div className="text-[20cqw] font-bold text-amber-500 tracking-wider leading-none tabular-nums drop-shadow-lg transition-colors"',
  '<div className="text-[14cqw] sm:text-[12cqw] font-bold text-amber-500 tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors"'
);

fs.writeFileSync('src/pages/students/ExamMetronomeApp.tsx', code);
