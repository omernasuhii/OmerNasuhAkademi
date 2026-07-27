const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

const targetStr4 = `<p className={\`text-xs truncate \${task.isDone ? 'text-emerald-500/70' : 'text-slate-400'}\`}>{task.topic}</p>`;
const insertStr4 = `<p className={\`text-xs truncate \${task.isWaitingResult ? 'text-amber-500/70' : task.isDone ? 'text-emerald-500/70' : 'text-slate-400'}\`}>{task.topic}</p>`;

const targetStr5 = `<span className={\`font-black text-sm \${task.isDone ? 'text-emerald-400' : 'text-white'}\`}>{task.targetCount}</span>`;
const insertStr5 = `<span className={\`font-black text-sm \${task.isWaitingResult ? 'text-amber-400' : task.isDone ? 'text-emerald-400' : 'text-white'}\`}>{task.targetCount}</span>`;

if (content.includes(targetStr4)) {
  content = content.replace(targetStr4, insertStr4);
} else {
  console.log('targetStr4 not found');
}
if (content.includes(targetStr5)) {
  content = content.replace(targetStr5, insertStr5);
} else {
  console.log('targetStr5 not found');
}

fs.writeFileSync('src/pages/students/Summary.tsx', content);
