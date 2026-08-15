const fs = require('fs');
let content = fs.readFileSync('src/pages/admin/AdminInbox.tsx', 'utf8');

const regexToRemoveCard = /\{\/\* OTOMATİK PAZARTESİ 10:00 HAFTALIK RAPOR SİSTEMİ KARTI \*\/\}[\s\S]*?\{\/\* SADECE 1 ÖĞRENCİDE TEST ETME PANELDEN KONTROL KUTUSU \*\/\}/;
content = content.replace(regexToRemoveCard, '{/* SADECE 1 ÖĞRENCİDE TEST ETME PANELDEN KONTROL KUTUSU */}');

fs.writeFileSync('src/pages/admin/AdminInbox.tsx', content);
