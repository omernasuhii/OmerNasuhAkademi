import fs from 'fs';
let code = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

// I need to wrap the return (...) with a <> or keep it inside the div.
// In the original file, where did `})()` close? Let me find out!
