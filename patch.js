const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const newCode = fs.readFileSync('/tmp/sub_reminder.js', 'utf8');

content = content.replace(
  '  app.post("/api/send-weekly-reports", async (req, res) => {',
  newCode + '\n  app.post("/api/send-weekly-reports", async (req, res) => {'
);

fs.writeFileSync('server.ts', content);
