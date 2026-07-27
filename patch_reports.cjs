const fs = require('fs');

let parent = fs.readFileSync('src/pages/parents/ParentPersonality.tsx', 'utf8');
parent = parent.replace(/a\.analysisType !== 'PARENT_REPORT'/g, "!['PARENT_REPORT', 'COACH_REPORT'].includes(a.analysisType)");
fs.writeFileSync('src/pages/parents/ParentPersonality.tsx', parent);

let coach = fs.readFileSync('src/pages/coach/CoachPersonality.tsx', 'utf8');
coach = coach.replace(/a\.analysisType !== 'COACH_REPORT'/g, "!['PARENT_REPORT', 'COACH_REPORT'].includes(a.analysisType)");
fs.writeFileSync('src/pages/coach/CoachPersonality.tsx', coach);

