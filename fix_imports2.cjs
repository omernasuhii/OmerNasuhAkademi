const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

content = content.replace(/import { AlertTriangle, /g, 'import { ');

// Re-add AlertTriangle to lucide-react import
content = content.replace("import { Target,", "import { AlertTriangle, Target,");

fs.writeFileSync('src/pages/students/Summary.tsx', content);
