import fs from 'fs';

// 1. Fix StudentExamResults.tsx (Coach)
let results = fs.readFileSync('src/pages/coach/StudentExamResults.tsx', 'utf8');

const getDisplayExamsRegex = /const getDisplayExams = \(\) => \{\s*return exams\.filter\(e => \{[\s\S]*?\}\)\.sort\(\(a,b\) => safeGetTime\(b\.date\) - safeGetTime\(a\.date\)\);\s*\};/;

const newGetDisplayExams = `const getDisplayExams = () => {
    return exams.filter(e => {
        if (activeTab === 'BRANŞ') return e.examType === 'BRANŞ';
        return e.examType === activeTab || (e.examType === 'YKS' && activeTab !== 'YKS');
    }).sort((a,b) => {
        const dateA = (activeTab === 'AYT' || activeTab === 'YDT') && a.examType === 'YKS' ? (a.aytDate || a.date) : a.date;
        const dateB = (activeTab === 'AYT' || activeTab === 'YDT') && b.examType === 'YKS' ? (b.aytDate || b.date) : b.date;
        return safeGetTime(dateB) - safeGetTime(dateA);
    });
  };`;

results = results.replace(getDisplayExamsRegex, newGetDisplayExams);

results = results.replace(
  '<td className="px-6 py-6 text-sm text-slate-400 font-medium">{exam.date}</td>',
  `<td className="px-6 py-6 text-sm text-slate-400 font-medium">
                      <div className="flex flex-col">
                        <span>{exam.examType === 'YKS' ? 'TYT: ' : ''}{exam.date}</span>
                        {exam.aytDate && <span className="text-xs mt-0.5">AYT/YDT: {exam.aytDate}</span>}
                      </div>
                    </td>`
);

fs.writeFileSync('src/pages/coach/StudentExamResults.tsx', results);

// 2. Fix StudentExams.tsx (Coach Charts)
let examsFile = fs.readFileSync('src/pages/coach/StudentExams.tsx', 'utf8');

const dateFilterRegex = /if \(dateFilter !== 'all'\) \{\s*const cutoffDate = new Date\(\);[\s\S]*?filteredExams = filteredExams\.filter\(e => new Date\(e\.date\) >= cutoffDate\);\s*\}/;
const newDateFilter = `if (dateFilter !== 'all') {
     const cutoffDate = new Date();
     if (dateFilter === '1month') cutoffDate.setMonth(cutoffDate.getMonth() - 1);
     if (dateFilter === '3months') cutoffDate.setMonth(cutoffDate.getMonth() - 3);
     if (dateFilter === '6months') cutoffDate.setMonth(cutoffDate.getMonth() - 6);
     
     filteredExams = filteredExams.filter(e => {
        const d = (activeExamType === 'AYT' || activeExamType === 'YDT') && e.examType === 'YKS' ? (e.aytDate || e.date) : e.date;
        return new Date(d) >= cutoffDate;
     });
  }`;
examsFile = examsFile.replace(dateFilterRegex, newDateFilter);

examsFile = examsFile.replaceAll(
  `let dateLabel = exam.date;
         dateLabel = new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });`,
  `const d = (activeExamType === 'AYT' || activeExamType === 'YDT') && exam.examType === 'YKS' ? (exam.aytDate || exam.date) : exam.date;
         let dateLabel = d;
         dateLabel = new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });`
);

// For the other occurrence in StudentExams.tsx
examsFile = examsFile.replaceAll(
  `let dateLabel = exam.date;
          dateLabel = new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });`,
  `const d = (activeExamType === 'AYT' || activeExamType === 'YDT') && exam.examType === 'YKS' ? (exam.aytDate || exam.date) : exam.date;
          let dateLabel = d;
          dateLabel = new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });`
);

fs.writeFileSync('src/pages/coach/StudentExams.tsx', examsFile);

console.log("Updated Coach files.");
