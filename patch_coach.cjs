const fs = require('fs');
let content = fs.readFileSync('src/pages/CoachDashboard.tsx', 'utf8');

if (!content.includes('NotificationPrompt')) {
  content = content.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\nimport { NotificationPrompt } from '../components/NotificationPrompt';");
  
  content = content.replace('<div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">', '<div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">\n      <NotificationPrompt />');
  
  fs.writeFileSync('src/pages/CoachDashboard.tsx', content);
}
