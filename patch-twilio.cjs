const fs = require('fs');

let lines = fs.readFileSync('server.ts', 'utf8').split('\n');
const startIdx = lines.findIndex(l => l.includes('app.post("/api/send-whatsapp"'));
const endIdx = lines.findIndex(l => l.includes('app.get("/api/health"'));

if (startIdx !== -1 && endIdx !== -1) {
  const newRoutes = `  app.post("/api/send-whatsapp", async (req, res) => {
    const { phone, code, uid, origin } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Telefon numarası ve kod gereklidir." });
    }

    try {
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
      }
      const toTwilio = formattedPhone.startsWith("whatsapp:") ? formattedPhone : \`whatsapp:\${formattedPhone}\`;

      let verifyLink = "";
      if (uid && origin) {
        verifyLink = \`\${origin}/v?u=\${uid}&c=\${code}\`;
      }
      const msgBody = verifyLink
        ? \`FocusON Akademi doğrulama kodunuz: \${code}\\n\\nTek tıkla doğrulamak için aşağıdaki butona/bağlantıya tıklayabilirsiniz:\\n\${verifyLink}\`
        : \`FocusON Akademi doğrulama kodunuz: \${code}\`;

      // Use Client SDK as fallback
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, addDoc, doc, setDoc, serverTimestamp } = await import('firebase/firestore');

      // 1. Send via Firebase Twilio Extension (listen to 'messages' collection)
      await addDoc(collection(db, "messages"), {
        to: toTwilio,
        body: msgBody
      });

      // 2. Save verification code
      await setDoc(doc(db, "phone_verifications", formattedPhone), {
        code: code,
        uid: uid || null,
        origin: origin || null,
        updatedAt: serverTimestamp()
      });

      console.log(\`[Twilio WhatsApp] Message sent via Firebase Extension.\`);
      return res.json({ success: true, simulated: false });
    } catch (error) {
      console.error("[Twilio WhatsApp] Error:", error);
      return res.status(500).json({ error: error.message || "Failed" });
    }
  });

  app.post("/api/verify-whatsapp-direct", async (req, res) => {
    const { uid, code } = req.body;
    if (!uid || !code) {
      return res.status(400).json({ error: "Kullanıcı ID ve kod gereklidir." });
    }

    try {
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, doc, getDoc, updateDoc, query, where, getDocs, writeBatch } = await import('firebase/firestore');

      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      }

      await updateDoc(userRef, {
        phoneVerified: true,
        verificationDeferred: false,
        updatedAt: new Date()
      });

      const q = query(collection(db, "users"), where("verificationDeferred", "==", true));
      const deferredSnapshot = await getDocs(q);
      
      if (!deferredSnapshot.empty) {
        const batch = writeBatch(db);
        deferredSnapshot.docs.forEach((d) => {
          batch.update(d.ref, { verificationDeferred: false });
        });
        await batch.commit();
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/verify-whatsapp-direct:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verification-success", async (req, res) => {
    try {
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, query, where, getDocs, writeBatch } = await import('firebase/firestore');
      
      const q = query(collection(db, "users"), where("verificationDeferred", "==", true));
      const deferredSnapshot = await getDocs(q);
      
      if (!deferredSnapshot.empty) {
        const batch = writeBatch(db);
        deferredSnapshot.docs.forEach((d) => {
          batch.update(d.ref, { verificationDeferred: false });
        });
        await batch.commit();
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/verification-success:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/whatsapp-webhook", async (req, res) => {
    if (req.body.From === 'testdebug') {
       return res.json({ isInitialized: true });
    }

    const from = req.body.From || req.body.from || req.body.phone;
    const body = req.body.Body || req.body.body || req.body.message || "";
    const profileName = req.body.ProfileName || req.body.profileName || "";
    const messageSid = req.body.MessageSid || req.body.messageSid || "";

    if (!from) {
      return res.status(400).send("<Response><Message>From parameter is required.</Message></Response>");
    }

    try {
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, addDoc, doc, getDoc, serverTimestamp } = await import('firebase/firestore');
      
      let phoneNum = String(from).replace("whatsapp:", "").trim();
      if (!phoneNum.startsWith("+")) {
        phoneNum = "+" + phoneNum;
      }

      await addDoc(collection(db, "whatsapp_messages"), {
        phone: phoneNum,
        body: body,
        senderName: profileName || null,
        messageSid: messageSid || null,
        direction: "inbound",
        timestamp: serverTimestamp()
      });

      console.log(\`[WhatsApp Webhook] Message received from \${phoneNum}: \${body}\`);

      const lowerBody = body.toLowerCase().trim();
      const isApproval = lowerBody.includes("focuson akademi doğrulama") && lowerBody.includes("onaylıyorum");

      if (isApproval) {
        const verificationDoc = await getDoc(doc(db, "phone_verifications", phoneNum));
        
        let pendingCode = null;
        let pendingUid = null;
        let pendingOrigin = null;

        if (verificationDoc.exists()) {
          const data = verificationDoc.data();
          pendingCode = data?.code;
          pendingUid = data?.uid;
          pendingOrigin = data?.origin;
        }

        if (pendingCode) {
          let verifyLink = "";
          if (pendingUid && pendingOrigin) {
            verifyLink = \`\${pendingOrigin}/v?u=\${pendingUid}&c=\${pendingCode}\`;
          }
          
          const msgBody = verifyLink
            ? \`FocusON Akademi doğrulama kodunuz: \${pendingCode}\\n\\nTek tıkla doğrulamak için aşağıdaki butona/bağlantıya tıklayabilirsiniz:\\n\${verifyLink}\`
            : \`FocusON Akademi doğrulama kodunuz: \${pendingCode}\`;

          const toTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : \`whatsapp:\${phoneNum}\`;
          
          await addDoc(collection(db, "messages"), {
            to: toTwilio,
            body: msgBody
          });
          
          await addDoc(collection(db, "whatsapp_messages"), {
            phone: phoneNum,
            body: msgBody,
            senderName: "System Auto-Reply",
            direction: "outbound",
            timestamp: serverTimestamp()
          });
        }
      }

      res.set("Content-Type", "text/xml");
      return res.send("<Response></Response>");
    } catch (error) {
      console.error("Error in /api/whatsapp-webhook:", error);
      res.set("Content-Type", "text/xml");
      return res.status(500).send(\`<Response><Message>Error: \${error.message}</Message></Response>\`);
    }
  });

  app.post("/api/whatsapp-send", async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: "to and message are required" });
    }

    try {
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      const toTwilio = to.startsWith("whatsapp:") ? to : \`whatsapp:\${to}\`;

      await addDoc(collection(db, "messages"), {
        to: toTwilio,
        body: message
      });

      await addDoc(collection(db, "whatsapp_messages"), {
        phone: to.replace("whatsapp:", "").trim(),
        body: message,
        senderName: "Admin",
        direction: "outbound",
        timestamp: serverTimestamp()
      });

      res.json({ success: true });
    } catch (err) {
      console.error("[WhatsApp Send] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });\n`;
  
  lines.splice(startIdx, endIdx - startIdx, newRoutes);
  fs.writeFileSync('server.ts', lines.join('\n'));
  console.log("Successfully replaced broken Twilio block!");
} else {
  console.log("Could not find start or end bounds.");
}
