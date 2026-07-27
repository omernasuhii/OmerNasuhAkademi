const fs = require('fs');

let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// Add useStudent import
if (!content.includes('import { useStudent }')) {
  content = content.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\nimport { useStudent } from "../../lib/StudentContext";');
}

// Replace auth.currentUser?.uid with selectedStudent?.uid
content = content.replace(/user\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/auth\.currentUser/g, 'selectedStudent');

// Fix useEffect dependencies
content = content.replace('}, []);', '}, [selectedStudent]);');

// Make it read-only by removing add/delete buttons
content = content.replace(/<button[^>]*onClick=\{[^}]*setShowAddModal\(true\)[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<button[^>]*onClick=\{[^}]*setEditingExamId[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<button[^>]*onClick=\{[^}]*handleDeleteExam[^}]*\}[^>]*>[\s\S]*?<\/button>/g, '');

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
