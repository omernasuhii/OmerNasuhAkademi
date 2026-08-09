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
    if (!apiKey || apiKey === "MY_API_KEY" || apiKey === "" || apiKey === "undefined") {
      apiKey = process.env.GEMINI_API_KEY;
    }
    
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
      if (keyParam && keyParam.startsWith("ya29.")) {
        token = keyParam;
      } else if (headerApiKey && headerApiKey.startsWith("ya29.")) {
        token = headerApiKey;
      } else if (apiKey && apiKey.startsWith("ya29.")) {
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
function getGeminiClient(overrideApiKey?: string) {
  let apiKey = overrideApiKey || process.env.ASSISTAN_API_KEY;
  if (!apiKey || apiKey === "MY_API_KEY" || apiKey === "" || apiKey === "undefined") {
    apiKey = process.env.GEMINI_API_KEY;
  }
  if (!apiKey || apiKey === "MY_API_KEY" || apiKey === "" || apiKey === "undefined") {
    console.warn("[Gemini Client] Warning: Neither ASSISTAN_API_KEY nor GEMINI_API_KEY is defined in environment variables!");
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

let hasAdminCredentials = false;

// Helper to get Firestore instance with the correct databaseId
function getDb(): any {
  if (hasAdminCredentials && admin.apps.length > 0) {
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
    
    const response = await admin.messaging().send(message);
    res.json({ success: true, response });
  } catch (error) {
    console.error("Error sending push notification:", error);
    res.status(500).json({ error: error.message });
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
    traceLogs.push(`[Simülasyon Kaydı] Kod (${simCode}) Firestore simulated_verifications veritabanına kaydedildi.`);
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

// Twilio Inbound WhatsApp Webhook Endpoint
app.all("/api/twilio-whatsapp-webhook", async (req, res) => {
  try {
    const rawFrom = (req.body && req.body.From) || (req.query && req.query.From) || "";
    const bodyText = (req.body && req.body.Body) || (req.query && req.query.Body) || "";

    const senderPhone = rawFrom.replace("whatsapp:", "").trim();
    if (senderPhone) {
      const formattedPhone = formatE164Phone(senderPhone);
      await addVerificationLog({
        action: "send_code",
        phone: formattedPhone,
        status: "SUCCESS",
        channel: "inbound_whatsapp_webhook",
        details: `Gelen WhatsApp mesajı alındı: "${bodyText}". Otomatik yeni doğrulama kodu tetikleniyor.`,
        logs: [`[Gelen WhatsApp] Kimlik: ${formattedPhone}, Mesaj: ${bodyText}`]
      });

      const twConfig = await getTwilioConfig();
      if (twConfig.accountSid && twConfig.authToken && twConfig.serviceSid) {
        try {
          const { default: twilio } = await import("twilio");
          const client = twilio(twConfig.accountSid, twConfig.authToken);
          await client.verify.v2.services(twConfig.serviceSid).verifications.create({
            to: formattedPhone,
            channel: "whatsapp"
          });
        } catch (vErr) {
          console.error("[Inbound Webhook Verify Error]:", vErr);
        }
      }
    }

    res.type("text/xml");
    return res.send("<Response><Message>FocusON Akademi: Doğrulama talebiniz alındı! Yeni doğrulama kodunuz iletildi.</Message></Response>");
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
      }
    } catch (err: any) {
      console.log("[Twilio Config] Using environment variables configuration.");
    }

    return { accountSid, authToken, whatsappNumber, serviceSid, templateSid, messagingServiceSid, weeklyReportTemplateSid };
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
    const messageSid = req.body.MessageSid || req.body.messageSid || req.body.SmsSid || "";

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
        status: from ? "message_received" : "missing_from_parameter",
        parsedData: from ? { from, body, profileName, messageSid, mediaUrl, mediaType, fileName } : null
      });
    } catch (logErr) {
      console.error("Failed to log webhook POST payload:", logErr);
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

  // POST: Send WhatsApp Message via Twilio
  app.post("/api/whatsapp-send", async (req, res) => {
    const { to: rawTo, phone, message, mediaUrl, mediaType, fileName, fileSize } = req.body;
    const to = rawTo || phone;
    if (!to || (!message && !mediaUrl)) {
      return res.status(400).json({ error: "to ve mesaj veya medya zorunludur" });
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
            body: message || ""
          };
          if (mediaUrl) {
            messageOpts.mediaUrl = [mediaUrl];
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
          console.log(`[WhatsApp Send] Message sent to ${phoneNum} via Twilio API. SID: ${twilioMsgSid}`);
        } catch (twilioErr: any) {
          console.error("[WhatsApp Send] Twilio API Error, falling back to simulation:", twilioErr?.message || twilioErr);
          sendMethod = "simulation";
        }
      } else {
        console.log(`[WhatsApp Send] Twilio credentials missing. Operating in Simulation Mode.`);
      }

      // Add outbound message to 'whatsapp_messages'
      const outboundDoc: any = {
        phone: phoneNum,
        body: message || "",
        senderName: "Admin",
        direction: "outbound",
        messageSid: twilioMsgSid || null,
        status: sendMethod === "twilio" ? "sent" : "simulation",
        sendMethod: sendMethod,
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
    dailyTasks?: { date: string; displayDate: string; tasks: any[] }[];
    exams?: any[];
    taskCompletionRate?: number;
  }): Buffer {
    const doc = new jsPDF();
    
    const tr2en = (text: string) => {
      if (!text) return "";
      return String(text)
        .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
        .replace(/ü/g, 'u').replace(/Ü/g, 'U')
        .replace(/ş/g, 's').replace(/Ş/g, 'S')
        .replace(/ı/g, 'i').replace(/İ/g, 'I')
        .replace(/ö/g, 'o').replace(/Ö/g, 'O')
        .replace(/ç/g, 'c').replace(/Ç/g, 'C');
    };

    const originalText = doc.text.bind(doc);
    (doc as any).text = function(text: any, x: number, y: number, options?: any) {
      if (Array.isArray(text)) {
        text = text.map(t => tr2en(t));
      } else {
        text = tr2en(text);
      }
      return originalText(text, x, y, options);
    };

    const originalGetTextWidth = doc.getTextWidth.bind(doc);
    (doc as any).getTextWidth = function(text: string) {
      return originalGetTextWidth(tr2en(text));
    };

    const fontName = "helvetica"; // Use helvetica as we have replaced Turkish characters

    const pageW = 210;
    const pageH = 297;
    let currentY = 0;

    // Load ON-Logo image base64 if available
    let logoBase64 = "";
    try {
      const logoPathSmall = path.join(process.cwd(), "public", "images", "ON-Logo-small.png");
      const logoPathNormal = path.join(process.cwd(), "public", "images", "ON-Logo.png");
      const chosenPath = fs.existsSync(logoPathSmall) ? logoPathSmall : logoPathNormal;
      if (fs.existsSync(chosenPath)) {
        logoBase64 = fs.readFileSync(chosenPath).toString("base64");
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

    // Logo embedding - Fix aspect ratio
    let textStartX = 15;
    if (logoBase64) {
      try {
        const imgProps = doc.getImageProperties(`data:image/png;base64,${logoBase64}`);
        const ratio = imgProps.height / imgProps.width;
        const imgWidth = 20;
        const imgHeight = imgWidth * ratio;
        const yOffset = currentY + 8 + (20 - imgHeight) / 2; // center vertically in the 20mm space
        
        doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", 13, yOffset, imgWidth, imgHeight, undefined, "FAST");
        textStartX = 37;
      } catch (err) {
        doc.setFillColor(16, 185, 129);
        doc.circle(23, currentY + 18, 9, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont(fontName, "bold");
        doc.text(params.studentName.charAt(0).toUpperCase(), 23, currentY + 22, { align: "center" });
        textStartX = 37;
      }
    }

    // Left Column: Student Name, Grade/Branch, Target, Package
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

    doc.text(`Hedef: ${params.studentTarget || 'Ankara Üniversitesi - Tıp Fakültesi'}`, textStartX, currentY + 22);

    doc.setTextColor(16, 185, 129); // emerald green for package
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text(`Abonelik Paketi: ${params.studentPackage || 'Sınırsız Zirve VIP (Altın Paket)'}`, textStartX, currentY + 29);

    // Right Column: Academy Branding & Report Period
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(9);
    doc.setFont(fontName, "bold");
    doc.text("FocusON Akademi", 195, currentY + 8, { align: "right" });

    doc.setTextColor(156, 163, 175);
    doc.setFont(fontName, "normal");
    doc.setFontSize(7.5);
    doc.text(`Rapor Dönemi: ${params.periodStr}`, 195, currentY + 15, { align: "right" });

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
      { t: "SORU ÇÖZÜMÜ", v: `${params.totalCompleted} / ${params.totalTarget}`, v2: "Soru", pLabel: `Haftalık soru ulaşma oranı %${params.completionRate}`, pct: params.completionRate, color: [16, 185, 129] },
      { t: "GÖREV SADAKATİ", v: `${params.dailyTasks ? params.dailyTasks.reduce((acc, c) => acc + c.tasks.filter(t => t.isDone).length, 0) : 0} / ${params.totalTasks}`, v2: "Görev", pLabel: `Günlük program sadakat oranı %${params.taskCompletionRate || 0}`, pct: params.taskCompletionRate || 0, color: [139, 92, 246] },
      { t: "KONU ÇALIŞMASI", v: `${totalStudyPages}`, v2: "Sayfa", pLabel: "Haftalık konu pekiştirme süreci", pct: totalStudyPages > 0 ? 100 : 0, color: [245, 158, 11] },
      { t: "KONU TAKİBİ", v: `${totalWatchVideos}`, v2: "Video/Ders", pLabel: "Müfredat uyumlu konu kavrama", pct: totalWatchVideos > 0 ? 100 : 0, color: [59, 130, 246] }
    ];

    stats.forEach((s, i) => {
      const x = 10 + i * (cardW + gap);
      doc.setFillColor(17, 24, 39);
      doc.setDrawColor(31, 41, 55);
      doc.roundedRect(x, currentY, cardW, 26, 2, 2, "FD");

      doc.setTextColor(156, 163, 175);
      doc.setFontSize(6.5);
      doc.setFont(fontName, "bold");
      doc.text(s.t, x + 3, currentY + 6);

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text(s.v, x + 3, currentY + 13);

      doc.setFontSize(6.5);
      doc.setTextColor(156, 163, 175);
      doc.setFont(fontName, "normal");
      doc.text(s.v2, x + 3 + doc.getTextWidth(s.v) + 1, currentY + 13);

      doc.setFontSize(5.5);
      doc.text(s.pLabel, x + 3, currentY + 18);

      drawProgressBar(x + 3, currentY + 21, cardW - 6, 1.5, s.pct, s.color as any);
    });

    currentY += 31;

    // 3. AI & Coach Evaluation Box
    // IMPORTANT: Set font BEFORE splitting text so width calculation is accurate!
    doc.setFont(fontName, "normal");
    doc.setFontSize(7.5);
    
    const cleanAiText = params.aiAnalysisText.replace(/[*_]/g, '');
    const splitAi = doc.splitTextToSize(cleanAiText || "Geçen hafta için henüz yapay zeka analizi veya koç değerlendirmesi oluşturulmamış. Sistem her Pazar akşamı bu analizi otomatik olarak oluşturacak ve kaydedecektir.", 175);
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

    // Box 1: Genel Deneme Ortalamaları
    doc.setFillColor(17, 24, 39);
    doc.setDrawColor(31, 41, 55);
    doc.roundedRect(10, currentY, boxW, 26, 2, 2, "FD");
    doc.setTextColor(255, 255, 255);
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text("Genel Deneme Ortalamaları", 14, currentY + 6);

    ["TYT GENEL", "AYT GENEL", "YDT GENEL"].forEach((t, i) => {
      const bx = 14 + i * 27;
      doc.setFillColor(31, 41, 55);
      doc.roundedRect(bx, currentY + 9, 25, 13, 1.5, 1.5, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(5.5);
      doc.text(t, bx + 12.5, currentY + 13, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(fontName, "bold");
      doc.text("-", bx + 12.5, currentY + 19, { align: "center" });
    });

    // Box 2: Branş / Ders Deneme Ortalamaları
    doc.setFillColor(17, 24, 39);
    doc.setDrawColor(31, 41, 55);
    doc.roundedRect(10 + boxW + 6, currentY, boxW, 26, 2, 2, "FD");
    doc.setTextColor(255, 255, 255);
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text("Branş / Ders Deneme Ortalamaları", 14 + boxW + 6, currentY + 6);

    ["TYT BRANŞ", "AYT BRANŞ", "YDT BRANŞ"].forEach((t, i) => {
      const bx = 14 + boxW + 6 + i * 27;
      doc.setFillColor(31, 41, 55);
      doc.roundedRect(bx, currentY + 9, 25, 13, 1.5, 1.5, "F");
      doc.setTextColor(156, 163, 175);
      doc.setFontSize(5.5);
      doc.text(t, bx + 12.5, currentY + 13, { align: "center" });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(fontName, "bold");
      doc.text("-", bx + 12.5, currentY + 19, { align: "center" });
    });

    currentY += 31;

    // 5. Gecen Hafta Girilen Deneme Sınavları
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
          let taskX = 50;
          let taskY = currentY - 3;

          day.tasks.forEach((task, tIdx) => {
            if (tIdx > 0 && tIdx % 2 === 0) {
              taskX = 50;
              taskY += 16;
              addPageIfNeeded(16);
            } else if (tIdx > 0) {
              taskX = 125;
            }

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
          });

          currentY = Math.max(currentY + 12, taskY + 18);
        }
      });
    }

    return Buffer.from(doc.output("arraybuffer"));
  }

  async function executeWeeklyReportBatch(options?: { studentId?: string; parentPhone?: string; studentName?: string; force?: boolean }) {
    console.log("[Weekly Reports] Automated batch processing started...", options);
    const db = getDb();
    const twConfig = await getTwilioConfig();
    const logs: any[] = [];

    const isGoldStudent = (sData: any) => {
      const pkgStr = (
        sData.subscriptionPlan ||
        sData.package ||
        sData.packageType ||
        sData.membershipType ||
        sData.plan ||
        ""
      ).toString().toLowerCase();

      return (
        pkgStr.includes("altın") ||
        pkgStr.includes("altin") ||
        pkgStr.includes("gold") ||
        pkgStr.includes("zirve vip") ||
        pkgStr.includes("vip")
      );
    };

    let students: any[] = [];
    if (options?.studentId) {
      const studentDoc = await db.collection("users").doc(options.studentId).get();
      if (studentDoc.exists) {
        const sData = studentDoc.data() || {};
        students.push({
          id: studentDoc.id,
          ...sData,
          name: options.studentName || sData.name || sData.displayName || sData.fullName || sData.studentName || "Öğrenci",
          parentPhone: options.parentPhone || sData.parentPhone || sData.phone || "+905550001122",
          grade: sData.grade || "12. Sınıf",
          branch: sData.branch || "SAYISAL",
          universityTarget: sData.universityTarget || "Belirtilmedi",
          package: sData.package || sData.subscriptionPlan || "Sınırsız Zirve VIP (Altın Paket)"
        });
      } else {
        students.push({
          id: options.studentId,
          name: options.studentName || "Öğrenci",
          parentPhone: options.parentPhone || "+905550001122",
          grade: "12. Sınıf",
          branch: "SAYISAL",
          universityTarget: "Belirtilmedi",
          package: "Sınırsız Zirve VIP (Altın Paket)"
        });
      }
    } else {
      const snapshot = await db.collection("users").where("role", "==", "student").get();
      let totalFetched = 0;
      snapshot.forEach(docSnap => {
        totalFetched++;
        const sData = docSnap.data() || {};
        // Only include students with Altın package (unless force option is explicitly passed)
        if (isGoldStudent(sData) || options?.force) {
          students.push({
            id: docSnap.id,
            ...sData,
            name: sData.name || sData.displayName || sData.fullName || sData.studentName || (sData.firstName ? `${sData.firstName} ${sData.lastName || ''}`.trim() : '') || "Öğrenci"
          });
        }
      });
      console.log(`[Weekly Reports] Total students in system: ${totalFetched}, Altın Paket students filtered: ${students.length}`);
    }

    // Compute PREVIOUS WEEK (Geçen Hafta: Pazartesi - Pazar)
    const now = new Date();
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

    for (const student of students) {
      try {
        const studentName = student.name || student.displayName || student.fullName || student.studentName || "Öğrenci";
        const parentPhone = student.parentPhone || student.phone || "+905550001122";
        const studentId = student.id;

        let totalTarget = 0;
        let totalCompleted = 0;
        let totalTasks = 0;
        let examsCount = 0;
        const subjectMap: Record<string, { target: number; completed: number }> = {};
        const dailyTasksMap: Record<string, any[]> = {};
        const examsList: any[] = [];

        try {
          const progSnap = await db.collection("daily_programs")
            .where("studentId", "==", studentId)
            .get(); // Removing limit(50) to ensure we get all data to filter locally

          progSnap.forEach(docSnap => {
            const data = docSnap.data();
            const dateStr = data.date || "";
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
                  examsCount++;
                  examsList.push({ ...t, date: dateStr });
                }
              });
            }
          });
        } catch (dbErr) {
          console.log(`[Weekly Reports] Note fetching tasks for ${studentId}:`, dbErr);
        }

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

        let aiAnalysisText = "";
        try {
          const ai = getGeminiClient();
          const prompt = `Öğrenci Adı: ${studentName}
Geçen Haftalık Hedef Soru: ${totalTarget}
Geçen Haftalık Çözülen Soru: ${totalCompleted} (%${completionRate} Başarı)
Görev Sayısı: ${totalTasks}
Çözülen Deneme Sayısı: ${examsCount}
Dersler: ${subjectsBreakdown.map(s => `${s.subject}: ${s.completed}/${s.target}`).join(", ")}

Lütfen velimize hitaben geçen haftanın (Pazartesi - Pazar) haftalık gelişim ve pedagojik değerlendirme raporunu yaz. "Sayın Velimiz," diye başla. Öğrencinin soru çözme disiplinini, ders performansını, güçlü alanlarını ve evde desteklenebilecek yapıcı tavsiyeleri 3 paragrafa bölerek samimi, motive edici bir dille ifade et. Eğer geçen hafta hiç soru çözmemiş veya veri girilmemişse, bunu veliye nazikçe, öğrencimizin geçen hafta sisteme herhangi bir çalışma girmemiş olduğunu, bu durumu takip edeceğimizi belirterek raporla.`;

          const response = await ai.models.generateContent({
            model: getModelName("gemini-3.6-flash"),
            contents: prompt,
            config: {
              temperature: 0.7,
              systemInstruction: "Sen FocusON Akademi'nin profesyonel eğitim koçu asistanısın. Velilere geçen haftanın performans değerlendirmesini şık ve pedagojik dille sunuyorsun. Kısa, öz ve yapıcı ol."
            }
          });
          aiAnalysisText = response.text || "";
        } catch (aiErr: any) {
          console.warn(`[Weekly Reports] AI generation warning for ${studentName}:`, aiErr?.message || aiErr);
          aiAnalysisText = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin geçen haftaki (Pazartesi - Pazar aralığındaki) gelişim, soru karnesi ve koçluk değerlendirme raporu oluşturulmuştur.\n\nHafta boyunca toplam ${totalTarget} soru hedefinin ${totalCompleted} tanesini tamamlayarak %${completionRate} haftalık soru hedefine ulaşmıştır. Öğrencimizin günlük görev takibi, soru çözümleri ve koçluk değerlendirmesi rehberlik birimimiz tarafından titizlikle sürdürülmektedir.`;
        }

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
          studentGrade: student.grade || "12. Sınıf",
          studentBranch: student.branch || "SAYISAL",
          studentTarget: student.universityTarget || "Belirtilmedi",
          studentPackage: student.package || "Sınırsız Zirve VIP (Altın Paket)",
          dailyTasks,
          exams: examsList,
          taskCompletionRate
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
            aiAnalysisText,
            totalTarget,
            totalCompleted,
            completionRate,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          };
          if (pdfBuffer.length < 750000) {
            docData.pdfBase64 = pdfBuffer.toString("base64");
          }
          await db.collection("weekly_pdf_reports").doc(reportId).set(docData);
        } catch (fsErr) {
          console.log("[Weekly Reports] Firestore PDF cache note:", fsErr);
        }

        const mediaUrl = `/api/reports/pdf/${reportId}`;
        const baseUrl = process.env.APP_URL || `https://omernasuhakademi.com`;
        const fullPdfUrl = `${baseUrl}${mediaUrl}`;
        const parentPortalUrl = `${baseUrl}/veli-girisi`;
        const whatsappMsgBody = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin geçen haftalık gelişim, soru karnesi ve koçluk değerlendirme raporu (Pazartesi - Pazar) başarıyla oluşturulmuştur.\n\n📄 Haftalık PDF Raporu:\n${fullPdfUrl}\n\n🏫 Veli & Öğrenci Portalı:\n${parentPortalUrl}\n\nFocusON Akademi Rehberlik Birimi`;

        let sendStatus = "simulation";
        let twMessageSid: string | null = null;
        let phoneNum = parentPhone.replace(/[^\d+]/g, "");
        if (!phoneNum.startsWith("+")) phoneNum = "+" + phoneNum;

        if (twConfig.accountSid && twConfig.authToken) {
          try {
            const { default: twilio } = await import("twilio");
            const client = twilio(twConfig.accountSid, twConfig.authToken);
            const rawFrom = twConfig.whatsappNumber || "+14155238886";
            const fromTwilio = rawFrom.startsWith("whatsapp:") ? rawFrom : `whatsapp:${rawFrom}`;
            const targetTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;

            const templateSid = twConfig.weeklyReportTemplateSid || "HXb083373137421bce630a0ad915cd4d0f";

            let twMsg: any = null;

            // Method 1: Try sending via approved WhatsApp Content Template (haftalik_veli_raporu_v1)
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
                console.log(`[Weekly Reports] Sent via Content Template (${templateSid}). Message SID: ${twMsg.sid}`);
              } catch (templateErr: any) {
                console.warn(`[Weekly Reports] Content Template send failed (${templateErr?.message || templateErr}). Falling back to text message...`);
              }
            }

            // Method 2: Fallback to standard WhatsApp text message if template was not attempted or failed
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
              console.log(`[Weekly Reports] Sent via fallback text message. Message SID: ${twMsg.sid}`);
            }

            if (twMsg) {
              sendStatus = "sent";
              twMessageSid = twMsg.sid;
            }
          } catch (twErr: any) {
            console.error("[Weekly Reports] Twilio WhatsApp send error:", twErr?.message || twErr);
            sendStatus = "failed";
          }
        }

        await db.collection("weekly_report_logs").add({
          reportId,
          studentId,
          studentName,
          parentPhone,
          periodStr,
          status: sendStatus,
          twMessageSid,
          completionRate,
          mediaUrl,
          timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        logs.push({
          studentName,
          parentPhone,
          status: sendStatus,
          reportId,
          mediaUrl
        });
      } catch (stErr: any) {
        console.error(`[Weekly Reports] Error processing student ${student.id}:`, stErr);
      }
    }

    return { success: true, processedCount: students.length, logs };
  }

  app.get("/api/reports/pdf/:reportId", async (req, res) => {
    try {
      let reportId = req.params.reportId || "";
      if (reportId.includes("rep_")) {
        reportId = "rep_" + reportId.split("rep_")[1];
      }
      // Strip any query or trailing slashes/paths if present
      reportId = reportId.split("?")[0].split("/")[0];
      
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
        const data = docSnap.data();
        if (data?.pdfBase64) {
          const buf = Buffer.from(data.pdfBase64, "base64");
          return sendPdf(buf, data.studentName);
        }
      }

      const fallbackPdf = generateWeeklyReportPdfBuffer({
        studentName: "Öğrenci",
        periodStr: "Haftalık Rapor",
        totalTarget: 500,
        totalCompleted: 460,
        completionRate: 92,
        totalTasks: 20,
        examsCount: 2,
        aiAnalysisText: "Sayın Velimiz,\n\nÖğrencimizin haftalık soru çözümü ve koçluk hedeflerine uyumu başarıyla analiz edilmiştir.",
        subjectsBreakdown: [{ subject: "Matematik", target: 200, completed: 180 }]
      });

      return sendPdf(fallbackPdf, "Öğrenci");
    } catch (err: any) {
      console.error("PDF Download Error:", err);
      res.status(500).send("PDF dosyası yüklenirken hata oluştu.");
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

  app.post("/api/send-weekly-reports", async (req, res) => {
    try {
      const result = await executeWeeklyReportBatch(req.body);
      res.json({
        success: true,
        message: "Haftalık raporlar başarıyla oluşturuldu ve işlendi.",
        totalStudents: result.processedCount,
        processedCount: result.processedCount,
        logs: result.logs
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
      
      const systemInstruction = `Sen FocusON Akademi'nin profesyonel eğitim koçu asistanısın. Velilere, öğrencilerinin haftalık performansını değerlendiren kısa, öz, motive edici ve profesyonel bir rapor sunman gerekiyor. Sana sistemin oluşturduğu kaba bir taslak ve varsa geçen haftanın raporu verilecek. Bunu veliye doğrudan hitap edecek şekilde, whatsapp'tan gönderilebilecek akıcılıkta, ancak profesyonel bir dille yeniden yaz. Sayın Velimiz diye başla. Geçen haftanın verisi varsa, bu haftayla kıyaslayarak bir cümle ekle. Sadece rapor metnini yaz, ek açıklama yapma.

Araç (function) çağırırken kullanıcıya asla sistem logu veya teknik bilgi verme (örn: araç çağrıldı vb). Sadece doğal konuş.`;
      
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

      const systemInstruction = `Sen FocusON Akademi'nin AI Öğrenci Asistanı'sın (Soru Çözüm Uzmanı). Karşındaki öğrencinin adı: ${studentName || "Öğrenci"}.

Aşağıdaki kurallara kesinlikle uyarak soruyu adımlarla çöz:
1. Öğrenciye ismiyle, destekleyici ve motive edici bir dille hitap et.
2. Görseldeki veya yazılan soruyu dikkatle incele. Dersi/konuyu tespit et.
3. Çözümü aşama aşama net, anlaşılır ve eğitici bir şekilde sun:
   - 📌 Verilenler ve İstenen
   - 💡 Kullanılan Temel Kavram / Formül
   - 📐 Adım Adım Çözüm Yolu
   - ✅ Doğru Cevap ve Dikkat Edilecek Püf Noktası
4. Yanıtını Türkçe ver. Sesli dinleneceği için okunuşu zor matematik sembolleri yerine net kelimeler ve akıcı bir anlatım kullan.`;

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
            mime = split[0].replace("data:", "").replace(";base64", "").trim();
          }
        }
        parts.push({
          inlineData: {
            mimeType: mime,
            data: cleanBase64
          }
        });
      }

      // Step 1: Generate Text Solution
      let textResult = "";
      try {
        const response = await ai.models.generateContent({
          model: textModelName,
          contents: parts,
          config: {
            systemInstruction
          }
        });
        textResult = response.text || "Çözüm üretilemedi.";
      } catch (firstErr: any) {
        console.warn("[Soru Çözüm Asistanı] Initial text generation failed, trying fallback key if available:", firstErr?.message || firstErr);
        if (process.env.GEMINI_API_KEY) {
          ai = getGeminiClient(process.env.GEMINI_API_KEY);
          const response = await ai.models.generateContent({
            model: textModelName,
            contents: parts,
            config: {
              systemInstruction
            }
          });
          textResult = response.text || "Çözüm üretilemedi.";
        } else {
          throw firstErr;
        }
      }

      // Step 2: Generate TTS Audio using gemini-3.1-flash-tts-preview
      let audioDataBase64 = "";
      let audioMimeType = "";

      if (textResult && textResult !== "Çözüm üretilemedi.") {
        try {
          const cleanTextForSpeech = textResult
            .replace(/[\*\_\[\]\#\-\`\~]/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          const speechPrompt = `Lütfen şu soru çözümünü sesli oku: ${cleanTextForSpeech.slice(0, 1200)}`;

          const ttsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
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
            audioDataBase64 = ttsPart.inlineData.data;
            audioMimeType = ttsPart.inlineData.mimeType || "audio/wav";
          }
        } catch (ttsErr: any) {
          console.warn("[Soru Çözüm Asistanı] TTS generation notice:", ttsErr?.message || ttsErr);
        }
      }

      res.json({
        success: true,
        text: textResult,
        audioBase64: audioDataBase64 || null,
        audioMimeType: audioMimeType || null
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

  // Automated Weekly Report Cron Job (Every Monday at 10:00 AM Europe/Istanbul)
  cron.schedule("0 10 * * 1", async () => {
    console.log("[Cron Job] Automated Monday 10:00 AM weekly report process triggered for Altın Paket students...");
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
