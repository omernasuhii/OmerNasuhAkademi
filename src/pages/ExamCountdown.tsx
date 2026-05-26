import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const EXAMS = [
  { name: 'TYT', date: new Date('2026-06-20T10:00:00') },
  { name: 'AYT', date: new Date('2026-06-21T10:00:00') },
  { name: 'YDT', date: new Date('2026-06-21T15:30:00') },
];

const TR_LABELS: Record<string, string> = {
  days: 'GÜN',
  hours: 'SAAT',
  minutes: 'DAKİKA',
  seconds: 'SANİYE'
};

export default function ExamCountdown() {
  const [timesLeft, setTimesLeft] = useState(calculateTimesLeft());

  function calculateTimesLeft() {
    return EXAMS.map(exam => {
      const difference = +exam.date - +new Date();
      let timeLeft: any = { days: 0, hours: 0, minutes: 0, seconds: 0, active: false };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          active: true
        };
      }
      return { ...exam, ...timeLeft };
    });
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimesLeft(calculateTimesLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 flex flex-col items-center">
      <div className="max-w-6xl w-full text-center space-y-12">
        <div className="inline-flex items-center gap-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg">
            <Clock size={20} />
            <span>Sınav Geri Sayımı</span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
          Büyük Sınavlara Kalan Süre
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {timesLeft.map((exam) => (
            <div key={exam.name} className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center space-y-6">
              <h2 className="text-2xl font-black text-indigo-400">{exam.name} Sınavı</h2>
              
              <div className="text-sm font-bold text-slate-400">
                {exam.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} | {exam.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </div>

              {exam.active ? (
                <div className="flex gap-2">
                  {Object.keys(TR_LABELS).map((interval) => (
                    <div key={interval} className="flex flex-col items-center bg-slate-950 rounded-lg p-3 w-16 md:w-20 border border-white/5">
                      <span className="text-xl md:text-3xl font-black text-white">{exam[interval as keyof typeof exam]}</span>
                      <span className="text-[9px] text-slate-500 font-bold mt-1">{TR_LABELS[interval]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xl text-emerald-400 font-bold py-4">Sınav Vakti Geldi!</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
