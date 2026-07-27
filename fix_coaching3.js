import fs from 'fs';
let code = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

const renderRegex = /if \(isDeneme\) \{[\s\S]*?if \(task\.type === 'Soru Çözümü' \|\|/g;

const newRenderLogic = `if (isDeneme) {
                                                        return (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {task.isDone && !task.isWaitingResult ? (
                                                                    <div className="h-10 px-3 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20 gap-2" title="Deneme sonucu girildi.">
                                                                        {task.completedCount !== undefined && task.completedCount > 0 && (
                                                                            <div className="flex flex-col items-center border-r border-white/20 pr-2">
                                                                                <span className="text-xs font-black leading-none">{task.completedCount}</span>
                                                                                <span className="text-[7px] font-bold uppercase tracking-wider opacity-90">Soru</span>
                                                                            </div>
                                                                        )}
                                                                        <CheckCircle2 size={16} />
                                                                    </div>
                                                                ) : task.isWaitingResult ? (
                                                                    <div className={\`w-10 h-10 rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-lg transition-all \${isWaitingExpired ? 'bg-red-500/20 border border-red-500 text-red-400 shadow-red-500/10' : 'bg-amber-500/20 border border-amber-500 text-amber-400 shadow-amber-500/10'}\`} onClick={() => toggleTaskWaitingResult(day.date, task.id, task.isWaitingResult)} title={isWaitingExpired ? '5 gün içerisinde sonuç girilmediği için yapılmadı sayıldı.' : 'Sonuç bekleniyor. İptal etmek için tıklayın.'}>
                                                                        <span className="text-[7px] font-black uppercase leading-tight text-center">{isWaitingExpired ? 'Yapılmadı' : 'Sonuç'}</span>
                                                                        <span className="text-[7px] font-bold leading-tight text-center">{isWaitingExpired ? '(5+ Gün)' : 'Bekleniyor'}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="group relative">
                                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 text-slate-400 bg-white/5 cursor-help">
                                                                                <Info size={20} />
                                                                            </div>
                                                                            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none z-[100]">
                                                                                Bu denemeyi tamamlandı olarak işaretlemek için lütfen önce 'Denemelerim' sayfasından deneme sonucunuzu giriniz.{isGenelDeneme ? " Veya henüz sonuç açıklanmadıysa 'Sonuç Bekleniyor' olarak işaretleyebilirsiniz." : ""}
                                                                            </div>
                                                                        </div>
                                                                        {isGenelDeneme && (
                                                                            <button
                                                                                onClick={() => toggleTaskWaitingResult(day.date, task.id, false)}
                                                                                className="h-10 px-1.5 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors text-[8px] font-bold leading-tight flex flex-col items-center justify-center text-center"
                                                                                title="Cevap anahtarı açıklanmadığı için sonucu bekliyorsanız işaretleyin."
                                                                            >
                                                                                <span>Sonuç</span>
                                                                                <span>Bekleniyor</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    if (task.type === 'Soru Çözümü' ||`;
code = code.replace(renderRegex, newRenderLogic);
fs.writeFileSync('src/pages/student/Coaching.tsx', code);
console.log("Restored properly!");
