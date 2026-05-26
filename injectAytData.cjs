const fs = require('fs');

let content = fs.readFileSync('src/pages/students/QuestionAnalysis.tsx', 'utf8');

// Replace the interface
content = content.replace(`interface SubjectAnalysis {
  id: string;
  name: string;
  icon: string;
  totalQuestions: number;
  topics: TopicAnalysis[];
}`, `interface ExamData {
  totalQuestions: number;
  topics: TopicAnalysis[];
}

interface SubjectAnalysis {
  id: string;
  name: string;
  icon: string;
  tyt?: ExamData;
  ayt?: ExamData;
}`);

// Replace TYT structure
content = content.replace(/totalQuestions: (\d+),\n\s+topics: \[/g, "tyt: {\n      totalQuestions: $1,\n      topics: [");

content = content.replace(/\]\n  \},/g, "] } },");
content = content.replace(/\]\n  \}\n\];/g, "] } }\n];");

// Now we need to inject AYT data into each subject.
// I'll do this by matching the `id: '...',` and adding the AYT content right after `tyt: { ... }` or before the closing `}` of the object.

const aytMap = {
  'matematik': `ayt: {
      totalQuestions: 40,
      topics: [
        { name: 'Polinomlar', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: '2. Dereceden Denklemler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 0 }, { year: '2021', count: 1 }] },
        { name: 'Karmaşık Sayılar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Eşitsizlikler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Parabol', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Logaritma', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 1 }] },
        { name: 'Diziler', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Trigonometri', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 5 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Limit ve Süreklilik', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 0 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Türev', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 0 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'İntegral', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 0 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] }
      ]
    }`,
  'turkce': `ayt: {
      totalQuestions: 24,
      topics: [
        { name: 'Edebiyat Akımları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Şiir Bilgisi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'İslamiyet Öncesi ve Geçiş', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Halk Edebiyatı', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Divan Edebiyatı', data: [{ year: '2025', count: 4 }, { year: '2024', count: 5 }, { year: '2023', count: 5 }, { year: '2022', count: 4 }, { year: '2021', count: 5 }] },
        { name: 'Tanzimat Edebiyatı', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 1 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Servetifünun ve Fecriati', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Milli Edebiyat', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Cumhuriyet Dönemi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 0 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Paragraf / Anlam', data: [{ year: '2025', count: 6 }, { year: '2024', count: 5 }, { year: '2023', count: 6 }, { year: '2022', count: 6 }, { year: '2021', count: 6 }] }
      ]
    }`,
  'fizik': `ayt: {
      totalQuestions: 14,
      topics: [
        { name: 'Vektörler ve Bağıl Hareket', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Newton Hareket Yasaları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Atışlar ve Enerji', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'İtme ve Momentum', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Elektriksel Kuvvet ve Alan', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Manyetizma', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 1 }] },
        { name: 'Çembersel Hareket', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Basit Harmonik Hareket', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dalga Mekaniği', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Modern Fizik', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 0 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] }
      ]
    }`,
  'geometri': `ayt: {
      totalQuestions: 10,
      topics: [
        { name: 'Trigonometri', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 4 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Analitik Geometri', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Çember ve Daire', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 2 }] },
        { name: 'Katı Cisimler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dönüşümler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    }`,
  'kimya': `ayt: {
      totalQuestions: 13,
      topics: [
        { name: 'Modern Atom Teorisi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Gazlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Sıvı Çözeltiler', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 1 }] },
        { name: 'Kimyasal Enerji', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kinetik (Hız)', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kimyasal Denge', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 2 }] },
        { name: 'Elektrokimya', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 3 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Organik Kimya', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 2 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] }
      ]
    }`,
  'biyoloji': `ayt: {
      totalQuestions: 13,
      topics: [
        { name: 'Sinir Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Endokrin Sistem', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Duyu Organları', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 1 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'Destek ve Hareket', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Sindirim Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dolaşım Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Solunum Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Boşaltım Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Üreme Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Genden Proteine', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Hücresel Solunum', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Fotosentez / Kemosentez', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Bitki Biyolojisi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    }`,
  'tarih': `ayt: {
      totalQuestions: 21,
      topics: [
        { name: 'Tarih Bilimi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İlk Çağ Medeniyetleri', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslamiyet Öncesi Türk Tarihi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslam Tarihi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Türk İslam Devletleri', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Osmanlı Siyasi (Kuruluş-Yükselme)', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Osmanlı Siyasi (Duraklama-Gerileme)', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Osmanlı Dağılma / XX. YY', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Milli Mücadele Dönemi', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 4 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Atatürk İlkeleri ve İnkılaplar', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Çağdaş Türk ve Dünya Tarihi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] }
      ]
    }`,
  'cografya': `ayt: {
      totalQuestions: 17,
      topics: [
        { name: 'Ekstrem Doğa Olayları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Ekosistem ve Madde Döngüsü', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Nüfus Politikaları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Türkiye Ekonomi ve Tarım', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 4 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Küresel ve Bölgesel Örgütler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Ülkeler Coğrafyası', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Çevre Sorunları', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] }
      ]
    }`,
  'felsefe': `ayt: {
      totalQuestions: 12,
      topics: [
        { name: 'Mantık', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Psikoloji', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Sosyoloji', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Felsefe Tarihi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] }
      ]
    }`,
  'din': `ayt: {
      totalQuestions: 6,
      topics: [
        { name: 'İslam ve Bilim', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Anadolu\'da İslam', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslam Düşüncesinde Yorumlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dinler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslam Ahlakı', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] }
      ]
    }`
};

Object.keys(aytMap).forEach(id => {
  const regex = new RegExp(`id: '${id}',[\\s\\S]*?tyt: {[^}]*\\}\\s*],?\\s*\\}\\s*\\}`, 'm');
  content = content.replace(regex, match => {
    return match.replace(/\} \}/, `} },\n    ${aytMap[id]}`);
  });
});

// Update the React component to use examType
content = content.replace(/const \[activeSubject, setActiveSubject\] = useState\(QUESTION_DATA\[0\].id\);/, `const [activeSubject, setActiveSubject] = useState(QUESTION_DATA[0].id);
  const [examType, setExamType] = useState<'tyt' | 'ayt'>('tyt');`);


// Inside render add toggle
const newToggleStr = `
      {/* Exam Type Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setExamType('tyt')}
          className={\`flex-1 py-4 rounded-2xl font-bold tracking-widest uppercase transition-all duration-300 border-2 \${examType === 'tyt' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'}\`}
        >
          TYT
        </button>
        <button
          onClick={() => setExamType('ayt')}
          className={\`flex-1 py-4 rounded-2xl font-bold tracking-widest uppercase transition-all duration-300 border-2 \${examType === 'ayt' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'}\`}
        >
          AYT
        </button>
      </div>
      
      {/* Subject Selector */}`;
content = content.replace(/{(\/\* Subject Selector \*\/)}/, newToggleStr);

// Table topic mapping
content = content.replace(/\{currentSubject\.topics\.map/g, "{currentSubject[examType]?.topics.map");
content = content.replace(/currentSubject\.name\} Soru Dağılımı/, "currentSubject.name} {examType === 'tyt' ? 'TYT' : 'AYT'} Soru Dağılımı");

fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', content);
