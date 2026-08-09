const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldLoop = `        for (const fc of data.functionCalls) {
          const result = await executeFunction(fc.name, fc.args, hasWizard ? updatedHistory : undefined);
          if (!hasWizard) {
              updatedHistory.push({
                id: fc.id || generateId(),
                role: 'function' as const,
                name: fc.name,
                functionResponse: result
              });
          }
        }`;

const newLoop = `        let wizardTriggered = false;
        for (const fc of data.functionCalls) {
          if (fc.name === 'start_booking_wizard') {
             if (wizardTriggered) continue;
             wizardTriggered = true;
          }
          const result = await executeFunction(fc.name, fc.args, hasWizard ? updatedHistory : undefined);
          if (!hasWizard) {
              updatedHistory.push({
                id: fc.id || generateId(),
                role: 'function' as const,
                name: fc.name,
                functionResponse: result
              });
          }
        }`;

content = content.replace(oldLoop, newLoop);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
