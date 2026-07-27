import fs from 'fs';

let code = fs.readFileSync('src/pages/admin/AdminAcademicExams.tsx', 'utf8');

// 1. Update formData initial state
code = code.replace(
  'linkedExamId: "",\n    sections:',
  'linkedExamIds: [] as string[],\n    sections:'
);
if (code.includes('linkedExamId: "",')) {
  code = code.replace(
    'linkedExamId: "",\n        sections:',
    'linkedExamIds: [],\n        sections:'
  );
}

// 2. Update setFormData in handleOpenModal (editing)
code = code.replace(
  'linkedExamId: exam.linkedExamId || "",\n        sections:',
  'linkedExamIds: exam.linkedExamIds || (exam.linkedExamId ? [exam.linkedExamId] : []),\n        sections:'
);

// 3. Update the display of linked exams
const displayRegex = /\{\(\(\) => \{\s*const linked = exam\.linkedExamId[\s\S]*?return null;\s*\}\)\(\)\}/;
const newDisplay = `{(() => {
                      const linkedIds = exam.linkedExamIds || (exam.linkedExamId ? [exam.linkedExamId] : []);
                      const linkedExams = exams.filter(e => linkedIds.includes(e.id) || e.linkedExamIds?.includes(exam.id) || e.linkedExamId === exam.id);
                      if (linkedExams.length > 0) {
                        return linkedExams.map(linked => (
                          <span key={linked.id} className="ml-2 text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">
                            🔗 Bağlantılı: {linked.title || "Bilinmiyor"}
                          </span>
                        ));
                      }
                      return null;
                    })()}`;
code = code.replace(displayRegex, newDisplay);

// 4. Update the form logic for TYT
const formRegex = /\{formData\.type === "TYT" && \([\s\S]*?\}\)\}\s*<\/select>[\s\S]*?<\/div>\s*\)\}/;
const newForm = `{formData.type === "TYT" && (
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Bağlantılı AYT Denemesi (İsteğe Bağlı)
                  </label>
                  <select
                    value={formData.linkedExamIds?.find(id => exams.find(e => e.id === id)?.type === 'AYT') || ""}
                    onChange={(e) => {
                      const otherIds = formData.linkedExamIds?.filter(id => exams.find(ex => ex.id === id)?.type !== 'AYT') || [];
                      const newIds = e.target.value ? [...otherIds, e.target.value] : otherIds;
                      setFormData({ ...formData, linkedExamIds: newIds });
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50 mb-4"
                  >
                    <option value="">Bağlantılı AYT sınavı yok</option>
                    {exams
                      .filter((e) => e.id !== editingExam?.id && e.type === 'AYT')
                      .map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.type} - {exam.title} ({safeFormatDate(exam.createdAt || exam.date)})
                        </option>
                      ))}
                  </select>

                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Bağlantılı YDT Denemesi (İsteğe Bağlı)
                  </label>
                  <select
                    value={formData.linkedExamIds?.find(id => exams.find(e => e.id === id)?.type === 'YDT') || ""}
                    onChange={(e) => {
                      const otherIds = formData.linkedExamIds?.filter(id => exams.find(ex => ex.id === id)?.type !== 'YDT') || [];
                      const newIds = e.target.value ? [...otherIds, e.target.value] : otherIds;
                      setFormData({ ...formData, linkedExamIds: newIds });
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Bağlantılı YDT sınavı yok</option>
                    {exams
                      .filter((e) => e.id !== editingExam?.id && e.type === 'YDT')
                      .map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.type} - {exam.title} ({safeFormatDate(exam.createdAt || exam.date)})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    Bu TYT denemesini hem AYT hem de YDT denemeleri ile ilişkilendirebilirsiniz.
                  </p>
                </div>
                )}`;
code = code.replace(formRegex, newForm);

fs.writeFileSync('src/pages/admin/AdminAcademicExams.tsx', code);
console.log("Updated successfully!");
