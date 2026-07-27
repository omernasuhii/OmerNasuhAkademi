import fs from 'fs';
const code = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');
const i = code.indexOf('Görev Yok');
console.log(code.substring(i, i + 1000));
