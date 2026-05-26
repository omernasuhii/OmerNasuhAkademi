const fs = require('fs');
const path = 'src/pages/admin/ServiceManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

// The script added literal \n strings
content = content.replace(/\\n/g, '\n');

fs.writeFileSync(path, content);
