const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/CoachPersonality.tsx', 'utf8');

content = content.replace(/ParentPersonality/g, 'CoachPersonality');
content = content.replace(/PARENT_REPORT/g, 'COACH_REPORT');
content = content.replace(/\/api\/parent-report-generate/g, '/api/coach-report-generate');
content = content.replace(/Veli Bilgilendirme Raporu/g, 'Koç Değerlendirme Raporu');
content = content.replace(/veli bilgilendirme raporu/g, 'koç değerlendirme raporu');
content = content.replace(/Veli Raporu/g, 'Koç Raporu');
content = content.replace(/veli/g, 'koç');
content = content.replace(/Veli/g, 'Koç');

fs.writeFileSync('src/pages/coach/CoachPersonality.tsx', content);
