const fs = require('fs');
let lines = fs.readFileSync('src/pages/coach/CoachAssistant.tsx', 'utf8').split('\n');

// Find loadChatHistory and saveChatHistory
const loadStart = lines.findIndex(l => l.includes('const loadChatHistory = async'));
const saveStart = lines.findIndex(l => l.includes('const saveChatHistory = async'));

let newLines = [...lines.slice(0, loadStart)];
newLines.push(`  const loadChatHistory = async () => {`);
newLines.push(`    if (!user) return;`);
newLines.push(`    try {`);
newLines.push(`      const docRef = doc(db, 'coach_chats', user.uid);`);
newLines.push(`      const snap = await getDoc(docRef);`);
newLines.push(`      if (snap.exists()) {`);
newLines.push(`        setMessages(snap.data().messages || []);`);
newLines.push(`      }`);
newLines.push(`    } catch (error) {`);
newLines.push(`      console.error("Sohbet geçmişi yüklenirken hata:", error);`);
newLines.push(`    }`);
newLines.push(`  };`);
newLines.push(``);
newLines.push(...lines.slice(saveStart));

fs.writeFileSync('src/pages/coach/CoachAssistant.tsx', newLines.join('\n'));
