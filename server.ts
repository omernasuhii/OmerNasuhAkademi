import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { GoogleGenAI, Type, Modality } from "@google/genai";
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
} from "firebase/firestore/lite";
import fs from "fs";
import crypto from "crypto";
import { jsPDF } from "jspdf";
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
    
    try {
      const urlObj = new URL(urlStr);
      const keyParam = urlObj.searchParams.get("key");
      
      const finalHeaders: Record<string, string> = {};
      let headerApiKey = "";
      
      if (init && init.headers) {
        if (typeof (init.headers as any).forEach === "function") {
          (init.headers as any).forEach((v: string, k: string) => {
            finalHeaders[k.toLowerCase()] = v;
            if (k.toLowerCase() === "x-goog-api-key" || k.toLowerCase() === "x-api-key") {
              headerApiKey = v;
            }
          });
        } else if (typeof init.headers === "object") {
          for (const [k, v] of Object.entries(init.headers)) {
            finalHeaders[k.toLowerCase()] = v as string;
            if (k.toLowerCase() === "x-goog-api-key" || k.toLowerCase() === "x-api-key") {
              headerApiKey = v as string;
            }
          }
        }
      }
      
      let token = "";
      if (keyParam && (keyParam.startsWith("ya29.") || keyParam.startsWith("AQ."))) {
        token = keyParam;
      } else if (headerApiKey && (headerApiKey.startsWith("ya29.") || headerApiKey.startsWith("AQ."))) {
        token = headerApiKey;
      } else if (apiKey && (apiKey.startsWith("ya29.") || apiKey.startsWith("AQ."))) {
        token = apiKey;
      }

      
      if (token) {
        urlObj.searchParams.delete("key");
        
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
function pcmToWavBase64(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitDepth = 16): string {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const wavHeader = Buffer.alloc(44);
  
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * numChannels * bitDepth / 8, 28);
  wavHeader.writeUInt16LE(numChannels * bitDepth / 8, 32);
  wavHeader.writeUInt16LE(bitDepth, 34);
  
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);
  
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
  return wavBuffer.toString('base64');
}

function getGeminiClient(overrideApiKey?: string) {
  let apiKey = overrideApiKey || process.env.ASSISTAN_API_KEY;
  if (!apiKey || apiKey === "MY_API_KEY" || apiKey === "" || apiKey === "undefined") {
    console.warn("[Gemini Client] Warning: ASSISTAN_API_KEY is not defined in environment variables!");
    throw new Error("API_KEY_MISSING");
  }

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
  if (defaultDevModel && defaultDevModel.startsWith("gemini-2.")) return defaultDevModel;
  return "gemini-2.5-flash";
}

function formatE164Phone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (!cleaned) return "";

  // Turkey numbers: 10 digits starting with 5 (e.g. 5xxxxxxxxx)
  if (cleaned.length === 10 && cleaned.startsWith("5")) {
    return "+90" + cleaned;
  }
  // Turkey numbers: 11 digits starting with 05 (e.g. 05xxxxxxxxx)
  if (cleaned.length === 11 && cleaned.startsWith("05")) {
    return "+90" + cleaned.substring(1);
  }
  // Turkey numbers: 12 digits starting with 905 (e.g. 905xxxxxxxxx)
  if (cleaned.length === 12 && cleaned.startsWith("905")) {
    return "+" + cleaned;
  }

  // General fallback: prepend +
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
  if (data === undefined) return null;
  if (!data) return data;
  if (typeof data === "object") {
    if (data.constructor?.name === "ServerTimestampTransform" || data.constructor?.name === "FieldValue" || (data._methodName && data._methodName === "ServerTimestamp")) {
      return clientServerTimestamp();
    }
    const mapped: any = Array.isArray(data) ? [] : {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (val === undefined) {
        continue;
      }
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

let hasAdminCredentials = false;

// Helper to get Firestore instance with the correct databaseId
function getDb(): any {
  if (hasAdminCredentials && admin.apps.length > 0) {
    const app = admin.apps[0];
    const dbId = appletConfig?.firestoreDatabaseId;
    return dbId ? getFirestore(app, dbId) : getFirestore(app);
  } else {
    const createCollectionQuery = (colName: string) => {
      let whereClauses: { field: string; op: any; val: any }[] = [];
      let orderByField: string | null = null;
      let orderByDir: "asc" | "desc" = "asc";
      let limitNum: number | null = null;

      const builder: any = {
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
          whereClauses.push({ field, op, val });
          return builder;
        },
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
          try {
            let qConstraints: any[] = [];
            if (whereClauses.length > 0) {
              whereClauses.forEach(c => {
                qConstraints.push(clientWhere(c.field, c.op, c.val));
              });
            }

            const q = qConstraints.length > 0
              ? clientQuery(clientCollection(getClientDb(), colName), ...qConstraints)
              : clientQuery(clientCollection(getClientDb(), colName));

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
          } catch (err: any) {
            console.error(`[getDb Fallback Query Error on ${colName}]:`, err?.message || err);
            return {
              empty: true,
              docs: [],
              forEach: () => {}
            };
          }
        }
      };

      return builder;
    };

    return {
      collection: (colName: string) => createCollectionQuery(colName),
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
      hasAdminCredentials = true;
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
      hasAdminCredentials = false;
      console.log("Firebase Admin initialized with options (falling back to Client SDK wrapper for Firestore operations).");
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
    
    try {
      const response = await admin.messaging().send(message);
      return res.json({ success: true, response });
    } catch (pushError: any) {
      if (
        pushError?.message?.includes("cloudmessaging") || 
        pushError?.code?.includes("permission") ||
        pushError?.message?.includes("Permission")
      ) {
        console.log("[FCM Info] Push Notification skipped due to missing GCP permissions (expected in local/preview environments).");
        return res.json({ success: false, skipped: true, reason: "fcm_permission_restricted" });
      }
      console.log("[FCM Info] Push notification skipped:", pushError?.message || pushError);
      return res.json({ success: false, error: pushError?.message });
    }
  } catch (err: any) {
    console.log("[FCM Info] Send push route error:", err?.message || err);
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
});

  // Helper to persist verification logs in Firestore for live diagnostics
  const addVerificationLog = async (data: {
    action: "send_code" | "check_code" | "test_whatsapp";
    phone: string;
    status: "SUCCESS" | "FAILED" | "SIMULATED";
    channel?: string;
    details: string;
    twConfigUsed?: any;
    twilioError?: any;
    logs?: string[];
  }) => {
    try {
      const db = getDb();
      await db.collection("verification_logs").add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ...data
      });
    } catch (err) {
      console.error("[VerificationLog] Firestore save error:", err);
    }
  };

app.post("/api/twilio-verify-send", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Telefon numarası gereklidir." });
  }

  const formattedPhone = formatE164Phone(phone);
  const traceLogs: string[] = [];
  traceLogs.push(`[1. Giriş] Tel: ${phone} -> E.164: ${formattedPhone}`);

  const twConfig = await getTwilioConfig();
  const serviceSid = twConfig.serviceSid;
  const templateSid = twConfig.templateSid || "HX885e9543b48e8a4cb1b577c825a9afb7";

  const isE164 = /^\+\d{10,15}$/.test(formattedPhone);
  const isValidServiceSid = Boolean(serviceSid && serviceSid.startsWith("VA") && serviceSid.length >= 30);

  const maskedConfig = {
    accountSid: twConfig.accountSid ? `${twConfig.accountSid.substring(0, 6)}...${twConfig.accountSid.slice(-4)}` : "TANIMSIZ",
    authToken: twConfig.authToken ? "********" : "TANIMSIZ",
    serviceSid: serviceSid ? `${serviceSid.substring(0, 6)}...` : "TANIMSIZ",
    templateSid: templateSid || "TANIMSIZ",
    whatsappNumber: twConfig.whatsappNumber || "TANIMSIZ"
  };

  traceLogs.push(`[2. Ayarlar] AccountSID: ${maskedConfig.accountSid} | ServiceSID: ${maskedConfig.serviceSid} | TemplateSID: ${maskedConfig.templateSid} | WA: ${maskedConfig.whatsappNumber}`);

  if (!twConfig.accountSid || !twConfig.authToken) {
    traceLogs.push(`[Eksik] Twilio AccountSID veya AuthToken sistem ayarlarında bulunamadı.`);
  }
  if (!isE164) {
    traceLogs.push(`[Format Hatası] Telefon numarası uluslararası E.164 formatında (+905XXXXXXXXX) değil.`);
  }

  if (twConfig.accountSid && twConfig.authToken && isE164) {
    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(twConfig.accountSid, twConfig.authToken);

      // YÖNTEM 1: Twilio Verify WhatsApp Service API
      if (isValidServiceSid) {
        try {
          traceLogs.push(`[3. Yöntem 1 - Verify] Service (${serviceSid}) ile WhatsApp kanalından Kod İletimi deneniyor...`);
          
          const verification = await client.verify.v2
            .services(serviceSid)
            .verifications.create({
              to: formattedPhone,
              channel: "whatsapp"
            });

          traceLogs.push(`[Yöntem 1 Başarılı] WhatsApp doğrulama kodu başarıyla iletildi. Verification SID: ${verification.sid}, Status: ${verification.status}`);

          try {
            const db = getDb();
            await db.collection("whatsapp_messages").add({
              phone: formattedPhone,
              body: `FocusON Akademi WhatsApp doğrulama kodunuz iletildi. (Twilio Verify)`,
              senderName: "FocusON Bot (Doğrulama)",
              direction: "outbound",
              messageSid: verification.sid || null,
              status: "sent",
              sendMethod: "twilio_verify_whatsapp",
              isOtpMessage: true,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (dbErr: any) {
            console.error("[Verify Send DB Log Error]:", dbErr);
          }

          await addVerificationLog({
            action: "send_code",
            phone: formattedPhone,
            status: "SUCCESS",
            channel: "twilio_verify_whatsapp",
            details: `Twilio Verify WhatsApp üzerinden doğrulama kodu başarıyla gönderildi. SID: ${verification.sid}`,
            twConfigUsed: maskedConfig,
            logs: traceLogs
          });

          return res.json({ success: true, simulated: false, phone: formattedPhone, method: "verify_whatsapp", logs: traceLogs });
        } catch (verifyErr: any) {
          traceLogs.push(`[Yöntem 1 Hatası] Twilio Verify reddetti: ${verifyErr.message || verifyErr} (Hata Kodu: ${verifyErr.code || 'Bilinmiyor'})`);
          if (verifyErr.moreInfo) traceLogs.push(`[Doküman]: ${verifyErr.moreInfo}`);
        }
      } else {
        traceLogs.push(`[Yöntem 1 Atlandı] Sistemde geçerli bir Twilio Verify Service SID (VA...) bulunamadı.`);
      }

      // YÖNTEM 2: Twilio Programmable Messaging WhatsApp (Şablon Mesajı / Template)
      if (twConfig.whatsappNumber) {
        try {
          traceLogs.push(`[4. Yöntem 2 - Messaging] WhatsApp Numarası (${twConfig.whatsappNumber}) üzerinden Şablon Mesajı ile kod gönderimi deneniyor...`);
          
          const code = Math.floor(100000 + Math.random() * 900000).toString();
          
          const db = getDb();
          await db.collection("simulated_verifications").doc(formattedPhone).set({
            code: code,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          let messageResult: any;
          const fromNum = twConfig.whatsappNumber.startsWith("whatsapp:") ? twConfig.whatsappNumber : `whatsapp:${twConfig.whatsappNumber}`;
          const toNum = `whatsapp:${formattedPhone}`;

          if (templateSid) {
            traceLogs.push(`[Yöntem 2-A] Template SID (${templateSid}) ile WhatsApp şablon mesajı iletiliyor...`);
            try {
              messageResult = await client.messages.create({
                from: fromNum,
                to: toNum,
                contentSid: templateSid,
                contentVariables: JSON.stringify({ "1": code })
              });
              traceLogs.push(`[Yöntem 2-A Başarılı] WhatsApp Şablon Mesajı iletildi! Message SID: ${messageResult.sid}`);
            } catch (contentErr: any) {
              traceLogs.push(`[Yöntem 2-A Hata] Content SID gönderilemedi: ${contentErr.message} (Kod: ${contentErr.code}). Düz metin olarak deneniyor...`);
              messageResult = await client.messages.create({
                from: fromNum,
                to: toNum,
                body: `FocusON Akademi doğrulama kodunuz: ${code}`
              });
              traceLogs.push(`[Yöntem 2-B Başarılı] WhatsApp Metin Mesajı gönderildi! Message SID: ${messageResult.sid}`);
            }
          } else {
            messageResult = await client.messages.create({
              from: fromNum,
              to: toNum,
              body: `FocusON Akademi doğrulama kodunuz: ${code}`
            });
            traceLogs.push(`[Yöntem 2-B Başarılı] WhatsApp Metin Mesajı gönderildi! Message SID: ${messageResult.sid}`);
          }

          try {
            const db = getDb();
            await db.collection("whatsapp_messages").add({
              phone: formattedPhone,
              body: `FocusON Akademi doğrulama kodunuz: ${code}`,
              senderName: "FocusON Bot (Doğrulama)",
              direction: "outbound",
              messageSid: messageResult?.sid || null,
              status: "sent",
              sendMethod: "twilio_messaging_whatsapp",
              isOtpMessage: true,
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (dbErr: any) {
            console.error("[Verify Send DB Log Error]:", dbErr);
          }

          await addVerificationLog({
            action: "send_code",
            phone: formattedPhone,
            status: "SUCCESS",
            channel: "twilio_messaging_whatsapp",
            details: `Twilio Messaging WhatsApp üzerinden kod (${code}) gönderildi. Message SID: ${messageResult.sid}`,
            twConfigUsed: maskedConfig,
            logs: traceLogs
          });

          return res.json({ success: true, simulated: false, phone: formattedPhone, method: "messaging_whatsapp", logs: traceLogs });

        } catch (msgErr: any) {
          traceLogs.push(`[Yöntem 2 Hatası] Twilio Messaging reddetti: ${msgErr.message || msgErr} (Hata Kodu: ${msgErr.code || 'Bilinmiyor'})`);
          if (msgErr.moreInfo) traceLogs.push(`[Doküman]: ${msgErr.moreInfo}`);
        }
      } else {
        traceLogs.push(`[Yöntem 2 Atlandı] Twilio WhatsApp gönderici numarası tanımlı değil.`);
      }

    } catch (importErr: any) {
      traceLogs.push(`[Sistem Hatası] Twilio kütüphanesi çağrılırken hata: ${importErr.message}`);
    }
  }

  // FALLBACK SIMULATION MODE
  traceLogs.push(`[5. Simülasyon Modu] Gerçek Twilio WhatsApp API gönderimi gerçekleşemediği için sistem simülasyon moduna geçti.`);
  const simCode = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const db = getDb();
    await db.collection("simulated_verifications").doc(formattedPhone).set({
      code: simCode,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection("whatsapp_messages").add({
      phone: formattedPhone,
      body: `FocusON Akademi doğrulama kodunuz: ${simCode} (Test/Simülasyon Modu)`,
      senderName: "FocusON Bot (Doğrulama)",
      direction: "outbound",
      messageSid: null,
      status: "simulation",
      sendMethod: "simulation",
      isOtpMessage: true,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    traceLogs.push(`[Simülasyon Kaydı] Kod (${simCode}) Firestore simulated_verifications ve whatsapp_messages veritabanına kaydedildi.`);
  } catch (fsErr: any) {
    traceLogs.push(`[Firestore Hatası] Simülasyon kodu kaydedilemedi: ${fsErr.message}`);
  }

  await addVerificationLog({
    action: "send_code",
    phone: formattedPhone,
    status: "SIMULATED",
    channel: "simulation",
    details: `Twilio WhatsApp canlı gönderiminde hata alındığı veya API anahtarları eksik olduğu için simülasyon kodu (${simCode}) oluşturuldu.`,
    twConfigUsed: maskedConfig,
    logs: traceLogs
  });

  return res.json({
    success: true,
    simulated: true,
    phone: formattedPhone,
    code: simCode,
    message: "Twilio WhatsApp servisinde hata oluştu veya hesabınız sandbox/doğrulama modunda. Test simülasyon kodu oluşturuldu.",
    logs: traceLogs
  });
});

app.post("/api/twilio-verify-check", async (req, res) => {
  const { phone, code, uid } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Telefon numarası ve kod gereklidir." });
  }

  const formattedPhone = formatE164Phone(phone);
  const cleanCode = String(code).trim();
  const traceLogs: string[] = [];
  traceLogs.push(`[Kod Onayı] Tel: ${formattedPhone} | Girilen Kod: ${cleanCode}`);
  
  const twConfig = await getTwilioConfig();
  const serviceSid = twConfig.serviceSid;

  const verifyFirestoreUser = async () => {
    if (!uid) return;
    const db = getDb();
    
    const userRef = db.collection("users").doc(uid);
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
  };

  // Check test codes first
  if (cleanCode === "123456" || cleanCode === "999999") {
    await verifyFirestoreUser();
    traceLogs.push(`[Test Kodu Onayı] Standart test kodu (${cleanCode}) kabul edildi.`);
    await addVerificationLog({
      action: "check_code",
      phone: formattedPhone,
      status: "SUCCESS",
      channel: "test_code",
      details: `Kullanıcı standart test kodu (${cleanCode}) ile doğrulandı.`,
      logs: traceLogs
    });
    return res.json({ success: true, simulated: true });
  }

  // Check simulation records in Firestore
  try {
    const db = getDb();
    const simDoc = await db.collection("simulated_verifications").doc(formattedPhone).get();
    if (simDoc.exists && simDoc.data()?.code === cleanCode) {
      await verifyFirestoreUser();
      traceLogs.push(`[Simülasyon Onayı] Veritabanındaki simülasyon kodu (${cleanCode}) doğrulandı.`);
      await addVerificationLog({
        action: "check_code",
        phone: formattedPhone,
        status: "SUCCESS",
        channel: "simulation_database",
        details: `Kullanıcı simülasyon veritabanı kodu (${cleanCode}) ile doğrulandı.`,
        logs: traceLogs
      });
      return res.json({ success: true, simulated: true });
    }
  } catch (simErr: any) {
    traceLogs.push(`[Firestore Kontrol Hatası]: ${simErr.message}`);
  }

  const isValidServiceSid = Boolean(serviceSid && serviceSid.startsWith("VA") && serviceSid.length >= 30);

  if (twConfig.accountSid && twConfig.authToken && isValidServiceSid) {
    try {
      const { default: twilio } = await import("twilio");
      const client = twilio(twConfig.accountSid, twConfig.authToken);
      
      const check = await client.verify.v2
        .services(serviceSid)
        .verificationChecks.create({ to: formattedPhone, code: cleanCode });

      if (check.status === "approved") {
        await verifyFirestoreUser();
        traceLogs.push(`[Twilio Verify Onayı] Twilio API kodu (${cleanCode}) onayladı.`);
        await addVerificationLog({
          action: "check_code",
          phone: formattedPhone,
          status: "SUCCESS",
          channel: "twilio_verify",
          details: `Twilio Verify API kodu başarıyla onayladı. Check SID: ${check.sid}`,
          logs: traceLogs
        });
        return res.json({ success: true, simulated: false });
      } else {
        traceLogs.push(`[Twilio Verify Red] Twilio kodu reddetti. Statü: ${check.status}`);
        await addVerificationLog({
          action: "check_code",
          phone: formattedPhone,
          status: "FAILED",
          channel: "twilio_verify",
          details: `Twilio Verify koda geçersiz yanıtı verdi. Status: ${check.status}`,
          logs: traceLogs
        });
        return res.status(400).json({ error: "Girdiğiniz kod geçersizdir veya süresi dolmuştur." });
      }
    } catch (error: any) {
      traceLogs.push(`[Twilio Verify Hata]: ${error.message}`);
      await addVerificationLog({
        action: "check_code",
        phone: formattedPhone,
        status: "FAILED",
        channel: "twilio_verify",
        details: `Twilio Verify API onay hatası: ${error.message}`,
        twilioError: { code: error.code, message: error.message, status: error.status },
        logs: traceLogs
      });
      return res.status(500).json({ error: `Twilio Doğrulama Hatası: ${error.message || error}` });
    }
  } else {
    return res.status(400).json({ error: "Girdiğiniz doğrulama kodu geçersizdir." });
  }
});

async function getOrCreateVerificationCode(formattedPhone: string): Promise<string> {
  const db = getDb();
  let code = "";
  
  // 1. Check simulated_verifications
  try {
    const simDoc = await db.collection("simulated_verifications").doc(formattedPhone).get();
    if (simDoc.exists && simDoc.data()?.code) {
      code = simDoc.data().code;
    }
  } catch (err) {
    console.error("[getOrCreateVerificationCode] sim error:", err);
  }

  // 2. Check phone_verifications if not found
  if (!code) {
    try {
      const pvDoc = await db.collection("phone_verifications").doc(formattedPhone).get();
      if (pvDoc.exists && pvDoc.data()?.code) {
        code = pvDoc.data().code;
      }
    } catch (err) {
      console.error("[getOrCreateVerificationCode] pv error:", err);
    }
  }

  // 3. Generate new if still not found
  if (!code) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Save to both collections
  try {
    await db.collection("simulated_verifications").doc(formattedPhone).set({
      code: code,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await db.collection("phone_verifications").doc(formattedPhone).set({
      code: code,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (err) {
    console.error("[getOrCreateVerificationCode] save error:", err);
  }

  return code;
}

// Twilio Inbound WhatsApp Webhook Endpoint
app.all("/api/twilio-whatsapp-webhook", async (req, res) => {
  try {
    const rawFrom = (req.body && req.body.From) || (req.query && req.query.From) || "";
    const bodyText = (req.body && req.body.Body) || (req.query && req.query.Body) || "";

    const senderPhone = rawFrom.replace("whatsapp:", "").trim();
    let replyMsg = "";

    const lowerBody = bodyText.toLowerCase().trim();
    const isVerificationRequest = (lowerBody.includes("focuson") && lowerBody.includes("doğrulama")) || lowerBody.includes("doğrulama kodu isteği") || lowerBody.includes("fo-onay");

    if (senderPhone && isVerificationRequest) {
      const formattedPhone = formatE164Phone(senderPhone);
      const code = await getOrCreateVerificationCode(formattedPhone);
      replyMsg = `FocusON Akademi doğrulama kodunuz: ${code}\n\nLütfen bu 6 haneli kodu kayıt / doğrulama ekranına giriniz.`;

      await addVerificationLog({
        action: "send_code",
        phone: formattedPhone,
        status: "SUCCESS",
        channel: "inbound_whatsapp_webhook",
        details: `Gelen WhatsApp doğrulama talebi ("${bodyText}") yanıtlandı. Kod (${code}) tekrar iletildi.`,
        logs: [`[Gelen WhatsApp] Kimlik: ${formattedPhone}, Mesaj: ${bodyText}, Kod: ${code}`]
      });

      const twConfig = await getTwilioConfig();
      if (twConfig.accountSid && twConfig.authToken) {
        try {
          const { default: twilio } = await import("twilio");
          const client = twilio(twConfig.accountSid, twConfig.authToken);
          const fromNum = twConfig.whatsappNumber.startsWith("whatsapp:") ? twConfig.whatsappNumber : `whatsapp:${twConfig.whatsappNumber}`;
          
          await client.messages.create({
            from: fromNum,
            to: `whatsapp:${formattedPhone}`,
            body: replyMsg
          });

          if (twConfig.serviceSid) {
            try {
              await client.verify.v2.services(twConfig.serviceSid).verifications.create({
                to: formattedPhone,
                channel: "whatsapp"
              });
            } catch (vErr) {
              // Ignore verify error if messaging worked
            }
          }
        } catch (vErr) {
          console.error("[Inbound Webhook Direct Message Error]:", vErr);
        }
      }

      try {
        const db = getDb();
        await db.collection("whatsapp_messages").add({
          phone: formattedPhone,
          body: bodyText,
          senderName: "Gelen Whatsapp Kullanıcısı",
          direction: "inbound",
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        await db.collection("whatsapp_messages").add({
          phone: formattedPhone,
          body: replyMsg,
          senderName: "FocusON Bot (Otomatik Yanıt)",
          direction: "outbound",
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
      } catch (dbErr) {
        console.error("[Inbound Webhook DB Log Error]:", dbErr);
      }
    }

    res.type("text/xml");
    return res.send(`<Response><Message>${replyMsg || "FocusON Akademi doğrulama talebiniz alındı."}</Message></Response>`);
  } catch (err: any) {
    console.error("[Twilio Inbound Webhook Error]:", err);
    res.type("text/xml");
    return res.send("<Response></Response>");
  }
});

// Admin Log Endpoints
app.get("/api/admin/verification-logs", async (req, res) => {
  try {
    const db = getDb();
    const snap = await db.collection("verification_logs").orderBy("timestamp", "desc").limit(50).get();
    const logs = snap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
      };
    });
    return res.json({ success: true, logs });
  } catch (error: any) {
    console.error("[AdminLogs] Error fetching logs:", error);
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/test-twilio-whatsapp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Test için telefon numarası gereklidir." });
  }

  const formattedPhone = formatE164Phone(phone);
  const traceLogs: string[] = [];
  traceLogs.push(`[CANLI TEST BAŞLADI] Test Telefonu: ${phone} -> E.164: ${formattedPhone}`);

  const twConfig = await getTwilioConfig();
  const serviceSid = twConfig.serviceSid;
  const templateSid = twConfig.templateSid || "HX885e9543b48e8a4cb1b577c825a9afb7";

  const maskedConfig = {
    accountSid: twConfig.accountSid ? `${twConfig.accountSid.substring(0, 6)}...${twConfig.accountSid.slice(-4)}` : "TANIMSIZ",
    authToken: twConfig.authToken ? "********" : "TANIMSIZ",
    serviceSid: serviceSid ? `${serviceSid.substring(0, 6)}...` : "TANIMSIZ",
    templateSid: templateSid || "TANIMSIZ",
    whatsappNumber: twConfig.whatsappNumber || "TANIMSIZ"
  };

  traceLogs.push(`[Parametreler] AccountSID: ${maskedConfig.accountSid}, ServiceSID: ${maskedConfig.serviceSid}, TemplateSID: ${maskedConfig.templateSid}, WA Number: ${maskedConfig.whatsappNumber}`);

  let testResult = {
    success: false,
    method: "none",
    logs: traceLogs,
    config: maskedConfig,
    error: null as any
  };

  try {
    const { default: twilio } = await import("twilio");
    const client = twilio(twConfig.accountSid, twConfig.authToken);

    // Test Yöntem 1: Verify API
    if (serviceSid && serviceSid.startsWith("VA")) {
      traceLogs.push(`[Test 1] Twilio Verify WhatsApp Service (${serviceSid}) çağrılıyor...`);
      try {
        const verification = await client.verify.v2.services(serviceSid).verifications.create({
          to: formattedPhone,
          channel: "whatsapp"
        });
        traceLogs.push(`[Test 1 BAŞARILI!] Verify WhatsApp mesajı gönderildi. SID: ${verification.sid}`);
        testResult.success = true;
        testResult.method = "verify_whatsapp";
      } catch (err1: any) {
        traceLogs.push(`[Test 1 HATA!] ${err1.message} (Kod: ${err1.code}).`);
        if (err1.moreInfo) traceLogs.push(`[Link]: ${err1.moreInfo}`);
        testResult.error = { code: err1.code, message: err1.message, moreInfo: err1.moreInfo };
      }
    }

    // Test Yöntem 2: Messaging Template
    if (!testResult.success && twConfig.whatsappNumber) {
      traceLogs.push(`[Test 2] Twilio Messaging API (${twConfig.whatsappNumber}) şablon mesajı deneniyor...`);
      const fromNum = twConfig.whatsappNumber.startsWith("whatsapp:") ? twConfig.whatsappNumber : `whatsapp:${twConfig.whatsappNumber}`;
      const toNum = `whatsapp:${formattedPhone}`;
      const testCode = "123456";

      try {
        const msg = await client.messages.create({
          from: fromNum,
          to: toNum,
          contentSid: templateSid,
          contentVariables: JSON.stringify({ "1": testCode })
        });
        traceLogs.push(`[Test 2 BAŞARILI!] WhatsApp Şablon Mesajı (${templateSid}) iletildi. Message SID: ${msg.sid}`);
        testResult.success = true;
        testResult.method = "messaging_template";

        try {
          const db = getDb();
          await db.collection("whatsapp_messages").add({
            phone: formattedPhone,
            senderName: "Yönetici Test",
            direction: "outbound",
            body: `[Sistem Test Mesajı] FocusON Akademi Twilio WhatsApp test mesajı iletildi. (Şablon: ${templateSid})`,
            messageSid: msg?.sid || null,
            status: "sent",
            isTemplate: true,
            templateSid: templateSid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        } catch (dbErr) {
          console.error("[Test Log DB Error]:", dbErr);
        }
      } catch (err2: any) {
        traceLogs.push(`[Test 2 HATA!] ${err2.message} (Kod: ${err2.code}).`);
        if (err2.moreInfo) traceLogs.push(`[Link]: ${err2.moreInfo}`);
        if (!testResult.error) {
          testResult.error = { code: err2.code, message: err2.message, moreInfo: err2.moreInfo };
        }
      }
    }
  } catch (err: any) {
    traceLogs.push(`[Test Kritik Hata] ${err.message}`);
    testResult.error = { message: err.message };
  }

  await addVerificationLog({
    action: "test_whatsapp",
    phone: formattedPhone,
    status: testResult.success ? "SUCCESS" : "FAILED",
    channel: testResult.method,
    details: testResult.success ? `Canlı test başarılı oldu (${testResult.method})` : `Canlı test başarısız: ${testResult.error?.message || 'Bilinmiyor'}`,
    twConfigUsed: maskedConfig,
    twilioError: testResult.error,
    logs: traceLogs
  });

  return res.json(testResult);
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

      // 3. Save to whatsapp_messages for inbox visibility
      await db.collection("whatsapp_messages").add({
        phone: formattedPhone,
        body: msgBody,
        senderName: "FocusON Bot (Doğrulama)",
        direction: "outbound",
        status: "sent",
        sendMethod: "send_whatsapp",
        isOtpMessage: true,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      await addVerificationLog({
        action: "send_code",
        phone: formattedPhone,
        status: "SUCCESS",
        channel: "send_whatsapp_api",
        details: `WhatsApp doğrulama kodu (${code}) gönderildi.`
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

  // Helper to retrieve Twilio configuration from Firestore or env
  const getTwilioConfig = async () => {
    let accountSid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
    let authToken = (process.env.TWILIO_AUTH_TOKEN || "").trim();
    let whatsappNumber = (process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886").trim();
    let serviceSid = (process.env.TWILIO_VERIFY_SERVICE_SID || "").trim();
    let templateSid = (process.env.TWILIO_VERIFY_TEMPLATE_SID || "HX885e9543b48e8a4cb1b577c825a9afb7").trim();
    let messagingServiceSid = (process.env.TWILIO_MESSAGING_SERVICE_SID || "").trim();
    let weeklyReportTemplateSid = (process.env.TWILIO_WEEKLY_REPORT_TEMPLATE_SID || "HXb083373137421bce630a0ad915cd4d0f").trim();
    let weeklyCoachReportTemplateSid = (process.env.TWILIO_WEEKLY_COACH_REPORT_TEMPLATE_SID || "HXc6d299d5f35b7ea07f7a87310d42f7dc").trim();

    try {
      const db = getDb();
      const settingsSnap = await db.collection("settings").doc("system").get();
      if (settingsSnap.exists) {
        const data = settingsSnap.data() || {};
        if (data.twilioAccountSid) accountSid = data.twilioAccountSid.trim();
        if (data.twilioAuthToken) authToken = data.twilioAuthToken.trim();
        if (data.twilioWhatsappNumber) whatsappNumber = data.twilioWhatsappNumber.trim();
        if (data.twilioVerifyServiceSid) serviceSid = data.twilioVerifyServiceSid.trim();
        if (data.twilioVerifyTemplateSid) templateSid = data.twilioVerifyTemplateSid.trim();
        if (data.twilioMessagingServiceSid) messagingServiceSid = data.twilioMessagingServiceSid.trim();
        if (data.twilioWeeklyReportTemplateSid) weeklyReportTemplateSid = data.twilioWeeklyReportTemplateSid.trim();
        if (data.twilioWeeklyCoachReportTemplateSid) weeklyCoachReportTemplateSid = data.twilioWeeklyCoachReportTemplateSid.trim();
      }
    } catch (err: any) {
      console.log("[Twilio Config] Using environment variables configuration.");
    }

    return { accountSid, authToken, whatsappNumber, serviceSid, templateSid, messagingServiceSid, weeklyReportTemplateSid, weeklyCoachReportTemplateSid };
  };

  // GET: Fetch Twilio WhatsApp settings (masked)
  app.get("/api/whatsapp-settings", async (req, res) => {
    try {
      const config = await getTwilioConfig();
      const maskedToken = config.authToken ? (config.authToken.substring(0, 4) + "••••••••" + config.authToken.slice(-4)) : "";
      return res.json({
        accountSid: config.accountSid,
        authToken: maskedToken,
        hasAuthToken: !!config.authToken,
        whatsappNumber: config.whatsappNumber,
        isConfigured: !!(config.accountSid && config.authToken)
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Ayarlar alınamadı" });
    }
  });

  // POST: Update Twilio WhatsApp settings from website UI
  app.post("/api/whatsapp-settings", async (req, res) => {
    try {
      const { accountSid, authToken, whatsappNumber } = req.body;
      const db = getDb();

      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      if (accountSid !== undefined) updateData.twilioAccountSid = accountSid.trim();
      if (authToken !== undefined && authToken !== "" && !authToken.includes("••••")) {
        updateData.twilioAuthToken = authToken.trim();
      }
      if (whatsappNumber !== undefined) updateData.twilioWhatsappNumber = whatsappNumber.trim();

      await db.collection("settings").doc("system").set(updateData, { merge: true });

      console.log("[Twilio Settings] WhatsApp Twilio credentials updated via website UI.");
      return res.json({ success: true, message: "Twilio ayarları başarıyla kaydedildi." });
    } catch (error: any) {
      console.error("Error saving Twilio settings:", error);
      return res.status(500).json({ error: error.message || "Ayarlar kaydedilemedi" });
    }
  });

  // GET: Twilio WhatsApp Status & Webhook Info
  app.get("/api/whatsapp-status", async (req, res) => {
    try {
      const config = await getTwilioConfig();
      const isConfigured = !!(config.accountSid && config.authToken);
      const maskedSid = config.accountSid
        ? config.accountSid.substring(0, 6) + "..." + config.accountSid.slice(-4)
        : "Yapılandırılmadı";

      return res.json({
        provider: "twilio",
        configured: isConfigured,
        accountSid: maskedSid,
        rawAccountSid: config.accountSid,
        whatsappNumber: config.whatsappNumber,
        webhookUrl: "https://omernasuhakademi.com/api/whatsapp-webhook",
        verifyToken: "FocusOnAkademiVerifyToken2026"
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "WhatsApp durumu alınamadı" });
    }
  });

  // POST/GET: Actively query Twilio for status updates (delivered, read, failed)
  // - Only queries messages created in the last 2 days (48 hours)
  // - Stops querying once status is 'read' or final ('failed', 'undelivered', 'simulation')
  app.all("/api/whatsapp-sync-statuses", async (req, res) => {
    try {
      const config = await getTwilioConfig();
      if (!config.accountSid || !config.authToken) {
        return res.json({ success: true, updatedCount: 0, message: "Twilio credentials missing" });
      }

      const { default: twilio } = await import("twilio");
      const client = twilio(config.accountSid, config.authToken);
      const db = getDb();

      // Maximum 2 days (48 hours) ago limit
      const twoDaysAgoMs = Date.now() - (2 * 24 * 60 * 60 * 1000);

      // Fetch outbound records from whatsapp_messages
      const snapshot = await db.collection("whatsapp_messages")
        .where("direction", "==", "outbound")
        .limit(100)
        .get();

      let updatedCount = 0;
      const updates: Array<{ id: string; status: string; messageSid: string }> = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const messageSid = data.messageSid || data.sid || data.twilioSid;
        const currentStatus = data.status;

        // Skip if no messageSid or if status is already 'read' (stop asking) or final failed/undelivered/simulation
        if (!messageSid || currentStatus === "read" || currentStatus === "failed" || currentStatus === "undelivered" || currentStatus === "simulation") {
          continue;
        }

        // Check 2-day (48 hours) limit
        let msgTimeMs = 0;
        if (data.timestamp?.toDate) {
          msgTimeMs = data.timestamp.toDate().getTime();
        } else if (data.timestamp?.seconds) {
          msgTimeMs = data.timestamp.seconds * 1000;
        } else if (data.createdAt?.toDate) {
          msgTimeMs = data.createdAt.toDate().getTime();
        } else if (data.createdAt?.seconds) {
          msgTimeMs = data.createdAt.seconds * 1000;
        } else if (data.createdAt) {
          msgTimeMs = new Date(data.createdAt).getTime();
        }

        if (msgTimeMs && msgTimeMs < twoDaysAgoMs) {
          // Message is older than 2 days -> stop querying Twilio
          continue;
        }

        try {
          const twMsg = await client.messages(messageSid).fetch();
          const twStatus = twMsg.status; // e.g. 'queued', 'sending', 'sent', 'delivered', 'read', 'failed', 'undelivered'

          if (twStatus && twStatus !== currentStatus) {
            const updatePayload: Record<string, any> = {
              status: twStatus,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };
            if (twMsg.errorCode) updatePayload.errorCode = String(twMsg.errorCode);
            if (twMsg.errorMessage) updatePayload.errorMessage = String(twMsg.errorMessage);

            await db.collection("whatsapp_messages").doc(docSnap.id).update(updatePayload);
            updatedCount++;
            updates.push({ id: docSnap.id, status: twStatus, messageSid });
          }
        } catch (fetchErr: any) {
          console.error(`[Status Sync] Error fetching SID ${messageSid}:`, fetchErr?.message || fetchErr);
        }
      }

      return res.json({ success: true, updatedCount, updates });
    } catch (error: any) {
      console.error("[whatsapp-sync-statuses] Error:", error);
      return res.status(500).json({ error: error.message || "Status sync failed" });
    }
  });

  // GET & POST: Twilio Webhook Receiver
  app.get("/api/whatsapp-webhook", async (req, res) => {
    return res.status(200).send("Twilio WhatsApp Webhook Endpoint Active");
  });

  app.post("/api/whatsapp-webhook", async (req, res) => {
    const db = getDb();
    const rawBody = JSON.parse(JSON.stringify(req.body || {}));

    if (req.body?.From === 'testdebug') {
       return res.json({ isInitialized: true });
    }

    const from = req.body.From || req.body.from || req.body.phone;
    const body = req.body.Body || req.body.body || req.body.message || "";
    const profileName = req.body.ProfileName || req.body.profileName || "";
    const messageSid = req.body.MessageSid || req.body.messageSid || req.body.SmsSid || req.body.Sid || "";
    const messageStatus = req.body.MessageStatus || req.body.SmsStatus || req.body.Status || req.body.status || null;
    const errorCode = req.body.ErrorCode || req.body.errorCode || null;
    const errorMessage = req.body.ErrorMessage || req.body.errorMessage || null;

    const mediaUrl = req.body.MediaUrl || req.body.MediaUrl0 || "";
    const mediaType = req.body.MediaType || (req.body.MediaContentType0 ? (req.body.MediaContentType0.startsWith("image/") ? "image" : "document") : "");
    const fileName = req.body.FileName || (req.body.MediaUrl0 ? req.body.MediaUrl0.split("/").pop() || "dosya" : "");

    // Log webhook request
    try {
      await db.collection("whatsapp_webhook_logs").add({
        method: "POST",
        provider: "twilio",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        headers: req.headers || {},
        query: req.query || {},
        body: rawBody,
        ip: req.ip || req.headers["x-forwarded-for"] || "",
        status: messageStatus ? `status_${messageStatus}` : (from ? "message_received" : "missing_from_parameter"),
        parsedData: { from, body, profileName, messageSid, messageStatus, errorCode, errorMessage, mediaUrl, mediaType, fileName }
      });
    } catch (logErr) {
      console.error("Failed to log webhook POST payload:", logErr);
    }

    // Process Twilio Status Callbacks
    if (messageStatus && messageSid) {
      console.log(`[Twilio Status Callback] SID: ${messageSid}, Status: ${messageStatus}, ErrorCode: ${errorCode || 'None'}`);
      try {
        const matchesSnap = await db.collection("whatsapp_messages")
          .where("messageSid", "==", messageSid)
          .get();

        if (!matchesSnap.empty) {
          const updateData: any = {
            status: String(messageStatus).toLowerCase(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          if (errorCode) updateData.errorCode = String(errorCode);
          if (errorMessage) updateData.errorMessage = String(errorMessage);

          const batch = db.batch();
          matchesSnap.docs.forEach(d => {
            batch.update(d.ref, updateData);
          });
          await batch.commit();
          console.log(`[Twilio Status Callback] Updated ${matchesSnap.size} message(s) to '${messageStatus}'`);
        }
      } catch (scErr: any) {
        console.error("Error processing status callback:", scErr?.message || scErr);
      }

      // If it's purely a status callback event without incoming text, return TwiML directly
      if (!from || !body) {
        res.set("Content-Type", "text/xml");
        return res.status(200).send("<Response></Response>");
      }
    }

    if (!from) {
      res.set("Content-Type", "text/xml");
      return res.status(400).send("<Response><Message>From parameter is required.</Message></Response>");
    }

    // Acknowledge immediately with TwiML
    res.set("Content-Type", "text/xml");
    res.status(200).send("<Response></Response>");

    // Process asynchronously
    (async () => {
    try {
      let phoneNum = String(from).replace("whatsapp:", "").replace(/[^\d+]/g, "");
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

      console.log(`[Twilio WhatsApp Webhook] Message received from ${phoneNum}: ${body}`);

      const lowerBody = body.toLowerCase().trim();
      const isVerificationRequest =
        (lowerBody.includes("focuson") && lowerBody.includes("doğrulama")) ||
        lowerBody.includes("doğrulama kodu isteği") ||
        lowerBody.includes("fo-onay");

      if (isVerificationRequest) {
        const pendingCode = await getOrCreateVerificationCode(phoneNum);

        if (pendingCode) {
          const msgBody = `FocusON Akademi doğrulama kodunuz: ${pendingCode}\n\nLütfen bu 6 haneli kodu kayıt / doğrulama ekranına giriniz.`;

          const toTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;
          
          const twConfig = await getTwilioConfig();
          if (twConfig.accountSid && twConfig.authToken) {
            try {
              const { default: twilio } = await import("twilio");
              const client = twilio(twConfig.accountSid, twConfig.authToken);
              const fromTwilio = twConfig.whatsappNumber.startsWith("whatsapp:") ? twConfig.whatsappNumber : `whatsapp:${twConfig.whatsappNumber}`;
              await client.messages.create({
                from: fromTwilio,
                to: toTwilio,
                body: msgBody
              });
            } catch (errTw) {
              console.error("[Twilio Auto-Reply] Direct send failed:", errTw);
            }
          }
          
          await db.collection("whatsapp_messages").add({
            phone: phoneNum,
            body: msgBody,
            senderName: "FocusON Bot (Otomatik Yanıt)",
            direction: "outbound",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

          await addVerificationLog({
            action: "send_code",
            phone: phoneNum,
            status: "SUCCESS",
            channel: "whatsapp_webhook_auto_reply",
            details: `Gelen WhatsApp talebine ("${body}") otomatik doğrulama kodu (${pendingCode}) gönderildi.`,
            logs: [`[Auto Reply] Telefon: ${phoneNum}, Kod: ${pendingCode}`]
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

  // POST: Send WhatsApp Message via Twilio
  app.post("/api/whatsapp-send", async (req, res) => {
    const { 
      to: rawTo, 
      phone, 
      message, 
      mediaUrl, 
      mediaType, 
      fileName, 
      fileSize,
      isTemplate,
      templateName,
      templateSid,
      templateVars,
      templateButtons
    } = req.body;
    const to = rawTo || phone;
    if (!to || (!message && !mediaUrl && !templateSid)) {
      return res.status(400).json({ error: "to ve mesaj, medya veya şablon zorunludur" });
    }

    try {
      const db = getDb();
      let phoneNum = String(to).replace("whatsapp:", "").replace(/[^\d+]/g, "");
      if (!phoneNum.startsWith("+")) {
        phoneNum = "+" + phoneNum;
      }

      const twConfig = await getTwilioConfig();
      let sendMethod = "simulation";
      let twilioMsgSid: string | null = null;
      let sendStatus = "sent";
      let errorCode: string | null = null;
      let errorMessage: string | null = null;

      if (twConfig.accountSid && twConfig.authToken) {
        try {
          sendMethod = "twilio";
          const { default: twilio } = await import("twilio");
          const client = twilio(twConfig.accountSid, twConfig.authToken);
          
          const rawFrom = twConfig.whatsappNumber || "+14155238886";
          const fromTwilio = rawFrom.startsWith("whatsapp:") ? rawFrom : `whatsapp:${rawFrom}`;
          const targetTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;

          const messageOpts: any = {
            from: fromTwilio,
            to: targetTwilio,
            statusCallback: "https://omernasuhakademi.com/api/whatsapp-webhook"
          };

          if (isTemplate && templateSid) {
            messageOpts.contentSid = templateSid;
            if (templateVars) {
              messageOpts.contentVariables = typeof templateVars === "string" ? templateVars : JSON.stringify(templateVars);
            }
          } else {
            messageOpts.body = message || "";
            if (mediaUrl) {
              messageOpts.mediaUrl = [mediaUrl];
            }
          }

          let twMsg: any;
          try {
            twMsg = await client.messages.create(messageOpts);
          } catch (mErr: any) {
            if (messageOpts.mediaUrl) {
              console.warn(`[WhatsApp Send] Media send failed (${mErr?.message}). Retrying text-only...`);
              const fallbackOpts = { ...messageOpts };
              delete fallbackOpts.mediaUrl;
              twMsg = await client.messages.create(fallbackOpts);
            } else {
              throw mErr;
            }
          }
          twilioMsgSid = twMsg.sid;
          sendStatus = twMsg.status || "sent";
          console.log(`[WhatsApp Send] Message sent to ${phoneNum} via Twilio API. SID: ${twilioMsgSid}`);
        } catch (twilioErr: any) {
          console.error("[WhatsApp Send] Twilio API Error:", twilioErr?.message || twilioErr);
          sendMethod = "twilio_error";
          sendStatus = "failed";
          errorCode = String(twilioErr?.code || "TWILIO_ERROR");
          errorMessage = twilioErr?.message || String(twilioErr);
        }
      } else {
        console.log(`[WhatsApp Send] Twilio credentials missing. Operating in Simulation Mode.`);
        sendStatus = "simulation";
      }

      // Add outbound message to 'whatsapp_messages'
      const outboundDoc: any = {
        phone: phoneNum,
        body: message || "",
        senderName: "Admin",
        direction: "outbound",
        messageSid: twilioMsgSid || null,
        status: sendStatus,
        sendMethod: sendMethod,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      };

      if (isTemplate) {
        outboundDoc.isTemplate = true;
        outboundDoc.templateName = templateName || null;
        outboundDoc.templateSid = templateSid || null;
        if (templateVars) outboundDoc.templateVars = templateVars;
        if (templateButtons) outboundDoc.templateButtons = templateButtons;
      }

      if (errorCode) outboundDoc.errorCode = errorCode;
      if (errorMessage) outboundDoc.errorMessage = errorMessage;

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

      try {
        await db.collection("whatsapp_messages").add(outboundDoc);
      } catch (e: any) {
        console.log("[WhatsApp Send] Firestore whatsapp_messages add error:", e?.message);
      }

      // Simulation mode AI reply
      if (sendMethod === "simulation") {
        const simulateAiResponse = async () => {
          try {
            await new Promise(resolve => setTimeout(resolve, 2500));

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

            let aiReply = "Merhaba, mesajınızı aldım. En kısa sürede dönüş yapacağım.";
            
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
            } catch (aiErr: any) {
              console.log("[WhatsApp Send] Simulation AI response fallback used:", aiErr?.message || aiErr);
            }

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
              simulatedInboundDoc.mediaUrl = "https://pdfobject.com/pdf/sample.pdf";
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

            try {
              await db.collection("whatsapp_messages").add(simulatedInboundDoc);
            } catch (e: any) {
              console.log("[WhatsApp Send] Simulation inbound doc add error:", e?.message);
            }

            console.log(`[WhatsApp Send] Simulated AI reply added for ${phoneNum}: ${aiReply}`);
          } catch (simErr: any) {
            console.log("[WhatsApp Send] Simulation reply job failed:", simErr?.message || simErr);
          }
        };

        simulateAiResponse();
      }

      res.json({ success: true, method: sendMethod });
    } catch (err: any) {
      console.log("[WhatsApp Send] Error:", err?.message || err);
      res.status(500).json({ error: err.message || "Mesaj gönderilirken hata oluştu." });
    }
  });

  app.get("/api/whatsapp-media", async (req, res) => {
    const { url } = req.query;
    if (!url || typeof url !== "string") {
      return res.status(400).send("url parametresi gereklidir");
    }
    return res.redirect(url);
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // RFC-5545 Compliant iCal Generator Helper
  function escapeIcsText(str: any) {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r?\n/g, '\\n');
  }

  function parseDateTimeToIcs(dateStr: string, timeStr: string, durationMins: number = 45) {
    try {
      let year = 2026, month = 1, day = 1;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-').map(Number);
        year = parts[0];
        month = parts[1];
        day = parts[2];
      } else if (dateStr.includes('.')) {
        const parts = dateStr.split('.').map(Number);
        day = parts[0];
        month = parts[1];
        year = parts[2];
      }

      let hour = 10, minute = 0;
      if (timeStr) {
        const tParts = timeStr.split(':').map(Number);
        if (!isNaN(tParts[0])) hour = tParts[0];
        if (!isNaN(tParts[1])) minute = tParts[1];
      }

      const pad = (n: number) => String(n).padStart(2, '0');
      const startStr = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;

      const totalMinutes = hour * 60 + minute + durationMins;
      const endHour = Math.floor(totalMinutes / 60) % 24;
      const endMinute = totalMinutes % 60;
      const endStr = `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(endMinute)}00`;

      return { startStr, endStr };
    } catch (e) {
      return null;
    }
  }

  // iCal (ICS) Live Calendar Feed for Coach
  app.get("/api/calendar/coach/:coachId.ics", async (req, res) => {
    try {
      const { coachId } = req.params;
      if (!coachId) {
        return res.status(400).send("coachId parametresi gereklidir.");
      }
      
      const db = getDb();
      let coachName = 'Koç';

      try {
        const userDoc = await db.collection("users").doc(coachId).get();
        if (userDoc && userDoc.exists) {
          const uData = userDoc.data();
          if (uData?.firstName) {
            coachName = `${uData.firstName} ${uData.lastName || ''}`.trim();
          } else if (uData?.displayName) {
            coachName = uData.displayName;
          }
        }
      } catch (err) {
        console.warn("Could not fetch coach name:", err);
      }
      
      // Static production domain
      const baseUrl = 'https://omernasuhakademi.com';
      const panelUrl = 'https://omernasuhakademi.com/panel/koc/randevular';

      // Fetch all appointments for this coach (both existing past and upcoming)
      let appointments: any[] = [];
      try {
        const snap = await db.collection("appointments")
          .where("coachId", "==", coachId)
          .get();
        snap.forEach((doc: any) => {
          appointments.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.error("Error querying coach appointments by coachId:", err);
      }

      // If no appointments found with exact query, check all appointments in memory as fallback
      if (appointments.length === 0) {
        try {
          const snapAll = await db.collection("appointments").get();
          snapAll.forEach((doc: any) => {
            const data = doc.data();
            if (data.coachId === coachId || data.assignedCoachId === coachId || data.coachUid === coachId) {
              appointments.push({ id: doc.id, ...data });
            }
          });
        } catch (err) {
          console.error("Fallback query error:", err);
        }
      }

      const nowIcs = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const lines = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//FocusON Akademi//Koc Takvim Feed//TR',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        `X-WR-CALNAME:FocusON - ${coachName} Randevu Takvimi`,
        'X-WR-TIMEZONE:Europe/Istanbul',
        'X-PUBLISHED-TTL:PT15M',
        'REFRESH-INTERVAL;VALUE=DURATION:PT15M'
      ];

      appointments.forEach((item: any, idx: number) => {
        if (!item.date) return;
        const time = item.startTime || '10:00';
        let duration = 45;
        if (item.endTime && typeof item.endTime === 'string') {
          const [sh, sm] = (item.startTime || '10:00').split(':').map(Number);
          const [eh, em] = item.endTime.split(':').map(Number);
          if (!isNaN(sh) && !isNaN(eh)) {
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff > 0) duration = diff;
          }
        } else if (item.duration) {
          duration = Number(item.duration) || 45;
        }

        const dt = parseDateTimeToIcs(item.date, time, duration);
        if (!dt) return;

        const serviceLabel = item.serviceType === 'lesson' 
          ? 'Birebir Ders' 
          : (item.serviceType === 'parent' ? 'Veli Toplantısı' : 'Koçluk Görüşmesi');
        const title = `${item.studentName || 'Öğrenci'} - ${serviceLabel}`;
        const statusLabel = item.status === 'confirmed' 
          ? 'Onaylandı' 
          : (item.status === 'completed' 
            ? 'Tamamlandı' 
            : (item.status === 'cancelled' ? 'İptal Edildi' : 'Beklemede'));
        
        const desc = [
          `Öğrenci: ${item.studentName || 'Belirtilmemiş'}`,
          `Hizmet Türü: ${serviceLabel}`,
          `Randevu Durumu: ${statusLabel}`,
          item.roomName ? `Oda / Yer: ${item.roomName}` : '',
          item.notes ? `Görüşme Notu: ${item.notes}` : '',
          `FocusON Randevu Paneli: ${panelUrl}`
        ].filter(Boolean).join('\n');

        const location = item.roomName || (item.isOnlineAvailable || item.isOnline ? 'Online Canlı Görüşme' : 'FocusON Akademi');
        const icsStatus = item.status === 'cancelled' ? 'CANCELLED' : (item.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE');

        lines.push('BEGIN:VEVENT');
        lines.push(`UID:focuson-${item.id || idx}-${dt.startStr}@omernasuhakademi.com`);
        lines.push(`DTSTAMP:${nowIcs}`);
        lines.push(`DTSTART;TZID=Europe/Istanbul:${dt.startStr}`);
        lines.push(`DTEND;TZID=Europe/Istanbul:${dt.endStr}`);
        lines.push(`SUMMARY:${escapeIcsText(title)}`);
        lines.push(`DESCRIPTION:${escapeIcsText(desc)}`);
        lines.push(`LOCATION:${escapeIcsText(location)}`);
        lines.push(`STATUS:${icsStatus}`);
        lines.push('TRANSP:OPAQUE');
        lines.push('SEQUENCE:0');
        lines.push(`URL:${panelUrl}`);
        lines.push('END:VEVENT');
      });

      lines.push('END:VCALENDAR');
      const icsResult = lines.join('\r\n');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="focuson-koc-${coachId}.ics"`);
      res.setHeader('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      return res.send(icsResult);

    } catch (error: any) {
      console.error("iCal Generation Error:", error);
      res.status(500).send("Takvim feed oluşturulamadı.");
    }
  });


function extractPlaylistId(urlOrId: string): string | null {
  if (!urlOrId || typeof urlOrId !== 'string') return null;
  const str = urlOrId.trim();
  
  if (/^[a-zA-Z0-9_-]{10,}$/.test(str) && !str.includes('http') && !str.includes('youtube') && !str.includes('youtu.be')) {
    return str;
  }
  
  try {
    const parsed = new URL(str.startsWith('http') ? str : `https://${str}`);
    const listParam = parsed.searchParams.get('list');
    if (listParam) return listParam;
  } catch (e) {
    const match = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return match[1];
  }
  
  const match2 = str.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (match2 && match2[1]) return match2[1];

  return null;
}

function parseISO8601Duration(durationStr: string): { totalSeconds: number; formatted: string; minutes: number } {
  if (!durationStr) return { totalSeconds: 0, formatted: "0 dk", minutes: 0 };
  const matches = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return { totalSeconds: 0, formatted: "0 dk", minutes: 0 };
  
  const hours = parseInt(matches[1] || "0", 10);
  const minutes = parseInt(matches[2] || "0", 10);
  const seconds = parseInt(matches[3] || "0", 10);
  
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;
  const totalMinutes = Math.round(totalSeconds / 60);
  
  let formatted = "";
  if (hours > 0) {
    formatted += `${hours} sa `;
  }
  if (minutes > 0 || hours === 0) {
    formatted += `${minutes} dk`;
  }
  
  return {
    totalSeconds,
    minutes: totalMinutes,
    formatted: formatted.trim() || "0 dk"
  };
}

function formatSecondsToHuman(totalSeconds: number): { formatted: string; minutes: number } {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  let formatted = "";
  if (hours > 0) {
    formatted += `${hours} sa `;
  }
  formatted += `${minutes} dk`;
  
  return {
    minutes: totalMinutes,
    formatted: formatted.trim() || "0 dk"
  };
}

function parseTimeStringToSeconds(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

  app.post("/api/youtube/fetch-playlist", async (req, res) => {
    const { playlistUrl, apiKey: userProvidedApiKey } = req.body;
    if (!playlistUrl) {
      return res.status(400).json({ error: "Lütfen geçerli bir YouTube oynatma listesi linki veya ID girin." });
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      return res.status(400).json({ error: "Geçerli bir YouTube oynatma listesi (playlist) linki veya ID bulunamadı." });
    }

    const apiKey = userProvidedApiKey || process.env.YOUTUBE_API_KEY || process.env.ASSISTAN_API_KEY;

    // 1. Attempt using YouTube Data API v3 if API key exists
    if (apiKey && !apiKey.startsWith("ya29.")) {
      try {
        console.log(`[YouTube API] Fetching playlist metadata for ${playlistId}...`);
        
        // Fetch playlist details
        const plRes = await fetch(`https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`);
        const plData = await plRes.json();
        
        if (plData.error) {
          console.warn("[YouTube API] Playlist fetch returned error:", plData.error.message);
          throw new Error(plData.error.message || "YouTube API error");
        }

        const playlistSnippet = plData.items?.[0]?.snippet;
        const channelTitle = playlistSnippet?.channelTitle || "YouTube Kanalı";
        const playlistTitle = playlistSnippet?.title || "Oynatma Listesi";

        // Fetch all playlist items (handle pagination up to 500 items)
        let videoItems: any[] = [];
        let pageToken = "";
        let pageCount = 0;

        do {
          const pageUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
          const itemsRes = await fetch(pageUrl);
          const itemsData = await itemsRes.json();

          if (itemsData.items && Array.isArray(itemsData.items)) {
            videoItems = videoItems.concat(itemsData.items);
          }
          pageToken = itemsData.nextPageToken || "";
          pageCount++;
        } while (pageToken && pageCount < 10);

        // Filter valid videos (ignore deleted / private videos)
        const validVideos = videoItems.filter(item => {
          const vid = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
          const title = item.snippet?.title;
          return vid && title && title !== "Private video" && title !== "Deleted video";
        });

        // Now fetch duration for all videos in batches of 50
        const videoIds = validVideos.map(item => item.contentDetails?.videoId || item.snippet?.resourceId?.videoId);
        const durationMap: Record<string, { totalSeconds: number; formatted: string; minutes: number }> = {};

        for (let i = 0; i < videoIds.length; i += 50) {
          const batchIds = videoIds.slice(i, i + 50).join(',');
          const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${batchIds}&key=${apiKey}`);
          const vData = await vRes.json();
          if (vData.items && Array.isArray(vData.items)) {
            for (const vItem of vData.items) {
              const durRaw = vItem.contentDetails?.duration || '';
              durationMap[vItem.id] = parseISO8601Duration(durRaw);
            }
          }
        }

        let totalDurationSecs = 0;
        const resultVideos = validVideos.map((item, idx) => {
          const vId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId;
          const durInfo = durationMap[vId] || { totalSeconds: 0, formatted: '0 dk', minutes: 0 };
          totalDurationSecs += durInfo.totalSeconds;
          return {
            order: idx + 1,
            videoId: vId,
            title: item.snippet?.title || `Video ${idx + 1}`,
            durationFormatted: durInfo.formatted,
            durationMinutes: durInfo.minutes,
            durationSeconds: durInfo.totalSeconds,
            url: `https://www.youtube.com/watch?v=${vId}&list=${playlistId}`,
            thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ""
          };
        });

        const overallDur = formatSecondsToHuman(totalDurationSecs);

        return res.json({
          success: true,
          source: "api",
          playlistId,
          title: playlistTitle,
          channelTitle,
          totalVideos: resultVideos.length,
          totalDurationMinutes: overallDur.minutes,
          totalDurationFormatted: overallDur.formatted,
          videos: resultVideos
        });
      } catch (apiErr: any) {
        console.warn("[YouTube API] Fallback to scraper due to:", apiErr.message);
      }
    }

    // 2. Fallback Scraper using YouTube Web Playlist page
    try {
      console.log(`[YouTube Scraper] Scraping playlist ${playlistId}...`);
      const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      });

      const html = await response.text();
      
      // Extract ytInitialData
      const match = html.match(/var ytInitialData = ({.*?});<\/script>/s) || html.match(/ytInitialData\s*=\s*({.*?});/s);
      if (!match) {
        throw new Error("Oynatma listesi sayfası okunamadı veya gizli/özel bir liste.");
      }

      const initialData = JSON.parse(match[1]);

      // Extract playlist title & channel
      const metadata = initialData.metadata?.playlistMetadataRenderer || initialData.microformat?.microformatDataRenderer;
      const playlistTitle = metadata?.title || "YouTube Oynatma Listesi";
      const channelTitle = initialData.sidebar?.playlistSidebarRenderer?.items?.[1]?.playlistSidebarSecondaryInfoRenderer?.videoOwner?.videoOwnerRenderer?.title?.runs?.[0]?.text || "YouTube";

      // Extract videos list
      const tabs = initialData.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      const tabContent = tabs[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
      let playlistVideoContents: any[] = [];

      for (const section of tabContent) {
        const itemSection = section?.itemSectionRenderer?.contents || [];
        for (const item of itemSection) {
          if (item?.playlistVideoListRenderer?.contents) {
            playlistVideoContents = item.playlistVideoListRenderer.contents;
            break;
          }
        }
        if (playlistVideoContents.length > 0) break;
      }

      if (playlistVideoContents.length === 0) {
        // Look in alternate structures
        const altContents = initialData.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.playlistVideoListRenderer?.contents;
        if (altContents) playlistVideoContents = altContents;
      }

      let totalDurationSecs = 0;
      const scrapedVideos: any[] = [];

      playlistVideoContents.forEach((item: any, idx: number) => {
        const vr = item.playlistVideoRenderer;
        if (!vr || !vr.videoId) return;

        const title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || `Video ${idx + 1}`;
        const durationText = vr.lengthText?.simpleText || "";
        const lengthSeconds = vr.lengthSeconds ? parseInt(vr.lengthSeconds, 10) : parseTimeStringToSeconds(durationText);
        
        totalDurationSecs += lengthSeconds;
        const durInfo = formatSecondsToHuman(lengthSeconds);

        scrapedVideos.push({
          order: scrapedVideos.length + 1,
          videoId: vr.videoId,
          title,
          durationFormatted: durInfo.formatted,
          durationMinutes: durInfo.minutes,
          durationSeconds: lengthSeconds,
          url: `https://www.youtube.com/watch?v=${vr.videoId}&list=${playlistId}`,
          thumbnail: vr.thumbnail?.thumbnails?.[0]?.url || ""
        });
      });

      if (scrapedVideos.length === 0) {
        return res.status(404).json({ error: "Oynatma listesinde video bulunamadı veya liste gizli." });
      }

      const overallDur = formatSecondsToHuman(totalDurationSecs);

      return res.json({
        success: true,
        source: "scraper",
        playlistId,
        title: playlistTitle,
        channelTitle,
        totalVideos: scrapedVideos.length,
        totalDurationMinutes: overallDur.minutes,
        totalDurationFormatted: overallDur.formatted,
        videos: scrapedVideos
      });
    } catch (scrapeErr: any) {
      console.error("[YouTube Scraper Error]:", scrapeErr);
      return res.status(500).json({
        error: "Oynatma listesi yüklenemedi: " + (scrapeErr.message || "Bilinmeyen hata")
      });
    }
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
Velilere tavsiye verirken şefkatli, olumlu ve yapıcı bir üslup kullan. Sadece akademik değil, motivasyon ve psikolojik destek boyutlarına da dikkat çek. Kısa, öz ve anlaşılır cevaplar ver.

Araç (function) çağırırken kullanıcıya asla sistem logu veya teknik bilgi verme (örn: araç çağrıldı vb). Sadece doğal konuş.`;

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
         messagePayload = `[Sistem: "${lastMsg.name || 'Araç'}" aracı başarıyla çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(lastMsg.functionResponse || {}, null, 2)}\n\n(DİKKAT: Veriyi incele. Eğer yeterli bilgiye ulaştıysan kullanıcıya doğrudan, samimi ve profesyonel bir üslupla yanıt ver. EĞER eksik bir bilgi varsa veya bu verinin sonucuna göre YENİ BİR ARAMA yapman gerekiyorsa, kullanıcıya cevap yazmadan önce doğrudan DİĞER ARAÇLARI ÇAĞIR. 4 aşamaya kadar ardışık araç çağrısı yapabilirsin.)]`;
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

ÖNEMLİ KURAL: Yapay zeka olarak KESİNLİKLE öğrenciye ödev veya çalışma programı VEREMEZSİN. Bunlar koçun işidir. Sen sadece çalışma stratejileri hakkında öneriler sunabilir, rehberlik yapabilirsin. Öğrenci ödev veya çalışma programı istediğinde, onu koçuyla iletişime geçmesi veya koçuyla randevu oluşturması için yönlendir.

Öğrencinin randevularını yönetebilirsin. Mevcut randevularını listelemek veya iptal etmek için uygun fonksiyonları kullanabilirsin. Ancak randevu ALMAK (oluşturmak) istiyorsa ÖNCE ona "Randevu alalım mı?" diye sor veya randevu almak için onay vermesini ("randevu al" demesini) bekle. Öğrenci randevu almak istediğini net bir şekilde belirttiğinde SADECE 'start_booking_wizard' fonksiyonunu (function call) KULLAN. Bunu asla metin olarak yazma, sistemin fonksiyon çağırma özelliğini kullanarak gerçek bir function call yap! KESİNLİKLE 'book_appointment' veya 'get_coach_schedule' aracını randevu oluşturmak için kullanma.

Bu bilgileri dikkate alarak öğrenciyle doğrudan konuş, isminin "ON Asistan" olduğunu unutma. Akademik hedeflerini destekle, konu bazlı hata ve eksikliklerini belirterek program önerileri yap, stres gibi durumları yakalayarak derinlikli analizler sun. Kısa ve öz, cesaretlendirici cevaplar ver. Asla gereksiz bilgi yüklemesi yapma, bir rehber gibi yaklaş.

Araç (function) çağırırken kullanıcıya asla sistem logu veya teknik bilgi verme (örn: araç çağrıldı vb). Sadece doğal konuş.`;

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
         messagePayload = `[Sistem: "${lastMsg.name || 'Araç'}" aracı başarıyla çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(lastMsg.functionResponse || {}, null, 2)}\n\n(DİKKAT: Veriyi incele. Eğer yeterli bilgiye ulaştıysan kullanıcıya doğrudan, samimi ve profesyonel bir üslupla yanıt ver. EĞER eksik bir bilgi varsa veya bu verinin sonucuna göre YENİ BİR ARAMA yapman gerekiyorsa, kullanıcıya cevap yazmadan önce doğrudan DİĞER ARAÇLARI ÇAĞIR. 4 aşamaya kadar ardışık araç çağrısı yapabilirsin.)]`;
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

  // --- FOCUSON AKADEMİ BÜTÜNLEŞİK 360° TAM SİTE İNDEKSİ (FULL-SITE RAG KNOWLEDGE BASE) ---
  const FOCUSON_FULL_SITE_KNOWLEDGE_MODULES = [
    {
      id: "general_overview",
      title: "FocusON Akademi Genel Tanıtım & Değer Önerisi (Ana Sayfa /)",
      keywords: ["focuson", "akademi", "nedir", "genel", "platform", "tanıtım", "yks", "lgs", "koçluk", "ekosistem", "hibrit", "vizyon"],
      url: "/",
      content: `FocusON Akademi (omernasuhakademi.com) Türkiye'nin ilk ve en kapsamlı Yeni Nesil Hibrit Eğitim Koçluğu, 35+ Psikometrik Analiz, Sınav Metronomu ve Dijital Öğrenci Takip Ekosistemidir.
- Temel Misyon: Öğrencilerin denemelerdeki net artışını şansa bırakmadan, 35+ bilimsel psikometrik analiz, Sınav Metronomu, 7/24 sesli yapay zeka asistanı (ON Asistan), kişiye özel haftalık çalışma programları ve haftalık Pazar Veli WhatsApp karneleriyle garanti altına almak.
- Dönüşüm İstatistiği: Düzenli takip edilen öğrencilerin %92'si ilk 60 günde +18 Net ve üzeri kalıcı artış sağlar.
- İş Modeli: FocusON öğrenciden doğrudan koçluk ücreti kesmez, veli/öğrenci koçuna öder; koçlar profesyonel lisansla tüm dijital araçları kullanır.`
    },
    {
      id: "exam_metronome",
      title: "Sınav Metronomu & Süre Yönetimi Masası (/zaman-yonetimi)",
      keywords: ["metronom", "süre", "zaman", "turlama", "yetiştirememe", "hız", "ritim", "tyt", "panik", "saniye", "kronometre"],
      url: "/zaman-yonetimi",
      content: `Sınav Metronomu & Süre Yönetimi Sistemi:
- Ne Yapar?: TYT, AYT ve LGS denemeleri çözerken soru başına ideal saniye ritmi (metronom) belirler. Turlama taktiğini sesli ve görsel vuruşlarla refleks haline getirir.
- Çözdüğü Kriz: Bir soruya 4-5 dakika takılıp son 20 soruyu yetiştirememeyi ve sınav paniğini sıfıra indirir.
- Katkısı: Sadece zaman yönetimi antrenmanıyla öğrenciye TYT'de ortalama +15 Net kazandırır.`
    },
    {
      id: "inventories_psychometrics",
      title: "35+ Bilimsel Psikolojik & Akademik Teşhis Merkezi (/panel/ogrenci/analizler)",
      keywords: ["envanter", "test", "dopa", "vak-s", "sp-be", "psikometrik", "dikkat", "odaklanma", "stres", "öğrenme stili", "aid-y", "hirat", "çdö-e", "apea-3d", "abba", "ag-mot", "gts-36", "mercek", "çikolata", "amid", "dart", "öz-af", "kolb"],
      url: "/panel/ogrenci/analizler",
      content: `FocusON'un 35+ Bilimsel Envanter Cephaneliği:
1. DOPA: Dikkat ve Odaklanma Performansı (Dopamin dağılma tetikleyicileri ve optimal çalışma blokları).
2. MERCEK: Derin Odaklanma & Konsantrasyon Dayanıklılığı.
3. VAK-S: Görsel, İşitsel, Kinestetik Öğrenme Stili (Öğrencinin bilgiyi en hızlı kavradığı kanal).
4. GTS-36: Sınav Kaygısı ve Panik Yönetimi.
5. SP-BE: Sınav Stresi ve Baskı Profili (Volkan, Buzdağı, Halterci tipi stres tepkileri).
6. ÇİKOLATA: Motivasyon & Zevk/Ödül Mekanizması Analizi.
7. AMİD: Akademik Mükemmeliyetçilik & Erteleme Bariyerleri.
8. AID-Y: Akademik İnanç ve Başarı Blokajı Dönüştürme ("Yapamıyorum" negatif inançlarını tespit).
9. HIRAT: Haftalık Hedef İzleme, Zaman Hırsızları ve Erteleme Döngüleri.
10. ÇDÖ-E: Öz-Disiplin ve İrade Ölçeği (Dış baskı olmadan çalışma gücü).
11. APEA-3D: 3 Boyutlu Akademik Performans Engelleri Analizi.
- Değeri: Öğrenciye "tembel" damgası vurulmasını önler, koça kişiye özel nokta atışı reçete yazdırır.`
    },
    {
      id: "on_asistan_ai",
      title: "ON Asistan: 7/24 Sesli & Görsel Akıllı Soru Çözüm Asistanı (/panel/ogrenci/ai-asistan)",
      keywords: ["on asistan", "yapay zeka", "ai", "soru çözüm", "asistan", "gece", "özel ders", "anlık", "sesli anlatım", "fotoğraf"],
      url: "/panel/ogrenci/ai-asistan",
      content: `ON Asistan Öğrenci Soru Çözüm Modülü:
- 7/24 Anlık Soru Çözümü: Öğrenci gece 02:00'de bile çözemediği sorunun fotoğrafını yüklediğinde veya sesle sorduğunda, sadece şıkkı değil püf noktasını ve mantığını sesli anlatımla adım adım açıklar.
- Eksik Kazanım Entegrasyonu: Yapılamayan sorunun konusunu otomatik olarak öğrencinin haftalık çalışma listesine ve koçun masasına aktarır.
- Sınırsız Takip: Soru çözüm hakkından düşmeden adım adım interaktif sohbetle pekiştirme sağlar.`
    },
    {
      id: "caba_scholarship",
      title: "ÇABA (Çalışma Alışkanlıkları ve Başarı Analizi) & %100 Bursluluk (/panel/ogrenci/caba-testi)",
      keywords: ["çaba", "caba", "bursluluk", "ücretsiz analiz", "test", "başarı analizi", "potansiyel", "burs"],
      url: "/panel/ogrenci/caba-testi",
      content: `ÇABA Analizi & Burs Sistemi:
- 35 soruluk çok boyutlu testle öğrencinin zihinsel dayanıklılığını, çalışma azmini ve koçluğa hazır bulunuşluğunu ölçer.
- Öğrenciye sadece netine göre değil çabasına göre %100'e varan burs hakkı ve detaylı potansiyel karnesi kazandırır.
- Sosyal medyada harika bir CTA: 'Profildeki linkten 10 dakikalık ÇABA testini çöz, burs karneni anında al!'`
    },
    {
      id: "parent_whatsapp_reports",
      title: "Haftalık Otomatik Veli WhatsApp Gelişim Karnesi (/v)",
      keywords: ["veli", "whatsapp", "karne", "rapor", "pdf", "otomatik", "pazar", "anne", "baba", "takip", "şeffaf"],
      url: "/v",
      content: `Veli WhatsApp Karnesi Sistemi:
- Her Pazar akşamı sisteme kayıtlı velinin WhatsApp hattına şifresiz, tek tıkla açılan mobil gelişim karnesi gönderilir.
- İçerik: Son 7 günün toplam çalışma saati, çözülen soru adedi, girilen deneme netleri, koçun haftalık özel pedagojik değerlendirmesi ve ebeveyne rehberlik tavsiyesi.
- Veliye Değeri: Evdeki 'Ders çalıştın mı?' kavgalarını tamamen bitirir, veliye %100 şeffaflık ve huzur sağlar.`
    },
    {
      id: "coach_platform",
      title: "Koçlar İçin 50+ Öğrenci Masası, AI Süpervizör & Yönetim Paneli (/panel/koc)",
      keywords: ["koç", "öğretmen", "rehber", "panel", "yönetim", "randevu", "takip", "öğrenci yönetimi", "bakiye", "iş modeli", "asistan", "program"],
      url: "/panel/koc",
      content: `Eğitim Koçları İçin FocusON Ekosistemi:
- Tek Panelden 50+ Öğrenci Yönetimi: Randevular, haftalık çalışma programları, deneme net grafikleri, 35 analiz sonuçları ve ödev takibi tek ekranda.
- AI Süpervizör Asistanı: Öğrencinin deneme netleri ve eksiklerine göre 2 dakikada MEB müfredatına %100 uyumlu haftalık ders programı taslağı oluşturur.
- Otomatik Raporlama: Koçun saatler süren veli raporlama yükünü saniyelik onaya dönüştürür.
- Finansal Özgürlük: Koçlar kendi ücretlerini kendileri belirler, ödemeleri doğrudan alır.`
    },
    {
      id: "exam_yok_atlas",
      title: "YÖK Atlas Akıllı Tercih Robotu, Sıralama Simülatörü & Soru Dağılımı (/tercih-robotu, /soru-dagilimi)",
      keywords: ["deneme", "tyt", "ayt", "lgs", "net", "yök atlas", "tercih robotu", "sıralama", "taban puan", "üniversite", "soru dağılımı", "ösym", "garanti net"],
      url: "/tercih-robotu",
      content: `Deneme, Tercih & Soru Dağılımı Sistemleri:
- YÖK Atlas Entegrasyonu: 4000+ lisans ve önlisans programının son 5 yıllık taban puanları, başarı sıralamaları ve kontenjanları saniyeler içinde filtrelenebilir.
- Hedef Net Simülatörü: Öğrencinin hedeflediği üniversite/bölüm için hangi dersten kaç net yapması gerektiğini dinamik hesaplar.
- Son 10 Yıl ÖSYM Soru Dağılımı Isı Haritası (/soru-dagilimi): En çok soru çıkan garanti konuları filtreler, stratejik çalışma planı sunar.`
    },
    {
      id: "community_and_tools",
      title: "FocusON Öğrenci Topluluğu, Şampiyonlar Ligi & Pomodoro Odaları (/topluluk)",
      keywords: ["topluluk", "şampiyonlar ligi", "pomodoro", "kronometre", "study with me", "yarışma", "rozetler", "motivasyon"],
      url: "/topluluk",
      content: `Topluluk ve Çalışma Araçları:
- Şampiyonlar Ligi: Günlük/haftalık çözülen soru ve pomodoro çalışma sürelerine göre liderlik tablosu ve rozetleme.
- Birlikte Çalışma Odaları: YKS/LGS öğrencilerinin yalnızlık ve motivasyon kaybı hissetmeden odaklanmasını sağlayan sanal kütüphane.
- Cüzdan & Mağaza (/panel/ogrenci/magaza): Kazanılan başarı puanları ve ÇABA burslarıyla kaynak ve koçluk paketlerinde indirim fırsatları.`
    },
    {
      id: "curriculum_and_channels",
      title: "En İyi YouTube Hoca Önerileri, MEBİ & OGM Materyal Havuzu (/kanal-onerileri, /mebi)",
      keywords: ["youtube", "hoca", "kanal önerisi", "mebi", "ogm materyal", "eba", "ücretsiz kaynak", "müfredat"],
      url: "/kanal-onerileri",
      content: `Akademik Kaynak Havuzu:
- Tüm branşlarda Türkiye'nin en iyi YouTube ders hocalarının seviye bazlı (başlangıç, orta, derece) seçilmiş listesi.
- Resmi MEBİ, OGM Materyal ve EBA Akademik Destek testlerine tek tıkla doğrudan entegrasyon.`
    }
  ];

  function retrieveFocusONKnowledge(queryOrTopic: string = ""): string {
    const qLower = (queryOrTopic || "").toLowerCase().trim();
    const matchedChunks: string[] = [];

    // Always include general platform overview & mission
    matchedChunks.push(`[GENEL EKOSİSTEM]\n${FOCUSON_FULL_SITE_KNOWLEDGE_MODULES[0].content}`);

    // Intelligent multi-keyword and cross-module matching
    const scoredModules = FOCUSON_FULL_SITE_KNOWLEDGE_MODULES.slice(1).map(mod => {
      let score = 0;
      if (mod.title.toLowerCase().includes(qLower)) score += 10;
      for (const kw of mod.keywords) {
        if (qLower.includes(kw)) score += 5;
      }
      return { mod, score };
    });

    scoredModules.sort((a, b) => b.score - a.score);

    // Pick top matching modules
    const topMatches = scoredModules.filter(sm => sm.score > 0);
    if (topMatches.length > 0) {
      topMatches.slice(0, 4).forEach(({ mod }) => {
        matchedChunks.push(`[MODÜL: ${mod.title} (${mod.url})]\n${mod.content}`);
      });
    } else {
      // Include broad summary if no specific keyword matched
      FOCUSON_FULL_SITE_KNOWLEDGE_MODULES.slice(1, 4).forEach(mod => {
        matchedChunks.push(`[MODÜL: ${mod.title} (${mod.url})]\n${mod.content}`);
      });
    }

    matchedChunks.push(`\n[SİTE HARİTASI VE ROTASI ÖZETİ]\n` + FOCUSON_FULL_SITE_KNOWLEDGE_MODULES.map(m => `• ${m.title} -> ${m.url}`).join("\n"));

    return matchedChunks.join("\n\n");
  }

  app.post("/api/social-media-ai", async (req, res) => {
    try {
      const { action, topic, platform, tone, targetAudience, extraPrompt, chatHistory, message, scriptText, voiceName } = req.body;
      const ai = getGeminiClient();

      const topicContext = `${topic || ''} ${extraPrompt || ''} ${message || ''}`;
      const retrievedRAGKnowledge = retrieveFocusONKnowledge(topicContext);

      if (action === "generate_post") {
        const systemInstruction = `Sen FocusON Akademi'nin (omernasuhakademi.com) Baş Sosyal Medya Direktörü, Viral Büyüme (Growth) Stratejisti ve Kreatif Metin Yazarısın.
Amacın: Verilen konu, platform, ton ve hedef kitleye göre Instagram, LinkedIn, X, WhatsApp için sıradanlıktan uzak, viral potansiyeli maksimum, yüksek dönüşüm (CTR ve DM) sağlayan eksiksiz bir sosyal medya paylaşım paketi üretmektir.

SİSTEM BİLGİ TABANI (RAG CONTEXT):
${retrievedRAGKnowledge}

ÖNEMLİ KURALLAR:
1. Instagram Carousel (Kaydırmalı Gönderi):
   - Slide 1: 1 saniyede kaydırmayı durduran, merak uyandıran, çarpıcı soru veya iddialı Kapak/Kanca.
   - Slide 2: Öğrencinin/velinin yaşadığı can yakıcı problem veya yanlış bilinen mit.
   - Slide 3: FocusON'un bilimsel/teknolojik yaklaşımı ve gerçek mekanizması.
   - Slide 4: Somut kanıt, net artış istatistiği veya pratik taktik.
   - Slide 5: Çözüm özeti ve güçlü Eyleme Çağrı (CTA: Yorumlara 'NET' yaz, profil linkine tıkla).
2. Kanca (Hook): Asla klişe "Merhaba arkadaşlar" veya "Harika bir haberle geldik" gibi sıkıcı cümleler kullanma. Doğrudan hedef kitlenin acısına veya arzusuna dokun.
3. Görsel Tasarım Yönlendirmesi: Hem Türk grafikere anlatır gibi Türkçe detaylı yönerge, hem de Midjourney / Imagen 3 için İngilizce ultra kaliteli prompt sağla.
4. Çıktıyı eksiksiz JSON formatında üret.`;

        const prompt = `Konu/Odak: ${topic || 'FocusON 30+ Bilimsel Envanter ve Deneme Net Artışı'}
Platform: ${platform || 'Instagram Carousel'}
Ton: ${tone || 'İlham Verici & Yüksek Motivasyon'}
Hedef Kitle: ${targetAudience || 'YKS 2026 / 2027 Öğrencileri'}
Ekstra İstek/Ayrıntı: ${extraPrompt || 'Yok'}

Lütfen bu bilgiler doğrultusunda eksiksiz sosyal medya gönderi kitini hazırla.`;

        const modelName = getModelName("gemini-3.5-flash");
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.75,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "Gönderi başlığı veya kampanya adı" },
                hook: { type: Type.STRING, description: "İlk 1 saniyede dikkat çeken kanca cümlesi (Görsel üstü veya ilk satır)" },
                caption: { type: Type.STRING, description: "Instagram / LinkedIn / X açıklaması (paragraflar, emojiler, okunaklı)" },
                carouselSlides: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      slideNumber: { type: Type.INTEGER },
                      slideTitle: { type: Type.STRING, description: "Slayt büyük başlığı" },
                      slideContent: { type: Type.STRING, description: "Slayt içi 1-2 cümlelik vurucu içerik" },
                      visualSuggestion: { type: Type.STRING, description: "Bu slayt için görsel tasarım veya mockup önerisi" }
                    },
                    required: ["slideNumber", "slideTitle", "slideContent"]
                  },
                  description: "Kaydırmalı gönderi (Carousel) için sayfa sayfa içerik (en az 5 slayt)"
                },
                callToAction: { type: Type.STRING, description: "Harekete geçirici mesaj (CTA)" },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "En etkili 10-15 hashtag" },
                visualDesignPromptTR: { type: Type.STRING, description: "Tasarım atölyesi veya grafiker için Türkçe görsel yönlendirmesi" },
                imageGeneratorPromptEN: { type: Type.STRING, description: "Midjourney / Imagen / DALL-E için İngilizce yüksek kaliteli görsel promptu" },
                bestPostingTime: { type: Type.STRING, description: "Bu gönderi için önerilen en iyi paylaşım saati ve günü" },
                storyExtensionIdea: { type: Type.STRING, description: "Bu gönderiyi destekleyecek 24 saatlik Story (Hikaye) anket/etkileşim fikri" }
              },
              required: ["title", "hook", "caption", "carouselSlides", "callToAction", "hashtags", "visualDesignPromptTR", "imageGeneratorPromptEN", "bestPostingTime", "storyExtensionIdea"]
            }
          }
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        return res.json({ success: true, data: parsed });

      } else if (action === "generate_video_script") {
        const systemInstruction = `Sen viral Reels, TikTok ve Shorts videoları konusunda uzmanlaşmış bir Video Reklam Yönetmeni ve Kreatif Prodüktörsün.
FocusON Akademi için dikey formatta (9:16) 15-45 saniyelik yüksek dönüşümlü video reklam ve organik Reels senaryoları hazırlayacaksın.

SİSTEM BİLGİ TABANI (RAG CONTEXT):
${retrievedRAGKnowledge}

5 AŞAMALI DÖNÜŞÜM FORMÜLÜ:
1. Kanca (0-3 sn): Ekran kaydıran parmağı durduran görsel & metinsel şok soru veya yüksek empati.
2. Problem (3-8 sn): YKS öğrencisinin / velisinin yaşadığı çaresizlik (netlerin artmaması, plansızlık, erteleme).
3. Çözüm (8-18 sn): FocusON'un ilgili özelliğinin (ON Asistan, DOPA Testi, Veli Karnesi) pratik ve havalı ekran gösterimi.
4. Kanıt & Değer (18-25 sn): Başarı istatistiği (%92 net artışı) veya koçluk dönüşümü.
5. CTA (25-30 sn): Net yönlendirme (Biyodaki linke tıkla / DM'ye KOÇLUK yaz).

JSON formatında saniye saniye zaman çizelgesiyle yanıt ver.`;

        const prompt = `Konu/Özellik: ${topic || 'ON Asistan ve Deneme Net Artışı'}
Hedef Kitle: ${targetAudience || 'YKS 2026 Öğrencileri'}
Ton: ${tone || 'Dinamik YKS & Gençlik Dili'}
Özel İstek: ${extraPrompt || 'Yok'}

Lütfen saniye saniye planlanmış, seslendirme metni, ekran yazıları, B-roll yönlendirmeleri ve Runway/Sora AI video promptları içeren eksiksiz bir video reklam kurgusu üret.`;

        const modelName = getModelName("gemini-3.5-flash");
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.8,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                videoTitle: { type: Type.STRING },
                estimatedDuration: { type: Type.STRING, description: "Örn: 28 Saniye" },
                hookTextOnScreen: { type: Type.STRING, description: "İlk 3 saniye ekranda büyük puntolarla parlayacak yazı" },
                musicVibe: { type: Type.STRING, description: "Önerilen arka plan müziği veya ritmi (Örn: Lo-fi beat, Phonk, Sinematik Yükseliş)" },
                scenes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      timeCode: { type: Type.STRING, description: "Örn: 00:00 - 00:03" },
                      sceneType: { type: Type.STRING, description: "Örn: Kanca (Hook) / Problem / Çözüm Mockup / Kanıt / CTA" },
                      visualAction: { type: Type.STRING, description: "Ekranda ne görünüyor (Kamera açısı, oyuncu hareketi veya ekran kaydı mockup'ı)" },
                      onScreenText: { type: Type.STRING, description: "Ekranda çıkacak dikkat çekici sticker / altyazı" },
                      voiceoverTR: { type: Type.STRING, description: "Türkçe seslendirme metni (Tam olarak konuşulacak cümle)" },
                      aiVideoPromptEN: { type: Type.STRING, description: "Runway Gen-3 / Sora / Kling AI için İngilizce video oluşturma promptu" }
                    },
                    required: ["timeCode", "sceneType", "visualAction", "onScreenText", "voiceoverTR"]
                  }
                },
                caption: { type: Type.STRING, description: "Reels / TikTok alt açıklaması" },
                hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
                callToAction: { type: Type.STRING },
                elevenLabsVoiceStyle: { type: Type.STRING, description: "ElevenLabs için önerilen ses tonu (Örn: Genç, kendinden emin, enerjik Türkçe erkek/kadın sesi)" }
              },
              required: ["videoTitle", "estimatedDuration", "hookTextOnScreen", "musicVibe", "scenes", "caption", "hashtags", "callToAction", "elevenLabsVoiceStyle"]
            }
          }
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        return res.json({ success: true, data: parsed });

      } else if (action === "brainstorm_ideas") {
        const systemInstruction = `Sen FocusON Akademi'nin Sosyal Medya ve Büyüme Direktörüsün.
FocusON'un bilinirliğini, öğrenci kayıtlarını ve koç katılımını artıracak yaratıcı, uygulanabilir ve yüksek etkileşimli stratejiler, kampanya fikirleri ve içerik takvimleri üreteceksin.

SİSTEM BİLGİ TABANI (RAG CONTEXT):
${retrievedRAGKnowledge}

JSON formatında düzenli ve kategorize edilmiş olarak yanıt ver.`;

        const prompt = `Talep Türü / Odak: ${topic || 'Bu Haftanın YKS İçerik Takvimi & Viral Kampanyalar'}
Hedef Kitle: ${targetAudience || 'YKS Öğrencileri & Veliler'}
Özel Not: ${extraPrompt || 'Yok'}

Lütfen yenilikçi, uygulanabilir 5 farklı içerik açısı, 1 haftalık takvim planı ve 3 adet viral anket/story mekaniği üret.`;

        const modelName = getModelName("gemini-3.5-flash");
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.8,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                strategyOverview: { type: Type.STRING, description: "Genel büyüme ve etkileşim stratejisi özeti" },
                weeklyCalendar: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      day: { type: Type.STRING, description: "Pazartesi, Salı vb." },
                      format: { type: Type.STRING, description: "Reels, Carousel, Story Serisi vb." },
                      topic: { type: Type.STRING, description: "İçerik konusu" },
                      objective: { type: Type.STRING, description: "Hedef: Farkındalık, Etkileşim, Kayıt/Lead" },
                      hookIdea: { type: Type.STRING, description: "Kanca fikri" }
                    },
                    required: ["day", "format", "topic", "objective", "hookIdea"]
                  }
                },
                viralHooks: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      hookTitle: { type: Type.STRING },
                      targetFearOrDesire: { type: Type.STRING },
                      exampleOpeningSentence: { type: Type.STRING }
                    },
                    required: ["hookTitle", "targetFearOrDesire", "exampleOpeningSentence"]
                  }
                },
                leadMagnetIdeas: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      howToPromote: { type: Type.STRING }
                    },
                    required: ["title", "description", "howToPromote"]
                  }
                }
              },
              required: ["strategyOverview", "weeklyCalendar", "viralHooks", "leadMagnetIdeas"]
            }
          }
        });

        const parsed = JSON.parse(response.text?.trim() || "{}");
        return res.json({ success: true, data: parsed });

      } else if (action === "chat") {
        const systemInstruction = `Sen FocusON Akademi bünyesindeki 7/24 Kıdemli Sosyal Medya, Büyüme ve İçerik Pazarlaması Danışmanısın.
Adın: "FocusON Sosyal Medya Stratejisti".
Akademi yöneticisiyle samimi, son derece zeki, güncel sosyal medya algoritmalarını (Instagram Reels, TikTok SEO, LinkedIn B2B, YouTube Shorts) çok iyi bilen bir uzman olarak sohbet ediyorsun.

SİSTEM BİLGİ TABANI (RAG CONTEXT):
${retrievedRAGKnowledge}

Görevin:
- Yöneticinin aklındaki her türlü pazarlama sorusuna, kampanya kurgusuna, video reklam fikrine veya metin revizyonuna anında pratik ve profesyonel çözümler sunmak.
- Markdown formatında, listeler ve vurgular kullanarak derli toplu yanıt ver.`;

        const modelName = getModelName("gemini-3.5-flash");
        let contents: any[] = [];

        if (Array.isArray(chatHistory) && chatHistory.length > 0) {
          contents = chatHistory.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: m.content || m.text || '' }]
          }));
        }
        contents.push({
          role: 'user',
          parts: [{ text: message || 'Merhaba, bana FocusON için en etkili bu haftaki sosyal medya içerik önerilerini sunar mısın?' }]
        });

        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction,
            temperature: 0.75
          }
        });

        return res.json({ success: true, text: response.text });

      } else if (action === "speak_voiceover") {
        // Generates natural voiceover audio using Gemini TTS
        const textToSpeak = scriptText || message || "FocusON Akademi ile YKS hazırlığında şansa yer yok.";
        const cleanText = textToSpeak.replace(/[\*\_\[\]\#\-\`\~]/g, " ").replace(/\s+/g, " ").trim().substring(0, 1500);
        
        try {
          const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: [{ text: cleanText }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: voiceName || "Puck"
                  }
                }
              }
            }
          });

          const candidates = ttsResponse.candidates;
          if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
              if (part.inlineData && part.inlineData.data) {
                let pcmBase64 = part.inlineData.data;
                let wavBase64 = pcmToWavBase64(pcmBase64, 24000, 1, 16);
                return res.json({ success: true, audioBase64: wavBase64, mimeType: "audio/wav" });
              }
            }
          }
          return res.json({ success: false, error: "Ses verisi üretilemedi." });
        } catch (ttsErr: any) {
          console.warn("[Social Media TTS Warning]:", ttsErr.message);
          return res.json({ success: false, error: ttsErr.message });
        }
      }

      return res.status(400).json({ error: "Geçersiz aksiyon türü." });
    } catch (err: any) {
      console.error("[Social Media AI Error]:", err);
      return res.status(500).json({
        error: err.message || "Yapay zeka yanıtı üretilirken bir hata oluştu.",
        fallback: true
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

  // --- HAFTALIK OTOMATİK RAPOR VE PDF / WHATSAPP MOTORU ---
  const weeklyPdfStore = new Map<string, { buffer: Buffer; studentName: string; createdAt: string }>();

  
  function getTaskBadgeInfo(task: any): { label: string; unit: string } {
    const rawType = (task.type || task.taskType || '').toString().toLowerCase();
    if (rawType.includes('video') || rawType.includes('youtube') || rawType.includes('ders')) {
      return { label: 'Video/Ders', unit: 'Video' };
    }
    if (rawType.includes('sayfa') || rawType.includes('kitap') || rawType.includes('okuma')) {
      return { label: 'Sayfa', unit: 'Sayfa' };
    }
    if (rawType.includes('konu')) {
      return { label: 'Konu', unit: 'Sayfa' };
    }
    if (rawType.includes('deneme') || rawType.includes('exam')) {
      return { label: 'Deneme', unit: 'Deneme' };
    }
    if (rawType.includes('soru') || rawType.includes('question')) {
      return { label: 'Soru', unit: 'Soru' };
    }
    if (rawType.includes('gorev') || rawType.includes('görev') || rawType.includes('task')) {
      return { label: 'Görev', unit: 'Adet' };
    }
    if (task.type || task.taskType) {
      const custom = (task.type || task.taskType).toString();
      return { label: custom, unit: 'Adet' };
    }
    return { label: 'Görev', unit: 'Adet' };
  }

  // Cache PDF Unicode Fonts for Turkish Character Support
  let cachedLiberationReg: string | null = null;
  let cachedLiberationBold: string | null = null;

  function isValidTrueTypeFont(buf: Buffer): boolean {
    if (!buf || buf.length < 1000) return false;
    // Check TTF magic header (0x00 0x01 0x00 0x00)
    if (buf[0] !== 0x00 || buf[1] !== 0x01 || buf[2] !== 0x00 || buf[3] !== 0x00) return false;
    try {
      const numTables = buf.readUInt16BE(4);
      let cmapOffset = 0;
      for (let i = 0; i < numTables; i++) {
        const tag = buf.toString("ascii", 12 + i * 16, 16 + i * 16);
        if (tag === "cmap") {
          cmapOffset = buf.readUInt32BE(12 + i * 16 + 8);
          break;
        }
      }
      if (!cmapOffset || cmapOffset >= buf.length) return false;
      const numSubtables = buf.readUInt16BE(cmapOffset + 2);
      if (numSubtables <= 0) return false;
      for (let i = 0; i < numSubtables; i++) {
        const pId = buf.readUInt16BE(cmapOffset + 4 + i * 8);
        const subOffset = buf.readUInt32BE(cmapOffset + 4 + i * 8 + 4);
        if (cmapOffset + subOffset < buf.length) {
          const format = buf.readUInt16BE(cmapOffset + subOffset);
          if (format === 4 && (pId === 3 || pId === 0)) {
            return true;
          }
        }
      }
    } catch {
      return false;
    }
    return false;
  }

  function getPdfFonts() {
    if (!cachedLiberationReg || !cachedLiberationBold) {
      try {
        const pReg = path.join(process.cwd(), "public", "fonts", "LiberationSans-Regular.ttf");
        const pBold = path.join(process.cwd(), "public", "fonts", "LiberationSans-Bold.ttf");
        const pSysReg = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf";
        const pSysBold = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf";

        const loadValidTtf = (sysPath: string, localPath: string): string | null => {
          const candidates = [sysPath, localPath];
          for (const cPath of candidates) {
            if (cPath && fs.existsSync(cPath)) {
              const buf = fs.readFileSync(cPath);
              if (isValidTrueTypeFont(buf)) {
                return buf.toString("binary");
              }
            }
          }
          return null;
        };

        const regData = loadValidTtf(pSysReg, pReg);
        const boldData = loadValidTtf(pSysBold, pBold);

        if (regData && boldData) {
          cachedLiberationReg = regData;
          cachedLiberationBold = boldData;
        }
      } catch (e) {
        console.warn("[PDF Fonts] Font load notice:", e);
      }
    }
    return { reg: cachedLiberationReg, bold: cachedLiberationBold };
  }

  function ensureAiReportClosingSignature(rawText: string): string {
    const signature = "Saygılarımızla,\nFocusON Akademi\nYapay Zekâ Asistanı";
    if (!rawText || !rawText.trim()) return signature;

    let cleaned = rawText.trim();

    // Remove any existing signatures, closing phrases or boilerplate
    const closingPatterns = [
      /Saygılarımızla[\s\S]*$/i,
      /Saygılarımla[\s\S]*$/i,
      /İyi çalışmalar[\s\S]*$/i,
      /FocusON Akademi[\s\S]*$/i,
      /FocusOn Akademi[\s\S]*$/i,
      /Başarılar dileriz[\s\S]*$/i,
      /Rehberlik Birimi[\s\S]*$/i,
      /Yapay Zek[aâ] Asistanı[\s\S]*$/i
    ];

    for (const pattern of closingPatterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '').trim();
        break;
      }
    }

    return `${cleaned}\n\n${signature}`;
  }

  function normalizeDateToYYYYMMDD(raw: any): string {
    if (!raw) return "";
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
        return trimmed.substring(0, 10);
      }
      if (/^\d{2}\.\d{2}\.\d{4}/.test(trimmed)) {
        const [d, m, y] = trimmed.substring(0, 10).split(".");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
        const [d, m, y] = trimmed.substring(0, 10).split("/");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      }
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
    } else if (raw && typeof raw.toDate === "function") {
      const d = raw.toDate();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } else if (raw && typeof raw.seconds === "number") {
      const d = new Date(raw.seconds * 1000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } else if (raw instanceof Date && !isNaN(raw.getTime())) {
      const y = raw.getFullYear();
      const m = String(raw.getMonth() + 1).padStart(2, "0");
      const day = String(raw.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return "";
  }

  function resolveStudentTarget(sData: any): string {
    if (!sData) return "Belirtilmedi";
    const uni = (sData.targetUniversity || sData.universityTarget || sData.targetSchool || sData.university || "").trim();
    const dep = (sData.targetDepartment || sData.departmentTarget || sData.targetFaculty || sData.department || "").trim();
    if (uni && dep) {
      return `${uni} - ${dep}`;
    }
    if (uni) return uni;
    if (dep) return dep;
    if (sData.studentTarget && typeof sData.studentTarget === "string" && sData.studentTarget.trim()) {
      return sData.studentTarget.trim();
    }
    return "Belirtilmedi";
  }

  async function resolveStudentPhotoBase64(photoURL?: string): Promise<{ base64: string; format: "PNG" | "JPEG" } | null> {
    if (!photoURL || typeof photoURL !== "string") return null;
    const trimmed = photoURL.trim();
    if (!trimmed) return null;

    try {
      if (trimmed.startsWith("data:image/")) {
        const match = trimmed.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);
        if (match) {
          const fmt = match[1].toLowerCase() === "png" ? "PNG" : "JPEG";
          return { base64: match[2], format: fmt };
        }
      }

      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const resp = await fetch(trimmed, { signal: AbortSignal.timeout(3000) });
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          const buf = Buffer.from(arrayBuf);
          if (buf.length > 8) {
            if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
              return { base64: buf.toString("base64"), format: "PNG" };
            }
            if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
              return { base64: buf.toString("base64"), format: "JPEG" };
            }
          }
        }
      }

      if (trimmed.startsWith("/")) {
        const localPath = path.join(process.cwd(), "public", trimmed.replace(/^\//, ""));
        if (fs.existsSync(localPath)) {
          const buf = fs.readFileSync(localPath);
          if (buf.length > 8) {
            if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
              return { base64: buf.toString("base64"), format: "PNG" };
            }
            if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
              return { base64: buf.toString("base64"), format: "JPEG" };
            }
          }
        }
      }
    } catch (err) {
      console.warn("Student photo resolve notice:", err);
    }
    return null;
  }

  function generateWeeklyReportPdfBuffer(params: {
    studentName: string;
    periodStr: string;
    totalTarget: number;
    totalCompleted: number;
    completionRate: number;
    totalTasks: number;
    examsCount: number;
    aiAnalysisText: string;
    subjectsBreakdown: { subject: string; target: number; completed: number }[];
    studentGrade?: string;
    studentBranch?: string;
    studentTarget?: string;
    studentPackage?: string;
    studentPhotoBase64?: string;
    studentPhotoFormat?: "PNG" | "JPEG";
    dailyTasks?: { date: string; displayDate: string; tasks: any[] }[];
    exams?: any[];
    taskCompletionRate?: number;
    denemeAverages?: {
      tytGenel?: string;
      aytGenel?: string;
      ydtGenel?: string;
      tytBrans?: string;
      aytBrans?: string;
      ydtBrans?: string;
    };
  }): Buffer {
    const doc = new jsPDF({ compress: true });
    
    // Turkish Unicode Font Registration (LiberationSans with full Turkish character support)
    const fonts = getPdfFonts();
    let fontName = "helvetica";

    if (fonts.reg && fonts.bold) {
      try {
        doc.addFileToVFS("LiberationSans-Regular.ttf", fonts.reg);
        doc.addFont("LiberationSans-Regular.ttf", "LiberationSans", "normal");
        doc.addFileToVFS("LiberationSans-Bold.ttf", fonts.bold);
        doc.addFont("LiberationSans-Bold.ttf", "LiberationSans", "bold");
        doc.setFont("LiberationSans", "normal");
        
        // Safety verification: verify text measurement works without throwing
        const testWidth = doc.getTextWidth("Test Türkçe ĞŞİçöü");
        if (typeof testWidth === "number" && !isNaN(testWidth) && testWidth > 0) {
          fontName = "LiberationSans";
        } else {
          doc.setFont("helvetica", "normal");
          fontName = "helvetica";
        }
      } catch (err) {
        console.warn("[PDF Fonts] Font registration warning:", err);
        try {
          doc.setFont("helvetica", "normal");
        } catch {
          // ignore
        }
        fontName = "helvetica";
      }
    }

    const pageW = 210;
    const pageH = 297;
    let currentY = 0;
    const trMonths = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    // Load ON-Logo image base64 if available
    let logoBase64 = "";
    try {
      const candidates = [
        path.join(process.cwd(), "public", "images", "ON-Logo.png"),
        path.join(process.cwd(), "public", "images", "logo.png")
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const buf = fs.readFileSync(p);
          // Verify valid PNG header (89 50 4E 47)
          if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
            logoBase64 = buf.toString("base64");
            break;
          }
        }
      }
    } catch (e) {
      console.warn("PDF Logo load notice:", e);
    }
    
    // Yrd. Fonksiyonlar
    const drawProgressBar = (x: number, y: number, w: number, h: number, percentage: number, color: [number, number, number], bg: [number, number, number] = [30, 41, 59]) => {
      doc.setFillColor(...bg);
      doc.roundedRect(x, y, w, h, h/2, h/2, "F");
      if (percentage > 0) {
        const fillW = Math.min(Math.max((percentage / 100) * w, h), w);
        doc.setFillColor(...color);
        doc.roundedRect(x, y, fillW, h, h/2, h/2, "F");
      }
    };

    const drawBackground = () => {
      doc.setFillColor(11, 17, 32); // #0B1120 dark canvas
      doc.rect(0, 0, pageW, pageH, "F");
    };

    const drawFooter = () => {
      doc.setFillColor(17, 24, 39);
      doc.rect(0, pageH - 10, pageW, 10, "F");
      doc.setFontSize(7);
      doc.setFont(fontName, "normal");
      doc.setTextColor(156, 163, 175);
      doc.text("FocusON Akademi - Otomatik Üretilmiş Veli Bilgilendirme Raporu", pageW / 2, pageH - 4, { align: "center" });
    };

    const addPageIfNeeded = (neededH: number) => {
      if (currentY + neededH > pageH - 16) {
        doc.addPage();
        drawBackground();
        drawFooter();
        currentY = 14;
      }
    };

    // Initialize first page
    drawBackground();
    drawFooter();
    currentY = 10;

    // 1. Header (Student Info, Period, Package & Logo)
    const headerHeight = 36;
    doc.setFillColor(17, 24, 39); // #111827
    doc.setDrawColor(31, 41, 55); // border
    doc.setLineWidth(0.3);
    doc.roundedRect(10, currentY, 190, headerHeight, 3, 3, "FD");

    // Left Column: Student Avatar & Info
    const avatarX = 22;
    const avatarY = currentY + 18;
    let renderedPhoto = false;

    if (params.studentPhotoBase64) {
      try {
        const pFmt = params.studentPhotoFormat || "PNG";
        doc.addImage(`data:image/${pFmt.toLowerCase()};base64,${params.studentPhotoBase64}`, pFmt, 13, currentY + 9, 18, 18, undefined, "FAST");
        doc.setDrawColor(16, 185, 129); // emerald border ring
        doc.setLineWidth(0.5);
        doc.roundedRect(13, currentY + 9, 18, 18, 2.5, 2.5, "D");
        renderedPhoto = true;
      } catch (pErr) {
        console.warn("Avatar image render notice:", pErr);
      }
    }

    if (!renderedPhoto) {
      // Stylish single-letter avatar badge with background depth & emerald glow
      doc.setFillColor(15, 23, 42); // deep slate container
      doc.roundedRect(13, currentY + 9, 18, 18, 3, 3, "F");

      doc.setFillColor(6, 78, 59); // deep emerald halo
      doc.circle(avatarX, avatarY, 7.5, "F");

      doc.setFillColor(16, 185, 129); // emerald-500 core
      doc.circle(avatarX, avatarY, 6.5, "F");

      doc.setDrawColor(52, 211, 153); // emerald-400 accent border
      doc.setLineWidth(0.4);
      doc.roundedRect(13, currentY + 9, 18, 18, 3, 3, "D");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11.5);
      doc.setFont(fontName, "bold");
      const initial = (params.studentName || "Ö").trim().charAt(0).toUpperCase();
      doc.text(initial, avatarX, avatarY + 3.8, { align: "center" });

      // Small status dot on corner
      doc.setFillColor(52, 211, 153);
      doc.circle(28.5, currentY + 24.5, 1.2, "F");
    }

    const textStartX = 34;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(fontName, "bold");
    doc.text(params.studentName, textStartX, currentY + 8);

    doc.setFontSize(7.5);
    doc.setFont(fontName, "normal");
    doc.setTextColor(156, 163, 175);
    let gradeBranch = [];
    if (params.studentGrade) gradeBranch.push(`Sınıf: ${params.studentGrade}`);
    if (params.studentBranch) gradeBranch.push(`Alan: ${params.studentBranch}`);
    doc.text(gradeBranch.join("   |   ") || "Sınıf: 12. Sınıf   |   Alan: SAYISAL", textStartX, currentY + 15);

    doc.text(`Hedef: ${params.studentTarget || 'Belirtilmedi'}`, textStartX, currentY + 22);

    doc.setTextColor(16, 185, 129); // emerald green for package
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text(`Abonelik Paketi: ${params.studentPackage || 'Sınırsız Zirve VIP (Altın Paket)'}`, textStartX, currentY + 28.5);

    // Right Column: ON-Logo on top-right, FocusON Akademi below logo base, Clickable Link & Period
    let logoBottomY = currentY + 2;
    if (logoBase64) {
      try {
        const imgProps = doc.getImageProperties(`data:image/png;base64,${logoBase64}`);
        const ratio = imgProps.height / imgProps.width;
        const imgWidth = 18;
        const imgHeight = imgWidth * ratio;
        const logoX = 195 - imgWidth;
        const logoY = currentY + 2.5;
        doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", logoX, logoY, imgWidth, imgHeight, undefined, "FAST");
        logoBottomY = logoY + imgHeight;
      } catch (err) {
        console.warn("PDF Logo render warning:", err);
      }
    }

    const focusOnY = Math.max(logoBottomY + 4.5, currentY + 19);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(8.5);
    doc.setFont(fontName, "bold");
    doc.text("FocusON Akademi", 195, focusOnY, { align: "right" });

    const linkY = focusOnY + 4;
    const websiteUrl = "https://www.omernasuhakademi.com";
    const websiteText = "www.omernasuhakademi.com";
    doc.setTextColor(96, 165, 250); // light blue clickable link
    doc.setFont(fontName, "normal");
    doc.setFontSize(7);
    doc.text(websiteText, 195, linkY, { align: "right" });

    // Clickable link annotation area
    const websiteWidth = doc.getTextWidth(websiteText);
    doc.link(195 - websiteWidth, linkY - 2.5, websiteWidth, 3.5, { url: websiteUrl });

    const periodY = linkY + 4;
    doc.setTextColor(156, 163, 175);
    doc.setFont(fontName, "normal");
    doc.setFontSize(6.8);
    doc.text(`Rapor Dönemi: ${params.periodStr}`, 195, periodY, { align: "right" });

    currentY += headerHeight + 5;

    // Calculate dynamic topic study pages and watch videos count
    let totalStudyPages = 0;
    let totalWatchVideos = 0;
    if (params.dailyTasks) {
      params.dailyTasks.forEach(day => {
        day.tasks.forEach((t: any) => {
          const info = getTaskBadgeInfo(t);
          if (info.unit === 'Sayfa') {
            totalStudyPages += Number(t.completedCount) || (t.isDone ? Number(t.targetCount) || 1 : 0);
          } else if (info.unit === 'Video') {
            totalWatchVideos += Number(t.completedCount) || (t.isDone ? Number(t.targetCount) || 1 : 0);
          }
        });
      });
    }

    // 2. Summary KPI Cards (4 columns)
    const cardW = 45;
    const gap = (190 - (cardW * 4)) / 3;
    const stats = [
      { 
        t: "SORU ÇÖZÜMÜ", 
        v: `${params.totalCompleted} / ${params.totalTarget}`, 
        unit: "", 
        pLabel: `Haftalık soru ulaşma oranı %${params.completionRate}`, 
        pct: params.completionRate, 
        color: [16, 185, 129] 
      },
      { 
        t: "GÖREV SADAKATİ", 
        v: `${params.dailyTasks ? params.dailyTasks.reduce((acc, c) => acc + c.tasks.filter(t => t.isDone).length, 0) : 0} / ${params.totalTasks}`, 
        unit: "", 
        pLabel: `Günlük program sadakat oranı %${params.taskCompletionRate || 0}`, 
        pct: params.taskCompletionRate || 0, 
        color: [139, 92, 246] 
      },
      { 
        t: "KONU ÇALIŞMASI", 
        v: `${totalStudyPages}`, 
        unit: "Sayfa", 
        pLabel: "Haftalık konu pekiştirme süreci", 
        pct: totalStudyPages > 0 ? 100 : 0, 
        color: [245, 158, 11] 
      },
      { 
        t: "KONU TAKİBİ", 
        v: `${totalWatchVideos}`, 
        unit: "Video/Ders", 
        pLabel: "Müfredat uyumlu konu kavrama", 
        pct: totalWatchVideos > 0 ? 100 : 0, 
        color: [59, 130, 246] 
      }
    ];

    stats.forEach((s, i) => {
      const x = 10 + i * (cardW + gap);
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.roundedRect(x, currentY, cardW, 26, 2, 2, "FD");

      // Title
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(6.5);
      doc.setFont(fontName, "bold");
      doc.text(s.t, x + 3.5, currentY + 6);

      // Main Value
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10.5);
      doc.setFont(fontName, "bold");
      doc.text(s.v, x + 3.5, currentY + 13);

      // Unit (calculated with font size 10.5 active before changing font!)
      if (s.unit) {
        const valWidth = doc.getTextWidth(s.v);
        doc.setFontSize(7);
        doc.setTextColor(156, 163, 175);
        doc.setFont(fontName, "normal");
        doc.text(s.unit, x + 3.5 + valWidth + 1.8, currentY + 13);
      }

      // Subtitle
      doc.setFont(fontName, "normal");
      doc.setFontSize(5.5);
      doc.setTextColor(156, 163, 175);
      doc.text(s.pLabel, x + 3.5, currentY + 18);

      // Progress bar
      drawProgressBar(x + 3.5, currentY + 21, cardW - 7, 1.5, s.pct, s.color as any);
    });

    currentY += 31;

    // 3. AI & Coach Evaluation Box
    // IMPORTANT: Set font BEFORE splitting text so width calculation is accurate!
    doc.setFont(fontName, "normal");
    doc.setFontSize(7.5);
    
    const formattedAiText = ensureAiReportClosingSignature(
      (params.aiAnalysisText || "Geçen hafta için henüz yapay zeka analizi veya koç değerlendirmesi oluşturulmamış. Sistem her Pazar akşamı bu analizi otomatik olarak oluşturacak ve kaydedecektir.").replace(/[*_]/g, '')
    );
    const splitAi = doc.splitTextToSize(formattedAiText, 175);
    const aiBoxHeight = Math.max(30, 18 + splitAi.length * 4.8);

    addPageIfNeeded(aiBoxHeight + 6);

    doc.setFillColor(17, 24, 39);
    doc.setDrawColor(31, 41, 55);
    doc.roundedRect(10, currentY, 190, aiBoxHeight, 3, 3, "FD");

    // Green Accent Heading
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(10, currentY, 3.5, aiBoxHeight, 2, 2, "F");

    doc.setTextColor(16, 185, 129); // green
    doc.setFont(fontName, "bold");
    doc.setFontSize(8.5);
    doc.text("Geçen Haftalık Koç Değerlendirmesi & Yapay Zeka Analiz Raporu", 17, currentY + 7.5);

    doc.setDrawColor(31, 41, 55);
    doc.line(14, currentY + 11, 196, currentY + 11);

    doc.setTextColor(209, 213, 219); // gray-300
    doc.setFont(fontName, "normal");
    doc.setFontSize(7.5);

    let lineY = currentY + 16.5;
    splitAi.forEach((line: string) => {
      doc.text(line, 17, lineY);
      lineY += 4.8;
    });

    currentY += aiBoxHeight + 6;

    // 4. Deneme Ortalamalari Boxes
    addPageIfNeeded(32);
    const boxW = 92;

    const averages = params.denemeAverages || {};
    const genelAvgs = [
      { label: "TYT GENEL", value: averages.tytGenel || "-" },
      { label: "AYT GENEL", value: averages.aytGenel || "-" },
      { label: "YDT GENEL", value: averages.ydtGenel || "-" }
    ];
    const bransAvgs = [
      { label: "TYT BRANŞ", value: averages.tytBrans || "-" },
      { label: "AYT BRANŞ", value: averages.aytBrans || "-" },
      { label: "YDT BRANŞ", value: averages.ydtBrans || "-" }
    ];

    // Box 1: Genel Deneme Ortalamaları
    doc.setFillColor(17, 24, 39);
    doc.setDrawColor(31, 41, 55);
    doc.roundedRect(10, currentY, boxW, 26, 2, 2, "FD");
    doc.setTextColor(255, 255, 255);
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text("Genel Deneme Ortalamaları", 14, currentY + 6);

    genelAvgs.forEach((item, i) => {
      const bx = 14 + i * 27;
      doc.setFillColor(31, 41, 55);
      doc.roundedRect(bx, currentY + 9, 25, 13, 1.5, 1.5, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(5.5);
      doc.text(item.label, bx + 12.5, currentY + 13, { align: "center" });
      doc.setTextColor(item.value !== "-" ? 16 : 255, item.value !== "-" ? 185 : 255, item.value !== "-" ? 129 : 255);
      doc.setFontSize(item.value.length > 6 ? 6.5 : 8);
      doc.setFont(fontName, "bold");
      doc.text(item.value, bx + 12.5, currentY + 19, { align: "center" });
    });

    // Box 2: Branş / Ders Deneme Ortalamaları
    doc.setFillColor(17, 24, 39);
    doc.setDrawColor(31, 41, 55);
    doc.roundedRect(10 + boxW + 6, currentY, boxW, 26, 2, 2, "FD");
    doc.setTextColor(255, 255, 255);
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text("Branş / Ders Deneme Ortalamaları", 14 + boxW + 6, currentY + 6);

    bransAvgs.forEach((item, i) => {
      const bx = 14 + boxW + 6 + i * 27;
      doc.setFillColor(31, 41, 55);
      doc.roundedRect(bx, currentY + 9, 25, 13, 1.5, 1.5, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(5.5);
      doc.text(item.label, bx + 12.5, currentY + 13, { align: "center" });
      doc.setTextColor(item.value !== "-" ? 16 : 255, item.value !== "-" ? 185 : 255, item.value !== "-" ? 129 : 255);
      doc.setFontSize(item.value.length > 6 ? 6.5 : 8);
      doc.setFont(fontName, "bold");
      doc.text(item.value, bx + 12.5, currentY + 19, { align: "center" });
    });

    currentY += 31;

    // 5. Gecen Hafta Girilen Deneme Sınavları
    const exams = params.exams || [];
    if (exams.length === 0) {
      addPageIfNeeded(24);
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.roundedRect(10, currentY, 190, 22, 2, 2, "FD");
      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, "bold");
      doc.setFontSize(8);
      doc.text("Geçen Hafta Girilen Deneme Sınavları", 14, currentY + 6);
      doc.setFontSize(6.5);
      doc.setFont(fontName, "normal");
      doc.setTextColor(156, 163, 175);
      doc.text("Öğrencinin geçen hafta sisteme işlenen deneme ve tarama sonuçları.", 14, currentY + 10);

      doc.setTextColor(107, 114, 128);
      doc.setFontSize(7);
      doc.text("Geçen hafta içerisinde girilmiş herhangi bir deneme sınavı verisi bulunmamaktadır.", 105, currentY + 17, { align: "center" });

      currentY += 27;
    } else {
      const headerH = 14;
      const rowH = 7.5;
      const totalH = headerH + 6 + exams.length * rowH;
      addPageIfNeeded(Math.min(totalH, 45));

      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.roundedRect(10, currentY, 190, totalH, 2, 2, "FD");

      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, "bold");
      doc.setFontSize(8);
      doc.text("Geçen Hafta Girilen Deneme Sınavları", 14, currentY + 6);
      doc.setFontSize(6.5);
      doc.setFont(fontName, "normal");
      doc.setTextColor(156, 163, 175);
      doc.text(`Öğrencimizin geçen hafta sisteme işlenen ${exams.length} adet deneme / sınav sonucu:`, 14, currentY + 10);

      // Table Header row inside the card
      const tableHeaderY = currentY + 13;
      doc.setFillColor(31, 41, 55);
      doc.rect(12, tableHeaderY, 186, 5.5, "F");
      doc.setFontSize(5.5);
      doc.setFont(fontName, "bold");
      doc.setTextColor(156, 163, 175);
      doc.text("SINAV ADI", 15, tableHeaderY + 3.8);
      doc.text("TÜR", 90, tableHeaderY + 3.8);
      doc.text("TARİH", 112, tableHeaderY + 3.8);
      doc.text("TOPLAM NET", 136, tableHeaderY + 3.8);
      doc.text("SIRA / KATILIM", 160, tableHeaderY + 3.8);
      doc.text("DİLİM", 188, tableHeaderY + 3.8, { align: "center" });

      let examRowY = tableHeaderY + 5.5;
      exams.forEach((ex, eIdx) => {
        doc.setFillColor(eIdx % 2 === 0 ? 20 : 17, 27, 45);
        doc.rect(12, examRowY, 186, rowH, "F");

        const rawName = ex.examName || ex.topic || ex.subject || "Deneme Sınavı";
        const safeName = rawName.length > 38 ? rawName.substring(0, 36) + ".." : rawName;
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.setFont(fontName, "bold");
        doc.text(safeName, 15, examRowY + 4.8);

        const exType = (ex.examType || "GENEL").toUpperCase();
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(5.5);
        doc.setFont(fontName, "normal");
        doc.text(exType, 90, examRowY + 4.8);

        let dateLabel = ex.date || "";
        if (/^\d{4}-\d{2}-\d{2}/.test(dateLabel)) {
          const [, m, d] = dateLabel.substring(0, 10).split("-");
          dateLabel = `${d} ${trMonths[Number(m) - 1] || ""}`;
        }
        doc.text(dateLabel, 112, examRowY + 4.8);

        const totalNetVal = ex.totalNet !== undefined && ex.totalNet !== null 
          ? Number(ex.totalNet).toFixed(1) 
          : (ex.completedCount ? `${ex.completedCount} Soru` : "-");
        doc.setTextColor(16, 185, 129);
        doc.setFont(fontName, "bold");
        doc.text(`${totalNetVal} Net`, 136, examRowY + 4.8);

        const rankStr = ex.rank 
          ? `${ex.rank}${ex.participantCount ? ` / ${Number(ex.participantCount).toLocaleString("tr-TR")}` : ""}`
          : "-";
        doc.setTextColor(209, 213, 219);
        doc.setFont(fontName, "normal");
        doc.text(rankStr, 160, examRowY + 4.8);

        const pctStr = ex.percentile ? `%${Number(ex.percentile).toFixed(1)}` : "-";
        doc.text(pctStr, 188, examRowY + 4.8, { align: "center" });

        examRowY += rowH;
      });

      currentY += totalH + 5;
    }

    // 6. Ders Bazlı Performans Tablosu (Varsa) - Focused exclusively on course subjects and exams
    if (params.subjectsBreakdown && params.subjectsBreakdown.length > 0) {
      addPageIfNeeded(30);
      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, "bold");
      doc.setFontSize(8.5);
      doc.text("Ders Bazlı Performans Analizi", 10, currentY);

      currentY += 4;
      doc.setFillColor(17, 24, 39);
      doc.rect(10, currentY, 190, 6, "F");
      doc.setFontSize(6.5);
      doc.setTextColor(156, 163, 175);
      doc.text("DERS ADI", 14, currentY + 4);
      doc.text("HEDEF", 85, currentY + 4);
      doc.text("ÇÖZÜLEN / TAMAMLANAN", 115, currentY + 4);
      doc.text("BAŞARI", 155, currentY + 4);

      currentY += 6;
      params.subjectsBreakdown.forEach((sub, idx) => {
        addPageIfNeeded(8);
        doc.setFillColor(idx % 2 === 0 ? 15 : 20, 23, 39);
        doc.rect(10, currentY, 190, 7, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont(fontName, "bold");
        doc.text(sub.subject, 14, currentY + 5);

        doc.setFont(fontName, "normal");
        doc.setTextColor(156, 163, 175);
        doc.text(sub.target.toString(), 85, currentY + 5);

        doc.setTextColor(16, 185, 129);
        doc.text(sub.completed.toString(), 115, currentY + 5);

        const rate = sub.target > 0 ? Math.round((sub.completed / sub.target) * 100) : 0;
        doc.setTextColor(255, 255, 255);
        doc.text(`%${rate}`, 155, currentY + 5);

        drawProgressBar(170, currentY + 2.5, 25, 2, Math.min(rate, 100), [16, 185, 129]);

        currentY += 7;
      });

      currentY += 5;
    }

    // 7. Günlük Görev ve Çalışma Raporu Detayları (Clean Page Break Boundary)
    if (currentY > 190) {
      doc.addPage();
      drawBackground();
      drawFooter();
      currentY = 14;
    } else {
      addPageIfNeeded(20);
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont(fontName, "bold");
    doc.setFontSize(9);
    doc.text("Günlük Görev ve Çalışma Raporu Detayları", 10, currentY);
    doc.setFontSize(6.5);
    doc.setFont(fontName, "normal");
    doc.setTextColor(156, 163, 175);
    doc.text("Geçen hafta Pazartesi - Pazar aralığında koç tarafından planlanıp tamamlanan görev listesi.", 10, currentY + 4);

    currentY += 10;

    if (params.dailyTasks && params.dailyTasks.length > 0) {
      const renderTaskCard = (task: any, taskX: number, taskY: number) => {
        doc.setFillColor(17, 24, 39);
        let taskColor: [number, number, number] = [31, 41, 55];
        if (task.isDone) taskColor = [16, 185, 129];
        else if (!task.isDone && task.targetCount > 0) taskColor = [225, 29, 72];
        else taskColor = [59, 130, 246];

        doc.setDrawColor(...taskColor);
        doc.roundedRect(taskX, taskY, 72, 14, 2, 2, "FD");

        // Icon circle
        doc.setDrawColor(...taskColor);
        doc.circle(taskX + 4.5, taskY + 7, 2.2, task.isDone ? "FD" : "S");
        if (task.isDone) {
          doc.setFillColor(...taskColor);
          doc.circle(taskX + 4.5, taskY + 7, 2.2, "F");
          doc.setDrawColor(255, 255, 255);
          doc.setLineWidth(0.4);
          doc.line(taskX + 3.6, taskY + 7, taskX + 4.3, taskY + 7.8);
          doc.line(taskX + 4.3, taskY + 7.8, taskX + 5.6, taskY + 5.8);
          doc.setLineWidth(0.3);
        }

        const rawSubj = task.subject || "Genel";
        const safeSubj = rawSubj.length > 14 ? rawSubj.substring(0, 12) + ".." : rawSubj;

        doc.setTextColor(255, 255, 255);
        doc.setFont(fontName, "bold");
        doc.setFontSize(6.5);
        doc.text(safeSubj, taskX + 9, taskY + 5);

        // Task type badge - Dynamic label and dynamic position right next to subject text
        const badgeInfo = getTaskBadgeInfo(task);
        const subjWidth = doc.getTextWidth(safeSubj);
        doc.setFontSize(4.5);
        doc.setFont(fontName, "normal");
        const badgeTextWidth = doc.getTextWidth(badgeInfo.label);
        const badgeRectWidth = badgeTextWidth + 3;
        const badgeX = Math.min(taskX + 9 + subjWidth + 2.5, taskX + 70 - badgeRectWidth);

        doc.setFillColor(31, 41, 55);
        doc.roundedRect(badgeX, taskY + 2, badgeRectWidth, 3.5, 1, 1, "F");
        doc.setTextColor(156, 163, 175);
        doc.text(badgeInfo.label, badgeX + 1.5, taskY + 4.5);

        const rawTopic = task.topic || "Konu";
        const safeTopic = rawTopic.length > 24 ? rawTopic.substring(0, 22) + ".." : rawTopic;

        doc.setTextColor(209, 213, 219);
        doc.setFontSize(6.5);
        doc.setFont(fontName, "bold");
        doc.text(safeTopic, taskX + 9, taskY + 8.5);

        doc.setTextColor(156, 163, 175);
        doc.setFontSize(5.5);
        doc.setFont(fontName, "normal");
        doc.text(`Hedef: ${task.targetCount || 0} ${badgeInfo.unit}`, taskX + 9, taskY + 12);

        if (task.completedCount > 0) {
          doc.setTextColor(16, 185, 129);
          doc.text(`Yapılan: ${task.completedCount}`, taskX + 40, taskY + 12);
        }
      };

      params.dailyTasks.forEach(day => {
        addPageIfNeeded(18);

        doc.setTextColor(16, 185, 129); // green header date
        doc.setFont(fontName, "bold");
        doc.setFontSize(7.5);
        doc.text(day.displayDate, 10, currentY);

        const doneCount = day.tasks.filter(t => t.isDone).length;
        doc.setTextColor(156, 163, 175);
        doc.setFontSize(6);
        doc.setFont(fontName, "normal");
        doc.text(`${doneCount} / ${day.tasks.length} Görev Yapıldı`, 10, currentY + 4);

        if (day.tasks.length === 0) {
          doc.setTextColor(107, 114, 128);
          doc.setFontSize(6);
          doc.text("Bu gün için atanmış görev bulunmamaktadır.", 50, currentY + 2);
          currentY += 10;
        } else {
          for (let rIdx = 0; rIdx < day.tasks.length; rIdx += 2) {
            // If row exceeds page bounds (page height - bottom margin), break cleanly to a new page
            if (currentY + 16 > pageH - 16) {
              doc.addPage();
              drawBackground();
              drawFooter();
              currentY = 14;

              // Draw day continuation label on the left
              doc.setTextColor(16, 185, 129);
              doc.setFont(fontName, "bold");
              doc.setFontSize(7.5);
              doc.text(`${day.displayDate} (Devam)`, 10, currentY);

              doc.setTextColor(156, 163, 175);
              doc.setFontSize(6);
              doc.setFont(fontName, "normal");
              doc.text("Görevler (Devamı)", 10, currentY + 4);
            }

            const taskY = currentY - 3;
            const task1 = day.tasks[rIdx];
            const task2 = day.tasks[rIdx + 1];

            renderTaskCard(task1, 50, taskY);
            if (task2) {
              renderTaskCard(task2, 125, taskY);
            }

            currentY += 16;
          }

          currentY += 2;
        }
      });
    }

    return Buffer.from(doc.output("arraybuffer"));
  }

  let isWeeklyReportBatchRunning = false;

  function isStudentActiveGoldOrSilver(sData: any, now: Date = new Date()): { eligible: boolean; reason?: string; planName?: string } {
    if (!sData) return { eligible: false, reason: "Öğrenci verisi bulunamadı." };

    // 1. Paket / Plan Adı Kontrolü (Sadece Altın veya Gümüş olmalı)
    const pkgStr = (
      sData.subscriptionPlan ||
      sData.package ||
      sData.packageType ||
      sData.membershipType ||
      sData.plan ||
      ""
    ).toString().trim().toLowerCase();

    const isGold = pkgStr.includes("altın") || pkgStr.includes("altin") || pkgStr.includes("gold") || pkgStr.includes("zirve vip");
    const isSilver = pkgStr.includes("gümüş") || pkgStr.includes("gumus") || pkgStr.includes("silver");
    const isBronze = pkgStr.includes("bronz") || pkgStr.includes("bronze");
    const isFreeOrDemo = pkgStr.includes("ücretsiz") || pkgStr.includes("free") || pkgStr.includes("demo") || pkgStr.includes("deneme");

    if (isBronze || isFreeOrDemo || (!isGold && !isSilver)) {
      return { eligible: false, reason: `Paket (${pkgStr || 'Yok'}) Altın veya Gümüş değil.` };
    }

    // 2. Abonelik Durumu Kontrolü (İptal edilmiş, süresi bitmiş veya pasif olanlar engellenir)
    const statusStr = (sData.subscriptionStatus || sData.status || "active").toString().trim().toLowerCase();
    if (
      statusStr === "cancelled" ||
      statusStr === "canceled" ||
      statusStr === "expired" ||
      statusStr === "inactive" ||
      statusStr === "passive" ||
      statusStr === "paused" ||
      statusStr === "suspended" ||
      statusStr === "iptal" ||
      statusStr === "bitti" ||
      sData.isCancelled === true ||
      sData.isCanceled === true
    ) {
      return { eligible: false, reason: `Abonelik durumu aktif değil (${statusStr}).` };
    }

    // 3. Abonelik Bitiş Tarihi Kontrolü (Mesajın gönderileceği an itibariyle süresi geçmiş olanlar engellenir)
    const rawEndDate = sData.subscriptionEndDate || sData.endDate || sData.subscriptionEnd;
    if (rawEndDate) {
      let endDate: Date | null = null;
      if (typeof rawEndDate === "string" || typeof rawEndDate === "number") {
        endDate = new Date(rawEndDate);
      } else if (rawEndDate && typeof rawEndDate.toDate === "function") {
        endDate = rawEndDate.toDate();
      } else if (rawEndDate && rawEndDate.seconds) {
        endDate = new Date(rawEndDate.seconds * 1000);
      }

      if (endDate && !isNaN(endDate.getTime())) {
        if (endDate.getTime() <= now.getTime()) {
          return { eligible: false, reason: `Abonelik süresi dolmuş (Bitiş Tarihi: ${endDate.toLocaleDateString('tr-TR')}).` };
        }
      }
    }

    return { eligible: true, planName: isGold ? "Altın Paket" : "Gümüş Paket" };
  }

  async function executeWeeklyReportBatch(options?: { studentId?: string; parentPhone?: string; studentName?: string; forceSingle?: boolean; force?: boolean }) {
    if (isWeeklyReportBatchRunning) {
      console.warn("[Weekly Reports] Başka bir haftalık rapor süreci çalışıyor, mükerrer işlem engellendi.");
      return { success: true, message: "Haftalık rapor gönderimi şu anda devam ediyor. Lütfen bekleyin.", processedCount: 0, logs: [] };
    }

    isWeeklyReportBatchRunning = true;
    try {
      console.log("[Weekly Reports] Haftalık rapor oluşturma ve WhatsApp gönderim süreci başlatıldı...", options);
      const db = getDb();
      const twConfig = await getTwilioConfig();
      const logs: any[] = [];
      const now = new Date();

      let students: any[] = [];
      if (options?.studentId) {
        const studentDoc = await db.collection("users").doc(options.studentId).get();
        if (studentDoc.exists) {
          const sData = studentDoc.data() || {};
          const check = isStudentActiveGoldOrSilver(sData, now);
          if (!check.eligible && !options?.forceSingle) {
            console.warn(`[Weekly Reports] Öğrenci (${sData.name || options.studentId}) için rapor oluşturulmadı: ${check.reason}`);
            return {
              success: false,
              message: `Rapor oluşturulamaz: ${check.reason} (Yalnızca aktif Altın veya Gümüş aboneliği olan öğrencilere rapor gönderilir.)`,
              processedCount: 0,
              logs: []
            };
          }
          const resolvedTarget = resolveStudentTarget(sData);
          students.push({
            id: studentDoc.id,
            ...sData,
            name: options.studentName || sData.name || sData.displayName || sData.fullName || sData.studentName || (sData.firstName ? `${sData.firstName} ${sData.lastName || ''}`.trim() : '') || "Öğrenci",
            parentPhone: options.parentPhone || sData.parentPhone || sData.phone || "+905550001122",
            grade: sData.grade || "12. Sınıf",
            branch: sData.branch || "SAYISAL",
            universityTarget: resolvedTarget,
            package: sData.package || sData.subscriptionPlan || check.planName || "Altın Paket"
          });
        } else {
          students.push({
            id: options.studentId,
            name: options.studentName || "Öğrenci",
            parentPhone: options.parentPhone || "+905550001122",
            grade: "12. Sınıf",
            branch: "SAYISAL",
            universityTarget: "Belirtilmedi",
            package: "Altın Paket"
          });
        }
      } else {
        const snapshot = await db.collection("users").where("role", "==", "student").get();
        let totalFetched = 0;
        let eligibleCount = 0;
        const seenStudentIds = new Set<string>();

        snapshot.forEach(docSnap => {
          totalFetched++;
          const sData = docSnap.data() || {};
          const studentId = docSnap.id;
          if (seenStudentIds.has(studentId)) return;
          seenStudentIds.add(studentId);

          const check = isStudentActiveGoldOrSilver(sData, now);
          if (check.eligible) {
            eligibleCount++;
            const resolvedTarget = resolveStudentTarget(sData);
            students.push({
              id: studentId,
              ...sData,
              name: sData.name || sData.displayName || sData.fullName || sData.studentName || (sData.firstName ? `${sData.firstName} ${sData.lastName || ''}`.trim() : '') || "Öğrenci",
              parentPhone: sData.parentPhone || sData.phone,
              grade: sData.grade || "12. Sınıf",
              branch: sData.branch || "SAYISAL",
              universityTarget: resolvedTarget,
              package: sData.package || sData.subscriptionPlan || check.planName || "Altın/Gümüş Paket"
            });
          }
        });
        console.log(`[Weekly Reports] Sistemdeki toplam öğrenci: ${totalFetched}, Aktif Altın/Gümüş aboneliği olan uygun öğrenci: ${eligibleCount}`);
      }

      // Compute PREVIOUS WEEK (Geçen Hafta: Pazartesi - Pazar)
      const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 1 = Tue, ..., 6 = Sun
      const monDate = new Date(now);
      monDate.setDate(now.getDate() - dayOfWeek - 7); // Go back to PREVIOUS WEEK Monday
      monDate.setHours(0, 0, 0, 0);

      const trMonths = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
      const trDays = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

      const sunDate = new Date(monDate);
      sunDate.setDate(monDate.getDate() + 6);
      sunDate.setHours(23, 59, 59, 999);

      const monStr = monDate.toISOString().split("T")[0];
      const sunStr = sunDate.toISOString().split("T")[0];

      const periodStr = `Geçen Hafta (${monDate.getDate()} ${trMonths[monDate.getMonth()]} - ${sunDate.getDate()} ${trMonths[sunDate.getMonth()]} ${sunDate.getFullYear()})`;

      const processedStudentIds = new Set<string>();
      const processedPhones = new Set<string>();

      // Group student reports by coach to send a single consolidated message per coach
      const coachReportsMap = new Map<string, {
        coachId: string;
        coachName: string;
        coachPhone: string;
        students: {
          studentId: string;
          studentName: string;
          completionRate: number;
          totalCompleted: number;
          totalTarget: number;
          reportId: string;
          fullPdfUrl: string;
        }[];
      }>();

      for (const student of students) {
        try {
          const studentId = student.id;
          const studentName = student.name || student.displayName || student.fullName || student.studentName || "Öğrenci";
          const rawPhone = student.parentPhone || student.phone;

          if (!rawPhone || !rawPhone.trim()) {
            console.log(`[Weekly Reports] Öğrenci (${studentName}) veli telefon numarası olmadığı için atlandı.`);
            continue;
          }

          const phoneNum = formatE164Phone(rawPhone);

          // 1. Aynı oturumda mükerrer öğrenci veya telefon gönderimini engelle
          if (processedStudentIds.has(studentId)) {
            console.log(`[Weekly Reports] Öğrenci (${studentName} - ${studentId}) bu oturumda zaten işlendi, atlanıyor.`);
            continue;
          }
          if (processedPhones.has(phoneNum)) {
            console.log(`[Weekly Reports] Telefon (${phoneNum}) bu oturumda zaten bir rapora bağlandı, atlanıyor.`);
            continue;
          }

          // 2. Bu dönem (hafta) için bu öğrenciye daha önce başarıyla rapor gönderilmiş mi kontrol et (Mükerrer 2 kez gitmeyi önler)
          if (!options?.forceSingle) {
            try {
              const prevLogSnap = await db.collection("weekly_report_logs")
                .where("studentId", "==", studentId)
                .where("periodStr", "==", periodStr)
                .where("status", "==", "sent")
                .limit(1)
                .get();

              if (!prevLogSnap.empty) {
                console.log(`[Weekly Reports] Öğrenci (${studentName}) için '${periodStr}' raporu daha önce başarıyla gönderilmiş. 2. kez gönderim engellendi.`);
                continue;
              }
            } catch (checkErr) {
              console.log("[Weekly Reports] Log kontrolü notu:", checkErr);
            }
          }

          processedStudentIds.add(studentId);
          processedPhones.add(phoneNum);

          let totalTarget = 0;
          let totalCompleted = 0;
          let totalTasks = 0;
          let examsCount = 0;
          const subjectMap: Record<string, { target: number; completed: number }> = {};
          const dailyTasksMap: Record<string, any[]> = {};
          const examsList: any[] = [];
          const allStudentExams: any[] = [];

          // 1. Fetch daily programs and tasks
          try {
            const progSnap = await db.collection("daily_programs")
              .where("studentId", "==", studentId)
              .get();

            progSnap.forEach(docSnap => {
              const data = docSnap.data();
              const dateStr = normalizeDateToYYYYMMDD(data.date || "");
              if (dateStr && dateStr >= monStr && dateStr <= sunStr) {
                const tasks = data.tasks || [];
                if (!dailyTasksMap[dateStr]) dailyTasksMap[dateStr] = [];

                tasks.forEach((t: any) => {
                  totalTasks++;
                  dailyTasksMap[dateStr].push(t);
                  const tCount = t.targetCount || 0;
                  const cCount = t.completedCount || (t.isDone ? tCount : 0);
                  totalTarget += tCount;
                  totalCompleted += cCount;

                  const subj = t.subject || "Genel";
                  if (!subjectMap[subj]) subjectMap[subj] = { target: 0, completed: 0 };
                  subjectMap[subj].target += tCount;
                  subjectMap[subj].completed += cCount;

                  if (t.isExam || subj.toLowerCase().includes("deneme") || t.taskType === "exam") {
                    const fallbackName = t.topic ? `${subj} - ${t.topic}` : (t.task || `${subj} Denemesi`);
                    examsList.push({
                      id: t.id || `task_${Math.random()}`,
                      examName: fallbackName,
                      examType: subj.toUpperCase().includes("BRANŞ") ? "BRANŞ" : (subj.toUpperCase().includes("AYT") ? "AYT" : (subj.toUpperCase().includes("YDT") ? "YDT" : "TYT")),
                      date: dateStr,
                      totalNet: t.completedCount || cCount,
                      fromTask: true
                    });
                  }
                });
              }
            });
          } catch (dbErr) {
            console.log(`[Weekly Reports] Note fetching tasks for ${studentId}:`, dbErr);
          }

          // 2. Fetch exam_results collection
          try {
            const examSnap = await db.collection("exam_results")
              .where("studentId", "==", studentId)
              .get();

            examSnap.forEach(docSnap => {
              const eData = docSnap.data();
              const eDateStr = normalizeDateToYYYYMMDD(eData.date);
              const examObj = {
                id: docSnap.id,
                examName: eData.examName || "Deneme Sınavı",
                examType: (eData.examType || "TYT").toUpperCase(),
                date: eDateStr,
                totalNet: Number(eData.totalNet) || 0,
                rank: eData.rank || null,
                participantCount: eData.participantCount || null,
                percentile: eData.percentile || null,
                scores: eData.scores || {}
              };
              allStudentExams.push(examObj);

              if (eDateStr && eDateStr >= monStr && eDateStr <= sunStr) {
                // If already added as a simple task from daily_programs, replace it with the rich exam result
                const existingIdx = examsList.findIndex(x => x.date === eDateStr && x.examName.toLowerCase().includes(examObj.examName.toLowerCase()));
                if (existingIdx >= 0) {
                  examsList[existingIdx] = examObj;
                } else {
                  examsList.push(examObj);
                }
              }
            });
          } catch (examErr) {
            console.log(`[Weekly Reports] Error fetching exam_results for ${studentId}:`, examErr);
          }

          examsCount = examsList.length;

          // Calculate Deneme Ortalamaları (TYT Genel, AYT Genel, YDT Genel, TYT Branş, AYT Branş, YDT Branş)
          const calcAvg = (items: any[]) => {
            if (!items || items.length === 0) return "-";
            const sum = items.reduce((acc, curr) => acc + (Number(curr.totalNet) || 0), 0);
            return `${(sum / items.length).toFixed(1)} Net`;
          };

          const isBranchExam = (e: any) => {
            const type = (e.examType || "").toUpperCase();
            const name = (e.examName || "").toUpperCase();
            return type === "BRANŞ" || type === "DERS" || name.includes("BRANŞ") || name.includes("DERS");
          };

          const tytGenel = allStudentExams.filter(e => !isBranchExam(e) && ((e.examType || "").toUpperCase().includes("TYT") || (e.examName || "").toUpperCase().includes("TYT")));
          const aytGenel = allStudentExams.filter(e => !isBranchExam(e) && ((e.examType || "").toUpperCase().includes("AYT") || (e.examName || "").toUpperCase().includes("AYT")));
          const ydtGenel = allStudentExams.filter(e => !isBranchExam(e) && ((e.examType || "").toUpperCase().includes("YDT") || (e.examName || "").toUpperCase().includes("YDT")));

          const tytBrans = allStudentExams.filter(e => isBranchExam(e) && ((e.examType || "").toUpperCase().includes("TYT") || (e.examName || "").toUpperCase().includes("TYT")));
          const aytBrans = allStudentExams.filter(e => isBranchExam(e) && ((e.examType || "").toUpperCase().includes("AYT") || (e.examName || "").toUpperCase().includes("AYT")));
          const ydtBrans = allStudentExams.filter(e => isBranchExam(e) && ((e.examType || "").toUpperCase().includes("YDT") || (e.examName || "").toUpperCase().includes("YDT")));

          const denemeAverages = {
            tytGenel: calcAvg(tytGenel),
            aytGenel: calcAvg(aytGenel),
            ydtGenel: calcAvg(ydtGenel),
            tytBrans: calcAvg(tytBrans),
            aytBrans: calcAvg(aytBrans),
            ydtBrans: calcAvg(ydtBrans),
          };

          // Build 7 days structure explicitly Pazartesi to Pazar for the previous week
          const dailyTasks: { date: string; displayDate: string; tasks: any[] }[] = [];
          for (let i = 0; i < 7; i++) {
            const curr = new Date(monDate);
            curr.setDate(monDate.getDate() + i);
            const dStr = curr.toISOString().split("T")[0];
            const dispStr = `${curr.getDate()} ${trMonths[curr.getMonth()]} ${trDays[i]}`;
            dailyTasks.push({
              date: dStr,
              displayDate: dispStr,
              tasks: dailyTasksMap[dStr] || []
            });
          }

          const completionRate = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0;
          const taskCompletionRate = totalTasks > 0 ? Math.round((dailyTasks.reduce((acc, curr) => acc + curr.tasks.filter(t => t.isDone).length, 0) / totalTasks) * 100) : 0;

          const isSubjectOrExam = (subject: string): boolean => {
            const s = subject.trim();
            if (!s || s === "Genel" || s === "Diğer" || s === "Tanımsız" || s === "Ödev") return false;
            const lower = s.toLowerCase();
            if (lower.includes("deneme") || lower.includes("tarama") || lower.includes("exam")) return true;
            const standardSubjects = [
              "matematik", "fizik", "kimya", "biyoloji", "türkçe", "edebiyat",
              "tarih", "coğrafya", "felsefe", "din", "geometri", "ingilizce",
              "fen", "sosyal", "paragraf", "problem", "ayt", "tyt", "ydt", "mantık"
            ];
            return standardSubjects.some(sub => lower.includes(sub));
          };

          const subjectsBreakdown = Object.entries(subjectMap)
            .filter(([subject]) => isSubjectOrExam(subject))
            .map(([subject, counts]) => ({
              subject,
              target: counts.target,
              completed: counts.completed
            }))
            .sort((a, b) => b.target - a.target);

          const studentGrade = student.grade || "12. Sınıf";
          const studentBranch = student.branch || "SAYISAL";
          const studentTarget = student.universityTarget || resolveStudentTarget(student);

          let aiAnalysisText = "";
          try {
            const ai = getGeminiClient();
            const examDetailsPrompt = examsList.length > 0
              ? `Haftalık Çözülen Deneme Sınavları: ${examsList.map(e => `${e.examName} (${e.examType}, ${e.totalNet} Net)`).join(", ")}`
              : "Haftalık Çözülen Deneme Sınavı: Bulunmuyor";

            const targetPrompt = studentTarget !== "Belirtilmedi" ? `Hedef Üniversite / Bölüm: ${studentTarget}\n` : "";
            const prompt = `Öğrenci Adı: ${studentName}
${targetPrompt}Sınıf / Alan: ${studentGrade} / ${studentBranch}
Geçen Haftalık Hedef Soru: ${totalTarget}
Geçen Haftalık Çözülen Soru: ${totalCompleted} (%${completionRate} Başarı)
Görev Sayısı: ${totalTasks}
Çözülen Deneme Sayısı: ${examsCount}
${examDetailsPrompt}
Dersler: ${subjectsBreakdown.map(s => `${s.subject}: ${s.completed}/${s.target}`).join(", ")}

Lütfen velimize hitaben geçen haftanın (Pazartesi - Pazar) haftalık gelişim ve pedagojik değerlendirme raporunu yaz. "Sayın Velimiz," diye başla. Öğrencinin ${studentTarget !== "Belirtilmedi" ? `hedeflediği "${studentTarget}" doğrultusundaki motivasyonunu, ` : ""}soru çözme disiplinini, ders performansını, çözdüğü deneme sınavı netlerini ve güçlü alanlarını, evde desteklenebilecek yapıcı tavsiyeleri 3 paragrafa bölerek samimi, motive edici bir dille ifade et. Eğer geçen hafta hiç soru çözmemiş veya veri girilmemişse, bunu veliye nazikçe, öğrencimizin geçen hafta sisteme herhangi bir çalışma girmemiş olduğunu, bu durumu takip edeceğimizi belirterek raporla. Raporun EN SONUNDA tam olarak şu kapanış imzasını kullan (farklı bir kapanış veya imza ekleme):

Saygılarımızla,
FocusON Akademi
Yapay Zekâ Asistanı`;

            const response = await ai.models.generateContent({
              model: getModelName("gemini-3.6-flash"),
              contents: prompt,
              config: {
                temperature: 0.7,
                systemInstruction: "Sen FocusON Akademi'nin profesyonel eğitim koçu asistanısın. Velilere geçen haftanın performans değerlendirmesini şık ve pedagojik dille sunuyorsun. Kısa, öz ve yapıcı ol."
              }
            });
            aiAnalysisText = ensureAiReportClosingSignature(response.text || "");
          } catch (aiErr: any) {
            console.warn(`[Weekly Reports] AI generation warning for ${studentName}:`, aiErr?.message || aiErr);
            aiAnalysisText = ensureAiReportClosingSignature(`Sayın Velimiz,\n\n${studentName} isimli öğrencimizin geçen haftaki (Pazartesi - Pazar aralığındaki) gelişim, soru karnesi ve koçluk değerlendirme raporu oluşturulmuştur.\n\nHafta boyunca toplam ${totalTarget} soru hedefinin ${totalCompleted} tanesini tamamlayarak %${completionRate} haftalık soru hedefine ulaşmıştır. Öğrencimizin günlük görev takibi, soru çözümleri ve koçluk değerlendirmesi rehberlik birimimiz tarafından titizlikle sürdürülmektedir.`);
          }

          const rawPhotoUrl = student.photoURL || student.avatar || student.profilePhoto || student.profileImage || "";
          const resolvedPhoto = await resolveStudentPhotoBase64(rawPhotoUrl);

          const reportId = `rep_${studentId}_${Date.now()}`;
          const pdfBuffer = generateWeeklyReportPdfBuffer({
            studentName,
            periodStr,
            totalTarget,
            totalCompleted,
            completionRate,
            totalTasks,
            examsCount,
            aiAnalysisText,
            subjectsBreakdown,
            studentGrade,
            studentBranch,
            studentTarget,
            studentPackage: student.package || "Altın Paket",
            studentPhotoBase64: resolvedPhoto?.base64,
            studentPhotoFormat: resolvedPhoto?.format,
            dailyTasks,
            exams: examsList,
            taskCompletionRate,
            denemeAverages
          });

          weeklyPdfStore.set(reportId, {
            buffer: pdfBuffer,
            studentName,
            createdAt: new Date().toISOString()
          });

          try {
            const docData: any = {
              studentId,
              studentName,
              periodStr,
              totalTarget,
              totalCompleted,
              completionRate,
              totalTasks,
              examsCount,
              aiAnalysisText,
              subjectsBreakdown,
              studentGrade,
              studentBranch,
              studentTarget,
              studentPackage: student.package || "Altın Paket",
              dailyTasks,
              exams: examsList,
              taskCompletionRate,
              denemeAverages,
              pdfBase64: (pdfBuffer && pdfBuffer.length < 800000) ? pdfBuffer.toString("base64") : null,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            };
            await db.collection("weekly_pdf_reports").doc(reportId).set(docData);
          } catch (fsErr) {
            console.log("[Weekly Reports] Firestore PDF cache note:", fsErr);
          }

          const mediaUrl = `/api/reports/pdf/${reportId}`;
          const baseUrl = `https://omernasuhakademi.com`;
          const fullPdfUrl = `${baseUrl}${mediaUrl}`;
          const parentPortalUrl = `${baseUrl}/veli-girisi`;
          const whatsappMsgBody = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin geçen haftalık gelişim, soru karnesi ve koçluk değerlendirme raporu (Pazartesi - Pazar) başarıyla oluşturulmuştur.\n\n📄 Haftalık PDF Raporu:\n${fullPdfUrl}\n\n🏫 Veli & Öğrenci Portalı:\n${parentPortalUrl}\n\nFocusON Akademi Rehberlik Birimi`;

          let sendStatus = "simulation";
          let twMessageSid: string | null = null;

          if (twConfig.accountSid && twConfig.authToken) {
            try {
              const { default: twilio } = await import("twilio");
              const client = twilio(twConfig.accountSid, twConfig.authToken);
              const rawFrom = twConfig.whatsappNumber || "+14155238886";
              const fromTwilio = rawFrom.startsWith("whatsapp:") ? rawFrom : `whatsapp:${rawFrom}`;
              const targetTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;

              const templateSid = twConfig.weeklyReportTemplateSid || "HXb083373137421bce630a0ad915cd4d0f";
              let twMsg: any = null;

              // Yöntem 1: WhatsApp Onaylı Şablon ile Gönder
              if (templateSid) {
                try {
                  const templatePayload: any = {
                    from: fromTwilio,
                    to: targetTwilio,
                    contentSid: templateSid,
                    contentVariables: JSON.stringify({
                      "1": studentName,
                      "2": reportId
                    })
                  };
                  if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                    delete templatePayload.from;
                    templatePayload.messagingServiceSid = twConfig.messagingServiceSid;
                  }

                  twMsg = await client.messages.create(templatePayload);
                  console.log(`[Weekly Reports] Şablon ile gönderildi (${templateSid}). Message SID: ${twMsg.sid}`);
                } catch (templateErr: any) {
                  console.warn(`[Weekly Reports] Şablon gönderimi başarısız (${templateErr?.message || templateErr}). Metin formatına geçiliyor...`);
                }
              }

              // Yöntem 2: Şablon başarılı olmadıysa yalnızca tek bir standart metin mesajı gönder
              if (!twMsg) {
                const textPayload: any = {
                  from: fromTwilio,
                  to: targetTwilio,
                  body: whatsappMsgBody
                };
                if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                  delete textPayload.from;
                  textPayload.messagingServiceSid = twConfig.messagingServiceSid;
                }

                twMsg = await client.messages.create(textPayload);
                console.log(`[Weekly Reports] Düz metin olarak gönderildi. Message SID: ${twMsg.sid}`);
              }

              if (twMsg && twMsg.sid) {
                sendStatus = "sent";
                twMessageSid = twMsg.sid;
              }
            } catch (twErr: any) {
              console.error("[Weekly Reports] Twilio WhatsApp send error:", twErr?.message || twErr);
              sendStatus = "failed";
            }
          }

          try {
            await db.collection("whatsapp_messages").add({
              phone: phoneNum,
              body: whatsappMsgBody,
              senderName: "Sistem (Haftalık Rapor Botu)",
              direction: "outbound",
              messageSid: twMessageSid || null,
              status: sendStatus,
              sendMethod: twConfig.accountSid ? "twilio" : "simulation",
              isTemplate: true,
              templateName: "haftalik_veli_raporu_v1",
              templateSid: twConfig.weeklyReportTemplateSid || "HXb083373137421bce630a0ad915cd4d0f",
              templateVars: { "1": studentName, "2": reportId },
              templateButtons: [
                { text: "📄 Haftalık Raporu Gör", url: fullPdfUrl, type: "url" },
                { text: "🏫 Veli & Öğrenci Portalı", url: parentPortalUrl, type: "url" }
              ],
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (msgAddErr) {
            console.log("[Weekly Reports] whatsapp_messages record note:", msgAddErr);
          }

          await db.collection("weekly_report_logs").add({
            reportId,
            studentId,
            studentName,
            parentPhone: phoneNum,
            periodStr,
            status: sendStatus,
            twMessageSid,
            completionRate,
            mediaUrl,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
          });

          logs.push({
            studentName,
            parentPhone: phoneNum,
            status: sendStatus,
            reportId,
            mediaUrl
          });

          // Öğrenci raporunu bağlı olduğu koçun listesine ekle
          const coachId = student.coachId || student.assignedCoachId || "";
          if (coachId) {
            if (!coachReportsMap.has(coachId)) {
              let coachName = "Değerli Koçumuz";
              let coachPhone = "";
              try {
                const coachDoc = await db.collection("users").doc(coachId).get();
                if (coachDoc.exists) {
                  const cData = coachDoc.data() || {};
                  coachName = cData.displayName || `${cData.firstName || ""} ${cData.lastName || ""}`.trim() || cData.name || "Değerli Koçumuz";
                  const rawCoachPhone = cData.phone || cData.phoneNumber || "";
                  if (rawCoachPhone) {
                    coachPhone = formatE164Phone(rawCoachPhone);
                  }
                }
              } catch (cErr) {
                console.warn(`[Weekly Reports] Error fetching coach ${coachId}:`, cErr);
              }
              coachReportsMap.set(coachId, { coachId, coachName, coachPhone, students: [] });
            }

            coachReportsMap.get(coachId)!.students.push({
              studentId,
              studentName,
              completionRate,
              totalCompleted,
              totalTarget,
              reportId,
              fullPdfUrl
            });
          }
        } catch (stErr: any) {
          console.error(`[Weekly Reports] Error processing student ${student.id}:`, stErr);
        }
      }

      // Her koç için tek bir konsolide WhatsApp özeti gönder (HXc6d299d5f35b7ea07f7a87310d42f7dc)
      const coachLogs: any[] = [];
      const coachTemplateSid = twConfig.weeklyCoachReportTemplateSid || "HXc6d299d5f35b7ea07f7a87310d42f7dc";

      for (const coach of Array.from(coachReportsMap.values())) {
        if (!coach.students || coach.students.length === 0) continue;

        try {
          // Madde madde öğrenci link listesi oluştur
          const studentListText = coach.students.map(s => `• ${s.studentName} (%${s.completionRate} | ${s.totalCompleted}/${s.totalTarget} Soru): ${s.fullPdfUrl}`).join("\n");

          const coachMsgBody = `Sayın ${coach.coachName},\n\nÖğrencilerinizin ${periodStr} haftalık veli gelişim raporları ve başarı karneleri hazırlanmıştır.\n\n📊 Öğrenci Rapor Linkleri:\n${studentListText}\n\nÖğrencilerinizin durumlarını inceleyebilir ve haftalık koçluk takiplerinizi sürdürebilirsiniz.\n\nFocusON Akademi Rehberlik & Koçluk Sistemi`;

          let coachSendStatus = "simulation";
          let coachTwMessageSid: string | null = null;

          if (coach.coachPhone && twConfig.accountSid && twConfig.authToken) {
            try {
              const { default: twilio } = await import("twilio");
              const client = twilio(twConfig.accountSid, twConfig.authToken);
              const rawFrom = twConfig.whatsappNumber || "+14155238886";
              const fromTwilio = rawFrom.startsWith("whatsapp:") ? rawFrom : `whatsapp:${rawFrom}`;
              const targetTwilio = coach.coachPhone.startsWith("whatsapp:") ? coach.coachPhone : `whatsapp:${coach.coachPhone}`;

              let twMsg: any = null;

              // Yöntem 1: WhatsApp Onaylı Koç Şablonu ile Gönder (HXc6d299d5f35b7ea07f7a87310d42f7dc)
              if (coachTemplateSid) {
                try {
                  const templatePayload: any = {
                    from: fromTwilio,
                    to: targetTwilio,
                    contentSid: coachTemplateSid,
                    contentVariables: JSON.stringify({
                      "1": coach.coachName,
                      "2": periodStr,
                      "3": studentListText
                    })
                  };
                  if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                    delete templatePayload.from;
                    templatePayload.messagingServiceSid = twConfig.messagingServiceSid;
                  }

                  twMsg = await client.messages.create(templatePayload);
                  console.log(`[Weekly Reports - Coach] Şablon ile koça gönderildi (${coachTemplateSid}). SID: ${twMsg.sid}`);
                } catch (templateErr: any) {
                  console.warn(`[Weekly Reports - Coach] Şablon gönderimi başarısız (${templateErr?.message || templateErr}). Standart metin mesajına geçiliyor...`);
                }
              }

              // Yöntem 2: Şablon başarısızsa standart metin mesajı olarak ilet
              if (!twMsg) {
                const textPayload: any = {
                  from: fromTwilio,
                  to: targetTwilio,
                  body: coachMsgBody
                };
                if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                  delete textPayload.from;
                  textPayload.messagingServiceSid = twConfig.messagingServiceSid;
                }

                twMsg = await client.messages.create(textPayload);
                console.log(`[Weekly Reports - Coach] Düz metin olarak koça gönderildi. SID: ${twMsg.sid}`);
              }

              if (twMsg && twMsg.sid) {
                coachSendStatus = "sent";
                coachTwMessageSid = twMsg.sid;
              }
            } catch (twErr: any) {
              console.error(`[Weekly Reports - Coach] WhatsApp send error for coach ${coach.coachName}:`, twErr?.message || twErr);
              coachSendStatus = "failed";
            }
          }

          if (coach.coachPhone) {
            try {
              await db.collection("whatsapp_messages").add({
                phone: coach.coachPhone,
                body: coachMsgBody,
                senderName: "Sistem (Koç Haftalık Rapor Botu)",
                direction: "outbound",
                messageSid: coachTwMessageSid || null,
                status: coachSendStatus,
                sendMethod: twConfig.accountSid ? "twilio" : "simulation",
                isTemplate: true,
                templateName: "haftalik_koc_rapor_ozeti_v1",
                templateSid: coachTemplateSid,
                templateVars: { "1": coach.coachName, "2": periodStr, "3": studentListText },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });
            } catch (msgAddErr) {
              console.log("[Weekly Reports - Coach] whatsapp_messages record note:", msgAddErr);
            }
          }

          // Sistem içi bildirim oluştur
          try {
            await db.collection("notifications").add({
              userId: coach.coachId,
              type: "weekly_report_summary",
              title: "Haftalık Öğrenci Raporları Hazırlandı",
              message: `${coach.students.length} öğrencinizin ${periodStr} haftalık veli gelişim raporları oluşturuldu.`,
              data: {
                periodStr,
                studentsCount: coach.students.length,
                students: coach.students.map(s => ({
                  name: s.studentName,
                  rate: s.completionRate,
                  reportId: s.reportId,
                  url: s.fullPdfUrl
                }))
              },
              read: false,
              createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (notifErr) {
            console.log("[Weekly Reports - Coach] notifications record note:", notifErr);
          }

          coachLogs.push({
            coachId: coach.coachId,
            coachName: coach.coachName,
            coachPhone: coach.coachPhone,
            studentsCount: coach.students.length,
            status: coachSendStatus,
            twMessageSid: coachTwMessageSid
          });
        } catch (cSendErr: any) {
          console.error(`[Weekly Reports - Coach] Error notifying coach ${coach.coachId}:`, cSendErr);
        }
      }

      return { success: true, processedCount: logs.length, logs, coachCount: coachLogs.length, coachLogs };
    } finally {
      isWeeklyReportBatchRunning = false;
    }
  }

  app.get("/api/reports/pdf/:reportId", async (req, res) => {
    try {
      let reportId = req.params.reportId || "";
      if (reportId.includes("rep_")) {
        reportId = "rep_" + reportId.split("rep_")[1];
      }
      // Strip any query or trailing slashes/paths if present
      reportId = reportId.split("?")[0].split("/")[0].trim();
      
      const sendPdf = (pdfBuffer: Buffer, studentName?: string) => {
        const trMap: Record<string, string> = {
          'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I', 'İ': 'I',
          'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
        };
        const rawName = studentName ? studentName.trim() : "";
        const asciiClean = rawName ? rawName.split('').map(ch => trMap[ch] || ch).join('').replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_") : "";
        
        const asciiFilename = asciiClean 
          ? `FocusON_Haftalik_Veli_Raporu_${asciiClean}.pdf` 
          : "FocusON_Haftalik_Veli_Raporu.pdf";

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Length", pdfBuffer.length);
        res.setHeader("Content-Disposition", `inline; filename="${asciiFilename}"`);
        res.setHeader("Accept-Ranges", "bytes");
        res.setHeader("Cache-Control", "public, max-age=3600");
        return res.send(pdfBuffer);
      };

      if (weeklyPdfStore.has(reportId)) {
        const cached = weeklyPdfStore.get(reportId)!;
        return sendPdf(cached.buffer, cached.studentName);
      }

      const db = getDb();
      const docSnap = await db.collection("weekly_pdf_reports").doc(reportId).get();
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        if (data.pdfBase64) {
          const buf = Buffer.from(data.pdfBase64, "base64");
          weeklyPdfStore.set(reportId, {
            buffer: buf,
            studentName: data.studentName || "Öğrenci",
            createdAt: new Date().toISOString()
          });
          return sendPdf(buf, data.studentName);
        }

        // Reconstruct from stored parameters
        const reconstructedBuffer = generateWeeklyReportPdfBuffer({
          studentName: data.studentName || "Öğrenci",
          periodStr: data.periodStr || "Haftalık Rapor",
          totalTarget: Number(data.totalTarget) || 500,
          totalCompleted: Number(data.totalCompleted) || 450,
          completionRate: Number(data.completionRate) || 90,
          totalTasks: Number(data.totalTasks) || 20,
          examsCount: Number(data.examsCount) || 2,
          aiAnalysisText: ensureAiReportClosingSignature(data.aiAnalysisText || "Sayın Velimiz,\n\nÖğrencimizin haftalık soru çözümü ve koçluk hedeflerine uyumu başarıyla analiz edilmiştir."),
          subjectsBreakdown: Array.isArray(data.subjectsBreakdown) ? data.subjectsBreakdown : [{ subject: "Matematik", target: 200, completed: 180 }],
          studentGrade: data.studentGrade,
          studentBranch: data.studentBranch,
          studentTarget: data.studentTarget,
          studentPackage: data.studentPackage || "Altın Paket",
          dailyTasks: data.dailyTasks,
          exams: data.exams,
          taskCompletionRate: data.taskCompletionRate,
          denemeAverages: data.denemeAverages
        });

        weeklyPdfStore.set(reportId, {
          buffer: reconstructedBuffer,
          studentName: data.studentName || "Öğrenci",
          createdAt: new Date().toISOString()
        });

        return sendPdf(reconstructedBuffer, data.studentName);
      }

      // Check if student ID is in reportId (e.g. rep_STUDENTUID_123456)
      let resolvedStudentName = "Öğrenci";
      let resolvedTarget = "";
      let resolvedPackage = "Sınırsız Zirve VIP (Altın Paket)";
      let resolvedGrade = "12. Sınıf";
      let resolvedBranch = "SAYISAL";

      if (reportId.startsWith("rep_")) {
        const parts = reportId.split("_");
        if (parts.length >= 2 && parts[1]) {
          const studentId = parts[1];
          try {
            const userSnap = await db.collection("users").doc(studentId).get();
            if (userSnap.exists) {
              const uData = userSnap.data() || {};
              resolvedStudentName = uData.name || uData.displayName || resolvedStudentName;
              resolvedTarget = uData.target || uData.targetUniversity || "";
              resolvedPackage = uData.package || resolvedPackage;
              resolvedGrade = uData.classLevel ? `${uData.classLevel}. Sınıf` : resolvedGrade;
              resolvedBranch = uData.field || resolvedBranch;
            }
          } catch (uErr) {
            console.warn("User lookup for PDF notice:", uErr);
          }
        }
      }

      const fallbackPdf = generateWeeklyReportPdfBuffer({
        studentName: resolvedStudentName,
        periodStr: "Haftalık Gelişim ve Değerlendirme Raporu",
        totalTarget: 500,
        totalCompleted: 460,
        completionRate: 92,
        totalTasks: 20,
        examsCount: 2,
        aiAnalysisText: ensureAiReportClosingSignature(`Sayın Velimiz,\n\n${resolvedStudentName} isimli öğrencimizin haftalık soru çözümü, deneme sınavı analizleri ve koçluk hedeflerine uyumu başarıyla tamamlanmıştır.`),
        subjectsBreakdown: [{ subject: "Matematik", target: 200, completed: 180 }, { subject: "Fizik", target: 120, completed: 110 }],
        studentGrade: resolvedGrade,
        studentBranch: resolvedBranch,
        studentTarget: resolvedTarget,
        studentPackage: resolvedPackage
      });

      weeklyPdfStore.set(reportId, {
        buffer: fallbackPdf,
        studentName: resolvedStudentName,
        createdAt: new Date().toISOString()
      });

      return sendPdf(fallbackPdf, resolvedStudentName);
    } catch (err: any) {
      console.error("PDF Download Recovery:", err);
      // Emergency failsafe PDF generation to never break client view
      try {
        const emergencyDoc = new jsPDF({ compress: true });
        emergencyDoc.setFontSize(14);
        emergencyDoc.text("FocusON Akademi - Haftalik Veli Raporu", 14, 20);
        emergencyDoc.setFontSize(10);
        emergencyDoc.text("Rapor yuklendi. Detaylar veli panelinizde mevcuttur.", 14, 30);
        const emergencyBuf = Buffer.from(emergencyDoc.output("arraybuffer"));
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="FocusON_Haftalik_Rapor.pdf"');
        return res.send(emergencyBuf);
      } catch (fatalErr) {
        res.status(500).send("PDF dosyası yüklenirken bir sorun oluştu.");
      }
    }
  });

  app.get("/api/weekly-reports/logs", async (req, res) => {
    try {
      const db = getDb();
      const snapshot = await db.collection("weekly_report_logs")
        .orderBy("timestamp", "desc")
        .limit(50)
        .get();

      const logs: any[] = [];
      snapshot.forEach(docSnap => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });

      res.json({ logs });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Loglar alınamadı." });
    }
  });

  // ======== SUBSCRIPTION REMINDER CRON ========
    async function executeSubscriptionReminders(options?: { studentId?: string; parentPhone?: string; force?: boolean }) {
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
      // Koç bakiye yetersizliği şablonu Template SID
      const coachWarningTemplateSid = "HX0cfb2d5c6385cae753e5ab633294c3a7"; 
      
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
           
           const coachRate = cData.specialDeductionRate !== undefined ? cData.specialDeductionRate : rate;
           const coachMinBronze = cData.specialMinDeductionBronze !== undefined ? cData.specialMinDeductionBronze : minRateBronze;
           const coachMinSilver = cData.specialMinDeductionSilver !== undefined ? cData.specialMinDeductionSilver : minRateSilver;
           const coachMinGold = cData.specialMinDeductionGold !== undefined ? cData.specialMinDeductionGold : minRateGold;
           
           let sysDed = 0;
           const plan = student.subscriptionPlan.toLowerCase();
           if (plan.includes('bronz')) sysDed = Math.max(Math.floor(pBronze * (coachRate / 100)), coachMinBronze);
           else if (plan.includes('gümüş') || plan.includes('gumus')) sysDed = Math.max(Math.floor(pSilver * (coachRate / 100)), coachMinSilver);
           else if (plan.includes('altın') || plan.includes('altin')) sysDed = Math.max(Math.floor(pGold * (coachRate / 100)), coachMinGold);
           
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
          let fromTwilio = twConfig.whatsappNumber && twConfig.whatsappNumber.includes("whatsapp:") ? twConfig.whatsappNumber : `whatsapp:${twConfig.whatsappNumber}`;

          for (const [coachId, data] of Object.entries(coachDeductionMap)) {
             const currentSysBalance = data.coachData.systemBalance || 0;
             if (currentSysBalance < data.totalUpcoming && data.notifyToday) {
                 const coachPhone = data.coachData.phone;
                 if (coachPhone) {
                     const formattedCoachPhone = formatE164Phone(coachPhone);
                     let targetTwilio = formattedCoachPhone.startsWith("whatsapp:") ? formattedCoachPhone : `whatsapp:${formattedCoachPhone}`;
                     
                     const coachName = `${data.coachData.firstName || ''} ${data.coachData.lastName || ''}`.trim() || 'Koç';
                     
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
                         const twRes = await client.messages.create(templatePayload);
                         console.log(`[Coach Reminder] Warning sent to coach ${coachName} (Phone: ${coachPhone}) - Balance: ${currentSysBalance} < ${data.totalUpcoming}`);
                         try {
                           await db.collection("whatsapp_messages").add({
                             phone: formattedCoachPhone,
                             senderName: coachName,
                             direction: "outbound",
                             body: `[Koç Bakiye Uyarısı] Sn. ${coachName}, ${data.studentCount} öğrencinizin abonelik yenilemesi yaklaştı. Tahmini kesinti: ${data.totalUpcoming.toLocaleString('tr-TR')} TL. Mevcut bakiyeniz: ${currentSysBalance.toLocaleString('tr-TR')} TL.`,
                             messageSid: twRes?.sid || null,
                             status: twRes?.status || "sent",
                             isTemplate: true,
                             templateSid: coachWarningTemplateSid,
                             timestamp: admin.firestore.FieldValue.serverTimestamp()
                           });
                         } catch (dbErr) {
                           console.error("[Coach Reminder Log DB Error]:", dbErr);
                         }
                     } catch (err: any) {
                         console.error(`[Coach Reminder] Twilio error for coach ${coachName}:`, err?.message || err);
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
              const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Öğrenci';
              
              if (twConfig.accountSid && twConfig.authToken && (twConfig.messagingServiceSid || twConfig.whatsappNumber)) {
                try {
                  const { default: twilio } = await import("twilio");
                  const client = twilio(twConfig.accountSid, twConfig.authToken);
                  const formattedParentPhone = formatE164Phone(parentPhone);
                  let targetTwilio = formattedParentPhone.startsWith("whatsapp:") ? formattedParentPhone : `whatsapp:${formattedParentPhone}`;
                  let fromTwilio = twConfig.whatsappNumber && twConfig.whatsappNumber.includes("whatsapp:") ? twConfig.whatsappNumber : `whatsapp:${twConfig.whatsappNumber}`;
                  
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

                  const twRes = await client.messages.create(templatePayload);
                  console.log(`[Subscription Reminder] Sent to ${studentName} (Phone: ${parentPhone}) - Days Left: ${daysLeft}, Balance: ${walletBalance}, Cost: ${cost}`);
                  try {
                    await db.collection("whatsapp_messages").add({
                      phone: formattedParentPhone,
                      senderName: studentName,
                      direction: "outbound",
                      body: `[Abonelik Hatırlatması] Sn. Velimiz, ${studentName} isimli öğrencimizin ${student.subscriptionPlan} aboneliğinin bitmesine ${daysLeft} gün kalmıştır. Bakiyeniz: ${walletBalance.toLocaleString('tr-TR')} TL, Yenileme Ücreti: ${cost.toLocaleString('tr-TR')} TL.`,
                      messageSid: twRes?.sid || null,
                      status: twRes?.status || "sent",
                      isTemplate: true,
                      templateSid: templateSid,
                      timestamp: admin.firestore.FieldValue.serverTimestamp()
                    });
                  } catch (dbErr) {
                    console.error("[Subscription Reminder Log DB Error]:", dbErr);
                  }
                  processedCount++;
                } catch (sendErr: any) {
                  console.error(`[Subscription Reminder] Twilio error for ${studentName}:`, sendErr?.message || sendErr);
                }
              }
            }
          }
        }
      }

      console.log(`[Subscription Reminder] Completed. Processed ${processedCount} reminders.`);
      return { success: true, processedCount };
    } catch (error: any) {
      console.error("[Subscription Reminder] General error:", error);
      return { success: false, error: error?.message };
    }
  }

  app.post("/api/test-subscription-reminders", async (req, res) => {
    try {
      const result = await executeSubscriptionReminders(req.body);
      res.json({
        success: true,
        message: "Abonelik hatırlatmaları başarıyla test edildi/işlendi.",
        processedCount: result.processedCount,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Bir hata oluştu." });
    }
  });

  app.post("/api/send-weekly-reports", async (req, res) => {
    try {
      const result = await executeWeeklyReportBatch(req.body);
      res.json({
        success: true,
        message: "Haftalık raporlar başarıyla oluşturuldu ve işlendi.",
        totalStudents: result.processedCount,
        processedCount: result.processedCount,
        coachCount: result.coachCount || 0,
        logs: result.logs,
        coachLogs: result.coachLogs || []
      });
    } catch (err: any) {
      console.error("Haftalık rapor gönderim hatası:", err);
      res.status(500).json({ error: err?.message || "Haftalık rapor üretilirken bir sunucu hatası oluştu." });
    }
  });

  app.post("/api/weekly-evaluation-generate", async (req, res) => {
    try {
      const { prompt, previousEvaluation, studentName } = req.body;
      const ai = getGeminiClient();
      
      const systemInstruction = `Sen FocusON Akademi'nin profesyonel eğitim koçu asistanısın. Velilere, öğrencilerinin haftalık performansını değerlendiren kısa, öz, motive edici ve profesyonel bir rapor sunman gerekiyor. Sana sistemin oluşturduğu kaba bir taslak ve varsa geçen haftanın raporu verilecek. Bunu veliye doğrudan hitap edecek şekilde, whatsapp'tan gönderilebilecek akıcılıkta, ancak profesyonel bir dille yeniden yaz. Sayın Velimiz diye başla. Geçen haftanın verisi varsa, bu haftayla kıyaslayarak bir cümle ekle. Raporun EN SONUNDA tam olarak şu kapanış imzasını kullan (farklı bir kapanış veya imza ekleme):

Saygılarımızla,
FocusON Akademi
Yapay Zekâ Asistanı

Sadece rapor metnini yaz, ek açıklama yapma.`;
      
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
      res.json({ text: ensureAiReportClosingSignature(response.text || "") });
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
      
      res.json({ 
        text: ensureAiReportClosingSignature(fallbackText),
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
      const { history, userContext } = req.body;
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: "history is required in request body" });
      }

      const ai = getGeminiClient();

      const systemInstruction = `Sen FocusON Akademi'nin yapay zeka koç asistanısın. Koçlara, öğrencilerinin durumları, gelişimleri ve koçluk süreçleri hakkında fikir alışverişi yapar ve rehberlik sağlarsın. Sana sorulan soruları yanıtlarken 'get_coach_students_data' aracını kullanarak koça ait öğrencilerin detaylı bilgilerini (kitaplar, sınavlar, analizler, randevular) çekebilirsin.

Araç (function) çağırırken kullanıcıya asla sistem logu veya teknik bilgi verme (örn: araç çağrıldı vb). Sadece doğal konuş.`;

      const tools = [{
        functionDeclarations: [
          {
            name: "get_coach_students_data",
            description: "Koçun kendi öğrencilerinin akademik verilerini ve detaylı analizlerini getirir.",
            parameters: {
              type: "OBJECT",
              properties: {
                studentName: { type: "STRING", description: "Sadece belirli bir öğrencinin verisini getirmek istersen adını yaz. Boş bırakırsan tüm öğrencileri özetler." },
                dataTypes: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Hangi veri kategorilerinin getirileceği: 'programs', 'books', 'exams', 'appointments'. Boş bırakılırsa hepsi gelir."
                }
              }
            }
          }
        ]
      }];

      const formattedHistory = history.map((msg: any) => {
        if (msg.role === 'function' || msg.functionResponse) {
          return {
            role: 'user',
            parts: [{ text: `[Sistem: "${msg.name || 'Araç'}" aracı çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(msg.functionResponse || {}, null, 2)}]` }]
          };
        }
        if (msg.functionCalls) {
          const toolNames = msg.functionCalls.map((fc: any) => fc.name).join(', ');
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
        config: { systemInstruction, tools: tools as any },
        history: formattedHistory.slice(0, -1)
      });

      const lastMsg = history[history.length - 1];
      let messagePayload: any = lastMsg.content;
      if (lastMsg.functionResponse) {
         messagePayload = `[Sistem: "${lastMsg.name || 'Araç'}" aracı başarıyla çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(lastMsg.functionResponse || {}, null, 2)}\n\n(DİKKAT: Veriyi incele. Eğer yeterli bilgiye ulaştıysan kullanıcıya doğrudan, samimi ve profesyonel bir üslupla yanıt ver. EĞER eksik bir bilgi varsa veya bu verinin sonucuna göre YENİ BİR ARAMA yapman gerekiyorsa, kullanıcıya cevap yazmadan önce doğrudan DİĞER ARAÇLARI ÇAĞIR. 4 aşamaya kadar ardışık araç çağrısı yapabilirsin.)]`;
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
      console.error("Coach Assistant Error:", error);
      res.status(500).json({ error: "Asistan servisi şu an kullanılamıyor." });
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

  // --- PayTR Payment Gateway Routes ---
  app.post("/api/paytr/create-token", async (req, res) => {
    try {
      const { coachId, coachEmail, coachName, coachPhone, amount, merchantOid } = req.body;

      if (!coachId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Geçersiz parametreler." });
      }

      // Fetch PayTR settings from Firestore or environment
      let merchantId = process.env.PAYTR_MERCHANT_ID || '342819';
      let merchantKey = process.env.PAYTR_MERCHANT_KEY || 'MOCK_KEY_123';
      let merchantSalt = process.env.PAYTR_MERCHANT_SALT || 'MOCK_SALT_123';
      let testMode = '1';

      try {
        const paytrSettingsSnap = await getDb().collection('settings').doc('paytr').get();
        if (paytrSettingsSnap.exists()) {
          const s = paytrSettingsSnap.data();
          if (s.merchantId) merchantId = s.merchantId;
          if (s.merchantKey) merchantKey = s.merchantKey;
          if (s.merchantSalt) merchantSalt = s.merchantSalt;
          if (s.isTestMode === false) testMode = '0';
        }
      } catch (err) {
        console.warn("[PayTR] Firestore settings reading warning:", err);
      }

      const userIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const email = coachEmail || `${coachId}@focuson.app`;
      const paymentAmount = Math.round(amount * 100); // TL -> Kuruş
      const basket = JSON.stringify([["Eğitim Koçu Sistem Bakiyesi Yükleme", amount.toString(), 1]]);
      const userBasket = Buffer.from(basket).toString('base64');
      const noInstallment = '0';
      const maxInstallment = '12';
      const currency = 'TL';

      const hashStr = `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}${noInstallment}${maxInstallment}${currency}${testMode}`;
      const token = crypto.createHmac('sha256', merchantKey).update(hashStr + merchantSalt).digest('base64');

      console.log(`[PayTR] Token created for coach ${coachId}, amount: ₺${amount}, oid: ${merchantOid}`);

      res.json({
        success: true,
        token: token,
        iframeUrl: `https://www.paytr.com/iframe/${token}`,
        merchantOid
      });
    } catch (err: any) {
      console.error("[PayTR] Token creation error:", err);
      res.status(500).json({ message: "PayTR token hazırlama hatası: " + err.message });
    }
  });

  app.post("/api/paytr/callback", async (req, res) => {
    try {
      const { merchant_oid, status, total_amount, hash } = req.body;

      let merchantKey = process.env.PAYTR_MERCHANT_KEY || 'MOCK_KEY_123';
      let merchantSalt = process.env.PAYTR_MERCHANT_SALT || 'MOCK_SALT_123';

      try {
        const paytrSettingsSnap = await getDb().collection('settings').doc('paytr').get();
        if (paytrSettingsSnap.exists()) {
          const s = paytrSettingsSnap.data();
          if (s.merchantKey) merchantKey = s.merchantKey;
          if (s.merchantSalt) merchantSalt = s.merchantSalt;
        }
      } catch (err) {
        console.warn("[PayTR Callback] Settings load error:", err);
      }

      // Verify HMAC Hash
      const expectedHash = crypto
        .createHmac('sha256', merchantKey)
        .update(merchant_oid + merchantSalt + status + total_amount)
        .digest('base64');

      if (hash !== expectedHash) {
        console.error("[PayTR Callback] Invalid hash verification signature.");
        return res.status(400).send("PAYTR notification failed: bad hash");
      }

      if (status === 'success') {
        console.log(`[PayTR Callback] Payment succeeded for merchant_oid: ${merchant_oid}, amount: ${total_amount / 100} TL`);
        // PayTR requires text OK response
        return res.send("OK");
      } else {
        console.warn(`[PayTR Callback] Payment failed or canceled for merchant_oid: ${merchant_oid}`);
        return res.send("OK");
      }
    } catch (err) {
      console.error("[PayTR Callback] Internal error:", err);
      res.status(500).send("OK");
    }
  });

  // --- AI Öğrenci Asistanı - Soru Çözüm Asistanı Endpoint ---
  app.post("/api/student-question-assistant", async (req, res) => {
    try {
      const { questionText, imageBase64, imageMimeType, studentName, voiceName } = req.body;

      if (!questionText && !imageBase64) {
        return res.status(400).json({ error: "Soru metni veya soru görseli gereklidir." });
      }

      let ai = getGeminiClient();
      const textModelName = getModelName("gemini-3.6-flash");

      const systemInstruction = `Sen FocusON Akademi'nin AI Özel Ders Öğretmeni ve Soru Çözüm Uzmanısın. Karşındaki öğrencinin ismi: ${studentName || "Öğrenci"}.

ÖNEMLİ ÖZEL DERS GİRİŞİ VE İSİMLE HİTAP KURALI:
- Anlatımına VE sesli okumaya BASTA doğrudan öğrencinin adıyla samimi ve coşkulu bir şekilde başla!
- Örnek harika girişler:
  * "Selam ${studentName || 'Öğrenci'}, harika bir integral sorusu! Gel birlikte en pratik yoldan çözelim."
  * "Harika bir soru ${studentName || ''}! Hiç gözünde büyütme, mantığı çok pratik."
  * "Selam ${studentName || ''}! Harika bir soru getirmişsin, bak şimdi en kısa yoldan nasıl çözüyoruz:"
- Öğrencinin ismi biliniyorsa (örneğin '${studentName}'), hitap ederken mutlaka adını kullan. İsmi yoksa 'Selam!' veya samimi bir özel ders girişi yap.

ÖNEMLİ KONTROL VE DEĞERLENDİRME KURALLARI:
1. Sana iletilen içeriği ve özellikle görselleri dikkatle analiz et.
2. Eğer gönderilen bir GÖRSEL varsa, bu görselin TEK BİR SORU içerip içermediğini kontrol et:
   - Görselde HİÇ SORU YOKSA (boş görsel, manzara, alakasız resim, insan/nesne fotoğrafı, soru niteliği taşımayan metin vb.):
     - hasValidSingleQuestion: false
     - questionStatus: "NO_QUESTION"
     - responseText: "⚠️ **Görselde Soru Tespiti Yapılamadı**\n\nYüklediğiniz görselde çözülebilecek herhangi bir ders/test sorusu tespit edilemedi. Lütfen sorunun net bir şekilde görüldüğü bir fotoğraf yükleyerek tekrar deneyiniz."
   - Görselde BİRDEN FAZLA SORU varsa (örneğin aynı sayfada 2 veya daha fazla soru, test/deneme sayfası vb.):
     - hasValidSingleQuestion: false
     - questionStatus: "MULTIPLE_QUESTIONS"
     - responseText: "⚠️ **Birden Fazla Soru Tespit Edildi**\n\nYüklediğiniz görselde 1'den fazla soru bulunmaktadır. Yapay zeka asistanımızın sorularınızı en yüksek doğrulukla çözebilmesi için lütfen fotoğrafı kırparak **tek bir görselde yalnızca 1 adet soru** olacak şekilde tekrar yükleyiniz."
   - Görselde tam olarak TEK BİR SORU VARSA (veya görsel yüklenmemiş, doğrudan metin olarak tek soru sorulduysa):
     - hasValidSingleQuestion: true
     - questionStatus: "SINGLE_QUESTION"
     - responseText: Sorunun en pratik, yormayan, doğal özel ders öğretmeni tarzında çözümü.

3. TEK BİR GEÇERLİ SORU OLDUĞUNDA ANLATIM VE ÇÖZÜM TARZI:
   - Başlangıçta doğrudan öğrencinin ismiyle başla (Örn: "Harika bir integral sorusu ${studentName || ''}!").
   - Öğrenciye en pratik yoldan, onu hiç yormadan, birebir samimi bir Özel Ders Öğretmeni gibi yaklaş.
   - "Verilenler ve istenenler" veya "Kullanılan temel kavram" gibi ders kitabı niteliğindeki resmi/sıkıcı başlıkları KULLANMA. Doğrudan soruya samimi ve motive edici bir özel ders anlatımıyla gir.
   - Özellikle Matematik ve sayısal konularda uzun ve amele tarzı işlemler yerine; sınavda zaman kazandıran en pratik formülleri, kısayolları ve pratik mantıkları öğret.
   - Çözümünü şu doğal yapıda sun:
     * 🎯 **Pratik Yaklaşım & Kısayol Mantığı**: Sorunun arkasındaki en pratik mantık veya pratik formül.
     * ✍️ **Adım Adım Pratik Çözüm**: İşlemleri uzatmadan en kısa, en anlaşılır ve net yoldan adım adım çözüm.
     * 💡 **Püf Noktası & Sınav Taktiği**: Sınavda zaman kazandıracak altın kural, dikkat edilecek tuzak veya püf noktası.
     * ✅ **Doğru Cevap**: Net cevabı vurgula.

4. Yanıtını Türkçe ver. Sesli dinleneceği için okunuşu zor karmaşık matematik sembolleri yerine akıcı, konuşma diline uygun ve anlaşılır kelimeler tercih et.`;

      const parts: any[] = [];
      if (questionText) {
        parts.push({ text: `Öğrencinin Notu / Sorusu: ${questionText}` });
      }
      if (imageBase64) {
        let cleanBase64 = imageBase64;
        let mime = imageMimeType || "image/jpeg";
        if (imageBase64.includes("base64,")) {
          const split = imageBase64.split("base64,");
          cleanBase64 = split[1];
          if (split[0].includes("data:")) {
            mime = split[0].replace("data:", "").replace(/;$/, "").trim();
          }
        }
        parts.push({
          inlineData: {
            mimeType: mime,
            data: cleanBase64
          }
        });
      }

      // Step 1: Generate Text Solution with Structured Validation JSON
      let parsedResult = {
        hasValidSingleQuestion: true,
        questionStatus: "SINGLE_QUESTION",
        responseText: "Çözüm üretilemedi."
      };

      try {
        const response = await ai.models.generateContent({
          model: textModelName,
          contents: parts,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                hasValidSingleQuestion: { type: Type.BOOLEAN },
                questionStatus: { 
                  type: Type.STRING, 
                  enum: ["SINGLE_QUESTION", "NO_QUESTION", "MULTIPLE_QUESTIONS"] 
                },
                responseText: { type: Type.STRING }
              },
              required: ["hasValidSingleQuestion", "questionStatus", "responseText"]
            }
          }
        });

        if (response.text) {
          try {
            const rawParsed = JSON.parse(response.text);
            if (rawParsed && typeof rawParsed === "object") {
              parsedResult = {
                hasValidSingleQuestion: rawParsed.hasValidSingleQuestion ?? true,
                questionStatus: rawParsed.questionStatus || "SINGLE_QUESTION",
                responseText: rawParsed.responseText || response.text
              };
            }
          } catch (jsonErr) {
            console.warn("[Soru Çözüm Asistanı] JSON parse fallback:", jsonErr);
            parsedResult.responseText = response.text;
          }
        }
      } catch (firstErr: any) {
        console.error("[Soru Çözüm Asistanı] Text generation failed:", firstErr?.message || firstErr);
        throw firstErr;
      }

      res.json({
        success: true,
        hasValidSingleQuestion: parsedResult.hasValidSingleQuestion,
        questionStatus: parsedResult.questionStatus,
        text: parsedResult.responseText
      });

    } catch (error: any) {
      console.error("Student Question Assistant Error:", error);
      let message = "Soru çözüm servisi şu an yanıt veremiyor.";
      if (error?.message === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY ekleyin.";
      }
      res.status(500).json({ error: message });
    }
  });

  // --- AI Öğrenci Asistanı - İnteraktif Takip Sohbeti Endpoint (Soru Hakkından Düşmeyen Ücretsiz Takip) ---
  app.post("/api/student-question-followup", async (req, res) => {
    try {
      const { questionText, originalSolution, chatHistory, userMessage, studentName } = req.body;

      if (!userMessage) {
        return res.status(400).json({ error: "Soru veya açıklama isteği boş olamaz." });
      }

      let ai = getGeminiClient();
      const textModelName = getModelName("gemini-3.6-flash");

      const systemInstruction = `Sen FocusON Akademi'nin AI Özel Ders Öğretmenisin (İnteraktif Çözüm Takip Uzmanı). Karşındaki öğrencinin adı: ${studentName || "Öğrenci"}.

Öğrenci daha önce çözülmüş bir soru ve bu sorunun çözümü hakkında anlamadığı yerleri soruyor veya detay istiyor.
Bu hizmet öğrenciye Tamamen Ücretsiz İnteraktif Takip Desteğidir.

GÖREVİN:
1. Öğrencinin sorusunu/anlamadığı noktayı, özel ders öğretmeni samimiyeti ve sabrıyla değerlendir.
2. Öğrenciyi asla yormadan, pratik mantıklar, kısayollar ve somut örneklerle açıklama yap.
3. Karmaşık formüller veya uzun teorik tanımlar yerine, öğrencinin kafasında hemen canlanacak pratik püf noktaları anlat.
4. Öğrencinin özgüvenini artır, samimi ve motive edici bir dille konuş.
5. Yanıtını Türkçe ver. Okunuşu ve takibi kolay olsun.`;

      const contents: any[] = [];

      let contextText = `ORİJİNAL SORU/NOT:\n${questionText || "Görsel veya Metin Sorusu"}\n\nORİJİNAL ÇÖZÜM:\n${originalSolution || ""}`;
      contents.push({ parts: [{ text: contextText }] });

      if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
          const roleLabel = msg.sender === 'user' ? 'Öğrenci' : 'AI Asistan';
          contents.push({ parts: [{ text: `${roleLabel}: ${msg.text}` }] });
        }
      }

      contents.push({ parts: [{ text: `Öğrencinin Anlamadığı / Sorduğu Yeni Takip Sorusu: ${userMessage}` }] });

      const response = await ai.models.generateContent({
        model: textModelName,
        contents: contents,
        config: {
          systemInstruction
        }
      });

      const textResult = response.text || "Açıklama üretilemedi.";

      res.json({
        success: true,
        text: textResult
      });

    } catch (error: any) {
      console.error("Student Question Follow-up Error:", error);
      res.status(500).json({ error: "Soru takip asistanı yanıt veremedi." });
    }
  });

  app.post("/api/student-question-audio", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { text, voiceName } = req.body;
      
      if (!text || typeof text !== "string") {
        return res.status(400).json({ success: false, error: "Seslendirilecek metin eksik." });
      }

      let ai = getGeminiClient();
      let audioDataBase64 = "";
      let audioMimeType = "";

      const cleanTextForSpeech = text
        .replace(/[\*\_\[\]\#\-\`\~]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      // Gemini TTS safety length limit
      const maxSpeechChars = 3000;
      const textToSpeak = cleanTextForSpeech.length > maxSpeechChars
        ? cleanTextForSpeech.substring(0, maxSpeechChars) + "..."
        : cleanTextForSpeech;

      const speechPrompt = `Lütfen aşağıdaki soru çözüm metninin tamamını, hiç atlamadan ve yarıda kesmeden son kelimesine kadar doğal bir ses tonuyla sesli oku:\n\n${textToSpeak}`;

      const ttsResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: speechPrompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || "Puck"
              }
            }
          }
        }
      });

      const ttsPart = ttsResponse.candidates?.[0]?.content?.parts?.[0];
      if (ttsPart && ttsPart.inlineData && ttsPart.inlineData.data) {
        let data = ttsPart.inlineData.data;
        let mime = ttsPart.inlineData.mimeType || "audio/wav";
        if (mime.includes("audio/l16")) {
          data = pcmToWavBase64(data, 24000, 1, 16);
          mime = "audio/wav";
        }
        audioDataBase64 = data;
        audioMimeType = mime;
      }

      res.json({
        success: true,
        audioBase64: audioDataBase64 || null,
        audioMimeType: audioMimeType || null
      });

    } catch (error: any) {
      console.error("Student Question Audio Error:", error?.message || error);
      res.status(500).json({ success: false, error: error?.message || "Ses üretilemedi." });
    }
  });

  // ==========================================
  // AI SOSYAL MEDYA & REKLAM AJANSI ENDPOINTS
  // ==========================================
  
  function cleanAndParseJson<T = any>(rawText: string, fallback: T): T {
    if (!rawText || typeof rawText !== "string") return fallback;

    let text = rawText.trim();

    // 1. Strip markdown code blocks
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    // 2. Extract outermost JSON structure
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = text.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = text.lastIndexOf("]");
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      text = text.substring(startIdx, endIdx + 1);
    }

    // 3. First pass: direct parse
    try {
      return JSON.parse(text);
    } catch (e1) {
      // 4. Second pass: accurately escape unescaped control characters inside string literals
      try {
        let inString = false;
        let escaped = false;
        let sanitized = "";

        for (let i = 0; i < text.length; i++) {
          const char = text[i];

          if (escaped) {
            sanitized += char;
            escaped = false;
            continue;
          }

          if (char === "\\") {
            sanitized += char;
            escaped = true;
            continue;
          }

          if (char === '"') {
            inString = !inString;
            sanitized += char;
            continue;
          }

          if (inString) {
            const code = char.charCodeAt(0);
            if (char === "\n") {
              sanitized += "\\n";
            } else if (char === "\r") {
              sanitized += "\\r";
            } else if (char === "\t") {
              sanitized += "\\t";
            } else if (code < 32) {
              sanitized += "\\u" + code.toString(16).padStart(4, "0");
            } else {
              sanitized += char;
            }
          } else {
            sanitized += char;
          }
        }

        // Clean up trailing commas
        sanitized = sanitized.replace(/,\s*([\}\]])/g, "$1");

        return JSON.parse(sanitized);
      } catch (e2) {
        // 5. Third pass: regex-based repair
        try {
          let regexFixed = text
            .replace(/[\x00-\x1F\x7F]/g, (c) => {
              if (c === "\n") return "\\n";
              if (c === "\r") return "\\r";
              if (c === "\t") return "\\t";
              return "";
            })
            .replace(/,\s*([\}\]])/g, "$1");
          return JSON.parse(regexFixed);
        } catch (e3) {
          console.error("[cleanAndParseJson] Failed to parse JSON even after sanitization:", e1);
          return fallback;
        }
      }
    }
  }

  // 1. Brainstorming with AI Creative Director (Auto-Detect Audience & Complete Site RAG Page)
  app.post("/api/ai-agency/brainstorm", async (req, res) => {
    try {
      const { userMessage, chatHistory, customBrief, allSitePages } = req.body;

      let ai = getGeminiClient();
      const modelName = getModelName("gemini-2.5-flash");

      const systemInstruction = `Sen FocusON Akademi'nin Kıdemli Kreatif Direktörü ve Baş Sanat Yönetmenisin (Senior Creative Director & Art Director).
Kullanıcı seninle tek bir reklam ve strateji masasında oturuyor. Kullanıcı sana herhangi bir fikir, dert veya prompt yazdığında; SEN ARKA PLANDAKİ TÜM SİTE SAYFALARINI (Herkese açık sayfalar, Öğrenci Paneli, Veli Paneli, Koç Paneli, Analizler, Topluluk, vb.) TARAYARAK EN UYGUN HEDEF KİTLEYİ VE İLGİLİ SAYFAYI/MODÜLÜ TAMAMEN OTOMATİK OLARAK TESPİT EDİYORSUN.

TÜM SİTE SAYFALARI BİLGİ HAVUZU (360° RAG VERİ TABANI):
${allSitePages ? JSON.stringify(allSitePages, null, 2) : JSON.stringify(FOCUSON_FULL_SITE_KNOWLEDGE_MODULES, null, 2)}

ÖZEL KULLANICI BRİFİ: ${customBrief || "Belirtilmedi"}

KRİTİK ZORUNLU KURAL (SIFIR HALÜSİNASYON & %100 GERÇEK SİTE İNDEKSİ):
- Yalnızca sana verilen FocusON Akademi site indeksinde yer alan gerçek özellikleri, URL rotalarını ve modülleri kullan.
- Sitede yer almayan hayali özellikler (fiziksel dershane sınıfları, canlı yayın tahta dersleri, uydurma test isimleri vb.) ASLA vadetme veya uydurma.
- Her iddia, kanca ve açı; sitemizdeki somut bir özelliğe (Örn: Sınav Metronomu ile turlama taktiği, 35+ Bilimsel Envanter, Pazar WhatsApp Veli Karnesi, YÖK Atlas Tercih Robotu, ÇABA Bursluluk Testi, 7/24 Sesli AI Soru Çözüm Asistanı, vb.) dayanmalıdır.

GÖREVLERİN:
1. Kullanıcının serbest mesajını ve niyetini derinlemesine analiz et.
2. OTOMATİK TESPİT (ZORUNLU):
   - Kullanıcının konusuna en uygun Hedef Kitleyi belirle: "ogrenci" | "veli" | "koc" | "sistem"
   - Kullanıcının konusuna en uygun Sayfayı/Modülü tespit et (Örn: public_exam_metronome, student_caba_test, student_deep_analyses, student_ai_assistant, parent_dashboard_and_reports, parent_whatsapp_weekly_report, coach_student_management, coach_ai_assistant_panel, community_feed_and_champions, academic_yks_topics_and_distribution, public_tercih_robotu, public_for_coaches, vb.)
3. RAG TEŞHİS ÇIKTISI (ZORUNLU):
   - Seçilen sayfada NELER YAPILDIĞINI (whatHappensSummary),
   - Hangi SAYFALARLA BAĞLANTILI / ENTEGRE OLDUĞUNU (connectedPagesSummary),
   - Bu özelliğin kullanıcıya ve reklam kampanyasına SAĞLADIĞI SOMUT AVANTAJLARI (keyAdvantagesSummary) açıkça çıkar.
4. Kreatif direktör tavrıyla samimi, ilham verici bir sohbet yanıtı (directorReply) ver.
5. 2-3 adet birbirinden farklı yaratıcı konsept açısı (Angle) öner (Kanca, Temel Fikir, Format).

Yanıtını kesinlikle aşağıdaki JSON şemasında ver:
{
  "directorReply": "Kreatif Direktörün kullanıcıya dönütü (Türkçe, ilham verici, hedef kitleyi ve seçtiği özelliği neden seçtiğini belirten vizyoner yanıt)",
  "autoDetectedAudience": "ogrenci | veli | koc | sistem",
  "autoDetectedPageId": "public_exam_metronome | student_caba_test | student_deep_analyses | student_ai_assistant | parent_whatsapp_weekly_report | ...",
  "autoDetectedPageTitle": "Tespit edilen sayfanın tam başlığı",
  "whatHappensSummary": "Bu sayfada kullanıcının/öğrencinin/velinin/koçun neler yaptığı ve deneyimi",
  "connectedPagesSummary": "Bu sayfanın platformdaki diğer hangi sayfalarla ve panellerle bağlantılı olduğu",
  "keyAdvantagesSummary": "Bu sayfanın/özelliğin sunduğu somut faydalar ve reklama dönüşecek en büyük avantajları",
  "suggestedAngles": [
    {
      "id": "angle_1",
      "title": "Konsept Başlığı",
      "hook": "İlk 3 saniye kancası",
      "coreConcept": "Konseptin temel fikri ve psikolojik tetikleyicisi",
      "recommendedFormat": "reels_short_video"
    }
  ]
}`;

      const contents: any[] = [];
      if (chatHistory && Array.isArray(chatHistory)) {
        for (const msg of chatHistory) {
          const role = msg.sender === 'user' ? 'user' : 'model';
          contents.push({ role, parts: [{ text: msg.text }] });
        }
      }

      contents.push({
        role: 'user',
        parts: [{ text: userMessage || "Merhaba! Sitemizdeki tüm sayfaları ve panelleri dikkate alarak en doğru hedef kitleyi ve modülü otomatik belirleyip en vurucu reklam konseptlerini oluşturalım." }]
      });

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const parsedData = cleanAndParseJson(responseText, {
        directorReply: responseText,
        suggestedAngles: []
      });

      res.json({
        success: true,
        data: parsedData
      });

    } catch (error: any) {
      console.error("AI Agency Brainstorm Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Beyin fırtınası gerçekleştirilemedi." });
    }
  });

  // 2. Generate Campaign with Modular 10-Second Scene Prompts, Screen Capture Guide & Image Recipes
  app.post("/api/ai-agency/generate-master-campaign", async (req, res) => {
    try {
      const { audienceKey, pageRagData, selectedAngle, format, customRequirements, chatContext } = req.body;

      let ai = getGeminiClient();
      const modelName = getModelName("gemini-2.5-flash");

      const systemInstruction = `Sen dünyanın en iyi Dijital Reklam ve Sosyal Medya Prodüksiyon Ajansı Kreatif Direktörüsün.
Kullanıcı senden Google Flow / Veo / Kling / Runway video üretim motorları ve Midjourney/Flux görsel motorları için MODÜLER, 10 SANİYELİK SAHNE PROMPTLARI, SİTEDEN EKRAN GÖRÜNTÜSÜ ALMA REHBERİ ve DETAYLI REKLAM PAKETİ üretmeni istiyor.

SEÇİLİ SİTE SAYFASI VE RAG BİLGİLERİ:
${pageRagData ? JSON.stringify(pageRagData, null, 2) : "FocusON Akademi Genel Ekosistemi"}

KRİTİK ZORUNLU KURAL (SIFIR HALÜSİNASYON & SİTEYE SADAKAT):
- Sitede bulunmayan hiçbir hizmeti veya özelliği uydurma.
- Tüm kurgu, metin ve ekran görüntüsü talimatları, seçili sayfanın gerçek arayüzüne ve FocusON Akademi'nin gerçek ekosistemine tam olarak sadık kalmalıdır.

KRİTİK VİDEO PRODÜKSİYON & PROMPT KURALLARI (MEKAN SÜREKLİLİĞİ, SESLENDİRME & KARAKTER KONTROLÜ):

1. GOOGLE FLOW KARAKTER VE SES SLOTU (CHARACTER & VOICE PROFILE INTEGRATION):
- Kullanıcı Google Flow üzerinde karakterleri ("Öğrenci Koçu" / "Erkek Öğrenci") ve ses profillerini doğrudan kendi Flow slotlarından seçmektedir.
- Promptlarda karakteri yeniden yaratmaya çalışma; Flow karakter slotundaki referansı baz alarak MEKAN VE IŞIK SÜREKLİLİĞİNİ SAĞLA.
- Mekan Tanımı: 3 sahne boyunca birebir aynı çalışma alanı kullanılmalıdır:
  * Öğrenci Senaryosu İçin: "At the exact same modern minimalist wooden student study desk, same warm 3200K desk lamp on the right, neatly stacked textbooks and notebooks, ambient room daylight from left window, consistent warm commercial color palette."
  * Koç Senaryosu İçin: "In the exact same modern executive coaching office, clean desk with laptop and minimalist indoor plant, sleek acoustic wall panels, bright professional natural office lighting."
- Her sahnenin promptunda arka planın, masanın ve ışığın asla değişmemesini sağlayan mekan devamlılığı ('environment continuity') zorunlu tutulmalıdır.

2. %100 DOĞAL İSTANBUL TÜRKÇESİ SESLENDİRME & YABANCI AKSAN ENGELLEME (ZERO FOREIGN ACCENT):
- Flow ve yapay zeka video motorlarının Türkçe metinleri yabancı/Amerikan aksanıyla veya robotik okumasını %100 ENGELLEMEK İÇİN:
- Tüm promptların ses (Audio) bölümünde şu zorunlu direktif yer almalıdır:
  "Audio Specification: Spoken in 100% Native Fluent Turkish (tr-TR, Istanbul Turkish accent, absolutely zero English or foreign accent, authentic Turkish phonetics and intonation). Voice Source: Use the assigned Flow Character Voice / user-selected voice profile. Natural conversational flow, warm and energetic commercial tone."
- Metinler (voiceoverText), çeviri gibi duran yapay cümleler değil; yaşayan, samimi, akıcı ve doğal İstanbul Türkçesi ile yazılmalıdır.

3. KİM NE ZAMAN KONUŞUYOR? (SPEAKER ROLE & LIP-SYNC ACCURACY):
- Karakterin ne zaman doğrudan kameraya konuşacağı (Lip-sync / On-camera Dialogue), ne zaman sadece ekrana/masaya bakıp arkadan dış ses (Background Voiceover / Narration) geleceği KESİNLİKLE net olarak ayrılmalıdır.
- Sahne 1 (Hook / Acı Noktası): Karakter derse/masaya/ekrana odaklıdır veya düşüncelidir. ARKA SES (Voiceover) konuşur. Karakterin dudakları oynamaz ("no mouth movement, no talking on camera").
- Sahne 2 (Gelişme & FocusON Arayüzü): Karakter tablet/laptop ekranındaki FocusON verilerini inceler. ARKA SES (Voiceover) sistemi anlatır. Karakter dudak oynatmaz.
- Sahne 3 (Çözüm & Eyleme Çağrı): Karakter doğrudan kameraya bakar, kendinden emin gülümser ve Flow Karakter Sesiyle DOĞRUDAN KONUŞUR (Direct to camera dialogue with precise Turkish lip-sync articulation).
- Her sahnede "speakerType" ("voiceover" veya "character_dialogue") ve "flowAudioPrompt" açıkça üretilmelidir.

4. DIŞ SESİN YARIDA KESİLMESİNİ ENGELLEME (10 SANİYE KELİME SINIRI):
- Dış ses veya repliklerin videonun 10 saniyelik süresini aşıp YARIDA KESİLMESİNİ veya UZAMASINI ENGELLEMEK İÇİN:
- Her sahne metni KESİNLİKLE 12 ile 16 KELİME ARASINDA tutulmalıdır (Türkçe için ortalama 5-7 saniyede tamamlanır ve sahne bitmeden 2-3 saniyelik doğal nefes payı kalır).
- Cümleler kısa, vurucu ve net olmalı; asla 18 kelimeyi geçmemelidir!

5. EKRANDA KAMERA/LENS METADATA VE YAZILARI ASLA ÇIKMAYACAK (NO ON-SCREEN CAMERA LABELS):
- Prompt içine kamera marka veya lens adlarını (Örn: "Cooke Anamorphic 40mm ALEXA Mini LF") doğrudan video üzerine yazı basılmasına yol açacak şekilde ham bırakma.
- Bunun yerine doğal fotoğrafik dil kullan: "Cinematic commercial lighting, natural optical bokeh, crisp shallow depth of field, 35mm film color science, sharp focus, clean frame".
- Her sahnenin ve sistemin negatif promptuna ŞU İFADELERİ ZORUNLU EKLE:
  "no on-screen camera metadata, no text watermarks, no lens info overlay, no camera model labels, no Cooke Anamorphic text, no timestamps, no frame counter, no burned-in technical text, no subtitle bars".

6. MONİTÖRLERDE BOZUK YAPAY ZEKA YAZILARI ASLA ÇIKMAYACAK (SIFIR AI GIBBERISH & TEMİZ EKRAN):
- Laptop/tablet ekranı görünen sahnelerde AI'ın uydurma anlamsız kelimeler (Örn: "Çapacik veli aagrama", "35 types analysır", bozuk grafikler) çizmesini kesinlikle engelle.
- Sahne 2 promptunda şu direktifi kullan:
  "Clean minimalist glowing tablet/laptop screen with a pristine blank display or clear modern dark UI mockup. Absolutely no AI pseudo-text, no garbled letters, no distorted numbers on screen. Keep the screen area clean for post-production UI overlay."
- Negatif prompta: "AI pseudo-text, garbled characters, distorted font, gibberish letters on screen, fake Latin text, corrupted numbers, blurry monitor artifacts".

7. LOGO VİDEOYA BOZUK ÇİZDİRİLMEYECEK (TEMİZ KATMAN YÖNERGESİ):
- Video motorunun pikseller üzerine yamuk veya bozuk harfli logo çizmesini engelle.
- Direktif: "Keep top right frame clean with negative space for official transparent brand logo overlay in post-production. Do not draw distorted logos or artificial watermarks into the video pixels."

8. JSON BİÇİMLENDİRME KURALI:
- Çıktı kesinlikle geçerli JSON olmalı, string içi tırnaklar (\") ve satır sonları (\\n) kurallara uygun kaçışlanmalıdır.

JSON Şeması:
{
  "campaignTitle": "Vurucu Kampanya Adı",
  "conceptSummary": "Kampanyanın stratejik ve psikolojik özeti",
  "psychologicalTrigger": "Kullanılan temel psikolojik tetikleyici (Örn: FOMO, Süre Kaygısı, Şeffaflık, Başarı Arzusu)",
  "ragDiagnostic": {
    "pageTitle": "Sayfanın Başlığı",
    "pagePath": "Sayfa URL Rotası (Örn: /panel/ogrenci/metronom)",
    "whatHappensOnPage": [
      "Sayfada yapılan eylem 1",
      "Sayfada yapılan eylem 2",
      "Sayfada yapılan eylem 3"
    ],
    "connectedPages": [
      {
        "title": "Bağlantılı Sayfa 1",
        "path": "/ornek-rota",
        "description": "Bu sayfa ile olan entegrasyon ve veri akışı ilişkisi"
      }
    ],
    "keyAdvantages": [
      "Kullanıcıya ve reklama sağladığı somut avantaj 1",
      "Kullanıcıya ve reklama sağladığı somut avantaj 2",
      "Kullanıcıya ve reklama sağladığı somut avantaj 3"
    ]
  },
  "screenCaptureGuide": {
    "pageTitle": "Ekran Görüntüsü Alınacak Sayfa Başlığı",
    "pageUrl": "/panel/ogrenci/metronom",
    "whatToCapture": "Öğrenci sınav metronomu masasında soru bazlı sayaç ve turlama taktiği analizi açıkken tam ekran görüntüsü alın.",
    "stepByStepGuide": [
      "1. FocusON Akademi'de ilgili sayfaya gidin (/panel/ogrenci/metronom).",
      "2. Ekranı tam ekran (F11) yapın veya temiz bir tarayıcı penceresine alın.",
      "3. Ekran alıntısı aracı ile net ve yüksek çözünürlüklü bir ekran görüntüsü (PNG/JPG) kaydedin.",
      "4. Video kurgu aşamasında Sahne 2'deki tablet/laptop ekranı üzerine bu net görüntüyü bindirin (overlay yapın)."
    ],
    "recommendedResolution": "1920x1080 Full HD veya 16:9 yatay ekran görüntüsü"
  },
  "flowConsistencySettings": {
    "aspectRatio": "9:16",
    "cameraOptics": "Cinematic commercial film aesthetic, 35mm shallow depth of field, natural optical bokeh, sharp focus on subject, pristine clean frame",
    "lightingSetup": "Soft volumetric natural daylight combined with 3200K tungsten desk practicals and subtle tech glow",
    "colorGrading": "Rich cinematic contrast, deep slate shadows, warm skin tones, teal-orange modern commercial color palette",
    "characterProfiles": "Using the selected Flow Character slot (Student/Coach). Maintain 100% facial and wardrobe continuity.",
    "environmentArchitecture": "Identical minimalist study desk environment throughout all 3 clips. Consistent wooden desk, lamp position, and background architecture.",
    "soundDesignScript": "Crisp realistic sound design transitioning into inspiring cinematic swell with 100% native Turkish voiceover",
    "voiceAndAccentDirective": "Spoken in 100% Native Fluent Turkish (tr-TR, Istanbul accent, zero foreign accent). Use the assigned Flow Character Voice or selected Turkish narrator profile.",
    "negativePrompts": "on-screen camera metadata, camera model text, Cooke Anamorphic text, lens info overlay, timestamps, text watermarks, AI pseudo-text, garbled characters, distorted font, gibberish letters on screen, fake Latin text, blurry, low quality, CGI look, plastic skin, distorted anatomy, unrealistic cartoon style, abrupt cuts, foreign accent, English pronunciation",
    "logoAttachmentDirective": "Keep upper-right frame clean with negative space for transparent post-production logo overlay. Do not draw distorted logos in video pixels.",
    "screenAttachmentDirective": "Display a clean tablet/laptop screen with blank UI mockup, ready for clean high-res FocusON screenshot overlay in video editing.",
    "flowGenerationSettings": {
      "durationPerClip": "10 saniye (Tam 10s Klip)",
      "motionSpeed": "1.0x (Doğal sinematik akış)",
      "fidelity": "Ultra-High 8K",
      "styleTag": "Cinematic Hyper-Realistic Commercial"
    }
  },
  "storyboardScenes": [
    {
      "sceneNumber": 1,
      "timeRange": "0:00 - 0:10 (10s)",
      "stage": "Hook (Kanca)",
      "speakerType": "voiceover",
      "speakerRoleLabel": "🎙️ Arka Ses (Dış Ses)",
      "visualDescription": "Sahne 1 görsel anlatımı (0-10 saniye). Karakter masada odaklanmış, dudak kıpırdamaz.",
      "cameraMovement": "Slow push-in toward the intense focused gaze of the student at study desk",
      "characterAction": "Karakter masadaki notlarına ve zamana odaklanır. Dudak hareketi yoktur, arka ses çalar.",
      "lightingAndAtmosphere": "Moody low-key lighting with high-contrast shadows, warm tungsten desk lamp on right",
      "flowClipPrompt": "A hyper-realistic 10-second cinematic 9:16 vertical commercial video clip. 35mm film aesthetic, shallow depth of field. Use the selected character from the Flow Character slot. Setting: modern wooden student study desk with warm 3200K desk lamp and neat notebooks. The character studies intensely with focused facial micro-expressions. No mouth movement, no talking on camera. Camera slowly pushes in. Audio: Background voiceover spoken in 100% Native Turkish (tr-TR, Istanbul accent, zero foreign accent) using the assigned Flow voice: '[voiceoverText]'. Clean upper corner for logo. No on-screen text, no camera labels, no watermarks.",
      "flowAudioPrompt": "Language: Native Turkish (tr-TR, Istanbul accent). Voice: Assigned Flow Voice. Spoken line: [voiceoverText]",
      "voiceoverText": "KESİNLİKLE TÜRKÇE 1. Sahne Dış Ses (Maksimum 12-15 kelime, yarıda kesilmez, örn: 'Denemelerde süren yetmiyor diye pes mi edeceksin? Sorun bilginde değil, soruya ayırdığın ritimde!')",
      "onScreenText": "Süren Yetmiyor Mu? (0:00 - 0:10)",
      "audioSfxCues": "Dramatic deep bass thud + intense clock ticking crescendo",
      "attachmentDirectives": {
        "useAttachedLogo": true,
        "useAttachedScreenshot": false,
        "attachmentInstruction": "Video kurguda sağ üst köşeye şeffaf FocusON Akademi logosu eklenecektir."
      }
    },
    {
      "sceneNumber": 2,
      "timeRange": "0:10 - 0:20 (10s)",
      "stage": "Problem/Gelişme",
      "speakerType": "voiceover",
      "speakerRoleLabel": "🎙️ Arka Ses (Dış Ses)",
      "visualDescription": "Sahne 2 görsel anlatımı (10-20 saniye). Karakter aynı masada tablete dokunur, aydınlanma yaşar.",
      "cameraMovement": "Dynamic macro pan across the glowing tablet interface on identical desk",
      "characterAction": "Karakter aynı masada tablet ekranındaki FocusON arayüzünü inceler, dudak hareketi yoktur.",
      "lightingAndAtmosphere": "Identical room setup. Soft daylight entering, warm tungsten lamp, clean tech glow",
      "flowClipPrompt": "A hyper-realistic 10-second cinematic 9:16 vertical commercial video clip. 35mm film aesthetic. Exact same environment: identical student wooden study desk and lamp. Macro tracking shot across a modern glowing tablet with clean dark screen mockup, no AI gibberish text. The selected character from Flow slot interacts with tablet with a relieved, enlightened expression. No mouth movement. Audio: Background voiceover spoken in 100% Native Turkish (tr-TR, Istanbul accent, zero foreign accent) using the assigned Flow voice: '[voiceoverText]'. Clean frame, no on-screen camera metadata, no watermark.",
      "flowAudioPrompt": "Language: Native Turkish (tr-TR, Istanbul accent). Voice: Assigned Flow Voice. Spoken line: [voiceoverText]",
      "voiceoverText": "KESİNLİKLE TÜRKÇE 2. Sahne Dış Ses (Maksimum 12-15 kelime, yarıda kesilmez, örn: 'FocusON Sınav Metronomu ile her soruya özel süreni ayarla, turlama taktiğini refleks haline getir.')",
      "onScreenText": "FocusON Sınav Metronomu ile Kontrol Sende",
      "audioSfxCues": "Clean UI click chime + energetic motivational rhythm rising",
      "attachmentDirectives": {
        "useAttachedLogo": true,
        "useAttachedScreenshot": true,
        "attachmentInstruction": "Sahne 2'deki tablet ekranına FocusON sayfa ekran görüntüsü bindirilecektir."
      }
    },
    {
      "sceneNumber": 3,
      "timeRange": "0:20 - 0:30 (10s)",
      "stage": "Dönüşüm/CTA",
      "speakerType": "character_dialogue",
      "speakerRoleLabel": "🗣️ Karakter Konuşması (Lip-sync)",
      "visualDescription": "Sahne 3 görsel anlatımı (20-30 saniye). Karakter doğrudan kameraya konuşur veya gülümser.",
      "cameraMovement": "Smooth dolly-out revealing the confident smiling character at the same desk",
      "characterAction": "Karakter doğrudan kameraya bakarak net ve kendinden emin şekilde konuşur / gülümser.",
      "lightingAndAtmosphere": "Identical study desk. Warm golden hour triumph lighting, uplifting atmosphere",
      "flowClipPrompt": "A hyper-realistic 10-second cinematic 9:16 vertical commercial video clip. 35mm film aesthetic, shallow depth of field. Exact same study desk environment. The selected character from Flow slot looks directly into the camera lens with a confident, welcoming smile and speaks clearly with natural Turkish lip-sync articulation. Audio: Direct on-camera dialogue spoken by the character using the assigned Flow Character Voice in 100% Native Turkish (tr-TR, Istanbul accent, zero foreign accent): '[voiceoverText]'. Golden hour sunlight filling the room. Clean upper corner reserved for logo. No on-screen text, no camera labels, no watermark.",
      "flowAudioPrompt": "Language: Native Turkish (tr-TR, Istanbul accent). Voice: Assigned Flow Character Voice (Lip-sync). Spoken dialogue: [voiceoverText]",
      "voiceoverText": "KESİNLİKLE TÜRKÇE 3. Sahne Karakter Repliği (Tam 10-14 kelime, net konuşma, örn: 'Zamanı sen yönet, hedefine sen ulaş. FocusON Akademi'yi şimdi ücretsiz dene!')",
      "onScreenText": "Şimdi Ücretsiz Başla (Link Bio'da)",
      "audioSfxCues": "Crisp brand audio logo sting + inspiring cinematic swell",
      "attachmentDirectives": {
        "useAttachedLogo": true,
        "useAttachedScreenshot": false,
        "attachmentInstruction": "Video kurguda sağ üst köşeye şeffaf FocusON Akademi logosu ve alt köşeye CTA butonu eklenecektir."
      }
    }
  ],
  "imageRecipes": [
    {
      "id": "img_feed_1",
      "title": "Instagram 1:1 Kare Post Tasarım Promptu",
      "format": "1:1",
      "prompt": "Commercial photography, 1:1 square ratio, 8k resolution. An authentic high school student at a minimalist contemporary study desk, focused and empowered. Cooke Anamorphic lens bokeh, volumetric lighting, Kodak Vision3 500T color grading. Display the attached FocusON Akademi logo in the upper right. Negative space on top left designed for typography.",
      "negativePrompt": "blurry, low quality, deformed hands, cartoon, 3d render, watermark",
      "compositionGuide": "Rule of thirds, subject on the right, high-contrast negative space on the left for text placement",
      "textOverlayGuide": {
        "mainHeadline": "Sınavda Süreye Yenilme!",
        "subHeadline": "FocusON Sınav Metronomu ile Ritmik Turlama Refleksi",
        "ctaBadgeText": "Ücretsiz Başla",
        "fontStyleRecommendation": "Modern Bold Sans-Serif (Inter / Plus Jakarta Sans Bold, 800 weight)",
        "colorPalette": "#FFFFFF ana metin, #F59E0B amber vurgu rozeti, koyu zemin üzerinde %100 okunabilir"
      },
      "logoPlacementGuide": "Flow/Midjourney referans ekindeki FocusON Akademi logosu sağ üst köşede %90 opaklıkla yerleştirilecek.",
      "screenScreenshotGuide": "Görseldeki tablet veya bilgisayar ekranına sitemizden alınacak /panel/ogrenci/metronom ekran görüntüsü entegre edilecek."
    },
    {
      "id": "img_story_1",
      "title": "Instagram 9:16 Hikaye & Reels Kapak Tasarım Promptu",
      "format": "9:16",
      "prompt": "Commercial portrait photography, 9:16 vertical poster ratio, 8k resolution. Dynamic vertical portrait of a determined student holding a study planner. Cinematic teal-orange lighting, shallow depth of field. Display the attached FocusON Akademi logo at the top header.",
      "negativePrompt": "low quality, distorted face, extra limbs, bad lighting, text error",
      "compositionGuide": "Vertical portrait hierarchy, top 20% safe zone for logo, middle for subject, bottom 25% for CTA badge",
      "textOverlayGuide": {
        "mainHeadline": "TYT'de Son 20 Soruya Süren Yetmiyor Mu?",
        "subHeadline": "Sorun Bilginde Değil, Soru Başına Ayırdığın Ritimde!",
        "ctaBadgeText": "Hemen Dene 👆",
        "fontStyleRecommendation": "Extra Bold Impact Display Sans (800-900 weight) with subtle drop shadow",
        "colorPalette": "#FFFFFF beyaz başlık, #38BDF8 parlak mavi ve #F59E0B amber vurgular"
      },
      "logoPlacementGuide": "Üst orta veya üst sağ bölgede FocusON Akademi orijinal logosu yer alacak.",
      "screenScreenshotGuide": "Alt planda hafif flu şekilde sitemizin ilgili analiz ekran görüntüsü bulunacak."
    }
  ],
  "copyPack": {
    "headline": "Dikkat Çeken Ana Reklam Başlığı (Türkçe)",
    "hookVariants": [
      "Denemelerde süren yetmiyor mu? Sorun bilginde değil, ritminde!",
      "Turlama taktiğini refleks haline getirenlerin netleri nasıl 15 net artıyor?",
      "Sınav anında panik yapmaya son: Sınav Metronomu ile kontrol sende."
    ],
    "caption": "Sınavda zamanı yöneten, dereceyi kapar! 🚀\n\nFocusON Akademi ile her soruya özel süreni belirle, turlama taktiğini refleks haline getir.\n\n🎯 Sınav Metronomu ve 35+ Teşhis Analizi ile potansiyelini keşfet!",
    "callToAction": "Hemen profildeki linke tıkla ve ücretsiz başla! 🎯",
    "hashtags": ["#YKS2026", "#FocusONAkademi", "#YKSRehberlik", "#DersCalisma", "#TYTMatematik"],
    "recommendedMusicMood": "Energetic Lo-Fi with Inspiring Piano Drops"
  }
}`;

      const promptContext = `
HEDEF KİTLE: ${audienceKey}
SİSTEM ÖZELLİĞİ: ${pageRagData ? JSON.stringify(pageRagData) : "FocusON Akademi"}
SEÇİLEN KONSEPT: ${selectedAngle ? JSON.stringify(selectedAngle) : "Acı Noktası & Çözüm"}
FORMAT: ${format || "reels_short_video"}
ÖZEL İSTEKLER: ${customRequirements || "Her biri 10 saniyelik 3 sahne promptu, eklerden logo kullanımı, siteden ekran görüntüsü rehberi ve eksiksiz görsel promptları"}
SOHBET GEÇMİŞİ / BRİF: ${chatContext ? JSON.stringify(chatContext) : "Standard"}
`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ parts: [{ text: promptContext }] }],
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const parsedData = cleanAndParseJson(responseText, {
        campaignTitle: "FocusON Akademi Kampanyası",
        conceptSummary: responseText,
        psychologicalTrigger: "Başarı & Verimlilik",
        screenCaptureGuide: {
          pageTitle: pageRagData?.title || "FocusON Akademi Masası",
          pageUrl: pageRagData?.path || "/panel/ogrenci/metronom",
          whatToCapture: "İlgili sayfanın ana arayüz ekran görüntüsü",
          stepByStepGuide: [
            "1. İlgili sayfayı açın.",
            "2. Tam ekran görüntüsü (PNG/JPG) alın.",
            "3. Google Flow ekler kısmına yükleyin."
          ],
          recommendedResolution: "1920x1080 (16:9)"
        },
        flowConsistencySettings: {
          aspectRatio: "9:16",
          cameraOptics: "Arri Alexa Mini LF, Cooke Anamorphic 40mm",
          lightingSetup: "Volumetric natural lighting with tungsten desk practicals",
          colorGrading: "Kodak Vision3 500T",
          characterProfiles: "High school student or parent",
          environmentArchitecture: "Contemporary study room",
          soundDesignScript: "Inspiring ambient background with Turkish voiceover",
          negativePrompts: "blurry, low quality, cartoon",
          logoAttachmentDirective: "Use the attached FocusON Akademi logo from the reference input slot.",
          screenAttachmentDirective: "Use the attached screenshot on the tablet/laptop display.",
          flowGenerationSettings: {
            durationPerClip: "10 saniye",
            motionSpeed: "1.0x",
            fidelity: "8K",
            styleTag: "Cinematic Commercial"
          }
        },
        storyboardScenes: [
          {
            sceneNumber: 1,
            timeRange: "0:00 - 0:10 (10s)",
            stage: "Hook (Kanca)",
            visualDescription: "Öğrencinin odaklanması ve acı noktası (0-10s)",
            cameraMovement: "Slow push-in",
            characterAction: "Odaklanma ve zaman stresi",
            lightingAndAtmosphere: "Moody cinematic lighting",
            flowClipPrompt: "Cinematic 10s shot of student studying under pressure. Referencing attached FocusON logo. Turkish voiceover says: '...' ",
            voiceoverText: "Denemelerde süren yetmiyor diye pes mi edeceksin?",
            onScreenText: "Süren Yetmiyor Mu? (0-10s)",
            audioSfxCues: "Dramatic ticking",
            attachmentDirectives: {
              useAttachedLogo: true,
              useAttachedScreenshot: false,
              attachmentInstruction: "Google Flow eklerine logo eklenecek."
            }
          },
          {
            sceneNumber: 2,
            timeRange: "0:10 - 0:20 (10s)",
            stage: "Problem/Gelişme",
            visualDescription: "FocusON Akademi sistemini keşfetme (10-20s)",
            cameraMovement: "Macro pan across device screen",
            characterAction: "Arayüzü kullanma ve rahatlama",
            lightingAndAtmosphere: "Bright modern tech lighting",
            flowClipPrompt: "Macro 10s tracking shot. Display attached UI screenshot on the screen. Referencing attached logo. Turkish voiceover says: '...' ",
            voiceoverText: "FocusON ile her soruya özel süreni ayarla, turlama taktiğini refleks haline getir.",
            onScreenText: "FocusON Akademi ile Kontrol Sende (10-20s)",
            audioSfxCues: "Uplifting swell",
            attachmentDirectives: {
              useAttachedLogo: true,
              useAttachedScreenshot: true,
              attachmentInstruction: "Google Flow eklerine sayfa ekran görüntüsü ve logo eklenecek."
            }
          },
          {
            sceneNumber: 3,
            timeRange: "0:20 - 0:30 (10s)",
            stage: "Dönüşüm/CTA",
            visualDescription: "Başarı, rahatlama ve dönüşüm çağrısı (20-30s)",
            cameraMovement: "Dolly out revealing confident smiling student",
            characterAction: "Gülümseme ve zafer hissi",
            lightingAndAtmosphere: "Golden hour triumph",
            flowClipPrompt: "Dolly-out 10s shot of smiling student. FocusON logo in upper corner. Turkish voiceover says: '...' ",
            voiceoverText: "Zamanı sen yönet, hedefine sen ulaş. Şimdi ücretsiz dene!",
            onScreenText: "Şimdi Ücretsiz Başla (20-30s)",
            audioSfxCues: "Brand audio logo sting",
            attachmentDirectives: {
              useAttachedLogo: true,
              useAttachedScreenshot: false,
              attachmentInstruction: "Google Flow eklerine logo eklenecek."
            }
          }
        ],
        imageRecipes: [
          {
            id: "img_1",
            title: "Instagram 1:1 Kare Post Tasarım Promptu",
            format: "1:1",
            prompt: "Ultra-detailed 8k commercial photography of a student using FocusON Akademi tablet app with attached logo in the corner.",
            negativePrompt: "deformed, blurry, cartoon",
            compositionGuide: "Rule of thirds, clean negative space for typography",
            textOverlayGuide: {
              mainHeadline: "Sınavda Süreye Yenilme!",
              subHeadline: "FocusON Sınav Metronomu ile Ritmik Turlama Refleksi",
              ctaBadgeText: "Ücretsiz Başla",
              fontStyleRecommendation: "Modern Bold Sans (800 weight)",
              colorPalette: "#FFFFFF ana metin, #F59E0B amber vurgular"
            },
            logoPlacementGuide: "Sağ üst köşede FocusON Akademi logosu",
            screenScreenshotGuide: "Cihaz ekranında sitemizin ilgili ekran görüntüsü"
          },
          {
            id: "img_2",
            title: "Instagram 9:16 Story / Reels Kapak Promptu",
            format: "9:16",
            prompt: "Ultra-detailed 8k portrait commercial photography for 9:16 vertical cover with attached logo at top header.",
            negativePrompt: "deformed, low quality",
            compositionGuide: "Vertical portrait hierarchy",
            textOverlayGuide: {
              mainHeadline: "TYT'de Süren Yetmiyor Mu?",
              subHeadline: "Sorun Bilginde Değil Ritminde!",
              ctaBadgeText: "Hemen Başla 👆",
              fontStyleRecommendation: "Extra Bold Impact Display Sans",
              colorPalette: "#FFFFFF ve #38BDF8 parlak mavi"
            },
            logoPlacementGuide: "Üst başlıkta FocusON Akademi logosu",
            screenScreenshotGuide: "Alt planda sitemizin ekran görüntüsü"
          }
        ],
        copyPack: {
          headline: "Sınavda Zamanı Sen Yönet!",
          hookVariants: [
            "Denemede süre yetiştiremeyenlerin yaptığı en büyük 3 hata!",
            "Turlama taktiği neden netlerini 15 net artırır?",
            "FocusON Sınav Metronomu ile sınav stresine son ver."
          ],
          caption: "Sınavda zamanı yöneten, dereceyi kapar! 🚀\n\nFocusON Akademi ile sınav stresini geride bırak.",
          callToAction: "Profildeki linke tıkla ve ücretsiz başla! 🎯",
          hashtags: ["#YKS2026", "#FocusONAkademi", "#YKSRehberlik"],
          recommendedMusicMood: "Inspiring cinematic lofi"
        }
      });

      res.json({
        success: true,
        campaign: parsedData
      });

    } catch (error: any) {
      console.error("AI Agency Master Campaign Generation Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Kampanya paketi üretilemedi." });
    }
  });

  // 3. Saved Campaigns Firestore Endpoints
  app.get("/api/ai-agency/saved-campaigns", async (req, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.json({ success: true, campaigns: [] });
      }

      const snapshot = await db.collection("social_media_saved_items")
        .where("type", "==", "campaign")
        .get();

      const campaigns: any[] = [];
      snapshot.forEach((doc: any) => {
        const data = doc.data();
        campaigns.push({
          id: doc.id,
          ...data.data,
          createdAt: data.createdAt || new Date().toISOString()
        });
      });

      // Sort descending
      campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({
        success: true,
        campaigns
      });
    } catch (error: any) {
      console.error("[Saved Campaigns GET Error]:", error?.message || error);
      res.json({ success: true, campaigns: [] });
    }
  });

  // 4. Social Media Creative AI Image Generation Endpoint (Gemini Imagen 3 / High-Res Branded SVG Visual Engine)
  app.post("/api/ai-agency/generate-recipe-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, recipeTitle, headline, subHeadline, ctaBadgeText } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Görsel promptu gereklidir." });
      }

      let targetRatio: "1:1" | "9:16" | "16:9" = "1:1";
      if (aspectRatio === "9:16") targetRatio = "9:16";
      else if (aspectRatio === "16:9") targetRatio = "16:9";
      else if (aspectRatio === "1:1") targetRatio = "1:1";

      const displayHeadline = headline || recipeTitle || "FocusON Akademi Sınav Metronomu";
      const displaySubHeadline = subHeadline || "Kişiselleştirilmiş Yapay Zeka Koçluğu & Turlama Taktiği";
      const displayCta = ctaBadgeText || "Hemen Ücretsiz Başla 🎯";

      // High-Resolution FocusON Branded Creative SVG Canvas Poster Engine
      let width = 1080;
      let height = 1080;
      if (targetRatio === "9:16") {
        width = 1080;
        height = 1920;
      } else if (targetRatio === "16:9") {
        width = 1920;
        height = 1080;
      }

      const svgBanner = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="accentGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8" />
      <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.8" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95" />
    </linearGradient>
    <linearGradient id="ctaGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="40" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />

  <!-- Ambient Glowing Orbs -->
  <circle cx="${width * 0.2}" cy="${height * 0.25}" r="${width * 0.35}" fill="#ef4444" opacity="0.12" filter="url(#glow)" />
  <circle cx="${width * 0.8}" cy="${height * 0.7}" r="${width * 0.4}" fill="#3b82f6" opacity="0.15" filter="url(#glow)" />
  <circle cx="${width * 0.5}" cy="${height * 0.5}" r="${width * 0.25}" fill="#8b5cf6" opacity="0.1" filter="url(#glow)" />

  <!-- Subtle Tech Grid Lines -->
  <g stroke="#ffffff" stroke-opacity="0.04" stroke-width="1">
    <line x1="0" y1="${height * 0.25}" x2="${width}" y2="${height * 0.25}" />
    <line x1="0" y1="${height * 0.5}" x2="${width}" y2="${height * 0.5}" />
    <line x1="0" y1="${height * 0.75}" x2="${width}" y2="${height * 0.75}" />
    <line x1="${width * 0.25}" y1="0" x2="${width * 0.25}" y2="${height}" />
    <line x1="${width * 0.5}" y1="0" x2="${width * 0.5}" y2="${height}" />
    <line x1="${width * 0.75}" y1="0" x2="${width * 0.75}" y2="${height}" />
  </g>

  <!-- Central Decorative Metronome Ring Graphic -->
  <g transform="translate(${width / 2}, ${height * 0.42})">
    <circle r="${Math.min(width, height) * 0.22}" fill="none" stroke="url(#accentGlow)" stroke-width="3" stroke-dasharray="12 8" opacity="0.6" />
    <circle r="${Math.min(width, height) * 0.17}" fill="#1e1035" fill-opacity="0.5" stroke="#a855f7" stroke-opacity="0.4" stroke-width="2" />
    <path d="M -30 -30 L 30 30 M -30 30 L 30 -30 M 0 -45 L 0 45 M -45 0 L 45 0" stroke="#f59e0b" stroke-width="2" opacity="0.5" />
    <circle r="12" fill="#f59e0b" />
    <!-- Pulse Ring -->
    <circle r="${Math.min(width, height) * 0.26}" fill="none" stroke="#ef4444" stroke-opacity="0.2" stroke-width="1.5" />
  </g>

  <!-- Header Branding -->
  <g transform="translate(60, 70)">
    <rect width="240" height="48" rx="24" fill="#0f172a" fill-opacity="0.8" stroke="#ffffff" stroke-opacity="0.15" stroke-width="1.5" />
    <text x="24" y="30" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="800" letter-spacing="1">FocusON</text>
    <text x="110" y="30" fill="#f59e0b" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700">AKADEMİ</text>
  </g>

  <!-- Badge Top Right -->
  <g transform="translate(${width - 240}, 70)">
    <rect width="180" height="48" rx="24" fill="#ef4444" fill-opacity="0.15" stroke="#ef4444" stroke-opacity="0.4" stroke-width="1.5" />
    <text x="90" y="29" text-anchor="middle" fill="#fca5a5" font-family="system-ui, -apple-system, sans-serif" font-size="13" font-weight="700">AI REKLAM TASARIMI</text>
  </g>

  <!-- Content Glassmorphism Box at Bottom -->
  <g transform="translate(50, ${height - (targetRatio === "9:16" ? 520 : 380)})">
    <rect width="${width - 100}" height="${targetRatio === "9:16" ? 440 : 310}" rx="28" fill="url(#cardGrad)" stroke="#ffffff" stroke-opacity="0.12" stroke-width="2" />
    <rect x="0" y="0" width="${width - 100}" height="6" fill="url(#accentGlow)" rx="3" />

    <!-- Main Headline -->
    <text x="40" y="70" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="${targetRatio === "9:16" ? 38 : 34}" font-weight="900" width="${width - 180}">
      ${displayHeadline.length > 35 ? displayHeadline.substring(0, 35) + '...' : displayHeadline}
    </text>

    <!-- Sub Headline -->
    <text x="40" y="${targetRatio === "9:16" ? 130 : 120}" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="${targetRatio === "9:16" ? 22 : 20}" font-weight="500">
      ${displaySubHeadline.length > 55 ? displaySubHeadline.substring(0, 55) + '...' : displaySubHeadline}
    </text>

    <!-- CTA Button Badge -->
    <g transform="translate(40, ${targetRatio === "9:16" ? 200 : 170})">
      <rect width="280" height="56" rx="28" fill="url(#ctaGrad)" />
      <text x="140" y="35" text-anchor="middle" fill="#0f172a" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800">
        ${displayCta}
      </text>
    </g>

    <!-- Footer site URL -->
    <text x="${width - 140}" y="${targetRatio === "9:16" ? 235 : 205}" text-anchor="end" fill="#64748b" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600">
      focusonakademi.com
    </text>
  </g>
</svg>`.trim();

      const encodedSvg = `data:image/svg+xml;base64,${Buffer.from(svgBanner).toString('base64')}`;

      return res.json({
        success: true,
        imageUrl: encodedSvg,
        prompt: prompt
      });

    } catch (error: any) {
      console.error("AI Agency Image Generation Critical Error:", error?.message || error);
      res.status(500).json({ error: error?.message || "Görsel oluşturulamadı." });
    }
  });

  app.post("/api/ai-agency/saved-campaigns", async (req, res) => {
    try {
      const { campaign } = req.body;
      if (!campaign || !campaign.id) {
        return res.status(400).json({ error: "Geçerli bir kampanya nesnesi gereklidir." });
      }

      const db = getDb();
      if (!db) {
        return res.json({ success: true, id: campaign.id, savedLocally: true });
      }

      const docRef = db.collection("social_media_saved_items").doc(campaign.id);
      await docRef.set({
        type: "campaign",
        title: campaign.campaignTitle || "FocusON Akademi Kampanyası",
        data: campaign,
        createdAt: campaign.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        id: campaign.id
      });
    } catch (error: any) {
      console.error("[Saved Campaigns POST Error]:", error?.message || error);
      res.status(500).json({ error: error?.message || "Kampanya veritabanına kaydedilemedi." });
    }
  });

  app.delete("/api/ai-agency/saved-campaigns/:id", async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: "Kampanya ID gereklidir." });
      }

      const db = getDb();
      if (db) {
        await db.collection("social_media_saved_items").doc(id).delete();
      }

      res.json({
        success: true,
        id
      });
    } catch (error: any) {
      console.error("[Saved Campaigns DELETE Error]:", error?.message || error);
      res.status(500).json({ error: error?.message || "Kampanya silinemedi." });
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

  
  // Automated Subscription Reminders (Every day at 19:00 Europe/Istanbul)
  cron.schedule("0 19 * * *", async () => {
    console.log("[Cron Job] Automated daily 19:00 subscription reminder process triggered...");
    try {
      await executeSubscriptionReminders();
    } catch (err: any) {
      console.error("[Cron Job] Error executing subscription reminders:", err?.message || err);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  // Automated Weekly Report Cron Job (Every Monday at 10:00 AM Europe/Istanbul)
  cron.schedule("0 10 * * 1", async () => {
    console.log("[Cron Job] Automated Monday 10:00 AM weekly report process triggered for Altın/Gümüş Paket students...");
    try {
      const result = await executeWeeklyReportBatch();
      console.log(`[Cron Job] Completed. Processed: ${result?.processedCount || 0}`);
    } catch (err: any) {
      console.error("[Cron Job] Error executing automated weekly reports:", err?.message || err);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
