const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

content = content.replace(
  `                                          <div key={task.id} className={\`p-4 rounded-xl border transition-all \${task.isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : bgClasses}\`}>`,
  `                                          <div key={task.id} className={\`p-4 rounded-xl border transition-all \${task.isWaitingResult ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : task.isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : bgClasses}\`}>`
);

fs.writeFileSync('src/pages/student/Coaching.tsx', content);
