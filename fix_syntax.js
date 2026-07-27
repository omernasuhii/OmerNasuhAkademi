const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

// There is a stray `{` before `{ category: "9. Sınıf Denemeleri",`
content = content.replace('    {\n          {\n      category: "9. Sınıf Denemeleri",', '    {\n      category: "9. Sınıf Denemeleri",');
fs.writeFileSync('src/pages/student/Exams.tsx', content);
