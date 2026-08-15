const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(
  'const result = await executeSubscriptionReminders();',
  'const result = await executeSubscriptionReminders(req.body);'
);

fs.writeFileSync('server.ts', content);
