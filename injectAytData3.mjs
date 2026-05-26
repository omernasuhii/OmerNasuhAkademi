import fs from 'fs';

let content = fs.readFileSync('src/pages/students/QuestionAnalysis.tsx', 'utf8');

const aytMap = {
  'matematik': `ayt: {
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
    }`,
  'turkce': `ayt: {
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
    }`,
  'fizik': `ayt: {
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
    }`,
  'geometri': `ayt: {
      totalQuestions: 10,
      topics: [
        { name: "Trigonometri", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 4 }, { year: "2022", count: 4 }, { year: "2021", count: 4 }] },
        { name: "Analitik Geometri", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Çember ve Daire", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 1 }, { year: "2021", count: 2 }] },
        { name: "Katı Cisimler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Dönüşümler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 0 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] }
      ]
    }`,
  'kimya': `ayt: {
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
    }`,
  'biyoloji': `ayt: {
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
    }`,
  'tarih': `ayt: {
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
    }`,
  'cografya': `ayt: {
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
    }`,
  'felsefe': `ayt: {
      totalQuestions: 12,
      topics: [
        { name: "Mantık", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Psikoloji", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Sosyoloji", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] },
        { name: "Felsefe Tarihi", data: [{ year: "2025", count: 3 }, { year: "2024", count: 3 }, { year: "2023", count: 3 }, { year: "2022", count: 3 }, { year: "2021", count: 3 }] }
      ]
    }`,
  'din': `ayt: {
      totalQuestions: 6,
      topics: [
        { name: "İslam ve Bilim", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Anadolu'da İslam", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslam Düşüncesinde Yorumlar", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "Dinler", data: [{ year: "2025", count: 1 }, { year: "2024", count: 1 }, { year: "2023", count: 1 }, { year: "2022", count: 1 }, { year: "2021", count: 1 }] },
        { name: "İslam Ahlakı", data: [{ year: "2025", count: 2 }, { year: "2024", count: 2 }, { year: "2023", count: 2 }, { year: "2022", count: 2 }, { year: "2021", count: 2 }] }
      ]
    }`
};

for (const k of Object.keys(aytMap)) {
  const parts = content.split("id: '" + k + "',");
  if (parts.length === 2 && !parts[1].includes('ayt:')) {
    let tyt_segment = parts[1];
    
    const endTyt = tyt_segment.indexOf('] } },');
    const endTytAlt = tyt_segment.indexOf('] } }\\n];');
    if (endTyt !== -1) {
      tyt_segment = tyt_segment.substring(0, endTyt + 6) + '\\n    ' + aytMap[k] + ',' + tyt_segment.substring(endTyt + 6);
    } else if (endTytAlt !== -1) {
      tyt_segment = tyt_segment.substring(0, endTytAlt + 5) + ',\\n    ' + aytMap[k] + '\\n' + tyt_segment.substring(endTytAlt + 5);
    } else {
      console.log('Not found for ' + k + '!! Endings:');
      console.log(tyt_segment.slice(-50));
    }
    
    parts[1] = tyt_segment;
    content = parts.join("id: '" + k + "',");
  } else {
    // console.log("Already has ayt or parts length is wrong for " + k);
  }
}

fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', content);
