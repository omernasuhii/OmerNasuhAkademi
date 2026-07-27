const fs = require('fs');
let content = fs.readFileSync('src/pages/Login.tsx', 'utf8');

if (!content.includes('setPersistence')) {
  content = content.replace('import { signInWithEmailAndPassword } from "firebase/auth";', 'import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";');
  
  content = content.replace('const userCredential = await signInWithEmailAndPassword(', 'await setPersistence(auth, browserLocalPersistence);\n      const userCredential = await signInWithEmailAndPassword(');
  
  fs.writeFileSync('src/pages/Login.tsx', content);
}
