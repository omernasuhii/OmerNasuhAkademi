const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

const targetStr = `  const handleCompletedCountChange = (date: string, taskId: string, value: string) => {`;
const insertStr = `  const toggleTaskWaitingResult = async (date: string, taskId: string, currentWaiting: boolean) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (!dayProgram) return;

    const targetTask = dayProgram.tasks.find((t: any) => t.id === taskId);
    if (!targetTask) return;

    const updatedTasks = dayProgram.tasks.map((t: any) => {
      if (t.id === taskId) {
        return { ...t, isWaitingResult: !currentWaiting };
      }
      return t;
    });

    const updatedProgram = { ...dayProgram, tasks: updatedTasks };
    
    setDailyPrograms(prev => prev.map(p => p.date === date ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);
  };

  const handleCompletedCountChange = (date: string, taskId: string, value: string) => {`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found');
}

fs.writeFileSync('src/pages/student/Coaching.tsx', content);
