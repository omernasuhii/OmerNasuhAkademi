const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldProcess = `      if (data.functionCalls && data.functionCalls.length > 0) {
        const updatedHistory = [...historyToProcess, {
          id: generateId(),
          role: 'model' as const,
          functionCalls: data.functionCalls,
          content: data.text
        }];
        setMessages(updatedHistory);
        
        let hasWizard = false;
        for (const fc of data.functionCalls) {
          if (fc.name === 'start_booking_wizard') hasWizard = true;
          const result = await executeFunction(fc.name, fc.args, hasWizard ? updatedHistory : undefined);
          if (!hasWizard) {
              updatedHistory.push({
                id: fc.id || generateId(),
                role: 'function' as const,
                name: fc.name,
                functionResponse: result
              });
          }
        }
        
        if (!hasWizard) {
            setMessages([...updatedHistory]);
            await processResponse(updatedHistory);
        }
        return;
      }`;

const newProcess = `      if (data.functionCalls && data.functionCalls.length > 0) {
        let hasWizard = data.functionCalls.some(fc => fc.name === 'start_booking_wizard');
        
        // Temizlenmiş text - gereksiz sistem loglarını gizle
        let cleanText = data.text;
        if (cleanText) {
           cleanText = cleanText.replace(/\\[?Sistem:.*?\\]?/g, '').trim();
        }

        const modelMessageId = generateId();
        const updatedHistory = [...historyToProcess];
        
        // Eğer sadece wizard varsa ve metin yoksa boş baloncuk göstermemek için içeriği kontrol et
        if (cleanText || !hasWizard) {
          updatedHistory.push({
            id: modelMessageId,
            role: 'model' as const,
            functionCalls: data.functionCalls,
            content: cleanText
          });
        }

        if (!hasWizard) {
          setMessages([...updatedHistory]);
        }
        
        for (const fc of data.functionCalls) {
          const result = await executeFunction(fc.name, fc.args, hasWizard ? updatedHistory : undefined);
          if (!hasWizard) {
              updatedHistory.push({
                id: fc.id || generateId(),
                role: 'function' as const,
                name: fc.name,
                functionResponse: result
              });
          }
        }
        
        if (!hasWizard) {
            setMessages([...updatedHistory]);
            await processResponse(updatedHistory);
        }
        return;
      }`;

content = content.replace(oldProcess, newProcess);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
