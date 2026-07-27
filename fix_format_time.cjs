const fs = require('fs');
let code = fs.readFileSync('src/pages/students/ExamMetronomeApp.tsx', 'utf8');

code = code.replace(
  'const formatTime = (seconds: number) => {\n    const m = Math.floor(seconds / 60);\n    const s = seconds % 60;\n    return `${m.toString().padStart(2, \'0\')}:${s.toString().padStart(2, \'0\')}`;\n  };',
  'const formatTime = (seconds: number) => {\n    const h = Math.floor(seconds / 3600);\n    const m = Math.floor((seconds % 3600) / 60);\n    const s = seconds % 60;\n    return `${h.toString().padStart(2, \'0\')}:${m.toString().padStart(2, \'0\')}:${s.toString().padStart(2, \'0\')}`;\n  };'
);

fs.writeFileSync('src/pages/students/ExamMetronomeApp.tsx', code);
