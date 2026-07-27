const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

content = content.replace(
  `                                                                {task.isDone ? (
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20" title="Deneme sonucu girildi.">`,
  `                                                                {task.isDone && !task.isWaitingResult ? (
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20" title="Deneme sonucu girildi.">`
);

fs.writeFileSync('src/pages/student/Coaching.tsx', content);
