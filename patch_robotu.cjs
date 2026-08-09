const fs = require('fs');
let code = fs.readFileSync('src/pages/students/TercihRobotu.tsx', 'utf8');

// Replace the label for 2. Puan Türü
code = code.replace(
  `<span>2. Puan Türü & Sıralama</span>`,
  `<span>2. Puan Türü</span>
              {selectedPointTypes.length > 0 && (
                <button 
                  onClick={() => setShowAutoRank(!showAutoRank)}
                  className="text-[10px] bg-slate-900/50 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                >
                  {showAutoRank ? "Akıllı Süzgeci Gizle" : "Sıralama Gir"}
                </button>
              )}`
);

// We need to move the AnimatePresence block.
// First, extract the block.
const animateStartStr = `<AnimatePresence>\n              {selectedPointTypes.length > 0 && (`;
const animateEndStr = `                </motion.div>\n              )}\n            </AnimatePresence>`;

const startIndex = code.indexOf(animateStartStr);
const endIndex = code.indexOf(animateEndStr) + animateEndStr.length;

let animateBlock = code.substring(startIndex, endIndex);
code = code.slice(0, startIndex) + code.slice(endIndex);

// Add col-span to the block and use showAutoRank condition
animateBlock = animateBlock.replace(
  `{selectedPointTypes.length > 0 && (`,
  `{selectedPointTypes.length > 0 && showAutoRank && (`
);

animateBlock = animateBlock.replace(
  `className="overflow-hidden"`,
  `className="overflow-hidden col-span-1 md:col-span-2 lg:col-span-3"`
);

// Swap Üst Sınır and Alt Sınır
// Let's replace the whole grid grid-cols-2 gap-4
const gridRegex = /<div className="grid grid-cols-2 gap-4">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*\)}/m;

const gridMatch = animateBlock.match(gridRegex);
if(gridMatch) {
  const newGrid = `<div className="grid grid-cols-2 gap-4">
                          {/* Alt Sınır (Daha kötü sıralama) */}
                          <div className="space-y-1">
                            <label className="text-[9px] text-rose-400 font-bold uppercase flex justify-between">
                              <span>Alt Sınır (Daha Kötü)</span>
                              <span>%{maxTolerancePercent}</span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={maxTolerancePercent}
                              onChange={(e) => handleMaxToleranceChange(Number(e.target.value))}
                              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
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
  animateBlock = animateBlock.replace(gridMatch[0], newGrid);
}

// Now we need to insert animateBlock AFTER the 3. Ön/Lisans Seviyesi block
// The 3rd block ends with:
//               ))}
//             </div>
//           </div>
//
//           {/* 4. Öğretim Türü */}

const insertionPointStr = `          {/* 4. Öğretim Türü */}`;
const insertionIndex = code.indexOf(insertionPointStr);

code = code.slice(0, insertionIndex) + animateBlock + "\n\n" + code.slice(insertionIndex);

fs.writeFileSync('src/pages/students/TercihRobotu.tsx', code);
console.log("Success");
