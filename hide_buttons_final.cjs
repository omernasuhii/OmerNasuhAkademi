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

// Hide the actions menu button
content = content.replace(/<div className="relative">\s*<button[\s\S]*?setShowActionsFor[\s\S]*?<\/button>\s*<AnimatePresence>/g, '<div className="relative">{false && <button>Actions</button>}<AnimatePresence>');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
