const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldStep2 = `    else if (s.step === 2) {
      const srv = option.value as Service;
      setWizardState(prev => ({ ...prev, service: srv, step: 3 }));
      
      const filtered = srv.assignedCoachIds?.length 
        ? s.availableCoaches.filter(c => srv.assignedCoachIds!.includes(c.uid))
        : s.availableCoaches;
        
      const nextOptions = filtered.map(c => ({ label: c.displayName || c.email, value: c.uid }));
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: nextOptions.length > 0 ? "Hangi eğitmenle görüşmek istersin?" : "Erişilebilir eğitmen bulunamadı.",
          interactiveOptions: nextOptions.length > 0 ? nextOptions : undefined
      }]);
      if(nextOptions.length === 0) setWizardState(prev => ({ ...prev, isActive: false }));
    }`;

const newStep2 = `    else if (s.step === 2) {
      const srv = option.value as Service;
      setWizardState(prev => ({ ...prev, service: srv, step: 3 }));
      
      const filtered = srv.assignedCoachIds?.length 
        ? s.availableCoaches.filter(c => srv.assignedCoachIds!.includes(c.uid))
        : s.availableCoaches;
        
      const nextOptions = filtered.map(c => ({ label: c.displayName || c.email, value: c.uid }));
      if (nextOptions.length > 0) nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: nextOptions.length > 0 ? "Hangi eğitmenle görüşmek istersin?" : "Erişilebilir eğitmen bulunamadı.",
          interactiveOptions: nextOptions.length > 0 ? nextOptions : undefined
      }]);
      if(nextOptions.length === 0) setWizardState(prev => ({ ...prev, isActive: false }));
    }`;

content = content.replace(oldStep2, newStep2);

const oldStep3 = `    else if (s.step === 3) {
      const coachId = option.value;
      setWizardState(prev => ({ ...prev, coachId, step: 4, isLoadingData: true }));
      
      const [schedule, appointments] = await Promise.all([
         appointmentService.getCoachSchedule(coachId),
         appointmentService.getAppointments(coachId, 'coach')
      ]);
      setWizardState(prev => ({ ...prev, schedule, appointments, isLoadingData: false }));

      const days = [];
      const today = new Date();
      for(let i=0; i<7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          days.push({ 
              label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }), 
              value: d.toISOString().split('T')[0] 
          });
      }
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Lütfen bir tarih seç:",
          interactiveOptions: days
      }]);
    }`;

const newStep3 = `    else if (s.step === 3) {
      const coachId = option.value;
      setWizardState(prev => ({ ...prev, coachId, step: 4, isLoadingData: true }));
      
      const [schedule, appointments] = await Promise.all([
         appointmentService.getCoachSchedule(coachId),
         appointmentService.getAppointments(coachId, 'coach')
      ]);
      setWizardState(prev => ({ ...prev, schedule, appointments, isLoadingData: false }));

      const days = [];
      const today = new Date();
      for(let i=0; i<7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          days.push({ 
              label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }), 
              value: d.toISOString().split('T')[0] 
          });
      }
      days.push({ label: '❌ İptal Et', value: 'cancel' });
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Lütfen bir tarih seç:",
          interactiveOptions: days
      }]);
    }`;

content = content.replace(oldStep3, newStep3);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
