const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

const targetStr = `                                                                {task.isDone ? (
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20" title="Deneme sonucu girildi.">
                                                                        <CheckCircle2 size={20} />
                                                                    </div>
                                                                ) : (
                                                                    <div className="group relative">
                                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 text-slate-400 bg-white/5 cursor-help">
                                                                            <Info size={20} />
                                                                        </div>
                                                                        <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                                            Bu denemeyi tamamlandı olarak işaretlemek için lütfen önce 'Denemelerim' sayfasından deneme sonucunuzu giriniz.
                                                                        </div>
                                                                    </div>
                                                                )}`;
const insertStr = `                                                                {task.isDone ? (
                                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20" title="Deneme sonucu girildi.">
                                                                        <CheckCircle2 size={20} />
                                                                    </div>
                                                                ) : task.isWaitingResult ? (
                                                                    <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center bg-amber-500/20 border border-amber-500 text-amber-400 shadow-lg shadow-amber-500/10 cursor-pointer" onClick={() => toggleTaskWaitingResult(day.date, task.id, task.isWaitingResult)} title="Sonuç bekleniyor. İptal etmek için tıklayın.">
                                                                        <span className="text-[8px] font-bold leading-tight">Sonuç</span>
                                                                        <span className="text-[8px] font-bold leading-tight">Bekleniyor</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="group relative">
                                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 text-slate-400 bg-white/5 cursor-help">
                                                                                <Info size={20} />
                                                                            </div>
                                                                            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none z-[100]">
                                                                                Bu denemeyi tamamlandı olarak işaretlemek için lütfen önce 'Denemelerim' sayfasından deneme sonucunuzu giriniz. Veya henüz sonuç açıklanmadıysa 'Sonuç Bekleniyor' olarak işaretleyebilirsiniz.
                                                                            </div>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => toggleTaskWaitingResult(day.date, task.id, false)}
                                                                            className="h-10 px-1.5 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors text-[8px] font-bold leading-tight flex flex-col items-center justify-center text-center"
                                                                            title="Cevap anahtarı açıklanmadığı için sonucu bekliyorsanız işaretleyin."
                                                                        >
                                                                            <span>Sonuç</span>
                                                                            <span>Bekleniyor</span>
                                                                        </button>
                                                                    </div>
                                                                )}`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found in ui');
}

fs.writeFileSync('src/pages/student/Coaching.tsx', content);
