const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentDashboard.tsx', 'utf8');

const stateTarget = `  const [feedbacks, setFeedbacks] = useState<any[]>([]);`;
const stateInsert = `  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [pendingResultsCount, setPendingResultsCount] = useState(0);`;

const loopTarget = `        weeklyData?.forEach((prog: any) => {`;
const loopInsert = `        let pCount = 0;
        weeklyData?.forEach((prog: any) => {
           (prog.tasks || []).forEach((t: any) => {
               if (t.isWaitingResult) pCount++;
           });`;

const afterLoopTarget = `        setWeeklyStats({`;
const afterLoopInsert = `        setPendingResultsCount(pCount);
        setWeeklyStats({`;

const renderTarget = `      <NotificationPrompt />`;
const renderInsert = `      <NotificationPrompt />
      {pendingResultsCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
             <AlertTriangle className="text-amber-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-400 uppercase tracking-wide mb-1">Sonuç Bekleyen Denemeler ({pendingResultsCount})</h3>
            <p className="text-xs text-slate-300 font-medium">
              Öğrencinin şu anda sonuç bekleyen <strong>{pendingResultsCount}</strong> adet deneme görevi bulunuyor. 
              2 gün içerisinde öğrenci tarafından sonuç girilmezse çalışma serisi (streak) sıfırlanacaktır.
            </p>
          </div>
        </div>
      )}`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateInsert);
} else { console.log('stateTarget not found'); }
if (content.includes(loopTarget)) {
  content = content.replace(loopTarget, loopInsert);
} else { console.log('loopTarget not found'); }
if (content.includes(afterLoopTarget)) {
  content = content.replace(afterLoopTarget, afterLoopInsert);
} else { console.log('afterLoopTarget not found'); }
if (content.includes(renderTarget)) {
  content = content.replace(renderTarget, renderInsert);
} else { console.log('renderTarget not found'); }

if (!content.includes('AlertTriangle,')) {
    content = content.replace('import { ', 'import { AlertTriangle, ');
}

fs.writeFileSync('src/pages/parents/ParentDashboard.tsx', content);
