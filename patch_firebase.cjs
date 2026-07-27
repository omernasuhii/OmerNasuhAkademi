const fs = require('fs');
let content = fs.readFileSync('src/lib/firebase.ts', 'utf8');

if (!content.includes('setPersistence')) {
  content = content.replace("import { getAuth } from 'firebase/auth';", "import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';");
  
  content = content.replace("export const auth = getAuth(app);\nauth.languageCode = 'tr';", "export const auth = getAuth(app);\nsetPersistence(auth, browserLocalPersistence).catch((err) => console.error('Auth persistence error:', err));\nauth.languageCode = 'tr';");
  
  fs.writeFileSync('src/lib/firebase.ts', content);
}
