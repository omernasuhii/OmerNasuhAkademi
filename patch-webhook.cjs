const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// We want to return 200 OK immediately to Twilio, then do the async work
const oldWebhook = `
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
`;

const newWebhook = `
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

    // Acknowledge immediately to prevent Twilio 11200 Error
    res.set("Content-Type", "text/xml");
    res.status(200).send("<Response></Response>");

    // Process asynchronously
    (async () => {
    try {
      const { db } = await import('./src/lib/firebase.ts');
`;

content = content.replace(oldWebhook, newWebhook);

// Also close the async block
content = content.replace(`
      res.set("Content-Type", "text/xml");
      return res.send("<Response></Response>");
    } catch (error) {
      console.error("Error in /api/whatsapp-webhook:", error);
      res.set("Content-Type", "text/xml");
      return res.status(500).send(\`<Response><Message>Error: \${error.message}</Message></Response>\`);
    }
  });`, `
    } catch (error) {
      console.error("Error in /api/whatsapp-webhook async:", error);
    }
    })();
  });`);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts webhook");
