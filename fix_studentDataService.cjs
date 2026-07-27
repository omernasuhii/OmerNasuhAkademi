const fs = require('fs');
let code = fs.readFileSync('src/services/studentDataService.ts', 'utf8');

code = code.replace(
  /async getExamResults\(studentId: string\) {\s*const path = 'exam_results';/g,
  "async getExamResults(studentId: string) {\n    if (!studentId) return [];\n    const path = 'exam_results';"
);

code = code.replace(
  /async getWeeklyReports\(studentId: string\) {\s*const path = 'weekly_reports';/g,
  "async getWeeklyReports(studentId: string) {\n    if (!studentId) return [];\n    const path = 'weekly_reports';"
);

fs.writeFileSync('src/services/studentDataService.ts', code);
