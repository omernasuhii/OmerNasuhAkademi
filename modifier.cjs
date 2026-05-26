const fs = require('fs');
let content = fs.readFileSync('src/pages/students/QuestionAnalysis.tsx', 'utf8');

content = content.replace(/data: \[(\{ year: '2023', count: (\d+) \}, \{ year: '2022', count: (\d+) \}, \{ year: '2021', count: (\d+) \})\]/g, function(match, inner, c23, c22, c21) {
    return `data: [{ year: '2025', count: ${c23} }, { year: '2024', count: ${c22} }, ${inner}]`;
});

content = content.replace(/\['2023', '2022', '2021'\]/g, "['2025', '2024', '2023', '2022', '2021']");

const oldThs = `<th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2023</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2022</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2021</th>`;

const newThs = `<th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2025</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2024</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2023</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2022</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2021</th>`;

content = content.replace(oldThs, newThs);

content = content.replace(/Son 3 yıla ait/g, "Son 5 yıla ait");

fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', content);
