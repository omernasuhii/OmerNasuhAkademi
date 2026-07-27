const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminDashboard.tsx', 'utf8');
if (!content.includes('import { NotificationPrompt }')) {
  content = content.replace("import { db } from '../../lib/firebase';", "import { db } from '../../lib/firebase';\nimport { NotificationPrompt } from '../../components/NotificationPrompt';");
  fs.writeFileSync('src/pages/admin/AdminDashboard.tsx', content);
}
