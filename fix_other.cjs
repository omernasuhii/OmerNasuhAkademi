const fs = require('fs');
let code = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

// just to make sure
code = code.replace(
  'if (err?.code !== "permission-denied" && !err?.message?.toLowerCase().includes("permission")) {',
  'if (err && err.code !== "permission-denied" && err.message && !err.message.toLowerCase().includes("permission")) {'
);

fs.writeFileSync('src/pages/students/Summary.tsx', code);
