const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const oldFuncRegex = /async function executeSubscriptionReminders\([\s\S]*?app\.post\("\/api\/test-subscription-reminders"/;

const newFunc = `async function executeSubscriptionReminders(options?: { studentId?: string; parentPhone?: string; force?: boolean }) {
    console.log("[Subscription Reminder] Automated batch processing started...", options);
    const db = getDb();
    const twConfig = await getTwilioConfig();
    
    try {
      const settingsSnap = await db.collection("settings").doc("system").get();
      if (settingsSnap.exists) {
        const data = settingsSnap.data() || {};
        if (data.subscriptionRemindersEnabled === false && !options?.force) {
          console.log("[Subscription Reminder] Reminders are disabled in settings. Skipping.");
          return { success: true, processedCount: 0 };
        }
      }
      
      const finSnap = await db.collection("settings").doc("financial").get();
      let rate = 20, minRateBronze = 1000, minRateSilver = 1500, minRateGold = 2000;
      if (finSnap.exists) {
        const data = finSnap.data() || {};
        if (data.systemDeductionRate !== undefined) rate = data.systemDeductionRate;
        if (data.minSystemDeductionBronze !== undefined) minRateBronze = data.minSystemDeductionBronze;
        if (data.minSystemDeductionSilver !== undefined) minRateSilver = data.minSystemDeductionSilver;
        if (data.minSystemDeductionGold !== undefined) minRateGold = data.minSystemDeductionGold;
      }

      const templateSid = "HXdbff2ce81cacc365c1e3c16897ec4a53";
      // Sablon için örnek ID, kullanıcının Meta'dan onaylatması gerekiyor
      const coachWarningTemplateSid = "HX_COACH_BALANCE_WARNING_TEMPLATE"; 
      
      const now = new Date();
      // Normalize today to midnight UTC for easy day diff
      const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      
      let query = db.collection("users").where("role", "==", "student").where("subscriptionStatus", "==", "active");
      
      const studentsSnap = await query.get();
      
      // 1. Koçların yaklaşan sistem kesintilerini hesapla
      const coachDeductionMap: Record<string, { totalUpcoming: number, studentCount: number, coachData: any, notifyToday: boolean }> = {};
      
      for (const docSnap of studentsSnap.docs) {
        const student = docSnap.data();
        if (!student.subscriptionEndDate || !student.subscriptionPlan) continue;
        
        const endDate = new Date(student.subscriptionEndDate);
        const endDay = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
        if (endDay.getTime() < today.getTime()) continue;
        
        const diffTime = Math.abs(endDay.getTime() - today.getTime());
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 5) {
           let coachId = student.assignedCoachId || student.coachId;
           if (!coachId) continue;
           
           if (!coachDeductionMap[coachId]) {
              const coachDoc = await db.collection('users').doc(coachId).get();
              if (!coachDoc.exists) continue;
              coachDeductionMap[coachId] = {
                  totalUpcoming: 0,
                  studentCount: 0,
                  coachData: coachDoc.data(),
                  notifyToday: false
              };
           }
           
           const cData = coachDeductionMap[coachId].coachData;
           let pBronze = cData.bronzePrice || 3000;
           let pSilver = cData.silverPrice || 4500;
           let pGold = cData.goldPrice || 6000;
           
           let sysDed = 0;
           const plan = student.subscriptionPlan.toLowerCase();
           if (plan.includes('bronz')) sysDed = Math.max(Math.floor(pBronze * (rate / 100)), minRateBronze);
           else if (plan.includes('gümüş') || plan.includes('gumus')) sysDed = Math.max(Math.floor(pSilver * (rate / 100)), minRateSilver);
           else if (plan.includes('altın') || plan.includes('altin')) sysDed = Math.max(Math.floor(pGold * (rate / 100)), minRateGold);
           
           coachDeductionMap[coachId].totalUpcoming += sysDed;
           coachDeductionMap[coachId].studentCount += 1;
           
           if (daysLeft === 5 || daysLeft === 1 || options?.force) {
               coachDeductionMap[coachId].notifyToday = true;
           }
        }
      }

      // 2. Koçlara bakiye yetersizliği bildirimi gönder
      if (twConfig.accountSid && twConfig.authToken && (twConfig.messagingServiceSid || twConfig.whatsappNumber)) {
          const { default: twilio } = await import("twilio");
          const client = twilio(twConfig.accountSid, twConfig.authToken);
          let fromTwilio = twConfig.whatsappNumber && twConfig.whatsappNumber.includes("whatsapp:") ? twConfig.whatsappNumber : \`whatsapp:\${twConfig.whatsappNumber}\`;

          for (const [coachId, data] of Object.entries(coachDeductionMap)) {
             const currentSysBalance = data.coachData.systemBalance || 0;
             if (currentSysBalance < data.totalUpcoming && data.notifyToday) {
                 const coachPhone = data.coachData.phone;
                 if (coachPhone) {
                     const formattedCoachPhone = formatE164Phone(coachPhone);
                     let targetTwilio = formattedCoachPhone.startsWith("whatsapp:") ? formattedCoachPhone : \`whatsapp:\${formattedCoachPhone}\`;
                     
                     const coachName = \`\${data.coachData.firstName || ''} \${data.coachData.lastName || ''}\`.trim() || 'Koç';
                     
                     const templatePayload: any = {
                        from: fromTwilio,
                        to: targetTwilio,
                        contentSid: coachWarningTemplateSid,
                        contentVariables: JSON.stringify({
                          "1": coachName,
                          "2": String(data.studentCount),
                          "3": String(data.totalUpcoming.toLocaleString('tr-TR')),
                          "4": String(currentSysBalance.toLocaleString('tr-TR'))
                        })
                     };
                     
                     if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                        delete templatePayload.from;
                        templatePayload.messagingServiceSid = twConfig.messagingServiceSid;
                     }
                     
                     try {
                         await client.messages.create(templatePayload);
                         console.log(\`[Coach Reminder] Warning sent to coach \${coachName} (Phone: \${coachPhone}) - Balance: \${currentSysBalance} < \${data.totalUpcoming}\`);
                     } catch (err: any) {
                         console.error(\`[Coach Reminder] Twilio error for coach \${coachName}:\`, err?.message || err);
                     }
                 }
             }
          }
      }
      
      // 3. Öğrencilere/Velilere hatırlatma gönder
      let processedCount = 0;
      const SUBSCRIPTION_PACKAGES = [
        { id: 'bronz', title: 'Bronz Paket (Sadece Soru Çözümü)' },
        { id: 'gumus', title: 'Gümüş Paket (Klasik Koçluk)' },
        { id: 'altin', title: 'Altın Paket (Koçluk + Yapay Zeka Soru Çözümü)' }
      ];

      for (const docSnap of studentsSnap.docs) {
        const student = docSnap.data();
        if (options?.studentId && docSnap.id !== options.studentId) continue;
        if (!student.subscriptionEndDate || !student.subscriptionPlan) continue;
        
        const endDate = new Date(student.subscriptionEndDate);
        const endDay = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
        
        const diffTime = Math.abs(endDay.getTime() - today.getTime());
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Ensure the end date is actually in the future
        if (endDay.getTime() < today.getTime()) continue;

        if (daysLeft === 5 || daysLeft === 1 || options?.force) {
          // Check price
          let pBronze = 3000, pSilver = 4500, pGold = 6000;
          let coachId = student.assignedCoachId || student.coachId;
          
          if (coachId && coachDeductionMap[coachId]) {
              const cData = coachDeductionMap[coachId].coachData;
              pBronze = cData.bronzePrice || 3000;
              pSilver = cData.silverPrice || 4500;
              pGold = cData.goldPrice || 6000;
          } else if (coachId) {
            const coachDoc = await db.collection('users').doc(coachId).get();
            if (coachDoc.exists) {
              const cData = coachDoc.data();
              pBronze = cData.bronzePrice || 3000;
              pSilver = cData.silverPrice || 4500;
              pGold = cData.goldPrice || 6000;
            }
          }
          
          const specialDiscounts = student.specialDiscounts || {};
          const dBronze = specialDiscounts.bronze ? Math.floor(pBronze * (specialDiscounts.bronze / 100)) : 0;
          const dSilver = specialDiscounts.silver ? Math.floor(pSilver * (specialDiscounts.silver / 100)) : 0;
          const dGold = specialDiscounts.gold ? Math.floor(pGold * (specialDiscounts.gold / 100)) : 0;
          
          const packages = [
            { title: SUBSCRIPTION_PACKAGES[0].title, price: pBronze - dBronze },
            { title: SUBSCRIPTION_PACKAGES[1].title, price: pSilver - dSilver },
            { title: SUBSCRIPTION_PACKAGES[2].title, price: pGold - dGold }
          ];
          
          let cost = 0;
          for (let p of packages) {
             if (p.title === student.subscriptionPlan || student.subscriptionPlan.includes(p.title.split(' ')[0])) {
               cost = p.price; break;
             }
          }
          
          const walletBalance = student.walletBalance || 0;
          
          if (walletBalance < cost || options?.force) {
            const parentPhone = options?.parentPhone || student.parentPhone || student.phone;
            if (parentPhone) {
              const studentName = \`\${student.firstName || ''} \${student.lastName || ''}\`.trim() || 'Öğrenci';
              
              if (twConfig.accountSid && twConfig.authToken && (twConfig.messagingServiceSid || twConfig.whatsappNumber)) {
                try {
                  const { default: twilio } = await import("twilio");
                  const client = twilio(twConfig.accountSid, twConfig.authToken);
                  const formattedParentPhone = formatE164Phone(parentPhone);
                  let targetTwilio = formattedParentPhone.startsWith("whatsapp:") ? formattedParentPhone : \`whatsapp:\${formattedParentPhone}\`;
                  let fromTwilio = twConfig.whatsappNumber && twConfig.whatsappNumber.includes("whatsapp:") ? twConfig.whatsappNumber : \`whatsapp:\${twConfig.whatsappNumber}\`;
                  
                  const templatePayload: any = {
                    from: fromTwilio,
                    to: targetTwilio,
                    contentSid: templateSid,
                    contentVariables: JSON.stringify({
                      "1": studentName,
                      "2": String(daysLeft),
                      "3": String(walletBalance.toLocaleString('tr-TR')),
                      "4": String(cost.toLocaleString('tr-TR')),
                      "5": student.subscriptionPlan
                    })
                  };

                  if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                    delete templatePayload.from;
                    templatePayload.messagingServiceSid = twConfig.messagingServiceSid;
                  }

                  await client.messages.create(templatePayload);
                  console.log(\`[Subscription Reminder] Sent to \${studentName} (Phone: \${parentPhone}) - Days Left: \${daysLeft}, Balance: \${walletBalance}, Cost: \${cost}\`);
                  processedCount++;
                } catch (sendErr: any) {
                  console.error(\`[Subscription Reminder] Twilio error for \${studentName}:\`, sendErr?.message || sendErr);
                }
              }
            }
          }
        }
      }

      console.log(\`[Subscription Reminder] Completed. Processed \${processedCount} reminders.\`);
      return { success: true, processedCount };
    } catch (error: any) {
      console.error("[Subscription Reminder] General error:", error);
      return { success: false, error: error?.message };
    }
  }

  app.post("/api/test-subscription-reminders"`;

content = content.replace(oldFuncRegex, newFunc);
fs.writeFileSync('server.ts', content);
