const fs = require('fs');
let code = fs.readFileSync('src/pages/students/TercihRobotu.tsx', 'utf8');

const strToRemove = `                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                            />
                          </div>

                          {/* Üst Sınır (Daha iyi sıralama) */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-emerald-400 font-bold uppercase flex justify-between">
                              <span>Üst Sınır (Daha İyi)</span>
                              <span>%{minTolerancePercent}</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={minTolerancePercent}
                              onChange={(e) => handleMinToleranceChange(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}`;

if (code.includes(strToRemove)) {
  code = code.replace(strToRemove, "");
  fs.writeFileSync('src/pages/students/TercihRobotu.tsx', code);
  console.log("Success");
} else {
  console.log("Failed to match");
}
