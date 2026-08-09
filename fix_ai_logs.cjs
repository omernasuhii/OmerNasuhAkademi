const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const strictRule = `

ÖNEMLİ: Araç (function) çağırırken veya bir aracın sonucunu aldıktan sonra KESİNLİKLE kullanıcıya "Sistem: ... aracı çağrılıyor" veya "[Sistem: ...]" gibi teknik loglar, bildirimler YAZMA. Sadece doğal ve insan gibi bir dille yanıt ver.`;

// 1. Student Assistant
content = content.replace(
  "Kısa ve öz, cesaretlendirici cevaplar ver. Asla gereksiz bilgi yüklemesi yapma, bir rehber gibi yaklaş.`;",
  "Kısa ve öz, cesaretlendirici cevaplar ver. Asla gereksiz bilgi yüklemesi yapma, bir rehber gibi yaklaş." + strictRule + "`;"
);

// 2. Parent Assistant
content = content.replace(
  "Sadece rapor metnini yaz, ek açıklama yapma.`;",
  "Sadece rapor metnini yaz, ek açıklama yapma." + strictRule + "`;"
);
content = content.replace(
  "Veliye karşı her zaman saygılı, net ve çözüm odaklı ol.`;",
  "Veliye karşı her zaman saygılı, net ve çözüm odaklı ol." + strictRule + "`;"
);

// 3. Coach Assistant
content = content.replace(
  "Sana sorulan soruları yanıtlarken 'get_coach_students_data' aracını kullanarak koça ait öğrencilerin detaylı bilgilerini (kitaplar, sınavlar, analizler, randevular) çekebilirsin.`;",
  "Sana sorulan soruları yanıtlarken 'get_coach_students_data' aracını kullanarak koça ait öğrencilerin detaylı bilgilerini (kitaplar, sınavlar, analizler, randevular) çekebilirsin." + strictRule + "`;"
);


fs.writeFileSync('server.ts', content);
