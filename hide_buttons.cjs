const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

// Use Parent context
content = content.replace('export default function Exams()', 'import { useStudent } from "../../lib/StudentContext";\nexport default function ParentExams()');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { selectedStudent } = useStudent();');
content = content.replace(/user\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser/g, 'selectedStudent');
content = content.replace('}, []);', '}, [selectedStudent]);');

// Hide "Yeni Deneme Ekle" button
content = content.replace(/<button[^>]*>[\s\S]*?<Plus size=\{18\} \/> Yeni Deneme Ekle\s*<\/button>/, '{false && <button>Yeni Deneme Ekle</button>}');

// We just don't want them to click "Düzenle", "Sil", or "Analiz Et".
// We can find navigate calls and replace them with console.log
content = content.replace(/navigate\([\s\S]*?\)/g, 'console.log("Navigation disabled for parents")');
content = content.replace(/setEditingExamId/g, 'console.log');
content = content.replace(/setExamToDelete/g, 'console.log');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
