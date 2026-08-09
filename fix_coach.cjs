const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/CoachAssistant.tsx', 'utf8');

const badBlock = `const cleanMessages = JSON.parse(JSON.stringify(newMessages));
        const c = {...m} as any;
        Object.keys(c).forEach(key => {
          if (c[key] === undefined) {
            delete c[key];
          }
        });
        return c;
      });`;

const goodBlock = `const cleanMessages = JSON.parse(JSON.stringify(newMessages));`;

content = content.replace(badBlock, goodBlock);

fs.writeFileSync('src/pages/coach/CoachAssistant.tsx', content);
