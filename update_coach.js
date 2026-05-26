const fs = require('fs');

let content = fs.readFileSync('src/pages/coach/StudentProgram.tsx', 'utf-8');

// 1. Replace state
content = content.replace(
  'const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeekStr(new Date()));',
  `const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any>({
     paragraf: 40,
     problem: 20
  });
  const [savingRoutines, setSavingRoutines] = useState(false);`
);

content = content.replace(
  'const [program, setProgram] = useState<any>(null);',
  ''
);

// 2. Fix use effect dependencies
content = content.replace(
  '[selectedStudent, currentWeekStart]',
  '[selectedStudent, startDate]'
);

// 3. navigateWeek -> navigateDay
content = content.replace(
  /const navigateWeek = \(weeks: number\) => \{[\s\S]*?\};/,
  `const navigateDay = (days: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    setStartDate(d.toISOString().split('T')[0]);
  };`
);

// 4. Update UI references
content = content.replace(
  /navigateWeek\(-1\)/g,
  'navigateDay(-1)'
);
content = content.replace(
  /navigateWeek\(1\)/g,
  'navigateDay(1)'
);
content = content.replace(
  /currentWeekStart/g,
  'startDate'
);

// 5. Update fetchData
const fetchDataRegex = /const fetchData = async \(\) => \{[\s\S]*?const navigateWeek =/m;

const newFetchData = `const fetchData = async () => {
    setLoading(true);
    
    // Generate dates for the 7 days starting from startDate
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const [programsArray, trackerData, globalBooksData, routinesData] = await Promise.all([
      studentDataService.getDailyPrograms(selectedStudent!.uid, dates),
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks(),
      studentDataService.getRoutines(selectedStudent!.uid)
    ]);
    
    if (routinesData) {
        setRoutines({
           paragraf: routinesData.paragraf || 40,
           problem: routinesData.problem || 20
        });
    }
    
    const mergedBooks = trackerData.map((tb: any) => {
        if (tb.globalBookId) {
            const gb = globalBooksData.find((g: any) => g.id === tb.globalBookId);
            if (gb) {
                 return { ...tb, topicQuestionCounts: (gb as any).topicQuestionCounts || {} };
            }
        }
        return tb;
    });

    setBooks(mergedBooks);

    let allTasks: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    dates.forEach(dateStr => {
        const dp = programsArray.find(p => p.date === dateStr);
        if (dp && dp.tasks) {
            allTasks = [...allTasks, ...dp.tasks.map((t:any) => ({...t, date: dateStr}))];
        } else {
            // Unsaved day! Auto-inject routines if it's today or future
            if (dateStr >= todayStr) {
               allTasks.push({
                    id: Math.random().toString(36).substr(2, 9),
                    date: dateStr,
                    subject: 'Türkçe',
                    bookId: '',
                    topic: 'Paragraf',
                    targetCount: routinesData?.paragraf || 40,
                    type: 'Soru Çözümü',
                    completedCount: 0,
                    isDone: false
               });
               allTasks.push({
                    id: Math.random().toString(36).substr(2, 9),
                    date: dateStr,
                    subject: 'Matematik (TYT)',
                    bookId: '',
                    topic: 'Problemler',
                    targetCount: routinesData?.problem || 20,
                    type: 'Soru Çözümü',
                    completedCount: 0,
                    isDone: false
               });
            }
        }
    });

    setTasks(allTasks);
    setLoading(false);
  };

  const navigateDay =`;

content = content.replace(fetchDataRegex, newFetchData);

// 6. fix program.tasks -> tasks
content = content.replace(/program\?\.tasks/g, 'tasks');
content = content.replace(/program\.tasks/g, 'tasks');

// Fix the setters
content = content.replace(/setProgram\(\(prev: any\) => \(\{[\s\S]*?\.\.\.prev,\s*tasks: \[\.\.\.prev\.tasks,\s*newTask\]\s*\}\)\);/g, 'setTasks(prev => [...prev, newTask]);');
content = content.replace(/setProgram\(\{[\s\S]*?\.\.\.program,\s*tasks: \[\.\.\.program\.tasks,\s*newTask\]\s*\}\);/g, 'setTasks(prev => [...prev, newTask]);');

content = content.replace(/setProgram\(\(prev: any\) => \(\{[\s\S]*?\.\.\.prev,\s*tasks: prev\.tasks\.filter\(\(t: any\) => t\.id !== taskId\)\s*\}\)\);/g, 'setTasks(prev => prev.filter(t => t.id !== taskId));');

content = content.replace(/setProgram\(\(prev: any\) => \(\{[\s\S]*?\.\.\.prev,\s*tasks: prev\.tasks\.map\(\(t: any\) => \{([\s\S]*?)return t;\s*\}\)\s*\}\)\);/m, 
`setTasks(prev => prev.map(t => {
$1return t;
}));`);

// array move
content = content.replace(/setProgram\(\(prev: any\) => \{[\s\S]*?const oldIndex = prev\.tasks\.findIndex\(\(t: any\) => t\.id === active\.id\);[\s\S]*?const updatedTasks = \[\.\.\.prev\.tasks\];[\s\S]*?updatedTasks\[oldIndex\] = \{ \.\.\.updatedTasks\[oldIndex\], date: targetDate \};[\s\S]*?let newIndex = prev\.tasks\.findIndex\(\(t: any\) => t\.id === over\.id\);[\s\S]*?if \(newIndex === -1\) \{[\s\S]*?newIndex = updatedTasks\.length - 1;[\s\S]*?\}[\s\S]*?return \{[\s\S]*?\.\.\.prev,[\s\S]*?tasks: arrayMove\(updatedTasks, oldIndex, newIndex\),[\s\S]*?\};[\s\S]*?\}\);/m,
`setTasks(prev => {
  const oldIndex = prev.findIndex(t => t.id === active.id);
  if (oldIndex === -1) return prev;
  const updatedTasks = [...prev];
  updatedTasks[oldIndex] = { ...updatedTasks[oldIndex], date: targetDate };
  let newIndex = prev.findIndex(t => t.id === over.id);
  if (newIndex === -1) newIndex = updatedTasks.length - 1;
  return arrayMove(updatedTasks, oldIndex, newIndex);
});`
);

// Fix updateWeeklyTopicTarget
content = content.replace(/const updateWeeklyTopicTarget = \([\s\S]*?setProgram\(\(prev: any\) => \(\{[\s\S]*?\}\)\);/m, 
`const updateWeeklyTopicTarget = (topic: string, count: number) => {
  setTasks(prev => prev.map(t => t.topic === topic ? { ...t, targetCount: count } : t));`
);

// fix distributeTaskAcrossDays
content = content.replace(/setProgram\(\(prev: any\) => \{[\s\S]*?let updatedTasks = prev\.tasks\.filter\(\(t: any\) => t\.id !== taskId\);[\s\S]*?return \{ \.\.\.prev, tasks: updatedTasks \};[\s\S]*?\}\);/m, 
`setTasks(prev => {
  let updatedTasks = prev.filter(t => t.id !== taskId);
  selectedDayDates.forEach((date, index) => {
    const dayCount = index === 0 ? countPerDay + remainder : countPerDay;
    const existingIndex = updatedTasks.findIndex(t => t.date === date && t.topic === baseTask.topic && t.subject === baseTask.subject);
    if (existingIndex > -1) {
      updatedTasks[existingIndex] = { ...updatedTasks[existingIndex], targetCount: dayCount };
    } else {
      updatedTasks.push({ ...baseTask, id: Math.random().toString(36).substr(2, 9), date, targetCount: dayCount });
    }
  });
  return updatedTasks;
});`);

// Fix handleSave
const handleSaveStr = `const handleSave = async () => {
    setSaving(true);
    // Group tasks by date
    const tasksByDate = tasks.reduce((acc: any, t: any) => {
      acc[t.date] = acc[t.date] || [];
      acc[t.date].push(t);
      return acc;
    }, {});

    // Save each day that has tasks
    const promises = [];
    for (const [date, dailyTasks] of Object.entries(tasksByDate)) {
      promises.push(studentDataService.saveDailyProgram({
         studentId: selectedStudent!.uid,
         date,
         tasks: dailyTasks
      }));
    }
    
    // Also save routines
    promises.push(studentDataService.saveRoutines(selectedStudent!.uid, routines));

    await Promise.all(promises);
    setSaving(false);
    alert('Program ve Rutinler kaydedildi!');
  };`;

content = content.replace(/const handleSave = async \(\) => \{[\s\S]*?alert\('Program kaydedildi!'\);\s*\};/m, handleSaveStr);


fs.writeFileSync('src/pages/coach/StudentProgram.tsx', content);
