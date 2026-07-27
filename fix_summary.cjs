const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // We need to add taskDone and taskNotDone increments inside the isQuestion block
  const targetBlock = `
              const taskUnsolved = Math.max(0, target - solved);
              weekStats.unsolved += taskUnsolved;
              globalUnsolved += taskUnsolved;
`;
  
  const targetReplacement = `
              const taskUnsolved = Math.max(0, target - solved);
              weekStats.unsolved += taskUnsolved;
              globalUnsolved += taskUnsolved;
              if (task.isDone) {
                 weekStats.taskDone += 1;
                 globalTaskDone += 1;
              } else {
                 weekStats.taskNotDone += 1;
                 globalTaskNotDone += 1;
              }
`;

  code = code.replace(targetBlock, targetReplacement);

  const targetExtraBlock = `
            } else {
              solved = Number(task.completedCount) || 0;
            }
`;

  const targetExtraReplacement = `
            } else {
              solved = Number(task.completedCount) || 0;
              if (task.isDone) {
                 weekStats.taskDone += 1;
                 globalTaskDone += 1;
              }
            }
`;

  code = code.replace(targetExtraBlock, targetExtraReplacement);

  fs.writeFileSync(filePath, code);
}

fixFile('src/pages/coach/StudentSummary.tsx');
fixFile('src/pages/coach/CoachOverallAssessment.tsx');
