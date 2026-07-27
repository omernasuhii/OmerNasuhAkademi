const fs = require('fs');
let code = fs.readFileSync('src/pages/students/ExamMetronomeApp.tsx', 'utf8');

code = code.replace(
  "import { doc, updateDoc, arrayUnion } from 'firebase/firestore';",
  "import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';"
);

code = code.replace(
  "import { Play, Pause, Square, Maximize, AlertCircle, Settings, Volume2, Headphones, Timer, Clock } from 'lucide-react';",
  "import { Play, Pause, Square, Maximize, AlertCircle, Settings, Volume2, Headphones, Timer, Clock, StopCircle } from 'lucide-react';"
);

const stopwatchStr = `function StopwatchTimer() {
  const { user } = useAuth();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'study_sessions'),
        where('studentId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         setSessions(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const stopAndSave = async () => {
    setIsRunning(false);
    if (time > 0 && user?.uid) {
      try {
        await addDoc(collection(db, 'study_sessions'), {
          studentId: user.uid,
          duration: time,
          createdAt: serverTimestamp(),
          date: new Date().toISOString().split('T')[0]
        });
        setTime(0);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return \`\${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="w-full @container bg-slate-900 border border-amber-500/30 aspect-[2/1] sm:aspect-[2.5/1] flex items-center justify-center rounded-[3rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden shadow-amber-500/10">
        <div className="text-[20cqw] font-bold text-amber-500 tracking-wider leading-none tabular-nums drop-shadow-lg transition-colors"
             style={{ fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace" }}>
          {formatTime(time)}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTimer}
          className={\`w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 \${isRunning ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}\`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} />}
        </button>
        <button
          onClick={stopAndSave}
          disabled={time === 0}
          className="w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square size={32} fill="currentColor" />
        </button>
      </div>

      <div className="w-full bg-slate-800/50 rounded-3xl p-6 mt-8 border border-white/5">
        <h3 className="text-xl font-bold text-white mb-4">Günlük Çalışma Kayıtları</h3>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {sessions.length > 0 ? sessions.map((session) => (
             <div key={session.id} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                <span className="text-slate-400 font-medium">{session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Şimdi'}</span>
                <span className="text-amber-400 font-black tracking-wider bg-amber-500/10 px-3 py-1 rounded-lg">{formatTime(session.duration)}</span>
             </div>
          )) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Henüz çalışma kaydınız bulunmuyor.</p>
              <p className="text-slate-600 text-sm mt-1">Hemen kronometreyi başlatın!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function`;

code = code.replace("export default function", stopwatchStr);

const stateAndTabsRegex = /const \[activeTab, setActiveTab\] = useState<\'pomodoro\' \| \'metronome\'>\(\'pomodoro\'\);/;
code = code.replace(stateAndTabsRegex, "const [activeTab, setActiveTab] = useState<'pomodoro' | 'metronome' | 'stopwatch'>('pomodoro');");

const tabsDivRegex = /<Clock size=\{18\} \/> Sınav Metronomu\s*<\/button>\s*<\/div>/;

const newTabsStr = `<Clock size={18} /> Sınav Metronomu
          </button>
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={\`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all \${
              activeTab === 'stopwatch' 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }\`}
          >
            <StopCircle size={18} /> Kronometre
          </button>
        </div>`;

code = code.replace(tabsDivRegex, newTabsStr);

const renderLogicRegex = /\{activeTab === \'pomodoro\' \? \(\s*<PomodoroTimer \/>\s*\) : \(\s*<ExamMetronomeContent isFocusMode=\{isFocusMode\} setIsFocusMode=\{setIsFocusMode\} \/>\s*\)\}/;

const newRenderLogicStr = `{activeTab === 'pomodoro' ? (
        <PomodoroTimer />
      ) : activeTab === 'stopwatch' ? (
        <StopwatchTimer />
      ) : (
        <ExamMetronomeContent isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
      )}`;

code = code.replace(renderLogicRegex, newRenderLogicStr);

fs.writeFileSync('src/pages/students/ExamMetronomeApp.tsx', code);
