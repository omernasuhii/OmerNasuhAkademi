const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// Hide "Yeni Deneme Ekle"
content = content.replace(
  /<button[\s\S]*?<Plus size=\{18\} \/> Yeni Deneme Ekle\s*<\/button>/g,
  ''
);

// Disable the MoreHorizontal dropdown
content = content.replace(
  /<button[^>]*onClick=\{\(\) => setShowActionsFor[\s\S]*?<\/button>/g,
  '<button className="hidden"></button>'
);

// Prevent "Analiz Et" routing
content = content.replace(
  /onClick=\{\(e\) => \{\n\s*e\.stopPropagation\(\);\n\s*navigate\(\`\/student\/exams\/\$\{exam\.id\}\/analysis\`\);\n\s*\}\}/g,
  'onClick={(e) => { e.stopPropagation(); }} style={{ opacity: 0.5, cursor: "not-allowed" }}'
);

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
