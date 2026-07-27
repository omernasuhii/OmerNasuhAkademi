const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/CoachLayout.tsx', 'utf8');

if (!content.includes('kisilik-analizi')) {
  content = content.replace('{ title: \'Öğrenci Profili\', path: \'profil\', icon: BrainCircuit },', '{ title: \'Öğrenci Profili\', path: \'profil\', icon: BrainCircuit },\n    { title: \'Kişilik Analizi\', path: \'kisilik-analizi\', icon: Brain },');
  
  if (!content.includes('Brain,')) {
    content = content.replace('BrainCircuit,', 'BrainCircuit,\n  Brain,');
  }
  
  fs.writeFileSync('src/pages/coach/CoachLayout.tsx', content);
}
