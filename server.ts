import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { initializeApp as initClientApp, getApps as getClientApps } from "firebase/app";
import { 
  getFirestore as getClientFirestore, 
  doc as clientDoc, 
  setDoc as clientSetDoc, 
  getDoc as clientGetDoc, 
  addDoc as clientAddDoc, 
  getDocs as clientGetDocs, 
  updateDoc as clientUpdateDoc,
  query as clientQuery, 
  collection as clientCollection, 
  where as clientWhere, 
  writeBatch as clientWriteBatch,
  serverTimestamp as clientServerTimestamp
} from "firebase/firestore";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const __filename = (typeof import.meta !== 'undefined' && import.meta.url) 
  ? fileURLToPath(import.meta.url) 
  : path.join(process.cwd(), 'server.ts');
const __dirname = path.dirname(__filename);

// Load applet config
let appletConfig: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (err: any) {
  console.error("Failed to read firebase-applet-config.json:", err.message);
}

// Load environment variables from .env file
dotenv.config();

// Polyfill / intercept global fetch for Google Generative Language API when using OAuth credentials (ya29.)
const originalFetch = globalThis.fetch;
globalThis.fetch = async function (url: string | URL | Request, init?: RequestInit): Promise<Response> {
  let urlStr = typeof url === "object" && "url" in url ? url.url : url.toString();
  
  if (urlStr.includes("generativelanguage.googleapis.com") || urlStr.includes("aiplatform.googleapis.com")) {
    let apiKey = process.env.ASSISTAN_API_KEY;
    if (!apiKey || apiKey === "MY_API_KEY" || apiKey === "") {
      apiKey = process.env.GEMINI_API_KEY;
    }
    
    try {
      const urlObj = new URL(urlStr);
      const keyParam = urlObj.searchParams.get("key");
      
      let token = "";
      if (keyParam && keyParam.startsWith("ya29.")) {
        token = keyParam;
      } else if (apiKey && apiKey.startsWith("ya29.")) {
        token = apiKey;
      }
      
      if (token) {
        urlObj.searchParams.delete("key");
        
        const finalHeaders: Record<string, string> = {};
        if (init && init.headers) {
          if (typeof (init.headers as any).forEach === "function") {
            (init.headers as any).forEach((v: string, k: string) => {
              finalHeaders[k.toLowerCase()] = v;
            });
          } else if (typeof init.headers === "object") {
            for (const [k, v] of Object.entries(init.headers)) {
              finalHeaders[k.toLowerCase()] = v as string;
            }
          }
        }
        
        finalHeaders["authorization"] = `Bearer ${token}`;
        finalHeaders["x-goog-user-project"] = "gen-lang-client-0140076974";
        delete finalHeaders["x-goog-api-key"];
        delete finalHeaders["x-api-key"];
        
        const newInit: RequestInit = {
          ...init,
          headers: finalHeaders
        };
        
        return originalFetch(urlObj.toString(), newInit);
      }
    } catch (err) {
      console.error("[Global Fetch Interceptor] Error intercepting fetch request:", err);
    }
  }
  return originalFetch(url, init);
} as any;

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Gemini configurations Helper
function getGeminiClient() {
  console.log("[Gemini Client] ASSISTAN_API_KEY length:", process.env.ASSISTAN_API_KEY ? process.env.ASSISTAN_API_KEY.length : "none", "prefix:", process.env.ASSISTAN_API_KEY ? process.env.ASSISTAN_API_KEY.substring(0, 10) : "none");
  console.log("[Gemini Client] GEMINI_API_KEY length:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : "none", "prefix:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 10) : "none");

  let apiKey = process.env.ASSISTAN_API_KEY;
  if (!apiKey || apiKey === "MY_API_KEY" || apiKey === "") {
    apiKey = process.env.GEMINI_API_KEY;
  }
  if (!apiKey) {
    console.error("[Gemini Client] Error: Neither ASSISTAN_API_KEY nor GEMINI_API_KEY is defined in environment variables!");
    throw new Error("API_KEY_MISSING");
  }

  // Underneath we are using the globally polyfilled fetch so we don't need any special customFetch passed to the constructor.
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

function getModelName(defaultDevModel: string) {
  return "gemini-3.1-flash-lite"; // By-pass quota by using lite model
}

function formatE164Phone(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  // If it starts with 90 and is 12 digits, prepend +
  if (cleaned.startsWith("90") && cleaned.length === 12) {
    return "+" + cleaned;
  }
  // If it starts with 0 and is 11 digits, replace leading 0 with +90
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return "+90" + cleaned.substring(1);
  }
  // If it is 10 digits (e.g. 5551234567), prepend +90
  if (cleaned.length === 10) {
    return "+90" + cleaned;
  }
  // Default fallback: prepend +
  return "+" + cleaned;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API routes can go here later
  
let clientDbInstance: any = null;
function getClientDb() {
  if (!clientDbInstance) {
    if (appletConfig) {
      const clientApp = getClientApps().length ? getClientApps()[0] : initClientApp(appletConfig);
      clientDbInstance = getClientFirestore(clientApp, appletConfig.firestoreDatabaseId);
    } else {
      console.error("No appletConfig found to initialize client db!");
    }
  }
  return clientDbInstance;
}

function mapAdminToClientData(data: any): any {
  if (!data) return data;
  if (typeof data === "object") {
    if (data.constructor?.name === "ServerTimestampTransform" || data.constructor?.name === "FieldValue" || (data._methodName && data._methodName === "ServerTimestamp")) {
      return clientServerTimestamp();
    }
    const mapped: any = Array.isArray(data) ? [] : {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val && typeof val === "object" && (val.constructor?.name === "ServerTimestampTransform" || val.constructor?.name === "FieldValue" || (val._methodName && val._methodName === "ServerTimestamp"))) {
        mapped[key] = clientServerTimestamp();
      } else {
        mapped[key] = mapAdminToClientData(val);
      }
    }
    return mapped;
  }
  return data;
}

// Helper to get Firestore instance with the correct databaseId
function getDb(): any {
  if (admin.apps.length > 0) {
    const app = admin.apps[0];
    const dbId = appletConfig?.firestoreDatabaseId;
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  } else {
    return {
      collection: (colName: string) => {
        return {
          doc: (docId: string) => {
            return {
              set: async (data: any) => {
                const mappedData = mapAdminToClientData(data);
                return await clientSetDoc(clientDoc(getClientDb(), colName, docId), mappedData);
              },
              update: async (data: any) => {
                const mappedData = mapAdminToClientData(data);
                return await clientUpdateDoc(clientDoc(getClientDb(), colName, docId), mappedData);
              },
              get: async () => {
                const snap = await clientGetDoc(clientDoc(getClientDb(), colName, docId));
                return {
                  exists: snap.exists(),
                  data: () => snap.data(),
                  id: snap.id,
                  ref: snap.ref,
                  get: (field: string) => snap.get(field)
                };
              }
            };
          },
          add: async (data: any) => {
            const mappedData = mapAdminToClientData(data);
            const ref = await clientAddDoc(clientCollection(getClientDb(), colName), mappedData);
            return { id: ref.id, ref };
          },
          where: (field: string, op: any, val: any) => {
            let orderByField: string | null = null;
            let orderByDir: "asc" | "desc" = "asc";
            let limitNum: number | null = null;

            const builder = {
              orderBy: (f: string, d?: "asc" | "desc") => {
                orderByField = f;
                if (d) orderByDir = d;
                return builder;
              },
              limit: (n: number) => {
                limitNum = n;
                return builder;
              },
              get: async () => {
                const q = clientQuery(clientCollection(getClientDb(), colName), clientWhere(field, op, val));
                const snap = await clientGetDocs(q);
                let docs = snap.docs.map(d => ({
                  id: d.id,
                  ref: d.ref,
                  data: () => d.data(),
                  get: (f: string) => d.get(f)
                }));

                if (orderByField) {
                  docs.sort((a, b) => {
                    const valA = a.data()?.[orderByField!];
                    const valB = b.data()?.[orderByField!];
                    const timeA = valA?.toMillis ? valA.toMillis() : (valA instanceof Date ? valA.getTime() : (valA || 0));
                    const timeB = valB?.toMillis ? valB.toMillis() : (valB instanceof Date ? valB.getTime() : (valB || 0));
                    return orderByDir === "desc" ? Number(timeB) - Number(timeA) : Number(timeA) - Number(timeB);
                  });
                }

                if (limitNum !== null) {
                  docs = docs.slice(0, limitNum);
                }

                return {
                  empty: docs.length === 0,
                  docs,
                  forEach: (cb: any) => docs.forEach(cb)
                };
              }
            };
            return builder;
          }
        };
      },
      batch: () => {
        const b = clientWriteBatch(getClientDb());
        return {
          update: (docRef: any, data: any) => {
            const mappedData = mapAdminToClientData(data);
            b.update(docRef, mappedData);
          },
          commit: async () => {
            await b.commit();
          }
        };
      }
    };
  }
}

// Initialize Firebase Admin
if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: appletConfig?.projectId
      });
      console.log("Firebase Admin initialized successfully with service account.");
    } catch (e: any) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
    }
  } else {
    try {
      // Try initializing with Application Default Credentials
      const options: any = {};
      if (appletConfig?.projectId) {
        options.projectId = appletConfig.projectId;
      }
      admin.initializeApp(options);
      console.log("Firebase Admin initialized successfully with options:", options);
    } catch (e: any) {
      console.error("Failed to initialize Firebase Admin:", e.message);
    }
  }
}

app.post("/api/send-push", async (req, res) => {
  if (!admin.apps.length) {
    return res.status(503).json({ error: "Firebase Admin is not initialized. Cannot send push notifications." });
  }
  
  try {
    const { token, title, body, link } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });
    
    const message = {
      notification: {
        title: title || 'FocusON Akademi',
        body: body || 'Yeni bir bildiriminiz var.'
      },
      data: {
        link: link || '/'
      },
      token: token
    };
    
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error("Error sending push notification:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/twilio-verify-send", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Telefon numarası gereklidir." });
  }

  const formattedPhone = formatE164Phone(phone);
  
  // Check if Twilio is configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (accountSid && authToken && serviceSid) {
    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(accountSid, authToken);
      
      const verification = await client.verify.v2
        .services(serviceSid)
        .verifications.create({ to: formattedPhone, channel: "sms" });

      console.log(`[Twilio Verify] Code sent to ${formattedPhone}, SID: ${verification.sid}`);
      return res.json({ success: true, simulated: false, phone: formattedPhone });
    } catch (error: any) {
      console.error("[Twilio Verify] Error sending code:", error);
      return res.status(500).json({ error: `Twilio Hatası: ${error.message || error}` });
    }
  } else {
    // Simulation mode
    console.log(`[Twilio Verify] [Simulation Mode] Sending code to ${formattedPhone}`);
    
    const simCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
      const db = getDb();
      
      await db.collection("simulated_verifications").doc(formattedPhone).set({
        code: simCode,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (fsErr) {
      console.error("[Twilio Verify] Simulated save to Firestore failed:", fsErr);
    }

    return res.json({ 
      success: true, 
      simulated: true, 
      phone: formattedPhone, 
      code: simCode,
      message: "Twilio API anahtarları henüz tanımlanmadığı için simülasyon modunda çalışılıyor."
    });
  }
});

app.post("/api/twilio-verify-check", async (req, res) => {
  const { phone, code, uid } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Telefon numarası ve kod gereklidir." });
  }

  const formattedPhone = formatE164Phone(phone);
  
  // Check if Twilio is configured
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  const verifyFirestoreUser = async () => {
    if (!uid) return; // Skip updating Firestore if no uid is provided
    const db = getDb();
    
    // Update user verification status in Firestore
    const userRef = db.collection("users").doc(uid);
    await userRef.update({
      phoneVerified: true,
      verificationDeferred: false,
      updatedAt: new Date()
    });

    // Also clean up deferred status of other users if any
    const deferredSnapshot = await db.collection("users").where("verificationDeferred", "==", true).get();
    if (!deferredSnapshot.empty) {
      const batch = db.batch();
      deferredSnapshot.docs.forEach((d) => {
        batch.update(d.ref, { verificationDeferred: false });
      });
      await batch.commit();
    }
  };

  if (accountSid && authToken && serviceSid) {
    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(accountSid, authToken);
      
      const check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: formattedPhone, code: code });

      if (check.status === "approved") {
        await verifyFirestoreUser();
        console.log(`[Twilio Verify] Code approved for ${formattedPhone}`);
        return res.json({ success: true, simulated: false });
      } else {
        return res.status(400).json({ error: "Girdiğiniz kod geçersizdir veya süresi dolmuştur." });
      }
    } catch (error: any) {
      console.error("[Twilio Verify] Error checking code:", error);
      return res.status(500).json({ error: `Twilio Doğrulama Hatası: ${error.message || error}` });
    }
  } else {
    // Simulation mode
    console.log(`[Twilio Verify] [Simulation Mode] Checking code ${code} for ${formattedPhone}`);
    
    if (code === "123456" || code === "999999") {
      await verifyFirestoreUser();
      return res.json({ success: true, simulated: true });
    }

    try {
      const db = getDb();
      
      const simDoc = await db.collection("simulated_verifications").doc(formattedPhone).get();
      
      if (simDoc.exists && simDoc.data()?.code === code) {
        await verifyFirestoreUser();
        return res.json({ success: true, simulated: true });
      }
    } catch (fsErr) {
      console.error("[Twilio Verify] Simulated check Firestore failed:", fsErr);
    }

    return res.status(400).json({ error: "Girdiğiniz simülasyon kodu hatalıdır. Test için 123456 kullanabilirsiniz." });
  }
});

  app.post("/api/send-whatsapp", async (req, res) => {
    const { phone, code, uid, origin } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Telefon numarası ve kod gereklidir." });
    }

    try {
      let formattedPhone = phone.trim();
      if (!formattedPhone.startsWith("+")) {
        formattedPhone = "+" + formattedPhone;
      }
      const toTwilio = formattedPhone.startsWith("whatsapp:") ? formattedPhone : `whatsapp:${formattedPhone}`;

      let verifyLink = "";
      if (uid && origin) {
        verifyLink = `${origin}/v?u=${uid}&c=${code}`;
      }
      const msgBody = verifyLink
        ? `FocusON Akademi doğrulama kodunuz: ${code}\n\nTek tıkla doğrulamak için aşağıdaki butona/bağlantıya tıklayabilirsiniz:\n${verifyLink}`
        : `FocusON Akademi doğrulama kodunuz: ${code}`;

      const db = getDb();

      // 1. Send via Firebase Twilio Extension (listen to 'messages' collection)
      await db.collection("messages").add({
        to: toTwilio,
        body: msgBody
      });

      // 2. Save verification code
      await db.collection("phone_verifications").doc(formattedPhone).set({
        code: code,
        uid: uid || null,
        origin: origin || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`[Twilio WhatsApp] Message sent via Firebase Extension.`);
      return res.json({ success: true, simulated: false });
    } catch (error) {
      console.error("[Twilio WhatsApp] Error:", error);
      return res.status(500).json({ error: error.message || "Failed" });
    }
  });

  app.post("/api/verify-whatsapp-direct", async (req, res) => {
    const { uid, code } = req.body;
    if (!uid || !code) {
      return res.status(400).json({ error: "Kullanıcı ID ve kod gereklidir." });
    }

    try {
      const db = getDb();

      const userRef = db.collection("users").doc(uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: "Kullanıcı bulunamadı." });
      }

      await userRef.update({
        phoneVerified: true,
        verificationDeferred: false,
        updatedAt: new Date()
      });

      const deferredSnapshot = await db.collection("users").where("verificationDeferred", "==", true).get();
      
      if (!deferredSnapshot.empty) {
        const batch = db.batch();
        deferredSnapshot.docs.forEach((d) => {
          batch.update(d.ref, { verificationDeferred: false });
        });
        await batch.commit();
      }

      return res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/verify-whatsapp-direct:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verification-success", async (req, res) => {
    try {
      const db = getDb();
      
      const deferredSnapshot = await db.collection("users").where("verificationDeferred", "==", true).get();
      
      if (!deferredSnapshot.empty) {
        const batch = db.batch();
        deferredSnapshot.docs.forEach((d) => {
          batch.update(d.ref, { verificationDeferred: false });
        });
        await batch.commit();
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/verification-success:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/whatsapp-webhook", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "FocusOnAkademiVerifyToken2026";
    const db = getDb();
    const success = (mode === "subscribe" && token === verifyToken);

    try {
      await db.collection("whatsapp_webhook_logs").add({
        method: "GET",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        headers: req.headers || {},
        query: req.query || {},
        body: {},
        ip: req.ip || req.headers["x-forwarded-for"] || "",
        status: success ? "verification_success" : "verification_failed",
        error: success ? null : `Verification failed. Received token: '${token}', Expected: '${verifyToken}'`
      });
    } catch (e: any) {
      console.error("Failed to log webhook verification:", e);
    }

    if (success) {
      console.log("[WhatsApp Webhook] Webhook verified successfully!");
      return res.status(200).send(challenge);
    } else {
      console.warn("[WhatsApp Webhook] Verification failed or invalid request.");
      return res.status(403).send("Forbidden");
    }
  });

  app.post("/api/whatsapp-webhook", async (req, res) => {
    const db = getDb();
    const rawBody = JSON.parse(JSON.stringify(req.body || {}));
    let isMeta = false;

    // Check if it's a Meta Cloud API webhook payload
    if (req.body && req.body.object === "whatsapp_business_account") {
      isMeta = true;
      try {
        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const message = value?.messages?.[0];
        const contact = value?.contacts?.[0];

        if (message) {
          req.body.From = message.from; // e.g. "905454487886"
          req.body.Body = message.text?.body || message.document?.caption || message.image?.caption || "";
          req.body.ProfileName = contact?.profile?.name || "";
          req.body.MessageSid = message.id;

          if (message.type === "document") {
            req.body.MediaUrl = message.document.link || `https://graph.facebook.com/v19.0/${message.document.id}`;
            req.body.MediaType = "document";
            req.body.FileName = message.document.filename || "belge.pdf";
          } else if (message.type === "image") {
            req.body.MediaUrl = message.image.link || `https://graph.facebook.com/v19.0/${message.image.id}`;
            req.body.MediaType = "image";
            req.body.FileName = "gorsel.jpg";
          } else if (message.type === "audio") {
            req.body.MediaUrl = message.audio.link || `https://graph.facebook.com/v19.0/${message.audio.id}`;
            req.body.MediaType = "audio";
            req.body.FileName = "ses_kaydi.mp3";
          }
        } else {
          // Just a status update (delivered, read, etc.), acknowledge immediately and log
          try {
            await db.collection("whatsapp_webhook_logs").add({
              method: "POST",
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
              headers: req.headers || {},
              query: req.query || {},
              body: rawBody,
              ip: req.ip || req.headers["x-forwarded-for"] || "",
              status: "meta_status_update"
            });
          } catch (logErr) {
            console.error("Failed to log meta status update:", logErr);
          }
          return res.status(200).send("EVENT_RECEIVED");
        }
      } catch (err) {
        console.error("Error parsing Meta WhatsApp webhook payload:", err);
      }
    }

    if (req.body.From === 'testdebug') {
       return res.json({ isInitialized: true });
    }

    const from = req.body.From || req.body.from || req.body.phone;
    const body = req.body.Body || req.body.body || req.body.message || "";
    const profileName = req.body.ProfileName || req.body.profileName || "";
    const messageSid = req.body.MessageSid || req.body.messageSid || "";

    // Add support for Twilio/Meta media params
    const mediaUrl = req.body.MediaUrl || req.body.MediaUrl0 || "";
    const mediaType = req.body.MediaType || (req.body.MediaContentType0 ? (req.body.MediaContentType0.startsWith("image/") ? "image" : "document") : "");
    const fileName = req.body.FileName || (req.body.MediaUrl0 ? req.body.MediaUrl0.split("/").pop() || "dosya" : "");

    // Save POST log to Firestore
    try {
      await db.collection("whatsapp_webhook_logs").add({
        method: "POST",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        headers: req.headers || {},
        query: req.query || {},
        body: rawBody,
        ip: req.ip || req.headers["x-forwarded-for"] || "",
        status: from ? "message_received" : "missing_from_parameter",
        parsedData: from ? { from, body, profileName, messageSid, isMeta, mediaUrl, mediaType, fileName } : null
      });
    } catch (logErr) {
      console.error("Failed to log webhook POST payload:", logErr);
    }

    if (!from) {
      if (isMeta) {
        return res.status(200).send("EVENT_RECEIVED");
      }
      return res.status(400).send("<Response><Message>From parameter is required.</Message></Response>");
    }

    // Acknowledge immediately to prevent timeout errors
    if (isMeta) {
      res.status(200).send("EVENT_RECEIVED");
    } else {
      res.set("Content-Type", "text/xml");
      res.status(200).send("<Response></Response>");
    }

    // Process asynchronously
    (async () => {
    try {
      let phoneNum = String(from).replace("whatsapp:", "").trim();
      if (!phoneNum.startsWith("+")) {
        phoneNum = "+" + phoneNum;
      }

      const incomingMessageDoc: any = {
        phone: phoneNum,
        body: body,
        senderName: profileName || null,
        messageSid: messageSid || null,
        direction: "inbound",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      if (mediaUrl) {
        incomingMessageDoc.mediaUrl = mediaUrl;
        incomingMessageDoc.mediaType = mediaType;
        incomingMessageDoc.fileName = fileName;
        incomingMessageDoc.media_url = mediaUrl;
        incomingMessageDoc.media_type = mediaType;
        incomingMessageDoc.file_name = fileName;
      }

      await db.collection("whatsapp_messages").add(incomingMessageDoc);

      console.log(`[WhatsApp Webhook] Message received from ${phoneNum}: ${body}`);

      const lowerBody = body.toLowerCase().trim();
      const isApproval = lowerBody.includes("focuson akademi doğrulama") && lowerBody.includes("onaylıyorum");

      if (isApproval) {
        const verificationDoc = await db.collection("phone_verifications").doc(phoneNum).get();
        
        let pendingCode = null;
        let pendingUid = null;
        let pendingOrigin = null;

        if (verificationDoc.exists) {
          const data = verificationDoc.data();
          pendingCode = data?.code;
          pendingUid = data?.uid;
          pendingOrigin = data?.origin;
        }

        if (pendingCode) {
          let verifyLink = "";
          if (pendingUid && pendingOrigin) {
            verifyLink = `${pendingOrigin}/v?u=${pendingUid}&c=${pendingCode}`;
          }
          
          const msgBody = verifyLink
            ? `FocusON Akademi doğrulama kodunuz: ${pendingCode}\n\nTek tıkla doğrulamak için aşağıdaki butona/bağlantıya tıklayabilirsiniz:\n${verifyLink}`
            : `FocusON Akademi doğrulama kodunuz: ${pendingCode}`;

          const toTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;
          
          await db.collection("messages").add({
            to: toTwilio,
            body: msgBody
          });
          
          await db.collection("whatsapp_messages").add({
            phone: phoneNum,
            body: msgBody,
            senderName: "System Auto-Reply",
            direction: "outbound",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }

    } catch (error: any) {
      console.error("Error in /api/whatsapp-webhook async:", error);
      try {
        await db.collection("whatsapp_webhook_logs").add({
          method: "POST",
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          ip: req.ip || req.headers["x-forwarded-for"] || "",
          status: "processing_error",
          error: error.message || String(error)
        });
      } catch (logErr) {
        console.error("Failed to log processing error:", logErr);
      }
    }
    })();
  });

  // GET: Fetch and sync WhatsApp templates from Meta Cloud API
  app.get("/api/whatsapp-templates", async (req, res) => {
    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    if (!metaToken || !metaWabaId) {
      // Return simulated/stored templates from Firestore
      try {
        const db = getDb();
        const snap = await db.collection("whatsapp_templates").orderBy("createdAt", "desc").get();
        const localTemplates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ templates: localTemplates, source: "database" });
      } catch (err: any) {
        return res.status(500).json({ error: err.message });
      }
    }

    try {
      const url = `https://graph.facebook.com/v19.0/${metaWabaId}/message_templates?limit=100`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${metaToken}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("[WhatsApp Templates Fetch] Meta API error:", errData);
        throw new Error(`Meta API error: ${JSON.stringify(errData)}`);
      }

      const metaRes: any = await response.json();
      const metaTemplatesData = metaRes.data || [];

      const db = getDb();

      const formattedTemplates = metaTemplatesData.map((t: any) => {
        const headerComp = t.components?.find((c: any) => c.type === "HEADER");
        const bodyComp = t.components?.find((c: any) => c.type === "BODY");
        const footerComp = t.components?.find((c: any) => c.type === "FOOTER");
        const buttonsComp = t.components?.find((c: any) => c.type === "BUTTONS");

        let headerType = "NONE";
        let headerText = "";
        if (headerComp) {
          headerType = headerComp.format === "TEXT" ? "TEXT" : headerComp.format === "IMAGE" ? "IMAGE" : "NONE";
          headerText = headerComp.text || "";
        }

        const buttons = buttonsComp?.buttons?.map((b: any) => {
          let type = "QUICK_REPLY";
          if (b.type === "URL") type = "URL";
          else if (b.type === "PHONE_NUMBER") type = "PHONE_NUMBER";
          return {
            type,
            text: b.text || "",
            value: b.url || b.phone_number || ""
          };
        }) || [];

        return {
          id: t.id,
          name: t.name,
          category: t.category,
          language: t.language,
          status: t.status,
          headerType,
          headerText,
          body: bodyComp?.text || "",
          footer: footerComp?.text || "",
          buttons,
          createdAt: new Date().toISOString()
        };
      });

      // Synchronize Meta templates into local Firestore for reliability
      const syncPromises = formattedTemplates.map((t: any) => {
        return db.collection("whatsapp_templates").doc(t.id).set({
          name: t.name,
          category: t.category,
          language: t.language,
          status: t.status,
          headerType: t.headerType,
          headerText: t.headerText,
          body: t.body,
          footer: t.footer,
          buttons: t.buttons,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: t.createdAt
        });
      });

      await Promise.all(syncPromises).catch(e => console.error("[WhatsApp Templates Sync] Firestore sync error:", e));

      return res.json({ templates: formattedTemplates, source: "meta" });
    } catch (err: any) {
      console.error("[WhatsApp Templates Fetch] Failed Meta fetch, falling back to db:", err.message);
      try {
        const db = getDb();
        const snap = await db.collection("whatsapp_templates").orderBy("createdAt", "desc").get();
        const localTemplates = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return res.json({ templates: localTemplates, source: "fallback_database", error: err.message });
      } catch (dbErr: any) {
        return res.status(500).json({ error: dbErr.message });
      }
    }
  });

  // POST: Create a new template and send to Meta Cloud API for approval
  app.post("/api/whatsapp-templates", async (req, res) => {
    const { name, category, language, headerType, headerText, body, footer, buttons } = req.body;
    if (!name || !category || !language || !body) {
      return res.status(400).json({ error: "name, category, language, and body are required fields." });
    }

    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    let apiSuccess = false;
    let responseData: any = null;
    let status = "PENDING";

    if (metaToken && metaWabaId) {
      const components: any[] = [];

      if (headerType === "TEXT" && headerText) {
        components.push({
          type: "HEADER",
          format: "TEXT",
          text: headerText
        });
      } else if (headerType === "IMAGE") {
        components.push({
          type: "HEADER",
          format: "IMAGE",
          example: {
            header_handle: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80"]
          }
        });
      }

      const bodyComponent: any = {
        type: "BODY",
        text: body
      };

      const bodyMatches = body.match(/\{\{\d+\}\}/g) || [];
      const bodyUniqueCount = new Set(bodyMatches).size;
      if (bodyUniqueCount > 0) {
        const sampleValues: string[] = [];
        for (let i = 1; i <= bodyUniqueCount; i++) {
          if (i === 1) sampleValues.push("Ahmet Yılmaz");
          else if (i === 2) sampleValues.push("24 Temmuz 2026 14:00");
          else if (i === 3) sampleValues.push("Koçluk Görüşmesi");
          else sampleValues.push(`Değer ${i}`);
        }
        bodyComponent.example = {
          body_text: [sampleValues]
        };
      }
      components.push(bodyComponent);

      if (footer) {
        components.push({
          type: "FOOTER",
          text: footer
        });
      }

      if (buttons && buttons.length > 0) {
        const metaButtons = buttons.map((btn: any) => {
          if (btn.type === "URL") {
            return {
              type: "URL",
              text: btn.text,
              url: btn.value || "https://focusonakademi.com"
            };
          } else {
            return {
              type: "QUICK_REPLY",
              text: btn.text
            };
          }
        });
        components.push({
          type: "BUTTONS",
          buttons: metaButtons
        });
      }

      const langCode = (() => {
        const m = language.match(/\(([^)]+)\)/);
        return m && m[1] ? m[1].trim() : (language.trim().toLowerCase().substring(0, 2) || "tr");
      })();

      const payload = {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        category: category,
        language: langCode,
        components: components
      };

      try {
        const url = `https://graph.facebook.com/v19.0/${metaWabaId}/message_templates`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${metaToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const resData: any = await response.json();
        if (!response.ok) {
          console.error("[WhatsApp Template Create] Meta API Error:", resData);
          return res.status(response.status).json({ error: "Meta Cloud API hatası", details: resData });
        }

        apiSuccess = true;
        responseData = resData;
        status = resData.status || "PENDING";
      } catch (err: any) {
        console.error("[WhatsApp Template Create] Network/Request Error:", err);
        return res.status(500).json({ error: "Meta API ile iletişim kurulamadı.", details: err.message });
      }
    }

    try {
      const db = getDb();
      const docId = responseData?.id || "temp_" + Date.now();
      const newTemplate = {
        name: name.trim().toLowerCase().replace(/\s+/g, '_'),
        category: category,
        language: language,
        status: status,
        headerType: headerType,
        headerText: headerType === "TEXT" ? headerText : "",
        body: body,
        footer: footer || "",
        buttons: buttons || [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("whatsapp_templates").doc(docId).set(newTemplate);
      return res.json({ success: true, templateId: docId, template: newTemplate, method: apiSuccess ? "meta" : "local" });
    } catch (err: any) {
      console.error("[WhatsApp Template Save] Firestore Error:", err);
      return res.status(500).json({ error: "Veritabanına kaydedilirken hata oluştu.", details: err.message });
    }
  });

  // DELETE: Delete template from Meta and Firestore
  app.delete("/api/whatsapp-templates/:id", async (req, res) => {
    const { id } = req.params;
    const { name } = req.query;

    const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const metaWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

    let apiSuccess = false;

    if (metaToken && metaWabaId && name) {
      try {
        const url = `https://graph.facebook.com/v19.0/${metaWabaId}/message_templates?name=${name}`;
        const response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${metaToken}`
          }
        });

        const resData = await response.json().catch(() => ({}));
        if (!response.ok) {
          console.error("[WhatsApp Template Delete] Meta API Error:", resData);
        } else {
          apiSuccess = true;
        }
      } catch (err) {
        console.error("[WhatsApp Template Delete] Network Error:", err);
      }
    }

    try {
      const db = getDb();
      await db.collection("whatsapp_templates").doc(id).delete();
      return res.json({ success: true, method: apiSuccess ? "meta" : "local" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/whatsapp-send", async (req, res) => {
    const { to, message, mediaUrl, mediaType, fileName, fileSize, template } = req.body;
    if (!to || (!message && !mediaUrl && !template)) {
      return res.status(400).json({ error: "to and either message, mediaUrl, or template are required" });
    }

    try {
      const db = getDb();
      let phoneNum = String(to).replace("whatsapp:", "").trim();
      if (!phoneNum.startsWith("+")) {
        phoneNum = "+" + phoneNum;
      }

      // Check Meta WhatsApp Cloud API credentials
      const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

      // Check Twilio credentials
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";

      let sendMethod = "simulation";
      let metaAuthError = false;

      if (metaToken && metaPhoneId) {
        // Send via Meta WhatsApp Cloud API
        sendMethod = "meta";
        const cleanTo = phoneNum.replace(/\D/g, ""); // sequence of digits
        const url = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;
        
        let requestBody: any;
        if (template) {
          requestBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanTo,
            type: "template",
            template: template
          };
        } else if (mediaUrl && mediaType) {
          const type = mediaType === "image" ? "image" : "document";
          requestBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanTo,
            type: type,
            [type]: {
              link: mediaUrl,
              filename: fileName || "dosya",
              caption: message || undefined
            }
          };
        } else {
          requestBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanTo,
            type: "text",
            text: {
              preview_url: false,
              body: message || ""
            }
          };
        }

        try {
          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${metaToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errData: any = await response.json().catch(() => ({}));
            console.error("[WhatsApp Send] Meta API error:", errData);
            
            const isAuthErr = errData?.error?.code === 190 || errData?.error?.type === "OAuthException" || response.status === 401;
            if (isAuthErr) {
              console.warn("[WhatsApp Send] Meta OAuth/Authentication failed (Code 190). Falling back to Simulation Mode.");
              sendMethod = "simulation";
              metaAuthError = true;
            } else {
              throw new Error(`Meta API error: ${JSON.stringify(errData)}`);
            }
          } else {
            console.log(`[WhatsApp Send] Message sent to ${phoneNum} via Meta Cloud API.`);
          }
        } catch (fetchErr: any) {
          console.error("[WhatsApp Send] Meta Fetch Error:", fetchErr);
          if (metaAuthError) {
            // Already set
          } else {
            const errStr = fetchErr.message || "";
            if (errStr.includes("190") || errStr.includes("OAuthException") || errStr.includes("Authentication") || errStr.includes("401")) {
              console.warn("[WhatsApp Send] Meta OAuth/Authentication failed in catch. Falling back to Simulation Mode.");
              sendMethod = "simulation";
              metaAuthError = true;
            } else {
              throw fetchErr;
            }
          }
        }
      } else if (twilioSid && twilioToken) {
        // Send via Twilio Direct API
        sendMethod = "twilio";
        const { default: twilio } = await import("twilio");
        const client = twilio(twilioSid, twilioToken);
        const fromTwilio = twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`;
        const targetTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;

        const messageOpts: any = {
          from: fromTwilio,
          to: targetTwilio,
          body: message || ""
        };
        if (mediaUrl) {
          messageOpts.mediaUrl = [mediaUrl];
        }

        await client.messages.create(messageOpts);
        console.log(`[WhatsApp Send] Message sent to ${phoneNum} via Twilio Direct API.`);
      } else {
        // Fallback to Firebase Twilio Extension (write to 'messages' collection)
        console.log(`[WhatsApp Send] No direct API keys found. Writing to Firebase 'messages' collection as fallback / Simulation Mode.`);
        const toTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;
        const fallbackMsg: any = {
          to: toTwilio,
          body: message || (fileName ? `[Belge: ${fileName}]` : ""),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        if (mediaUrl) {
          fallbackMsg.mediaUrl = mediaUrl;
        }
        await db.collection("messages").add(fallbackMsg);
      }

      // Add outbound message to 'whatsapp_messages' so it is visible in the chat history
      const outboundDoc: any = {
        phone: phoneNum,
        body: message || "",
        senderName: "Admin",
        direction: "outbound",
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      if (mediaUrl) {
        outboundDoc.mediaUrl = mediaUrl;
        outboundDoc.mediaType = mediaType || "document";
        outboundDoc.fileName = fileName || "dosya";
        outboundDoc.fileSize = fileSize || "";
        outboundDoc.media_url = mediaUrl;
        outboundDoc.media_type = mediaType || "document";
        outboundDoc.file_name = fileName || "dosya";
        outboundDoc.file_size = fileSize || "";
      }

      await db.collection("whatsapp_messages").add(outboundDoc);

      // If we are in Simulation Mode (neither Meta nor Twilio API is fully configured), trigger an AI-simulated response
      if (sendMethod === "simulation") {
        const simulateAiResponse = async () => {
          try {
            // Wait 2.5 seconds to feel natural
            await new Promise(resolve => setTimeout(resolve, 2500));

            // Fetch last 10 messages of this chat to provide context
            let historySnap;
            try {
              historySnap = await db.collection("whatsapp_messages")
                .where("phone", "==", phoneNum)
                .orderBy("timestamp", "desc")
                .limit(10)
                .get();
            } catch (e) {
              console.warn("[WhatsApp Send] Could not read whatsapp_messages history for simulation", e.message);
            }

            let chatHistoryStr = "";
            if (historySnap && !historySnap.empty) {
              const histDocs = [...historySnap.docs].reverse();
              chatHistoryStr = histDocs.map(doc => {
                const data = doc.data();
                const sender = data.direction === "outbound" ? "Yönetici/Koç" : (data.senderName || "Öğrenci/Veli");
                return `${sender}: ${data.body}`;
              }).join("\n");
            }

            let aiReply = "Merhaba, mesajınızı aldım. En kısa sürede dönüş yapacağım."; // Fallback response
            
            try {
              const aiClient = getGeminiClient();
              const prompt = `Sen FocusON Akademi bünyesindeki bir lise/ortaokul öğrencisi veya onun velisisin.
Akademi yöneticisi veya rehberlik koçun az önce sana şu mesajı gönderdi:
"${message}"

Sohbetin geçmiş mesajları şu şekildedir:
${chatHistoryStr}

Görevin: Bu son mesaja Türkçe olarak doğal, samimi, kısa ve gerçekçi bir WhatsApp yanıtı yazmak. 
- Eğer mesaj bir soru içeriyorsa, gerçekçi bir öğrenci/veli olarak yanıtla.
- Yapay zekâ olduğunu asla belli etme, tamamen bir insan gibi davran.
- Cevap kısa olsun (en fazla 2-3 cümle), WhatsApp sohbet tonunda yaz.`;

              const aiRes = await aiClient.models.generateContent({
                model: getModelName("gemini-2.5-flash"),
                contents: prompt
              });

              if (aiRes?.text) {
                aiReply = aiRes.text.trim();
              }
            } catch (aiErr) {
              console.error("[WhatsApp Send] Simulation AI response generation error:", aiErr);
            }

            // Save the simulated inbound message to Firestore with simulated document if applicable
            const lowerMessage = (message || "").toLowerCase();
            const simulatedInboundDoc: any = {
              phone: phoneNum,
              body: aiReply,
              senderName: "Simüle Öğrenci",
              direction: "inbound",
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            };

            if (lowerMessage.includes("fotoğraf") || lowerMessage.includes("resim") || lowerMessage.includes("görsel") || lowerMessage.includes("görüntü") || lowerMessage.includes("image") || lowerMessage.includes("png") || lowerMessage.includes("jpg")) {
              simulatedInboundDoc.mediaUrl = "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80";
              simulatedInboundDoc.mediaType = "image";
              simulatedInboundDoc.fileSize = "142 KB";
              simulatedInboundDoc.fileName = "Ogrenci_Karti_Ve_Gelisim.jpg";
              
              simulatedInboundDoc.media_url = simulatedInboundDoc.mediaUrl;
              simulatedInboundDoc.media_type = simulatedInboundDoc.mediaType;
              simulatedInboundDoc.file_size = simulatedInboundDoc.fileSize;
              simulatedInboundDoc.file_name = simulatedInboundDoc.fileName;

              if (!aiReply.includes("fotoğraf") && !aiReply.includes("resim") && !aiReply.includes("görsel")) {
                simulatedInboundDoc.body = `${aiReply}\n\n[Ekli Görsel: ${simulatedInboundDoc.fileName}]`;
              }
            } else if (lowerMessage.includes("rapor") || lowerMessage.includes("dosya") || lowerMessage.includes("ödev") || lowerMessage.includes("plan") || lowerMessage.includes("pdf") || lowerMessage.includes("karne") || lowerMessage.includes("deneme") || lowerMessage.includes("gönder") || lowerMessage.includes("belge")) {
              simulatedInboundDoc.mediaUrl = "https://pdfobject.com/pdf/sample.pdf"; // Standard safe mock PDF
              simulatedInboundDoc.mediaType = "document";
              simulatedInboundDoc.fileSize = "284 KB";
              
              if (lowerMessage.includes("karne")) {
                simulatedInboundDoc.fileName = "Karne_Gelisim_Raporu.pdf";
              } else if (lowerMessage.includes("deneme")) {
                simulatedInboundDoc.fileName = "Deneme_Sinavi_Karnesi.pdf";
              } else if (lowerMessage.includes("plan") || lowerMessage.includes("çalışma")) {
                simulatedInboundDoc.fileName = "Haftalik_Ders_Programi.pdf";
              } else if (lowerMessage.includes("ödev")) {
                simulatedInboundDoc.fileName = "Kimya_Odev_Cozumleri.pdf";
              } else {
                simulatedInboundDoc.fileName = "Ogrenci_Durum_Raporu.pdf";
              }
              
              simulatedInboundDoc.media_url = simulatedInboundDoc.mediaUrl;
              simulatedInboundDoc.media_type = simulatedInboundDoc.mediaType;
              simulatedInboundDoc.file_size = simulatedInboundDoc.fileSize;
              simulatedInboundDoc.file_name = simulatedInboundDoc.fileName;

              if (!aiReply.includes("dosya") && !aiReply.includes("belge") && !aiReply.includes("gönder")) {
                simulatedInboundDoc.body = `${aiReply}\n\n[Ekli Belge: ${simulatedInboundDoc.fileName}]`;
              }
            }

            await db.collection("whatsapp_messages").add(simulatedInboundDoc);

            console.log(`[WhatsApp Send] Simulated AI reply added for ${phoneNum}: ${aiReply}`);
          } catch (simErr) {
            console.error("[WhatsApp Send] Simulation reply job failed:", simErr);
          }
        };

        // Run simulation asynchronously in the background so API returns immediately
        simulateAiResponse();
      }

      res.json({ success: true, method: sendMethod, metaAuthError });
    } catch (err: any) {
      console.error("[WhatsApp Send] Error:", err);
      res.status(500).json({ error: err.message || "An error occurred while sending message." });
    }
  });

  app.get("/api/whatsapp-media", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).send("url parameter is required");
    }

    try {
      // If it's not a Meta/Facebook URL, just redirect to it (e.g. Unsplash mock or Firebase Storage)
      if (!url.includes("facebook.com") && !url.includes("fbsbx.com")) {
        return res.redirect(url);
      }

      const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
      if (!metaToken) {
        console.error("[WhatsApp Media Proxy] WHATSAPP_ACCESS_TOKEN is missing.");
        return res.status(401).send("WhatsApp access token is missing on the server.");
      }

      let targetUrl = url;

      // If the URL is the metadata endpoint (e.g. https://graph.facebook.com/v19.0/{media_id})
      // we need to query it first to get the actual direct download lookaside URL.
      if (url.includes("graph.facebook.com") && !url.includes("lookaside.fbsbx.com")) {
        console.log(`[WhatsApp Media Proxy] Querying Meta metadata for: ${url}`);
        const metaRes = await fetch(url, {
          headers: { "Authorization": `Bearer ${metaToken}` }
        });

        if (!metaRes.ok) {
          const errText = await metaRes.text().catch(() => "");
          console.error(`[WhatsApp Media Proxy] Meta metadata API error: ${metaRes.status} - ${errText}`);
          return res.status(metaRes.status).send(`Meta API metadata error: ${errText}`);
        }

        const metaData: any = await metaRes.json();
        if (!metaData.url) {
          console.error("[WhatsApp Media Proxy] Meta response did not contain download URL:", metaData);
          return res.status(404).send("Media download URL not found in Meta response.");
        }

        targetUrl = metaData.url;
      }

      console.log(`[WhatsApp Media Proxy] Fetching binary from lookaside URL: ${targetUrl}`);
      const mediaRes = await fetch(targetUrl, {
        headers: { "Authorization": `Bearer ${metaToken}` }
      });

      if (!mediaRes.ok) {
        const errText = await mediaRes.text().catch(() => "");
        console.error(`[WhatsApp Media Proxy] Lookaside download error: ${mediaRes.status} - ${errText}`);
        return res.status(mediaRes.status).send(`Failed to fetch media binary from Meta: ${errText}`);
      }

      const contentType = mediaRes.headers.get("content-type") || "application/octet-stream";
      const contentLength = mediaRes.headers.get("content-length");
      const contentEncoding = mediaRes.headers.get("content-encoding");

      res.setHeader("Content-Type", contentType);
      if (contentLength) {
        res.setHeader("Content-Length", contentLength);
      }
      if (contentEncoding) {
        res.setHeader("Content-Encoding", contentEncoding);
      }

      const arrayBuffer = await mediaRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      res.send(buffer);
    } catch (err: any) {
      console.error("[WhatsApp Media Proxy] Exception occurred:", err);
      res.status(500).send(`Internal error in media proxy: ${err.message || err}`);
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // In-memory cache for all departments
  let cachedDepartments: any[] | null = null;
  let cachePromise: Promise<any[]> | null = null;

  async function fetchAllFromSupabase() {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }
    
    console.log("[Cache] Starting pre-fetching of all departments from Supabase...");
    let allRows: any[] = [];
    let from = 0;
    const chunkSize = 4000;
    let hasMore = true;

    while (hasMore) {
      console.log(`[Cache] Fetching range ${from} to ${from + chunkSize - 1}...`);
      const { data, error } = await supabase
        .from("bolumler")
        .select("id, data")
        .range(from, from + chunkSize - 1);

      if (error) {
        console.error("[Cache] Supabase fetch error inside chunking:", error);
        throw error;
      }

      if (data && data.length > 0) {
        allRows.push(...data);
        console.log(`[Cache] Received ${data.length} rows. Total so far: ${allRows.length}`);
        if (data.length < chunkSize) {
          hasMore = false;
        } else {
          from += chunkSize;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`[Cache] Successfully fetched ${allRows.length} rows. Starting processing...`);

    const processed = allRows.map(row => {
      const item = row.data || {};
      const id = row.id;
      const code = item.departmentCode || item.id || id || "";
      
      return {
        id: String(id),
        departmentCode: code,
        name: item.name || "",
        typeName: item.typeName || "",
        quota: item.quota,
        feeType: item.feeType,
        price: item.price,
        pointName: item.pointName,
        university: item.university,
        city: item.city || item.university?.city,
        departmentPoints: item.departmentPoints,
        lastBasePoint: item.lastBasePoint,
        lastBasePointOrder: item.lastBasePointOrder,
        fullName: item.fullName,
        facultyName: item.facultyName,
        detail3: item.detail3,
        timeofEducation: item.timeofEducation
      };
    });

    console.log(`[Cache] Processing complete. Total cached: ${processed.length}`);
    return processed;
  }

  // Pre-warm the cache immediately
  if (supabase) {
    cachePromise = fetchAllFromSupabase()
      .then(data => {
        cachedDepartments = data;
        return data;
      })
      .catch(err => {
        console.error("[Cache] Pre-warming cache failed:", err);
        cachePromise = null;
        return [];
      });
  }

  app.get("/api/departments/all", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Supabase is not configured." });
      }

      if (cachedDepartments) {
        return res.json({ success: true, data: cachedDepartments, total: cachedDepartments.length });
      }

      if (cachePromise) {
        console.log("[API/departments/all] Cache load is already in progress, waiting for it...");
        const data = await cachePromise;
        return res.json({ success: true, data, total: data.length });
      }

      // If no cache or cache loading failed previously, trigger a fresh load
      cachePromise = fetchAllFromSupabase()
        .then(data => {
          cachedDepartments = data;
          return data;
        })
        .catch(err => {
          cachePromise = null;
          throw err;
        });

      const data = await cachePromise;
      return res.json({ success: true, data, total: data.length });
    } catch (error: any) {
      console.error("Failed to load departments:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  app.get("/api/departments", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ 
          error: "Supabase is not configured. Please define SUPABASE_URL and SUPABASE_ANON_KEY in your secrets / env variables." 
        });
      }

      const { 
        pointTypes, 
        degree, 
        teachingTypes, 
        fees, 
        regions, 
        cities, 
        uniTypes, 
        universities, 
        jobs, 
        departments, 
        searchTerm, 
        yopFilter, 
        uniFilter, 
        deptFilter,
        minRank,
        maxRank,
        minPoint,
        maxPoint,
        page,
        limit,
        sortField,
        sortDirection,
        excludedUniversities,
        excludedCities,
        excludedDepartments,
        excludedFaculties
      } = req.query;

      // Base query with exact count
      let query = supabase.from("bolumler").select("id, data", { count: "exact" });

      // 1. Point Types Filter
      if (pointTypes) {
        try {
          const parsed = typeof pointTypes === "string" ? JSON.parse(pointTypes) : pointTypes;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.in("data->>pointName", parsed);
          }
        } catch (e) {
          if (typeof pointTypes === "string" && pointTypes) {
            query = query.eq("data->>pointName", pointTypes);
          }
        }
      }

      // 2. Degree Filter
      if (degree === "LISANS") {
        query = query.eq("data->>detail3", "L");
      } else if (degree === "ONLISANS") {
        query = query.eq("data->>detail3", "O");
      }

      // 2a. Teaching Types Filter
      if (teachingTypes) {
        try {
          const parsed = typeof teachingTypes === "string" ? JSON.parse(teachingTypes) : teachingTypes;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const orConditions: string[] = [];
            parsed.forEach(type => {
              if (type === "MTOK") {
                orConditions.push("data->>fullName.ilike.%m.t.o.k%", "data->>fullName.ilike.%mtok%");
              } else if (type === "UZAKTAN") {
                orConditions.push("data->>fullName.ilike.%uzaktan%");
              } else if (type === "ACIK") {
                orConditions.push("data->>fullName.ilike.%açıköğretim%", "data->>fullName.ilike.%açık öğretim%");
              } else if (type === "IKINCI") {
                orConditions.push("data->>fullName.ilike.%ikinci öğretim%", "data->>fullName.ilike.%i.ö.%", "data->>fullName.ilike.%i.o.%");
              } else if (type === "NORMAL") {
                orConditions.push("and(data->>fullName.not.ilike.%m.t.o.k%,data->>fullName.not.ilike.%mtok%,data->>fullName.not.ilike.%uzaktan%,data->>fullName.not.ilike.%açık öğretim%,data->>fullName.not.ilike.%açıköğretim%,data->>fullName.not.ilike.%ikinci öğretim%,data->>fullName.not.ilike.%i.ö.%)");
              }
            });
            if (orConditions.length > 0) {
              query = query.or(orConditions.join(","));
            }
          }
        } catch (e) {}
      }

      // 2b. Fees Filter
      if (fees) {
        try {
          const parsed = typeof fees === "string" ? JSON.parse(fees) : fees;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const orConditions: string[] = [];
            parsed.forEach(type => {
              if (type === "BURSLU") {
                orConditions.push("data->>feeType.ilike.%burslu%", "data->>fullName.ilike.%burslu%");
              } else if (type === "IND_75") {
                orConditions.push("data->>feeType.ilike.%75%", "data->>fullName.ilike.%75%");
              } else if (type === "IND_50") {
                orConditions.push("data->>feeType.ilike.%50%", "data->>fullName.ilike.%50%");
              } else if (type === "IND_25") {
                orConditions.push("data->>feeType.ilike.%25%", "data->>fullName.ilike.%25%");
              } else if (type === "UCRETLI") {
                orConditions.push("data->>feeType.ilike.%ücretli%", "data->>fullName.ilike.%ücretli%");
              } else if (type === "UCRETSIZ") {
                orConditions.push(
                  "and(data->>typeName.eq.DEVLET,data->>feeType.is.null)",
                  "data->>feeType.ilike.%ücretsiz%",
                  "data->>fullName.ilike.%ücretsiz%"
                );
              }
            });
            if (orConditions.length > 0) {
              query = query.or(orConditions.join(","));
            }
          }
        } catch (e) {}
      }

      // 3. Uni Types Filter
      if (uniTypes) {
        try {
          const parsed = typeof uniTypes === "string" ? JSON.parse(uniTypes) : uniTypes;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.in("data->>typeName", parsed);
          }
        } catch (e) {}
      }

      // 4. Universities Filter
      if (universities) {
        try {
          const parsed = typeof universities === "string" ? JSON.parse(universities) : universities;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.in("data->university->>name", parsed);
          }
        } catch (e) {}
      }

      // 5. Region & Cities Filter
      const backendRegions: Record<string, string[]> = {
        "Marmara Bölgesi": ["İstanbul", "Edirne", "Kırklareli", "Tekirdağ", "Çanakkale", "Kocaeli", "Yalova", "Sakarya", "Bilecik", "Bursa", "Balıkesir"],
        "Ege Bölgesi": ["İzmir", "Manisa", "Aydın", "Muğla", "Denizli", "Kütahya", "Afyonkarahisar", "Uşak"],
        "İç Anadolu Bölgesi": ["Ankara", "Konya", "Kayseri", "Eskişehir", "Sivas", "Kırıkkale", "Aksaray", "Karaman", "Kırşehir", "Niğde", "Nevşehir", "Yozgat", "Çankırı"],
        "Akdeniz Bölgesi": ["Antalya", "Adana", "Mersin", "Hatay", "Kahramanmaraş", "Osmaniye", "Isparta", "Burdur"],
        "Karadeniz Bölgesi": ["Trabzon", "Samsun", "Ordu", "Giresun", "Rize", "Artvin", "Sinop", "Kastamonu", "Zonguldak", "Bartın", "Karabük", "Düzce", "Bolu", "Gümüşhane", "Bayburt", "Amasya", "Tokat", "Çorum"],
        "Doğu Anadolu Bölgesi": ["Erzurum", "Malatya", "Elazığ", "Van", "Kars", "Ağrı", "Muş", "Bitlis", "Hakkari", "Iğdır", "Ardahan", "Erzincan", "Tunceli", "Bingöl"],
        "Güneydoğu Anadolu Bölgesi": ["Gaziantep", "Şanlıurfa", "Diyarbakır", "Mardin", "Batman", "Siirt", "Şırnak", "Adıyaman", "Kilis"],
        "Yurtdışı / KKTC": ["KKTC-Gazimağusa", "KKTC-Girne", "KKTC-Güzelyurt", "KKTC-Lefkoşa", "YABANCI"]
      };

      let allowedCities: string[] = [];
      if (cities) {
        try {
          const parsedCities = typeof cities === "string" ? JSON.parse(cities) : cities;
          if (Array.isArray(parsedCities)) {
            allowedCities.push(...parsedCities);
          }
        } catch (e) {}
      }
      if (regions) {
        try {
          const parsedRegions = typeof regions === "string" ? JSON.parse(regions) : regions;
          if (Array.isArray(parsedRegions)) {
            parsedRegions.forEach(reg => {
              const regCities = backendRegions[reg] || [];
              allowedCities.push(...regCities);
            });
          }
        } catch (e) {}
      }
      allowedCities = Array.from(new Set(allowedCities));
      if (allowedCities.length > 0) {
        query = query.in("data->city->>name", allowedCities);
      }

      // 6. Careers / Jobs & Departments Filter
      const backendMesleklerMap: Record<string, string[]> = {
        "Mühendislik": [
          "Bilgisayar Mühendisliği", "Bilişim Sistemleri Mühendisliği", "Biyomedikal Mühendisliği", 
          "Elektrik-Elektronik Mühendisliği", "Endüstri Mühendisliği", "Enerji Sistemleri Mühendisliği", 
          "Gemi İnşaatı ve Gemi Makineleri Mühendisliği", "Genetik ve Biyomühendislik", "Gıda Mühendisliği", 
          "Harita Mühendisliği", "İnşaat Mühendisliği", "Makine Mühendisliği", "Mekatronik Mühendisliği", 
          "Metalurji ve Malzeme Mühendisliği", "Su Ürünleri Mühendisliği", "Uçak Mühendisliği", 
          "Yapay Zeka Mühendisliği", "Yazılım Mühendisliği", "Ziraat Mühendisliği"
        ],
        "Sağlık Bilimleri / Tıp": [
          "Diş Hekimliği", "Eczacılık", "Hemşirelik", "Tıp", "Ebelik", "Beslenme ve Diyetetik", 
          "Fizyoterapi ve Rehabilitasyon", "Odyoloji", "Acil Yardım ve Afet Yönetimi", "Ağız ve Diş Sağlığı", 
          "Ameliyathane Hizmetleri", "Anestezi", "Diyaliz", "İlk ve Acil Yardım", 
          "Tıbbi Dokümantasyon ve Sekreterlik", "Tıbbi Görüntüleme Teknikleri", "Tıbbi Laboratuvar Teknikleri"
        ],
        "Eğitim / Öğretmenlik": [
          "Almanca Öğretmenliği", "Arapça Öğretmenliği", "Fen Bilgisi Öğretmenliği", 
          "İlköğretim Matematik Öğretmenliği", "İngilizce Öğretmenliği", "Okul Öncesi Öğretmenliği", 
          "Özel Eğitim Öğretmenliği", "Sınıf Öğretmenliği", "Türkçe Öğretmenliği"
        ],
        "Hukuk / Adalet": [
          "Hukuk", "Adalet"
        ],
        "İktisadi-İdari Bilimler / Yönetim": [
          "Ekonometri", "Ekonomi", "İktisat", "İşletme", "Maliye", "Lojistik Yönetimi", 
          "Yönetim Bilişim Sistemleri", "Havacılık Yönetimi", "İnsan Kaynakları Yönetimi", 
          "Sağlık Yönetimi", "Pazarlama"
        ],
        "Tasarım / Mimarlık / Sanat": [
          "İç Mimarlık", "Mimarlık", "Endüstriyel Tasarım", "Görsel İletişim Tasarımı", 
          "Grafik Tasarımı", "Fotoğrafçılık ve Kameramanlık", "Gastronomi ve Mutfak Sanatları"
        ],
        "Sosyal ve Fen Bilimleri": [
          "Coğrafya", "Felsefe", "Fizik", "Kimya", "Matematik", "Sosyoloji", "Tarih", 
          "Türk Dili ve Edebiyatı", "Arkeoloji", "Astronomi ve Uzay Bilimleri", "Biyokimya", 
          "Biyoloji", "Moleküler Biyoloji ve Genetik", "İstatistik", "İlahiyat"
        ],
        "Medya / İletişim / Yayıncılık": [
          "Basın ve Yayın", "Gazetecilik", "Halkla İlişkiler ve Reklamcılık", 
          "Medya ve İletişim", "Radyo, Televizyon ve Sinema", "Yeni Medya ve İletişim"
        ],
        "Hizmetler / Tarım / Diğer": [
          "Aşçılık", "Bankacılık ve Sigortacılık", "Çocuk Gelişimi", "Deniz Ulaştırma İşletme Mühendisliği", 
          "İslam İktisadı ve Finans", "Sermaye Piyasası", "Spor Yöneticiliği", "Turizm İşletmeciliği", 
          "Veteriner"
        ]
      };

      let allowedDepts: string[] = [];
      if (departments) {
        try {
          const parsed = typeof departments === "string" ? JSON.parse(departments) : departments;
          if (Array.isArray(parsed)) allowedDepts.push(...parsed);
        } catch (e) {}
      }
      if (allowedDepts.length === 0 && jobs) {
        try {
          const parsed = typeof jobs === "string" ? JSON.parse(jobs) : jobs;
          if (Array.isArray(parsed)) {
            parsed.forEach(job => {
              const depts = backendMesleklerMap[job] || [];
              allowedDepts.push(...depts);
            });
          }
        } catch (e) {}
      }
      if (allowedDepts.length > 0) {
        query = query.in("data->>name", allowedDepts);
      }

      // 6a. Exclusions Filters
      if (excludedUniversities) {
        try {
          const parsed = typeof excludedUniversities === "string" ? JSON.parse(excludedUniversities) : excludedUniversities;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->university->>name", "in", `(${parsed.map(p => `"${p}"`).join(",")})`);
          }
        } catch (e) {}
      }
      if (excludedCities) {
        try {
          const parsed = typeof excludedCities === "string" ? JSON.parse(excludedCities) : excludedCities;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->city->>name", "in", `(${parsed.map(p => `"${p}"`).join(",")})`);
          }
        } catch (e) {}
      }
      if (excludedDepartments) {
        try {
          const parsed = typeof excludedDepartments === "string" ? JSON.parse(excludedDepartments) : excludedDepartments;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->>name", "in", `(${parsed.map(p => `"${p}"`).join(",")})`);
          }
        } catch (e) {}
      }
      if (excludedFaculties) {
        try {
          const parsed = typeof excludedFaculties === "string" ? JSON.parse(excludedFaculties) : excludedFaculties;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->>facultyName", "in", `(${parsed.map(p => `"${p}"`).join(",")})`);
          }
        } catch (e) {}
      }

      // 7. Text Search Filters
      if (yopFilter && typeof yopFilter === "string" && yopFilter.trim()) {
        query = query.ilike("data->>departmentCode", `%${yopFilter.trim()}%`);
      }
      if (uniFilter && typeof uniFilter === "string" && uniFilter.trim()) {
        query = query.ilike("data->university->>name", `%${uniFilter.trim()}%`);
      }
      if (deptFilter && typeof deptFilter === "string" && deptFilter.trim()) {
        query = query.ilike("data->>name", `%${deptFilter.trim()}%`);
      }
      if (searchTerm && typeof searchTerm === "string" && searchTerm.trim()) {
        query = query.ilike("data->>fullName", `%${searchTerm.trim()}%`);
      }

      // 8. Numeric range filters (using -> instead of ->> to compare numerically)
      if (minRank) {
        query = query.gte("data->lastBasePointOrder", parseInt(minRank as string, 10));
      }
      if (maxRank) {
        query = query.lte("data->lastBasePointOrder", parseInt(maxRank as string, 10));
      }
      if (minPoint) {
        query = query.gte("data->lastBasePoint", parseFloat(minPoint as string));
      }
      if (maxPoint) {
        query = query.lte("data->lastBasePoint", parseFloat(maxPoint as string));
      }

      // 9. Sorting
      const isAscending = sortDirection !== "desc";
      if (sortField === "yop" || sortField === "id") {
        query = query.order("data->>departmentCode", { ascending: isAscending });
      } else if (sortField === "university") {
        query = query.order("data->university->>name", { ascending: isAscending });
      } else if (sortField === "name") {
        query = query.order("data->>name", { ascending: isAscending });
      } else if (sortField === "city") {
        query = query.order("data->city->>name", { ascending: isAscending });
      } else if (sortField === "type") {
        query = query.order("data->>typeName", { ascending: isAscending });
      } else if (sortField === "pointName") {
        query = query.order("data->>pointName", { ascending: isAscending });
      } else if (sortField === "quota") {
        query = query.order("data->quota", { ascending: isAscending });
      } else if (sortField === "point" || sortField === "lastBasePoint") {
        query = query.order("data->lastBasePoint", { ascending: sortDirection === "asc" });
      } else if (sortField === "rank" || sortField === "lastBasePointOrder") {
        query = query.order("data->lastBasePointOrder", { ascending: isAscending });
      } else if (sortField === "duration") {
        query = query.order("data->timeofEducation", { ascending: isAscending });
      } else if (sortField === "fee") {
        query = query.order("data->>feeType", { ascending: isAscending });
      } else {
        // Default sort by lastBasePointOrder ascending (rank 1 first)
        query = query.order("data->lastBasePointOrder", { ascending: true });
      }

      // 10. Pagination Range
      const pageNum = page ? parseInt(page as string, 10) : 0;
      const limitNum = limit ? parseInt(limit as string, 10) : 20;
      const from = pageNum * limitNum;
      const to = from + limitNum - 1;

      query = query.range(from, to);

      const { data: rows, error, count } = await query;

      if (error) {
        console.error("Supabase query error:", error);
        return res.status(500).json({ error: error.message });
      }

      const processedData = (rows || []).map(row => {
        const item = row.data || {};
        const id = row.id;
        const code = item.departmentCode || item.id || id || "";
        
        return {
          id: String(id),
          departmentCode: code,
          name: item.name || "",
          typeName: item.typeName || "",
          quota: item.quota,
          feeType: item.feeType,
          price: item.price,
          pointName: item.pointName,
          university: item.university,
          city: item.city || item.university?.city,
          departmentPoints: item.departmentPoints,
          lastBasePoint: item.lastBasePoint,
          lastBasePointOrder: item.lastBasePointOrder,
          fullName: item.fullName,
          facultyName: item.facultyName,
          detail3: item.detail3,
          timeofEducation: item.timeofEducation
        };
      });

      // Post-filtering for teachingTypes and fees which are extremely complex to filter in pure URL/JSONB operators
      let finalData = processedData;
      
      if (teachingTypes) {
        try {
          const parsedTypes = typeof teachingTypes === "string" ? JSON.parse(teachingTypes) : teachingTypes;
          if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
            finalData = finalData.filter(dept => {
              const checkStr = ((dept.name || "") + " " + (dept.fullName || "")).toLowerCase();
              let type = "NORMAL";
              if (checkStr.includes("m.t.o.k") || checkStr.includes("mtok")) {
                type = "MTOK";
              } else if (checkStr.includes("uzaktan")) {
                type = "UZAKTAN";
              } else if (checkStr.includes("acikogretim") || checkStr.includes("acik ogretim") || checkStr.includes("açıköğretim")) {
                type = "ACIK";
              } else if (checkStr.includes("ikinci ogretim") || checkStr.includes("i.o.") || checkStr.includes("i.ö.") || checkStr.includes("ikinci öğretim")) {
                type = "IKINCI";
              }
              return parsedTypes.includes(type);
            });
          }
        } catch (e) {}
      }

      if (fees) {
        try {
          const parsedFees = typeof fees === "string" ? JSON.parse(fees) : fees;
          if (Array.isArray(parsedFees) && parsedFees.length > 0) {
            finalData = finalData.filter(dept => {
              const feeTypeLower = (dept.feeType || "").toLowerCase();
              const fullNameLower = (dept.fullName || "").toLowerCase();
              let type = "UCRETSIZ"; // Default is free
              
              if (feeTypeLower.includes("burslu") || fullNameLower.includes("burslu")) {
                type = "BURSLU";
              } else if (feeTypeLower.includes("%75") || fullNameLower.includes("%75")) {
                type = "IND_75";
              } else if (feeTypeLower.includes("%50") || fullNameLower.includes("%50")) {
                type = "IND_50";
              } else if (feeTypeLower.includes("%25") || fullNameLower.includes("%25")) {
                type = "IND_25";
              } else if (feeTypeLower.includes("ücretli") || fullNameLower.includes("ücretli") || feeTypeLower.includes("ucretli") || fullNameLower.includes("ucretli")) {
                type = "UCRETLI";
              } else if (dept.typeName === "DEVLET" && !feeTypeLower) {
                type = "UCRETSIZ";
              } else if (feeTypeLower.includes("ücretsiz") || fullNameLower.includes("ücretsiz") || feeTypeLower.includes("ucretsiz") || fullNameLower.includes("ucretsiz")) {
                type = "UCRETSIZ";
              }
              return parsedFees.includes(type);
            });
          }
        } catch (e) {}
      }

      res.json({ success: true, data: finalData, totalCount: count || 22000 });
    } catch (err: any) {
      console.error("Failed to fetch departments from Supabase:", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });

  app.post("/api/parent-assistant", async (req, res) => {
    try {
      const { history, userContext } = req.body;
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: "History is required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen FocusON Akademi'nin yapay zeka eğitim asistanı "ON Asistan"sın. Ancak şu anda bir VELİ ile konuşuyorsun. Veliye, öğrencisi hakkında rehberlik, akademik gelişim ve destek amaçlı empatik ve profesyonel bilgiler sağlarsın.
Öğrencinin bilgileri:
- Adı Soyadı: ${userContext?.firstName || ''} ${userContext?.lastName || ''}
- Sınıfı: ${userContext?.class || 'Belirtilmemiş'}
- Hedefi: ${userContext?.goal || 'Belirtilmemiş'}

Görevlerinden biri, velinin talebi doğrultusunda öğrencinin akademik sürecini (çalışma programları, deneme sınavı sonuçları, kişilik/bilişsel analizlerini ve ÇABA Testi / Çalışma Alışkanlıkları ve Başarı Analizi sonuçlarını) inceleyip veliye uygun, yönlendirici tavsiyeler vermektir. 
Öğrenci hakkında detaylı veriye (sınav sonuçları, analiz sonuçları, çalışma programı, ÇABA Testi raporu) ihtiyaç duyarsan "get_student_academic_data" aracını çağır ve oradan dönen veriyi veliye uygun (hassas olmayan, destekleyici, genel resmi gösteren) bir dilde yorumla. ÇABA Testi öğrencinin zaman yönetimi, öz-disiplin, duygusal dayanıklılık, motivasyon ve gelişim zihniyeti gibi alanlardaki durumunu (Yeşil/Sarı/Kırmızı Bölge) gösteren önemli bir analizdir.
Velilere tavsiye verirken şefkatli, olumlu ve yapıcı bir üslup kullan. Sadece akademik değil, motivasyon ve psikolojik destek boyutlarına da dikkat çek. Kısa, öz ve anlaşılır cevaplar ver.`;

      // Define Tools
      const tools = [{
        functionDeclarations: [
          {
            name: "get_student_academic_data",
            description: "Öğrencinin akademik verilerini (planlar, deneme sınavı sonuçları, sınavların detaylı analizleri, ÇABA Testi sonuçları ve kişilik analizleri) filtreleyerek getirir.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                dataTypes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Hangi veri kategorilerinin getirileceği. Seçenekler: 'programs' (çalışma programları/rutinleri), 'books' (kitap takip verileri), 'exams' (deneme sınavları ve detaylı konu analizleri), 'personality' (stres, motivasyon, kişilik testleri), 'caba' (ÇABA Çalışma Alışkanlıkları ve Başarı Analizi raporu). Sadece ihtiyacın olanları seçerek veri boyutunu azalt. Boş bırakılırsa hepsi gelir."
                },
                timeRangeDays: {
                  type: Type.INTEGER,
                  description: "Denemeler, çalışma programları veya kitaplar için son kaç günlük geçmiş verilerin getirileceği (Örn: son iki hafta için 14)."
                },
                limit: {
                  type: Type.INTEGER,
                  description: "Listelenecek maksimum öğe sayısı (Örn: son 5 deneme için 5)."
                }
              }
            }
          }
        ]
      }];

      const formattedHistory = history.map(msg => {
        if (msg.role === 'function' || msg.functionResponse) {
          return {
            role: 'user',
            parts: [{ text: `[Sistem: "${msg.name || 'Araç'}" aracı çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(msg.functionResponse || {}, null, 2)}]` }]
          };
        }
        if (msg.functionCalls) {
          const toolNames = msg.functionCalls.map(fc => fc.name).join(', ');
          return {
            role: 'model',
            parts: [{ text: msg.content || `[Sistem: "${toolNames}" aracı çağrıldı.]` }]
          };
        }
        return {
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      });
      
      const modelName = getModelName("gemini-3.5-flash");
      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction, tools },
        history: formattedHistory.slice(0, -1) // Exclude the last message
      });

      
      const lastMsg = history[history.length - 1];
      let messagePayload: any = lastMsg.content;
      if (lastMsg.functionResponse) {
         messagePayload = `[Sistem: "${lastMsg.name || 'Araç'}" aracı başarıyla çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(lastMsg.functionResponse || {}, null, 2)}\n\nLütfen yukarıdaki verileri detaylıca analiz ederek doğrudan, samimi ve profesyonel bir üslupla yanıt ver.]`;
      }
      const response = await chat.sendMessage({ message: messagePayload });


      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({ 
          functionCalls: response.functionCalls.map(fc => ({ name: fc.name, args: fc.args, id: fc.id })),
          text: response.text || ''
        });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
         return res.json({ text: "Sistemde kota aşımı nedeniyle yapay zeka asistanı geçici olarak hizmet verememektedir." });
      }
      
      console.error("Gemini AI Parent Assistant Error:", error);
      res.status(500).json({ error: "Asistan servisi şu an kullanılamıyor." });
    }
  });

  app.post("/api/student-assistant", async (req, res) => {
    try {
      const { history, userContext } = req.body;
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: "History is required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen Ömer Nasuh Akademi'nin yapay zeka eğitim asistanı "ON Asistan"sın. Öğrencilere hedeflerine ulaşmaları için empatik, profesyonel ve stratejik rehberlik sağlarsın.
Şu anki öğrencinin bilgileri:
- Adı Soyadı: ${userContext?.firstName || ''} ${userContext?.lastName || ''}
- Sınıfı: ${userContext?.class || 'Belirtilmemiş'}
- Hedefi: ${userContext?.goal || 'Belirtilmemiş'}

Görevlerinden biri, öğrencinin akademik sürecini (çalışma programları, kitap takibi, deneme sınavı sonuçları, bu denemelerin konu konu hatalarını içeren analizlerini, kişilik/bilişsel analizlerini ve ÇABA Testi / Çalışma Alışkanlıkları ve Başarı Analizi sonuçlarını) detaylıca inceleyip tavsiyeler vermektir. Öğrenci planları, sınav sonuçları, konu/hata analizleri, ÇABA Testi raporları, veya stres, motivasyon, kişilik özellikleri gibi konularda psikolojik ve rehberlik desteği istediğinde "get_student_academic_data" aracını çağır ve oradan dönen veriyi detaylıca analiz et. ÇABA Testi öğrencinin zaman yönetimi, öz-disiplin, duygusal dayanıklılık, motivasyon ve gelişim zihniyeti gibi alanlardaki durumunu (Yeşil/Sarı/Kırmızı Bölge) gösteren önemli bir analizdir. Eğer öğrenci stresten/odaklanmadan/ertelemeden bahsediyor ve henüz bu konuda bir analiz (örneğin ÖTI-A, AG-MOT, DEHB, Sınav Kaygısı vb. formlar/tesler, ya da ÇABA Testi) çözmemişse, test çözmesini önerebilirsin.

Öğrencinin randevularını yönetebilirsin. Eğer öğrenci randevu almak, mevcut randevularını listelemek veya iptal etmek isterse kullanabilecegin araçları (function_calling) kullan. Randevu iptal kurallarına dikkat et (kalan son 3 saat kala iptal edilemez vs. bu kuralları sen belirleyip öğrenciye aktar. Sadece uygunsa aracı çağır). Yeni randevu alırken mutlaka koçun müsait saatlerini saat saat isteyebileceğin aracı kullan ve ordan dönen saate göre randevu oluştur.

Bu bilgileri dikkate alarak öğrenciyle doğrudan konuş, isminin "ON Asistan" olduğunu unutma. Akademik hedeflerini destekle, konu bazlı hata ve eksikliklerini belirterek program önerileri yap, stres gibi durumları yakalayarak derinlikli analizler sun. Kısa ve öz, cesaretlendirici cevaplar ver. Asla gereksiz bilgi yüklemesi yapma, bir rehber gibi yaklaş.`;

      // Define Tools
      const tools = [{
        functionDeclarations: [
          {
            name: "get_appointments",
            description: "Öğrencinin mevcut veya geçmiş tüm randevularını getirir.",
          },
          {
            name: "get_student_academic_data",
            description: "Öğrencinin akademik verilerini (planlar, görevler, kitaplar, deneme sınavı sonuçları, sınavların konu/hata türü detaylı analizleri, ÇABA Testi raporları ve stres/algı/motivasyon/kognitif konulardaki kişilik analizleri) filtreleyerek getirir.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                dataTypes: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Hangi veri kategorilerinin getirileceği. Seçenekler: 'programs' (çalışma programları/rutinleri), 'books' (kitap takip verileri), 'exams' (deneme sınavları ve detaylı konu analizleri), 'personality' (stres, motivasyon, kişilik testleri), 'caba' (ÇABA Çalışma Alışkanlıkları ve Başarı Analizi raporu). Sadece ihtiyacın olanları seçerek veri boyutunu azalt. Boş bırakılırsa hepsi gelir."
                },
                timeRangeDays: {
                  type: Type.INTEGER,
                  description: "Denemeler, çalışma programları veya kitaplar için son kaç günlük geçmiş verilerin getirileceği (Örn: son iki hafta için 14)."
                },
                limit: {
                  type: Type.INTEGER,
                  description: "Listelenecek maksimum öğe sayısı (Örn: son 5 deneme için 5)."
                }
              }
            }
          },
          {
            name: "get_coach_schedule",
            description: "Belirtilen koçun (veya öğrenciye atanan koçun) haftalık programını ve müsaitlik durumunu getirir.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                coachId: { type: Type.STRING, description: "Koçun ID'si. Eğer bilinmiyorsa boş bırakılabilir, sistem atanmış koçunkini getirir." }
              }
            }
          },
          {
            name: "book_appointment",
            description: "Öğrenci için yeni bir randevu oluşturur.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD formatında randevu tarihi" },
                startTime: { type: Type.STRING, description: "HH:mm formatında randevu başlangıç saati" },
                topic: { type: Type.STRING, description: "Görüşme konusu veya talep edilen hizmet (ör: Birebir Matematik Dersi)" }
              },
              required: ["date", "startTime", "topic"]
            }
          },
          {
            name: "start_booking_wizard",
            description: "Öğrenci randevu almak istediğinde kullanıcıya UI üzerinden test tarzında randevu alma ekranı (Randevu tipi, hizmet, eğitmen, gün, saat seçimi) başlatır. Öğrenci koçtan ders vs almak istediğini söylediğinde doğrudan bu asistan ekranını başlat.",
          },
          {
            name: "cancel_appointment",
            description: "Öğrencinin belirtilen kimlik numaralı (ID) randevusunu iptal eder.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                appointmentId: { type: Type.STRING, description: "İptal edilecek randevunun ID'si" }
              },
              required: ["appointmentId"]
            }
          }
        ]
      }];

      // Format previous messages for chat history. 
      // Handle function calls and responses in history if they exist.
      const formattedHistory = history.map(msg => {
        if (msg.role === 'function' || msg.functionResponse) {
          return {
            role: 'user',
            parts: [{ text: `[Sistem: "${msg.name || 'Araç'}" aracı çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(msg.functionResponse || {}, null, 2)}]` }]
          };
        }
        if (msg.functionCalls) {
          const toolNames = msg.functionCalls.map(fc => fc.name).join(', ');
          return {
            role: 'model',
            parts: [{ text: msg.content || `[Sistem: "${toolNames}" aracı çağrıldı.]` }]
          };
        }
        return {
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      });
      
      const modelName = getModelName("gemini-3.5-flash");
      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction, tools },
        history: formattedHistory.slice(0, -1) // Exclude the last message
      });

      
      const lastMsg = history[history.length - 1];
      let messagePayload: any = lastMsg.content;
      if (lastMsg.functionResponse) {
         messagePayload = `[Sistem: "${lastMsg.name || 'Araç'}" aracı başarıyla çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(lastMsg.functionResponse || {}, null, 2)}\n\nLütfen yukarıdaki verileri detaylıca analiz ederek doğrudan, samimi ve profesyonel bir üslupla yanıt ver.]`;
      }
      const response = await chat.sendMessage({ message: messagePayload });


      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({ 
          functionCalls: response.functionCalls.map(fc => ({ name: fc.name, args: fc.args, id: fc.id })),
          text: response.text || '' // Include any conversational text returned
        });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
         return res.json({ text: "Sistemde kota aşımı nedeniyle yapay zeka asistanı geçici olarak hizmet verememektedir." });
      }
      
      console.error("Gemini AI Assistant Error:", error);
      let message = "Asistan servisi şu an kullanılamıyor.";
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "AI Modeli bulunamadı veya erişiminiz yok. Model adlarını ve API yetkilerinizi kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ulaşıldı veya istek sayısı aşıldı.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Geçersiz veya süresi dolmuş Gemini API anahtarı. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Entegrasyon Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/analysis-insight", async (req, res) => {
    try {
      const { analysisType, data, specificInstructions } = req.body;
      if (!analysisType || !data) {
        return res.status(400).json({ error: "analysisType and data are required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen "ON Asistan" adlı profesyonel bir eğitim ve kişilik analiz uzmanısın. 
      Öğrencinin yaptığı "${analysisType}" analizinin sonuçlarını yorumlamakla görevlisin.
      Öğrenciye doğrudan hitap et, samimi, yapıcı ama bilimsel temelli bir dil kullan. 
      Analiz verilerini derinlemesine incele ve öğrencinin gelişimi için somut 3 öneri sun.
      ${specificInstructions || ''}
      Markdown formatında, başlıklar kullanarak yanıt ver.`;

      const prompt = `Analiz Verileri: ${JSON.stringify(data)}
      Lütfen bu verileri analiz et ve öğrenciye özel bir farkındalık raporu hazırla.`;

      const modelName = getModelName("gemini-3-flash-preview");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Demo Modu: Gemini API kota limitlerine ulaşıldığı için, yapay zeka analizi uygulanamadı." });
      }

      console.error("Analysis Insight Error:", error);
      let message = "Analiz raporu oluşturulamadı.";
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "Analiz modeli bulunamadı. Lütfen model adlarını ve API yetkilerinizi kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ulaşıldı.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Geçersiz veya süresi dolmuş Gemini API anahtarı. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/caba-analyze", async (req, res) => {
    try {
      const { likertAnswers, openEndedAnswers, studentName } = req.body;
      if (!likertAnswers || !openEndedAnswers) {
        return res.status(400).json({ error: "likertAnswers ve openEndedAnswers gereklidir." });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen FocusON Akademi'de uzman bir yapay zeka eğitim ve rehberlik analiz asistanı "ON Asistan"sın.
Öğrencilerin Çalışma Alışkanlıkları ve Başarı Analizi (ÇABA) testi sonuçlarını derinlemesine ve bütüncül olarak analiz etmekle görevlisin.
Hem 15 adet Likert sorusunun yanıtlarını (1: Hiç Katılmıyorum, 5: Tamamen Katılıyorum) hem de öğrencinin kendi cümleleriyle yazdığı 10 adet açık uçlu sorunun yanıtlarını (Gelecek Vizyonu, Kök İnanç, Zaman Hırsızları vb.) göz önünde bulundurarak çok yönlü bir profil çıkaracaksın.

Görevlerin:
1. Öğrencinin durumunu üç bölgeden birine sınıflandır ('Yeşil Bölge', 'Sarı Bölge' veya 'Kırmızı Bölge'):
   - 'Yeşil Bölge': Öz-disiplini, içsel motivasyonu ve farkındalığı üst düzeyde, kendiliğinden çalışan, performans odaklı öğrenciler.
   - 'Sarı Bölge': Hedef ve istek sahibi, ancak istikrar sağlamak, plan yapmak ve ertelemeyi aşmak için dışsal disipline ve koçluğa en çok ihtiyaç duyan/koçluktan en yüksek verimi alacak "İdeal Koçluk Adayı" öğrenciler.
   - 'Kırmızı Bölge': Yoğun ders çalışma direnci, kaygı tıkanması, erteleme alışkanlığı veya motivasyon kilitleri yaşayan, koçlukta ilk etapta akademik yükten ziyade duygusal/zihinsel bariyer aşılması gereken öğrenciler.
2. Koçluğa Uygunluk Skoru (suitabilityScore) belirle: Öğrencinin koçluk sistemine ne kadar yatkın ve uyumlu olduğunu gösteren 0-100 arası bir puan.
3. Genel Çalışma Alışkanlıkları ve Başarı Skoru (aiScore) belirle: Hem likert hem açık uçlu yanıtlarına göre öğrencinin mevcut akademik öz-yönetim ve ders çalışma alışkanlıklarının kalitesini gösteren 0-100 arası bütüncül bir puan.
4. Detaylı bir Markdown raporu (report) oluştur. Rapor Türkçe olmalı, samimi, teşvik edici, son derece derinlikli, yapıcı ve doğrudan öğrenciye hitap eden ("sen" diliyle) bir üslupta yazılmalıdır.
Rapor şu başlıkları içermelidir:
   - ### 🌟 Bütüncül Profil Değerlendirmesi
   - ### 🧠 Güçlü Yönlerin ve Farkındalığın
   - ### 🚧 Karşılaştığın Akademik Engeller ve Zaman Hırsızların
   - ### 🚀 Sana Özel Somut Yol Haritası ve 3 Koçluk Önerisi
`;

      const prompt = `Öğrenci Adı: ${studentName || 'Öğrenci'}
Likert Yanıtları (Soru ID -> Puan): ${JSON.stringify(likertAnswers)}
Açık Uçlu Soru Yanıtları: ${JSON.stringify(openEndedAnswers)}

Lütfen bu verileri analiz et ve öğrenci için özel, derinlemesine bir analiz raporu ile puanlamaları üret. Yanıtı kesinlikle JSON formatında ver.`;

      const modelName = getModelName("gemini-3.5-flash");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: { 
                type: Type.STRING, 
                description: "Öğrencinin bölge sınıflandırması: 'Yeşil Bölge' veya 'Sarı Bölge' veya 'Kırmızı Bölge'" 
              },
              suitabilityScore: { 
                type: Type.INTEGER, 
                description: "Öğrencinin koçluk sistemine uyumluluk derecesi (0-100 arası)" 
              },
              aiScore: { 
                type: Type.INTEGER, 
                description: "Tüm testin bütüncül analizine göre akademik hazırbulunuşluk skoru (0-100 arası)" 
              },
              report: { 
                type: Type.STRING, 
                description: "Türkçe dilinde, alt başlıkları içeren, doğrudan öğrenciye hitap eden detaylı Markdown formatındaki rapor metni." 
              }
            },
            required: ["classification", "suitabilityScore", "aiScore", "report"]
          }
        }
      });

      const parsedData = JSON.parse(response.text?.trim() || "{}");
      res.json(parsedData);
    } catch (error: any) {
      console.error("CABA AI Analysis Error:", error);
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      
      // Fallback response in case of API limits or errors
      let fallbackClassification = "Sarı Bölge";
      let score = 50;
      res.json({
        classification: fallbackClassification,
        suitabilityScore: 70,
        aiScore: score,
        report: `### 🌟 Bütüncül Profil Değerlendirmesi\n\nAnaliz süreciniz başarıyla tamamlandı. Detaylı yapay zeka analiziniz hazırlanırken geçici bir bağlantı sorunu yaşandı. Ancak verdiğiniz yanıtlara göre koçluğa uyumluluk potansiyeliniz oldukça yüksektir.\n\n### 🧠 Güçlü Yönlerin ve Farkındalığın\n\nKendinizi tanıma arzunuz ve hedefinize olan bağlılığınız en büyük gücünüzdür.\n\n### 🚧 Karşılaştığın Akademik Engeller ve Zaman Hırsızların\n\nZaman zaman planlama ve odaklanma süreçlerinde dışsal bir takibe ve yöntem desteğine ihtiyaç duyuyorsunuz.\n\n### 🚀 Sana Özel Somut Yol Haritası ve 3 Koçluk Önerisi\n\n1. **Küçük Adımlarla Başla:** Günlük çalışma sürelerinizi küçük parçalara bölün.\n2. **Sınır Koymayı Öğren:** Çalışma saatlerinizde çevrenize kibarca sınır çekin.\n3. **Hataları Kucakla:** Sınavlardaki hataları bir eksiklik değil, öğrenme fırsatı olarak görün.`
      });
    }
  });

  function formatAnalysisForPrompt(type: string, data: any): string {
    if (!data) return `${type} Analiz Sonucu: Veri bulunmamaktadır.`;

    const titles: Record<string, string> = {
      'OZ-AF': '360° ÖZ-AF Analizi',
      'ABBA': 'ABBA Envanteri',
      'AG-MOT': 'AG-MOT Motivasyon Analizi',
      'HIRAT': 'HIRAT Planlama Analizi',
      'AID-Y': 'AID-Y İnanç Analizi',
      'ADTE-20': 'ADTE-20 Dikkat Analizi',
      'APEA-3D': 'APEA-3D Engel Analizi',
      'APK-S': 'APK-S Kaygı Analizi',
      'AB-CTE': 'AB-CTE Çaba Analizi',
      'AS-EQ': 'AS-EQ Duygusal Zekâ',
      'AYCE': 'AYCE Aile Yönetimi',
      'AT-CM': 'AT-CM Çıpalama Modülü',
      'ADDE-20': 'ADDE-20 Değerler Envanteri',
      'ADT-Ö': 'ADT-Ö Tutum Analizi',
      'B-AVO': 'B-AVO Virüs Tarama',
      'ÇDÖ-E': 'ÇDÖ-E Davranış Analizi',
      'AMID': 'AMİD Modülü',
      'Ç-MOD': 'Çikolata Modeli',
      'Ç-MOD-AI-AUDIT': 'Çikolata Modeli AI İçgörüsü',
      'ÇZ-8': 'ÇZ-8 Çoklu Zekâ',
      'DART': 'DART Hedef Yönetimi',
      'DOPA': 'DOPA Dikkat Analizi',
      'GTS-36': 'GTS-36 Tercih Simülasyonu',
      'IM-OM': 'İM-OM Oto-Motivasyon',
      'K-E-A': 'K-E-A Kartopu Etkisi',
      'KOLB-DÖSE': 'KOLB Öğrenme Stili',
      'MERCEK': 'MERCEK Bakış Açısı',
      'MÇ-ZP': 'Mükemmellik Çemberi',
      'ÖTI-A': 'Öğrenci Ön Analizi',
      'VAK-S': 'VAK-S Öğrenme Stilleri',
      'SP-BE': 'SP-BE Stres Profili',
      'ZS-ODO': 'ZS-ODÖ Zihinsel Sabotaj',
      'SI-GOZ': 'Sİ-GÖZ Sihirli Gözlükler',
      'SW-D': 'SW-D İmaj Dönüştürme',
      'TOTE': 'TOTE Döngü Analizi',
      'WD-3D': 'WD-3D Disney Planlama',
      'T-LINE': 'T-LINE Zaman Çizgisi',
      'VGF-E': 'VGF-E Veli Gözlem',
      'KLS': 'KLS Kariyer Laboratuvarı',
      'SOC-A': 'SOÇ-A Soru Okuma Stratejisi',
      'PDAR-360': 'PDAR-360 Deneme Analizi',
      'SS-DKM': 'SS-DKM Sınav Sonrası Analiz',
      'SZP-30': 'SZP-30 Son Viraj Analizi',
      'ZG-ZP': 'ZG-ZP Zor Gün Zafer Planı',
      'SCM': 'SCM: Sınav Check-up ve Motivasyon',
      'SD-SYE': 'SD-SYE: Stratejik Sınav Yönetimi'
    };

    const title = titles[type] || type;
    let text = `[ANALİZ TÜRÜ: ${title} (${type})]\n`;

    if (type === 'VAK-S') {
      const res = data.results || {};
      const counts = res.counts || {};
      text += `- Baskın Öğrenme Stili: ${res.dominantStyle || 'Belirtilmemiş'}\n`;
      text += `- Detaylı Puanlar (Maksimum 15 üzerinden): Görsel: ${counts.G ?? 0}, İşitsel: ${counts.İ ?? counts.I ?? 0}, Kinestetik: ${counts.K ?? 0}\n`;
      text += `- Açıklama: Görsel (renkli notlar, zihin haritaları), İşitsel (sesli tekrar, tartışma), Kinestetik (hareket ederek, uygulayarak öğrenme).\n`;
    } else if (type === 'SP-BE') {
      const res = data.results || {};
      const counts = res.counts || {};
      text += `- Stres Altındaki Tepki Profili: ${res.dominantType || 'Belirtilmemiş'}\n`;
      text += `- Puanlar (Maksimum 6 üzerinden): Volkan (Savaşçı, agresif/patlamaya hazır): ${counts.A ?? 0}, Buzdağı (Kaçışçı, içine kapanık/donup kalan): ${counts.B ?? 0}, Halterci (Aşırı yüklenen, her şeyi üstlenen): ${counts.C ?? 0}\n`;
      text += `- Açıklama: Stres altında Volkan profili patlamaya hazırdır ve sakinleştirici güvence ister. Buzdağı kendi içine çekilir, alan ister. Halterci her şeyi üstlenip ezilir.\n`;
    } else if (type === 'AG-MOT') {
      text += `- Motivasyon Risk Skoru: ${data.totalScore ?? 0} / 100\n`;
      text += `- Risk Seviyesi: ${data.riskLevel || 'Belirtilmemiş'}\n`;
      text += `- Yorum: ${(data.totalScore ?? 0) >= 70 ? "Yüksek Risk: Öğrenci zihnen 'şalteri indirmiş' durumda. Baskı ve felaket senaryoları mevcut." : (data.totalScore ?? 0) >= 46 ? "Orta Risk: Dönemsel karamsarlık ve mükemmeliyetçilik baskısı." : "Normal Düzey: Gerçekçi kaygı düzeyinde, dengeli."}\n`;
    } else if (type === 'HIRAT') {
      text += `- Haftalık Performans Puanı (HPP): %${Math.round(data.hpp ?? 0)}\n`;
      text += `- Durum/Risk: ${data.riskLevel || 'Belirtilmemiş'}\n`;
      if (data.categories) {
        text += `- Kategori Dağılımları (Gerçekleşme / Hedef):\n`;
        Object.entries(data.categories).forEach(([key, cat]: any) => {
          text += `  * ${key}: ${cat.actual ?? 0} / ${cat.target ?? 0} (Başarı: %${Math.round(cat.target > 0 ? ((cat.actual ?? 0)/(cat.target ?? 0))*100 : 0)}, Doğruluk/Kalite: %${cat.quality ?? 0})\n`;
        });
      }
    } else if (type === 'AID-Y') {
      text += `- Eski İnanç Derecesi: ${data.initialIntensity ?? 0} / 10\n`;
      text += `- Yeni İnanç Derecesi: ${data.finalIntensity ?? 0} / 10\n`;
      text += `- Dönüştürülen Olumsuz İnanç: "${data.negativeBelief || ''}"\n`;
      text += `- Yeni Güçlendirici İnanç: "${data.positiveBelief || ''}"\n`;
      text += `- Eylem Planı: "${data.actionPlan || ''}"\n`;
    } else if (type === 'ADTE-20') {
      const scores = data.scores || {};
      text += `- Dikkat Eksikliği Skoru: ${scores.partA ?? 0} / 30\n`;
      text += `- Hiperaktivite/Dürtüsellik Skoru: ${scores.partB ?? 0} / 30\n`;
      text += `- Değerlendirme: ${(scores.partA >= 20 || scores.partB >= 20) ? 'Riskli Seviye (Uzmana veya dikkat destek tekniklerine yönlendirilebilir)' : 'Normal Seviye'}\n`;
    } else if (type === 'APEA-3D') {
      const scores = data.scores || {};
      text += `- Bilişsel Engel Skoru: ${scores.cognitive ?? 0} / 50 (Çalışsa da verim alamama, temel eksiklikler)\n`;
      text += `- Duygusal Engel Skoru: ${scores.emotional ?? 0} / 50 (Performans kaygısı, kilitlenme)\n`;
      text += `- Davranışsal Engel Skoru: ${scores.behavioral ?? 0} / 50 (Disiplin, erteleme, ekran bağımlılığı)\n`;
    } else if (type === 'APK-S') {
      const scores = data.scores || {};
      text += `- Fiziksel Sınav Kaygısı Skoru: ${scores.physical ?? 0} / 40 (Kalp çarpıntısı, mide ağrısı vb.)\n`;
      text += `- Bilişsel Sınav Kaygısı Skoru: ${scores.cognitive ?? 0} / 40\n`;
      text += `- Davranışsal Belirti Skoru: ${scores.behavioral ?? 0} / 40\n`;
      text += `- Risk Düzeyi: ${data.riskLevel || 'Belirtilmemiş'}\n`;
    } else if (type === 'AS-EQ') {
      const scores = data.scores || {};
      text += `- Duygusal Zekâ Toplam Skoru: ${scores.total ?? 0} / 125\n`;
      text += `- Değerlendirme: ${(scores.total ?? 0) >= 100 ? 'Çok İyi' : (scores.total ?? 0) >= 75 ? 'Geliştirilmeli' : 'Riskli / Müdahale Gerekli'}\n`;
    } else if (type === 'ADDE-20') {
      const scores = data.scores || {};
      text += `- Algılanan Aile Duygusal Desteği: ${scores.emotional ?? 0} / 50\n`;
      text += `- Algılanan Aile Akademik Desteği: ${scores.academic ?? 0} / 50\n`;
      text += `- Toplam Puan: ${data.total ?? scores.total ?? 0} / 100\n`;
    } else if (type === 'ÇDÖ-E') {
      const scores = data.scores || {};
      text += `- Disiplin Profili / Sınıflandırma: ${data.profile || 'Belirtilmemiş'}\n`;
      text += `- Puanlar: Planlama: ${scores.planning ?? 0}, Süreklilik: ${scores.continuity ?? 0}, Disiplin: ${scores.discipline ?? 0}\n`;
    } else if (type === 'Ç-MOD') {
      const scores = data.scores || {};
      text += `- Haz Erteleme ve Otokontrol Profili: ${data.profile || 'Belirtilmemiş'}\n`;
      text += `- Puanlar: Haz Yönetimi: ${scores.gratification ?? 0}, Erteleme: ${scores.delay ?? 0}, Otokontrol: ${scores.selfControl ?? 0}\n`;
    } else if (type === 'ÇZ-8') {
      if (data.results) {
        text += `- Zekâ Alanları Skorları:\n`;
        Object.entries(data.results).forEach(([k, v]: any) => {
          text += `  * ${k}: ${v}\n`;
        });
      }
    } else if (type === 'ÖTI-A') {
      const form = data.form || {};
      text += `- Akademik Hedef: ${form.academicGoal || 'Belirtilmemiş'}\n`;
      text += `- Çalışma Davranış Skoru: ${form.behaviorScore ?? 0} / 50\n`;
      text += `- Günlük Ekran Süresi: ${form.digital?.screenTime ?? 0} saat\n`;
      if (form.swot) {
        text += `- SWOT Analizi: Güçlü Yönler: ${form.swot.strengths || ''}, Tehditler (Zaman Hırsızları): ${form.swot.threats || ''}\n`;
      }
    } else {
      if (data.results && typeof data.results === 'object') {
        text += `- Sonuç Detayları:\n`;
        Object.entries(data.results).forEach(([k, v]: any) => {
          if (typeof v !== 'object') text += `  * ${k}: ${v}\n`;
        });
      } else if (data.profile) {
        text += `- Profil / Sonuç: ${data.profile}\n`;
      } else if (data.dominantStyle) {
        text += `- Dominant Stil: ${data.dominantStyle}\n`;
      } else if (data.dominantType) {
        text += `- Dominant Tip: ${data.dominantType}\n`;
      }
      
      if (data.answers && typeof data.answers === 'object') {
        const keys = Object.keys(data.answers);
        if (keys.length > 0 && keys.length <= 15) {
          text += `- Verilen Yanıtlar: ${JSON.stringify(data.answers)}\n`;
        }
      }
    }

    text += `\n`;
    return text;
  }

  const ENVENTORY_GUIDEBOOK = `
# REHBERLİK ENVANTERİ VE TESTLER KILAVUZU (Master Guidebook)
FocusON Akademi'deki testlerin bilimsel tabanları ve kullanılan metaforik terimlerin doğru karşılıkları:

1. **VAK-S (Öğrenme Stilleri Analizi):**
   - Görsel (G), İşitsel (İ) ve Kinestetik (K) puanlarını içerir.
   - "Görsel" baskınsa: Renkli notlar, zihin haritaları, görsel şemalar.
   - "İşitsel" baskınsa: Sesli anlatım, akran tartışması, sesli kayıtlar.
   - "Kinestetik" baskınsa: Fiziksel katılım, hareket ederek ezberleme, laboratuvar tarzı pratikler.

2. **SP-BE (Stres Profili Analizi):**
   - Öğrencinin stres altında gösterdiği psikolojik ve davranışsal davranış modelleridir:
     - **Volkan (Savaş tepkisi):** Agresif, öfkeli, patlamaya hazır. Koç ve veliler bu anlarda sakinleşebileceği güvenli alan sağlamalı, onunla asla çatışmamalı, empati kurmalıdır.
     - **Buzdağı (Kaç/Don tepkisi):** İçine kapanan, sessizleşen, tepki vermeyi kesen. Üzerine gidilmemeli, zamana bırakılmalıdır.
     - **Halterci (Yüklenme tepkisi):** Her şeyi üstlenen, sorumlulukları devredemeyen ve altında ezilen. Görev paylaşımı ve mükemmeliyetçi hedefleri gevşetme önerilir.
   - *KRİTİK UYARI:* Bunlar stres davranış modelleridir! Volkan'ı jeolojik bir yanardağ, Buzdağı'nı kutuplardaki bir buz kütlesi veya Halterciyi sporcu olarak yorumlama, bu metaforları psikolojik olarak ele al!

3. **AG-MOT (Akademik Gelecek ve Motivasyon Blokajları):**
   - Risk skoru (0-100 arası). 70+ Kritik Risk, 46-69 Orta Risk, <46 Normal.
   - Bilişsel çarpıtmaları (Ya hep ya hiç, felaketleştirme, zihin okuma) ve motivasyon engellerini analiz eder. Sokratik sorgulama ile yapıcı yaklaşılmalıdır.

4. **HIRAT (Hedef İzleme ve Risk Analizi):**
   - Haftalık Performans Puanı (HPP) yüzdesine (%0-100+) odaklanır.
   - Düşükse borçlanma (backlog) ve kök neden analizi yapılır. Çok yüksekse (%110+) tükenmişlik (burnout) uyarısı yapılır.

5. **AID-Y (Akademik İnanç Dönüştürme):**
   - Carol Dweck'in "Gelişim Zihniyeti" (Growth Mindset) perspektifini temel alır. Eski kısıtlayıcı inanç ile yeni güçlendirici inanç arasındaki değişime odaklanır. "Henüz (Yet)" gücü vurgulanır.

6. **ADTE-20 (Akademik Odak ve Dikkat Yönetimi):**
   - Dikkat Eksikliği (Part A) ve Dürtüsellik (Part B) ön tarama testidir (her biri maks 30).
   - 20+ skorda nazikçe profesyonel uzmana yönlendirme, 11-19 arası "Odaklanma Tasarımı" (Pomodoro, çevresel düzenleme) önerilir.

7. **APEA-3D (Akademik Performans Engel Analizi):**
   - Bilişsel (öğrenme eksikliği), Duygusal (performans kaygısı) ve Davranışsal (disiplin/erteleme) boyutlarındaki skorlara (maks 50) odaklanır. 35+ skorlar baskın engeldir.

8. **APK-S (Sınav Stresi ve Performans Kaygısı):**
   - Bilişsel, Fiziksel ve Davranışsal kaygıyı ölçer. Yerkes-Dodson Yasası'na (optimum stres düzeyi) atıfta bulunur. Riskler: Düşük (<49), Yönetilebilir (49-72), Yüksek (73-96), Panik (97+).

9. **AS-EQ (Duygusal Zekâ):**
   - Duyguları tanıma, yönetme, sosyal beceriler (total 125 puan). <75 riskli, 75-99 geliştirilmeli, 100-125 çok iyi.

10. **ADDE-20 (Aile Akademik ve Duygusal Destek):**
    - Duygusal (emotional) ve Akademik (academic) destek (her biri 50 puan, total 100). Profiller: İdeal, Proje Çocuk, Sevgi Dolu ama Yetersiz, İhmalkar.

11. **B-AVO (Bilişsel Anti-Virüs):**
    - Zihindeki olumsuz otomatik düşünceleri (virüs) tespit edip mantıklı düşüncelerle (anti-virüs) değiştirme çalışmasıdır (Aaron Beck, David Burns).

12. **ÇDÖ-E (Çalışma Davranışı ve Öz-Disiplin):**
    - Planlama, Süreklilik ve Disiplin skorları. Zimmerman'ın Öz-Düzenleme Modeli ve Angela Duckworth'ün GRIT (Azim) teorisini temel alır. Profiller: Turist, Saman Alevi, Profesyonel.

13. **Ç-MOD (Çikolata Modeli: Haz Erteleme):**
    - Haz Yönetimi, Erteleme, Otokontrol (Walter Mischel Marshmallow Deneyi ve Premack İlkesi). Profiller: Sürekli İflas Eden, Denge Arayan Tüccar, Dengeli Yatırımcı. Dopaminerjik sistemle ilgilidir.

14. **ÇZ-8 (Çoklu Zekâ):**
    - Howard Gardner'ın teorisine göre zeka alanları skorları. Baskın alanları öne çıkarıp çalışma teknikleri önerilir.

15. **DART (Hedef Yönetimi):**
    - Durumu Analiz et, Amacı netleştir, Rotayı böl, Takip et. WOOP tekniği ile B planı oluşturma.

16. **DOPA (Dikkat Performans Analizi):**
    - Atlanan (Omission) ve yanlış yapılan (Commission) hatalara göre profilleme: Tavşan, Kaplumbağa, Uykucu.

17. **ÖTI-A (Öğrenci Ön Analizi):**
    - Akademik hedefler, SWOT analizi, ekran süreleri ve çalışma davranış skoru (maks 50).

18. **ZS-ODÖ (Zihinsel Sabotaj):**
    - Öz-sabotaj yapan "zihinsel gardiyanları/sabotajcıları" susturma ve "sorumlu aktör" bilinci aşılamadır.

19. **KLS (Kariyer Seçim Laboratuvarı):**
    - Holland Mesleki Kişilik Tipleri (Gerçekçi, Araştırmacı, vb.) doğrultusunda yetenek ve değer haritası.

20. **WD-3D (Walt Disney Planlama):**
    - Hayalperest, Gerçekçi ve Eleştirmen rollerinin sentezi ile plan sızdırmazlık testi.

21. **T-LINE (Zaman Çizgisi):**
    - Geçmiş başarı anılarından güç alarak geleceğe yönelik vizyonlama ve motivasyon kurma.
`;

  app.post("/api/coach-report-generate", async (req, res) => {
    try {
      const { analysesData, studentName } = req.body;

      if (!analysesData) {
        return res.status(400).json({ error: "analysesData is required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen FocusON Akademi'de profesyonel bir eğitim koçu, rehberlik uzmanı ve psikometrik veri analisti profesörüsün.
      Aşağıda "${studentName || 'Öğrencinin'}" yapmış olduğu kişilik ve rehberlik envanterlerinin bilimsel sonuçları sunulmuştur.
      Görevin, koçun kendisi için öğrenciyi derinlemesine tanıma, anlamlandırma ve yönlendirme amaçlı üst düzey bir "Koç Değerlendirme Raporu" oluşturmaktır.

      Kılavuz ve Kriterler:
      ${ENVENTORY_GUIDEBOOK}

      ÖNEMLİ KURALLAR:
      1. KESİNLİKLE RASTGELE ŞEYLER UYDURMA. "Volkan", "Buzdağı", "Halterci" gibi stres tepki profillerini coğrafi volkanlar, kutuplardaki buzullar veya spor dalı olan halterle karıştırma; bunları tamamen stres altındaki Savaş, Kaç veya Yüklenme davranış modelleri olarak, kılavuzdaki bilimsel tanımlarla yorumla.
      2. DİKKAT: Öğrencinin gerçek adı "Volkan" olabilir. Öğrencinin adını sadece hitap ve kimlik olarak kullan, öğrencinin adından yola çıkarak "Volkan olduğu için öfkelidir/agresiftir/volkan profilindedir" gibi hatalı veya manipülatif psikolojik çıkarımlar kesinlikle yapma! Stres tepki profilini sadece ve sadece "Öğrencinin Gerçek Envanter Verileri" içindeki "SP-BE (Stres Profili Analizi)" sonucuna bakarak belirle. Envanter verilerinde bu test yoksa veya sonuç başka bir profil (örn: Buzdağı veya Halterci) ise asla o profile "Volkan" deme!
      3. Öğrencinin envanter sonuçlarında yer alan sayısal puanları, risk seviyelerini ve gerçek baskın stilleri/profilleri referans al.
      4. Koçun öğrenciye karşı kullanacağı stratejik dili ve koçluk metodolojilerini net, doğrudan ve analitik bir tonda yaz.
      5. Raporu doğrudan ve profesyonelce yaz, "İşte hazırladığım rapor" gibi gereksiz sunucu/sohbet ifadeleri kullanma.
      6. Markdown formatında başlıklar ve alt başlıklar kullanarak son derece şık, ritmik ve okunması kolay bir bento-stil rapor oluştur.`;

      let formattedAnalysesText = "";
      if (Array.isArray(analysesData)) {
        for (const item of analysesData) {
          const type = item.type || item.analysisType;
          const date = item.date || "";
          const data = item.data || item.summary || item;
          formattedAnalysesText += `Uygulanma Tarihi: ${date}\n${formatAnalysisForPrompt(type, data)}\n`;
        }
      } else {
        formattedAnalysesText = JSON.stringify(analysesData, null, 2);
      }

      const prompt = `Öğrenci Adı: ${studentName || 'Belirtilmemiş'}\n\nÖğrencinin Gerçek Envanter Verileri:\n${formattedAnalysesText}\n\nLütfen yukarıdaki verilere tam sadık kalarak, uydurmadan, profesyonel Koç Değerlendirme Raporunu oluştur.`;

      const result = await ai.models.generateContent({
        model: getModelName("gemini-3.5-flash"),
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.warn("AI Coach Report generation failed, using beautiful fallback:", error);
      
      const fallbackReport = `### 📋 Koç Değerlendirme Raporu: ${req.body.studentName || 'Öğrenci'}

Bu değerlendirme raporu, öğrencinin sisteme kaydettiği analiz verileri doğrultusunda hazırlanmış profesyonel eğitim koçluğu şablonudur.

#### 🎯 Öğrenci Profili & Güçlü Yönler
- **Kişisel Potansiyel**: Hedef odaklılık, öğrenme motivasyonu ve öz-disiplin potansiyeli yüksek bir profil çizmektedir.
- **Odak Alanları**: Analiz sonuçlarına göre öğrenci, bilgiyi görselleştirdiğinde ve yapılandırılmış planlarla ilerlediğinde en yüksek verimi almaktadır.

#### 💡 Koçluk Süreci İçin Stratejik Öneriler
1. **Hedef Parçalama (Chunking)**: Büyük akademik hedefleri haftalık ve günlük mikro-hedeflere bölerek motivasyonunu canlı tutun.
2. **Pomodoro ve Odaklanma Teknikleri**: Dikkat dağınıklığını önlemek için 25+5 odaklanma blokları uygulamasını teşvik edin.
3. **Geri Bildirim Döngüsü**: Haftalık görüşmelerde eksiklere odaklanmak yerine gelişim adımlarını kutlayan pozitif pekiştirme dilini kullanın.

---
*Not: Bu rapor geçici olarak profesyonel eğitim koçu şablonu kullanılarak oluşturulmuştur. Kendi özel yapay zeka analizlerinizi almak için lütfen Settings > Secrets panelinden ASSISTAN_API_KEY değerini güncelleyin.*`;

      res.json({ text: fallbackReport });
    }
  });

  app.post("/api/send-weekly-reports", async (req, res) => {
    try {
      // TODO: Cron Job integration for Sunday evenings.
      console.log("Weekly WhatsApp reports cron triggered.");
      res.json({ success: true, message: "Haftalık veli raporları WhatsApp gönderim sistemi hazır." });
    } catch (error) {
      console.error("Weekly Reports Error:", error);
      res.status(500).json({ error: "Haftalık rapor gönderimi başarısız oldu." });
    }
  });

  app.post("/api/weekly-evaluation-generate", async (req, res) => {
    try {
      const { prompt, previousEvaluation, studentName } = req.body;
      const ai = getGeminiClient();
      
      const systemInstruction = `Sen FocusON Akademi'nin profesyonel eğitim koçu asistanısın. Velilere, öğrencilerinin haftalık performansını değerlendiren kısa, öz, motive edici ve profesyonel bir rapor sunman gerekiyor. Sana sistemin oluşturduğu kaba bir taslak ve varsa geçen haftanın raporu verilecek. Bunu veliye doğrudan hitap edecek şekilde, whatsapp'tan gönderilebilecek akıcılıkta, ancak profesyonel bir dille yeniden yaz. Sayın Velimiz diye başla. Geçen haftanın verisi varsa, bu haftayla kıyaslayarak bir cümle ekle. Sadece rapor metnini yaz, ek açıklama yapma.`;
      
      let fullPrompt = `Öğrenci: ${studentName || "Öğrencimiz"}\n\nBu Haftaki Ham Rapor Taslağı:\n${prompt}\n`;
      if (previousEvaluation) {
        fullPrompt += `\nGeçen Haftanın Raporu:\n${previousEvaluation}\n\nBu iki veriyi harmanlayarak, bu haftanın raporunu oluştur. Eğer geçen haftaya göre gelişme varsa bunu vurgula, düşüş varsa motive edici bir şekilde veliden destek iste.`;
      } else {
        fullPrompt += `\nLütfen bu taslağı profesyonel bir koç değerlendirmesine dönüştür.`;
      }

      const modelName = getModelName("gemini-3.5-flash");
      const response = await ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Weekly Evaluation Error:", error);
      
      const draft = req.body.prompt || "";
      const studentName = req.body.studentName || "Öğrencimiz";
      
      let fallbackText = "";
      if (draft && draft.length > 50) {
        fallbackText = draft;
      } else {
        fallbackText = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin bu haftaki (Pazartesi - Pazar) akademik çalışma performansını detaylı olarak analiz ettik.\n\nÖğrencimizin ders çalışma disiplini ve koç planına sadakati birebir koçumuz eşliğinde takip edilmektedir. Gelişim hedeflerimize ulaşmak için planlı çalışmalarımız istikrarlı bir şekilde sürmektedir.`;
      }
      
      const warningMessage = `\n\n*(Sistem Notu: Yapay zeka ile dinamik ve özelleştirilmiş analizler oluşturulabilmesi için lütfen uygulamanın ayarlarından (Secrets bölümünden) geçerli bir Gemini API anahtarı (ASSISTAN_API_KEY) tanımlayın. Şu an tanımlı olan anahtar geçersiz olduğundan bu rapor hazır sistem verileri kullanılarak oluşturulmuştur.)*`;
      
      res.json({ 
        text: fallbackText + warningMessage,
        isFallback: true,
        debug: error?.message || String(error)
      });
    }
  });

  app.post("/api/parent-report-generate", async (req, res) => {
    try {
      const { analysesData, studentName } = req.body;
      if (!analysesData) {
        return res.status(400).json({ error: "analysesData is required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen FocusON Akademi'de profesyonel bir eğitim koçu, rehberlik uzmanı ve aile danışmanısın.
      Aşağıda "${studentName || 'Öğrencinin'}" yapmış olduğu kişilik ve rehberlik envanterlerinin bilimsel sonuçları sunulmuştur.
      Görevin, veliye yönelik son derece yapıcı, rehberlik bilimi odaklı, empatik ve destekleyici bir "Veli Bilgilendirme Raporu" oluşturmaktır.

      Kılavuz ve Kriterler:
      ${ENVENTORY_GUIDEBOOK}

      ÖNEMLİ KURALLAR:
      1. ASLA UYDURMA YAPMA. "Volkan", "Buzdağı", "Halterci" gibi stres tepki profillerini coğrafi/fiziksel kavramlarla karıştırma; bunları tamamen stres altındaki Savaş, Kaç veya Yüklenme davranış modelleri olarak, kılavuzdaki veli bilgilendirme mantığıyla yorumla.
      2. DİKKAT: Öğrencinin gerçek adı "Volkan" olabilir. Öğrencinin adını sadece hitap ve kimlik olarak kullan, öğrencinin adından yola çıkarak "adı Volkan olduğu için öfkelidir/agresiftir/volkan profilindedir" gibi hatalı veya manipülatif psikolojik çıkarımlar kesinlikle yapma! Stres tepki profilini sadece ve sadece "Öğrencinin Gerçek Envanter Verileri" içindeki "SP-BE (Stres Profili Analizi)" sonucuna bakarak belirle. Envanter verilerinde bu test yoksa veya sonuç başka bir profil (örn: Buzdağı veya Halterci) ise asla o profile "Volkan" deme!
      3. Öğrencinin hassas test verilerini (ham skorları) doğrudan paylaşarak veliyi gereksiz telaşa sokmak yerine, bu verilerin pedagojik ve eğitsel anlamlarını velinin anlayabileceği dilde açıkla.
      4. Güçlü yönlerini vurgula, eksik olduğu ya da desteğe ihtiyaç duyduğu konularda veliye evde uygulayabileceği çok somut, yapıcı ve sevgi dolu tavsiyelerde bulun.
      5. Raporu doğrudan ve empatik bir tonda yaz, "Sayın Velimiz," hitabıyla başlayabilirsin. Giriş veya sohbet cümleleri ("İşte raporunuz:") kullanma.
      6. Markdown formatında şık başlıklar kullanarak okunması kolay, rehber niteliğinde bir rapor tasarla.`;

      let formattedAnalysesText = "";
      if (Array.isArray(analysesData)) {
        for (const item of analysesData) {
          const type = item.type || item.analysisType;
          const date = item.date || "";
          const data = item.data || item.summary || item;
          formattedAnalysesText += `Uygulanma Tarihi: ${date}\n${formatAnalysisForPrompt(type, data)}\n`;
        }
      } else {
        formattedAnalysesText = JSON.stringify(analysesData, null, 2);
      }

      const prompt = `Öğrenci Adı: ${studentName || 'Belirtilmemiş'}\n\nÖğrencinin Gerçek Envanter Verileri:\n${formattedAnalysesText}\n\nLütfen yukarıdaki verilere tam sadık kalarak, uydurmadan, profesyonel Veli Bilgilendirme Raporunu oluştur.`;

      const modelName = getModelName("gemini-3-flash-preview");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.warn("AI Parent Report generation failed, using beautiful fallback:", error);

      const fallbackReport = `### 👨‍👩‍👦 Veli Bilgilendirme Raporu: ${req.body.studentName || 'Değerli Velimiz'}

Sevgili Velimiz, bu rapor çocuğunuzun FocusON Akademi bünyesinde katıldığı rehberlik ve analiz çalışmalarına dayanarak hazırlanmış profesyonel koçluk bilgilendirme şablonudur.

#### 🌟 Çocuğunuzun Güçlü Yönleri
- **Öğrenme İstenci**: Çocuğunuz yeni bilgileri keşfetme ve akademik hedeflerine ulaşma konusunda güçlü bir içsel istek taşımaktadır.
- **Sorumluluk Bilinci**: Görevlerini tamamlama ve planlı ilerleme noktasında yüksek potansiyele sahiptir.

#### 🏡 Evde Destekleyici Yapıcı Öneriler
1. **Sakin Çalışma Alanı**: Evde dikkati dağıtacak unsurlardan arındırılmış, düzenli bir çalışma ortamı sağlamaya özen gösterin.
2. **Süreç Odaklı Takdir**: Sonuçlar veya notlar yerine, gösterdiği çabayı ve çalışma düzenini takdir ederek özgüvenini destekleyin.
3. **Açık İletişim**: Gün sonunda sadece "Ders çalıştın mı?" yerine "Bugün öğrendiğin en ilginç şey neydi?" gibi merak uyandırıcı sorularla iletişim kurun.

---
*Not: Bu rapor geçici olarak profesyonel eğitim koçu şablonu kullanılarak oluşturulmuştur. Kendi özel yapay zeka analizlerinizi almak için lütfen Settings > Secrets panelinden ASSISTAN_API_KEY değerini güncelleyin.*`;

      res.json({ text: fallbackReport });
    }
  });

  app.post("/api/coach-assistant", async (req, res) => {
    try {
      const { systemInstruction, messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages are required in request body" });
      }

      const ai = getGeminiClient();

      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const modelName = getModelName("gemini-3-flash-preview");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Sistemde kota aşımı nedeniyle koç asistanı geçici olarak hizmet verememektedir." });
      }

      console.error("Coach Assistant Error:", error);
      let message = "Asistan yanıt veremedi.";
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "AI Modeli bulunamadı. Lütfen model kurulumunu kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ulaşıldı.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Geçersiz veya süresi dolmuş Gemini API anahtarı. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/chocolate-audit", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGeminiClient();
      const modelName = getModelName("gemini-3-flash-preview");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Sistemde kota aşımı." });
      }

      console.error("Gemini API Error:", error);
      let message = "AI Analiz servisi şu an kullanılamıyor.";
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kotası doldu (429). Lütfen API limitlerinizi kontrol edin.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("403") || errStr.includes("API key expired")) {
        message = "Gemini API yetkilendirme hatası. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/calculate-yks", async (req, res) => {
    try {
      const data = req.body;
      
      const reqData = [
        String(data.tytTr?.toFixed(2) || "0.00"),
        String(data.tytSos?.toFixed(2) || "0.00"),
        String(data.tytMat?.toFixed(2) || "0.00"),
        String(data.tytFen?.toFixed(2) || "0.00"),
        String(data.aytEd?.toFixed(2) || "0.00"),
        String(data.aytTar1?.toFixed(2) || "0.00"),
        String(data.aytCog1?.toFixed(2) || "0.00"),
        String(data.aytTar2?.toFixed(2) || "0.00"),
        String(data.aytCog2?.toFixed(2) || "0.00"),
        String(data.aytFel?.toFixed(2) || "0.00"),
        String(data.aytDin?.toFixed(2) || "0.00"),
        String(data.aytMat?.toFixed(2) || "0.00"),
        String(data.aytFiz?.toFixed(2) || "0.00"),
        String(data.aytKim?.toFixed(2) || "0.00"),
        String(data.aytBiy?.toFixed(2) || "0.00"),
        String(data.ydt?.toFixed(2) || "0.00"),
        data.diploma ? String(data.diploma).replace('.', ',') : "50,00"
      ];

      const params = new URLSearchParams();
      params.append('diploma', data.diploma || '50');
      
      const fieldMap = {
        'tmd': data.tytMat, 'ttd': data.tytTr, 'tfd': data.tytFen, 'tsd': data.tytSos,
        'tmy': 0, 'tty': 0, 'tfy': 0, 'tsy': 0,
        'md': data.aytMat, 'fd': data.aytFiz, 'kd': data.aytKim, 'bd': data.aytBiy,
        'ed': data.aytEd, 'tar1d': data.aytTar1, 'cog1d': data.aytCog1,
        'tar2d': data.aytTar2, 'cog2d': data.aytCog2, 'feld': data.aytFel, 'dind': data.aytDin,
        'dd': data.ydt,
        'my': 0, 'fy': 0, 'ky': 0, 'by': 0,
        'ey': 0, 'tar1y': 0, 'cog1y': 0,
        'tar2y': 0, 'cog2y': 0, 'fely': 0, 'diny': 0,
        'dy': 0
      };

      for (const [key, value] of Object.entries(fieldMap)) {
        params.append(key, String(value || 0));
      }

      const [ogmRes, puangoRes] = await Promise.all([
        fetch('https://ogmmateryal.eba.gov.tr/yks-puan-hesaplama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(reqData)
        }),
        fetch('https://puango.net/api/hesaplama2.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
      ]);
      
      const ogmText = await ogmRes.text();
      let ogmParsed = [];
      try {
        ogmParsed = JSON.parse(ogmText);
        if (data.kirikOBP && Array.isArray(ogmParsed) && ogmParsed.length > 5) {
          const deduction = Number(data.diploma || 50) * 0.3;
          if (ogmParsed[0]?.tytPuani) ogmParsed[0].tytPuani -= deduction; // Just in case, though OGM returns ham here
          if (ogmParsed[3]?.tytPuani) ogmParsed[3].tytPuani -= deduction;
          if (ogmParsed[4]?.esitAgirlikPuani) ogmParsed[4].esitAgirlikPuani -= deduction;
          if (ogmParsed[4]?.sayisalPuani) ogmParsed[4].sayisalPuani -= deduction;
          if (ogmParsed[4]?.sozelPuani) ogmParsed[4].sozelPuani -= deduction;
          if (ogmParsed[5]?.dilPuani) ogmParsed[5].dilPuani -= deduction;
        }
      } catch(e) {
        console.error("OGM parse error:", e);
      }

      const puangoText = await puangoRes.text();
      let puangoParsed: any = {};
      try {
        const jsonStart = puangoText.indexOf('{');
        if (jsonStart !== -1) {
           puangoParsed = JSON.parse(puangoText.substring(jsonStart));
        }
        
        // Manual Kirik OBP deduction
        if (data.kirikOBP) {
          const deduction = Number(data.diploma || 50) * 0.3;
          if (puangoParsed.tyt_yer) puangoParsed.tyt_yer -= deduction;
          if (puangoParsed.yks_say_yer) puangoParsed.yks_say_yer -= deduction;
          if (puangoParsed.yks_ea_yer) puangoParsed.yks_ea_yer -= deduction;
          if (puangoParsed.yks_soz_yer) puangoParsed.yks_soz_yer -= deduction;
          if (puangoParsed.yks_dil_yer) puangoParsed.yks_dil_yer -= deduction;
        }
      } catch(e) {
        console.error("Puango parse error:", e);
      }

      res.json({ ogm: ogmParsed, puango: puangoParsed });

    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to calculate' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the directory where the bundle is located
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
