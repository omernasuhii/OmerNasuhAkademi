const fs = require('fs');
let code = fs.readFileSync('src/pages/students/ExamMetronomeApp.tsx', 'utf8');

code = code.replace(
  "import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';",
  "import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';"
);

code = code.replace(
  "      const q = query(\n        collection(db, 'study_sessions'),\n        where('studentId', '==', user.uid),\n        orderBy('createdAt', 'desc')\n      );\n      const unsubscribe = onSnapshot(q, (snapshot) => {\n         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));\n         setSessions(data);\n      });",
  "      const q = query(\n        collection(db, 'study_sessions'),\n        where('studentId', '==', user.uid)\n      );\n      const unsubscribe = onSnapshot(q, (snapshot) => {\n         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));\n         // Sort locally to avoid needing a composite index\n         data.sort((a: any, b: any) => {\n           const timeA = a.createdAt?.seconds || Number.MAX_SAFE_INTEGER;\n           const timeB = b.createdAt?.seconds || Number.MAX_SAFE_INTEGER;\n           return timeB - timeA;\n         });\n         setSessions(data);\n      });"
);

fs.writeFileSync('src/pages/students/ExamMetronomeApp.tsx', code);
