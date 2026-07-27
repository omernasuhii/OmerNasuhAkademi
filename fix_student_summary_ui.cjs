const fs = require('fs');
let code = fs.readFileSync('src/pages/coach/StudentSummary.tsx', 'utf8');

// 1. Remove the quote
code = code.replace(
  /<div className="mt-8 flex items-center gap-3 p-4 bg-white\/5 rounded-2xl border border-white\/5">[\s\S]*?"Ulaşılacak hiçbir yer yoktur ki, büyük adımlarla gidilsin."[\s\S]*?<\/div>/,
  ''
);

// 2. Fix the layout stretch of the Coach Note
code = code.replace(
  '<div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col">',
  '<div className="lg:col-span-1 bg-slate-900/40 border border-white/5 rounded-3xl p-8 flex flex-col h-fit">'
);
code = code.replace(
  '<div className="flex-1 bg-white/5 rounded-2xl p-6 border border-white/5 relative">',
  '<div className="bg-white/5 rounded-2xl p-6 border border-white/5 relative">'
);

fs.writeFileSync('src/pages/coach/StudentSummary.tsx', code);
