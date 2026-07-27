const fs = require('fs');
let content = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

const targetStr = `            // 3. Today's immediate visual contribution`;

const insertStr = `            // 2.5 Expired "Sonuç Bekleniyor" check
            const pastDates = [];
            for (let i = 1; i <= 14; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                pastDates.push(d.toISOString().split('T')[0]);
            }
            const pastProgs = await studentDataService.getDailyPrograms(userData.uid, pastDates);
            let hasExpiredWaiting = false;
            const nowTimeStr = new Date().toISOString().split('T')[0];
            const nowTime = new Date(nowTimeStr);
            
            pastProgs.forEach(prog => {
                const progDate = new Date(prog.date);
                const diffDays = Math.floor((nowTime.getTime() - progDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays >= 2) { // 2 days or more (if it was day before yesterday, it's 2 days ago. We'll give them 2 days)
                    if (prog.tasks?.some((t:any) => t.isWaitingResult)) {
                        hasExpiredWaiting = true;
                    }
                }
            });

            if (hasExpiredWaiting && sCount > 0) {
                sCount = 0;
                await studentDataService.updateStudentProfile(userData.uid, {
                    'streakInfo.count': 0,
                    streak: 0
                });
                // Also add a notification?
                await notificationService.addNotification(userData.uid, {
                    title: 'Seriniz Sıfırlandı',
                    message: '2 günden fazla süredir sonuç bekleyen denemeleriniz olduğu için çalışma seriniz sıfırlandı.',
                    type: 'system',
                    userId: userData.uid
                });
            }

            // 3. Today's immediate visual contribution`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, insertStr);
} else {
  console.log('targetStr not found for summary streak');
}

fs.writeFileSync('src/pages/students/Summary.tsx', content);
