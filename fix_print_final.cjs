const fs = require('fs');
const file = 'src/components/tercih/PrintablePreferenceView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace table header
content = content.replace(
  '<th className="py-2.5 px-3 text-center font-bold w-28">2026 Kontenjan (Fark)</th>',
  '<th className="py-2.5 px-3 text-center font-bold w-24">2026 Kontenjan</th>'
);

// Replace the table body block for quota
content = content.replace(
  /\<td className="py-2\.5 px-3 text-center text-slate-300 print:text-black font-medium"\>\s*\{dept \?\s*\(\s*\(\(\) \=\> \{\s*const \{ q2026, q2025, diff \} = getQuotaInfo\(dept\);[\s\S]*?return "-";\s*\}\)\(\)\s*\) : "-"\}\s*\<\/td\>/,
  `<td className="py-2.5 px-3 text-center text-slate-300 print:text-black font-medium">
                      {dept ? (
                        (() => {
                          const { q2026 } = getQuotaInfo(dept);
                          if (q2026 !== null && q2026 !== undefined) {
                            return <span className="font-semibold">{q2026}</span>;
                          }
                          return "-";
                        })()
                      ) : "-"}
                    </td>`
);

// Update marketing message at the bottom
content = content.replace(
  /<div className="pt-6 border-t border-white\/10 print:border-slate-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 print:text-slate-700">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>,\s*document\.body\s*\);\s*\};/g,
  `<div className="pt-6 mt-8 border-t border-white/10 print:border-slate-300 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400 print:text-slate-600">
            <div className="space-y-1 max-w-xl">
              <p className="font-bold text-slate-300 print:text-slate-800">
                * ÖSYM YKS Tercih Rehberliği Bilgilendirmesi:
              </p>
              <p className="text-[10px] print:text-[11px] leading-relaxed">
                Bu belge FocusON Akademi Tercih Robotu tarafından bilgilendirme amacıyla hazırlanmıştır. Resmi tercih bildirim işleminizi ÖSYM Aday İşlemleri Sistemi (https://ais.osym.gov.tr) üzerinden onaylamayı unutmayınız.
              </p>
            </div>
            <div className="text-right text-[10px] print:text-[11px] font-medium text-slate-500 print:text-slate-600 shrink-0 space-y-0.5">
              <p>FocusON Akademi Tercih Sistemi</p>
              <p className="text-blue-400 print:text-blue-600 font-bold">omernasuhakademi.com</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/40 to-slate-900 print:from-blue-50 print:to-slate-50 rounded-xl p-5 border border-blue-500/20 print:border-blue-200 shadow-sm print:shadow-inner mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="bg-blue-500/20 print:bg-blue-100 p-3 rounded-xl shrink-0">
                <GraduationCap className="w-8 h-8 text-blue-400 print:text-blue-600" />
              </div>
              <div className="space-y-1.5 flex-1">
                <h3 className="text-sm font-bold text-white print:text-slate-900">Sen de FocusON Akademi Ailesine Katıl! 🚀</h3>
                <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                  YKS hazırlık sürecinde yapay zeka destekli analizler, kişiselleştirilmiş programlar ve deneme takip sistemiyle bir adım öne geç. Koçun varsa, FocusON Akademi sistemini kullanarak sürecini çok daha profesyonel yönetmesini isteyebilirsin.
                </p>
              </div>
              <div className="shrink-0 pt-2 sm:pt-0">
                <a href="https://omernasuhakademi.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-4 py-2 bg-blue-500 hover:bg-blue-600 print:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors shadow-md">
                  Sistemi Keşfet
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};`
);

fs.writeFileSync(file, content);
console.log('Done!');
