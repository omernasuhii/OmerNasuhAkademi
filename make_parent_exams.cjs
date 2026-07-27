const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// 1. Rename component and context
content = content.replace('export default function Exams()', 'import { useStudent } from "../../lib/StudentContext";\nexport default function ParentExams()');
content = content.replace('const navigate = useNavigate();', 'const navigate = useNavigate();\n  const { selectedStudent } = useStudent();');

// 2. Replace auth checks
content = content.replace(/auth\.currentUser\?\.uid/g, 'selectedStudent?.uid');
content = content.replace(/const user = auth\.currentUser;/g, 'const user = selectedStudent;');

content = content.replace('}, []);', '}, [selectedStudent]);');

// 3. Hide the button EXACTLY
content = content.replace(
  'className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 whitespace-nowrap"',
  'className="hidden"'
);

// 4. Hide the actions menu
content = content.replace(
  '<button\n                                onClick={() => setShowActionsFor(showActionsFor === exam.id ? null : exam.id)}\n                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"',
  '<button\n                                onClick={() => {}}\n                                className="hidden"'
);

// 5. Hide the 'Analiz Et' buttons by replacing onClick
content = content.replace(
  /onClick=\{\(e\) => \{\n\s*e\.stopPropagation\(\);\n\s*navigate\(\`\/student\/exams\/\$\{exam\.id\}\/analysis\`\);\n\s*\}\}/g,
  'disabled={true} style={{opacity: 0.5}} onClick={(e) => e.stopPropagation()}'
);

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
