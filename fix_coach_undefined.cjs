const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/CoachAssistant.tsx', 'utf8');

content = content.replace(
  "const cleanMessages = newMessages.map(m => {",
  "const cleanMessages = JSON.parse(JSON.stringify(newMessages));"
);

// We need to carefully remove the previous Object.keys mapping we put in coach assistant
const oldMap = `const cleanMessages = newMessages.map(m => {
        const c = {...m} as any;
        Object.keys(c).forEach(key => {
          if (c[key] === undefined) {
            delete c[key];
          }
        });
        return c;
      });`;
content = content.replace(oldMap, "const cleanMessages = JSON.parse(JSON.stringify(newMessages));");

fs.writeFileSync('src/pages/coach/CoachAssistant.tsx', content);
