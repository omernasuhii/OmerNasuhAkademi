const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

// Use Parent context
content = content.replace('export default function Exams()', 'import { useStudent } from "../../lib/StudentContext";\nexport default function ParentExams()');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { selectedStudent } = useStudent();');
content = content.replace(/user\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser/g, 'selectedStudent');
content = content.replace('}, []);', '}, [selectedStudent]);');

// Hide the "Yeni Deneme Ekle" button by adding hidden to className
content = content.replace(/className="bg-emerald-600 hover:bg-emerald-500/g, 'className="hidden bg-emerald-600 hover:bg-emerald-500');

// Hide the Actions dropdown entirely
content = content.replace(/<MoreHorizontal size=\{20\} \/>/g, '<MoreHorizontal size={20} className="hidden" />');

// Prevent "Analiz Et" buttons from routing by disabling them
// Actually just replace "Analiz Et" buttons' navigate calls.
content = content.replace(/navigate\([\s\S]*?\)/g, 'console.log("Navigation disabled")');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
