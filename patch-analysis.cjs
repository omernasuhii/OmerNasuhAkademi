const fs = require('fs');
let content = fs.readFileSync('src/pages/student/ExamAnalysis.tsx', 'utf8');

const saveCode = `
      await studentDataService.saveExamAnalysis(analysis);

      // Find the daily program for the exam date and update the Deneme task
      if (exam && exam.date) {
         const programs = await studentDataService.getDailyPrograms(auth.currentUser?.uid, [exam.date]);
         if (programs && programs.length > 0) {
            const program = programs[0];
            let totalQuestions = 0;
            if (analysis && analysis.data) {
               Object.values(analysis.data).forEach(branchArray => {
                  branchArray.forEach(q => { totalQuestions++; });
               });
            }
            if (totalQuestions > 0) {
               const updatedTasks = program.tasks.map(t => {
                  if (t.type === 'Deneme' && t.isExtra && t.isDone) {
                     return { ...t, targetCount: totalQuestions, completedCount: totalQuestions };
                  }
                  return t;
               });
               await studentDataService.saveDailyProgram({ ...program, tasks: updatedTasks });
            }
         }
      }

      // Refresh to get potentially new ID if it was a create
`;

content = content.replace(/await studentDataService\.saveExamAnalysis\(analysis\);\s*\/\/ Refresh to get potentially new ID if it was a create/g, saveCode);

fs.writeFileSync('src/pages/student/ExamAnalysis.tsx', content);
console.log("Patched ExamAnalysis.tsx");
