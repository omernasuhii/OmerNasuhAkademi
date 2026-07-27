const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentReports.tsx', 'utf8');

const targetStr = `                                    <div
                                      key={tIdx}
                                      className={\`p-3 rounded-2xl border flex items-center justify-between text-xs \${
                                        task.isDone
                                          ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                                          : "bg-slate-900/50 border-white/5 text-slate-400"
                                      }\`}
                                    >`;

const insertStr = `                                    <div
                                      key={tIdx}
                                      className={\`p-3 rounded-2xl border flex items-center justify-between text-xs \${
                                        task.isWaitingResult
                                          ? "bg-amber-500/5 border-amber-500/10 text-amber-300"
                                          : task.isDone
                                            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                                            : "bg-slate-900/50 border-white/5 text-slate-400"
                                      }\`}
                                    >
`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found for parent reports');
}

fs.writeFileSync('src/pages/parents/ParentReports.tsx', content);
