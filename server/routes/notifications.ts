import { Router } from "express";
import { admin, getDb } from "../firebaseAdmin";
import { executeScheduledNotificationEngine } from "../services/notificationEngine";

const router = Router();

// 1. Send Direct Push Notification Endpoint
router.post("/api/send-push", async (req, res) => {
  if (admin.apps.length === 0) {
    return res.status(503).json({ success: false, error: "Firebase Admin SDK initialized değil." });
  }

  try {
    let { token, userId, title, body, link } = req.body;

    // If userId provided instead of token, find token
    if (!token && userId) {
      try {
        const db = getDb();
        const tokenDoc = await db.collection("userTokens").doc(userId).get();
        if (tokenDoc.exists) {
          token = tokenDoc.data()?.token;
        }
      } catch (dbErr) {
        console.warn("[FCM Send Push] Token search error for userId:", userId);
      }
    }

    if (!token) {
      return res.status(400).json({ success: false, error: "Token or registered userId is required" });
    }

    const notificationTitle = title || 'FocusON Akademi';
    const notificationBody = body || 'Yeni bir bildiriminiz var.';
    const notificationLink = link || '/panel';

    const message: any = {
      notification: {
        title: notificationTitle,
        body: notificationBody
      },
      data: {
        title: notificationTitle,
        body: notificationBody,
        link: notificationLink,
        click_action: notificationLink
      },
      webpush: {
        notification: {
          title: notificationTitle,
          body: notificationBody,
          icon: '/images/ON-Logo.png',
          badge: '/images/ON-Logo.png',
          tag: `focuson-${userId || 'broadcast'}-${notificationTitle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
          renotify: false,
          vibrate: [200, 100, 200],
          requireInteraction: false
        },
        fcmOptions: {
          link: notificationLink
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

    const response = await admin.messaging().send(message);
    return res.json({ success: true, messageId: response });
  } catch (error: any) {
    console.error("FCM WebPush Error in modular route:", error);
    return res.status(500).json({ success: false, error: error.message || error });
  }
});

// 2. Push Service Status Endpoint
router.get("/api/push-status", (req, res) => {
  res.json({
    adminInitialized: admin.apps.length > 0,
    appsCount: admin.apps.length,
    projectId: process.env.FIREBASE_PROJECT_ID || "ai-studio-84291387-c606-49b9-a640-979708195be5",
    hasServiceAccountEnv: !!process.env.FIREBASE_SERVICE_ACCOUNT,
    hasPrivateKeyEnv: !!process.env.FIREBASE_PRIVATE_KEY
  });
});

// 3. Save User FCM Token
router.post("/api/save-user-fcm-token", async (req, res) => {
  try {
    const { userId, token, platform, userAgent } = req.body;
    if (!userId || !token) {
      return res.status(400).json({ success: false, error: "userId and token are required" });
    }

    const db = getDb();
    await db.collection("userTokens").doc(userId).set({
      token,
      platform: platform || "web",
      userAgent: userAgent || "browser",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.json({ success: true, message: "Token başarıyla kaydedildi." });
  } catch (err: any) {
    console.error("Error saving FCM token:", err);
    return res.status(500).json({ success: false, error: err?.message || err });
  }
});

// 4. Notification Settings Endpoints
router.get("/api/notifications/settings", async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection("settings").doc("notifications").get();
    if (snap.exists) {
      return res.json({ success: true, settings: snap.data() });
    }
    return res.json({ success: true, settings: null });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || err });
  }
});

router.post("/api/notifications/settings", async (req, res) => {
  try {
    const db = getDb();
    await db.collection("settings").doc("notifications").set({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    return res.json({ success: true, message: "Bildirim ayarları kaydedildi." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || err });
  }
});

// 5. Trigger Engine Manually
router.post("/api/notifications/trigger-engine", async (req, res) => {
  try {
    const forceAll = req.body?.forceAll !== undefined ? req.body.forceAll : true;
    const result = await executeScheduledNotificationEngine({
      forceAll,
      specificType: req.body?.specificType,
      triggerSource: "Manuel Admin Tetikleme"
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || err });
  }
});

export default router;
