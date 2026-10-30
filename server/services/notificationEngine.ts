import { admin, getDb } from "../firebaseAdmin";

export interface PushResult {
  success: boolean;
  pushSent: boolean;
  notificationDocCreated: boolean;
  error?: string;
}

export async function sendNotificationAndPushToUser(
  userId: string,
  title: string,
  body: string,
  link: string = "/",
  type: string = "system"
): Promise<PushResult> {
  const db = getDb();
  let notificationDocCreated = false;
  let pushSent = false;

  // 1. In-App Notification Doc in Firestore (Message type excluded from in-app notifications)
  if (type !== 'message') {
    try {
      await db.collection("notifications").add({
        userId,
        title,
        message: body,
        type,
        isRead: false,
        createdAt: new Date().toISOString(),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        link
      });
      notificationDocCreated = true;
    } catch (err: any) {
      console.error(`[Notification Engine] Error saving notification doc for user ${userId}:`, err?.message || err);
    }
  }

  // 2. FCM WebPush / Mobile Push if token exists
  if (admin.apps.length > 0) {
    try {
      const tokenDoc = await db.collection("userTokens").doc(userId).get();
      if (tokenDoc.exists) {
        const token = tokenDoc.data()?.token;
        if (token) {
          const message: any = {
            notification: {
              title,
              body
            },
            data: {
              title,
              body,
              link,
              click_action: link
            },
            webpush: {
              notification: {
                title,
                body,
                icon: '/images/ON-Logo.png',
                badge: '/images/ON-Logo.png',
                tag: `focuson-${userId}-${title.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
                renotify: false,
                vibrate: [200, 100, 200],
                requireInteraction: false
              },
              fcmOptions: {
                link
              },
              headers: {
                Urgency: "high"
              }
            },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                priority: "high"
              }
            },
            token: token
          };

          const pushRes = await admin.messaging().send(message);
          pushSent = true;
          console.log(`[Notification Engine Push] Sent to user ${userId} (Push ID: ${pushRes})`);
        }
      }
    } catch (pushErr: any) {
      const errMsg = pushErr?.message || String(pushErr);
      const errCode = pushErr?.code || pushErr?.errorInfo?.code;
      const isUnregistered = 
        errCode === 'messaging/registration-token-not-registered' ||
        errCode === 'messaging/invalid-registration-token' ||
        errMsg.includes('Device unregistered') ||
        errMsg.includes('registration-token-not-registered') ||
        errMsg.includes('Requested entity was not found');

      if (isUnregistered) {
        try {
          await db.collection("userTokens").doc(userId).delete();
          console.log(`[Notification Engine Push] Stale/unregistered token for user ${userId} deleted from userTokens.`);
        } catch (delErr) {
          console.warn(`[Notification Engine Push] Failed to delete stale token for ${userId}:`, delErr);
        }
      } else {
        console.warn(`[Notification Engine Push] Push to user ${userId} failed:`, errMsg);
      }
    }
  }

  return { success: notificationDocCreated || pushSent, pushSent, notificationDocCreated };
}

export async function executeScheduledNotificationEngine(options?: {
  forceAll?: boolean;
  specificType?: string;
  triggerSource?: string;
}) {
  const db = getDb();
  const logs: string[] = [];
  const stats = {
    appointmentsSent: 0,
    morningSent: 0,
    eveningSent: 0,
    inactivitySent: 0,
    subscriptionSent: 0,
    eventsSent: 0,
    totalPushSent: 0,
    totalErrors: 0
  };

  try {
    // 1. Fetch Notification Settings
    let settings: any = {
      engineActive: true,
      appointmentsEnabled: true,
      appointment24hEnabled: true,
      appointment1hEnabled: true,
      appointmentLeadMinutes: 60,
      appointmentStudentTemplate: "Hatırlatma: '{coachName}' ile olan randevunuz {timeLeft} sonra başlayacak. Hazır mısınız? 🚀",
      appointmentCoachTemplate: "Hatırlatma: '{studentName}' ile olan randevunuza {timeLeft} kaldı.",
      morningReminderEnabled: true,
      morningReminderTime: "09:00",
      morningTitle: "Günaydın! Bugünkü Görevlerin Hazır ☀️",
      morningMessage: "Bugün hedeflerine bir adım daha yaklaşma vakti! Günlük çalışma planını incelemeyi unutma.",
      eveningReminderEnabled: true,
      eveningReminderTime: "20:00",
      eveningTitle: "Gün Sonu Çalışma Hatırlatması 🌙",
      eveningMessage: "Bugün henüz tamamlanmamış görevlerin bulunuyor. Haydi masaya, hedeflerini tamamla!",
      inactivityAlertEnabled: true,
      inactivityDaysThreshold: 3,
      inactivityCheckTime: "21:00",
      inactivityCoachTitle: "Öğrenci Pasiflik Uyarısı 🚨",
      inactivityCoachMessage: "'{studentName}' adlı öğrenciniz son {days} gündür sisteme çalışma girişi yapmadı. Erken müdahale için iletişime geçebilirsiniz.",
      inactivityStudentTitle: "FocusON Seni Özledi! 🎯",
      inactivityStudentMessage: "Birkaç gündür çalışma girişi yapmadığını fark ettik. Hedeflerine odaklanmak için bugün küçük bir adımla başla!",
      subscriptionReminderEnabled: true,
      subscriptionDaysBefore: 3,
      subscriptionReminderTime: "19:00",
      subscriptionTitle: "Abonelik Bitişi Yaklaşıyor ⏳",
      subscriptionMessage: "Koçluk aboneliğinizin yenilenmesine son {days} gün kaldı.",
      eventReminderEnabled: true,
      event24hEnabled: true,
      event1hEnabled: true,
      eventTitle: "Etkinlik Hatırlatıcısı 🎟️",
      eventMessage: "Kayıt olduğunuz '{eventTitle}' etkinliği yaklaşıyor. Başlama saati: {eventTime}"
    };

    const settingsDoc = await db.collection("settings").doc("notifications").get();
    if (settingsDoc.exists) {
      settings = { ...settings, ...settingsDoc.data() };
    }

    if (!settings.engineActive && !options?.forceAll) {
      logs.push("Notification Engine master switch is OFF. Skipping execution.");
      return { success: true, message: "Engine switch is OFF", stats, logs };
    }

    // Istanbul Time formatting
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
    
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || "";
    const currentYear = getPart("year");
    const currentMonth = getPart("month");
    const currentDay = getPart("day");
    const currentHour = getPart("hour");
    const currentMinute = getPart("minute");
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    const todayDateStr = `${currentYear}-${currentMonth}-${currentDay}`;
    
    const tomorrowDate = new Date(now.getTime() + 86400000);
    const tomorrowParts = formatter.formatToParts(tomorrowDate);
    const getTomPart = (type: string) => tomorrowParts.find(p => p.type === type)?.value || "";
    const tomorrowDateStr = `${getTomPart("year")}-${getTomPart("month")}-${getTomPart("day")}`;

    logs.push(`[Engine Start] Istanbul Time: ${todayDateStr} ${currentTimeStr}`);

    // ==========================================
    // RULE 1: APPOINTMENT REMINDERS (1h & 24h)
    // ==========================================
    if (settings.appointmentsEnabled && (!options?.specificType || options.specificType === "appointments")) {
      try {
        const bookingsSnap = await db.collection("bookings")
          .where("status", "==", "confirmed")
          .where("date", "in", [todayDateStr, tomorrowDateStr])
          .get();

        for (const bDoc of bookingsSnap.docs) {
          const booking = bDoc.data();
          const bookingId = bDoc.id;
          if (!booking.date || !booking.startTime) continue;

          const [bYear, bMonth, bDay] = booking.date.split("-").map(Number);
          const [bHour, bMin] = booking.startTime.split(":").map(Number);
          const appDateTime = new Date(bYear, bMonth - 1, bDay, bHour, bMin);
          const diffMs = appDateTime.getTime() - now.getTime();
          const diffMinutes = Math.round(diffMs / (1000 * 60));

          // 1-Hour (Lead time) Reminder
          if (settings.appointment1hEnabled && diffMinutes > 0 && diffMinutes <= (settings.appointmentLeadMinutes || 60)) {
            const remDocRef = db.collection("appointment_reminders").doc(`${bookingId}_1h`);
            const remDoc = await remDocRef.get();
            if (!remDoc.exists || options?.forceAll) {
              const studentMsg = (settings.appointmentStudentTemplate || "Hatırlatma: '{coachName}' ile olan randevunuz {timeLeft} sonra başlayacak.")
                .replace('{coachName}', booking.coachName || 'Koçunuz')
                .replace('{timeLeft}', `${diffMinutes} dakika`)
                .replace('{time}', booking.startTime);

              const coachMsg = (settings.appointmentCoachTemplate || "Hatırlatma: '{studentName}' ile olan randevunuza {timeLeft} kaldı.")
                .replace('{studentName}', booking.studentName || 'Öğrenciniz')
                .replace('{timeLeft}', `${diffMinutes} dakika`)
                .replace('{time}', booking.startTime);

              if (booking.studentId) {
                const res = await sendNotificationAndPushToUser(booking.studentId, 'Yaklaşan Randevu ⏳', studentMsg, '/panel/ogrenci/randevular', 'appointment');
                if (res.pushSent) stats.totalPushSent++;
              }
              if (booking.coachId) {
                const res = await sendNotificationAndPushToUser(booking.coachId, 'Yaklaşan Randevu ⏳', coachMsg, '/panel/koc/randevular', 'appointment');
                if (res.pushSent) stats.totalPushSent++;
              }

              await remDocRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), type: '1h', bookingId });
              stats.appointmentsSent++;
            }
          }

          // 24-Hour Reminder
          if (settings.appointment24hEnabled && diffMinutes > (22 * 60) && diffMinutes <= (26 * 60)) {
            const remDocRef = db.collection("appointment_reminders").doc(`${bookingId}_24h`);
            const remDoc = await remDocRef.get();
            if (!remDoc.exists || options?.forceAll) {
              const studentMsg = `Hatırlatma: Yarın saat ${booking.startTime}'da '${booking.coachName || 'Koçunuz'}' ile randevunuz bulunmaktadır.`;
              const coachMsg = `Hatırlatma: Yarın saat ${booking.startTime}'da '${booking.studentName || 'Öğrenciniz'}' ile randevunuz bulunmaktadır.`;

              if (booking.studentId) {
                const res = await sendNotificationAndPushToUser(booking.studentId, 'Yarınki Randevunuz 📅', studentMsg, '/panel/ogrenci/randevular', 'appointment');
                if (res.pushSent) stats.totalPushSent++;
              }
              if (booking.coachId) {
                const res = await sendNotificationAndPushToUser(booking.coachId, 'Yarınki Randevunuz 📅', coachMsg, '/panel/koc/randevular', 'appointment');
                if (res.pushSent) stats.totalPushSent++;
              }

              await remDocRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), type: '24h', bookingId });
              stats.appointmentsSent++;
            }
          }
        }
      } catch (err: any) {
        console.error("[Engine Rule 1: Appointments Error]", err);
        stats.totalErrors++;
      }
    }

    // ==========================================
    // RULE 2: MORNING PLAN & MOTIVATION REMINDER
    // ==========================================
    const isMorningHourMatch = settings.morningReminderTime && settings.morningReminderTime.split(":")[0] === currentHour;
    if (settings.morningReminderEnabled && (isMorningHourMatch || options?.forceAll) && (!options?.specificType || options.specificType === "morning")) {
      try {
        const studentsSnap = await db.collection("users").where("role", "==", "student").get();
        for (const sDoc of studentsSnap.docs) {
          const studentId = sDoc.id;
          const logKey = `morning_${studentId}_${todayDateStr}`;
          const logDocRef = db.collection("daily_notification_logs").doc(logKey);
          const logDoc = await logDocRef.get();
          if (!logDoc.exists || options?.forceAll) {
            const res = await sendNotificationAndPushToUser(
              studentId,
              settings.morningTitle || "Günaydın! Bugünkü Görevlerin Hazır ☀️",
              settings.morningMessage || "Bugün hedeflerine bir adım daha yaklaşma vakti! Günlük çalışma planını incelemeyi unutma.",
              "/panel/ogrenci/kocluk",
              "system"
            );
            if (res.pushSent) stats.totalPushSent++;
            await logDocRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), type: "morning", date: todayDateStr });
            stats.morningSent++;
          }
        }
      } catch (err: any) {
        console.error("[Engine Rule 2: Morning Error]", err);
        stats.totalErrors++;
      }
    }

    // ==========================================
    // RULE 3: EVENING UNCOMPLETED TASKS REMINDER
    // ==========================================
    const isEveningHourMatch = settings.eveningReminderTime && settings.eveningReminderTime.split(":")[0] === currentHour;
    if (settings.eveningReminderEnabled && (isEveningHourMatch || options?.forceAll) && (!options?.specificType || options.specificType === "evening")) {
      try {
        const studentsSnap = await db.collection("users").where("role", "==", "student").get();
        for (const sDoc of studentsSnap.docs) {
          const studentId = sDoc.id;
          const logKey = `evening_${studentId}_${todayDateStr}`;
          const logDocRef = db.collection("daily_notification_logs").doc(logKey);
          const logDoc = await logDocRef.get();
          if (!logDoc.exists || options?.forceAll) {
            const res = await sendNotificationAndPushToUser(
              studentId,
              settings.eveningTitle || "Gün Sonu Çalışma Hatırlatması 🌙",
              settings.eveningMessage || "Bugün henüz tamamlanmamış hedeflerin bulunuyor. Masaya geçip günü başarıyla tamamla!",
              "/panel/ogrenci/kocluk",
              "system"
            );
            if (res.pushSent) stats.totalPushSent++;
            await logDocRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), type: "evening", date: todayDateStr });
            stats.eveningSent++;
          }
        }
      } catch (err: any) {
        console.error("[Engine Rule 3: Evening Error]", err);
        stats.totalErrors++;
      }
    }

    // ==========================================
    // RULE 4: INACTIVITY & COACH EARLY INTERVENTION
    // ==========================================
    const isInactivityHourMatch = settings.inactivityCheckTime && settings.inactivityCheckTime.split(":")[0] === currentHour;
    if (settings.inactivityAlertEnabled && (isInactivityHourMatch || options?.forceAll) && (!options?.specificType || options.specificType === "inactivity")) {
      try {
        const thresholdDays = settings.inactivityDaysThreshold || 3;
        const studentsSnap = await db.collection("users").where("role", "==", "student").get();
        
        for (const sDoc of studentsSnap.docs) {
          const student = sDoc.data();
          const studentId = sDoc.id;
          const coachId = student.assignedCoachId || student.coachId;
          const lastActiveStr = student.lastActive || student.updatedAt || student.createdAt;
          
          if (lastActiveStr && coachId) {
            const lastActiveDate = new Date(lastActiveStr);
            const diffDays = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays >= thresholdDays) {
              const logKey = `inactivity_coach_${coachId}_${studentId}_${todayDateStr}`;
              const logDocRef = db.collection("daily_notification_logs").doc(logKey);
              const logDoc = await logDocRef.get();
              if (!logDoc.exists || options?.forceAll) {
                const sName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Öğrenciniz';
                const coachMsg = (settings.inactivityCoachMessage || "'{studentName}' adlı öğrenciniz son {days} gündür sisteme veri girişi yapmadı.")
                  .replace('{studentName}', sName)
                  .replace('{days}', String(diffDays));

                const resCoach = await sendNotificationAndPushToUser(
                  coachId,
                  settings.inactivityCoachTitle || "Öğrenci Pasiflik Uyarısı 🚨",
                  coachMsg,
                  "/panel/koc/ogrenciler",
                  "system"
                );
                if (resCoach.pushSent) stats.totalPushSent++;

                const resStudent = await sendNotificationAndPushToUser(
                  studentId,
                  settings.inactivityStudentTitle || "FocusON Seni Özledi! 🎯",
                  settings.inactivityStudentMessage || "Birkaç gündür çalışma girişi yapmadığını fark ettik. Hedeflerine odaklanmak için bugün küçük bir adımla başla!",
                  "/panel/ogrenci/kocluk",
                  "system"
                );
                if (resStudent.pushSent) stats.totalPushSent++;

                await logDocRef.set({ sentAt: admin.firestore.FieldValue.serverTimestamp(), type: "inactivity", date: todayDateStr, studentId, coachId });
                stats.inactivitySent++;
              }
            }
          }
        }
      } catch (err: any) {
        console.error("[Engine Rule 4: Inactivity Error]", err);
        stats.totalErrors++;
      }
    }

    // Save execution summary
    try {
      await db.collection("notification_engine_logs").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        time: `${todayDateStr} ${currentTimeStr}`,
        success: stats.totalErrors === 0,
        triggerSource: options?.triggerSource || (options?.forceAll ? "Manuel Admin Tetikleme" : "Otomatik Zamanlayıcı (Cron)"),
        stats,
        message: `Tarama tamamlandı. Gönderilen anlık push adedi: ${stats.totalPushSent}`
      });
    } catch (logErr) {
      console.error("[Engine Log DB Error]", logErr);
    }

    return {
      success: true,
      message: `Zamanlayıcı taraması tamamlandı. ${stats.totalPushSent} adet anlık push bildirimi iletildi.`,
      stats,
      logs
    };
  } catch (error: any) {
    console.error("[Notification Engine Fatal Error]", error);
    return {
      success: false,
      error: error?.message || String(error),
      stats,
      logs
    };
  }
}
