import fs from 'fs';
let content = fs.readFileSync('src/pages/students/QuestionAnalysis.tsx', 'utf8');
content = content.replace(/\\n {4}ayt: \{/g, '\n    ayt: {');
fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', content);
