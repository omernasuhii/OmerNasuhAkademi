const fs = require('fs');
let content = fs.readFileSync('src/pages/students/AIAssistant.tsx', 'utf8');

const oldStep4 = `    else if (s.step === 4) {
      const dateStr = option.value;
      setWizardState(prev => ({ ...prev, date: dateStr, step: 5 }));
      
      const dur = s.type === 'one-on-one' ? (s.service?.duration || 60) : 60;
      
      const getSlotsForDate = (checkDateStr: string) => {
          const dateObj = new Date(checkDateStr);
          
          // Check Blocked Dates (Kapalı Günler)
          const blockedDates = s.schedule?.blockedDates || [];
          for (const bd of blockedDates) {
             if (checkDateStr >= bd.startDate && checkDateStr <= bd.endDate) {
                 if (bd.isAllDay !== false) return []; // Just return empty slots, it's kapalı gün
             }
          }

          const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = daysMap[dateObj.getDay()];
          const daySchedule = s.schedule?.weeklyHours?.[dayName] || [];
          
          const manualBusy = (s.schedule?.manualBusySlots || [])
            .filter((b: any) => b.date === checkDateStr)
            .map((b: any) => ({ start: b.start, end: b.end }));
            
          const bookedTimes = (s.appointments || [])
            .filter((a: any) => a.date === checkDateStr && a.status !== 'cancelled')
            .map((a: any) => a.startTime);
            
          let slots: string[] = [];
          daySchedule.forEach((slot: any) => {
             let startMins = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
             let endMins = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
             while (startMins + dur <= endMins) {
               const h = Math.floor(startMins / 60).toString().padStart(2, '0');
               const m = (startMins % 60).toString().padStart(2, '0');
               const timeStr = \`\${h}:\${m}\`;
               
               const slotEndMins = startMins + dur;
               
               let isBusy = false;
               if (bookedTimes.includes(timeStr)) isBusy = true;
               
               // manual busy check
               for (const busy of manualBusy) {
                  const busyStart = parseInt(busy.start.split(':')[0]) * 60 + parseInt(busy.start.split(':')[1]);
                  const busyEnd = parseInt(busy.end.split(':')[0]) * 60 + parseInt(busy.end.split(':')[1]);
                  // overlap logic: startMins < busyEnd && slotEndMins > busyStart
                  if (startMins < busyEnd && slotEndMins > busyStart) {
                     isBusy = true;
                  }
               }
               
               if (!isBusy) {
                   slots.push(timeStr);
               }
               startMins += 30; // standard 30 min step
             }
          });
          return slots;
      };

      let slots = getSlotsForDate(dateStr);
      let nextAvailableSlotInfo = null;

      if (slots.length === 0) {
        // Fallback or nearest date logic
        // Find next available date in the upcoming 30 days
        let checkDate = new Date(dateStr);
        for (let i = 1; i <= 30; i++) {
            checkDate.setDate(checkDate.getDate() + 1);
            const checkStr = checkDate.toISOString().split('T')[0];
            const checkSlots = getSlotsForDate(checkStr);
            if (checkSlots.length > 0) {
                nextAvailableSlotInfo = {
                    date: checkStr,
                    slots: checkSlots,
                    label: checkDate.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })
                };
                break;
            }
        }
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
    }`;

const newStep4 = `    else if (s.step === 4) {
      const dateStr = option.value;
      setWizardState(prev => ({ ...prev, date: dateStr, step: 5 }));
      
      const dur = 60; // s.type === 'one-on-one' ? (s.service?.duration || 60) : 60;
      
      const getSlotsForDate = (checkDateStr: string) => {
          const dateObj = new Date(checkDateStr);
          
          // Check Blocked Dates (Kapalı Günler)
          const blockedDates = s.schedule?.blockedDates || [];
          for (const bd of blockedDates) {
             if (checkDateStr >= bd.startDate && checkDateStr <= bd.endDate) {
                 if (bd.isAllDay !== false) return []; // Just return empty slots, it's kapalı gün
             }
          }

          const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = daysMap[dateObj.getDay()];
          const daySchedule = s.schedule?.weeklyHours?.[dayName] || [];
          
          const manualBusy = (s.schedule?.manualBusySlots || [])
            .filter((b: any) => b.date === checkDateStr)
            .map((b: any) => ({ start: b.start, end: b.end }));
            
          const bookedTimes = (s.appointments || [])
            .filter((a: any) => a.date === checkDateStr && a.status !== 'cancelled')
            .map((a: any) => a.startTime);
            
          let slots: string[] = [];
          daySchedule.forEach((slot: any) => {
             let startMins = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
             let endMins = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
             while (startMins + dur <= endMins) {
               const h = Math.floor(startMins / 60).toString().padStart(2, '0');
               const m = (startMins % 60).toString().padStart(2, '0');
               const timeStr = \`\${h}:\${m}\`;
               
               const slotEndMins = startMins + dur;
               
               let isBusy = false;
               if (bookedTimes.includes(timeStr)) isBusy = true;
               
               // manual busy check
               for (const busy of manualBusy) {
                  const busyStart = parseInt(busy.start.split(':')[0]) * 60 + parseInt(busy.start.split(':')[1]);
                  const busyEnd = parseInt(busy.end.split(':')[0]) * 60 + parseInt(busy.end.split(':')[1]);
                  // overlap logic: startMins < busyEnd && slotEndMins > busyStart
                  if (startMins < busyEnd && slotEndMins > busyStart) {
                     isBusy = true;
                  }
               }
               
               if (!isBusy) {
                   slots.push(timeStr);
               }
               startMins += 60; // 1 hour step as requested
             }
          });
          return slots;
      };

      let slots = getSlotsForDate(dateStr);
      let nextAvailableSlotInfo = null;

      if (slots.length === 0) {
        // Fallback or nearest date logic
        // Find next available date in the upcoming 30 days
        let checkDate = new Date(dateStr);
        for (let i = 1; i <= 30; i++) {
            checkDate.setDate(checkDate.getDate() + 1);
            const checkStr = checkDate.toISOString().split('T')[0];
            const checkSlots = getSlotsForDate(checkStr);
            if (checkSlots.length > 0) {
                nextAvailableSlotInfo = {
                    date: checkStr,
                    slots: checkSlots,
                    label: checkDate.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })
                };
                break;
            }
        }
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
              interactiveOptions: [{ label: '❌ İptal Et', value: 'cancel' }]
          }]);
      }
    }`;

content = content.replace(oldStep4, newStep4);
fs.writeFileSync('src/pages/students/AIAssistant.tsx', content);
