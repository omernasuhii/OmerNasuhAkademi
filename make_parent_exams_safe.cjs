const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// Use Parent context
content = content.replace('export default function Exams()', 'import { useStudent } from "../../lib/StudentContext";\nexport default function ParentExams()');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { selectedStudent } = useStudent();');
content = content.replace(/user\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser/g, 'selectedStudent');
content = content.replace('}, []);', '}, [selectedStudent]);');

// Just hide the "Yeni Deneme Ekle" button by injecting {false && ...}
content = content.replace(
  /<button[^>]*>\s*<Plus size=\{18\} \/> Yeni Deneme Ekle\s*<\/button>/g,
  '{false && <button>Yeni Deneme Ekle</button>}'
);

// Prevent "Analiz Et" from routing by making it a no-op if parent
content = content.replace(
  /onClick=\{\(e\) => \{\n\s*e\.stopPropagation\(\);\n\s*navigate\(\`\/student\/exams\/\$\{exam\.id\}\/analysis\`\);\n\s*\}\}/g,
  'onClick={(e) => { e.stopPropagation(); navigate(`/parent/exams/${exam.id}/analysis`); }}'
);

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
