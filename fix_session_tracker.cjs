const fs = require('fs');
let code = fs.readFileSync('src/services/sessionTracker.ts', 'utf8');

code = code.replace(
  /import \{ doc, updateDoc, collection, addDoc, serverTimestamp \} from 'firebase\/firestore';/,
  "import { doc, updateDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';"
);

code = code.replace(
  /await updateDoc\(doc\(db, 'users', userId\), \{[\s\S]*?lastLoginAt: serverTimestamp\(\),[\s\S]*?isOnline: true[\s\S]*?\}\);/,
  `await setDoc(doc(db, 'users', userId), {
        lastLoginAt: serverTimestamp(),
        isOnline: true
      }, { merge: true });`
);

fs.writeFileSync('src/services/sessionTracker.ts', code);
