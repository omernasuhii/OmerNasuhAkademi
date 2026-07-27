import fs from 'fs';
let code = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

const endBroken = `                                 })}
                             </div>
                        ) : (
                             <div className="h-20 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
                                 Boş Gün
                             </div>
                        )}
                     </div>
                     );
                 })}`;

const fixedEnd = `                                 })}
                                    )}
                                </div>
                            </div>
                        );
                    })}`;

code = code.replace(endBroken, fixedEnd);
fs.writeFileSync('src/pages/student/Coaching.tsx', code);
console.log("Fixed end!");
