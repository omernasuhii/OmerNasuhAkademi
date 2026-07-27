const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

const patch = `
      {
        const originalConsoleError = console.error;
        console.error = function(...args) {
          if (typeof args[0] === 'string' && args[0].includes('[vite]')) return;
          originalConsoleError.apply(console, args);
        };
      }
      
      {
        const originalConsoleLog = console.log;
        console.log = function(...args) {
          if (typeof args[0] === 'string' && args[0].includes('[vite]')) return;
          originalConsoleLog.apply(console, args);
        };
      }
`;

if (!content.includes('originalConsoleError = console.error')) {
  content = content.replace("window.addEventListener('error', function(e) {", patch + "\n      window.addEventListener('error', function(e) {");
  fs.writeFileSync('index.html', content);
}
