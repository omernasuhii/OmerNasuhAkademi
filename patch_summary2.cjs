const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

if (!content.includes('NotificationPrompt')) {
  content = content.replace("import { Link } from 'react-router-dom';", "import { Link } from 'react-router-dom';\nimport { NotificationPrompt } from '../../components/NotificationPrompt';");
  
  // Also remove the old patch attempt from patch_summary.cjs if it's there
  if (content.includes("const [notificationPermissionStatus")) {
     content = content.replace(/const \[notificationPermissionStatus[\s\S]*?setNotificationPermissionStatus\('denied'\);\n    }\n  };\n/, '');
  }
  
  if (content.includes("{/* PWA & Notification Card */}")) {
     content = content.replace(/{\/\* PWA & Notification Card \*\/}[\s\S]*?Bildirimlere İzin Ver\n              <\/button>\n            <\/div>\n          \)}/, '');
  }
  
  // Inject the new component
  content = content.replace('<div className="w-full max-w-7xl mx-auto space-y-8">', '<div className="w-full max-w-7xl mx-auto space-y-8">\n      <NotificationPrompt />');
  
  fs.writeFileSync('src/pages/students/Summary.tsx', content);
}
