import fs from 'fs';

function parseCSV(content) {
    let i = 0;
    const rows = [];
    while (i < content.length) {
        const row = [];
        let inQuotes = false;
        let p = i;
        while (p < content.length) {
            if (content[p] === '"') {
                inQuotes = !inQuotes;
            } else if (content[p] === ',' && !inQuotes) {
                row.push(content.substring(i, p));
                i = p + 1;
                p = i;
                continue;
            } else if ((content[p] === '\n' || content[p] === '\r') && !inQuotes) {
                row.push(content.substring(i, p));
                if (content[p] === '\r' && content[p+1] === '\n') p++;
                i = p + 1;
                break;
            }
            p++;
        }
        if (p === content.length && i < content.length) {
            row.push(content.substring(i, p));
            i = p;
        }
        rows.push(row);
    }
    return rows.map(r => r.map(c => {
        let text = c.replace(/^"|"$/g, '').trim();
        text = text.replace(/\n\s*/g, ' ');
        return text;
    }));
}

const csv = fs.readFileSync('curriculum.csv', 'utf8');
const rows = parseCSV(csv);
const headers = rows[0];

const curriculum = {};
headers.forEach((h, i) => {
    if (i === 0) return; // skip 'S'
    const col = rows.slice(1).map(r => r[i]).filter(x => x && x !== '');
    if (col.length > 0) {
        curriculum[h] = col;
    }
});

let curriculumContent = `export const CURRICULUM: Record<string, string[]> = {\n`;
for (const [key, val] of Object.entries(curriculum)) {
    curriculumContent += `  '${key}': [\n    `;
    curriculumContent += (val as string[]).map(v => `"${v}"`).join(', ');
    curriculumContent += `\n  ],\n`;
}
curriculumContent += `};\n`;

fs.writeFileSync('src/constants/curriculum.ts', curriculumContent);
console.log('Written curriculum.ts');

const branchConfigContent = `export const BRANCH_CONFIG = {
    SAY: {
        name: "Sayısal",
        subjects: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Türkçe', 'Tarih', 'Coğrafya', 'Geometri'],
        aytSubjects: ['AYT Fizik', 'AYT Kimya', 'AYT Biyoloji', 'AYT Matematik']
    },
    EA: {
        name: "Eşit Ağırlık",
        subjects: ['Matematik', 'Türkçe', 'Tarih', 'Coğrafya', 'Geometri', 'Felsefe', 'Edebiyat'],
        aytSubjects: ['Edebiyat', 'AYT Tarih', 'AYT Coğrafya', 'AYT Matematik']
    },
    SÖZ: {
        name: "Sözel",
        subjects: ['Türkçe', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'Edebiyat'],
        aytSubjects: ['Edebiyat', 'AYT Tarih', 'AYT Coğrafya', 'AYT Felsefe']
    },
    DİL: {
        name: "Dil",
        subjects: ['Türkçe', 'İngilizce', 'Tarih', 'Coğrafya'],
        aytSubjects: ['Grammar', 'Vocabulary', 'Reading', 'Skills Questions', 'Word Memorize']
    },
    TYT: {
        name: "TYT",
        subjects: ['Türkçe', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Paragraf', 'Problem'],
        aytSubjects: []
    }
};
`;

fs.writeFileSync('src/constants/branchConfig.ts', branchConfigContent);
console.log('Written branchConfig.ts');
