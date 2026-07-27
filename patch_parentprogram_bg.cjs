const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentProgram.tsx', 'utf8');

const targetStr = `                      className={\`p-3 rounded-2xl border transition-all \${
                        task.isDone 
                          ? 'bg-emerald-500/5 border-emerald-500/20' 
                          : 'bg-slate-900 border-white/5'
                      }\`}`;

let replaced = false;
content = content.replace(/className={`p-3 rounded-2xl border transition-all \${\s*task\.isDone\s*\?\s*'bg-emerald-500\/5 border-emerald-500\/20'\s*:\s*'bg-slate-900 border-white\/5'\s*}`}/g, () => {
    replaced = true;
    return "className={`p-3 rounded-2xl border transition-all ${task.isWaitingResult ? 'bg-amber-500/5 border-amber-500/20' : task.isDone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-white/5'}`}";
});

if (!replaced) console.log("Regex didn't match");

fs.writeFileSync('src/pages/parents/ParentProgram.tsx', content);
