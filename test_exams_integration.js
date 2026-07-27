const fs = require('fs');
let code = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');
if (code.includes('await studentDataService.addExamResult(payload);')) {
  console.log('Found addExamResult');
}
