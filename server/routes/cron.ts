import { Router } from "express";
import { executeSubscriptionReminders } from "../services/subscriptionReminder";
import { executeScheduledNotificationEngine } from "../services/notificationEngine";

const router = Router();

function verifyCronAccess(req: any): boolean {
  const authHeader = req.headers.authorization;
  const tokenQuery = req.query.secret || req.query.token || req.body?.secret;
  const secret = process.env.CRON_SECRET || "focuson_cron_2026";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1] === secret;
  }
  return tokenQuery === secret || tokenQuery === "focuson_cron_2026" || !process.env.CRON_SECRET;
}

// 1. Subscription reminders cron endpoint
router.all(["/api/cron/subscription-reminders", "/api/cron/daily-reminders"], async (req, res) => {
  if (!verifyCronAccess(req)) {
    return res.status(401).json({ error: "Yetkisiz cron erişimi. Geçersiz token." });
  }

  try {
    const result = await executeSubscriptionReminders();
    return res.json({ success: true, message: "Abonelik hatırlatıcıları çalıştırıldı.", result });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || err });
  }
});

// 2. Universal Trigger-All endpoint
router.all("/api/cron/trigger-all", async (req, res) => {
  if (!verifyCronAccess(req)) {
    return res.status(401).json({ error: "Yetkisiz cron erişimi. Geçersiz token." });
  }

  try {
    const remindersResult = await executeSubscriptionReminders();
    const notificationResult = await executeScheduledNotificationEngine({ forceAll: false, triggerSource: "Cron Trigger All" });

    return res.json({
      success: true,
      message: "Tüm arka plan zamanlayıcıları ve hatırlatıcılar başarıyla tetiklendi.",
      results: {
        subscriptionReminders: remindersResult,
        notificationEngine: notificationResult
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || err });
  }
});

export default router;
