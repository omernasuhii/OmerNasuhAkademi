const fs = require('fs');
let code = fs.readFileSync('src/services/notificationService.ts', 'utf8');

code = code.replace(
  /} catch \(error\) \{\n      console\.error\('Error adding notification:', error\);\n      throw error;\n    \}/,
  `} catch (error: any) {
      if (error?.code !== "permission-denied" && !error?.message?.toLowerCase().includes("permission")) {
        console.error('Error adding notification:', error);
      }
      throw error;
    }`
);

fs.writeFileSync('src/services/notificationService.ts', code);
