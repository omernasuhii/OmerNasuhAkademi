const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const webhookCodeToReplace = `  try {
    if (!admin.apps.length) {
      return res.status(503).send("<Response><Message>Firebase Admin not initialized.</Message></Response>");
    }

    const dbAdmin = admin.firestore();`;

const replacementWebhook = `  try {
    let dbAdmin;
    if (admin.apps.length) {
      dbAdmin = admin.firestore();
    } else {
      // In AI Studio without service account, we fallback to the Client SDK which uses API Key
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, addDoc, doc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      dbAdmin = {
        collection: (path) => ({
          add: async (data) => addDoc(collection(db, path), {
            ...data,
            timestamp: serverTimestamp() // override the FieldValue from admin
          }),
          doc: (docId) => ({
            get: async () => {
               const snap = await getDoc(doc(db, path, docId));
               return {
                 exists: snap.exists(),
                 data: () => snap.data()
               };
            }
          })
        })
      };
    }`;

code = code.replace(webhookCodeToReplace, replacementWebhook);

const webhookOutboundToReplace = `            await dbAdmin.collection("whatsapp_messages").add({
              phone: phoneNum,
              body: msgBody,
              senderName: "System Auto-Reply",
              direction: "outbound",
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });`;

const replacementOutbound = `            await dbAdmin.collection("whatsapp_messages").add({
              phone: phoneNum,
              body: msgBody,
              senderName: "System Auto-Reply",
              direction: "outbound"
            }); // timestamp is handled in our dbAdmin wrapper`;

code = code.replace(webhookOutboundToReplace, replacementOutbound);
fs.writeFileSync('server.ts', code);
