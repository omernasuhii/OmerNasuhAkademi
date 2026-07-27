const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// Using exact string matching to be safe
content = content.replace('        </div>\n\n      <div className="bg-slate-900/40 border', '        </div>\n      </div>\n\n      <div className="bg-slate-900/40 border');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
console.log("Patched ParentExams.tsx");
