const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const strictRule = `

ÖNEMLİ: Araç (function) çağırırken veya bir aracın sonucunu aldıktan sonra KESİNLİKLE kullanıcıya "Sistem: ... aracı çağrılıyor" veya "[Sistem: ...]" gibi teknik loglar, bildirimler YAZMA. Sadece doğal ve insan gibi bir dille yanıt ver.`;

content = content.replace(
  "Kısa, öz ve anlaşılır cevaplar ver.`;",
  "Kısa, öz ve anlaşılır cevaplar ver." + strictRule + "`;"
);

fs.writeFileSync('server.ts', content);
