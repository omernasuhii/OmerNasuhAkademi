const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCheck = `    let dbAdmin;
    if (admin.apps.length) {
      dbAdmin = admin.firestore();
    } else {`;

const newCheck = `    let dbAdmin;
    if (admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
      dbAdmin = admin.firestore();
    } else {`;

code = code.replace(oldCheck, newCheck);

// Also need to fix it for /api/whatsapp-send endpoint which uses admin!
const sendEndpointOld = `    if (admin.apps.length) {
      await admin.firestore().collection("whatsapp_messages").add({
        phone: to.replace("whatsapp:", "").trim(),
        body: message,
        senderName: "Admin",
        messageSid: sentMsg.sid,
        direction: "outbound",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }`;

const sendEndpointNew = `    if (admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
      await admin.firestore().collection("whatsapp_messages").add({
        phone: to.replace("whatsapp:", "").trim(),
        body: message,
        senderName: "Admin",
        messageSid: sentMsg.sid,
        direction: "outbound",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      await addDoc(collection(db, "whatsapp_messages"), {
        phone: to.replace("whatsapp:", "").trim(),
        body: message,
        senderName: "Admin",
        messageSid: sentMsg.sid,
        direction: "outbound",
        timestamp: serverTimestamp()
      });
    }`;

code = code.replace(sendEndpointOld, sendEndpointNew);
fs.writeFileSync('server.ts', code);
