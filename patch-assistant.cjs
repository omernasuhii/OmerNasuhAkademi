const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf8');

function fixEndpoint(endpointName) {
  const regex = new RegExp(`app\\.post\\("/api/\${endpointName}".*?chat\\.sendMessage\\(\\{\\s*message:\\s*history\\[history\\.length - 1\\]\\.content\\s*\\}\\);`, 's');
  
  // Wait, let's just replace all occurrences of chat.sendMessage({ message: history[history.length - 1].content })
}

content = content.replace(/const response = await chat\.sendMessage\(\{\s*message: history\[history\.length - 1\]\.content\s*\}\);/g, `
      const lastMsg = history[history.length - 1];
      let messagePayload = lastMsg.content;
      if (lastMsg.functionResponse) {
         messagePayload = [{ functionResponse: { name: lastMsg.name, response: lastMsg.functionResponse, id: lastMsg.id } }];
      }
      const response = await chat.sendMessage({ message: messagePayload });
`);

fs.writeFileSync('server.ts', content);
console.log("Patched server.ts assistants");
