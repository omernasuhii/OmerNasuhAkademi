const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

const targetStr = `                    const isDeneme = t.topic?.includes('Deneme') || t.subject?.includes('Genel') || t.subject?.includes('YDT') || t.branch === 'Denemeler' || t.type === 'Deneme';
                    if (isDeneme) {
                        hasDenemeTask = true;
                        if (!t.isDone) {
                            updated = true;
                            return { ...t, isDone: true };
                        }
                    }`;

const insertStr = `                    const isDeneme = t.topic?.includes('Deneme') || t.subject?.includes('Genel') || t.subject?.includes('YDT') || t.branch === 'Denemeler' || t.type === 'Deneme';
                    if (isDeneme) {
                        hasDenemeTask = true;
                        if (!t.isDone || t.isWaitingResult) {
                            updated = true;
                            return { ...t, isDone: true, isWaitingResult: false };
                        }
                    }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found for exam sync');
}

fs.writeFileSync('src/pages/student/Exams.tsx', content);
