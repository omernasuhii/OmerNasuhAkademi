const fs = require('fs');
let content = fs.readFileSync('src/services/studentDataService.ts', 'utf8');

content = content.replace(
  "async saveAIAssistantChatHistory(studentId: string, messages: any[]) {",
  "async saveAIAssistantChatHistory(studentId: string, messages: any[]) {\n    messages = JSON.parse(JSON.stringify(messages));"
);

content = content.replace(
  "async saveParentAIAssistantChatHistory(parentId: string, messages: any[]) {",
  "async saveParentAIAssistantChatHistory(parentId: string, messages: any[]) {\n    messages = JSON.parse(JSON.stringify(messages));"
);

fs.writeFileSync('src/services/studentDataService.ts', content);
