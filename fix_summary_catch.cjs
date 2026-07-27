const fs = require('fs');
let code = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

code = code.replace(
  '} catch (e) {\n           console.error("Otomatik bildirimler yüklenirken hata oluştu.", e);\n        }',
  '} catch (e: any) {\n           if (e?.code !== "permission-denied" && !e?.message?.toLowerCase().includes("permission")) {\n              console.error("Otomatik bildirimler yüklenirken hata oluştu.", e);\n           }\n        }'
);

fs.writeFileSync('src/pages/students/Summary.tsx', code);
