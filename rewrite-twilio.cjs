const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// We need to replace the twilio() usages. 
// For /api/send-whatsapp-code:
const sendCodeStart = `app.post("/api/send-whatsapp-code", async (req, res) => {`;
const sendCodeEnd = `});

app.post("/api/verification-success", async (req, res) => {`;
// We will replace this whole block by regex or split.

code = code.replace(/app\.post\("\/api\/send-whatsapp-code"[\s\S]*?\n\}\);\n\napp\.post\("\/api\/verification-success"/, 
`app.post("/api/send-whatsapp-code", async (req, res) => {
  const { phone, code, uid, origin } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Phone and code are required" });
  }

  let formattedPhone = phone.trim();
  if (!formattedPhone.startsWith("+")) {
    formattedPhone = "+" + formattedPhone;
  }
  const toTwilio = formattedPhone.startsWith("whatsapp:") ? formattedPhone : \`whatsapp:\${formattedPhone}\`;

  let dbAdmin;
  if (admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    dbAdmin = admin.firestore();
  } else {
    const { db } = await import('./src/lib/firebase.ts');
    const { doc, setDoc, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    dbAdmin = {
      collection: (path) => ({
        doc: (id) => ({
          set: (data) => setDoc(doc(db, path, id), { ...data, updatedAt: serverTimestamp() })
        }),
        add: (data) => addDoc(collection(db, path), { ...data, timestamp: serverTimestamp() })
      })
    };
  }

  // Firebase Twilio Extension tetiklemek için 'messages' koleksiyonuna yaz
  let verifyLink = "";
  if (uid && origin) {
    verifyLink = \`\${origin}/v?u=\${uid}&c=\${code}\`;
  }
  
  const msgBody = verifyLink
    ? \`FocusON Akademi doğrulama kodunuz: \${code}\\n\\nTek tıkla doğrulamak için aşağıdaki butona/bağlantıya tıklayabilirsiniz:\\n\${verifyLink}\`
    : \`FocusON Akademi doğrulama kodunuz: \${code}\`;

  try {
    await dbAdmin.collection("messages").add({
      to: toTwilio,
      body: msgBody
    });
    
    // Doğrulama kodunu daha sonra webhook üzerinden otomatik gönderebilmek için kaydedelim
    await dbAdmin.collection("phone_verifications").doc(formattedPhone).set({
      code: code,
      uid: uid || null,
      origin: origin || null
    });

    console.log(\`[Twilio WhatsApp] Message sent via Firebase Extension.\`);
    return res.json({ success: true, simulated: false });
  } catch (error) {
    console.error("[Twilio WhatsApp] Error writing to messages collection:", error);
    return res.status(500).json({ error: error.message || "Failed" });
  }
});

app.post("/api/verification-success"`);

// Now for /api/whatsapp-webhook (the auto-reply part)
const autoReplyStart = `        const accountSid = process.env.TWILIO_ACCOUNT_SID;`;
const autoReplyEnd = `          } catch (twilioErr) {
            console.error(\`[WhatsApp Webhook] Error sending back pending code to \${phoneNum}:\`, twilioErr);
          }
        } else {
           console.error("[WhatsApp Webhook] Twilio credentials missing, cannot send reply.");
        }`;

code = code.replace(/const accountSid = process\.env\.TWILIO_ACCOUNT_SID;[\s\S]*?console\.error\("\[WhatsApp Webhook\] Twilio credentials missing, cannot send reply\."\);\n        }/,
`        const toTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : \`whatsapp:\${phoneNum}\`;
        try {
          console.log(\`[WhatsApp Webhook] Writing to messages collection to trigger Twilio Extension for \${toTwilio}...\`);
          await dbAdmin.collection("messages").add({
            to: toTwilio,
            body: msgBody
          });
          
          await dbAdmin.collection("whatsapp_messages").add({
            phone: phoneNum,
            body: msgBody,
            senderName: "System Auto-Reply",
            direction: "outbound"
          }); // timestamp is handled in our dbAdmin wrapper
        } catch (extErr) {
          console.error(\`[WhatsApp Webhook] Error sending back pending code to \${phoneNum} via extension:\`, extErr);
        }`);


// For /api/whatsapp-send
code = code.replace(/app\.post\("\/api\/whatsapp-send"[\s\S]*?\}\);/,
`app.post("/api/whatsapp-send", async (req, res) => {
  const { to, message } = req.body;
  if (!to || !message) {
    return res.status(400).json({ error: "to and message are required" });
  }

  try {
    let dbAdmin;
    if (admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
      dbAdmin = admin.firestore();
    } else {
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      dbAdmin = {
         collection: (path) => ({
             add: async (data) => addDoc(collection(db, path), {
                 ...data,
                 timestamp: serverTimestamp()
             })
         })
      };
    }

    const toTwilio = to.startsWith("whatsapp:") ? to : \`whatsapp:\${to}\`;

    await dbAdmin.collection("messages").add({
      to: toTwilio,
      body: message
    });

    await dbAdmin.collection("whatsapp_messages").add({
      phone: to.replace("whatsapp:", "").trim(),
      body: message,
      senderName: "Admin",
      direction: "outbound"
    });

    res.json({ success: true });
  } catch (err) {
    console.error("[WhatsApp Send] Error:", err);
    res.status(500).json({ error: err.message });
  }
});`);

// Remove twilio import if it exists
code = code.replace(/import twilio from "twilio";\n/, '');

fs.writeFileSync('server.ts', code);
