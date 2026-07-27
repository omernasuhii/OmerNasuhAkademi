const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/StudentSummary.tsx', 'utf8');

const targetStr = `  const statsFromPrograms = useMemo(() => {
    let globalSolved = 0;
    let globalTarget = 0;
    let globalTaskDone = 0;
    let globalTaskNotDone = 0;
    let globalUnsolved = 0;
    let firstDate: Date | null = null;`;

const insertStr = `  const statsFromPrograms = useMemo(() => {
    let globalSolved = 0;
    let globalTarget = 0;
    let globalTaskDone = 0;
    let globalTaskNotDone = 0;
    let globalUnsolved = 0;
    let pendingResultsCount = 0;
    let firstDate: Date | null = null;`;

const loopTarget = `      if (dp.tasks) {
        dp.tasks.forEach((task: any) => {`;
const loopInsert = `      if (dp.tasks) {
        dp.tasks.forEach((task: any) => {
          if (task.isWaitingResult) {
            pendingResultsCount++;
          }`;

const returnTarget = `      overallAvgCompletion: overallAvgCompletion,
      last4AvgCompletion: last4AvgCompletion,
      derivedWeeklyReports: weeklyReportsArray
    };
  }, [dailyPrograms, selectedStudent, exams]);`;

const returnInsert = `      overallAvgCompletion: overallAvgCompletion,
      last4AvgCompletion: last4AvgCompletion,
      derivedWeeklyReports: weeklyReportsArray,
      pendingResultsCount
    };
  }, [dailyPrograms, selectedStudent, exams]);`;

const destructTarget = `  const { totalSolved, totalUnsolved, avgSolved, avgUnsolved, overallAvgCompletion, last4AvgCompletion, derivedWeeklyReports } = statsFromPrograms;`;
const destructInsert = `  const { totalSolved, totalUnsolved, avgSolved, avgUnsolved, overallAvgCompletion, last4AvgCompletion, derivedWeeklyReports, pendingResultsCount } = statsFromPrograms;`;

const renderTarget = `        <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 overflow-hidden relative group">`;
const renderInsert = `        {pendingResultsCount > 0 && (
          <div className="xl:col-span-3 bg-amber-500/10 border border-amber-500/20 rounded-[20px] p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
               <AlertTriangle className="text-amber-400" size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-400 uppercase tracking-wide mb-1">Sonuç Bekleyen Denemeler ({pendingResultsCount})</h3>
              <p className="text-xs text-slate-300 font-medium">
                Öğrencinin şu anda sonuç bekleyen <strong>{pendingResultsCount}</strong> adet deneme görevi bulunuyor. 
                2 gün içerisinde "Denemelerim" sayfasından sonucu girilmezse öğrencinin serisi sıfırlanacaktır.
              </p>
            </div>
          </div>
        )}
        <div className="xl:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 overflow-hidden relative group">`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else { console.log('targetStr not found'); }
if (content.includes(loopTarget)) {
  content = content.replace(loopTarget, loopInsert);
} else { console.log('loopTarget not found'); }
if (content.includes(returnTarget)) {
  content = content.replace(returnTarget, returnInsert);
} else { console.log('returnTarget not found'); }
if (content.includes(destructTarget)) {
  content = content.replace(destructTarget, destructInsert);
} else { console.log('destructTarget not found'); }
if (content.includes(renderTarget)) {
  content = content.replace(renderTarget, renderInsert);
} else { console.log('renderTarget not found'); }

if (!content.includes('AlertTriangle,')) {
    content = content.replace('import { ', 'import { AlertTriangle, ');
}

fs.writeFileSync('src/pages/coach/StudentSummary.tsx', content);
