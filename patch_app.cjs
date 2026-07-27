const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('CoachPersonality')) {
  content = content.replace('import StudentGoals from "./pages/coach/StudentGoals";', 'import StudentGoals from "./pages/coach/StudentGoals";\nimport CoachPersonality from "./pages/coach/CoachPersonality";');
  
  const routeStart = `<Route path="profil" element={<StudentProfile />} />`;
  const routeReplacement = `<Route path="profil" element={<StudentProfile />} />\n                  <Route path="kisilik-analizi" element={<CoachPersonality />} />`;
  
  content = content.replace(routeStart, routeReplacement);
  fs.writeFileSync('src/App.tsx', content);
}
