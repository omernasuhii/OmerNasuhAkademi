const fs = require('fs');

// Patch src/components/profile/AnalysisResults.tsx
let ar = fs.readFileSync('src/components/profile/AnalysisResults.tsx', 'utf8');
ar = ar.replace('setResults(data);', 'setResults(data.filter((r: any) => ![\'PARENT_REPORT\', \'COACH_REPORT\'].includes(r.analysisType)));');
fs.writeFileSync('src/components/profile/AnalysisResults.tsx', ar);

// Patch src/pages/student/Analyses.tsx
let analyses = fs.readFileSync('src/pages/student/Analyses.tsx', 'utf8');
analyses = analyses.replace('const results = await analysisService.getResults(user.uid);', 'const results = (await analysisService.getResults(user.uid)).filter((r: any) => ![\'PARENT_REPORT\', \'COACH_REPORT\'].includes(r.analysisType));');
fs.writeFileSync('src/pages/student/Analyses.tsx', analyses);

// Patch src/pages/students/Profile.tsx
let profile = fs.readFileSync('src/pages/students/Profile.tsx', 'utf8');
profile = profile.replace('setAnalysisData(analyses || []);', 'setAnalysisData((analyses || []).filter((a: any) => ![\'PARENT_REPORT\', \'COACH_REPORT\'].includes(a.analysisType)));');
fs.writeFileSync('src/pages/students/Profile.tsx', profile);

// Patch src/pages/students/AIAssistant.tsx just in case
let assistant = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');
assistant = assistant.replace('analysisService.getResults(uid)', 'analysisService.getResults(uid).then(res => res.filter((r: any) => ![\'PARENT_REPORT\', \'COACH_REPORT\'].includes(r.analysisType)))');
fs.writeFileSync('src/pages/students/AIAssistant.tsx', assistant);

