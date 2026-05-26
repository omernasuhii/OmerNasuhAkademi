import fs from 'fs';

const aytMap = {
  'matematik': {
      totalQuestions: 40,
      topics: [
        { name: "Polinomlar", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "2. Dereceden Denklemler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 0 }, { year: "2021", count: 1 }] },
        { name: "Karmaşık Sayılar", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Eşitsizlikler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Parabol", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Logaritma", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 1 }] },
        { name: "Diziler", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Trigonometri", data: [{ year: "2025", count: 4 }, { year: "2024", count: 4 }, { year: "2023", count: 5 }, { year: "2022", count: 4 }, { year: "2021", count: 4 }] },
        { name: "Limit ve Süreklilik", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 0 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Türev", data: [{ year: "2025", count: 4 }, { year: "2024", count: 4 }, { year: "2023", count: 0 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "İntegral", data: [{ year: "2025", count: 4 }, { year: "2024", count: 4 }, { year: "2023", count: 0 }, { year: "2022", count: 4 }, { year: "2021", count: 4 }] }
      ]
    },
  'turkce': {
      totalQuestions: 24,
      topics: [
        { name: "Edebiyat Akımları", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Şiir Bilgisi", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "İslamiyet Öncesi ve Geçiş", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Halk Edebiyatı", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Divan Edebiyatı", data: [{ year: "2025", count: 4 }, { year: "2024", count: 5 }, { year: "2023", count: 5 }, { year: "2022", count: 4 }, { year: "2021", count: 5 }] },
        { name: "Tanzimat Edebiyatı", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 1 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Servetifünun ve Fecriati", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Milli Edebiyat", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Cumhuriyet Dönemi", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 0 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Paragraf / Anlam", data: [{ year: "2025", count: 6 }, { year: "2024", count: 5 }, { year: "2023", count: 6 }, { year: "2022", count: 6 }, { year: "2021", count: 6 }] }
      ]
    },
  'fizik': {
      totalQuestions: 14,
      topics: [
        { name: "Vektörler ve Bağıl Hareket", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Newton Hareket Yasaları", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Atışlar ve Enerji", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "İtme ve Momentum", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Elektriksel Kuvvet ve Alan", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Manyetizma", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 1 }] },
        { name: "Çembersel Hareket", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Basit Harmonik Hareket", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Dalga Mekaniği", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Modern Fizik", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 0 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] }
      ]
    },
  'geometri': {
      totalQuestions: 10,
      topics: [
        { name: "Trigonometri", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 4 }, { year: "2022", count: 4 }, { year: "2021", count: 4 }] },
        { name: "Analitik Geometri", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Çember ve Daire", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 1 }, { year: "2021", count: 2 }] },
        { name: "Katı Cisimler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Dönüşümler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 0 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] }
      ]
    },
  'kimya': {
      totalQuestions: 13,
      topics: [
        { name: "Modern Atom Teorisi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Gazlar", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Sıvı Çözeltiler", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 1 }] },
        { name: "Kimyasal Enerji", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Kinetik (Hız)", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Kimyasal Denge", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 1 }, { year: "2021", count: 2 }] },
        { name: "Elektrokimya", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 3 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Organik Kimya", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 2 }, { year: "2022", count: 4 }, { year: "2021", count: 4 }] }
      ]
    },
  'biyoloji': {
      totalQuestions: 13,
      topics: [
        { name: "Sinir Sistemi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Endokrin Sistem", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Duyu Organları", data: [{ year: "2025", count: 0 }, { year: "2024", count: 0 }, { year: "2023", count: 1 }, { year: "2022", count: 0 }, { year: "2021", count: 0 }] },
        { name: "Destek ve Hareket", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Sindirim Sistemi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Dolaşım Sistemi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Solunum Sistemi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Boşaltım Sistemi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Üreme Sistemi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Genden Proteine", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Hücresel Solunum", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Fotosentez / Kemosentez", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Bitki Biyolojisi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 0 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] }
      ]
    },
  'tarih': {
      totalQuestions: 21,
      topics: [
        { name: "Tarih Bilimi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İlk Çağ Medeniyetleri", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslamiyet Öncesi Türk Tarihi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslam Tarihi", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Türk İslam Devletleri", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Osmanlı Siyasi (Kuruluş-Yükselme)", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Osmanlı Siyasi (Duraklama-Gerileme)", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Osmanlı Dağılma / XX. YY", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Milli Mücadele Dönemi", data: [{ year: "2025", count: 4 }, { year: "2024", count: 4 }, { year: "2023", count: 4 }, { year: "2022", count: 4 }, { year: "2021", count: 4 }] },
        { name: "Atatürk İlkeleri ve İnkılaplar", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Çağdaş Türk ve Dünya Tarihi", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] }
      ]
    },
  'cografya': {
      totalQuestions: 17,
      topics: [
        { name: "Ekstrem Doğa Olayları", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Ekosistem ve Madde Döngüsü", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Nüfus Politikaları", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Türkiye Ekonomi ve Tarım", data: [{ year: "2025", count: 4 }, { year: "2024", count: 4 }, { year: "2023", count: 4 }, { year: "2022", count: 4 }, { year: "2021", count: 4 }] },
        { name: "Küresel ve Bölgesel Örgütler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Ülkeler Coğrafyası", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] },
        { name: "Çevre Sorunları", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] }
      ]
    },
  'felsefe': {
      totalQuestions: 12,
      topics: [
        { name: "Mantık", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Psikoloji", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Sosyoloji", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Felsefe Tarihi", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] }
      ]
    },
  'din': {
      totalQuestions: 6,
      topics: [
        { name: "İslam ve Bilim", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Anadolu'da İslam", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslam Düşüncesinde Yorumlar", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Dinler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslam Ahlakı", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] }
      ]
    }
};

let content = fs.readFileSync('src/pages/students/QuestionAnalysis.tsx', 'utf8');

// The mistake is that we appended `ayt` object just floating before `] } }`.
// Wait, the syntax in `QuestionAnalysis.tsx` currently looks like:
// {
//    id: 'matematik',
//    name: 'Matematik',
//    icon: '➕',
//    tyt: {
//       ...
//    ] } },
//    ayt: {
//       ...
//    }
//  },
//
// The root cause is `] } },\n    ayt: { ... }` where `] } },` closed the `tyt` object BUT also closed the parent object and then `ayt` was just floating without a key or inside the next array element?
// No! `} },` -> `]`, `}`, `}`.
// `]` closes `topics` array.
// `}` closes `tyt` object.
// `}` closes THE ENTIRE `matematik` OBJECT!
// `,` starts the next object!
// So `ayt:` is placed inside the ARRAY, not inside `matematik`!
// What we actually need for `ayt` to be inside `matematik` is:
// `]\n    },\n    ayt: { ... }\n` (without the last `}` closing the `matematik` object).

// Let's first clean up the mess. The mess is `    ayt: { ... }` floating between array elements!

const messySegments = content.split("    ayt: {");
let newContent = messySegments[0];

// Wait, doing this via string manipulation is tricky. Let's just fix the array syntax!
// I'll just find all `    ayt: {` and push it BACK inside the object.

content = content.replace(/\n    ] \} \},\n    ayt: \{/g, '\n      ]\n    },\n    ayt: {');
content = content.replace(/\n  \}\n];/g, '\n  }\n];');

// And what about the end of the `ayt` block?
// Previously it was floating:
//    ayt: {
//        ...
//    },
//  {
//    id: 'biyoloji', ...
//
// But wait, my insertion for `ayt` ended with `}` but NO COMMA!
// Example: `+ aytMap[k] + ","`. So it ended with `},`!
// So it is:
//    ayt: {
//        ...
//    },
//  {
//
// If we just fixed the opening, we closed `tyt` with `},\n`, opened `ayt: {`, closed it with `},`, but WAIT, we need to CLOSE the main object too!
// Oh!
// Before: `] } },\n  { id: 'biyoloji' `
// After my insertion: `] } }, \n ayt: { ... } , \n { id: 'biyoloji' `
// By changing `] } }, \n ayt:` -> `]\n }, \n ayt: {`, we now have `ayt: { ... },` which is missing the closing `}` for the main object `matematik`!!!
// Yes! We need to add `}` after `ayt: { ... }` !!

// So if my insertion was `+ aytMap[k] + ','`, it produced `ayt: { ... },`.
// We should replace `] } },\n    ayt: {` with `] } },\n  ayt: {` NO!
// We should replace `] } },\n    ayt: {` with `\n      ]\n    },\n    ayt: {`
// And we should find the end of `ayt`'s `] }` (which was `] }` from my string literal!) and make it `] }\n  },`!

// Let's use robust regex to parse out exactly what we need, or just dump the whole array and require it.
// I can just replace the WHOLE QUESTION_DATA array using a regex match from `const QUESTION_DATA = [` up to `];\n`.

// I will extract the `tyt` parts, and combine them with `ayt` parts!

let match = content.match(/const QUESTION_DATA: SubjectAnalysis\[\] = \[([\s\S]*?)\];\n/);
if (match) {
  let arrayStr = match[1];
  // extract each subject block
  
  let subjects = ['matematik', 'turkce', 'fizik', 'geometri', 'kimya', 'biyoloji', 'tarih', 'cografya', 'felsefe', 'din'];
  
  let rebuilt = subjects.map(s => {
    // extract icon and name from content
    let sMatch = content.match(new RegExp("id: '" + s + "',\\s*name: '([^']+)',\\s*icon: '([^']+)',\\s*tyt: \\{\\s*totalQuestions: (\\d+),\\s*topics: \\[\(\\s*[\\s\\S]*?)\\] \\} \\}"));
    
    let nameMatch = content.match(new RegExp("id: '" + s + "',\\s*name: '([^']+)',\\s*icon: '([^']+)',\\s*tyt: \\{\\s*totalQuestions: (\\d+),\\s*topics: \\[\(\\s*(?:\\{\\s*name:[\\s\\S]*?\\}[,\\s]*)*)\\]"));
    
    if (nameMatch) {
       let block = "  {\n" +
"    id: '" + s + "',\n" +
"    name: '" + nameMatch[1] + "',\n" +
"    icon: '" + nameMatch[2] + "',\n" +
"    tyt: {\n" +
"      totalQuestions: " + nameMatch[3] + ",\n" +
"      topics: [" + nameMatch[4].trim() + "\n" +
"      ]\n" +
"    }";
       if (aytMap[s]) {
          // Serialize to JSON, then strip quotes from object keys if desired, or just leave as valid JS.
          const aytStr = JSON.stringify(aytMap[s], null, 2).replace(/"([^"]+)":/g, '$1:').split('\\n').map((l, i) => i === 0 ? l : '    ' + l).join('\\n');
          block += ",\n    ayt: " + aytStr;
       }
       block += "\n  }";
       return block;
    }
    return '';
  }).join(',\n');
  
  content = content.replace(match[0], 'const QUESTION_DATA: SubjectAnalysis[] = [\n' + rebuilt + '\n];\n');
  
  fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', content);
}
