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
// It's a button element containing "Yeni Deneme Ekle". We'll replace it.
content = content.replace(/<button[^>]*>[\s\S]*?<Plus size=\{18\} \/> Yeni Deneme Ekle\s*<\/button>/, '');

// Disable "Analiz Et" routing
content = content.replace(/onClick=\{\(e\) => {[\s\S]*?navigate\([\s\S]*?\);[\s\S]*?\}\}/g, 'disabled={true}');

// What about the "..." dropdown button?
// If we just disable click, it might be fine, but wait.
// `setShowActionsFor(null)` doesn't route, it just shows a menu. The menu has buttons to navigate which we disabled.
// "Sıralama Ekle", "Düzenle", "Sil" -> I will just leave them disabled, or wait, we can hide the menu.
// The MoreHorizontal button:
content = content.replace(/<div className="relative">\s*<button[\s\S]*?<MoreHorizontal size=\{20\} \/>\s*<\/button>/g, '<div className="relative">');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
