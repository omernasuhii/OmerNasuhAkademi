const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldRegex = `        let cleanText = data.text;
        if (cleanText) {
           cleanText = cleanText.replace(/\\[?Sistem:.*?\\]?/g, '').trim();
        }`;

const newRegex = `        let cleanText = data.text;
        if (cleanText) {
           cleanText = cleanText.split('\\n').filter(line => !line.toLowerCase().includes('sistem:')).join('\\n').trim();
        }`;

content = content.replace(oldRegex, newRegex);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
