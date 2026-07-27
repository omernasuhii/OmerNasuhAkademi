const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// Use Parent context
content = content.replace('export default function Exams()', 'import { useStudent } from "../../lib/StudentContext";\nexport default function ParentExams()');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { selectedStudent } = useStudent();');
content = content.replace(/user\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser/g, 'selectedStudent');
content = content.replace('}, []);', '}, [selectedStudent]);');

// Hide "Yeni Deneme Ekle" button
content = content.replace(/<button[^>]*>[\s\S]*?<Plus size=\{18\} \/> Yeni Deneme Ekle\s*<\/button>/, '');

// Hide action buttons in the table
// Instead of complex regex, let's just make the "Analiz Et" button disabled.
content = content.replace(/onClick=\{\(e\) => {[\s\S]*?navigate\([\s\S]*?\);[\s\S]*?\}\}/g, 'disabled={true}');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
