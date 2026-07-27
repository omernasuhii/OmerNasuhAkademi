const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');

if (!content.includes('NotificationPrompt')) {
  content = content.replace("import { motion } from 'motion/react';", "import { motion } from 'motion/react';\nimport { NotificationPrompt } from '../../components/NotificationPrompt';");
  
  content = content.replace('<div className="space-y-8 animate-in fade-in duration-700">', '<div className="space-y-8 animate-in fade-in duration-700">\n      <NotificationPrompt />');
  
  fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
}
