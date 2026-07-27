const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentExams.tsx', 'utf8');

// I will just find <div className="relative"> and remove it. It's inside the flex row at the top of the expanded details.
// Or I can just replace the whole `<div className="relative"> ... </div>` with empty string.
content = content.replace(/<div className="relative">\s*<button[\s\S]*?<MoreHorizontal[\s\S]*?<\/div>\s*<\/div>/g, '');

// Wait, the AnimatePresence block was incomplete because of my previous replace.
// Let's just restore the file from Exams.tsx and run a better script to clean it up.
