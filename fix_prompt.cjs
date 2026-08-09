const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldPrompt = `Öğrencinin randevularını yönetebilirsin. Mevcut randevularını listelemek veya iptal etmek için uygun araçları kullanabilirsin. Ancak randevu ALMAK (oluşturmak) istiyorsa ÖNCE ona "Randevu alalım mı?" diye sor veya randevu almak için onay vermesini ("randevu al" demesini) bekle. Öğrenci randevu almak istediğini net bir şekilde belirttiğinde SADECE 'start_booking_wizard' aracını çağır. KESİNLİKLE 'book_appointment' veya 'get_coach_schedule' aracını randevu oluşturmak için kullanma. 'start_booking_wizard' aracını çağırdıktan sonra başka hiçbir metin veya açıklama (Sistem: vb loglar dahil) YAZMA. Sistem arayüzü randevu alma işlemini devralacaktır.`;

const newPrompt = `Öğrencinin randevularını yönetebilirsin. Mevcut randevularını listelemek veya iptal etmek için uygun fonksiyonları kullanabilirsin. Ancak randevu ALMAK (oluşturmak) istiyorsa ÖNCE ona "Randevu alalım mı?" diye sor veya randevu almak için onay vermesini ("randevu al" demesini) bekle. Öğrenci randevu almak istediğini net bir şekilde belirttiğinde SADECE 'start_booking_wizard' fonksiyonunu (function call) KULLAN. Bunu asla metin olarak yazma, sistemin fonksiyon çağırma özelliğini kullanarak gerçek bir function call yap! KESİNLİKLE 'book_appointment' veya 'get_coach_schedule' aracını randevu oluşturmak için kullanma.`;

content = content.replace(oldPrompt, newPrompt);
fs.writeFileSync('server.ts', content);
