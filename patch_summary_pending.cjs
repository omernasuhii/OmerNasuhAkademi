const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

const stateTarget = `  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history'>('overview');`;
const stateInsert = `  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history'>('overview');
  const [pendingResultsCount, setPendingResultsCount] = useState(0);`;

const effectTarget = `            if (hasExpiredWaiting && sCount > 0) {
                sCount = 0;
                await studentDataService.updateStudentProfile(userData.uid, {`;
const effectInsert = `            let currentPending = 0;
            pastProgs.forEach(prog => {
                if (prog.tasks?.some((t:any) => t.isWaitingResult)) {
                    currentPending++;
                }
            });
            setPendingResultsCount(currentPending);

            if (hasExpiredWaiting && sCount > 0) {
                sCount = 0;
                await studentDataService.updateStudentProfile(userData.uid, {`;

const renderTarget = `      <NotificationPrompt />`;
const renderInsert = `      <NotificationPrompt />
      {pendingResultsCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
             <AlertTriangle className="text-amber-400" size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-400 uppercase tracking-wide mb-1">Sonuç Bekleyen Denemeler</h3>
            <p className="text-xs text-slate-300 font-medium">
              Şu anda sonuç bekleyen {pendingResultsCount} adet deneme göreviniz bulunuyor. 
              Çalışma serinizin (Streak) sıfırlanmaması için bu denemelerin sonucunu en geç 2 gün içinde "Denemelerim" sayfasından girmeniz gerekmektedir.
            </p>
          </div>
        </div>
      )}`;

if (content.includes(stateTarget)) {
  content = content.replace(stateTarget, stateInsert);
}
if (content.includes(effectTarget)) {
  content = content.replace(effectTarget, effectInsert);
}
if (content.includes(renderTarget)) {
  content = content.replace(renderTarget, renderInsert);
}
fs.writeFileSync('src/pages/students/Summary.tsx', content);

// Add AlertTriangle to imports if missing
if (!content.includes('AlertTriangle')) {
  content = content.replace('Target,', 'Target, AlertTriangle,');
  fs.writeFileSync('src/pages/students/Summary.tsx', content);
}
