const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const webhookInboundToReplace = `    // Save the incoming message to Firestore
    await dbAdmin.collection("whatsapp_messages").add({
      phone: phoneNum,
      body: body,
      senderName: profileName || null,
      messageSid: messageSid || null,
      direction: "inbound",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });`;

const replacementInbound = `    // Save the incoming message to Firestore
    await dbAdmin.collection("whatsapp_messages").add({
      phone: phoneNum,
      body: body,
      senderName: profileName || null,
      messageSid: messageSid || null,
      direction: "inbound"
    }); // timestamp handled by wrapper`;

code = code.replace(webhookInboundToReplace, replacementInbound);
fs.writeFileSync('server.ts', code);
