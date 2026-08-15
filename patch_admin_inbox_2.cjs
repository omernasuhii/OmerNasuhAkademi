const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminInbox.tsx', 'utf8');

content = content.replace(
  "const [singleTestPhone, setSingleTestPhone] = useState('');",
  "const [singleTestPhone, setSingleTestPhone] = useState('');\n  const [singleTestTemplate, setSingleTestTemplate] = useState('weekly_report');"
);

// We need to modify handleRunSingleStudentTest
const newHandler = `
  const handleRunSingleStudentTest = async () => {
    setIsSingleTesting(true);
    setSingleTestResult(null);
    try {
      const selectedStudentObj = firestoreStudents.find(s => s.id === singleTestStudentId);
      const studentName = singleTestCustomName.trim() || selectedStudentObj?.name || (singleTestStudentId === 'demo_student_2' ? 'Zeynep Kaya' : 'Ahmet Yılmaz');
      
      const payload = {
          studentId: singleTestStudentId,
          parentPhone: singleTestPhone.trim() || selectedStudentObj?.phone || undefined,
          studentName,
          force: true
      };
      
      let endpoint = '/api/send-weekly-reports';
      if (singleTestTemplate === 'subscription_reminder') {
          endpoint = '/api/test-subscription-reminders';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test sırasında bir hata oluştu.');
      
      setSingleTestResult({
        success: true,
        message: data.message || 'Test başarılı!',
        log: data.logs?.[0] || data
      });
      
    } catch (err: any) {
      console.error("Single test error:", err);
      setSingleTestResult({
        success: false,
        error: err?.message || 'Bir hata oluştu.'
      });
    } finally {
      setIsSingleTesting(false);
    }
  };
`;

const handlerRegex = /const handleRunSingleStudentTest = async \(\) => \{[\s\S]*?setIsSingleTesting\(false\);\n    \}\n  \};/;
content = content.replace(handlerRegex, newHandler);


// Now replace the JSX
const testBoxRegex = /<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">[\s\S]*?<div className="flex items-end">[\s\S]*?<\/button>[\s\S]*?<\/div>\n                  <\/div>/;

const newTestBox = `
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        1) Öğrenci Seçin
                      </label>
                      <select
                        value={singleTestStudentId}
                        onChange={(e) => {
                          setSingleTestStudentId(e.target.value);
                          const found = firestoreStudents.find(s => s.id === e.target.value);
                          if (found?.phone) setSingleTestPhone(found.phone);
                        }}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="demo_student_1">Ahmet Yılmaz (Demo Öğrenci - Sayısal)</option>
                        <option value="demo_student_2">Zeynep Kaya (Demo Öğrenci - EA)</option>
                        {firestoreStudents.map(st => (
                          <option key={st.id} value={st.id}>
                            {st.name} {st.phone ? \`(\${st.phone})\` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        2) Veli Telefonu (Opsiyonel)
                      </label>
                      <input
                        type="text"
                        value={singleTestPhone}
                        onChange={(e) => setSingleTestPhone(e.target.value)}
                        placeholder="Örn: +905550001122"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        3) Test Edilecek Şablon
                      </label>
                      <select
                        value={singleTestTemplate}
                        onChange={(e) => setSingleTestTemplate(e.target.value)}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="weekly_report">Haftalık Veli Raporu (PDF'li)</option>
                        <option value="subscription_reminder">Abonelik Yenileme Hatırlatması</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleRunSingleStudentTest}
                        disabled={isSingleTesting}
                        className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        {isSingleTesting ? (
                          <>
                            <div className="animate-spin w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                            <span>Test Ediliyor...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Sadece Bu 1 Öğrencide Çalıştır</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
`;

content = content.replace(testBoxRegex, newTestBox);

fs.writeFileSync('src/pages/admin/AdminInbox.tsx', content);

