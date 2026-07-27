const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentProgram.tsx', 'utf8');

const targetStr = `                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={\`text-xs font-black uppercase tracking-wider \${
                              task.isDone ? 'text-emerald-400' : 'text-blue-400'
                            }\`}>
                              {task.subject}
                            </span>
                          </div>`;

const insertStr = `                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={\`text-xs font-black uppercase tracking-wider \${
                              task.isDone && !task.isWaitingResult ? 'text-emerald-400' : task.isWaitingResult ? 'text-amber-400' : 'text-blue-400'
                            }\`}>
                              {task.subject}
                            </span>
                            {task.isWaitingResult && (
                              <span className="text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">
                                Sonuç Bekleniyor
                              </span>
                            )}
                          </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found for parent program');
}

fs.writeFileSync('src/pages/parents/ParentProgram.tsx', content);
