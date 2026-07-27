const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

// Find the part where it creates the task
const targetRegex = /targetCount: 1,\s*completedCount: 1/g;
if (content.match(targetRegex)) {
  console.log("Found targetCount: 1, replacing...");
  
  // We need to calculate totalSolved before creating the task
  const newCode = `
      // Calculate total solved
      const totalSolved = Object.values(newResult.scores).reduce((acc, curr) => {
        return acc + (Number(curr.correct) || 0) + (Number(curr.incorrect) || 0);
      }, 0);
  
      try {
        const user = auth.currentUser;
`;

  // We should replace try { const user = auth.currentUser; 
  content = content.replace(/try\s*\{\s*const user = auth\.currentUser;/g, newCode);
  
  // Now replace targetCount: 1, completedCount: 1 with totalSolved
  content = content.replace(/targetCount:\s*1,\s*completedCount:\s*1/g, 'targetCount: totalSolved || 1,\n                        completedCount: totalSolved || 1');
  
  fs.writeFileSync('src/pages/student/Exams.tsx', content);
  console.log("Patched Exams.tsx");
} else {
  console.log("Could not find targetCount: 1 in Exams.tsx");
}
