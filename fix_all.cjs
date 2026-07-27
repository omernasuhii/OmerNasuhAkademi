const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/StudentSummary.tsx', 'utf8');

content = content.replace(/import { AlertTriangle,/g, 'import {');
content = content.replace("import {", "import { AlertTriangle,");

fs.writeFileSync('src/pages/coach/StudentSummary.tsx', content);
