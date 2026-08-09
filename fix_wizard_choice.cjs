const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldHandleChoice = `  const handleWizardChoice = async (msgId: string, option: {label: string, value: any}) => {
    // Mark answered
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, interactiveAnswered: true } : m));
    
    // Add user response
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: option.label }]);

    const s = wizardState;
    if (s.step === 1) {
      setWizardState(prev => ({ ...prev, type: option.value, step: 2 }));
      const filtered = s.availableServices.filter(srv => srv.type === option.value);
      const nextOptions = filtered.map(srv => ({ label: srv.title, value: srv }));
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: nextOptions.length > 0 ? "Hangi hizmeti almak istersin?" : "Bu kategoride hizmet bulunamadı. Lütfen daha sonra tekrar dene.",
          interactiveOptions: nextOptions.length > 0 ? nextOptions : undefined
      }]);
      if(nextOptions.length === 0) setWizardState(prev => ({ ...prev, isActive: false }));
    } 
    else if (s.step === 2) {`;

const newHandleChoice = `  const handleWizardChoice = async (msgId: string, option: {label: string, value: any}) => {
    // Mark answered
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, interactiveAnswered: true } : m));
    
    // Add user response
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: option.label }]);

    if (option.value === 'cancel') {
      setWizardState(prev => ({ ...prev, isActive: false }));
      setMessages(prev => [...prev, { id: generateId(), role: 'model', content: "Randevu işlemi iptal edildi." }]);
      return;
    }

    const s = wizardState;
    if (s.step === 1) {
      setWizardState(prev => ({ ...prev, type: option.value, step: 2 }));
      const filtered = s.availableServices.filter(srv => srv.type === option.value);
      const nextOptions = filtered.map(srv => ({ label: srv.title, value: srv }));
      
      if (nextOptions.length > 0) nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });

      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: nextOptions.length > 0 ? "Hangi hizmeti almak istersin?" : "Bu kategoride hizmet bulunamadı. Lütfen daha sonra tekrar dene.",
          interactiveOptions: nextOptions.length > 0 ? nextOptions : undefined
      }]);
      if(nextOptions.length === 0) setWizardState(prev => ({ ...prev, isActive: false }));
    } 
    else if (s.step === 2) {`;

content = content.replace(oldHandleChoice, newHandleChoice);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
