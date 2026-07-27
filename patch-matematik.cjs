const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  content = content.replace(/Matematik: \["Matematik", "AYT Matematik"\]/g, 'Matematik: ["Matematik", "AYT Matematik", "Geometri", "AYT Geometri"]');
  
  content = content.replace(/if \(branch === "Matematik"\) expectedFields = \["Matematik"\];/g, 'if (branch === "Matematik") expectedFields = ["Matematik", "Geometri"];');
  
  content = content.replace(/if \(branchName === "Matematik"\) expectedFields = \["Matematik"\];/g, 'if (branchName === "Matematik") expectedFields = ["Matematik", "Geometri"];');

  fs.writeFileSync(filepath, content);
  console.log(`Patched ${filepath}`);
}

patchFile('src/pages/student/Exams.tsx');
patchFile('src/pages/parents/ParentExams.tsx');
patchFile('src/pages/student/ExamAnalysis.tsx');
