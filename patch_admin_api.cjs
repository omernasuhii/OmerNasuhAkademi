const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const apiCode = `
  app.post("/api/test-subscription-reminders", async (req, res) => {
    try {
      const result = await executeSubscriptionReminders();
      res.json({
        success: true,
        message: "Abonelik hatırlatmaları başarıyla test edildi/işlendi.",
        processedCount: result.processedCount,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Bir hata oluştu." });
    }
  });
`;

content = content.replace(
  '  app.post("/api/send-weekly-reports", async (req, res) => {',
  apiCode + '\n  app.post("/api/send-weekly-reports", async (req, res) => {'
);

fs.writeFileSync('server.ts', content);
