const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentAssistant.tsx', 'utf8');

content = content.replace(
  'analysisService.getResults(studentId)',
  'analysisService.getResults(studentId).then(res => res.filter((r: any) => ![\'PARENT_REPORT\', \'COACH_REPORT\'].includes(r.analysisType)))'
);

fs.writeFileSync('src/pages/parents/ParentAssistant.tsx', content);
