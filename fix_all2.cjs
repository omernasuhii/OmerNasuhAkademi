const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/StudentSummary.tsx', 'utf8');

content = content.replace("import { AlertTriangle, motion } from 'motion/react';", "import { motion } from 'motion/react';");
content = content.replace("import { \n  BookOpen,", "import { AlertTriangle, BookOpen,");

if (!content.includes("AlertTriangle,")) {
  content = content.replace("import {\n  BookOpen,", "import {\n  AlertTriangle,\n  BookOpen,");
}

fs.writeFileSync('src/pages/coach/StudentSummary.tsx', content);
