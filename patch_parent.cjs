const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentDashboard.tsx', 'utf8');

if (!content.includes('NotificationPrompt')) {
  content = content.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\nimport { NotificationPrompt } from '../../components/NotificationPrompt';");
  
  content = content.replace('<div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-6 lg:p-8 animate-in fade-in duration-700">', '<div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-6 lg:p-8 animate-in fade-in duration-700">\n      <NotificationPrompt />');
  
  fs.writeFileSync('src/pages/parents/ParentDashboard.tsx', content);
}
