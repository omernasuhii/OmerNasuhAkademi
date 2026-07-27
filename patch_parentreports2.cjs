const fs = require('fs');
let content = fs.readFileSync('src/pages/parents/ParentReports.tsx', 'utf8');

const targetStr = `                                        {task.targetCount > 0 && (
                                          <p className="text-[10px] text-slate-500 mt-1">
                                            Hedef: {task.targetCount} {task.type === "Soru Çözümü" ? "Soru" : "Birim"} 
                                            {task.isDone && \` | Yapılan: \${task.completedCount || task.targetCount}\`}
                                          </p>
                                        )}
                                      </div>`;

const insertStr = `                                        {task.targetCount > 0 && (
                                          <p className="text-[10px] text-slate-500 mt-1">
                                            Hedef: {task.targetCount} {task.type === "Soru Çözümü" ? "Soru" : "Birim"} 
                                            {task.isDone && \` | Yapılan: \${task.completedCount || task.targetCount}\`}
                                          </p>
                                        )}
                                        {task.isWaitingResult && (
                                          <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-wider">
                                            Sonuç Bekleniyor
                                          </p>
                                        )}
                                      </div>`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found for parent reports 2');
}

fs.writeFileSync('src/pages/parents/ParentReports.tsx', content);
