const fs = require('fs');
const path = 'src/pages/admin/ServiceManagement.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'className-[11px] text-slate-400 font-bold mt-1">Her talep admin/hoca paneline "Bekleyen" olarak düşer.',
  'className="text-[11px] text-slate-400 font-bold mt-1">Her talep admin/hoca paneline "Bekleyen" olarak düşer.'
);

fs.writeFileSync(path, content);
