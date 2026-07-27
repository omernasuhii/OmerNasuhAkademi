const fs = require('fs');
const file = 'src/components/tercih/PrintablePreferenceView.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>,\s*document\.body/g,
  `</p>
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
    document.body`
);

fs.writeFileSync(file, content);
console.log('Done!');
