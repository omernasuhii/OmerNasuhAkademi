const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

console.log("Original content length:", content.length);

// Use Parent context
content = content.replace('export default function Exams()', 'import { useStudent } from "../../lib/StudentContext";\nexport default function ParentExams()');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { selectedStudent } = useStudent();');
content = content.replace(/user\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser/g, 'selectedStudent');
content = content.replace('}, []);', '}, [selectedStudent]);');

// Make read-only
content = content.replace(/<button[^>]*onClick=\{[^}]*setShowAddModal\(true\)[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<td className="px-6 py-4 text-right">[\s\S]*?<div className="relative">[\s\S]*?<\/div>\s*<\/td>/g, '');

// Removing the actions dropdown div entirely inside the expanded row
// Let's use a regex that matches `<div className="relative">` inside the map.
// Actually, let's just remove the `<MoreHorizontal ... />` button and its parent `<div className="relative">` block up to `</AnimatePresence></div>`
let moreHorizRegex = /<div className="relative">\s*<button[\s\S]*?onClick=\{[\s\S]*?setShowActionsFor[\s\S]*?<\/AnimatePresence>\s*<\/div>/g;
content = content.replace(moreHorizRegex, '');

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
content = content.replace(/onClick=\{\(e\) => {[\s\S]*?navigate\([\s\S]*?\);[\s\S]*?\}\}/g, 'disabled={true}');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
console.log("Wrote to ParentExams.tsx, new length:", content.length);
