const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const cronCode = `
  // Automated Subscription Reminders (Every day at 19:00 Europe/Istanbul)
  cron.schedule("0 19 * * *", async () => {
    console.log("[Cron Job] Automated daily 19:00 subscription reminder process triggered...");
    try {
      await executeSubscriptionReminders();
    } catch (err: any) {
      console.error("[Cron Job] Error executing subscription reminders:", err?.message || err);
    }
  }, {
    timezone: "Europe/Istanbul"
  });
`;

content = content.replace(
  '// Automated Weekly Report Cron Job',
  cronCode + '\n  // Automated Weekly Report Cron Job'
);

fs.writeFileSync('server.ts', content);
