const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

const oldGrid = `                                    <div className="col-span-5 flex-1 min-w-0">
                                      <p
                                        className="text-[11px] font-bold text-slate-300 truncate"
                                        title={fieldItem.name}
                                      >
                                        {fieldItem.name}
                                      </p>
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={
                                          newResult.scores[fieldItem.name]?.c ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleScoreChange(
                                            fieldItem.name,
                                            fieldItem.max,
                                            "c",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="D"
                                        min="0"
                                        max={fieldItem.max}
                                        className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center rounded text-xs p-1.5 outline-none focus:border-emerald-500 appearance-none m-0"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={
                                          newResult.scores[fieldItem.name]?.i ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleScoreChange(
                                            fieldItem.name,
                                            fieldItem.max,
                                            "i",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Y"
                                        min="0"
                                        max={fieldItem.max}
                                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-center rounded text-xs p-1.5 outline-none focus:border-red-500 appearance-none m-0"
                                      />
                                    </div>
                                    <div className="col-span-3 text-right">
                                      <span className="text-xs font-black text-white bg-slate-700/50 px-2 py-1.5 rounded inline-block min-w-[3rem]">
                                        {newResult.scores[fieldItem.name]?.n ||
                                          0}
                                      </span>
                                    </div>`;

const newGrid = `                                    <div className={["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(newResult.examType) ? "col-span-4 flex-1 min-w-0" : "col-span-5 flex-1 min-w-0"}>
                                      <p
                                        className="text-[11px] font-bold text-slate-300 truncate"
                                        title={fieldItem.name}
                                      >
                                        {fieldItem.name}
                                      </p>
                                    </div>
                                    {["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(newResult.examType) && (
                                      <div className="col-span-2">
                                        <input
                                          type="number"
                                          value={
                                            newResult.scores[fieldItem.name]?.m !== undefined ? newResult.scores[fieldItem.name].m : fieldItem.max
                                          }
                                          onChange={(e) =>
                                            handleScoreChange(
                                              fieldItem.name,
                                              fieldItem.max,
                                              "m",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Soru"
                                          min="1"
                                          className="w-full bg-slate-700/30 border border-slate-600/50 text-slate-300 text-center rounded text-xs p-1.5 outline-none focus:border-indigo-500 appearance-none m-0"
                                        />
                                      </div>
                                    )}
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={
                                          newResult.scores[fieldItem.name]?.c ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleScoreChange(
                                            fieldItem.name,
                                            fieldItem.max,
                                            "c",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="D"
                                        min="0"
                                        max={newResult.scores[fieldItem.name]?.m ?? fieldItem.max}
                                        className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center rounded text-xs p-1.5 outline-none focus:border-emerald-500 appearance-none m-0"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={
                                          newResult.scores[fieldItem.name]?.i ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleScoreChange(
                                            fieldItem.name,
                                            fieldItem.max,
                                            "i",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Y"
                                        min="0"
                                        max={newResult.scores[fieldItem.name]?.m ?? fieldItem.max}
                                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-center rounded text-xs p-1.5 outline-none focus:border-red-500 appearance-none m-0"
                                      />
                                    </div>
                                    <div className={["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(newResult.examType) ? "col-span-2 text-right" : "col-span-3 text-right"}>
                                      <span className="text-xs font-black text-white bg-slate-700/50 px-2 py-1.5 rounded inline-block min-w-[2.5rem] text-center">
                                        {newResult.scores[fieldItem.name]?.n ||
                                          0}
                                      </span>
                                    </div>`;

if(content.includes(oldGrid)) {
  content = content.replace(oldGrid, newGrid);
} else {
  console.log("oldGrid not found");
}

fs.writeFileSync('src/pages/student/Exams.tsx', content);
