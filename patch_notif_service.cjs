const fs = require('fs');
let content = fs.readFileSync('src/services/notificationService.ts', 'utf8');

if (!content.includes('fetch("/api/send-push"')) {
  content = content.replace("await addDoc(notificationsRef, {", `const newDoc = await addDoc(notificationsRef, {`);
  
  const pushLogic = `
      // Try to send push notification directly via server API
      try {
        const tokenDoc = await getDocs(query(collection(db, 'userTokens'), where('__name__', '==', userId)));
        if (!tokenDoc.empty) {
          const userTokenData = tokenDoc.docs[0].data();
          if (userTokenData && userTokenData.token) {
            await fetch('/api/send-push', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                token: userTokenData.token,
                title: data.title,
                body: data.message,
                link: data.link || '/'
              })
            }).catch(e => console.warn('Could not trigger push on server', e));
          }
        }
      } catch (pushErr) {
        console.warn('Push notification trigger failed, but db updated:', pushErr);
      }
      return newDoc;`;
      
  content = content.replace("timestamp: serverTimestamp() // For accurate sorting\n      });", "timestamp: serverTimestamp() // For accurate sorting\n      });" + pushLogic);
  
  fs.writeFileSync('src/services/notificationService.ts', content);
}
