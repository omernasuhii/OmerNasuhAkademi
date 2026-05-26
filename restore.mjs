import { execSync } from 'child_process';
import fs from 'fs';

const originalContent = execSync('git show HEAD:src/pages/students/QuestionAnalysis.tsx');
fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', originalContent);
