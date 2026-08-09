const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldStartWizard = `  const startWizardFlow = async () => {
    setWizardState(s => ({ ...s, isActive: true, step: 1, isLoadingData: true }));
    try {
      const [svcs, coaches] = await Promise.all([
        appointmentService.getServices(),
        appointmentService.getCoaches()
      ]);
      setWizardState(s => ({ ...s, availableServices: svcs, availableCoaches: coaches, isLoadingData: false }));
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Harika, randevu işlemini başlattım! Lütfen hangi tür randevu almak istediğini seç:",
          interactiveOptions: [
              { label: 'Birebir Görüşme', value: 'one-on-one' },
              { label: 'Ders', value: 'lesson' }
          ]
      }]);
    } catch(e) {
      console.error(e);
      setWizardState(s => ({ ...s, isActive: false, isLoadingData: false }));
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Randevu seçenekleri yüklenirken bir hata oluştu."
      }]);
    }
  };`;

const newStartWizard = `  const startWizardFlow = async (currentHistory: Message[]) => {
    setWizardState(s => ({ ...s, isActive: true, step: 1, isLoadingData: true }));
    setMessages([...currentHistory]); // Commit history so far
    try {
      const [svcs, coaches] = await Promise.all([
        appointmentService.getServices(),
        appointmentService.getCoaches()
      ]);
      setWizardState(s => ({ ...s, availableServices: svcs, availableCoaches: coaches, isLoadingData: false }));
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Harika, randevu işlemini başlattım! Lütfen hangi tür randevu almak istediğini seç:",
          interactiveOptions: [
              { label: 'Birebir Görüşme', value: 'one-on-one' },
              { label: 'Ders', value: 'lesson' },
              { label: '❌ İptal Et', value: 'cancel' }
          ]
      }]);
    } catch(e) {
      console.error(e);
      setWizardState(s => ({ ...s, isActive: false, isLoadingData: false }));
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Randevu seçenekleri yüklenirken bir hata oluştu."
      }]);
    }
  };`;

content = content.replace(oldStartWizard, newStartWizard);

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
    else if (s.step === 2) {
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
    } 
    else if (s.step === 3) {
      setWizardState(prev => ({ ...prev, coachId: option.value, step: 4 }));
      // Generate next 14 days
      const days = [];
      const today = new Date();
      for(let i=0; i<14; i++) {
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
    } 
    else if (s.step === 4) {
      const dateStr = option.value;
      setWizardState(prev => ({ ...prev, date: dateStr, step: 5, isLoadingData: true }));
      
      // Get slots
      let slots: string[] = [];
      let nextAvailableSlotInfo: any = null;
      try {
        const schedule = await appointmentService.getCoachSchedule(s.coachId!);
        const currentSlotInfo = appointmentService.getAvailableSlotsForDate(schedule, dateStr);
        slots = currentSlotInfo.slots;
        
        if (slots.length === 0) {
            nextAvailableSlotInfo = appointmentService.getNextAvailableSlot(schedule, dateStr);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setWizardState(prev => ({ ...prev, isLoadingData: false }));
      }

      if (slots.length > 0) {
          const nextOptions = slots.map(h => ({ label: h, value: h }));
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: "Müsait saatlerden sana uygun olanı seç:",
              interactiveOptions: nextOptions
          }]);
      } else if (nextAvailableSlotInfo) {
          // Present the the next available slots directly
          setWizardState(prev => ({ ...prev, date: nextAvailableSlotInfo.date })); // update the date implicitly
          
          const nextOptions = nextAvailableSlotInfo.slots.map((h: string) => ({ label: \`\${nextAvailableSlotInfo.label} - \${h}\`, value: h }));
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: \`Bu tarihte uygun saat bulunamadı. En yakın müsait tarih olan \${nextAvailableSlotInfo.label} günü için şu saatleri önerebilirim:\`,
              interactiveOptions: nextOptions
          }]);
      } else {
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: "Bu tarihte uygun saat bulunamadı ve yakın zamanda da müsaitlik görünmüyor. Lütfen başka bir eğitmen dene.",
          }]);
          setWizardState(prev => ({ ...prev, isActive: false }));
      }
    }
    else if (s.step === 5) {
      const hourStr = option.value;
      setWizardState(prev => ({ ...prev, hour: hourStr, isActive: false, isLoadingData: true }));
      
      try {
        await appointmentService.bookAppointment({
            studentId: user!.uid,
            studentName: \`\${userData?.firstName || ''} \${userData?.lastName || ''}\`,
            serviceId: s.service?.id || 'wizard-booked',
            serviceType: s.type! as any,
            coachId: s.coachId!,
            date: s.date!,
            startTime: hourStr,
            status: 'pending',
            paymentStatus: 'unpaid',
            isOnline: true,
            participantCount: 1,
            location: s.service?.title
        });
        
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: \`🎉 **Randevun başarıyla oluşturuldu!**\n\n**Hizmet:** \${s.service?.title}\n**Tarih:** \${s.date} \n**Saat:** \${hourStr}\n\nBaşka bir konuda yardıma ihtiyacın var mı?\`
        }]);
      } catch(e) {
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: "Randevu kaydedilirken bir hata oluştu."
        }]);
      } finally {
        setWizardState(prev => ({ ...prev, isLoadingData: false }));
      }
    }
  };`;

const newHandleChoice = `  const handleWizardChoice = async (msgId: string, option: {label: string, value: any}) => {
    // Mark answered
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, interactiveAnswered: true } : m));
    
    // Add user response
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: option.label }]);

    if (option.value === 'cancel') {
        setWizardState(prev => ({ ...prev, isActive: false }));
        setMessages(prev => [...prev, { id: generateId(), role: 'model', content: "Randevu alma işlemi iptal edildi. Başka nasıl yardımcı olabilirim?" }]);
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
    else if (s.step === 2) {
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
    } 
    else if (s.step === 3) {
      setWizardState(prev => ({ ...prev, coachId: option.value, step: 4 }));
      // Generate next 14 days
      const days = [];
      const today = new Date();
      for(let i=0; i<14; i++) {
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
    } 
    else if (s.step === 4) {
      const dateStr = option.value;
      setWizardState(prev => ({ ...prev, date: dateStr, step: 5, isLoadingData: true }));
      
      // Get slots
      let slots: string[] = [];
      let nextAvailableSlotInfo: any = null;
      try {
        const schedule = await appointmentService.getCoachSchedule(s.coachId!);
        const currentSlotInfo = appointmentService.getAvailableSlotsForDate(schedule, dateStr);
        slots = currentSlotInfo.slots;
        
        if (slots.length === 0) {
            nextAvailableSlotInfo = appointmentService.getNextAvailableSlot(schedule, dateStr);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setWizardState(prev => ({ ...prev, isLoadingData: false }));
      }

      if (slots.length > 0) {
          const nextOptions = slots.map(h => ({ label: h, value: h }));
          nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: "Müsait saatlerden sana uygun olanı seç:",
              interactiveOptions: nextOptions
          }]);
      } else if (nextAvailableSlotInfo) {
          // Present the the next available slots directly
          setWizardState(prev => ({ ...prev, date: nextAvailableSlotInfo.date })); // update the date implicitly
          
          const nextOptions = nextAvailableSlotInfo.slots.map((h: string) => ({ label: \`\${nextAvailableSlotInfo.label} - \${h}\`, value: h }));
          nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: \`Bu tarihte uygun saat bulunamadı. En yakın müsait tarih olan \${nextAvailableSlotInfo.label} günü için şu saatleri önerebilirim:\`,
              interactiveOptions: nextOptions
          }]);
      } else {
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: "Bu tarihte uygun saat bulunamadı ve yakın zamanda da müsaitlik görünmüyor. Lütfen başka bir eğitmen dene.",
          }]);
          setWizardState(prev => ({ ...prev, isActive: false }));
      }
    }
    else if (s.step === 5) {
      const hourStr = option.value;
      setWizardState(prev => ({ ...prev, hour: hourStr, isActive: false, isLoadingData: true }));
      
      try {
        let endTime = undefined;
        if (s.service && s.service.duration) {
            const [hours, minutes] = hourStr.split(':').map(Number);
            const endDate = new Date(0, 0, 0, hours, minutes + s.service.duration);
            endTime = \`\${endDate.getHours().toString().padStart(2, '0')}:\${endDate.getMinutes().toString().padStart(2, '0')}\`;
        }

        await appointmentService.bookAppointment({
            studentId: user!.uid,
            studentName: \`\${userData?.firstName || ''} \${userData?.lastName || ''}\`,
            serviceId: s.service?.id || 'wizard-booked',
            serviceType: s.type! as any,
            coachId: s.coachId!,
            date: s.date!,
            startTime: hourStr,
            endTime: endTime,
            status: 'pending',
            paymentStatus: 'unpaid',
            isOnline: true,
            participantCount: 1,
            location: s.service?.title
        });
        
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: \`🎉 **Randevun başarıyla oluşturuldu!**\n\n**Hizmet:** \${s.service?.title}\n**Tarih:** \${s.date} \n**Saat:** \${hourStr}\${endTime ? ' - ' + endTime : ''}\n\nBaşka bir konuda yardıma ihtiyacın var mı?\`
        }]);
      } catch(e) {
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: "Randevu kaydedilirken bir hata oluştu."
        }]);
      } finally {
        setWizardState(prev => ({ ...prev, isLoadingData: false }));
      }
    }
  };`;

content = content.replace(oldHandleChoice, newHandleChoice);

const oldExecute = `  const executeFunction = async (name: string, args: any) => {
    try {
      if (name === 'get_appointments') {
        const apps = await appointmentService.getAppointments(user!.uid, 'student');
        const studentApps = apps.filter(app => app.requesterRole !== 'parent');
        return { success: true, appointments: studentApps };
      }
      if (name === 'get_coach_schedule') {
        const coachIdToUse = args.coachId || userData?.coachId || userData?.assignedCoachId;
        if (!coachIdToUse) return { success: false, error: "Koç ataması bulunamadı." };
        const schedule = await appointmentService.getCoachSchedule(coachIdToUse);
        return { success: true, coachId: coachIdToUse, schedule };
      }
      if (name === 'start_booking_wizard') {
        startWizardFlow();
        // Return a silent success to the model so it stops answering and lets the UI takeover
        return { success: true, message: "Sihirbaz UI başlatıldı, işlem sonucunu bekleme." };
      }
      if (name === 'book_appointment') {`;

const newExecute = `  const executeFunction = async (name: string, args: any, currentHistory?: Message[]) => {
    try {
      if (name === 'get_appointments') {
        const apps = await appointmentService.getAppointments(user!.uid, 'student');
        const studentApps = apps.filter(app => app.requesterRole !== 'parent');
        return { success: true, appointments: studentApps };
      }
      if (name === 'get_coach_schedule') {
        const coachIdToUse = args.coachId || userData?.coachId || userData?.assignedCoachId;
        if (!coachIdToUse) return { success: false, error: "Koç ataması bulunamadı." };
        const schedule = await appointmentService.getCoachSchedule(coachIdToUse);
        return { success: true, coachId: coachIdToUse, schedule };
      }
      if (name === 'start_booking_wizard') {
        if (currentHistory) startWizardFlow(currentHistory);
        // Return a silent success to the model so it stops answering and lets the UI takeover
        return { success: true, message: "Sihirbaz UI başlatıldı, işlem sonucunu bekleme." };
      }
      if (name === 'book_appointment') {`;
content = content.replace(oldExecute, newExecute);


const oldProcess = `        let hasWizard = false;
        for (const fc of data.functionCalls) {
          if (fc.name === 'start_booking_wizard') hasWizard = true;
          const result = await executeFunction(fc.name, fc.args);
          updatedHistory.push({
            id: fc.id || generateId(),
            role: 'function' as const,
            name: fc.name,
            functionResponse: result
          });
        }
        
        setMessages([...updatedHistory]);
        
        // If wizard started, we don't need the AI to say more right now. The UI took over.
        if (!hasWizard) {
            await processResponse(updatedHistory);
        }
        return;`;

const newProcess = `        let hasWizard = false;
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
        return;`;

content = content.replace(oldProcess, newProcess);

fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
