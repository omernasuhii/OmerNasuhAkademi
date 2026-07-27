const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

const targetStr = `  const [isCabaCompleted, setIsCabaCompleted] = useState<boolean>(false);`;
const insertStr = `  const [isCabaCompleted, setIsCabaCompleted] = useState<boolean>(false);
  const [pendingResultsCount, setPendingResultsCount] = useState(0);`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found');
}

fs.writeFileSync('src/pages/students/Summary.tsx', content);
