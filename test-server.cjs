const { execSync } = require('child_process');
console.log(execSync('curl -s -X POST http://localhost:3000/api/whatsapp-webhook -d "From=test"').toString());
