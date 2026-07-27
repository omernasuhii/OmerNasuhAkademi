const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

content = content.replace(
  /<button\n\s*onClick=\{\(\) => setShowActionsFor\(showActionsFor === exam\.id \? null : exam\.id\)\}\n\s*className="p-2 text-slate-400 hover:text-white hover:bg-white\/10 rounded-lg transition-colors"\n\s*>\n\s*<MoreHorizontal size=\{20\} \/>\n\s*<\/button>/g,
  '{false && <button><MoreHorizontal size={20} /></button>}'
);

content = content.replace(
  /<button\n\s*onClick=\{\(e\) => \{\n\s*e\.stopPropagation\(\);\n\s*navigate\(\`\/parent\/exams\/\$\{exam\.id\}\/analysis\`\);\n\s*\}\}\n\s*className="text-\[10px\] font-black uppercase text-indigo-400 bg-indigo-500\/10 hover:bg-indigo-500\/20 px-2 py-1 rounded border border-indigo-500\/20 transition-colors"\n\s*>\n\s*Analiz Et\n\s*<\/button>/g,
  '{false && <button>Analiz Et</button>}'
);

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
