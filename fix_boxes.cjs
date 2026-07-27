const fs = require('fs');
let code = fs.readFileSync('src/pages/students/ExamMetronomeApp.tsx', 'utf8');

// Replace standard stopwatch
code = code.replace(
  /<div className="w-full @container bg-slate-900 border border-amber-500\/30 aspect-\[2\/1\] sm:aspect-\[3\/1\] flex items-center justify-center rounded-\[3rem\] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden shadow-amber-500\/10 p-4 sm:p-8">/g,
  '<div className="w-full bg-slate-900 border border-amber-500/30 py-16 sm:py-24 flex items-center justify-center rounded-[3rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden shadow-amber-500/10 px-4">'
);
code = code.replace(
  /<div className="text-\[14cqw\] sm:text-\[12cqw\] font-bold text-amber-500 tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors"/g,
  '<div className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-amber-500 tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors"'
);

// Replace exam timer active
code = code.replace(
  /<div className=\{`w-full @container bg-slate-900 border border-white\/10 aspect-\[2\/1\] sm:aspect-\[3\/1\] flex items-center justify-center rounded-\[3rem\] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden p-4 sm:p-8 \$\{isRunning \? 'border-' \+ MODES_CFG\[mode\]\.color\.split\('-'\)\[1\] \+ '-500\/30 shadow-' \+ MODES_CFG\[mode\]\.color\.split\('-'\)\[1\] \+ '-500\/10' : ''\}`\}>/g,
  '<div className={`w-full bg-slate-900 border border-white/10 py-16 sm:py-24 flex items-center justify-center rounded-[3rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden px-4 ${isRunning ? \'border-\' + MODES_CFG[mode].color.split(\'-\')[1] + \'-500/30 shadow-\' + MODES_CFG[mode].color.split(\'-\')[1] + \'-500/10\' : \'\'}`}>'
);
code = code.replace(
  /<div className=\{`text-\[14cqw\] sm:text-\[12cqw\] font-bold \$\{MODES_CFG\[mode\]\.textColor\} tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors`\}/g,
  '<div className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold ${MODES_CFG[mode].textColor} tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors`}'
);

// Replace exam mode simulated clock
code = code.replace(
  /<div className=\{`relative w-full @container \$\{isFocusMode \? 'bg-transparent border-transparent' : 'bg-slate-900 border border-white\/10 aspect-\[2\/1\] md:aspect-\[3\/1\] rounded-\[2rem\] shadow-2xl mb-12'\} flex items-center justify-center transition-all duration-500 overflow-hidden`\}>/g,
  '<div className={`relative w-full ${isFocusMode ? \'bg-transparent border-transparent py-20\' : \'bg-slate-900 border border-white/10 py-16 sm:py-24 rounded-[2rem] shadow-2xl mb-12\'} flex items-center justify-center transition-all duration-500 overflow-hidden px-4`}>'
);
code = code.replace(
  /className=\{`text-\[12cqw\] font-bold text-amber-500 tracking-wider leading-none tabular-nums drop-shadow-lg`\}/g,
  'className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-amber-500 tracking-wider leading-none tabular-nums drop-shadow-lg`}'
);

fs.writeFileSync('src/pages/students/ExamMetronomeApp.tsx', code);
