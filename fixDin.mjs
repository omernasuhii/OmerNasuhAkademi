import fs from 'fs';
let content = fs.readFileSync('src/pages/students/QuestionAnalysis.tsx', 'utf8');

const dinAyt = `ayt: {
      totalQuestions: 6,
      topics: [
        { name: "İslam ve Bilim", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Anadolu'da İslam", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslam Düşüncesinde Yorumlar", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Dinler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslam Ahlakı", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] }
      ]
    }`;

// Din is at the very end of the QUESTION_DATA array, so it ends with:
// ] } }
// ];

content = content.replace("    ] } }\n];", "    ] } },\n    " + dinAyt + "\n  }\n];");

fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', content);
