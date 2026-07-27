const fs = require('fs');
let content = fs.readFileSync('src/components/NotificationListener.tsx', 'utf8');

if (!content.includes('fcmService.onMessageListener')) {
  content = content.replace("import { notificationService } from '../services/notificationService';", "import { notificationService } from '../services/notificationService';\nimport { fcmService } from '../services/fcmService';");
  
  content = content.replace("return () => unsubscribe();", `
    // Firebase Cloud Messaging Message Listener
    const listenToFCM = async () => {
      try {
        const payload: any = await fcmService.onMessageListener();
        if (payload?.notification) {
          const browserNotif = new Notification(payload.notification.title || 'FocusON Akademi', {
            body: payload.notification.body,
            icon: '/images/ON-Logo.png',
            badge: '/images/ON-Logo.png'
          });
          browserNotif.onclick = () => {
            window.focus();
            browserNotif.close();
          };
        }
        // FCM mesajlarını sürekli dinlemeye devam etmesi için recursive çağrı
        listenToFCM();
      } catch (e) {
        console.log("FCM Listener error: ", e);
      }
    };
    
    listenToFCM();

    return () => unsubscribe();`);
    
  fs.writeFileSync('src/components/NotificationListener.tsx', content);
}
