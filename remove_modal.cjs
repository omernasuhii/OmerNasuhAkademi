const fs = require('fs');

let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// Find {showAddModal && ( and remove the block up to the matching }
let startIndex = content.indexOf('{showAddModal && (');
if (startIndex !== -1) {
  let count = 0;
  let endIndex = -1;
  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === '{') count++;
    else if (content[i] === '}') {
      count--;
      if (count === 0) {
        endIndex = i;
        break;
      }
    }
  }
  if (endIndex !== -1) {
    content = content.substring(0, startIndex) + content.substring(endIndex + 1);
  }
}

// Remove empty columns if they exist (like actions)
// Actually we kept Detaylar because it expands. What about the MoreHorizontal menu?
content = content.replace(/<td className="px-6 py-4 text-right">[\s\S]*?<div className="relative group">[\s\S]*?<\/div>\s*<\/td>/g, '');
// Let's just leave the code as is if it works.

fs.writeFileSync('src/pages/parents/ParentExams.tsx', content);
