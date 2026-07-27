const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

// Use Parent context
content = content.replace('export default function Exams() {', 'import { useStudent } from "../../lib/StudentContext";\nexport default function ParentExams() {');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { selectedStudent } = useStudent();');
content = content.replace(/user\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser/g, 'selectedStudent');
content = content.replace('}, []);', '}, [selectedStudent]);');

// Make read-only
content = content.replace(/<button[^>]*onClick=\{[^}]*setShowAddModal\(true\)[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<td className="px-6 py-4 text-right">[\s\S]*?<div className="relative">[\s\S]*?<\/div>\s*<\/td>/g, '');
// For the action menu inside expanded row
content = content.replace(/<div className="relative">\s*<button[\s\S]*?onClick=\{[\s\S]*?setShowActionsFor[\s\S]*?<\/AnimatePresence>\s*<\/div>/g, '');
// The add modal
let startIndex = content.indexOf('{showAddModal && (');
if (startIndex !== -1) {
  let count = 0;
  let endIndex = -1;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') count++;
    else if (content[i] === '}') {
      count--;
      if (count === 0) {
        endIndex = i;
        break;
      }
    }
  }
  if (endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex + 1);
  }
}

// Remove navigate calls for student to parent paths
content = content.replace(/\/panel\/ogrenci\/denemeler/g, '/panel/veli/ogrenci/denemeler'); // actually doesn't exist but wait... does Parent have deneme details page?
// Let's just remove the click on row
// Wait, the row has onClick={() => setExpandedExamId(...)} which is fine.
// But there is a navigate to analiz. We can keep it if we want or remove the onClick from the button
content = content.replace(/onClick=\{\(e\) => {[\s\S]*?navigate\([\s\S]*?\);[\s\S]*?\}\}/g, 'disabled={true}');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
