const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldFallback = `      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        content: data.text || 'Bir hata oluştu.'
      }]);`;

const newFallback = `      let fallbackContent = data.text || '';
      const lowerContent = fallbackContent.toLowerCase();
      if (lowerContent.includes('start_booking_wizard') || lowerContent.includes('aracı çağrılıyor')) {
         // Model hallucinated the function call as text
         fallbackContent = fallbackContent.split('\\n').filter(line => !line.toLowerCase().includes('sistem:') && !line.toLowerCase().includes('aracı çağrılıyor') && !line.toLowerCase().includes('start_booking_wizard')).join('\\n').trim();
         
         const newMsg = {
           id: generateId(),
           role: 'model',
           content: fallbackContent || 'Randevu asistanı başlatılıyor...'
         };
         
         setMessages(prev => {
            const next = [...prev, newMsg];
            // Start wizard manually since model failed to call function
            setTimeout(() => {
                startWizardFlow(next);
            }, 100);
            return next;
         });
         return;
      }

      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        content: fallbackContent || 'Bir hata oluştu.'
      }]);`;

content = content.replace(oldFallback, newFallback);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
