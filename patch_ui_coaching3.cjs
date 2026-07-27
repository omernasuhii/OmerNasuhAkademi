const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

const targetStr = `  const toggleTaskWaitingResult = async (date: string, taskId: string, currentWaiting: boolean) => {
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
  };`;

const insertStr = `  const toggleTaskWaitingResult = async (date: string, taskId: string, currentWaiting: boolean) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (!dayProgram) return;

    const targetTask = dayProgram.tasks.find((t: any) => t.id === taskId);
    if (!targetTask) return;

    const updatedTasks = dayProgram.tasks.map((t: any) => {
      if (t.id === taskId) {
        return { ...t, isWaitingResult: !currentWaiting, isDone: !currentWaiting };
      }
      return t;
    });

    const updatedProgram = { ...dayProgram, tasks: updatedTasks };
    
    setDailyPrograms(prev => prev.map(p => p.date === date ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);

    // Give or remove XP based on new isDone state
    const getTaskXP = (type: string) => {
      switch (type) {
        case 'YouTube Video': return 2;
        case 'Konu Çalışması': return 3;
        case 'Soru Çözümü':
        default:
          return 10;
      }
    };
    if (!currentWaiting) {
      if (auth.currentUser) {
        studentDataService.awardXP(auth.currentUser.uid, getTaskXP(targetTask.type), 'Görev Tamamlandı');
      }
    } else {
      if (auth.currentUser) {
        studentDataService.awardXP(auth.currentUser.uid, -getTaskXP(targetTask.type), 'Görev İptal Edildi');
      }
    }
  };`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found for wait result logic');
}

fs.writeFileSync('src/pages/student/Coaching.tsx', content);
