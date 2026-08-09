const fs = require('fs');

let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');
const oldMap1 = `const cleanMessages = messages.map(m => {
           const c = {...m} as any;
           Object.keys(c).forEach(key => {
             if (c[key] === undefined) {
               delete c[key];
             }
           });
           return c;
        });`;
content = content.replace(oldMap1, "const cleanMessages = JSON.parse(JSON.stringify(messages));");
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);


let content2 = fs.readFileSync('src/pages/parents/ParentAssistant.tsx', 'utf8');
const oldMap2 = `const cleanMessages = messages.map(m => {
           const c = {...m} as any;
           Object.keys(c).forEach(key => {
             if (c[key] === undefined) {
               delete c[key];
             }
           });
           return c;
        });`;
content2 = content2.replace(oldMap2, "const cleanMessages = JSON.parse(JSON.stringify(messages));");
fs.writeFileSync('src/pages/parents/ParentAssistant.tsx', content2);
