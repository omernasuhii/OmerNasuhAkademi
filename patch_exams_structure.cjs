const fs = require('fs');
let content = fs.readFileSync('src/pages/student/Exams.tsx', 'utf8');

const araSinifCategories = `
    {
      category: "9. Sınıf Denemeleri",
      exams: [
        { name: "Türk Dili ve Edebiyatı (9. Sınıf)", max: 30 },
        { name: "Tarih (9. Sınıf)", max: 15 },
        { name: "Coğrafya (9. Sınıf)", max: 15 },
        { name: "Din Kültürü (9. Sınıf)", max: 10 },
        { name: "Matematik (9. Sınıf)", max: 30 },
        { name: "Fizik (9. Sınıf)", max: 10 },
        { name: "Kimya (9. Sınıf)", max: 10 },
        { name: "Biyoloji (9. Sınıf)", max: 10 },
      ],
    },
    {
      category: "10. Sınıf Denemeleri",
      exams: [
        { name: "Türk Dili ve Edebiyatı (10. Sınıf)", max: 30 },
        { name: "Tarih (10. Sınıf)", max: 15 },
        { name: "Coğrafya (10. Sınıf)", max: 15 },
        { name: "Din Kültürü (10. Sınıf)", max: 10 },
        { name: "Matematik (10. Sınıf)", max: 30 },
        { name: "Fizik (10. Sınıf)", max: 10 },
        { name: "Kimya (10. Sınıf)", max: 10 },
        { name: "Biyoloji (10. Sınıf)", max: 10 },
      ],
    },
    {
      category: "11. Sınıf Denemeleri",
      exams: [
        { name: "Türk Dili ve Edebiyatı (11. Sınıf)", max: 30 },
        { name: "Tarih (11. Sınıf)", max: 15 },
        { name: "Coğrafya (11. Sınıf)", max: 15 },
        { name: "Din Kültürü (11. Sınıf)", max: 10 },
        { name: "Matematik (11. Sınıf)", max: 30 },
        { name: "Fizik (11. Sınıf)", max: 10 },
        { name: "Kimya (11. Sınıf)", max: 10 },
        { name: "Biyoloji (11. Sınıf)", max: 10 },
      ],
    },
`;

content = content.replace('category: "YDT Denemeleri",', araSinifCategories + '\n    {\n      category: "YDT Denemeleri",');

const araSinifStructure = `
    "9. Sınıf": [
      { category: "Türk Dili ve Edebiyatı", fields: [{ name: "Türk Dili ve Edebiyatı (9. Sınıf)", max: 30 }] },
      { category: "Sosyal Bilimler", fields: [{ name: "Tarih (9. Sınıf)", max: 15 }, { name: "Coğrafya (9. Sınıf)", max: 15 }, { name: "Din Kültürü (9. Sınıf)", max: 10 }] },
      { category: "Matematik", fields: [{ name: "Matematik (9. Sınıf)", max: 30 }] },
      { category: "Fen Bilimleri", fields: [{ name: "Fizik (9. Sınıf)", max: 10 }, { name: "Kimya (9. Sınıf)", max: 10 }, { name: "Biyoloji (9. Sınıf)", max: 10 }] }
    ],
    "10. Sınıf": [
      { category: "Türk Dili ve Edebiyatı", fields: [{ name: "Türk Dili ve Edebiyatı (10. Sınıf)", max: 30 }] },
      { category: "Sosyal Bilimler", fields: [{ name: "Tarih (10. Sınıf)", max: 15 }, { name: "Coğrafya (10. Sınıf)", max: 15 }, { name: "Din Kültürü (10. Sınıf)", max: 10 }] },
      { category: "Matematik", fields: [{ name: "Matematik (10. Sınıf)", max: 30 }] },
      { category: "Fen Bilimleri", fields: [{ name: "Fizik (10. Sınıf)", max: 10 }, { name: "Kimya (10. Sınıf)", max: 10 }, { name: "Biyoloji (10. Sınıf)", max: 10 }] }
    ],
    "11. Sınıf": [
      { category: "Türk Dili ve Edebiyatı", fields: [{ name: "Türk Dili ve Edebiyatı (11. Sınıf)", max: 30 }] },
      { category: "Sosyal Bilimler", fields: [{ name: "Tarih (11. Sınıf)", max: 15 }, { name: "Coğrafya (11. Sınıf)", max: 15 }, { name: "Din Kültürü (11. Sınıf)", max: 10 }] },
      { category: "Matematik", fields: [{ name: "Matematik (11. Sınıf)", max: 30 }] },
      { category: "Fen Bilimleri", fields: [{ name: "Fizik (11. Sınıf)", max: 10 }, { name: "Kimya (11. Sınıf)", max: 10 }, { name: "Biyoloji (11. Sınıf)", max: 10 }] }
    ],
`;

content = content.replace('YKS: [', araSinifStructure + '\n    YKS: [');

// Now handle tabs
content = content.replace(
  `{["YKS", "TYT", "AYT", "YDT", "BRANŞ"].map((tab) => (`,
  `{((["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(studentProfile?.grade)) ? [studentProfile?.grade, "TYT", "BRANŞ"] : ["YKS", "TYT", "AYT", "YDT", "BRANŞ"]).map((tab) => (`
);

content = content.replace(
  `const [activeTab, setActiveTab] = useState("YKS");`,
  `const [activeTab, setActiveTab] = useState("YKS");\n  const isAraSinif = ["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(studentProfile?.grade || "");\n  const studentGrade = studentProfile?.grade || "9. Sınıf";\n  useEffect(() => {\n    if (isAraSinif && ["YKS", "AYT", "YDT"].includes(activeTab)) {\n      setActiveTab(studentGrade);\n    }\n  }, [isAraSinif, studentGrade, activeTab]);`
);

content = content.replace(
  `<option value="TYT">TYT</option>
                      <option value="AYT">AYT</option>
                      <option value="YDT">YDT</option>
                      <option value="YKS">YKS (TYT + AYT)</option>`,
  `{isAraSinif && <option value={studentGrade}>{studentGrade}</option>}\n                      <option value="TYT">TYT</option>\n                      {!isAraSinif && <option value="AYT">AYT</option>}\n                      {!isAraSinif && <option value="YDT">YDT</option>}\n                      {!isAraSinif && <option value="YKS">YKS (TYT + AYT)</option>}`
);

fs.writeFileSync('src/pages/student/Exams.tsx', content);
