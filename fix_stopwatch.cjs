const fs = require('fs');
let code = fs.readFileSync('src/pages/students/ExamMetronomeApp.tsx', 'utf8');

const newStopwatch = `function StopwatchTimer() {
  const { user } = useAuth();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'study_sessions'),
        where('studentId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         // Sort locally to avoid needing a composite index
         data.sort((a: any, b: any) => {
           const timeA = a.createdAt?.seconds || Number.MAX_SAFE_INTEGER;
           const timeB = b.createdAt?.seconds || Number.MAX_SAFE_INTEGER;
           return timeB - timeA;
         });
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
    return \`\${h.toString().padStart(2, '0')}:\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
  };

  const groupedSessions = sessions.reduce((acc: any, session: any) => {
    const dateStr = session.createdAt?.seconds 
      ? new Date(session.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
      : 'Bugün';
    
    if (!acc[dateStr]) {
      acc[dateStr] = {
        totalDuration: 0,
        sessions: []
      };
    }
    acc[dateStr].sessions.push(session);
    acc[dateStr].totalDuration += session.duration || 0;
    return acc;
  }, {});

  const toggleDay = (dateStr: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
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
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(groupedSessions).length > 0 ? (
            Object.entries(groupedSessions).map(([dateStr, data]: [string, any]) => (
              <div key={dateStr} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                <button 
                  onClick={() => toggleDay(dateStr)}
                  className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{dateStr}</span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">
                      {data.sessions.length} Oturum
                    </span>
                  </div>
                  <span className="text-amber-400 font-black tracking-wider bg-amber-500/10 px-3 py-1 rounded-lg">
                    {formatTime(data.totalDuration)}
                  </span>
                </button>
                
                {expandedDays[dateStr] && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {data.sessions.map((session: any) => (
                      <div key={session.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400 text-sm font-medium">
                          {session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi'}
                        </span>
                        <span className="text-amber-400 text-sm font-bold tracking-wider">
                          {formatTime(session.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Henüz çalışma kaydınız bulunmuyor.</p>
              <p className="text-slate-600 text-sm mt-1">Hemen kronometreyi başlatın!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

code = code.replace(/function StopwatchTimer\(\) \{[\s\S]*?\}(?=\n\nexport default function ExamMetronomeApp\(\))/g, newStopwatch);

fs.writeFileSync('src/pages/students/ExamMetronomeApp.tsx', code);
