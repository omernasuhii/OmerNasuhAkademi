const fs = require('fs');
let code = fs.readFileSync('src/services/sessionTracker.ts', 'utf8');

code = code.replace(
  /await updateDoc\(doc\(db, 'users', userId\), \{[\s\S]*?lastLogoutAt: serverTimestamp\(\),[\s\S]*?isOnline: false[\s\S]*?\}\);/,
  `await setDoc(doc(db, 'users', userId), {
        lastLogoutAt: serverTimestamp(),
        isOnline: false
      }, { merge: true });`
);

fs.writeFileSync('src/services/sessionTracker.ts', code);
