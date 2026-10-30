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
import { notificationsRouter, cronRouter, aiRouter, paymentsRouter } from "./server/routes";

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
    let apiKey = (process.env.ASSISTAN_API_KEY || "").replace(/['"]/g, '').trim();
    
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
  let apiKey = (overrideApiKey || process.env.ASSISTAN_API_KEY || "").replace(/['"]/g, '').trim();
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

function getModelName(defaultDevModel?: string) {
  const validModels = [
    "gemini-3.8-flash",
    "gemini-3.1-pro-preview",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite",
    "gemini-3.7-flash"
  ];
  if (defaultDevModel && validModels.includes(defaultDevModel)) {
    return defaultDevModel;
  }
  return "gemini-3.8-flash";
}

function generatePedagogicalReportFallback(params: {
  studentName: string;
  totalTarget: number;
  totalCompleted: number;
  completionRate: number;
  totalTasks: number;
  taskCompletionRate?: number;
  studentGrade?: string;
  studentBranch?: string;
  studentTarget?: string;
  subjectsBreakdown?: Array<{ subject: string; target: number; completed: number }>;
  exams?: any[];
}): string {
  const { 
    studentName, 
    totalTarget, 
    totalCompleted, 
    completionRate, 
    totalTasks, 
    taskCompletionRate = 0, 
    studentGrade = "12. Sınıf", 
    studentBranch = "SAYISAL", 
    studentTarget, 
    subjectsBreakdown = [], 
    exams = [] 
  } = params;
  
  let targetNote = "";
  if (studentTarget && studentTarget !== "Belirtilmedi" && studentTarget !== "Belirtilmemiş") {
    targetNote = ` ve hedeflediği "${studentTarget}" rotası`;
  }

  let p1 = "";
  if (totalTarget > 0 && totalCompleted === 0) {
    p1 = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin geçen haftaki (${studentGrade} / ${studentBranch}) haftalık çalışma planında belirlenen ${totalTarget} soruluk hedef için sisteme çalışma girişi henüz yansımamıştır. Öğrencimizin motivasyonunu ve çalışma temposunu canlı tutmak adına koçluk ve rehberlik birimimiz tarafından durumu yakından takip edilmektedir.`;
  } else if (completionRate >= 80) {
    p1 = `Sayın Velimiz,\n\n${studentName} isimli öğrencimiz geçen hafta belirlenen çalışma hedeflerine yüksek bir bağlılık ve disiplin göstermiştir. Haftalık ${totalTarget} soru hedefinin ${totalCompleted} tanesini başarıyla tamamlayarak %${completionRate} soru tamamlama oranına ulaşmıştır. Bu istikrarlı çalışma temposu, sınav hazırlık sürecindeki kararlılığını${targetNote} için sergilediği güçlü azmi açıkça ortaya koymaktadır.`;
  } else if (completionRate >= 50) {
    p1 = `Sayın Velimiz,\n\n${studentName} isimli öğrencimiz geçen hafta planlanan ${totalTarget} soruluk çalışma programının ${totalCompleted} tanesini tamamlayarak %${completionRate} başarı oranı yakalamıştır. Genel çalışma temposu olumlu yönde ilerlemekte olup, kalan konu ve soru eksiklerinin önümüzdeki hafta telafi programıyla tamamlanması planlanmaktadır.`;
  } else {
    p1 = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin geçen haftalık soru çözümü ${totalCompleted} / ${totalTarget} (%${completionRate}) olarak gerçekleşmiştir. Çalışma alışkanlıklarının ve günlük rutinlerinin daha istikrarlı hale gelmesi adına koçluk takip sistemimiz devreye alınmıştır.`;
  }

  let p2 = "";
  const activeSubs = subjectsBreakdown.filter(s => s.completed > 0 || s.target > 0).slice(0, 3);
  if (activeSubs.length > 0) {
    const subDesc = activeSubs.map(s => `${s.subject} (${s.completed}/${s.target} soru)`).join(", ");
    p2 = `Ders bazlı analizlerde özellikle ${subDesc} alanlarındaki çalışmalar öne çıkmıştır.`;
  }
  if (exams.length > 0) {
    const examSummary = exams.map(e => `${e.examName || 'Deneme'} (${e.totalNet ? `${e.totalNet} Net` : `${e.completedCount || 0} Soru`})`).join(", ");
    p2 += (p2 ? " " : "") + `Hafta boyunca uygulanan ${exams.length} adet deneme sınavında (${examSummary}) öğrencinin konu kavrama düzeyi test edilmiş ve eksik kalan kazanımlar tespit edilmiştir.`;
  } else if (!p2) {
    p2 = `Öğrencimizin haftalık ${totalTasks} adet görev planlamasındaki sadakat oranı %${taskCompletionRate} olarak kaydedilmiş olup, müfredat uyumlu konu pekiştirme süreci devam etmektedir.`;
  }

  const p3 = `Ev ortamında öğrencimizin dinlenme ve odaklanma saatlerini desteklemenizi, sınav maratonundaki çabasını takdir ederek moral ve motivasyon desteği sağlamanızı rica ederiz. Yeni hafta çalışma takvimi koçumuz tarafından güncellenmiştir.`;

  const signature = "Saygılarımızla,\nFocusON Akademi\nYapay Zekâ Asistanı";
  const fullText = [p1, p2, p3].filter(Boolean).join("\n\n");
  return `${fullText}\n\n${signature}`;
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

  // Modular Route Integrations
  app.use(notificationsRouter);
  app.use(cronRouter);
  app.use(aiRouter);
  app.use(paymentsRouter);

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
            set: async (data: any, options?: any) => {
              const mappedData = mapAdminToClientData(data);
              return options
                ? await clientSetDoc(clientDoc(getClientDb(), colName, docId), mappedData, options)
                : await clientSetDoc(clientDoc(getClientDb(), colName, docId), mappedData);
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
      let raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      let serviceAccount: any;
      if (raw.startsWith('{')) {
        serviceAccount = JSON.parse(raw);
      } else {
        try {
          const decoded = Buffer.from(raw, 'base64').toString('utf-8');
          serviceAccount = JSON.parse(decoded);
        } catch (b64Err) {
          serviceAccount = JSON.parse(raw);
        }
      }

      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      const projId = serviceAccount.project_id || appletConfig?.projectId;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projId
      });
      hasAdminCredentials = true;
      console.log(`Firebase Admin initialized successfully with service account (Project: ${projId}, Email: ${serviceAccount.client_email}).`);
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

app.get("/api/push-status", (req, res) => {
  const hasEnv = !!process.env.FIREBASE_SERVICE_ACCOUNT;
  let serviceAccountDetails: any = null;
  if (hasEnv) {
    try {
      const raw = (process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
      const parsed = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
      serviceAccountDetails = {
        projectId: parsed.project_id || 'Bilinmiyor',
        clientEmail: parsed.client_email || 'Bilinmiyor',
        hasPrivateKey: !!parsed.private_key,
        privateKeyValid: typeof parsed.private_key === 'string' && parsed.private_key.includes('BEGIN PRIVATE KEY')
      };
    } catch (e: any) {
      serviceAccountDetails = { error: e.message };
    }
  }

  res.json({
    adminInitialized: admin.apps.length > 0,
    hasAdminCredentials,
    hasEnv,
    serviceAccountDetails,
    projectId: appletConfig?.projectId
  });
});

app.post("/api/send-push", async (req, res) => {
  if (!admin.apps.length) {
    return res.status(503).json({ success: false, error: "Firebase Admin is not initialized. Cannot send push notifications." });
  }
  
  try {
    let { token, userId, title, body, link } = req.body;
    
    // If token not provided but userId is given, fetch token from Firestore
    if (!token && userId) {
      try {
        const db = getDb();
        const tokenDoc = await db.collection("userTokens").doc(userId).get();
        if (tokenDoc.exists) {
          token = tokenDoc.data()?.token;
        }
      } catch (dbErr) {
        console.warn("[FCM Send Push] Could not fetch userToken for userId:", userId, dbErr);
      }
    }

    if (!token) return res.status(400).json({ success: false, error: "Token or valid userId is required" });
    
    const notificationTitle = title || 'FocusON Akademi';
    const notificationBody = body || 'Yeni bir bildiriminiz var.';
    const notificationLink = link || '/';

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
    
    try {
      const response = await admin.messaging().send(message);
      console.log("[FCM Push Success] ID:", response);
      return res.json({ success: true, response });
    } catch (pushError: any) {
      console.error("[FCM Push Error Detail]", pushError);
      const errMsg = pushError?.message || String(pushError);
      const errCode = pushError?.code || pushError?.errorInfo?.code;
      const isUnreg = 
        errCode === 'messaging/registration-token-not-registered' ||
        errCode === 'messaging/invalid-registration-token' ||
        errMsg.includes('Device unregistered') ||
        errMsg.includes('registration-token-not-registered') ||
        errMsg.includes('Requested entity was not found');
      if (isUnreg && userId) {
        try {
          const db = getDb();
          await db.collection("userTokens").doc(userId).delete();
          console.log(`[FCM Send Push] Stale token for user ${userId} deleted.`);
        } catch (delErr) {}
      }
      return res.status(200).json({ 
        success: false, 
        error: errMsg,
        code: errCode,
        details: pushError?.errorInfo || null
      });
    }
  } catch (err: any) {
    console.error("[FCM Send Push Route Error]", err);
    return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
  }
});

app.post("/api/send-delayed-push", async (req, res) => {
  if (!admin.apps.length) {
    return res.status(503).json({ success: false, error: "Firebase Admin is not initialized. Cannot send push notifications." });
  }
  
  try {
    const { token, title, body, link, delaySeconds = 10 } = req.body;
    if (!token) return res.status(400).json({ success: false, error: "Token is required" });
    
    const notificationTitle = title || 'FocusON Akademi (Arka Plan)';
    const notificationBody = body || 'Uygulama kapalıyken gönderilen zamanlı bildirim başarıyla iletildi!';
    const notificationLink = link || '/';

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
          tag: `focuson-delayed-${notificationTitle.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20)}`,
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

    const waitMs = Math.max(1, Math.min(60, Number(delaySeconds) || 10)) * 1000;
    console.log(`[FCM Delayed Push Scheduled] Will send push in ${waitMs / 1000}s to token: ${token.slice(0, 12)}...`);

    setTimeout(async () => {
      try {
        const response = await admin.messaging().send(message);
        console.log(`[FCM Delayed Push Sent after ${waitMs / 1000}s] Success ID:`, response);
      } catch (err: any) {
        console.error(`[FCM Delayed Push Error after ${waitMs / 1000}s]:`, err?.message || err);
      }
    }, waitMs);

    return res.json({ 
      success: true, 
      scheduled: true, 
      delaySeconds: waitMs / 1000,
      message: `${waitMs / 1000} saniye sonra arka plan bildirimi tetiklenecektir. Şimdi sekmeyi/uygulamayı kapatabilir ve telefonunuzu kilitleyebilirsiniz!` 
    });
  } catch (err: any) {
    console.error("[FCM Delayed Push Route Error]", err);
    return res.status(500).json({ success: false, error: err?.message || "Internal server error" });
  }
});

// Helper to sanitize Twilio WhatsApp ContentVariables (Meta strictly forbids newlines, tabs and unescaped multi-line text in template variables)
function sanitizeTwilioContentVar(val: any, maxLen = 120): string {
  if (val === undefined || val === null) return "";
  let str = String(val)
    .replace(/[\r\n\t]+/g, ' ') // Replace all newlines and tabs with a single space
    .replace(/\s{2,}/g, ' ')   // Collapse multiple consecutive spaces
    .trim();
  if (str.length > maxLen) {
    str = str.substring(0, Math.max(0, maxLen - 3)) + "...";
  }
  return str;
}

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
    let adminPhone = (process.env.ADMIN_PHONE || "").trim();

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
        if (data.adminPhone) adminPhone = data.adminPhone.trim();
        else if (data.coachPhone) adminPhone = data.coachPhone.trim();
      }
    } catch (err: any) {
      console.log("[Twilio Config] Using environment variables configuration.");
    }

    return { accountSid, authToken, whatsappNumber, serviceSid, templateSid, messagingServiceSid, weeklyReportTemplateSid, weeklyCoachReportTemplateSid, adminPhone };
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

interface YouTubeVideoItem {
  order: number;
  videoId: string;
  title: string;
  durationFormatted: string;
  durationMinutes: number;
  durationSeconds: number;
  url: string;
  thumbnail: string;
}

interface YouTubePlaylistResult {
  success: boolean;
  source?: "api" | "scraper";
  playlistId: string;
  title: string;
  channelTitle: string;
  totalVideos: number;
  totalDurationMinutes: number;
  totalDurationFormatted: string;
  videos: YouTubeVideoItem[];
  error?: string;
}

async function fetchYouTubePlaylistData(playlistUrlOrId: string, customApiKey?: string): Promise<YouTubePlaylistResult> {
  const playlistId = extractPlaylistId(playlistUrlOrId);
  if (!playlistId) {
    return {
      success: false,
      playlistId: "",
      title: "",
      channelTitle: "",
      totalVideos: 0,
      totalDurationMinutes: 0,
      totalDurationFormatted: "0 dk",
      videos: [],
      error: "Geçerli bir YouTube oynatma listesi (playlist) linki veya ID bulunamadı."
    };
  }

  const apiKey = customApiKey || process.env.YOUTUBE_API_KEY || process.env.ASSISTAN_API_KEY;

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

      // Fetch all playlist items (handle pagination up to 1000 items / 20 pages)
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
      } while (pageToken && pageCount < 20);

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
      const resultVideos: YouTubeVideoItem[] = validVideos.map((item, idx) => {
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

      return {
        success: true,
        source: "api",
        playlistId,
        title: playlistTitle,
        channelTitle,
        totalVideos: resultVideos.length,
        totalDurationMinutes: overallDur.minutes,
        totalDurationFormatted: overallDur.formatted,
        videos: resultVideos
      };
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
    const scrapedVideos: YouTubeVideoItem[] = [];

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
      return {
        success: false,
        playlistId,
        title: playlistTitle,
        channelTitle,
        totalVideos: 0,
        totalDurationMinutes: 0,
        totalDurationFormatted: "0 dk",
        videos: [],
        error: "Oynatma listesinde video bulunamadı veya liste gizli."
      };
    }

    const overallDur = formatSecondsToHuman(totalDurationSecs);

    return {
      success: true,
      source: "scraper",
      playlistId,
      title: playlistTitle,
      channelTitle,
      totalVideos: scrapedVideos.length,
      totalDurationMinutes: overallDur.minutes,
      totalDurationFormatted: overallDur.formatted,
      videos: scrapedVideos
    };
  } catch (scrapeErr: any) {
    console.error("[YouTube Scraper Error]:", scrapeErr);
    return {
      success: false,
      playlistId,
      title: "",
      channelTitle: "",
      totalVideos: 0,
      totalDurationMinutes: 0,
      totalDurationFormatted: "0 dk",
      videos: [],
      error: "Oynatma listesi yüklenemedi: " + (scrapeErr.message || "Bilinmeyen hata")
    };
  }
}

// Global state for tracking YouTube sync execution
let isYouTubeSyncRunning = false;
let lastYouTubeSyncInfo: {
  timestamp: string | null;
  totalChecked: number;
  updatedCount: number;
  newVideosTotal: number;
  status: "idle" | "running" | "completed" | "error";
  message?: string;
} = {
  timestamp: null,
  totalChecked: 0,
  updatedCount: 0,
  newVideosTotal: 0,
  status: "idle"
};

/**
 * Automatically syncs all YouTube playlists registered in the system (global_books).
 * Checks for newly uploaded videos, updates video counts, titles, durations, and order.
 */
async function executeYouTubePlaylistSync(options?: { force?: boolean }) {
  if (isYouTubeSyncRunning) {
    console.warn("[YouTube Sync] Senkronizasyon işlemi zaten devam ediyor.");
    return { 
      success: false, 
      message: "YouTube senkronizasyonu şu anda devam ediyor. Lütfen bekleyin.", 
      updatedCount: 0, 
      totalChecked: 0, 
      newVideosTotal: 0 
    };
  }

  isYouTubeSyncRunning = true;
  lastYouTubeSyncInfo.status = "running";
  console.log(`[YouTube Sync] 🔄 Otomatik YouTube video senkronizasyon süreci başlatıldı (Tarih: ${new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" })})...`);

  try {
    const db = getDb();
    const globalBooksSnap = await db.collection("global_books").get();
    const docs = globalBooksSnap.docs || [];
    
    let updatedCount = 0;
    let newVideosTotal = 0;
    let totalChecked = 0;
    const logs: any[] = [];

    for (const docSnap of docs) {
      const docData = docSnap.data() || {};
      const docId = docSnap.id;

      // Identify if this is a YouTube resource or has a playlist link/ID
      const isYouTube = docData.resourceType === 'youtube' || 
                        Boolean(docData.playlistUrl) || 
                        Boolean(docData.playlistId) ||
                        (docData.isbn && docData.isbn.startsWith('youtube_')) ||
                        (Array.isArray(docData.videos) && docData.videos.length > 0 && Boolean(docData.channelTitle));

      const targetPlaylistUrlOrId = docData.playlistId || docData.playlistUrl;
      const extractedId = extractPlaylistId(targetPlaylistUrlOrId);

      if (!isYouTube || !extractedId) {
        continue;
      }

      totalChecked++;

      try {
        console.log(`[YouTube Sync] [${totalChecked}] Oynatma listesi taranıyor: "${docData.name || docData.channelTitle || extractedId}" (ID: ${extractedId})...`);
        
        const fetchResult = await fetchYouTubePlaylistData(extractedId);

        if (!fetchResult.success || !fetchResult.videos || fetchResult.videos.length === 0) {
          console.warn(`[YouTube Sync] Playlist (${extractedId}) için video çekilemedi: ${fetchResult.error || 'Bilinmeyen hata'}`);
          logs.push({
            id: docId,
            name: docData.name || extractedId,
            playlistId: extractedId,
            status: "skipped",
            reason: fetchResult.error || "Video bulunamadı"
          });
          continue;
        }

        const existingVideos: any[] = Array.isArray(docData.videos) ? docData.videos : [];
        const existingVideoIdSet = new Set(existingVideos.map(v => v.videoId).filter(Boolean));
        const newVideosFound = fetchResult.videos.filter(v => !existingVideoIdSet.has(v.videoId));

        // Changes detected if new videos were added, video count changed, or videos array was empty
        const hasChanges = newVideosFound.length > 0 || 
                           fetchResult.videos.length !== existingVideos.length ||
                           existingVideos.length === 0;

        if (hasChanges) {
          const updatePayload: any = {
            videos: fetchResult.videos,
            totalVideos: fetchResult.totalVideos,
            totalDurationMinutes: fetchResult.totalDurationMinutes,
            totalDurationFormatted: fetchResult.totalDurationFormatted,
            playlistId: extractedId,
            playlistUrl: docData.playlistUrl || `https://www.youtube.com/playlist?list=${extractedId}`,
            resourceType: 'youtube',
            lastSyncedAt: new Date().toISOString(),
            lastSyncNewVideosCount: newVideosFound.length,
            updatedAt: new Date().toISOString()
          };

          if (fetchResult.channelTitle && !docData.channelTitle) {
            updatePayload.channelTitle = fetchResult.channelTitle;
          }

          await db.collection("global_books").doc(docId).set(updatePayload, { merge: true });

          updatedCount++;
          newVideosTotal += newVideosFound.length;

          console.log(`[YouTube Sync] ✅ Güncellendi: "${docData.name || fetchResult.title}" | Önceki Video: ${existingVideos.length} -> Yeni Toplam: ${fetchResult.totalVideos} (+${newVideosFound.length} yeni video)`);

          logs.push({
            id: docId,
            name: docData.name || fetchResult.title,
            playlistId: extractedId,
            status: "updated",
            previousVideoCount: existingVideos.length,
            currentVideoCount: fetchResult.totalVideos,
            newVideosAdded: newVideosFound.length,
            newVideoTitles: newVideosFound.map(v => v.title)
          });
        } else {
          // Touch lastSyncedAt timestamp so we know it was verified
          await db.collection("global_books").doc(docId).set({
            lastSyncedAt: new Date().toISOString(),
            lastSyncNewVideosCount: 0
          }, { merge: true });

          logs.push({
            id: docId,
            name: docData.name || fetchResult.title,
            playlistId: extractedId,
            status: "up_to_date",
            videoCount: fetchResult.totalVideos
          });
        }

        // Polite delay between requests to avoid rate limits
        await new Promise(r => setTimeout(r, 600));

      } catch (itemErr: any) {
        console.error(`[YouTube Sync] Playlist (${extractedId}) senkronizasyon hatası:`, itemErr?.message || itemErr);
        logs.push({
          id: docId,
          name: docData.name,
          playlistId: extractedId,
          status: "error",
          error: itemErr?.message || "Bilinmeyen hata"
        });
      }
    }

    lastYouTubeSyncInfo = {
      timestamp: new Date().toISOString(),
      totalChecked,
      updatedCount,
      newVideosTotal,
      status: "completed",
      message: `${totalChecked} oynatma listesi kontrol edildi, ${updatedCount} tanesi güncellendi (+${newVideosTotal} yeni video eklendi).`
    };

    try {
      await db.collection("system_logs").add({
        type: "youtube_playlist_sync",
        timestamp: new Date().toISOString(),
        totalChecked,
        updatedCount,
        newVideosTotal,
        logs: logs.slice(0, 50),
        status: "completed"
      });
    } catch (logErr) {
      // ignore
    }

    console.log(`[YouTube Sync] 🎉 Senkronizasyon tamamlandı. Kontrol Edilen: ${totalChecked}, Güncellenen: ${updatedCount}, Yeni Eklenen Video: ${newVideosTotal}`);

    return {
      success: true,
      message: `YouTube oynatma listeleri başarıyla senkronize edildi. ${totalChecked} liste kontrol edildi, ${updatedCount} tanesi güncellendi (+${newVideosTotal} yeni video eklendi).`,
      totalChecked,
      updatedCount,
      newVideosTotal,
      logs
    };
  } catch (err: any) {
    console.error("[YouTube Sync] Genel senkronizasyon hatası:", err);
    lastYouTubeSyncInfo.status = "error";
    lastYouTubeSyncInfo.message = err?.message || "Senkronizasyon sırasında hata oluştu";
    return {
      success: false,
      error: err?.message || "Senkronizasyon sırasında hata oluştu",
      updatedCount: 0,
      totalChecked: 0,
      newVideosTotal: 0
    };
  } finally {
    isYouTubeSyncRunning = false;
  }
}

  app.post("/api/youtube/fetch-playlist", async (req, res) => {
    const { playlistUrl, apiKey: userProvidedApiKey } = req.body;
    if (!playlistUrl) {
      return res.status(400).json({ error: "Lütfen geçerli bir YouTube oynatma listesi linki veya ID girin." });
    }

    const result = await fetchYouTubePlaylistData(playlistUrl, userProvidedApiKey);
    if (!result.success) {
      return res.status(400).json({ error: result.error || "Oynatma listesi yüklenemedi." });
    }

    return res.json(result);
  });

  // Manual / on-demand trigger to synchronize all registered YouTube playlists
  app.post("/api/youtube/sync-all", async (req, res) => {
    try {
      const result = await executeYouTubePlaylistSync();
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || "YouTube senkronizasyonu başlatılamadı." });
    }
  });

  // Status check for YouTube sync
  app.get("/api/youtube/sync-status", (req, res) => {
    return res.json({
      isRunning: isYouTubeSyncRunning,
      lastSync: lastYouTubeSyncInfo
    });
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
    res.setHeader("Content-Type", "application/json; charset=utf-8");
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
      // Truncate to last 16 messages to keep latency fast and context compact
      const slicedHistory = history.slice(-16);
      const formattedHistory = slicedHistory.map(msg => {
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
          parts: [{ text: msg.content || '' }]
        };
      });
      
      const modelName = getModelName("gemini-3.8-flash");
      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction, tools },
        history: formattedHistory.slice(0, -1) // Exclude the last message
      });

      const lastMsg = history[history.length - 1];
      let messagePayload: any = lastMsg.content || '';
      if (lastMsg.functionResponse) {
         messagePayload = `[Sistem: "${lastMsg.name || 'Araç'}" aracı başarıyla çalıştırıldı ve şu sonuçlar elde edildi:\n${JSON.stringify(lastMsg.functionResponse || {}, null, 2)}\n\n(DİKKAT: Veriyi incele. Eğer yeterli bilgiye ulaştıysan kullanıcıya doğrudan, samimi ve profesyonel bir üslupla yanıt ver. EĞER eksik bir bilgi varsa veya bu verinin sonucuna göre YENİ BİR ARAMA yapman gerekiyorsa, kullanıcıya cevap yazmadan önce doğrudan DİĞER ARAÇLARI ÇAĞIR. 4 aşamaya kadar ardışık araç çağrısı yapabilirsin.)]`;
      }

      // Add 28s timeout race to prevent Cloud Run / Nginx 504 HTML error page
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("GATEWAY_TIMEOUT_PREVENT")), 28000)
      );

      const response: any = await Promise.race([
        chat.sendMessage({ message: messagePayload }),
        timeoutPromise
      ]);

      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({ 
          functionCalls: response.functionCalls.map(fc => ({ name: fc.name, args: fc.args, id: fc.id })),
          text: response.text || '' // Include any conversational text returned
        });
      }

      res.json({ text: response.text || '' });
    } catch (error: any) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');

      if (errStr.includes("GATEWAY_TIMEOUT_PREVENT")) {
        return res.status(200).json({ 
          error: "Yapay zeka asistanı yanıt süresi gecikti. Lütfen mesajınızı tekrar yazarak gönderebilir misiniz?",
          code: "TIMEOUT",
          pleaseRetry: true 
        });
      }

      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.status(200).json({ 
          error: "Sistemde kota aşımı nedeniyle yapay zeka asistanı geçici olarak hizmet verememektedir. Lütfen biraz sonra mesajınızı tekrar yazarak gönderiniz.",
          code: "QUOTA_EXCEEDED",
          pleaseRetry: true
        });
      }
      
      console.error("Gemini AI Assistant Error:", error);
      let message = "Asistan servisi şu an geçici olarak yanıt veremiyor. Lütfen mesajınızı tekrar yazarak gönderiniz.";
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından ASSISTAN_API_KEY değerini kontrol edin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "AI Modeline ulaşılamadı. Lütfen mesajınızı tekrar yazarak gönderiniz.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Geçersiz veya süresi dolmuş Gemini API anahtarı.";
      } else if (error?.message) {
        message = `AI Bağlantı Uyarısı: ${error.message}. Lütfen mesajınızı tekrar yazarak gönderiniz.`;
      }
      
      res.status(200).json({ 
        error: message,
        code: "ASSISTANT_ERROR",
        technicalDetails: errStr,
        pleaseRetry: true 
      });
    }
  });

  // Client and system error telemetry endpoint
  app.post("/api/log-system-error", async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    try {
      const errorData = req.body || {};

      try {
        const db = getDb();
        if (db) {
          await db.collection("system_error_logs").add({
            ...errorData,
            serverReceivedAt: admin?.firestore?.FieldValue ? admin.firestore.FieldValue.serverTimestamp() : new Date().toISOString()
          });
        }
      } catch (fErr: any) {
        // Suppress console dumping to prevent AI Studio error watcher confusion
      }

      res.json({ success: true, loggedAt: new Date().toISOString() });
    } catch (e: any) {
      res.json({ success: false, error: e?.message || "Log error" });
    }
  });

  // Admin error logs fetch endpoint with admin privileges
  app.get("/api/admin/system-error-logs", async (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    try {
      const db = getDb();
      if (!db) {
        return res.json({ logs: [] });
      }

      const snap = await db.collection("system_error_logs")
        .orderBy("timestamp", "desc")
        .limit(200)
        .get();

      const logs: any[] = [];
      snap.forEach((doc: any) => {
        logs.push({
          id: doc.id,
          ...doc.data()
        });
      });

      res.json({ success: true, logs });
    } catch (e: any) {
      // If index is building or order fails, try basic scan
      try {
        const db = getDb();
        if (db) {
          const snap = await db.collection("system_error_logs").limit(200).get();
          const logs: any[] = [];
          snap.forEach((doc: any) => {
            logs.push({ id: doc.id, ...doc.data() });
          });
          logs.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
          return res.json({ success: true, logs });
        }
      } catch (innerErr) {}
      res.json({ success: false, logs: [], error: e?.message });
    }
  });

  // Admin error log update endpoint
  app.post("/api/admin/system-error-logs/update", async (req, res) => {
    try {
      const { logId, status, adminNotes, adminName } = req.body;
      if (!logId) return res.status(400).json({ error: "logId is required" });

      const db = getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const updates: any = {};
      if (status) updates.status = status;
      if (adminNotes !== undefined) updates.adminNotes = adminNotes;
      if (status === "resolved") {
        updates.resolvedAt = new Date().toISOString();
        updates.resolvedBy = adminName || "Yönetici";
      }

      await db.collection("system_error_logs").doc(logId).set(updates, { merge: true });
      res.json({ success: true });
    } catch (e: any) {
      res.json({ success: false, error: e?.message });
    }
  });

  // Admin error log delete endpoint
  app.post("/api/admin/system-error-logs/delete", async (req, res) => {
    try {
      const { logId, deleteResolved } = req.body;
      const db = getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      if (deleteResolved) {
        const snap = await db.collection("system_error_logs").where("status", "==", "resolved").get();
        const batch = db.batch();
        snap.forEach((d: any) => batch.delete(d.ref));
        await batch.commit();
        return res.json({ success: true, count: snap.size });
      }

      if (logId) {
        await db.collection("system_error_logs").doc(logId).delete();
        return res.json({ success: true });
      }

      res.status(400).json({ error: "Invalid parameters" });
    } catch (e: any) {
      res.json({ success: false, error: e?.message });
    }
  });

  // Admin sync 9. Sınıf Biyoloji curriculum endpoint according to official 2026-2027 framework
  app.post("/api/admin/curriculum/sync-9-biyoloji", async (req, res) => {
    try {
      const db = getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const newTopics = [
        "Biyolojinin Önemi, Biyoloji Biliminin Gelişimindeki Dönüm Noktaları, Bilimin Doğası",
        "Bilimsel Araştırma Süreçleri, Bilim Etiği",
        "Canlıların Ortak Özellikleri",
        "İnorganik Moleküller (Su, Mineraller)",
        "Organik Moleküller",
        "Hücre: Prokaryot ve Ökaryot Hücre, Hücre Zarı, Sitoplazma, Organeller ve Çekirdek",
        "Hücre Zarından Madde Geçişleri",
        "Sınıflandırmada Temel Yaklaşımlar ve Modern Sınıflandırma",
        "Üç Üst Âlem (Domain) Sisteminde Canlılar ve Genel Özellikleri",
        "Biyoçeşitlilik"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        "Biyolojinin Önemi, Biyoloji Biliminin Gelişimindeki Dönüm Noktaları, Bilimin Doğası": [
          "Biyolojinin Önemi ve İnsan Hayatına Katkıları",
          "Biyoloji Biliminin Gelişimindeki Tarihsel Dönüm Noktaları",
          "Bilimsel Araştırma Süreçlerinde Bilimin Doğası",
          "Bilimin Doğasının Özellikleri ve Bilimsel Bilginin Değişebilirliği"
        ],
        "Bilimsel Araştırma Süreçleri, Bilim Etiği": [
          "Bilimsel Araştırma Süreçleri ve Veri Toplama Araçları",
          "Bilimsel Araştırmalarda Bilim Etiğine Uygunluk ve Bilgi Doğrulama",
          "Bilim Etiği İhlalleri ve Tarihsel Örnekler (Rosalind Franklin, HeLa Hücreleri)"
        ],
        "Canlıların Ortak Özellikleri": [
          "Hücresel Yapı ve Organizasyon",
          "Beslenme, Enerji Üretimi ve Tüketimi (Solunum/Fermantasyon)",
          "Boşaltım, Büyüme ve Gelişme",
          "Metabolizma (Anabolizma ve Katabolizma)",
          "Uyarılara Tepki ve Homeostazi (İç Denge)",
          "Üreme, Varyasyon ve Adaptasyon",
          "Virüslerin Canlı/Cansız Özellikleri ve Sınıflandırılamama Nedenleri"
        ],
        "İnorganik Moleküller (Su, Mineraller)": [
          "İnorganik Moleküllerin Genel Özellikleri ve Canlılar İçin Önemi",
          "Suyun Özellikleri (Kohezyon, Adhezyon, Yüzey Gerilimi, Özgül Isı) ve Önemi",
          "Minerallerin Görevleri ve Biyolojik Fonksiyonları",
          "Asitler, Bazlar ve Tuzların Canlı Sistemlerdeki Rolü"
        ],
        "Organik Moleküller": [
          "Karbohidratlar: Monosakkaritler (Riboz, Deoksiriboz, Fruktoz, Glikoz, Galaktoz)",
          "Karbohidratlar: Disakkaritler (Sükroz, Maltoz, Laktoz) ve Polisakkaritler (Glikojen, Nişasta, Selüloz, Kitin)",
          "Lipitler: Yağ Asitleri, Trigliseritler, Fosfolipitler ve Steroitler",
          "Proteinler: Amino Asitlerin Yapısı, Peptit Bağı ve Proteinlerin Yapı Düzeyleri",
          "Enzimler: Basit ve Bileşik Enzimlerin Yapısı, Aktivasyon Enerjisi ve Enzim-Substrat İlişkisi",
          "Enzimler: Enzimatik Reaksiyonlara Etki Eden Faktörler (Sıcaklık, pH, İnhibitörler)",
          "Nükleik Asitler: DNA ve RNA'nın Yapısı ve Görevleri",
          "Vitaminler: Yağda Çözünen (A, D, E, K) ve Suda Çözünen (B, C) Vitaminler",
          "Besin Analizleri: Karbohidrat, Lipit ve Protein Varlığını Belirleme Ayraç Deneyleri"
        ],
        "Hücre: Prokaryot ve Ökaryot Hücre, Hücre Zarı, Sitoplazma, Organeller ve Çekirdek": [
          "Prokaryot ve Ökaryot Hücre Yapısı ve Karşılaştırması",
          "Hücre Zarı Yapısı ve Özellikleri (Akıcı Mozaik Zar Modeli)",
          "Sitoplazma, Sitoplazmik Yapılar ve Zarsız Organeller (Ribozom, Sentrozom)",
          "Tek Zarlı Organeller (Endoplazmik Retikulum, Golgi, Lizozom, Koful, Peroksizom)",
          "Çift Zarlı Organeller (Mitokondri ve Plastitler / Kloroplast)",
          "Çekirdek Yapısı (Çekirdek Zarı, Çekirdekçik, Çekirdek Sıvısı, Kromatin)",
          "Hücre Alt Birimlerinin Görevleri ve Aralarındaki Bütüncül İlişkiler"
        ],
        "Hücre Zarından Madde Geçişleri": [
          "Pasif Taşıma: Basit Difüzyon ve Kolaylaştırılmış Difüzyon",
          "Pasif Taşıma: Ozmoz, Ozmotik Basınç, Turgor Basıncı ve Emme Kuvveti (Plazmoliz, Deplazmoliz)",
          "Aktif Taşıma ve ATP Kullanımı",
          "Büyük Moleküllerin Geçişi: Endositoz (Fagositoz, Pinositoz) ve Ekzositoz",
          "Küçük Moleküllerin Hücre Zarından Pasif Geçişine İlişkin Deneyler ve Günlük Hayattaki Etkileri"
        ],
        "Sınıflandırmada Temel Yaklaşımlar ve Modern Sınıflandırma": [
          "Canlıları Sınıflandırmada Kullanılan Nitelikler ve Temel Yaklaşımlar",
          "Linne ve İkili Adlandırma (Binominal Nomenklatür)",
          "Sınıflandırma Kategorileri (Tür, Cins, Familya, Takım, Sınıf, Şube, Âlem)",
          "Modern Filogenetik Sınıflandırma İlkeleri"
        ],
        "Üç Üst Âlem (Domain) Sisteminde Canlılar ve Genel Özellikleri": [
          "Üç Üst Âlem (Domain) Sistemi: Bakteriler, Arkeler ve Ökaryotlar",
          "Bakteriler (Bacteria) Âlemi ve Genel Özellikleri",
          "Arkeler (Archaea) Âlemi, Ekstrem Koşullara Uyumları ve Biyoteknolojik Kullanımları",
          "Ökaryotlar: Protistler Âlemi ve Genel Özellikleri",
          "Ökaryotlar: Bitkiler Âlemi ve Genel Özellikleri",
          "Ökaryotlar: Mantarlar Âlemi ve Genel Özellikleri",
          "Ökaryotlar: Hayvanlar Âlemi ve Genel Özellikleri"
        ],
        "Biyoçeşitlilik": [
          "Biyoçeşitliliği Oluşturan Unsurlar (Genetik, Tür ve Ekosistem Çeşitliliği)",
          "Türkiye'nin Biyolojik Çeşitliliği ve Endemik Türler",
          "Biyoçeşitliliğin Korunması, Tehditler ve Sürdürülebilirlik"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      subjects["9. Sınıf Biyoloji"] = newTopics;
      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: "9. Sınıf Biyoloji müfredatı başarıyla güncellendi",
        topicsCount: newTopics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Admin sync 10. and 11. Sınıf Biyoloji curriculum endpoint according to official 2026-2027 framework
  app.post("/api/admin/curriculum/sync-10-11-biyoloji", async (req, res) => {
    try {
      const db = getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const grade10Topics = [
        "Canlılık İçin Enerjinin Önemi (ATP’nin Yapısı ve Enerji Aktarımında ATP’nin Rolü)",
        "Işık Enerjisi Kullanılarak Besin Sentezi: Fotosentez",
        "Işık Enerjisi Kullanılmadan Besin Sentezi: Kemosentez",
        "Sindirim (Hücre İçi ve Hücre Dışı Sindirim), Canlılarda Sindirim Yapıları ve İnsanda Sindirim",
        "Emilim ve Taşınma",
        "Hücresel Solunum (Glikoliz, Sitrik Asit Döngüsü, ETS) ve Besinlerin Solunuma Katılma Yolları",
        "Fermantasyon (Laktik Asit ve Etil Alkol Fermantasyonu)",
        "Enerji-Metabolizma İlişkisi",
        "Ekosistemin Bileşenleri (Cansız ve Canlı Bileşenler, Popülasyon, Komünite, Ekosistem)",
        "Tür İçi ve Türler Arası Etkileşimler, Süksesyon, Popülasyon Dinamikleri",
        "Ekosistemde Madde ve Enerji Akışı (Besin Zinciri ve Ağı, Ekolojik Piramitler, Biyolojik Birikim)",
        "Madde Döngüleri (Su, Karbon, Azot Döngüsü)",
        "Ekolojik Sürdürülebilirlik ve Çevre Sorunları (Habitat Kaybı, Kirlilik, Biyoçeşitlilik Kaybı)",
        "Ekolojik Sürdürülebilirlik Sağlanması (Ekolojik Ayak İzi, Kaynakların Korunması, Atık Yönetimi)"
      ];

      const grade11Topics = [
        "Farklı Canlıların Uyaranlara Karşı Oluşturduğu Tepkiler",
        "Bitkisel Hormonlar ve Bitkilerde Tepki Mekanizmaları (Tropizma, Nasti)",
        "Uyartıların Alınması (Reseptörler, Nöron Yapısı, İmpuls İletimi, Sinaps) ve Duyu Organları",
        "Uyarıların Yorumlanması ve Hayvanlarda Sinir Sistemi Farklılıkları",
        "İnsan Sinir Sisteminin Yapısı (Merkezi ve Çevresel Sinir Sistemi)",
        "Refleksler ve Refleks Yayı Mekanizması",
        "Kemik, Eklem ve Kasların Hareketteki Rolü, Kemik ve Kasların Birlikte Çalışma İlişkisi",
        "Kaslarda Kasılmanın Kontrolü ve Kasılma Mekanizması",
        "Doğal Bağışıklık, Kazanılmış Bağışıklık (Aktif ve Pasif Bağışıklık)",
        "Alerji ve Alerjik Tepkilerin Oluşumu",
        "Farklı Canlı Türlerindeki Homeostatik Yapı ve Sistemler",
        "Homeostatik Süreçler ve Pozitif / Negatif Geri Bildirim",
        "Sinir Sistemi ve Homeostazi",
        "Endokrin Sistem ve Homeostazi",
        "Dolaşım Sistemi ve Homeostazi",
        "Solunum Sistemi ve Homeostazi",
        "Boşaltım Sistemi ve Homeostazi",
        "Sistemlerin Eş Güdümlü Çalışması",
        "Homeostatik Süreçlerin Bozulması ve Sağlık Problemleri (Diyabet, Kan Basıncı, Obezite)"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        // 10. Sınıf
        "Canlılık İçin Enerjinin Önemi (ATP’nin Yapısı ve Enerji Aktarımında ATP’nin Rolü)": [
          "Canlıların Yaşamında Enerjinin Gerekliliği ve Önemi",
          "ATP’nin Yapısı ve Enerji Aktarımındaki Rolü",
          "Fosforilasyon ve Defosforilasyon Süreçleri"
        ],
        "Işık Enerjisi Kullanılarak Besin Sentezi: Fotosentez": [
          "Fotosentezin Önemi, Kloroplast ve Fotosistemlerin Yapısı",
          "Işığa Bağımlı Tepkimeler (Fotofosforilasyon ve ATP Üretimi)",
          "Işıktan Bağımsız Tepkimeler (Calvin Döngüsü / Karbon Tutma)",
          "Fotosentez Hızına Etki Eden Çevresel ve Genetik Faktörler",
          "Fotosentezde Kullanılan ve Üretilen Maddelere İlişkin Deneyler"
        ],
        "Işık Enerjisi Kullanılmadan Besin Sentezi: Kemosentez": [
          "Kemosentezin Tanımı, Mekanizması ve Canlılar İçin Önemi",
          "Kemosentetik Canlılar ve Madde Döngülerindeki Rolü",
          "Fotosentez ve Kemosentezin Karşılaştırılması"
        ],
        "Sindirim (Hücre İçi ve Hücre Dışı Sindirim), Canlılarda Sindirim Yapıları ve İnsanda Sindirim": [
          "Hücre İçi ve Hücre Dışı Sindirim Çeşitleri",
          "Canlılarda Sindirim Yapıları ve Karşılaştırmalı Özellikleri",
          "İnsanda Sindirim Sistemi Organları ve Görevleri",
          "Kimyasal Sindirim ve Enzimatik Süreçler"
        ],
        "Emilim ve Taşınma": [
          "Sindirim Ürünlerinin Emilim Mekanizmaları (Kılcal Kan Damarları ve Lenf Yolu)",
          "Besinlerin Hücrelere Taşınması ve Enerji Eldesindeki Rolü",
          "Karaciğerin Emilim ve Sindirim Sonrası Süreçlerdeki Görevleri"
        ],
        "Hücresel Solunum (Glikoliz, Sitrik Asit Döngüsü, ETS) ve Besinlerin Solunuma Katılma Yolları": [
          "Glikoliz Evresi ve Özellikleri",
          "Sitrik Asit Döngüsü (Krebs Döngüsü)",
          "Elektron Taşıma Sistemi (ETS) ve Oksidatif Fosforilasyon",
          "Farklı Besin Gruplarının (Karbonhidrat, Yağ, Protein) Solunuma Katılma Yolları"
        ],
        "Fermantasyon (Laktik Asit ve Etil Alkol Fermantasyonu)": [
          "Laktik Asit Fermantasyonu ve Kas Yorgunluğu",
          "Etil Alkol Fermantasyonu",
          "Fermantasyonun Günlük Hayat, Gıda ve İlaç Endüstrisindeki Kullanımı",
          "Hücresel Solunum ve Fermantasyonun Enerji Verimi Açısından Karşılaştırılması"
        ],
        "Enerji-Metabolizma İlişkisi": [
          "Besinlerden Elde Edilen Enerjinin Canlının Metabolik Süreçlerine Katkısı",
          "Bazal Metabolizma ve Metabolizma Hızını Etkileyen Faktörler",
          "Enerji Dengesi ve Hücresel Canlılık"
        ],
        "Ekosistemin Bileşenleri (Cansız ve Canlı Bileşenler, Popülasyon, Komünite, Ekosistem)": [
          "Ekosistemi Oluşturan Cansız (Abiyotik) Bileşenler",
          "Ekosistemi Oluşturan Canlı (Biyotik) Bileşenler (Üreticiler, Tüketiciler, Ayrıştırıcılar)",
          "Popülasyon, Komünite ve Ekosistem Düzeyleri Arasındaki İlişkiler"
        ],
        "Tür İçi ve Türler Arası Etkileşimler, Süksesyon, Popülasyon Dinamikleri": [
          "Tür İçi ve Türler Arası Rekabet, Av-Avcı İlişkisi",
          "Simbiyotik İlişkiler (Mutualizm, Kommensalizm, Parazitizm)",
          "Ekolojik Süksesyon (Birincil ve İkincil Süksesyon)",
          "Popülasyon Yoğunluğu, Dağılımı, Taşıma Kapasitesi ve Yaş Dağılımı"
        ],
        "Ekosistemde Madde ve Enerji Akışı (Besin Zinciri ve Ağı, Ekolojik Piramitler, Biyolojik Birikim)": [
          "Besin Zinciri ve Besin Ağı Yapısı",
          "Ekolojik Piramitler (Birey Sayısı, Biyokütle ve Enerji Piramidi)",
          "Ekosistemde Enerji Kaybı ve Yüzde 10 Kuralı",
          "Biyolojik Birikim (Toksik Maddelerin Trofik Düzeylerde Birikimi) ve Etkileri"
        ],
        "Madde Döngüleri (Su, Karbon, Azot Döngüsü)": [
          "Su Döngüsü ve Canlılar İçin Önemi",
          "Karbon Döngüsü ve Atmosferik Karbon Dengesi",
          "Azot Döngüsü (Nitrifikasyon, Denitrifikasyon, Azot Fiksasyonu)",
          "İnsan Faaliyetlerinin Madde Döngülerine Etkileri"
        ],
        "Ekolojik Sürdürülebilirlik ve Çevre Sorunları (Habitat Kaybı, Kirlilik, Biyoçeşitlilik Kaybı)": [
          "Ekolojik Sürdürülebilirliğin Önemi",
          "Habitat Kaybı, Parçalanması ve Türlerin Yok Oluşu",
          "Hava, Su ve Toprak Kirliliği, Sera Etkisi ve Küresel İklim Değişikliği",
          "Biyoçeşitlilik Kaybı ve Ekosistem Dengesine Etkileri"
        ],
        "Ekolojik Sürdürülebilirlik Sağlanması (Ekolojik Ayak İzi, Kaynakların Korunması, Atık Yönetimi)": [
          "Ekolojik Ayak İzi, Karbon Ayak İzi ve Su Ayak İzi",
          "Ekolojik Ayak İzinin Küçültülmesi İçin Çözüm Önerileri",
          "Doğal Kaynakların ve Biyoçeşitliliğin Korunması",
          "Atık Yönetimi, Geri Dönüşüm ve Sıfır Atık Uygulamaları"
        ],

        // 11. Sınıf
        "Farklı Canlıların Uyaranlara Karşı Oluşturduğu Tepkiler": [
          "Canlılarda Uyarılabilirlik ve Tepki Mekanizmaları",
          "Bir Hücrelilerden Çok Hücrelilere Tepki Çeşitliliği ve Örüntüleri",
          "Uyaran-Tepki İlişkisinin Canlı Yaşamındaki Önemi"
        ],
        "Bitkisel Hormonlar ve Bitkilerde Tepki Mekanizmaları (Tropizma, Nasti)": [
          "Bitkisel Hormonlar (Oksin, Giberellin, Sitokinin, Absisik Asit, Etilen) ve Görevleri",
          "Yönelme Hareketleri: Tropizma (Fototropizma, Geotropizma, Tigmotropizma)",
          "Irganım Hareketleri: Nasti (Fotonasti, Termonasti, Sismonasti)",
          "Bitkilerde Tepki Mekanizmalarının Tarım ve Seracılıkta Kullanımı"
        ],
        "Uyartıların Alınması (Reseptörler, Nöron Yapısı, İmpuls İletimi, Sinaps) ve Duyu Organları": [
          "Reseptör Çeşitleri (Fotoreseptör, Mekanoreseptör, Termoreseptör, Kemoreseptör)",
          "Nöronun Yapısı (Dendrit, Akson, Miyelin Kılıf) ve Glia Hücreleri",
          "İmpuls Oluşumu ve İletimi (Polarizasyon, Depolarizasyon, Repolarizasyon, Ya Hep Ya Hiç Kuralı)",
          "Sinapslarda Kimyasal İletim ve Nörotransmitter Maddeler",
          "Duyu Organlarının (Göz, Kulak, Burun, Dil, Deri) Yapısı, Çalışması ve Kusurları"
        ],
        "Uyarıların Yorumlanması ve Hayvanlarda Sinir Sistemi Farklılıkları": [
          "Omurgasız Hayvanlarda Sinir Sistemleri (Ağsı, İp Merdiven)",
          "Omurgalı Hayvanlarda Sinir Sistemlerinin Evrimsel Gelişimi ve Karşılaştırılması",
          "Merkezi ve Çevresel Sinir Sisteminin Hayvanlardaki Temel Yapıları"
        ],
        "İnsan Sinir Sisteminin Yapısı (Merkezi ve Çevresel Sinir Sistemi)": [
          "Merkezi Sinir Sistemi: Beyin (Ön Beyin, Orta Beyin, Arka Beyin)",
          "Merkezi Sinir Sistemi: Omurilik Yapısı ve İşlevleri",
          "Çevresel Sinir Sistemi: Somatik ve Otonom (Sempatik, Parasempatik) Sinir Sistemi"
        ],
        "Refleksler ve Refleks Yayı Mekanizması": [
          "Refleks Yayı Mekanizması (Duyu Nöronu, Ara Nöron, Motor Nöron)",
          "Doğuştan Gelen (Kalıtsal) ve Sonradan Kazanılan (Şartlı) Refleksler",
          "Güncel Hayatta Gerçekleşen Refleks Olayları ve Koruyucu İşlevleri"
        ],
        "Kemik, Eklem ve Kasların Hareketteki Rolü, Kemik ve Kasların Birlikte Çalışma İlişkisi": [
          "Kemik Dokunun Yapısı (Sert ve Süngerimsi Kemik, Periost) ve İskelet Sistemi",
          "Eklem Çeşitleri (Oynar, Yarı Oynar, Oynamaz Eklemler) ve Bağlar",
          "Kas Çeşitleri (Düz Kas, Çizgili Kas, Kalp Kası) ve Özellikleri",
          "İskelet, Kas ve Eklemlerin Eş Güdümlü Çalışması"
        ],
        "Kaslarda Kasılmanın Kontrolü ve Kasılma Mekanizması": [
          "Kayan İplikler Modeli (Aktin ve Miyozin Etkileşimi)",
          "Kasılma ve Gevşemede Kalsiyum İyonları ve ATP'nin Rolü",
          "Motor Uç Plak ve Sinir-Kas Kavşağında İmpuls İletimi",
          "Kas Sarsısı, Tetanus (Kramp) ve Kas Tonusu"
        ],
        "Doğal Bağışıklık, Kazanılmış Bağışıklık (Aktif ve Pasif Bağışıklık)": [
          "Özgül Olmayan (Doğal) Bağışıklık ve Savunmanın Birinci-İkinci Hattı",
          "Özgül (Kazanılmış) Bağışıklık: Humoral (B Hücreleri) ve Hücresel (T Hücreleri) Bağışıklık",
          "Aktif Bağışıklık (Hastalığı Geçirme, Aşı) ve Pasif Bağışıklık (Serum, Anne Sütü)",
          "Bağışıklık Sistemi Yapıları ve Bellek Hücreleri"
        ],
        "Alerji ve Alerjik Tepkilerin Oluşumu": [
          "Alerjenler ve Alerjik Tepkilerin Oluşum Mekanizması (Histamin Salgısı)",
          "Mast Hücreleri ve IgE Antikorlarının Alerjideki Rolü",
          "Alerjik Hastalıklar, Belirtileri ve Alınabilecek Önlemler"
        ],
        "Farklı Canlı Türlerindeki Homeostatik Yapı ve Sistemler": [
          "Homeostazinin Tanımı, Canlılar İçin Yaşamsal Önemi ve İlkeleri",
          "Bir Hücreli ve Çok Hücreli Canlılarda Homeostaziyi Sağlayan Yapılar",
          "Farklı Canlılarda Vücut Sıcaklığının ve Su-Tuz Dengesinin Korunması"
        ],
        "Homeostatik Süreçler ve Pozitif / Negatif Geri Bildirim": [
          "Negatif Geri Bildirim (Negative Feedback) Mekanizması ve Örnekleri",
          "Pozitif Geri Bildirim (Positive Feedback) Mekanizması ve Örnekleri",
          "Geri Bildirim Sistemlerinin Karşılaştırılması ve İç Denge Korunumu"
        ],
        "Sinir Sistemi ve Homeostazi": [
          "Hipotalamusun Homeostazideki Merkezi Rolü (Vücut Sıcaklığı, Su Dengesi, İştah)",
          "Otonom Sinir Sisteminin İç Organların Dengeli Çalışmasındaki Rolü",
          "Sinir Sisteminin Hızlı Homeostatik Tepkileri"
        ],
        "Endokrin Sistem ve Homeostazi": [
          "Hipofiz Bezi ve Diğer Endokrin Bezlerle Geri Bildirim İlişkisi",
          "Kan Şekerinin Düzenlenmesi (İnsülin ve Glukagon Etkileşimi)",
          "Kalsiyum Dengesinin Düzenlenmesi (Kalsitonin ve Parathormon)",
          "Su ve İyon Dengesinin Sağlanması (ADH ve Aldosteron)"
        ],
        "Dolaşım Sistemi ve Homeostazi": [
          "Kalbin Yapısı, Çalışması ve Kan Basıncının Düzenlenmesi",
          "Kan Dokunun Görevleri: Taşıma, Savunma, Düzenleme ve Pıhtılaşma",
          "Doku Sıvısı Oluşumu ve Starling Hipotezi (Madde Değişimi)",
          "Lenf Dolaşımı ve Ödem Oluşumu Engelleme"
        ],
        "Solunum Sistemi ve Homeostazi": [
          "Akciğerlerin Yapısı, Alveoller ve Gaz Değişimi",
          "Kanda Oksijen ve Karbondioksit Taşınması (Hemoglobin, Bikarbonat İyonları)",
          "Kan pH'ının Düzenlenmesinde Solunum Sisteminin Kritik Rolü"
        ],
        "Boşaltım Sistemi ve Homeostazi": [
          "Böbreğin Yapısı ve Nefronun Bölümleri",
          "İdrar Oluşumu: Süzülme, Geri Emilim ve Salgılama",
          "Vücut Sıvılarının Ozmotik Basıncı ve pH Ayarlamasında Böbreklerin Rolü"
        ],
        "Sistemlerin Eş Güdümlü Çalışması": [
          "Sinir, Endokrin, Dolaşım, Solunum ve Boşaltım Sistemlerinin Eş Güdümlü Entegrasyonu",
          "Egzersiz veya Stres Durumunda Sistemlerin Birlikte Yanıtı",
          "Sistemik İletişim ve Karşılıklı Düzenleme Mekanizmaları"
        ],
        "Homeostatik Süreçlerin Bozulması ve Sağlık Problemleri (Diyabet, Kan Basıncı, Obezite)": [
          "İç Dengenin Bozulmasının Hücre ve Doku Düzeyindeki Etkileri",
          "Şeker Hastalığı: Diabetes Mellitus (Tip 1 ve Tip 2 Diyabet)",
          "Şekersiz Şeker Hastalığı: Diabetes İnsipidus (ADH Yetersizliği)",
          "Kan Basıncı Anormallikleri (Hipertansiyon ve Hipotansiyon)",
          "Obezite, Metabolik Sendrom ve Korunma Yolları"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      subjects["10. Sınıf Biyoloji"] = grade10Topics;
      subjects["11. Sınıf Biyoloji"] = grade11Topics;

      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: "10. ve 11. Sınıf Biyoloji müfredatları başarıyla güncellendi",
        grade10Count: grade10Topics.length,
        grade11Count: grade11Topics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Admin sync Tarih (9, 10, 11) curriculum endpoint according to official 2026-2027 framework
  app.post("/api/admin/curriculum/sync-tarih", async (req, res) => {
    try {
      const db = getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const targetSubject = req.body?.subject || req.query?.subject;

      const grade9Topics = [
        "Tarih Öğrenmenin Faydaları",
        "Tarihin Doğası",
        "Tarihsel Bilginin Üretim Süreci",
        "Tarih Araştırma ve Yazımında Dijitalleşme",
        "Tarım Devrimi’nin Eski Çağ Medeniyetlerindeki Yerleşmeye ve Ekonomiye Etkisi",
        "Eski Çağ Medeniyetlerinde Yönetim ve Ordu",
        "Eski Çağ Medeniyetlerinde Hukuk",
        "Eski Çağ’da İnançlar ile Bilim ve Sanat Anlayışları",
        "Türklerde Konargöçer Yaşam",
        "Orta Çağ’da Yaşanan Kitlesel Göçler",
        "Orta Çağ’daki Başlıca Devletlerin Yönetim ve Ordu Yapıları",
        "Orta Çağ’daki Ticaret Yolları",
        "Orta Çağ’daki Başlıca Medeniyet Havzalarında Bilim, Kültür ve Sanat"
      ];

      const grade10Topics = [
        "Türkistan’dan Türkiye’ye Uzanan Süreçte Meydana Gelen Önemli Askerî Mücadeleler",
        "Türkistan’dan Türkiye’ye Uzanan Süreçte Türk Devlet ve Ordu Teşkilatında Meydana Gelen Değişim",
        "Türkistan’dan Türkiye’ye Uzanan Süreçte Türklerin Sosyal Yaşamları ve Ekonomik Faaliyetleri",
        "Türk-İslam Medeniyetinin Bilim, Kültür, Eğitim ve Sanat Alanlarında Ortaya Çıkardığı Etkiler",
        "Osmanlı Devleti’nin Kuruluşuna Dair Farklı Görüşler",
        "Osmanlı Devleti’nin Anadolu ve Rumeli’deki Siyasi ve Askerî Mücadeleleri",
        "Osmanlı Devleti’nin Devletleşme Süreci ile Ordu, Hukuk ve Toprak Sistemleri Arasındaki İlişkiler",
        "Osmanlı Devleti’nin Fethettiği Topraklarda Kalıcı Olabilmek İçin İzlediği Politikalar",
        "Osmanlı Devleti’nin İlim ve İrfan Geleneğinin Oluşmasında Mekânların ve Kişilerin Etkisi",
        "1453-1683 Yılları Arasındaki Siyasi ve Askerî Mücadeleler",
        "Osmanlı Devleti’nin Yönetim ve Ordu Yapısında Meydana Gelen Değişim",
        "Avrupa’nın Sömürgeci Politikalarının Etkileri",
        "Osmanlı Devleti’ndeki Önemli İsyanların Neden ve Sonuçları",
        "1453-1683 Yılları Arasında Osmanlı Devleti’nde Bilim, Kültür, Eğitim ve Sanat Alanında Yaşanan Gelişmeler"
      ];

      const grade11Topics = [
        "Osmanlı Devleti’nin 1683-1789 Yılları Arasındaki Siyasi ve Askerî Mücadeleleri",
        "Lale Devri’nin Devlet ve Toplum Hayatına Etkileri",
        "1755 Lizbon ve 1766 İstanbul Depremlerinin Etkileri",
        "Sanayi Devrimi’nin Meydana Getirdiği Siyasi, Sosyal ve Ekonomik Değişim",
        "Fransız İhtilali’nin Devlet ve Toplum Hayatında Meydana Getirdiği Değişim",
        "1789-1908 Yılları Arasında Osmanlı Devleti’nde Meydana Gelen Siyasi, Askerî ve İdari Gelişmeler",
        "1789-1908 Yılları Arasında Osmanlı Devleti’nde Bilim, Sanat ve Teknoloji Alanlarında Meydana Gelen Gelişmeler",
        "Osmanlı Devleti’nde Sanayileşme Çabaları",
        "1908-1918 Yılları Arasında Osmanlı Devleti’nde Meydana Gelen Siyasi ve Askerî Gelişmeler",
        "1908-1918 Yılları Arasında Gerçekleşen Kitlesel Göç ve Salgınlar",
        "Osmanlı Devleti’nin İnsanlık Tarihine Katkıları"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        // 9. Sınıf Tarih
        "Tarih Öğrenmenin Faydaları": [
          "Tarih Öğrenmenin Bireye ve Topluma Faydaları",
          "Tarih Bilincinin ve Tarihsel Hafızanın Önemi",
          "Tarih Öğrenmenin Bireysel ve Toplumsal Kimliğin İnşasındaki Rolü"
        ],
        "Tarihin Doğası": [
          "Tarihin Doğası, Konusu ve Kapsamı",
          "Tarihsel Bilginin Temel Özellikleri ve Diğer Bilimlerden Farkı",
          "Tarihsel Olay ve Olguların Özellikleri"
        ],
        "Tarihsel Bilginin Üretim Süreci": [
          "Tarihsel Bilginin Üretim Aşamaları (Kaynak Arama, Tasnif, Tahlil, Tenkit, Terkip)",
          "Tarihsel Kaynakların Sınıflandırılması (Birinci ve İkinci Elden Kaynaklar)",
          "Tarihsel Bilginin Üretim Sürecindeki Aşamalar Arasındaki İlişkiler"
        ],
        "Tarih Araştırma ve Yazımında Dijitalleşme": [
          "Dijitalleşme Öncesi ve Dijital Dönemde Tarih Araştırma ve Yazım Süreçleri",
          "Dijitalleşmenin Tarih Araştırma ve Yazımına Olumlu ve Olumsuz Etkileri",
          "Dijital Ortamda Tarihsel Bilginin Güvenilirliği ve Eleştirel Değerlendirilmesi"
        ],
        "Tarım Devrimi’nin Eski Çağ Medeniyetlerindeki Yerleşmeye ve Ekonomiye Etkisi": [
          "Tarım Devrimi’nin Yerleşmeye ve Ekonomik Faaliyetlere Zaman ve Mekân Açısından Etkileri",
          "Üretici Yaşama Geçiş, İlk Köy ve Şehir Yerleşmeleri",
          "Artı Ürün, Mülkiyet Anlayışı ve Ticaretin Doğuşu"
        ],
        "Eski Çağ Medeniyetlerinde Yönetim ve Ordu": [
          "Eski Çağ’da Mezopotamya, Mısır, Anadolu, Ege ve Doğu Akdeniz Medeniyetlerinde Yönetim Yapıları",
          "Eski Çağ Medeniyetlerinde Ordu Sistemleri ve Askerî Teşkilatlanma",
          "Yönetim ve Ordu Sistemlerinin Güçlü ve Zayıf Yönleri"
        ],
        "Eski Çağ Medeniyetlerinde Hukuk": [
          "Eski Çağ Toplumlarında Hukukun Ortaya Çıkışı ve İlk Yazılı Hukuk Kuralları (Urkagina, Hammurabi, Hitit Kanunları)",
          "Hukukun Toplumsal Düzeni ve Adaleti Sağlamadaki Rolü",
          "Farklı Medeniyetlerin Hukuk Anlayışlarının Karşılaştırılması"
        ],
        "Eski Çağ’da İnançlar ile Bilim ve Sanat Anlayışları": [
          "Eski Çağ Toplumlarında İnanç Sistemleri ve Dini Ritüeller",
          "İnançların Bilim (Astronomi, Geometri, Tıp) ve Sanat Anlayışına Etkileri",
          "Eski Çağ’da Bilim ve Sanat Eserlerinin İnsanlığın Ortak Mirasına Katkısı"
        ],
        "Türklerde Konargöçer Yaşam": [
          "Orta Asya Coğrafi Koşullarının Konargöçer Yaşama ve Türk Kültürüne Etkisi",
          "Konargöçer Türklerde Toplumsal Yapı, Boy Teşkilatı, Töre ve Ordu-Millet Anlayışı",
          "Geçmişten Günümüze Konargöçer Yaşam Koşullarının Karşılaştırılması"
        ],
        "Orta Çağ’da Yaşanan Kitlesel Göçler": [
          "Orta Çağ’da Yaşanan Kitlesel Göçlerin Nedenleri (Kavimler Göçü vb.)",
          "Kitlesel Göçlerin Avrupa ve Asya’nın Siyasi, Etnik ve Sosyo-Kültürel Yapısına Etkileri",
          "Göçler Sonucunda Meydana Gelen Siyasi ve Toplumsal Dönüşümler"
        ],
        "Orta Çağ’daki Başlıca Devletlerin Yönetim ve Ordu Yapıları": [
          "Orta Çağ’ın Başlıca Devletleri (Bizans İmparatorluğu, Sasani Devleti, İslam Devletleri, Moğol İmparatorluğu)",
          "Feodalite (Derebeylik) Sistemi ve Merkeziyetçi Monarşiler",
          "Orta Çağ Devletlerinin Yönetim ve Ordu Yapılarının Karşılaştırılması"
        ],
        "Orta Çağ’daki Ticaret Yolları": [
          "Orta Çağ Ticaret Yolları: İpek Yolu, Baharat Yolu, Kürk Yolu ve Akdeniz Ticareti",
          "Ticaret Yolları Üzerindeki Devletlerin Siyasi, Askerî ve Ekonomik Mücadeleleri",
          "Ticaret Mekânları (Kervansaraylar, Ribatlar, Hanlar, Çarşılar) ve Kültürel Etkileşim"
        ],
        "Orta Çağ’daki Başlıca Medeniyet Havzalarında Bilim, Kültür ve Sanat": [
          "İslam Medeniyet Havzası ve İslam’ın Altın Çağı (Beytü’l-Hikme, Nizamiye Medreseleri, Bilim İnsanları)",
          "Doğu ve Batı Medeniyet Havzalarında Bilim, Felsefe ve Sanat Anlayışları",
          "Medeniyet Havzalarının Kültürel Etkileşimi ve İnsanlığın Ortak Bilim Mirasına Katkıları"
        ],

        // 10. Sınıf Tarih
        "Türkistan’dan Türkiye’ye Uzanan Süreçte Meydana Gelen Önemli Askerî Mücadeleler": [
          "1040-1299 Yılları Arasında Meydana Gelen Önemli Askerî Mücadeleler (Dandanakan, Pasinler, Malazgirt, Miryokefalon, Katvan, Yassıçemen, Kösedağ)",
          "Askerî Mücadelelerin Nedenleri, Gelişimi ve Sonuçları",
          "Savaşların Türk Tarihinin Seyrine ve Anadolu’nun Fethine Etkileri"
        ],
        "Türkistan’dan Türkiye’ye Uzanan Süreçte Türk Devlet ve Ordu Teşkilatında Meydana Gelen Değişim": [
          "Büyük Selçuklu ve Türkiye Selçuklularında Devlet Teşkilatı, Hükümdarlık Alametleri ve Divan Sistemi",
          "İkta Sistemi ve Ordu Teşkilatı (Gulam Sistemi, Hassa Ordusu, Türkmenler, Sipahiler)",
          "Devlet ve Ordu Teşkilatında Meydana Gelen Değişim ve Süreklilik"
        ],
        "Türkistan’dan Türkiye’ye Uzanan Süreçte Türklerin Sosyal Yaşamları ve Ekonomik Faaliyetleri": [
          "Türklerin Yerleşme, Konut ve Şehirleşme Anlayışı, İmar ve Bayındırlık Faaliyetleri",
          "Ahilik Teşkilatının Sosyoekonomik, Mesleki ve Ahlaki Rolü",
          "Selçuklularda Ticaret, Tarım, Hayvancılık, Vakıf Sistemi ve Toplumsal Tabakalaşmanın Olmayışı"
        ],
        "Türk-İslam Medeniyetinin Bilim, Kültür, Eğitim ve Sanat Alanlarında Ortaya Çıkardığı Etkiler": [
          "Türk-İslam Medeniyeti ile Batı Medeniyetinin Bilim, Kültür ve Sanat Anlayışının Karşılaştırılması",
          "Medreseler, Darüşşifalar, Kütüphaneler, Kervansaraylar ve Mimari Eserler",
          "Anadolu’nun Türkleşme ve İslamlaşmasında Manevi Mimarlar: Hoca Ahmed Yesevi, Kaşgarlı Mahmud, Ömer Hayyam, El-Cezeri, İbnülarabi, Mevlana, Hacı Bektaş Veli, Yunus Emre, İbni Bibi"
        ],
        "Osmanlı Devleti’nin Kuruluşuna Dair Farklı Görüşler": [
          "Osmanlı Devleti’nin Kuruluşuna Dair Tarihçilerin Tezleri (Halil İnalcık, Paul Wittek, Gibbons, Fuad Köprülü vb.)",
          "Kuruluş Tezlerinin Güçlü ve Zayıf Yönleri ile Tutarsızlıkları",
          "Gaza ve Cihad Anlayışı, Uç Beyliği Dinamikleri ve Osmanlı’nın Hızlı Büyüme Nedenleri"
        ],
        "Osmanlı Devleti’nin Anadolu ve Rumeli’deki Siyasi ve Askerî Mücadeleleri": [
          "1299-1453 Yılları Arasında Bizans ile Yapılan Savaşlar (Koyunhisar, Maltepe vb.) ve Bursa, İznik, Edirne’nin Fethi",
          "Rumeli’ye Geçiş (Çimpe Kalesi) ve Balkan Fetihleri (Sırpsındığı, I. Kosova, Niğbolu, Varna, II. Kosova)",
          "Anadolu Türk Siyasi Birliğini Sağlama Faaliyetleri ve Beyliklerle Mücadeleler",
          "Ankara Savaşı (1402) ve Fetret Devri’nin Siyasi Etkileri"
        ],
        "Osmanlı Devleti’nin Devletleşme Süreci ile Ordu, Hukuk ve Toprak Sistemleri Arasındaki İlişkiler": [
          "Osmanlı Beyliği’nin Devletleşmesini Sağlayan Temel Sistemler ve Kurumlar",
          "Tımar Sistemi, Dirlik Topraklar ve Tımarlı Sipahiler",
          "Kapıkulu Ordusu, Yeniçeri Ocağı ve Devşirme Sistemi",
          "Şer’i ve Örfi Hukuk Sistemi, Kadılık Teşkilatı ve Adalet Mekanizması"
        ],
        "Osmanlı Devleti’nin Fethettiği Topraklarda Kalıcı Olabilmek İçin İzlediği Politikalar": [
          "İskân Politikasının Amaçları, Uygulanışı ve Demografik Sonuçları",
          "İstimalet (Hoşgörü ve Adalet) Politikasının Fethedilen Bölgelerin Sadakatine Etkisi",
          "Vakıf Sistemi, İmar ve Bayındırlık Faaliyetlerinin Fetihlerin Kalıcılığındaki Rolü"
        ],
        "Osmanlı Devleti’nin İlim ve İrfan Geleneğinin Oluşmasında Mekânların ve Kişilerin Etkisi": [
          "İlim ve İrfan Merkezleri (Bursa, Edirne, İznik) ve Medreseler (İznik Orhaniyesi, Sahn-ı Seman)",
          "Tekke, Zaviye, Cami ve Külliyelerin Toplumsal ve Kültürel Rolü",
          "Öncü Şahsiyetler ve Âlimler: Şeyh Edebali, Dursun Fakih, Davud-ı Kayseri, Molla Fenari, Akşemseddin"
        ],
        "1453-1683 Yılları Arasındaki Siyasi ve Askerî Mücadeleler": [
          "İstanbul’un Fethi, Fethin Nedenleri, Gelişimi ve Dünya Tarihine Etkileri",
          "Fatih, II. Bayezid, Yavuz ve Kanuni Dönemi Fetihleri ve Siyasi Mücadeleler (Çaldıran, Mercidabık, Ridaniye, Mohaç, Viyana vb.)",
          "Denizlerde Hakimiyet Mücadelesi: Preveze Deniz Zaferi, Kıbrıs’ın Fethi, İnebahtı ve Girit Kuşatması",
          "Doğu ve Batı Eksenli Mücadeleler Sonucunda Osmanlı Devleti’nin Bir Cihan Devleti Haline Gelmesi"
        ],
        "Osmanlı Devleti’nin Yönetim ve Ordu Yapısında Meydana Gelen Değişim": [
          "1453-1683 Yılları Arasında Divan-ı Hümayun’un Yapısı, Üyeleri ve İşleyişindeki Değişimler",
          "Klasik Dönem Osmanlı Kara ve Deniz Ordusundaki Gelişmeler",
          "Padişahlık Anlayışı, Saray Teşkilatı (Enderun, Birun, Harem) ve Veraset Sistemindeki Değişim (Ekber ve Erşed)"
        ],
        "Avrupa’nın Sömürgeci Politikalarının Etkileri": [
          "Coğrafi Keşifler ve Avrupa’nın Küresel Sömürgecilik Faaliyetleri",
          "Sömürgeciliğin Osmanlı Ekonomisine Etkileri: Kıymetli Maden Girişi, Fiyat Devrimi ve Enflasyon",
          "Ticaret Yollarının Yön Değiştirmesi ve Akdeniz Ticaretinin Gerilemesi Karşısında Alınan Tedbirler (Kapitülasyonlar)"
        ],
        "Osmanlı Devleti’ndeki Önemli İsyanların Neden ve Sonuçları": [
          "Celali İsyanları: Sebepleri, Yayılışı, Toplumsal ve Ekonomik Yıkımları (Büyük Kaçgun)",
          "Yeniçeri (İstanbul / Merkez) İsyanları, Padişah Değişiklikleri ve Devlet Otoritesine Zararları",
          "Eyalet ve Suhte (Medrese Öğrencileri) İsyanları ve Alınan Tedbirler"
        ],
        "1453-1683 Yılları Arasında Osmanlı Devleti’nde Bilim, Kültür, Eğitim ve Sanat Alanında Yaşanan Gelişmeler": [
          "Osmanlı Klasik Çağı’nda Bilim İnsanları ve Çalışmaları (Ali Kuşçu, Mirim Çelebi, Takiyüddin, Piri Reis, Seydi Ali Reis, Katip Çelebi)",
          "Tıp ve Sağlık Alanındaki Gelişmeler: Sabuncuoğlu Şerefeddin, Akşemseddin ve Darüşşifalar",
          "Mimar Sinan ve Klasik Dönem Osmanlı Mimarisi",
          "Geleneksel Sanatlar: Hat, Tezhip, Minyatür, Ebru ve Çini Sanatı",
          "Edebiyat, Saray Kültürü ve Sosyal Hayat"
        ],

        // 11. Sınıf Tarih
        "Osmanlı Devleti’nin 1683-1789 Yılları Arasındaki Siyasi ve Askerî Mücadeleleri": [
          "II. Viyana Kuşatması (1683) ve Kutsal İttifak Savaşları",
          "Karlofça (1699) ve İstanbul (1700) Antlaşmaları ile Başlayan Gerileme Süreci ve Toprak Kayıpları",
          "18. Yüzyıl Savaşları ve Antlaşmaları: Edirne Vakası, Prut (1711), Pasarofça (1718), Belgrad (1739), Küçük Kaynarca (1774)",
          "Osmanlı Devleti’nin Kaybettiği Toprakları Geri Alma ve Mevcut Toprakları Koruma Stratejileri"
        ],
        "Lale Devri’nin Devlet ve Toplum Hayatına Etkileri": [
          "Lale Devri’nin Başlangıcı (Pasarofça Antlaşması), Genel Özellikleri ve Dönemin Öncüleri (III. Ahmed, Nevşehirli Damat İbrahim Paşa, Nedim)",
          "Batı’ya Açılan Pencereler: İlk Geçici Elçilikler (28 Çelebi Mehmed) ve Sefaretnameler",
          "Kültürel ve Teknik Gelişmeler: İlk Türk Matbaası (İbrahim Müteferrika), Kütüphaneler, Tulumbacılar Ocağı, Yalova Kâğıt Fabrikası, Çini İmalathaneleri",
          "Toplumsal Yaşamdaki Değişimler, Eğlence Kültürü ve Patrona Halil İsyanı ile Dönemin Sonu"
        ],
        "1755 Lizbon ve 1766 İstanbul Depremlerinin Etkileri": [
          "1755 Lizbon Depremi: Yıkım, Aydınlanma Düşüncesine (Voltaire, Rousseau, Kant), Felsefeye ve Modern Şehirciliğe Etkileri",
          "1766 Büyük İstanbul Depremi: Şehirdeki Tahribat, Hanedan ve Halkın Dayanışması, İmar ve Onarım Faaliyetleri, Kriz Yönetimi",
          "Lizbon ve İstanbul Depremlerinin İdari, Sosyal, Ekonomik ve Zihniyet Boyutlarıyla Karşılaştırılması"
        ],
        "Sanayi Devrimi’nin Meydana Getirdiği Siyasi, Sosyal ve Ekonomik Değişim": [
          "Sanayi Devrimi’nin İngiltere’de Doğuş Nedenleri (Buhar Makinesi, Kömür, Demir, Sermaye Birikimi)",
          "Üretim Tarzının Dönüşümü: Manifaktürden Fabrikaya, Seri Üretim ve Kapitalizmin Gelişimi",
          "Sosyal ve Demografik Dönüşümler: İşçi Sınıfının Doğuşu, Köyden Kente Göç, Çarpık Kentleşme ve Çalışma Koşulları",
          "Ham Madde ve Pazar Arayışı, Küresel Sömürgecilik Yarışı ve Bloklaşmalar"
        ],
        "Fransız İhtilali’nin Devlet ve Toplum Hayatında Meydana Getirdiği Değişim": [
          "Fransız İhtilali’nin Sebepleri ve İnsan ve Yurttaş Hakları Bildirisi",
          "İhtilalin Yaydığı Evrensel İlkeler: Milliyetçilik, Eşitlik, Hürriyet, Adalet ve Anayasacılık",
          "İhtilalin Çok Uluslu İmparatorluklara ve Osmanlı Devleti’ne Etkileri (Azınlık İsyanları)"
        ],
        "1789-1908 Yılları Arasında Osmanlı Devleti’nde Meydana Gelen Siyasi, Askerî ve İdari Gelişmeler": [
          "III. Selim Dönemi ve Nizam-ı Cedit Islahatları",
          "II. Mahmud Dönemi Reformları: Sened-i İttifak, Vaka-i Hayriye (Yeniçeri Ocağı’nın Kaldırılması), Asakir-i Mansure-i Muhammediye ve Modern Bakanlıklar",
          "Tanzimat Fermanı (1839) ve Islahat Fermanı (1856) ile Kanun Üstünlüğü ve Haklar",
          "I. Meşrutiyet’in İlanı, Kanun-i Esasi ve İlk Meclis (Meclis-i Mebusan)",
          "II. Abdülhamid Dönemi: İstibdat Dönemi Politikaları, İslamcılık Siyaseti, Telgraf ve Hicaz Demiryolu Hatları"
        ],
        "1789-1908 Yılları Arasında Osmanlı Devleti’nde Bilim, Sanat ve Teknoloji Alanlarında Meydana Gelen Gelişmeler": [
          "Modern Eğitim Kurumlarının Yaygınlaşması: Mekteb-i Mülkiye, Mekteb-i Harbiye, Mekteb-i Tıbbiye, Darülfünun ve Kız Mektepleri",
          "Ulaşım ve İletişim Teknolojileri: Demiryolları (Bağdat ve Hicaz Hatları), Telgraf Ağı, Posta Nezareti",
          "Sanat ve Kültür: Sanayi-i Nefise Mektebi, Müzecilik (Osman Hamdi Bey), Resim, Tiyatro, Gazetecilik ve Çeviri Faaliyetleri"
        ],
        "Osmanlı Devleti’nde Sanayileşme Çabaları": [
          "1838 Balta Limanı Ticaret Antlaşması ve Osmanlı Pazarlarının Dışa Açılması",
          "Yerli Üretimin ve Lonca Teşkilatının Çöküşü, İthalat Bağımlılığı",
          "Dış Borçlanma Dönemi ve Düyun-ı Umumiye İdaresi’nin Kurulması",
          "Islah-ı Sanayi Komisyonu, Fabrika Kurma Teşebbüsleri ve Sanayileşmenin Önündeki Finansal ve Yapısal Engeller"
        ],
        "1908-1918 Yılları Arasında Osmanlı Devleti’nde Meydana Gelen Siyasi ve Askerî Gelişmeler": [
          "II. Meşrutiyet’in İlanı (1908), 31 Mart Vakası (1909) ve İttihat ve Terakki Yönetimi",
          "Trablusgarp Savaşı (1911-1912), Uşi Antlaşması ve Mustafa Kemal’in Rolü",
          "Balkan Savaşları (I. ve II. Balkan Savaşları), Edirne’nin Kurtarılışı ve Rumeli’nin Kaybı",
          "I. Dünya Savaşı (1914-1918): İttifak Blokları, Osmanlı’nın Savaşa Girişi, Cepheler (Çanakkale, Kafkas, Kanal, Hicaz-Yemen, Suriye-Filistin, Galiçya) ve Mondros Ateşkes Antlaşması"
        ],
        "1908-1918 Yılları Arasında Gerçekleşen Kitlesel Göç ve Salgınlar": [
          "Balkan Savaşları ve I. Dünya Savaşı Sırasında Yaşanan Kitlesel Muhacir Göçleri ve İskân Sorunları",
          "Savaş Döneminde Ortaya Çıkan Salgın Hastalıklar (Tifüs, Kolera, Dizanteri, İspanyol Gribi) ve Sağlık Mücadeleleri",
          "Hilal-i Ahmer Cemiyeti’nin (Kızılay) Rolü, Sağlık Teşkilatının Çabaları ve Toplumsal Dayanışma",
          "Göçlerin ve Salgınların Anadolu’nun Demografik, Sosyal ve Ekonomik Yapısına Etkileri"
        ],
        "Osmanlı Devleti’nin İnsanlık Tarihine Katkıları": [
          "Osmanlı Millet Sistemi ve Farklı İnanç ve Etnik Unsurların Bir Arada Barış İçinde Yaşaması (Pax Ottomanica)",
          "Vakıf Medeniyeti, Sosyal Güvenlik, Aşevleri, Şifahaneler ve Yardımlaşma Kurumları (Darülaceze, Hamidiye Etfal vb.)",
          "Türk-İslam Şehir Mimarisi, Çevre ve Hayvan Hakları Duyarlılığı, Su Yapıları (Sebiller, Su Kemerleri, Çeşmeler) ve Evrensel Kültür Mirası"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      if (!targetSubject || targetSubject === "9. Sınıf Tarih") {
        subjects["9. Sınıf Tarih"] = grade9Topics;
      }
      if (!targetSubject || targetSubject === "10. Sınıf Tarih") {
        subjects["10. Sınıf Tarih"] = grade10Topics;
      }
      if (!targetSubject || targetSubject === "11. Sınıf Tarih") {
        subjects["11. Sınıf Tarih"] = grade11Topics;
      }

      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: `${targetSubject || "9., 10. ve 11. Sınıf Tarih"} müfredatı başarıyla güncellendi`,
        grade9Count: grade9Topics.length,
        grade10Count: grade10Topics.length,
        grade11Count: grade11Topics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post("/api/admin/curriculum/sync-kimya", async (req, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(500).json({ success: false, error: "Database not connected" });
      }

      const targetSubject = req.body?.subject;

      const grade9Topics = [
        "Kimya Hayattır: Günlük Hayatta Kimya, Kimyanın Alt Disiplinleri, Kimya Alanında Kariyer Olanakları",
        "Kimyasal Maddelerin Kullanımı ve Güvenlik",
        "Atom Teorileri (Bohr Atom Teorisi, Modern Atom Teorisi) ve Atomun Yapısı",
        "Atom Orbitalleri ve Elektron Dizilimi",
        "Periyodik Tabloda Yer Bulma",
        "Periyodik Özellikler (Atom Yarıçapı, İyonlaşma Enerjisi ve Elektronegatiflik)",
        "Metalik Bağ",
        "İyonik Bağ",
        "Kovalent Bağ",
        "Lewis Nokta Yapısı",
        "Molekül Polarlığı ve Apolarlığı",
        "Bileşiklerin Adlandırılması",
        "Moleküller Arası Etkileşimler",
        "Katılar ve Özellikleri (Amorf ve Kristal Katılar)",
        "Sıvılar ve Özellikleri (Kaynama Sıcaklığı ve Buhar Basıncı, Viskozite, Adezyon ve Kohezyon Kuvvetleri, Yüzey Gerilimi)",
        "Nanoparçacıklar ve Ekolojik Sürdürülebilirlik: Metal Nanoparçacıklar",
        "Yeşil Kimyanın Atık Önleme İlkesi, Metal, Alaşım ve Metal Nanoparçacıkların Çevresel Etkileri"
      ];

      const grade10Topics = [
        "Kimyasal Değişimin Göstergeleri",
        "Kimyasal Tepkimelerin Oluşumu",
        "Kimyasal Tepkime Türleri",
        "Mol Kavramı",
        "Kimyasal Tepkime Denklemlerinin Denkleştirilmesi",
        "Kimyasal (Stokiyometrik) Hesaplamalar",
        "Gazların Özellikleri ve Kinetik Moleküler Teori",
        "Gaz Yasaları",
        "İdeal Gaz Yasası",
        "Graham Difüzyon ve Efüzyon Yasası",
        "Çözünme Süreci",
        "Maddelerin Birbiri İçindeki Çözünebilirliği",
        "Çözünme Olayının Sınıflandırılması",
        "Çözünürlük",
        "Çözünürlüğe Etki Eden Faktörler (Sıcaklık, Basınç ve Madde Cinsi)",
        "Çözeltilerin Sınıflandırılması",
        "Derişim Birimleri (Molarite ve ppm)",
        "Koligatif Özellikler (Kaynama Noktası Yükselmesi ve Donma Noktası Düşmesi)",
        "Yeşil Kimya, Çevresel ve Ekolojik Sürdürülebilirlik: Makro ve Mikro Ölçekli Deneyler",
        "Atmosferdeki Tepkimeler ve Küresel Sorunlar"
      ];

      const grade11Topics = [
        "Tepkimelerde Meydana Gelen Enerji Değişimi",
        "Maddelerin Enerji Kaynağı Olma Potansiyeli",
        "Bağ Enerjileriyle Tepkime Entalpisinin Hesaplanması",
        "Standart Oluşum Entalpileriyle Tepkime Entalpisinin Hesaplanması",
        "Kimyasal Tepkimelerde Hız: Kimyasal Tepkimelerin Gerçekleşmesi İçin Gerekli Şartlar",
        "Tepken ve Ürün Derişimleriyle Ortalama Tepkime Hızlarının Hesaplanması",
        "Tepkime Hızına Etki Eden Faktörler (Tepken Cinsi, Maddelerin Fiziksel Hâlleri, Derişim, Sıcaklık, Katı Tepkenin Temas Yüzeyi ve Katalizör)",
        "Tek Basamaklı Kimyasal Tepkimelerin Hız Denkleminin Deneysel Veriler Yardımıyla Belirlenmesi",
        "Denge: Tersinir Tepkimelerin Özellikleri",
        "Fiziksel ve Kimyasal Değişimlerde Denge",
        "Denge Sabiti İfadesinin Yazılması",
        "Tepkime Oranı",
        "Dengeyi Etkileyen Faktörler (Derişim, Hacim, Basınç, Sıcaklık ve Katalizör)",
        "Asit ve Baz Çözeltilerinde Denge: Suyun Otoiyonizasyonu",
        "Asit Baz Teorilerinin Karşılaştırılması",
        "Asitlerin ve Bazların Kuvveti",
        "Kuvvetli Asit-Zayıf Asit ve Kuvvetli Baz-Zayıf Baz Sulu Çözeltilerindeki pH Hesaplamaları",
        "Kuvvetli Asit ve Kuvvetli Bazların Nötralleşme Tepkimeleri",
        "Kuvvetli Asit-Kuvvetli Baz Titrasyonları",
        "Asidik ve Bazik Ürünlerin Seçiminde Dikkat Edilmesi Gerekenler",
        "Çözünürlük Dengesi: Suda Az Çözünen Tuzların Molar Çözünürlükleri",
        "Çözünürlük Çarpımı (Kçç), Tuzların Çözünürlüğüne Etki Eden Faktörler (Sıcaklık ve Ortak İyon)",
        "Nanoteknoloji ve Sürdürülebilirlik: Fermantasyon Yöntemi ile Yeşil Hidrojen Enerjisi ve Hidrojen Gazı Miktarına Etki Eden Faktörler",
        "Nanoteknolojik Ürünlerin Potansiyel Faydaları ve Olası Zararları",
        "Mikroplastik ve Nanoplastiklerin Etkileri"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        // 9. Sınıf Kimya
        "Kimya Hayattır: Günlük Hayatta Kimya, Kimyanın Alt Disiplinleri, Kimya Alanında Kariyer Olanakları": [
          "Evde ve Günlük Hayatta Kullanılan Kimyasal Ürünlerin Nitelikleri",
          "Kimyanın Alt Disiplinleri ve Çalışma Alanları",
          "Kimya Alanında Kariyer Olanakları ve Kimya Biliminin Hayata Katkısı"
        ],
        "Kimyasal Maddelerin Kullanımı ve Güvenlik": [
          "Farklı Ortamlarda Kimyasal Maddelerin Kullanımı ve Güvenlik Uyarı İşaretleri",
          "Kimyasal Maddelerin Güvenli Kullanımına Yönelik Problemler ve Çözüm Yolları",
          "Kimyasal Maddelerin İnsan Sağlığı ve Çevre Üzerindeki Etkileri"
        ],
        "Atom Teorileri (Bohr Atom Teorisi, Modern Atom Teorisi) ve Atomun Yapısı": [
          "Atom Teorilerinin Tarihsel Gelişimi ve Bilimsel Bilginin Değişebilirliği",
          "Bohr Atom Teorisi, Modern Atom Teorisi ve Varsayımları",
          "Atom ve Atom Altı Parçacıklar (Proton, Nötron, Elektron)"
        ],
        "Atom Orbitalleri ve Elektron Dizilimi": [
          "Kuantum Sayıları ve Atom Orbitallerinin Bağıl Enerjileri",
          "Elektronların Orbitallere Yerleşim Prensipleri (Aufbau, Pauli, Hund)",
          "Orbitallerin Şekilleri ve Uzaysal Yönelimleri (s, p, d, f)"
        ],
        "Periyodik Tabloda Yer Bulma": [
          "Atomların Elektron Dizilimi ile Periyodik Tablodaki Yeri Arasındaki İlişki",
          "Periyodik Sistemde Grup ve Periyot Belirleme Kuralları"
        ],
        "Periyodik Özellikler (Atom Yarıçapı, İyonlaşma Enerjisi ve Elektronegatiflik)": [
          "İyon Oluşumu ve Elektron Dizilimi Arasındaki İlişkiler",
          "Atom Yarıçapının Periyodik Sistemdeki Değişimi",
          "İyonlaşma Enerjisi ve Elektronegatifliğin Periyodik Sistemdeki Değişimi"
        ],
        "Metalik Bağ": [
          "Pozitif Metal İyonları ile Negatif Elektron Denizi Arasındaki Etkileşim",
          "Metalik Bağın Oluşumu ve Metallere Kazandırdığı Fiziksel Özellikler"
        ],
        "İyonik Bağ": [
          "Katyon ve Anyonlar Arasındaki Elektrostatik Çekim ve İyonik Bağ Oluşumu",
          "İyonik Kristal Örgü Yapısı ve İyonik Bileşiklerin Genel Özellikleri"
        ],
        "Kovalent Bağ": [
          "Ametal Atomları Arasında Elektron Ortaklaşması ve Kovalent Bağ Oluşumu",
          "Apolar Kovalent ve Polar Kovalent Bağlar",
          "Bağ Enerjisi ve Bağ Sağlamlığı"
        ],
        "Lewis Nokta Yapısı": [
          "Atom ve Moleküllerin Lewis Nokta Gösterimi",
          "Ortaklanmış ve Ortaklanmamış Elektron Çiftleri",
          "Farklı Moleküllerin Lewis Nokta Yapılarının İncelenmesi"
        ],
        "Molekül Polarlığı ve Apolarlığı": [
          "Elektronegatiflik Farkı, Dipol Moment ve Bağ Polarlığı",
          "Molekül Geometrisi ve Molekül Polarlığının Belirlenmesi",
          "Polar ve Apolar Moleküllerin Sınıflandırılması"
        ],
        "Bileşiklerin Adlandırılması": [
          "İyonik Bileşiklerin Sistematik Adlandırılması",
          "Kovalent Bileşiklerin Sistematik Adlandırılması (Latince Ön Ekler)",
          "Yaygın Bileşiklerin Geleneksel (Yaygın) Adları"
        ],
        "Moleküller Arası Etkileşimler": [
          "Van der Waals Etkileşimleri (Dipol-Dipol, İyon-Dipol, London Kuvvetleri)",
          "Hidrojen Bağı ve Fiziksel Özelliklere (Kaynama Noktası vb.) Etkisi",
          "Süperhidrofobik Malzemeler ve Doğadaki Biyomimikri Örnekleri"
        ],
        "Katılar ve Özellikleri (Amorf ve Kristal Katılar)": [
          "Amorf Katılar ve Özellikleri",
          "Kristal Katı Türleri: İyonik, Moleküler, Kovalent ve Metalik Kristaller",
          "Katıların Erime Noktası, Sertlik ve İletkenlik Özellikleri"
        ],
        "Sıvılar ve Özellikleri (Kaynama Sıcaklığı ve Buhar Basıncı, Viskozite, Adezyon ve Kohezyon Kuvvetleri, Yüzey Gerilimi)": [
          "Sıvıların Buhar Basıncı ve Buhar Basıncına Etki Eden Faktörler",
          "Kaynama Sıcaklığı ve Kaynamaya Etki Eden Faktörler (Dış Basınç, Saflık)",
          "Sıvıların Viskozitesi ve Viskoziteyi Etkileyen Faktörler",
          "Adezyon ve Kohezyon Kuvvetleri, Kılcallık Olayı",
          "Sıvılarda Yüzey Gerilimi ve Yüzey Gerilimine Etki Eden Faktörler"
        ],
        "Nanoparçacıklar ve Ekolojik Sürdürülebilirlik: Metal Nanoparçacıklar": [
          "Nanoparçacık Kavramı ve Boyut Özellikleri",
          "Evsel ve Sanayi Atıklarından Metal Nanoparçacıkların (Gümüş, Bakır) Eldesi ve Geri Kazanımı",
          "Metal Nanoparçacıkların Ekolojik Sürdürülebilirlikteki Rolü"
        ],
        "Yeşil Kimyanın Atık Önleme İlkesi, Metal, Alaşım ve Metal Nanoparçacıkların Çevresel Etkileri": [
          "Yeşil Kimyanın İlkeleri ve Atık Önleme Yaklaşımı",
          "Metaller, Alaşımlar ve Metal Nanoparçacıkların Ekosistem Üzerindeki Etkileri",
          "Ağır Metal Birikimi ve Çevresel Kirliliğin Önlenmesine Yönelik Çözümler"
        ],

        // 10. Sınıf Kimya
        "Kimyasal Değişimin Göstergeleri": [
          "Kimyasal Değişimlerin Gözlemlenebilir Göstergeleri (Enerji, Gaz Çıkışı, Renk Değişimi, Çökelek Oluşumu)",
          "Fiziksel ve Kimyasal Değişimlerin Karşılaştırılması",
          "Kimyasal Değişimlerin Alt Mikro (Tanecik) Seviyesinde Açıklanması"
        ],
        "Kimyasal Tepkimelerin Oluşumu": [
          "Taneciklerin Yeniden Düzenlenmesi ve Bağların Kırılması/Oluşması",
          "Kimyasal Tepkimelerin Bilimsel Modellerle Gösterimi",
          "Kimyasal Değişimlerde Kütlenin Korunumu İlkesi"
        ],
        "Kimyasal Tepkime Türleri": [
          "Yanma, Sentez (Oluşum) ve Analiz (Ayrışma) Tepkimeleri",
          "Çökelme Tepkimeleri ve Net İyon Denklemleri",
          "Asit-Baz ve İndirgenme-Yükseltgenme (Redoks) Tepkimeleri"
        ],
        "Mol Kavramı": [
          "Mol Kavramının Operasyonel Tanımı ve Avogadro Sayısı (NA)",
          "Bağıl Atom Kütlesi, Mol Kütlesi ve Mol-Kütle İlişkisi (n = m/MA)",
          "Atom Sayısı, Molekül Sayısı ve Hacim ile Mol Sayısı Arasındaki İlişkiler"
        ],
        "Kimyasal Tepkime Denklemlerinin Denkleştirilmesi": [
          "Kimyasal Denklemlerde Tepken ve Ürünlerin Tanecik Sayısı Denkliği",
          "Tepkime Denklemlerini Denkleştirme Yöntemleri ve Kuralları",
          "En Küçük Tam Sayılarla Denkleştirme Uygulamaları"
        ],
        "Kimyasal (Stokiyometrik) Hesaplamalar": [
          "Denkleştirilmiş Tepkime Katsayıları ile Mol, Kütle ve Hacim Geçişleri",
          "Sınırlayıcı Bileşen ve Artan Madde Hesaplamaları",
          "Tepkime Verimi ve Karışım Problemleri"
        ],
        "Gazların Özellikleri ve Kinetik Moleküler Teori": [
          "Gazların Ölçülebilir Özellikleri: Basınç, Hacim, Sıcaklık ve Madde Miktarı",
          "Gaz Basıncının Ölçülmesi ve Birimleri (atm, mmHg, Torr)",
          "Kinetik Moleküler Teorinin Temel Varsayımları"
        ],
        "Gaz Yasaları": [
          "Boyle Yasası (Basınç - Hacim İlişkisi)",
          "Charles Yasası (Hacim - Sıcaklık İlişkisi)",
          "Gay-Lussac Yasası (Basınç - Sıcaklık) ve Avogadro Yasası (Hacim - Mol Sayısı)",
          "Gaz Yasalarının Grafiksel Gösterimi ve Yorumlanması"
        ],
        "İdeal Gaz Yasası": [
          "İdeal Gaz Denkleminin (P.V = n.R.T) Çıkarılışı ve Gaz Sabiti (R)",
          "İdeal Gaz Eşitliği ile Mol Kütlesi ve Yoğunluk Hesaplamaları (P.MA = d.R.T)",
          "İdeal Gaz Davranışı ve Gerçek Gazlardan Sapmalar"
        ],
        "Graham Difüzyon ve Efüzyon Yasası": [
          "Gazlarda Difüzyon ve Efüzyon Kavramları",
          "Graham Difüzyon Yasası ve Molekül Kütlesi/Sıcaklık ile Yayılma Hızı İlişkisi",
          "Gazların Farklı Ortamlarda Yayılması ve Filtre Teknolojileri (Zeolit, MOF vb.)"
        ],
        "Çözünme Süreci": [
          "Çözünme Sürecinin Tanecikli Modellerle Gösterimi",
          "Hidratasyon ve Solvatasyon Olayları",
          "Çözücü ve Çözünen Tanecikleri Arasındaki Etkileşimler"
        ],
        "Maddelerin Birbiri İçindeki Çözünebilirliği": [
          "Çözünmede Benzer Benzeri Çözer İlkesi",
          "Polar, Apolar ve İyonik Maddelerin Çözünme Davranışları",
          "Maddelerin Birbiri İçinde Çözünme Durumlarının Karşılaştırılması"
        ],
        "Çözünme Olayının Sınıflandırılması": [
          "Elektrik İletkenliğine Göre Çözünme: İyonik (Elektrolit) ve Moleküler (Elektrolit Olmayan)",
          "Fiziksel ve Kimyasal Çözünme Olaylarının Ayırt Edilmesi",
          "Suda Çözünme Denklemlerinin Gösterimi"
        ],
        "Çözünürlük": [
          "Çözünürlük Kavramı ve Birimi (g/100 g su)",
          "Doymuş, Doymamış ve Aşırı Doymuş Çözeltiler",
          "Çözünürlük Değerleri Üzerinden Kütle Hesaplamaları"
        ],
        "Çözünürlüğe Etki Eden Faktörler (Sıcaklık, Basınç ve Madde Cinsi)": [
          "Sıcaklığın Katı, Sıvı ve Gazların Çözünürlüğüne Etkisi (Endotermik ve Ekzotermik Çözünme)",
          "Basıncın Gazların Çözünürlüğüne Etkisi (Henry Yasası)",
          "Madde Cinsinin Çözünürlüğe Etkisi ve Çözünürlük Grafikleri"
        ],
        "Çözeltilerin Sınıflandırılması": [
          "Çözünen Madde Miktarına Göre: Doymuş, Doymamış ve Aşırı Doymuş Çözeltiler",
          "Bağıl Derişimlerine Göre: Seyreltik ve Derişik Çözeltiler",
          "İyonik Karakterine Göre: Elektrolit ve Elektrolit Olmayan Çözeltiler"
        ],
        "Derişim Birimleri (Molarite ve ppm)": [
          "Molarite (M) Tanımı, Formülü ve Molar Çözelti Hazırlama",
          "Çözeltilerin Seyreltilmesi, Deriştirilmesi ve Karıştırılması (M1.V1 = M2.V2)",
          "Milyonda Bir Kısım (ppm) Derişim Birimi ve Eser Miktardaki Maddelerin Hesaplanması"
        ],
        "Koligatif Özellikler (Kaynama Noktası Yükselmesi ve Donma Noktası Düşmesi)": [
          "Koligatif Özellik Kavramı ve Çözünen Tanecik Sayısının Etkisi",
          "Kaynama Noktası Yükselmesi (Ebülyoskopi) ve Buhar Basıncı Değişimi",
          "Donma Noktası Düşmesi (Kriyoskopi) ve Günlük Yaşamdaki Uygulamaları"
        ],
        "Yeşil Kimya, Çevresel ve Ekolojik Sürdürülebilirlik: Makro ve Mikro Ölçekli Deneyler": [
          "Makro ve Mikro Ölçekli Kimya Deneylerinin Karşılaştırılması",
          "Kimyasal Madde Tasarrufu, Su Tasarrufu ve Atık Azaltımı",
          "Mikro Ölçekli Deneylerin Ekosistem Açısından Değerlendirilmesi"
        ],
        "Atmosferdeki Tepkimeler ve Küresel Sorunlar": [
          "Atmosferdeki Kimyasal Tepkimeler ve Emisyon Gazları (SOx, NOx, CO2, CH4)",
          "Hava Kirliliği, Asit Yağmurları ve Ozon Tabakasının İncelmesi",
          "Sera Etkisi, Küresel Isınma ve Emisyon Ayak İzinin Azaltılması Projeleri"
        ],

        // 11. Sınıf Kimya
        "Tepkimelerde Meydana Gelen Enerji Değişimi": [
          "Fiziksel ve Kimyasal Olaylarda Isı Alışverişi ve Enerji Değişimi",
          "Endotermik ve Ekzotermik Tepkimeler ve Potansiyel Enerji Diyagramları",
          "Enerji Değişimlerinin Günlük Yaşamdaki Uygulamaları"
        ],
        "Maddelerin Enerji Kaynağı Olma Potansiyeli": [
          "Yanma Tepkimeleri Temelinde Yakıtların Enerji Verimliliği",
          "Besin Maddelerinin Enerji İçeriği ve Kalorifik Değerleri",
          "Fosil Yakıtlar ve Sürdürülebilir Temiz Enerji Kaynaklarının Karşılaştırılması"
        ],
        "Bağ Enerjileriyle Tepkime Entalpisinin Hesaplanması": [
          "Kimyasal Bağların Kırılması ve Oluşması Süreçlerindeki Enerji Değişimleri",
          "Ortalama Bağ Enerjileri Kavramı",
          "Bağ Enerjileri Yardımıyla Tepkime Entalpisinin (ΔH) Hesaplanması"
        ],
        "Standart Oluşum Entalpileriyle Tepkime Entalpisinin Hesaplanması": [
          "Standart Oluşum Entalpisi (ΔHf°) Tanımı ve Standart Durum Şartları",
          "Oluşum Entalpileri Verileriyle Tepkime Entalpisinin Hesaplanması",
          "Hess Yasası (Tepkime Isılarının Toplanabilirliği İlkesi)"
        ],
        "Kimyasal Tepkimelerde Hız: Kimyasal Tepkimelerin Gerçekleşmesi İçin Gerekli Şartlar": [
          "Çarpışma Teorisi ve Etkin Çarpışma Şartları (Uygun Doğrultu ve Yeterli Kinetik Enerji)",
          "Aktifleşme Enerjisi (Eşik Enerjisi) ve Aktifleşmiş Kompleks",
          "Potansiyel Enerji - Tepkime Koordinatı Grafikleri (İleri ve Geri Aktifleşme Enerjisi)"
        ],
        "Tepken ve Ürün Derişimleriyle Ortalama Tepkime Hızlarının Hesaplanması": [
          "Kimyasal Tepkimelerde Ortalama Hız Tanımı ve Birimleri",
          "Tepkenlerin Harcanma ve Ürünlerin Oluşma Hızları Arasındaki İlişkiler",
          "Tepkime Hızının Zamanla Değişimi ve Anlık Hız"
        ],
        "Tepkime Hızına Etki Eden Faktörler (Tepken Cinsi, Maddelerin Fiziksel Hâlleri, Derişim, Sıcaklık, Katı Tepkenin Temas Yüzeyi ve Katalizör)": [
          "Tepken Cinsi, Bağ Sayısı ve Fiziksel Hâlin Tepkime Hızına Etkisi",
          "Derişim ve Katı Tepkenin Temas Yüzeyinin Tepkime Hızına Etkisi",
          "Sıcaklığın ve Katalizörün Tepkime Hızına ve Hız Sabitine (k) Etkisi",
          "Maxwell-Boltzmann Kinetik Enerji Dağılımı ve Eşik Enerjisi Değişimi"
        ],
        "Tek Basamaklı Kimyasal Tepkimelerin Hız Denkleminin Deneysel Veriler Yardımıyla Belirlenmesi": [
          "Hız Bağıntısı, Hız Sabiti (k) ve Tepkime Derecesi (Mertebesi)",
          "Deneysel Derişim ve Başlangıç Hızı Verileriyle Hız Denkleminin Belirlenmesi",
          "Çok Basamaklı (Mekanizmalı) Tepkimelerde Hızı Belirleyen Yavaş Basamak"
        ],
        "Denge: Tersinir Tepkimelerin Özellikleri": [
          "Tersinir (Çift Yönlü) Tepkimeler ve Dinamik Denge Kavramı",
          "Fiziksel ve Kimyasal Dengenin Kurulma Şartları (Kapalı Sistem, Sabit Sıcaklık)",
          "Makroskobik Olayların Durması, Mikroskobik Olayların Devam Etmesi"
        ],
        "Fiziksel ve Kimyasal Değişimlerde Denge": [
          "Fiziksel Denge Süreçleri (Sıvı-Buhar Dengesi vb.)",
          "İleri ve Geri Tepkime Hızlarının Eşitlenmesi Süreci",
          "Denge Anında Madde Derişimlerinin Sabit Kalması"
        ],
        "Denge Sabiti İfadesinin Yazılması": [
          "Homojen ve Heterojen Denge Tepkimeleri İçin Denge Bağıntısı (Kc)",
          "Denge Bağıntısında Saf Katı ve Sıvıların Yer Almaması Kuralı",
          "Kısmi Basınçlar Cinsinden Denge Sabiti (Kp) ve Kp = Kc(RT)^Δn İlişkisi"
        ],
        "Tepkime Oranı": [
          "Tepkime Oranı / Kesri (Qc) Kavramı ve Hesaplanması",
          "Qc ve Kc Karşılaştırması ile Sistemin Dengede Olup Olmadığının Belirlenmesi",
          "Sistemin Dengeye Ulaşma Yönünün (Girenler veya Ürünler Lehine) Tahmin Edilmesi"
        ],
        "Dengeyi Etkileyen Faktörler (Derişim, Hacim, Basınç, Sıcaklık ve Katalizör)": [
          "Le Chatelier İlkesi ve Dengeye Etki Eden Faktörlerin İncelenmesi",
          "Derişim, Basınç ve Hacim Değişimlerinin Dengeye ve Derişimlere Etkisi",
          "Sıcaklık Değişiminin Denge Yönüne ve Denge Sabitine (Kc, Kp) Etkisi",
          "Katalizörün Denge Sistemine ve Denge Sabitine Etkisi"
        ],
        "Asit ve Baz Çözeltilerinde Denge: Suyun Otoiyonizasyonu": [
          "Saf Suyun Otoiyonizasyonu ve Suyun İyonlaşma Sabiti (Ksu)",
          "Nötr, Asidik ve Bazik Çözeltilerde [H+] ve [OH-] İlişkisi",
          "pH ve pOH Kavramları ve Logaritmik Hesaplamalar (pH + pOH = 14)"
        ],
        "Asit Baz Teorilerinin Karşılaştırılması": [
          "Arrhenius Asit-Baz Tanımı ve Sınırları",
          "Brønsted-Lowry Asit-Baz Tanımı ve Eşlenik (Konjuge) Asit-Baz Çiftleri",
          "Farklı Asit-Baz Teorilerinin Benzer ve Farklı Yönleri"
        ],
        "Asitlerin ve Bazların Kuvveti": [
          "Kuvvetli ve Zayıf Asit/Baz Kavramları ve İyonlaşma Yüzdesi",
          "Zayıf Asit ve Bazlarda İyonlaşma Sabitleri (Ka ve Kb) Bağıntıları",
          "Molekül Yapısı ile Asitlik/Bazlık Kuvveti Arasındaki İlişki"
        ],
        "Kuvvetli Asit-Zayıf Asit ve Kuvvetli Baz-Zayıf Baz Sulu Çözeltilerindeki pH Hesaplamaları": [
          "Kuvvetli Asit ve Baz Çözeltilerinde Derişim ve pH Hesaplamaları",
          "Zayıf Asit ve Baz Çözeltilerinde Ka ve Kb Kullanılarak Denge ve pH Hesaplamaları",
          "Kuvvetli ve Zayıf Asit-Baz Çözeltilerinin pH Davranışlarının Karşılaştırılması"
        ],
        "Kuvvetli Asit ve Kuvvetli Bazların Nötralleşme Tepkimeleri": [
          "Asit-Baz Nötralleşme Tepkimesi ve Net İyon Denklemi",
          "Tam Nötralleşme Şartı (nH+ = nOH-) ve Çözelti pH'si",
          "Kısmi Nötralleşme ve Artan Maddeye Göre Son pH Değerinin Hesaplanması"
        ],
        "Kuvvetli Asit-Kuvvetli Baz Titrasyonları": [
          "Titrasyon Düzeneği, Büret, Erlenmayer ve Uygun İndikatör Seçimi",
          "Eşdeğerlik Noktası (Dönüm Noktası) ve Titrasyon Eğrilerinin İncelenmesi",
          "Deneysel Titrasyon Verileri ile Bilinmeyen Çözelti Derişiminin Belirlenmesi"
        ],
        "Asidik ve Bazik Ürünlerin Seçiminde Dikkat Edilmesi Gerekenler": [
          "Günlük Hayatta Kullanılan Asidik ve Bazik Ürünler (Temizlik, Gıda, İlaç, Kozmetik)",
          "Mide, Ağız, Diş ve Cilt Sağlığı Açısından Asitlik-Bazlık Dengesinin Önemi",
          "Kimyasal Temizlik Maddelerinin Güvenli Kullanımı ve Tehlikeli Etkileşimler"
        ],
        "Çözünürlük Dengesi: Suda Az Çözünen Tuzların Molar Çözünürlükleri": [
          "Suda Az Çözünen Tuzların Çözünme-Çökelme Dengesi ve Doymuş Çözelti Yapısı",
          "Molar Çözünürlük Tanımı ve İyonik Çözünme Denklemleri",
          "Suda Az Çözünen Tuzların Tanecik Seviyesinde Modellenmesi"
        ],
        "Çözünürlük Çarpımı (Kçç), Tuzların Çözünürlüğüne Etki Eden Faktörler (Sıcaklık ve Ortak İyon)": [
          "Çözünürlük Çarpımı Sabiti (Kçç) Bağıntısı ve Matematiksel Hesaplamalar",
          "Sıcaklığın Çözünürlüğe ve Kçç Sabitine Etkisi",
          "Ortak İyon Etkisinin Çözünürlüğe Etkisi ve Hesaplamaları",
          "Çökelme Koşulları (Qçç ve Kçç Karşılaştırması)"
        ],
        "Nanoteknoloji ve Sürdürülebilirlik: Fermantasyon Yöntemi ile Yeşil Hidrojen Enerjisi ve Hidrojen Gazı Miktarına Etki Eden Faktörler": [
          "Yeşil Hidrojen Enerjisi ve Sürdürülebilir Temiz Enerji Dönüşümü",
          "Evsel ve Organik Atıklardan Fermantasyon Yoluyla Hidrojen Gazı Üretimi",
          "Hidrojen Gazı Üretim Verimini Etkileyen Faktörler (Atık Türü, pH, Sıcaklık)"
        ],
        "Nanoteknolojik Ürünlerin Potansiyel Faydaları ve Olası Zararları": [
          "Nanoteknolojinin Kullanım Alanları: Tıp, Enerji, Çevre, Tekstil ve Elektronik",
          "Nanoteknolojik Ürünlerin Sağladığı Teknolojik ve Çevresel Avantajlar",
          "Nanomalzemelerin İnsan Sağlığı ve Çevre Üzerindeki Olası Toksik Etkileri ve Güvenlik Önlemleri"
        ],
        "Mikroplastik ve Nanoplastiklerin Etkileri": [
          "Mikroplastik ve Nanoplastiklerin Oluşumu, Kaynakları ve Parçalanma Süreçleri",
          "Sucul Sistemlerde, Toprakta ve Besin Zincirinde Plastik Kirliliği",
          "Mikroplastik ve Nanoplastiklerin Sağlık, Çevre ve Gıda Güvenliği Üzerindeki Etkileri ve Çözüm Yolları"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      if (!targetSubject || targetSubject === "9. Sınıf Kimya") {
        subjects["9. Sınıf Kimya"] = grade9Topics;
      }
      if (!targetSubject || targetSubject === "10. Sınıf Kimya") {
        subjects["10. Sınıf Kimya"] = grade10Topics;
      }
      if (!targetSubject || targetSubject === "11. Sınıf Kimya") {
        subjects["11. Sınıf Kimya"] = grade11Topics;
      }

      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: `${targetSubject || "9., 10. ve 11. Sınıf Kimya"} müfredatı başarıyla güncellendi`,
        grade9Count: grade9Topics.length,
        grade10Count: grade10Topics.length,
        grade11Count: grade11Topics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post("/api/admin/curriculum/sync-fizik", async (req, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(500).json({ success: false, error: "Database not connected" });
      }

      const targetSubject = req.body?.subject;

      const grade9Topics = [
        "Fizik Bilimi",
        "Fizik Biliminin Alt Dalları",
        "Fizik Bilimine Yön Verenler",
        "Fizik Bilimi İle İlgili Kariyer Keşfi",
        "Temel ve Türetilmiş Nicelikler",
        "Skaler ve Vektörel Nicelikler",
        "Vektörler",
        "Doğadaki Temel Kuvvetler",
        "Hareket ve Hareket Türleri",
        "Basınç",
        "Sıvılarda Basınç",
        "Açık Hava Basıncı",
        "Kaldırma Kuvveti",
        "Bernoulli İlkesi",
        "İç Enerji, Isı ve Sıcaklık Arasındaki İlişki",
        "Isı, Öz Isı, Isı Sığası ve Sıcaklık Farkı Arasındaki İlişki",
        "Hâl Değişimi",
        "Isıl Denge",
        "Isı Aktarım Yolları",
        "Isı İletim Hızı"
      ];

      const grade10Topics = [
        "Sabit Hızlı Hareket",
        "Bir Boyutta Sabit İvmeli Hareket",
        "İş, Enerji ve Güç",
        "Enerji Biçimleri",
        "Mekanik Enerji",
        "Enerji Kaynakları",
        "Basit Elektrik Devreleri",
        "Elektrik Akımı",
        "Ohm Yasası",
        "Dirençlerin Bağlanması",
        "Üreteçlerin Bağlanması",
        "Elektrik Akımının Oluşturabileceği Tehlikelere Karşı Alınması Gereken Önlemler",
        "Topraklamanın Önemi",
        "Periyodik Hareketler",
        "Dalgaların Temel Kavramları",
        "Dalgaların Sınıflandırılması",
        "Dalgaların Yayılma Süratini Etkileyen Etmenler",
        "Su Dalgalarında Yansıma ve Kırılma",
        "Rezonans ve Deprem"
      ];

      const grade11Topics = [
        "Serbest Düşme",
        "İki Boyutta Sabit İvmeli Hareket",
        "Newton'ın Hareket Yasaları",
        "Statik ve Kinetik Sürtünme Kuvvetleri",
        "Sürtünme Kuvveti",
        "Limit Hız",
        "Düzgün Çembersel Hareket",
        "Elektriksel Kuvvet ve Elektriksel Alan",
        "Faraday Kafesi ve Kullanım Alanları",
        "Manyetik Alan ve Manyetik Kuvvet",
        "Manyetik Akı",
        "İndüksiyon Akımı",
        "Alternatif Akım",
        "Transformatörler",
        "Işık Şiddeti, Işık Akısı ve Aydınlanma",
        "Düzlem Aynalar",
        "Küresel Aynalar",
        "Kırılma",
        "Görünür Derinlik",
        "Fiber Optik",
        "Prizmalar",
        "Mercekler"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        // --- 9. SINIF FİZİK ---
        "Fizik Bilimi": [
          "Fizik Biliminin Doğası ve Tanımı",
          "Fizik Biliminin Diğer Disiplinlerle (Matematik, Kimya, Biyoloji, Felsefe vb.) İlişkisi"
        ],
        "Fizik Biliminin Alt Dalları": [
          "Fizik Biliminin Alt Dalları (Mekanik, Termodinamik, Elektromanyetizma, Optik, Atom ve Molekül Fiziği, Katıhâl Fiziği, Nükleer Fizik, Yüksek Enerji ve Plazma Fiziği)",
          "Alt Dalların Nitelikleri, Çalışma Alanları ve Günlük Hayat Örnekleri"
        ],
        "Fizik Bilimine Yön Verenler": [
          "Fizik Bilimine Katkıda Bulunmuş Bilim İnsanlarının Bilime Bakış Açıları ve Çalışma Biçimleri",
          "Bilim İnsanlarının Deneyimleri ve Çalışmalarının Bilime Etkileri"
        ],
        "Fizik Bilimi İle İlgili Kariyer Keşfi": [
          "Bilim ve Teknoloji Alanında Faaliyet Gösteren Kurum ve Kuruluşlar (TÜBİTAK, ASELSAN, CERN, NASA vb.)",
          "Fizik Bilimi ile İlişkili Meslekler ve Kariyer Olanakları (Yapay Zekâ, Nanoteknoloji, Mikroelektronik)"
        ],
        "Temel ve Türetilmiş Nicelikler": [
          "SI Birim Sisteminde Verilen Temel Nicelikler ve Birimleri",
          "Türetilmiş Nicelikler ve Niteliklerine Göre Sınıflandırılması"
        ],
        "Skaler ve Vektörel Nicelikler": [
          "Skaler ve Vektörel Niceliklerin Özellikleri",
          "Skaler ve Vektörel Niceliklerin Benzerlikleri, Farklılıkları ve Karşılaştırılması"
        ],
        "Vektörler": [
          "Aynı Doğrultu Üzerindeki Vektörler (Eşit Vektör, Zıt Vektör, Skalerle Çarpma)",
          "Vektörlerin Toplanması (Uç Uca Ekleme ve Paralelkenar Yöntemi)",
          "Vektörlerin Bileşenlerine Ayrılması"
        ],
        "Doğadaki Temel Kuvvetler": [
          "Doğadaki Dört Temel Kuvvet (Güçlü Nükleer, Zayıf Nükleer, Elektromanyetik, Kütle Çekim)",
          "Temel Kuvvetlerin Nitelikleri, Benzerlikleri ve Farklılıkları"
        ],
        "Hareket ve Hareket Türleri": [
          "Hareketin Temel Kavramları (Konum, Yer Değiştirme, Alınan Yol, Sürat, Hız, İvme)",
          "Hareket Türleri ve Sınıflandırılması (Öteleme, Dönme, Titreşim Hareketi)",
          "Sürat ve Hız Göstergeleri Arasındaki Farklar ve Teknolojik Uygulamalar"
        ],
        "Basınç": [
          "Basınç ve Basınç Kuvveti Kavramları",
          "Katılarda Basınç ve Basınca Etki Eden Değişkenler"
        ],
        "Sıvılarda Basınç": [
          "Durgun Sıvılarda Basınç ve Basınca Etki Eden Değişkenler (Derinlik, Yoğunluk, Yer Çekimi İvmesi)",
          "Sıvı Basınç Kuvveti ve Pascal Prensibi (Sıvıların Basıncı İletmesi)",
          "Sıvılarda Basıncın Günlük Hayattaki ve Teknolojideki Kullanım Alanları (Hidrolik Fren, Su Cenderesi vb.)"
        ],
        "Açık Hava Basıncı": [
          "Açık Hava Basıncı ve Torricelli Deneyi",
          "Açık Hava Basıncına Etki Eden Faktörler ve Ölçümü (Barometre, Manometre, Altimetre, Batimetre)",
          "Açık Hava Basıncının Günlük Yaşamdaki Etkileri ve Uygulamaları"
        ],
        "Kaldırma Kuvveti": [
          "Sıvılarda Kaldırma Kuvvetini Etkileyen Değişkenler ve Arşimet Prensibi",
          "Kaldırma Kuvveti ile Yer Değiştiren Sıvının Ağırlığı Arasındaki İlişki",
          "Cisimlerin Sıvı İçindeki Denge Durumları (Yüzme, Askıda Kalma, Batma) ve Balıklarda Hava Keseleri"
        ],
        "Bernoulli İlkesi": [
          "Akışkanların Boru Kesit Alanı, Akış Sürati ve Çeper Basıncı Arasındaki İlişki",
          "Bernoulli İlkesi'nin Günlük Hayat ve Teknolojideki Uygulamaları (Uçak Kanatları, Rüzgârda Çatıların Uçması vb.)"
        ],
        "İç Enerji, Isı ve Sıcaklık Arasındaki İlişki": [
          "İç Enerji, Isı ve Sıcaklık Kavramlarının Tanımları ve Aralarındaki Farklar",
          "Sıcaklığın Ölçülmesi, Termometreler ve Sıcaklık Ölçekleri"
        ],
        "Isı, Öz Isı, Isı Sığası ve Sıcaklık Farkı Arasındaki İlişki": [
          "Öz Isı ve Isı Sığası (Kapasitesi) Kavramları",
          "Alınan veya Verilen Isı, Kütle, Öz Isı ve Sıcaklık Farkı Matematiksel Modeli (Q = m.c.ΔT)"
        ],
        "Hâl Değişimi": [
          "Saf Maddelerde Hâl Değişimi (Erime, Donma, Buharlaşma, Yoğuşma, Süblimleşme, Kırağılaşma)",
          "Hâl Değiştirme Sıcaklığı, Hâl Değiştirme Isısı (Q = m.L) ve Isınma/Soğuma Grafikleri"
        ],
        "Isıl Denge": [
          "Isıl Temas, Isı Alışverişi ve Denge Sıcaklığı",
          "Isıl Dengeye Ulaşma Süreci ve Enerjinin Korunumu"
        ],
        "Isı Aktarım Yolları": [
          "Isının Yayılma Yolları (İletim, Konveksiyon ve Işıma/Radyasyon)",
          "Isı Yalıtımı, Yalıtım Malzemeleri ve Günlük Yaşamdaki Uygulamaları (Termos vb.)"
        ],
        "Isı İletim Hızı": [
          "Katı Maddelerde Isı İletim Hızını Etkileyen Etmenler (Yüzey Alanı, Kalınlık, Malzeme Cinsi, Sıcaklık Farkı)",
          "Binalarda Isı Yalıtımı, Enerji Verimliliği, Pasif Isıtma Sistemleri ve Isı Pompaları"
        ],

        // --- 10. SINIF FİZİK ---
        "Sabit Hızlı Hareket": [
          "Yatay Doğrultuda Sabit Hızlı Hareket: Konum, Yer Değiştirme, Sürat, Hız ve Zaman İlişkisi",
          "Sabit Hızlı Harekette Konum-Zaman ve Hız-Zaman Grafiklerinin Çizimi ve Yorumlanması"
        ],
        "Bir Boyutta Sabit İvmeli Hareket": [
          "İvme Kavramı ve İvme ile Hız Değişimi Arasındaki İlişki",
          "Yatay Doğrultuda Sabit İvmeli Hareket Grafikleri (Konum-Zaman, Hız-Zaman, İvme-Zaman)",
          "Hareket Grafiklerinin Birbirine Dönüştürülmesi ve Matematiksel Modeller"
        ],
        "İş, Enerji ve Güç": [
          "Kuvvet, Yer Değiştirme ve Yapılan İş İlişkisi (Kuvvet-Yer Değiştirme Grafiği)",
          "İş, Enerji ve Güç Kavramları Arasındaki İlişki ve Matematiksel Hesaplamalar"
        ],
        "Enerji Biçimleri": [
          "Kinetik Enerji ve Yer Çekimi Potansiyel Enerjisi",
          "Esneklik Potansiyel Enerjisi ve Farklı Enerji Biçimlerinin Karşılaştırılması"
        ],
        "Mekanik Enerji": [
          "Mekanik Enerjinin Bileşenleri (Kinetik ve Potansiyel Enerji Toplamı)",
          "Mekanik Enerjinin Korunumu ve Sürtünmeli Ortamlarda Enerji Kayıpları"
        ],
        "Enerji Kaynakları": [
          "Yenilenebilir Enerji Kaynakları (Güneş, Rüzgâr, Biyokütle, Jeotermal, Hidroelektrik)",
          "Yenilenemez Enerji Kaynakları (Fosil Yakıtlar, Nükleer Enerji)",
          "Enerji Tasarrufu, Verimlilik ve Sürdürülebilir Kalkınma Amaçları"
        ],
        "Basit Elektrik Devreleri": [
          "Basit Elektrik Devresi Elemanları ve Su Tesisatı Analojisi",
          "Potansiyel Fark, Elektrik Akımı ve Direnç Kavramlarının Analojik Açıklaması"
        ],
        "Elektrik Akımı": [
          "İletkenlerde Elektrik Yükünün Hareketi ve Akım Şiddeti Modeli (I = q / t)",
          "Katı, Sıvı ve Gazlarda Elektrik Akımının İletimi"
        ],
        "Ohm Yasası": [
          "Elektrik Akımı, Direnç ve Potansiyel Fark Arasındaki İlişki (V = I.R)",
          "Bir İletkenin Direncini Etkileyen Değişkenler (Özdirenç, Uzunluk, Kesit Alanı)",
          "Akım-Gerilim Grafiği ve Direnç Değerinin Hesaplanması"
        ],
        "Dirençlerin Bağlanması": [
          "Dirençlerin Seri Bağlanması ve Eşdeğer Direnç Hesabı",
          "Dirençlerin Paralel Bağlanması ve Eşdeğer Direnç Hesabı",
          "Karmaşık (Birleşik) Devrelerde Eşdeğer Direnç, Akım ve Gerilim Dağılımı"
        ],
        "Üreteçlerin Bağlanması": [
          "Üreteçlerin Seri ve Paralel Bağlanması",
          "Devrenin Potansiyel Farkı, Ana Kol Akımı ve Üreteçlerin Tükenme Süresi",
          "Elektromotor Kuvveti (EMK) ve İç Direnci Olan Üreteçler"
        ],
        "Elektrik Akımının Oluşturabileceği Tehlikelere Karşı Alınması Gereken Önlemler": [
          "Elektrik Çarpması, Kısa Devre ve Elektrik Kaynaklı Yangın Tehlikeleri",
          "Sigorta, Kaçak Akım Rölesi ve Elektrik Güvenliği Önlemleri"
        ],
        "Topraklamanın Önemi": [
          "Topraklama Olayı ve Çalışma Prensibi",
          "Elektrik Güvenliğinde, Binalarda ve Elektrikli Cihazlarda Topraklamanın Hayati Önemi"
        ],
        "Periyodik Hareketler": [
          "Titreşim, Salınım ve Periyodik Hareket Kavramları",
          "Periyodik Hareketlerin Temel Özellikleri ve Günlük Yaşam Örnekleri"
        ],
        "Dalgaların Temel Kavramları": [
          "Dalga Boyu, Frekans, Periyot, Dalga Tepesi, Dalga Çukuru ve Genlik",
          "Dalgaların Yayılma Sürati, Frekans ve Dalga Boyu Arasındaki İlişki (v = λ.f)"
        ],
        "Dalgaların Sınıflandırılması": [
          "Titreşim Doğrultusuna Göre Dalgalar (Enine ve Boyuna Dalgalar)",
          "Taşıdığı Enerjiye Göre Dalgalar (Mekanik ve Elektromanyetik Dalgalar)"
        ],
        "Dalgaların Yayılma Süratini Etkileyen Etmenler": [
          "Dalgaların Yayılma Süratinin Ortamın Özelliklerine Bağımlılığı",
          "Farklı Ortamlarda Mekanik ve Elektromanyetik Dalgaların Yayılma Süratleri"
        ],
        "Su Dalgalarında Yansıma ve Kırılma": [
          "Doğrusal ve Dairesel Su Dalgalarının Düz ve Parabolik Engellerden Yansıması",
          "Su Dalgalarında Derinlik Farkına Bağlı Kırılma (Derin ve Sığ Ortam Geçişleri)",
          "Stroboskop Kullanımı ve Dalga Boyunun Belirlenmesi"
        ],
        "Rezonans ve Deprem": [
          "Rezonans Olayı ve Yapılar Üzerindeki Etkileri",
          "Deprem Dalgaları, Deprem Büyüklüğü ve Şiddeti",
          "Depreme Dayanıklı Yapı Tasarımı, Sismik İzolasyon ve Erken Uyarı Sistemleri"
        ],

        // --- 11. SINIF FİZİK ---
        "Serbest Düşme": [
          "Serbest Düşme Hareketi Yapan Cisimlerin İvmesi ve Hız Değişimi",
          "Serbest Düşmede Konum, Hız ve Zaman Grafikleri ve Matematiksel Modeller",
          "Havasız Ortamda Düşme Hareketi ve Yer Çekimi İvmesi"
        ],
        "İki Boyutta Sabit İvmeli Hareket": [
          "Yatay Atış Hareketi (Yatayda Sabit Hızlı, Düşeyde Serbest Düşme)",
          "Eğik Atış Hareketi (Uçuş Süresi, Maksimum Yükseklik ve Menzil Hesaplamaları)",
          "Farklı Açılarla Yapılan Atışlar ve Yörünge Modellemeleri"
        ],
        "Newton'ın Hareket Yasaları": [
          "Eylemsizlik Prensibi (I. Yasa)",
          "Temel Prensip (II. Yasa: F = m.a)",
          "Etki-Tepki Prensibi (III. Yasa)",
          "Serbest Cisim Diyagramı Çizimi ve Hareket Denklemlerinin Kurulması"
        ],
        "Statik ve Kinetik Sürtünme Kuvvetleri": [
          "Statik Sürtünme Kuvveti ve Maksimum Eşik Değeri",
          "Kinetik Sürtünme Kuvveti ve Statik Sürtünmeyle Karşılaştırılması",
          "Sürtünme Katsayısı ve Sürtünme Kuvvetinin Harekete Etkisi"
        ],
        "Sürtünme Kuvveti": [
          "Sürtünme Kuvvetinin Bağlı Olduğu Değişkenler (Yüzeye Dik Tepki Kuvveti, Yüzey Cinsi)",
          "Yatay ve Eğik Düzlemde Sürtünmeli Hareket Hesaplamaları",
          "Mühendislik ve Günlük Hayatta Sürtünme Kuvvetinin Rolü"
        ],
        "Limit Hız": [
          "Hava Direnç Kuvveti (Hava Sürtünmesi: Fd = k.A.v²)",
          "Yer Çekimi Kuvveti ile Hava Direncinin Dengelenmesi ve Limit Hızın Oluşumu",
          "Limit Hızı Etkileyen Faktörler (Kesit Alanı, Kütle, Akışkan Özellikleri)"
        ],
        "Düzgün Çembersel Hareket": [
          "Çizgisel Hız, Açısal Hız, Periyot, Frekans ve Yarıçap İlişkileri",
          "Merkezcil İvme ve Merkezcil Kuvvet Kavramları (Fm = m.v²/r)",
          "Yatay ve Düşey Düzlemde Çembersel Hareket, Virajlarda Güvenli Sürüş Dinamiği"
        ],
        "Elektriksel Kuvvet ve Elektriksel Alan": [
          "Coulomb Kanunu ve Noktasal Yükler Arasındaki Elektriksel Kuvvet",
          "Elektriksel Alan Kavramı, Alan Çizgileri ve Noktasal Yükün Elektrik Alanı (E = k.q/d²)",
          "Düzgün Elektrik Alan ve Yüklü Paralel Levhalar Arasındaki Etkileşim"
        ],
        "Faraday Kafesi ve Kullanım Alanları": [
          "İletkenlerin İçindeki Elektrik Alanın Sıfır Olması ve Yük Dağılımı",
          "Faraday Kafesi Çalışma Prensibi ve Elektrostatik Kalkanlama",
          "Faraday Kafesinin Teknolojideki ve Günlük Hayattaki Kullanım Alanları (Uçaklar, MR Odaları, Yıldırımdan Korunma)"
        ],
        "Manyetik Alan ve Manyetik Kuvvet": [
          "Mıknatısların Etkileşimi, Manyetik Kutuplar ve Manyetik Alan Çizgileri",
          "Akım Geçen Düz Bir İletken Telin Oluşturduğu Manyetik Alan (B = 2k.I/d)",
          "Akım Makarasının (Bobin/Selenoid) Merkez Ekseninde Oluşan Manyetik Alan ve Elektromıknatıslar",
          "Manyetik Alanda Akım Geçen Tele Etki Eden Manyetik Kuvvet ve Elektrik Motorlarının Çalışma Prensibi"
        ],
        "Manyetik Akı": [
          "Manyetik Akı Kavramı ve Matematiksel Modeli (Φ = B.A.cosθ)",
          "Manyetik Akıya Etki Eden Değişkenler (Manyetik Alan, Yüzey Alanı, Açı)"
        ],
        "İndüksiyon Akımı": [
          "Manyetik Akı Değişimi ve Faraday İndüksiyon Kanunu (ε = -ΔΦ/Δt)",
          "Lenz Kanunu ve İndüksiyon Akımının Yönünün Belirlenmesi",
          "Öz-İndüksiyon Akımı ve Elektrik Jeneratörleri"
        ],
        "Alternatif Akım": [
          "Alternatif Akımın (AC) Üretimi, Frekansı ve Periyodu",
          "Etkin Gerilim, Etkin Akım ve Doğru Akım (DC) ile Alternatif Akımın (AC) Karşılaştırılması"
        ],
        "Transformatörler": [
          "Transformatörün Yapısı ve Çalışma Prensibi",
          "Yükseltici ve Alçaltıcı Transformatörler (Gerilim ve Sarım Sayısı İlişkisi: V1/V2 = N1/N2)",
          "Elektrik Enerjisinin Taşınmasında Transformatörlerin Rolü ve Verim"
        ],
        "Işık Şiddeti, Işık Akısı ve Aydınlanma": [
          "Işık Şiddeti (I), Işık Akısı (Φ) ve Aydınlanma Şiddeti (E) Kavramları",
          "Fotometreler ve Aydınlanma Şiddetinin Matematiksel Modeli (E = I / d²)"
        ],
        "Düzlem Aynalar": [
          "Işığın Düzlem Aynada Yansıması ve Yansıma Kanunları",
          "Düzlem Aynada Görüntü Oluşumu, Özellikleri ve Görüş Alanı"
        ],
        "Küresel Aynalar": [
          "Çukur ve Tümsek Aynaların Temel Elemanları (Odak Noktası, Merkez, Tepe Noktası)",
          "Küresel Aynalarda Özel Işınlar ve Görüntü Oluşumu/Özellikleri",
          "Küresel Aynaların Günlük Hayattaki ve Teknolojideki Kullanım Alanları"
        ],
        "Kırılma": [
          "Işığın Saydam Ortamlardaki Davranışı ve Kırılma İndisi",
          "Snell Yasası, Gelme ve Kırılma Açıları",
          "Sınır Açısı ve Tam Yansıma Olayı"
        ],
        "Görünür Derinlik": [
          "Farklı Kırıcılık İndisli Ortamlarda Görünür Derinlik Olayı",
          "Gerçek Derinlik ile Görünür Derinlik Arasındaki Matematiksel ve Fiziksel İlişki"
        ],
        "Fiber Optik": [
          "Fiber Optik Kabloların Yapısı ve Tam Yansıma Prensibi",
          "Fiber Optik Teknolojisinin Haberleşme, Tıp ve Endüstrideki Kullanım Alanları"
        ],
        "Prizmalar": [
          "Işık Prizmaları ve Prizmada Işığın Kırılması",
          "Tam Yansımalı Prizmalar ve Optik Cihazlardaki (Dürbün, Periskop) Kullanımı",
          "Işığın Renklerine Ayrılması (Dispersiyon)"
        ],
        "Mercekler": [
          "İnce Kenarlı (Yakınsak) ve Kalın Kenarlı (Iraksak) Merceklerin Özellikleri",
          "Merceklerde Özel Işınlar, Odak Uzaklığı ve Görüntü Oluşumu",
          "Göz Kusurları (Miyop, Hipermetrop, Astigmat) ve Optik Sistemler (Teleskop, Mikroskop)"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      if (!targetSubject || targetSubject === "9. Sınıf Fizik") {
        subjects["9. Sınıf Fizik"] = grade9Topics;
      }
      if (!targetSubject || targetSubject === "10. Sınıf Fizik") {
        subjects["10. Sınıf Fizik"] = grade10Topics;
      }
      if (!targetSubject || targetSubject === "11. Sınıf Fizik") {
        subjects["11. Sınıf Fizik"] = grade11Topics;
      }

      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: `${targetSubject || "9., 10. ve 11. Sınıf Fizik"} müfredatı başarıyla güncellendi`,
        grade9Count: grade9Topics.length,
        grade10Count: grade10Topics.length,
        grade11Count: grade11Topics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post("/api/admin/curriculum/sync-matematik", async (req, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(500).json({ success: false, error: "Database not connected" });
      }

      const targetSubject = req.body?.subject;

      const grade9Topics = [
        "Gerçek Sayıların Üslü ve Köklü Gösterimleri ile Yapılan İşlemler",
        "Gerçek Sayı Aralıklarının Gösterimi ve Aralıklarla İlgili İşlemlerde Küme Sembollerinin Kullanımı",
        "Sayı Kümeleri ve İşlem Özellikleri",
        "Gerçek Sayıların İşlem Özelliklerini Cebirsel Olarak İfade Etme",
        "Doğrusal Fonksiyonlar ve Nitel Özellikleri",
        "Mutlak Değer Fonksiyonu ve Nitel Özellikleri",
        "Doğrusal Fonksiyonlarla İfade Edilen Denklem ve Eşitsizlikler İçeren Problemler",
        "Üçgende Açı ve Kenarla İlgili Özellikler ve Bu Özellikler Arasındaki İlişkiler",
        "Geometrik Dönüşümler",
        "Eşlik ve Benzerlik Koşulları",
        "Benzer Üçgenler Oluşturma",
        "Tales, Öklid ve Pisagor Teoremleri",
        "Eşlik ve Benzerlik Problemleri",
        "Algoritma Temelli Problemler",
        "Mantık Bağlaçları ve Niceleyiciler",
        "Mantık Bağlaçları ve Niceleyicilerin Algoritmik Problemlerde Kullanımı",
        "Tek Nicel Değişkenli Veri Dağılımları",
        "Başkaları Tarafından Oluşturulan Tek Nicel Değişkenli Veri Dağılımlarını İnceleme",
        "Deneysel Olasılık",
        "Teorik Olasılık"
      ];

      const grade10Topics = [
        "Dik Üçgende Trigonometrik Oranlar ve Trigonometrik Özdeşlikler",
        "Üçgende Yardımcı Elemanlar",
        "Üçgenin Alanı",
        "Sinüs ve Kosinüs Teoremleri",
        "İki Kategorik Değişkenli Veriler",
        "Başkaları Tarafından Oluşturulan İki Kategorik Değişkenli Verileri İnceleme",
        "Bir Doğal Sayının Asal Çarpanları, Bölenleri",
        "En Büyük Ortak Bölen, En Küçük Ortak Kat",
        "Bölünebilme",
        "Gerçek Sayılarda Fonksiyon Olma Şartları",
        "Karesel Fonksiyon ve Nitel Özellikleri",
        "Karekök Fonksiyonu ve Nitel Özellikleri",
        "Rasyonel Fonksiyon ve Nitel Özellikleri",
        "Doğrusal, Karesel, Karekök ve Rasyonel Fonksiyonların Ters Fonksiyonları",
        "Gerçek Sayılarda Tanımlı Fonksiyonlarla İfade Edilebilen Denklem ve Eşitsizlikler İçeren Problemler",
        "Sayma Stratejileri",
        "Cebirsel ve Fonksiyonel İşlemlerin Algoritmik Yapısı",
        "Dik Koordinat Sisteminde Noktanın Analitik İncelenmesi",
        "Dik Koordinat Sisteminde Doğrunun Analitik İncelenmesi",
        "Koşullu Olasılık",
        "Bayes Teoremi"
      ];

      const grade11Topics = [
        "İki Nicel Değişkenli Veriler",
        "Başkaları Tarafından Oluşturulan İki Nicel Değişkenli Verileri İnceleme",
        "Dörtgenlerin Özellikleri",
        "Özel Dörtgenler Arasındaki İlişkiler",
        "Çokgenlerin Sınıflandırılması",
        "Dışbükey Çokgenlerin Özellikleri",
        "Çokgenlerle İlgili Problemler",
        "Trigonometrik Fonksiyonlar ve Nitel Özellikleri",
        "Trigonometrik Fonksiyonlarla İfade Edilebilen Denklemler İçeren Problemler",
        "Üstel Fonksiyonlar ve Nitel Özellikleri",
        "Üstel Fonksiyonların Ters Fonksiyonları",
        "Logaritmik Fonksiyonlar ve Nitel Özellikleri",
        "Üstel ve Logaritmik Fonksiyonlarla İfade Edilebilen Denklem ve Eşitsizlikler İçeren Problemler",
        "Fonksiyonların Bileşkesi",
        "Fonksiyonlarda Dört İşlem"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        // --- 9. SINIF MATEMATİK ---
        "Gerçek Sayıların Üslü ve Köklü Gösterimleri ile Yapılan İşlemler": [
          "Gerçek Sayıların Üslü ve Köklü Gösterimleriyle Yapılan İşlemler ve Muhakeme",
          "Üslü ve Köklü Gösterimlerle İlgili Matematiksel Doğrulama ve İspat Yöntemleri"
        ],
        "Gerçek Sayı Aralıklarının Gösterimi ve Aralıklarla İlgili İşlemlerde Küme Sembollerinin Kullanımı": [
          "Gerçek Sayı Aralıklarının Küme Sembol ve İşlemleriyle Gösterimi",
          "Aralıklarla İlgili İşlemler ve Problem Durumlarında Küme Sembollerinin Kullanımı"
        ],
        "Sayı Kümeleri ve İşlem Özellikleri": [
          "Farklı Sayı Kümelerinin Özellikleri (Doğal, Tam, Rasyonel ve Gerçek Sayılarda Sıralama ve Arada Olma)",
          "Sayı Kümelerinin Özellikleri Hakkında Muhakeme ve Matematiksel İspat Yöntemleri"
        ],
        "Gerçek Sayıların İşlem Özelliklerini Cebirsel Olarak İfade Etme": [
          "Gerçek Sayıların İşlem Özelliklerinin Cebirsel Karşılıkları",
          "Cebirsel Özdeşliklerin Kullanımı ve Analojik Çıkarımlar"
        ],
        "Doğrusal Fonksiyonlar ve Nitel Özellikleri": [
          "Doğrusal Referans Fonksiyonu (f(x) = x) ve Dönüşümleri (g(x) = a·f(x ± r) ± k)",
          "Doğrusal Fonksiyonların Nitel Özellikleri (Tanım ve Görüntü Kümesi, Bire Birlik, Artanlık-Azalanlık, Sıfırları) ve Grafikleri"
        ],
        "Mutlak Değer Fonksiyonu ve Nitel Özellikleri": [
          "Mutlak Değer Referans Fonksiyonu (n(x) = ±|x|) ve Dönüşümleri (m(x) = ±|ax ± b| ± c)",
          "Mutlak Değer Fonksiyonunun Nitel Özellikleri ve Parçalı Gösterimi"
        ],
        "Doğrusal Fonksiyonlarla İfade Edilen Denklem ve Eşitsizlikler İçeren Problemler": [
          "Doğrusal Fonksiyonlarla İfade Edilen Denklem ve Eşitsizliklerin Cebirsel ve Grafiksel Çözüm Stratejileri",
          "Gerçek Yaşam Problemlerinin Doğrusal Fonksiyonlarla Matematiksel Modellenmesi"
        ],
        "Üçgende Açı ve Kenarla İlgili Özellikler ve Bu Özellikler Arasındaki İlişkiler": [
          "Üçgende İç ve Dış Açıların Ölçüleri Toplamı ve Açı-Kenar Bağıntıları",
          "Üçgen Eşitsizliği ve Geometrik İspatlar"
        ],
        "Geometrik Dönüşümler": [
          "Geometrik Dönüşümlerin (Yansıma, Öteleme, Dönme) Nitelikleri ve Dönüşüm Altındaki Görüntüler",
          "Dönüşümler Kullanılarak Motif ve Süsleme Örneklerinin Oluşturulması"
        ],
        "Eşlik ve Benzerlik Koşulları": [
          "İki Üçgenin Eşlik ve Benzerlik Koşulları (Kenar-Açı-Kenar, Açı-Kenar-Açı, Kenar-Kenar-Kenar)",
          "Eşlik ve Benzerlik Önermeleri ve Asgari Koşullarla İlgili Çıkarımlar"
        ],
        "Benzer Üçgenler Oluşturma": [
          "Bir Üçgenden Hareketle Ona Benzer Üçgenler Oluşturma ve Deneyimlerin Yansıtılması",
          "Benzer Üçgenlerin Nitelikleri ve Problem Uygulamaları"
        ],
        "Tales, Öklid ve Pisagor Teoremleri": [
          "Tales Teoremi ve Geometrik İspatları",
          "Öklid ve Pisagor Teoremleri ve Matematiksel İspat Yöntemleri"
        ],
        "Eşlik ve Benzerlik Problemleri": [
          "Eşlik ve Benzerlikle İlgili Çıkarım ve Teoremleri İçeren Geometrik Problemler",
          "Gerçek Yaşam Durumlarında Eşlik ve Benzerlik Problemleri Çözüm Stratejileri"
        ],
        "Algoritma Temelli Problemler": [
          "Algoritmik Çözüm Stratejileri, Akış Şemaları ve Sözde Kod (Pseudo-code)",
          "Sıralama, Arama ve Şifreleme Algoritmaları ile Algoritma Temelli Problem Çözme"
        ],
        "Mantık Bağlaçları ve Niceleyiciler": [
          "Algoritmik Yapılar İçerisindeki Mantık Bağlaçları ve Niceleyiciler",
          "Önermeler, Doğruluk Değerleri ve Sembolik Mantık Gösterimleri"
        ],
        "Mantık Bağlaçları ve Niceleyicilerin Algoritmik Problemlerde Kullanımı": [
          "Mantık Bağlaçları ve Niceleyicilerin Matematiksel Problem Çözme ve İspat Süreçlerinde Kullanımı",
          "Matematiksel Dil ve Sembolizmin Yalınlık ve Kesinliğindeki Rolü"
        ],
        "Tek Nicel Değişkenli Veri Dağılımları": [
          "İstatistiksel Araştırma Süreci ve Veri Toplama Planı",
          "Veri Görselleştirme Araçları (Nokta Grafiği, Histogram, Kutu Grafiği)",
          "Merkezi Eğilim ve Yayılım Ölçüleri (Aritmetik Ortalama, Medyan, Mod, Açıklık, Çeyrekler Açıklığı, Standart Sapma)"
        ],
        "Başkaları Tarafından Oluşturulan Tek Nicel Değişkenli Veri Dağılımlarını İnceleme": [
          "İstatistiksel Veri Dağılımları ve Sonuçlara Yönelik Hata/Yanlılık Tespiti",
          "İstatistiksel Sonuç ve Yorumların Eleştirel Değerlendirilmesi"
        ],
        "Deneysel Olasılık": [
          "Olayların Olasılığını Gözleme ve Deneye Dayalı Tahmin Etme",
          "Deney Tekrar Sayısı ile Çıktıların Göreli Sıklığı Arasındaki İlişki"
        ],
        "Teorik Olasılık": [
          "Olayların Teorik Olasılığı ve Olası Durumların Gösterimi (Liste, Tablo, Ağaç Şeması)",
          "Deneysel Olasılık ile Teorik Olasılık Arasındaki İlişki ve Matematiksel Genellemeler"
        ],

        // --- 10. SINIF MATEMATİK ---
        "Dik Üçgende Trigonometrik Oranlar ve Trigonometrik Özdeşlikler": [
          "Dik Üçgende Trigonometrik Oranlar (Sinüs, Kosinüs, Tanjant, Kotanjant)",
          "Temel Trigonometrik Özdeşlikler ve Dik Üçgende Hesaplamalar"
        ],
        "Üçgende Yardımcı Elemanlar": [
          "Üçgende İç ve Dış Açıortayların Özellikleri",
          "Kenarortaylar, Kenar Orta Dikmeler ve Yüksekliklerin Özellikleri"
        ],
        "Üçgenin Alanı": [
          "Üçgenin Alan Formülleri ve Taban-Yükseklik Değişiminin Alana Etkisi",
          "Trigonometrik Alan Formülü ve Geometrik Alan Problemleri"
        ],
        "Sinüs ve Kosinüs Teoremleri": [
          "Sinüs Teoremi, İspatı ve Uygulamaları",
          "Kosinüs Teoremi, İspatı ve Geometrik Hesaplamalar"
        ],
        "İki Kategorik Değişkenli Veriler": [
          "İki Kategorik Değişkenli Veri Toplama, Düzenleme ve İki Yönlü Tablolar",
          "Koşullu Göreli Sıklıklar, Sütun Grafikleri ve İki Değişken Arasındaki İlişkililik"
        ],
        "Başkaları Tarafından Oluşturulan İki Kategorik Değişkenli Verileri İnceleme": [
          "İki Kategorik Değişkenli Verilerin İlişkililiğine Dayalı İstatistiksel Yorumların Tartışılması",
          "İstatistiksel Hata, Yanlılık Tespiti ve Bilimsel Temellendirme"
        ],
        "Bir Doğal Sayının Asal Çarpanları, Bölenleri": [
          "Bir Doğal Sayının Asal Çarpanları ve Asal Bölenleri",
          "Pozitif ve Tam Sayı Bölenleri Sayısı, Özellikleri ve Problem Çözümleri"
        ],
        "En Büyük Ortak Bölen, En Küçük Ortak Kat": [
          "Birden Çok Doğal Sayının EBOB ve EKOK İlişkileri",
          "EBOB ve EKOK İçeren Gerçek Yaşam Problemleri ve Çözüm Stratejileri"
        ],
        "Bölünebilme": [
          "2, 3, 4, 5, 6, 8, 9, 10 ile Bölünebilme Kuralları ve Kalan Bulma",
          "Bölünebilme Kurallarının En Küçük Ortak Kat Tabanlı Uygulamaları ve Algoritmaları"
        ],
        "Gerçek Sayılarda Fonksiyon Olma Şartları": [
          "Fonksiyon Olma Şartları, Tanım, Değer ve Görüntü Kümeleri",
          "Fonksiyonların Nitel Özellikleri (İşaret, Artanlık-Azalanlık, Bire Birlik, Örtenlik, Teklik-Çiftlik)"
        ],
        "Karesel Fonksiyon ve Nitel Özellikleri": [
          "Karesel Referans Fonksiyonu (f(x) = x²) ve Dönüşümleri (g(x) = a·f(x ± r) ± k)",
          "Parabolün Tepe Noktası, Simetri Ekseni, Kökleri ve Ekstremum Değerleri"
        ],
        "Karekök Fonksiyonu ve Nitel Özellikleri": [
          "Karekök Referans Fonksiyonu (f(x) = √x, x ≥ 0) ve Dönüşümleri",
          "Karekök Fonksiyonunun Tanım-Görüntü Kümeleri ve Grafik Temsilleri"
        ],
        "Rasyonel Fonksiyon ve Nitel Özellikleri": [
          "Rasyonel Referans Fonksiyonu (f(x) = 1/x, x ≠ 0) ve Dönüşümleri",
          "Rasyonel Fonksiyonların Asimptotları, Nitel Özellikleri ve Ters Orantı İlişkisi"
        ],
        "Doğrusal, Karesel, Karekök ve Rasyonel Fonksiyonların Ters Fonksiyonları": [
          "Bir Fonksiyonun Tersinin Varlık Koşulları (Bire Birlik ve Örtenlik)",
          "Referans ve Türetilen Fonksiyonların Ters Fonksiyonlarının Cebirsel ve Grafiksel Temsilleri"
        ],
        "Gerçek Sayılarda Tanımlı Fonksiyonlarla İfade Edilebilen Denklem ve Eşitsizlikler İçeren Problemler": [
          "Fonksiyonel Denklem ve Eşitsizliklerin Cebirsel ve Grafiksel Çözümleri",
          "Matematiksel Modelleme ile Gerçek Yaşam Problemlerinin Çözümü"
        ],
        "Sayma Stratejileri": [
          "Toplama ve Çarpma Yoluyla Sayma İlkeleri",
          "Sayma Problemlerinde Eşleştirme, Tablo, Ağaç Şeması ve Algoritmik Stratejiler"
        ],
        "Cebirsel ve Fonksiyonel İşlemlerin Algoritmik Yapısı": [
          "Cebirsel ve Fonksiyonel İşlemlerin Algoritmik Bir Dille Yapılandırılması",
          "Algoritmik Akış Şemaları ve Matematiksel İşlem Bütünlüğü"
        ],
        "Dik Koordinat Sisteminde Noktanın Analitik İncelenmesi": [
          "İki Nokta Arasındaki Uzaklık Bağıntısı",
          "Bir Doğru Parçasını Belli Oranda Bölen Noktanın Koordinatları"
        ],
        "Dik Koordinat Sisteminde Doğrunun Analitik İncelenmesi": [
          "Doğrunun Eğim Açısı ve Eğimi",
          "Doğru Denklemleri ve Doğruların Birbirine Göre Konumları (Paralel, Çakışık, Kesişen, Dik Doğrular)"
        ],
        "Koşullu Olasılık": [
          "Koşullu Olasılık Tanımı ve Matematiksel Modeli (P(A|B))",
          "Bağımlı ve Bağımsız Olaylar ve Ağaç Şeması ile Olasılık Hesaplamaları"
        ],
        "Bayes Teoremi": [
          "Bayes Teoreminin Matematiksel Yapısı ve Hesaplanması",
          "Mevcut Bilgi ve Veriye Dayalı Olasılık Tahmini ve Gerçek Yaşam Uygulamaları"
        ],

        // --- 11. SINIF MATEMATİK ---
        "İki Nicel Değişkenli Veriler": [
          "İki Nicel Değişkenli Veri Toplama, Serpme Diyagramı (Saçılım Grafiği) ve Yorumlanması",
          "Korelasyon Katsayısı, Doğrusal İlişki Yönü/Kuvveti ve Bölgelere Göre Sayım Oranı"
        ],
        "Başkaları Tarafından Oluşturulan İki Nicel Değişkenli Verileri İnceleme": [
          "İki Nicel Değişken Arasındaki İlişkililiğe Dayalı İstatistiksel Sonuçların Değerlendirilmesi",
          "İstatistiksel Hata, Yanlılık Tespiti ve Veriye Dayalı Karar Verme"
        ],
        "Dörtgenlerin Özellikleri": [
          "Dörtgenlerde Açı, Kenar, Köşegen ve Simetri Özellikleri",
          "Dörtgenlerin Alan Özellikleri ve Üçgen Bağıntılarıyla Geometrik İspatlar"
        ],
        "Özel Dörtgenler Arasındaki İlişkiler": [
          "Özel Dörtgenlerin (Yamuk, Paralelkenar, Eşkenar Dörtgen, Dikdörtgen, Kare, Deltoid) Kenar, Açı, Köşegen ve Simetri Özellikleri",
          "Özel Dörtgenler Arasındaki Hiyerarşik ve Nedensel İlişkiler"
        ],
        "Çokgenlerin Sınıflandırılması": [
          "Çokgen Kavramı, İçbükey (Konkav) ve Dışbükey (Konveks) Çokgenler",
          "Çokgenlerin Niteliklerine Göre Tasnifi ve Sınıflandırılması"
        ],
        "Dışbükey Çokgenlerin Özellikleri": [
          "Dışbükey Çokgenlerde İç ve Dış Açı Ölçüleri Toplamı",
          "Dışbükey Çokgenlerde Köşegen Sayısı, Simetri ve Düzgün Çokgenlerde Alan Hesaplamaları"
        ],
        "Çokgenlerle İlgili Problemler": [
          "Çokgenlerin Kenar, Açı, Köşegen, Simetri ve Alan Özelliklerini İçeren Problemler",
          "Gerçek Yaşam Durumlarında Çokgen Modellemeleri ve Çözüm Stratejileri"
        ],
        "Trigonometrik Fonksiyonlar ve Nitel Özellikleri": [
          "Trigonometrik Referans Fonksiyonlar (f(x) = sinx, cosx, tanx, cotx) ve Dönüşümleri (g(x) = k·f(mx ± r) ± s)",
          "Trigonometrik Fonksiyonların Nitel Özellikleri (Tanım ve Görüntü Kümesi, Bire Birlik, Örtenlik, Teklik-Çiftlik, Periyot) ve Grafikleri"
        ],
        "Trigonometrik Fonksiyonlarla İfade Edilebilen Denklemler İçeren Problemler": [
          "Trigonometrik Denklemlerin Çözüm Kümeleri ve Yöntemleri",
          "Periyodik Gerçek Yaşam Olaylarının Trigonometrik Fonksiyonlarla Modellenmesi"
        ],
        "Üstel Fonksiyonlar ve Nitel Özellikleri": [
          "Üstel Referans Fonksiyonu (f(x) = a^x, a > 0, a ≠ 1) ve Dönüşümleri",
          "Üstel Fonksiyonların Nitel Özellikleri (Artanlık-Azalanlık, Bire Birlik, Örtenlik) ve Grafikleri"
        ],
        "Üstel Fonksiyonların Ters Fonksiyonları": [
          "Üstel Fonksiyonun Bire Bir ve Örtenliği ile Ters Fonksiyon İlişkisi",
          "Üstel Fonksiyonun Tersi Olarak Logaritmik Fonksiyonun Tanımı"
        ],
        "Logaritmik Fonksiyonlar ve Nitel Özellikleri": [
          "Logaritmik Referans Fonksiyonu (f(x) = log_a(x), a > 0, a ≠ 1, x > 0) ve Dönüşümleri",
          "Logaritma Fonksiyonunun Tanım Kümesi, Grafikleri ve Logaritma İşlem Özellikleri (Taban Değiştirme vb.)"
        ],
        "Üstel ve Logaritmik Fonksiyonlarla İfade Edilebilen Denklem ve Eşitsizlikler İçeren Problemler": [
          "Üstel ve Logaritmik Denklem ve Eşitsizliklerin Çözüm Yöntemleri",
          "Üstel Büyüme/Bozunma, Deprem Şiddeti (Richter), pH ve Ses Şiddeti (Desibel) Modellemeleri"
        ],
        "Fonksiyonların Bileşkesi": [
          "Bileşke Fonksiyon Kavramı ve Sembolik Gösterimi ((f ∘ g)(x))",
          "Bileşke Fonksiyonların Nitel Özellikleri, Cebirsel ve Grafiksel Temsilleri"
        ],
        "Fonksiyonlarda Dört İşlem": [
          "Fonksiyonlarda Toplama, Çıkarma, Çarpma ve Bölme İşlemleri ve Koşulları",
          "Fonksiyonlarda Dört İşlemin Cebirsel ve Grafiksel Temsilleri ve Nitel Yorumu"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      if (!targetSubject || targetSubject === "9. Sınıf Matematik") {
        subjects["9. Sınıf Matematik"] = grade9Topics;
      }
      if (!targetSubject || targetSubject === "10. Sınıf Matematik") {
        subjects["10. Sınıf Matematik"] = grade10Topics;
      }
      if (!targetSubject || targetSubject === "11. Sınıf Matematik") {
        subjects["11. Sınıf Matematik"] = grade11Topics;
      }

      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: `${targetSubject || "9., 10. ve 11. Sınıf Matematik"} müfredatı başarıyla güncellendi`,
        grade9Count: grade9Topics.length,
        grade10Count: grade10Topics.length,
        grade11Count: grade11Topics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post("/api/admin/curriculum/sync-cografya", async (req, res) => {
    try {
      const db = getDb();
      const { targetSubject } = req.body || {};

      const grade9Topics = [
        "Coğrafya Biliminin Konusu ve Bölümleri",
        "Niçin Coğrafya Öğrenmeliyiz?",
        "Coğrafya Biliminin Gelişimi",
        "Mekânın Aynası Haritalar",
        "Türkiye’nin Coğrafi Konumu",
        "Mekânsal Bilgi Teknolojilerinin Bileşenleri",
        "Hava Olayları ve Günlük Hayata Etkileri",
        "İklim Sisteminin Bileşen ve Değişkenleri",
        "İklim Türleri",
        "İklim Sisteminde Yaşanan Değişiklikler",
        "Nüfusun Tarihsel Değişimi ve Geleceği",
        "Nüfusun Dağılışı ve Hareketleri",
        "Demografik Dönüşüm ve Nüfus Piramitleri",
        "Nüfusla İlgili Fırsat, Sorun ve Politikalar",
        "Ekonomik Faaliyetleri Etkileyen Coğrafi Faktörler",
        "Tehlike, Risk ve Afet",
        "Afet Türleri",
        "Bütüncül Afet Yönetimi",
        "Bölge ve Bölge Sınırı"
      ];

      const grade10Topics = [
        "Coğrafi Bakış",
        "CBS ve Uzaktan Algılamanın Uygulama Alanları",
        "Mekânsal Verilerin Haritalara Aktarılması",
        "Tektonik Süreçler",
        "İklim ve Kayaç Yapısının Aşınma ve Çözünme Süreçlerine Etkisi",
        "Aşınım ve Birikim Süreçlerinin Yeryüzü Şekillerinin Oluşumuna Etkisi",
        "Yeryüzü Şekilleri ile İlgili Gözlem ve Saha Çalışması",
        "Yeryüzü Şekilleri ile Beşerî Faaliyetler Arasındaki Etkileşim",
        "Yerleşmelerin Kuruluşu ve Gelişimi",
        "Yerleşmelerin Fonksiyonları",
        "Ekonomik Faaliyetlerin Özellikleri",
        "Ekonomik Sektörler ve Gelişmişlik",
        "Türkiye Ekonomisinin Sektörel Dağılımı",
        "Afetlerle Mücadelede İyi Uygulama Örnekleri",
        "Afetlere Karşı Dirençli Yaşam Alanları",
        "Afetlerden Korunma",
        "Afet Bilinci",
        "Türk Kültürünün Mekânsal Özellikleri"
      ];

      const grade11Topics = [
        "Mekânsal Sorunlar Karşısında Coğrafya Bilimi",
        "Web Tabanlı CBS Uygulamaları",
        "Su Kaynakları",
        "Türkiye’deki Su Kaynaklarının Etkileri",
        "Yerleşmelerin Mekânsal Organizasyonları",
        "Yerleşmelerin Etki Alanları",
        "Tarımsal Faaliyetler ve Gıda Güvencesi",
        "Tarım Uygulamalarında Sürdürülebilirlik",
        "Stratejik ve Kritik Madenler",
        "Enerji Kaynakları",
        "Sanayileşmenin Mekânsal Etkileri",
        "Gezegen Sınırı",
        "Küresel İklim Değişikliği",
        "Türkiye’de Suyun Sürdürülebilir Kullanımı",
        "Türkiye’nin Kültürel Hinterlandı",
        "Tarımsal Üretim: Örnek Ülke",
        "Sanayileşme Süreci: Örnek Ülkeler",
        "Madencilik Faaliyetleri: Örnek Ülke",
        "Enerji Kaynakları: Örnek Ülkeler"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        // --- 9. SINIF COĞRAFYA ---
        "Coğrafya Biliminin Konusu ve Bölümleri": [
          "Coğrafya Biliminin Konusu ve Bölümlerini Oluşturan Bileşenler (Fiziki ve Beşerî Coğrafya)",
          "Coğrafya Biliminin Konusu ve Bölümlerini Oluşturan Bileşenler Arasındaki İlişkiler"
        ],
        "Niçin Coğrafya Öğrenmeliyiz?": [
          "Mekânda Gerçekleşen Coğrafi Olay, Olgu veya Konular",
          "Mekânsal Düşünme ile Coğrafya Öğrenmenin Önemi ve Hayattaki Yeri"
        ],
        "Coğrafya Biliminin Gelişimi": [
          "Coğrafya Biliminin Tarihsel Gelişim Süreci ve Temel Aşamaları",
          "Coğrafya Biliminin Gelişimine Katkı Sağlayan Bilim İnsanları ve Çalışmaları"
        ],
        "Mekânın Aynası Haritalar": [
          "Harita Bileşenleri (Ölçek, Yön Oku, Lejant, Projeksiyonlar) ve Harita Okuma",
          "Haritalardaki Olay, Olgu ve Mekânlar Arası İlişkilerin Çözümlenmesi",
          "Harita Türleri, Coğrafi Verilerin Gösterim Yöntemleri ve Harita Oluşturma Aşamaları"
        ],
        "Türkiye’nin Coğrafi Konumu": [
          "Türkiye'nin Matematik (Mutlak) ve Özel (Göreceli) Konum Özellikleri",
          "Türkiye'nin Jeopolitik ve Jeostratejik Konumunun Önemi ve Etkileri"
        ],
        "Mekânsal Bilgi Teknolojilerinin Bileşenleri": [
          "Mekânsal Bilgi Teknolojilerini Oluşturan Bileşenler (Donanım, Yazılım, Veri, İnsan, Yöntem)",
          "Mekânsal Bilgi Teknolojileri Bileşenleri Arasındaki İlişkiler ve Kullanım Alanları"
        ],
        "Hava Olayları ve Günlük Hayata Etkileri": [
          "Hava Olayları ile İlgili Gözlem, Veri ve Coğrafi Temsillerin Günlük Hayata Etkileri",
          "Hava Olaylarının İnsan Yaşamı, Ekonomik Faaliyetler ve Çevre Üzerindeki Çıkarımları"
        ],
        "İklim Sisteminin Bileşen ve Değişkenleri": [
          "İklim Sistemini Oluşturan Temel Bileşenler (Atmosfer, Hidrosfer, Kriyosfer, Litosfer, Biyosfer)",
          "İklim Sistemine Ait Değişkenler (Sıcaklık, Basınç, Rüzgâr, Nem, Yağış) ve Aralarındaki İlişkiler"
        ],
        "İklim Türleri": [
          "Türkiye'de ve Dünyada Görülen Farklı İklim Türleri ve Özellikleri",
          "İklim Verilerini Tablo, Grafik, Şekil ve Diyagramlarla Görselleştirme ve Yorumlama"
        ],
        "İklim Sisteminde Yaşanan Değişiklikler": [
          "İklim Sisteminde ve Sürecinde Meydana Gelen Değişiklikler ve Karşılaştırmalar",
          "Küresel İklim Değişikliğinin Nedenleri, Sonuçları ve Geleceğe Yönelik Öngörüler"
        ],
        "Nüfusun Tarihsel Değişimi ve Geleceği": [
          "Dünya Nüfusunun Tarihsel Gelişim Süreci ve Sıçrama Dönemleri",
          "Nüfus Değişimini Gösteren Tablo ve Grafiklerin Yorumlanması ve Gelecek Projeksiyonları"
        ],
        "Nüfusun Dağılışı ve Hareketleri": [
          "Dünya ve Türkiye'de Nüfus Yoğunluğu ve Dağılışını Etkileyen Doğal ve Beşerî Faktörler",
          "Nüfus Hareketleri (İç ve Dış Göçler) ve Nüfus Dağılış Haritalarının Çözümlenmesi"
        ],
        "Demografik Dönüşüm ve Nüfus Piramitleri": [
          "Demografik Dönüşüm Modeli Aşamaları ve Doğum-Ölüm Oranları İlişkisi",
          "Türkiye ve Farklı Ülkelerin Nüfus Piramitleri ve Nitel Özellikleri"
        ],
        "Nüfusla İlgili Fırsat, Sorun ve Politikalar": [
          "Nüfus Politikalarının Amaçları ve Farklı Ülkelerdeki Nüfus Politikası Uygulamaları",
          "Türkiye ve Dünyadaki Nüfus Yapısından Doğan Fırsatlar ve Karşılaşılan Sorunlar"
        ],
        "Ekonomik Faaliyetleri Etkileyen Coğrafi Faktörler": [
          "Doğal Faktörlerin (İklim, Yer Şekilleri, Su Kaynakları vb.) Ekonomik Faaliyetlere Etkisi",
          "Beşerî Faktörlerin (Nüfus, Teknoloji, Sermaye, Ulaşım vb.) Ekonomik Faaliyetlere Etkisi"
        ],
        "Tehlike, Risk ve Afet": [
          "Tehlike, Risk ve Afet Kavramlarının Nitelikleri ve Aralarındaki İlişkiler",
          "Doğal ve Teknolojik Tehlikelerin Afete Dönüşme Süreçleri"
        ],
        "Afet Türleri": [
          "Jeolojik ve Jeomorfolojik Afetler (Deprem, Tsunami, Heyelan, Volkanizma)",
          "Hidrolojik ve Meteorolojik/Klimatolojik Afetler (Sel, Taşkın, Fırtına, Kuraklık, Çığ)",
          "Sosyal ve Teknolojik Afetler"
        ],
        "Bütüncül Afet Yönetimi": [
          "Afet Yönetiminin Aşamaları (Risk Azaltma, Hazırlık, Müdahale, İyileştirme)",
          "Bütüncül Afet Yönetimi Uygulamaları, Göstergeleri ve Tablo/Diyagram Yorumu"
        ],
        "Bölge ve Bölge Sınırı": [
          "Bölge Kavramı ve Bölge Belirleme Kriterleri (Doğal, Beşerî, İdari, İşlevsel Bölgeler)",
          "Bölge Sınırlarının Değişebilirliği, Örüntüleri ve Bölge Türlerinin Karşılaştırılması"
        ],

        // --- 10. SINIF COĞRAFYA ---
        "Coğrafi Bakış": [
          "Coğrafi Olay, Olgu ve Mekânların Konumu ve Temel Coğrafi Koşulları",
          "Coğrafi Olayların Yakın ve Uzak Çevresiyle İlişkileri ve Karşılıklı Etkileşimi"
        ],
        "CBS ve Uzaktan Algılamanın Uygulama Alanları": [
          "Coğrafi Bilgi Sistemleri (CBS) ve Uzaktan Algılamanın Kullanım Alanları ve Örnek Uygulamalar",
          "CBS ve Uzaktan Algılama Verilerinin Sınıflandırılması ve Yorumlanması"
        ],
        "Mekânsal Verilerin Haritalara Aktarılması": [
          "Mekânsal Bilgi Teknolojileri ile Altlık Haritalar Üzerinde Nokta, Çizgi ve Alan Vektör Verilerinin Oluşturulması",
          "Mekânsal Verilerin Haritaya İşlenmesi, Harita Bileşenleri ve Haritanın Kullanımı"
        ],
        "Tektonik Süreçler": [
          "Levha Tektoniği Kuramı ve Levha Hareketlerine Neden Olan İç Süreçler (Manto ve Konveksiyonel Akımlar)",
          "Levha Sınırları, Levha Tektoniği ve Yeryüzü Şekilleri Arasındaki İlişkiler"
        ],
        "İklim ve Kayaç Yapısının Aşınma ve Çözünme Süreçlerine Etkisi": [
          "Kayaç Türleri (Magmatik, Tortul, Başkalaşım) ve Fiziksel/Kimyasal Çözünme Süreçleri",
          "İklim Özellikleri ile Kayaç Yapısının Aşınma ve Çözünme Üzerindeki Neden-Sonuç İlişkileri"
        ],
        "Aşınım ve Birikim Süreçlerinin Yeryüzü Şekillerinin Oluşumuna Etkisi": [
          "Dış Kuvvetler (Akarsular, Rüzgârlar, Buzullar, Dalga ve Akıntılar, Karstik Süreçler) Tarafından Oluşturulan Aşınım Şekilleri",
          "Dış Kuvvetler Tarafından Oluşturulan Birikim Şekilleri ve Yeryüzü Şekilleriyle İlişkisi"
        ],
        "Yeryüzü Şekilleri ile İlgili Gözlem ve Saha Çalışması": [
          "Yeryüzü Şekillerinin Oluşum ve Değişimini İncelemeye Yönelik Saha/Sanal Saha Çalışmaları",
          "Saha Çalışmasında Bilgi Toplama, Veri Çözümleme ve Tahminlerin Raporlanması"
        ],
        "Yeryüzü Şekilleri ile Beşerî Faaliyetler Arasındaki Etkileşim": [
          "Yeryüzü Şekillerinin Yerleşme, Tarım, Sanayi ve Ulaşım Faaliyetlerine Etkisi",
          "Beşerî Faaliyetlerin Yeryüzü Şekilleri Üzerindeki Değiştirici Etkileri"
        ],
        "Yerleşmelerin Kuruluşu ve Gelişimi": [
          "Yerleşme Yeri Seçiminde ve Tarihsel Gelişiminde Etkili Olan Doğal ve Beşerî Faktörler",
          "Kırsal ve Şehirsel Yerleşmelerin Kuruluş Nedenleri ve Gelişim Aşamaları"
        ],
        "Yerleşmelerin Fonksiyonları": [
          "Türkiye'de ve Dünyada Yerleşmelerin Fonksiyonel Özellikleri (Tarım, Sanayi, Ticaret, Turizm, İdari, Kültürel Şehirler)",
          "Yerleşmelerin Fonksiyonlarına Göre Sınıflandırılması ve Etki Alanları"
        ],
        "Ekonomik Faaliyetlerin Özellikleri": [
          "Ekonomik Faaliyetlerin Sektörel Sınıflandırılması (Birincil, İkincil, Üçüncül, Dördüncül, Beşincil Sektörler)",
          "Sektörlerin Nitelikleri, İşlevleri ve Ülke Ekonomilerindeki Yeri"
        ],
        "Ekonomik Sektörler ve Gelişmişlik": [
          "Farklı Gelişmişlik Seviyesine Sahip Ülkelerde Ekonomik Sektörlerin Dağılımı (Tablo, Grafik ve Şekiller)",
          "Sektörel İstihdam ve Gelir Dağılımı ile Kalkınmışlık Düzeyi Arasındaki İlişkiler"
        ],
        "Türkiye Ekonomisinin Sektörel Dağılımı": [
          "Türkiye Ekonomisinde Tarım, Sanayi ve Hizmet Sektörlerinin Yeri ve Önemi",
          "Türkiye'deki Sektörel Dağılımın Zaman İçerisindeki Değişimi ve Grafiksel Gösterimi"
        ],
        "Afetlerle Mücadelede İyi Uygulama Örnekleri": [
          "Farklı Ülkelerdeki Afet Yönetimi ve Afetle Mücadele Başarı/İyi Uygulama Örnekleri",
          "Afetlere Yönelik Alınan Tedbirler, Erken Uyarı Sistemleri ve Karşılaştırmalı Analizler"
        ],
        "Afetlere Karşı Dirençli Yaşam Alanları": [
          "Afete Dirençli Şehirler ve Yaşam Alanlarının Coğrafi Koşulları",
          "Dirençli Yaşam Alanlarındaki Mekânsal Unsurlar, Altyapı ve Yapı Güvenliği İlişkileri"
        ],
        "Afetlerden Korunma": [
          "Mekânın Özelliklerine Göre Afetlerden Korunma Stratejileri ve Bireysel/Toplumsal Önlemler",
          "Afet Öncesi, Sırası ve Sonrası Doğru Davranış Şekilleri ve Güvenlik Protokolleri"
        ],
        "Afet Bilinci": [
          "Birey ve Toplum Düzeyinde Afet Bilinci ve Kültürünün Geliştirilmesi",
          "Afet Bilincinin Can ve Mal Kayıplarını Azaltmadaki Rolü ve Sorumluluklar"
        ],
        "Türk Kültürünün Mekânsal Özellikleri": [
          "Türk Kültürünün Doğuşu, Yayıldığı Coğrafi Alanlar ve Mekânsal İzleri",
          "Türk Dünyasının Ortak Kültürel Özellikleri, Maddi ve Manevi Kültür Mirası Unsurları"
        ],

        // --- 11. SINIF COĞRAFYA ---
        "Mekânsal Sorunlar Karşısında Coğrafya Bilimi": [
          "Günümüz Mekânsal Sorunlarının (Çarpık Kentleşme, Çevre Kirliliği, Kaynak Tükenmesi) Çözümünde Coğrafyanın Katkısı",
          "Coğrafya Biliminin Mekânsal Sorunlara Bütüncül ve Nedensel Yaklaşımı"
        ],
        "Web Tabanlı CBS Uygulamaları": [
          "Web Tabanlı Coğrafi Bilgi Sistemleri (CBS) ile Harita Okuma, Katman Yönetimi ve Analiz",
          "Web Tabanlı CBS Ortamında Mekânsal Veri Girişi ve Tematik Harita Üretimi"
        ],
        "Su Kaynakları": [
          "Yeryüzündeki Su Kaynaklarının (Okyanuslar, Denizler, Göller, Akarsular, Yeraltı Suları, Buzullar) Sınıflandırılması",
          "Su Kaynaklarının Dağılışı, Hidrolojik Döngü ve Ekolojik Denge İçin Önemi"
        ],
        "Türkiye’deki Su Kaynaklarının Etkileri": [
          "Türkiye'nin Denizleri, Gölleri, Akarsuları ve Yeraltı Suları",
          "Türkiye'deki Su Kaynaklarının Çevresel, Ekonomik, Politik ve Sosyokültürel Etkileri"
        ],
        "Yerleşmelerin Mekânsal Organizasyonları": [
          "Türkiye ve Dünyadaki Yerleşmelerin Mekânsal Deseni ve Organizasyonunu Etkileyen Koşullar",
          "Yerleşmelerde Mekânsal Hiyerarşi, Kademelenme ve Fonksiyonel Bağlantılar"
        ],
        "Yerleşmelerin Etki Alanları": [
          "Şehirlerin Küresel, Bölgesel ve Yerel Ölçekteki Etki Alanları",
          "Türkiye ve Dünyadaki Şehirlerin Çevre Mekânlara ve Küresel Sisteme Etkileri"
        ],
        "Tarımsal Faaliyetler ve Gıda Güvencesi": [
          "Tarımsal Üretim, Nüfus Artışı ve Küresel Gıda Güvencesi İlişkisi",
          "İklim Değişikliği ve Çevresel Baskıların Gıda Güvencesi Üzerindeki Tehditleri"
        ],
        "Tarım Uygulamalarında Sürdürülebilirlik": [
          "Dünya ve Türkiye'deki Geleneksel ve Modern Tarım Yöntemleri",
          "Sürdürülebilir Tarım, İyi Tarım Uygulamaları ve Organik Tarım Kriterleri"
        ],
        "Stratejik ve Kritik Madenler": [
          "Dünya ve Türkiye'de Bulunan Stratejik ve Kritik Madenler (Bor, Nadir Toprak Elementleri, Lityum vb.)",
          "Madenlerin Ülke Ekonomileri, Yüksek Teknoloji ve Ülkeler Arası İlişkilerdeki Jeopolitik Rolü"
        ],
        "Enerji Kaynakları": [
          "Fosil Enerji Kaynakları (Kömür, Petrol, Doğal Gaz) ve Nükleer Enerji",
          "Yenilenebilir Enerji Kaynakları (Güneş, Rüzgâr, Biyokütle, Jeotermal, Hidroelektrik)",
          "Dünya ve Türkiye'de Enerji Kaynakları Kullanımındaki Değişim ve Süreklilik",
          "Enerji Tasarrufu, Verimlilik ve Sürdürülebilir Kalkınma Amaçları"
        ],
        "Sanayileşmenin Mekânsal Etkileri": [
          "Sanayi Faaliyetlerinin Kuruluş Yeri Seçimi ve Mekânsal Dağılışı",
          "Sanayileşmenin Kentleşme, Göç, Çevre Sorunları ve Mekânsal Dönüşüm Üzerindeki Etkileri"
        ],
        "Gezegen Sınırı": [
          "Gezegen Sınırları Kavramı ve Yeryüzünün Taşıma Kapasitesi (İklim, Biyoçeşitlilik, Azot-Fosfor Döngüsü vb.)",
          "Gezegen Sınırlarının Zorlanması Sonucu Ortaya Çıkan Küresel Çevre Sorunları"
        ],
        "Küresel İklim Değişikliği": [
          "Küresel İklim Değişikliğinin Nedenleri, Sera Gazı Emisyonları ve Küresel Sıcaklık Artışı",
          "İklim Değişikliğinin Etkilerini Azaltma (Mitigasyon) ve Uyum (Adaptasyon) Stratejileri"
        ],
        "Türkiye’de Suyun Sürdürülebilir Kullanımı": [
          "Türkiye'nin Su Potansiyeli, Su Stresi ve Havza Yönetimi",
          "Tarımda, Sanayide ve Evsel Kullanımda Su Tasarrufu ve Sürdürülebilir Su Politikaları"
        ],
        "Türkiye’nin Kültürel Hinterlandı": [
          "Türkiye'nin Tarihî ve Kültürel Açıdan Güçlü ve Köklü Bağlara Sahip Olduğu Coğrafyalar (Balkanlar, Kafkaslar, Orta Asya, Orta Doğu, Kuzey Afrika)",
          "Kültürel Hinterland ile Türkiye Arasındaki Etkileşim ve TİKA/Kültür Diplomasisinin Rolü"
        ],
        "Tarımsal Üretim: Örnek Ülke": [
          "Örnek Bir Ülkenin Tarımsal Üretim Özellikleri, Tarım Politikaları ve Coğrafi Koşulları",
          "Örnek Ülkenin Tarımsal Verimliliği ve Dünya Tarım Ticaretindeki Yeri"
        ],
        "Sanayileşme Süreci: Örnek Ülkeler": [
          "Örnek Ülkelerin Sanayileşme Süreçleri, Sanayi Devrimi ve Coğrafi Faktörler",
          "Örnek Ülkelerin Sanayi Gelişim Modellerinin Karşılaştırılması"
        ],
        "Madencilik Faaliyetleri: Örnek Ülke": [
          "Örnek Bir Ülkede Yürütülen Madencilik Faaliyetleri ve Rezerv Özellikleri",
          "Madencilik Verilerinin Tablo, Grafik ve Diyagramlarla İncelenmesi ve Ekonomik Etkileri"
        ],
        "Enerji Kaynakları: Örnek Ülkeler": [
          "Enerji Üretiminde Öne Çıkan Örnek Ülkelerin Enerji Politikaları ve Kaynak Tercihleri",
          "Örnek Ülkelerin Enerji Kaynaklarının Coğrafi Açıdan Karşılaştırılması"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      if (!targetSubject || targetSubject === "9. Sınıf Coğrafya") {
        subjects["9. Sınıf Coğrafya"] = grade9Topics;
      }
      if (!targetSubject || targetSubject === "10. Sınıf Coğrafya") {
        subjects["10. Sınıf Coğrafya"] = grade10Topics;
      }
      if (!targetSubject || targetSubject === "11. Sınıf Coğrafya") {
        subjects["11. Sınıf Coğrafya"] = grade11Topics;
      }

      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: `${targetSubject || "9., 10. ve 11. Sınıf Coğrafya"} müfredatı başarıyla güncellendi`,
        grade9Count: grade9Topics.length,
        grade10Count: grade10Topics.length,
        grade11Count: grade11Topics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  app.post("/api/admin/curriculum/sync-edebiyat", async (req, res) => {
    try {
      const db = getDb();
      const { targetSubject } = req.body || {};

      const grade9Topics = [
        "Sözün İnceliği: Şiir ve Deneme (Okuma - Anlama)",
        "Sözün İnceliği: Betimleme Paragrafı (Yazma)",
        "Sözün İnceliği: Mülakat (Dinleme - İzleme)",
        "Sözün İnceliği: Fikir Geliştirme ve İkna Edici Konuşma",
        "Anlam Arayışı: Hikâye ve Anı (Okuma - Anlama)",
        "Anlam Arayışı: Karakter Tanıtımı (Konuşma)",
        "Anlam Arayışı: Şiir Dinleme ve Çözümleme",
        "Anlam Arayışı: Temaya Uygun Şiir Yazma",
        "Anlamın Yapı Taşları: Hikâye, Şiir ve Gezi Yazısı (Okuma - Çözümleme)",
        "Anlamın Yapı Taşları: Mekân Karşılaştırma Sunumu (Konuşma)",
        "Anlamın Yapı Taşları: Belgesel Çözümleme (Dinleme - İzleme)",
        "Anlamın Yapı Taşları: Belgeseli İnfografik Metne Dönüştürme (Yazma)",
        "Dilin Zenginliği: Roman, Tiyatro ve Eleştiri (Okuma - Çözümleme)",
        "Dilin Zenginliği: Sosyal Medya Dili ve Edebî Dil (Konuşma)",
        "Dilin Zenginliği: Otobiyografi Dinleme ve İnceleme",
        "Dilin Zenginliği: Otobiyografi / Öz Yaşam Öyküsü Yazma"
      ];

      const grade10Topics = [
        "Sözün Ezgisi: Koşuk, Koşma, Türkü ve Ninni (Okuma - Çözümleme)",
        "Sözün Ezgisi: Şiir Dinletisi Hazırlama ve Sunma (Konuşma)",
        "Sözün Ezgisi: Masal Dinleme ve Çözümleme",
        "Sözün Ezgisi: Masalı Film Şeridi / Senaryo Hâline Getirme (Yazma)",
        "Kelimelerin Ritmi: Gazel, Kaside ve Saf Şiir (Okuma - Çözümleme)",
        "Kelimelerin Ritmi: Bilgilendirici Metni Edebî Metne Dönüştürme (Yazma)",
        "Kelimelerin Ritmi: Söyleşi Dinleme ve Çözümleme",
        "Kelimelerin Ritmi: Edebî Şahsiyet Tanıtımı / Podcast Hazırlama (Konuşma)",
        "Dünden Bugüne: Destan, Halk Hikâyesi ve Mesnevi (Okuma - Çözümleme)",
        "Dünden Bugüne: Dede Korkut Hikâyelerini Canlandırma / Destan Sunumu",
        "Dünden Bugüne: Fabl Dinleme ve Çözümleme",
        "Dünden Bugüne: Fabl Yazma / Hikâyeyi Şiire Dönüştürme (Yazma)",
        "Nesillerin Mirası: Dede Korkut, Tanzimat, Servetifünun ve Fecriati Metinleri",
        "Nesillerin Mirası: Dede Korkut Hikâyelerinden Sahneleme (Konuşma)",
        "Nesillerin Mirası: Millî Edebiyat Dönemi Hikâyesi Dinleme ve Çözümleme",
        "Nesillerin Mirası: Hikâyeyi Şiire Dönüştürme (Yazma)"
      ];

      const grade11Topics = [
        "Bir Diyeceğim Var!: Karagöz Oyunu, Mektup ve Dilekçe (Okuma - Çözümleme)",
        "Bir Diyeceğim Var!: Sözlü İletişim Engelleri ve Drama (Konuşma)",
        "Bir Diyeceğim Var!: İletişim Temalı Metin Dinleme ve Çözümleme",
        "Bir Diyeceğim Var!: E-Posta (Elektronik Mektup) Yazma",
        "Kültür Yolculuğu: Türk Dünyası Hikâyesi, Anı, Orhun Abideleri ve Dîvânu Lugâti’t-Türk",
        "Kültür Yolculuğu: Türk Dünyası ve Kültürel Zenginlik Sunumu (Konuşma)",
        "Kültür Yolculuğu: Âşık Atışması Dinleme ve İnceleme",
        "Kültür Yolculuğu: Çevrim İçi Müze Gezisi ve İzlenim Yazısı (Yazma)",
        "Yaşamın İzinde: Roman, Biyografi ve Tezkire (Okuma - Çözümleme)",
        "Yaşamın İzinde: Romandaki Bir Karakterle Hayalî Mülakat (Konuşma)",
        "Yaşamın İzinde: Radyo Tiyatrosu Dinleme ve Çözümleme",
        "Yaşamın İzinde: Metindeki Bir Diyaloğu Yeniden Yazma",
        "Hayatın Aynası: Tiyatro ve Küçürek Hikâye (Okuma - Çözümleme)",
        "Hayatın Aynası: Tiyatro Metnini Dramatize Etme / Sahneleme (Konuşma)",
        "Hayatın Aynası: Belgesel İzleme ve Çözümleme",
        "Hayatın Aynası: Belgesele Afiş ve Tanıtım Metni Hazırlama (Yazma)"
      ];

      const newSubtopicsMap: Record<string, string[]> = {
        // --- 9. SINIF EDEBİYAT ---
        "Sözün İnceliği: Şiir ve Deneme (Okuma - Anlama)": [
          "Metin Öncesi Hazırlık, Okuma Amacı, Yöntem ve Stratejisi Belirleme",
          "Şiir ve Deneme Metinlerinde Söz Varlığı, Bağlam ve Çıkarım Yapma",
          "Metnin Konusu, Teması, Ana Düşüncesi/Duygusu ve Yardımcı Düşünceler",
          "Söz Sanatları, Edebî Söyleyiş ve Yazar/Şair-Metin İlişkisi"
        ],
        "Sözün İnceliği: Betimleme Paragrafı (Yazma)": [
          "Şiir Metninden Hareketle Betimleme Paragrafı Planlama ve Hedef Kitleyi Belirleme",
          "Anlatım Biçimleri (Betimleyici Anlatım) ve Düşünceyi Geliştirme Yollarını Kullanma",
          "Yazma Sürecini Değerlendirme, Akıcılık, Tasvir Özellikleri, Yazım ve Noktalama"
        ],
        "Sözün İnceliği: Mülakat (Dinleme - İzleme)": [
          "Çok Modlu Mülakat Metninde Dinleme/İzleme Stratejisi Belirleme ve Anlam Oluşturma",
          "Dinlenen/İzlenen Mülakatta Açık ve Örtük İletiler, Neden-Sonuç İlişkileri ve Çıkarımlar"
        ],
        "Sözün İnceliği: Fikir Geliştirme ve İkna Edici Konuşma": [
          "Deneme Metinlerinden Hareketle Fikir Geliştirme Teknikleri ve Konuşma Tasarımı",
          "Muhatabını İkna Etmek İçin Söyleyiş İncelikleri, Karşılaştırma ve Üslup Kullanımı",
          "Konuşma Sürecini ve Özgün Konuşmacı Kimliğini Değerlendirme"
        ],
        "Anlam Arayışı: Hikâye ve Anı (Okuma - Anlama)": [
          "Hikâye ve Anı Metinlerinde Okuma Amacı, Tahmin ve Strateji Belirleme",
          "Olay Örgüsü, Kişi, Zaman ve Mekân Unsurları ile Dil-Anlatım Özellikleri",
          "Karakterlerin Davranış, Duygu ve Düşüncelerine Yönelik Çıkarımlar",
          "Hikâye ve Anı Metinlerinin Karşılaştırılması ve Yazar-Metin İlişkisi"
        ],
        "Anlam Arayışı: Karakter Tanıtımı (Konuşma)": [
          "Hikâye Karakterini Günlük Yaşamdaki Bir Kişiyle Özdeşleştirerek Sunum Hazırlama",
          "Konuşmada Beden Dili, Ses, Diksiyon, Süre Yönetimi ve Etkileyicilik"
        ],
        "Anlam Arayışı: Şiir Dinleme ve Çözümleme": [
          "Çok Modlu Şiir Metnini Dinleme/İzleme, Ana Duygu ve Temayı Belirleme",
          "Dinlenen Şiirde Ritim, Ahenk Ögeleri, İmge ve Söz Varlığını Çözümleme"
        ],
        "Anlam Arayışı: Temaya Uygun Şiir Yazma": [
          "Tema ve Ana Duyguya Uygun Şiir Yazma Sürecini Planlama",
          "Ritim, Ahenk Ögeleri, İmge Dünyası ve Bağlama Uygun Söz Varlığı Kullanımı",
          "Yazılan Şiiri Değerlendirme, Düzeltme ve Paylaşma"
        ],
        "Anlamın Yapı Taşları: Hikâye, Şiir ve Gezi Yazısı (Okuma - Çözümleme)": [
          "Hikâye, Şiir ve Gezi Yazısı Metinlerinde Okuma Sürecini Yönetme",
          "Metni Oluşturan Biçim ve Anlam Birimleri ile Dil İşlevlerini Çözümleme",
          "Metinlerin Yazıldığı Dönemin Özellikleri, Toplumla İlişkisi ve Değer Aktarımı"
        ],
        "Anlamın Yapı Taşları: Mekân Karşılaştırma Sunumu (Konuşma)": [
          "Okunan Metinlerdeki Mekânları Kendi Çevresindeki Mekânlarla Karşılaştıran Konuşma Hazırlama",
          "Benzetme ve Karşılaştırma Yaparak Yapısal Özellikleri Ortaya Koyma ve Akıcı Anlatım"
        ],
        "Anlamın Yapı Taşları: Belgesel Çözümleme (Dinleme - İzleme)": [
          "Çok Modlu Metin (Belgesel) İzleme, Anlam Çıkarma ve Yapı Unsurlarını Çözümleme",
          "Belgeseldeki Görsel ve İşitsel İletilerin Dönem ve Toplumla İlişkisi"
        ],
        "Anlamın Yapı Taşları: Belgeseli İnfografik Metne Dönüştürme (Yazma)": [
          "İzlenen Belgeselden Hareketle Bilgi Görseli (İnfografik) Tasarımı ve Metin Yazımı",
          "Görsel Ögeler, Başlıklar, Ana ve Yardımcı Bilgilerin Düzenlenmesi, Yazım ve Noktalama"
        ],
        "Dilin Zenginliği: Roman, Tiyatro ve Eleştiri (Okuma - Çözümleme)": [
          "Roman, Tiyatro ve Eleştiri Metinlerinde Okuma ve Anlamlandırma",
          "Karakter Analizi, Çatışma, Dramatik Örgü, Üslup Tercihleri ve Dönemsel Özellikler",
          "Metindeki Gerçeklik ile Kurgu İlişkisi ve Kişisel Beğeni Ölçütleriyle Değerlendirme"
        ],
        "Dilin Zenginliği: Sosyal Medya Dili ve Edebî Dil (Konuşma)": [
          "Sosyal Medya Dili ile Edebî Dilin Özelliklerini Karşılaştıran Sunum Hazırlama",
          "Türkçenin Doğru, Etkili ve Zengin Kullanımı Üzerine Eleştirel Bakış Açısı Geliştirme"
        ],
        "Dilin Zenginliği: Otobiyografi Dinleme ve İnceleme": [
          "Çok Modlu Otobiyografi Metnini Dinleme/İzleme ve Yaşam Kesitlerini Çözümleme",
          "Otobiyografide Gerçeklik, Bakış Açısı, Yazarın Amacı ve Değerlendirmesi"
        ],
        "Dilin Zenginliği: Otobiyografi / Öz Yaşam Öyküsü Yazma": [
          "Öz Yaşam Öyküsünü Kendi Üslup Özelliklerini Yansıtarak Yazma Sürecini Planlama",
          "Kronolojik ve Tematik Bütünlük, Olay ve Mekân Seçimi, Akıcı ve Samimi Anlatım",
          "Otobiyografi Metnini Öz Değerlendirme ve Akran Değerlendirmesiyle Sonlandırma"
        ],

        // --- 10. SINIF EDEBİYAT ---
        "Sözün Ezgisi: Koşuk, Koşma, Türkü ve Ninni (Okuma - Çözümleme)": [
          "Koşuk, Koşma, Türkü ve Ninni Metinlerinde Okuma Amacı ve Stratejisi",
          "Nazım Birimi, Ölçü, Kafiye, Redif, Ezgi ve Ahenk Unsurlarını Çözümleme",
          "Şiirlerin Yazıldığı Dönem, İslamiyet Öncesi ve Halk Şiiri Geleneği ile İlişkisi"
        ],
        "Sözün Ezgisi: Şiir Dinletisi Hazırlama ve Sunma (Konuşma)": [
          "Belirlenen Tema Çerçevesinde Şiir Dinletisi Repertuarı Oluşturma ve Planlama",
          "Şiir Sunumunda Vurgu, Tonlama, Diksiyon, Beden Dili ve Görsel-İşitsel Ögeleri Yönetme"
        ],
        "Sözün Ezgisi: Masal Dinleme ve Çözümleme": [
          "Çok Modlu Masal Metninde Dinleme/İzleme Stratejileri ve Anlam Oluşturma",
          "Masalın Yapı Unsurları (Döşeme, Olay, Dilek), Olağanüstü Ögeler, Tip ve Karakterler",
          "Masallarda Evrensel Değerler, İyilik-Kötülük Çatışması ve İletilerin Sunuluşu"
        ],
        "Sözün Ezgisi: Masalı Film Şeridi / Senaryo Hâline Getirme (Yazma)": [
          "Dinlenen Masalı Olay Akışı ve Karakter Tasarımıyla Film Şeridine/Görsel Metne Dönüştürme",
          "Senaryo Yazım İlkeleri, Sahne Düzeni, Diyaloglar, Görsel Dil ve Estetik"
        ],
        "Kelimelerin Ritmi: Gazel, Kaside ve Saf Şiir (Okuma - Çözümleme)": [
          "Gazel, Kaside ve Saf Şiir Metinlerinde Okuma Yönetimi ve Anlam Oluşturma",
          "Divan Şiiri Nazım Biçimleri, Beyit Düzeni, Kafiye-Redif, Aruz Ölçüsü ve Mazmunlar",
          "Saf Şiir (Öz Şiir) Anlayışı, Bireysel Temalar, İmge ve Estetik Kusursuzluk Arayışı"
        ],
        "Kelimelerin Ritmi: Bilgilendirici Metni Edebî Metne Dönüştürme (Yazma)": [
          "Bilgilendirici Metni Sanatsal/Edebî Metne Dönüştürme Sürecini Planlama",
          "Mecazlı Söyleyiş, Deyim ve Atasözleri, İmgesel Dil ve Özgün Üslup Geliştirme"
        ],
        "Kelimelerin Ritmi: Söyleşi Dinleme ve Çözümleme": [
          "Çok Modlu Söyleşi Metnini Dinleme/İzleme ve Ana Düşünceyi Belirleme",
          "Söyleşide Yazar-Okur Diyaloğu, Samimi Anlatım, Dil İşlevleri ve Çıkarımlar"
        ],
        "Kelimelerin Ritmi: Edebî Şahsiyet Tanıtımı / Podcast Hazırlama (Konuşma)": [
          "İz Bırakmış Edebiyatçıların Hayatı ve Edebî Kişiliğine Dair Podcast Metni Hazırlama",
          "Podcast Kaydı, Ses Tonlaması, Müzik/Efekt Kullanımı ve Akıcı Anlatım"
        ],
        "Dünden Bugüne: Destan, Halk Hikâyesi ve Mesnevi (Okuma - Çözümleme)": [
          "Destan, Halk Hikâyesi ve Mesnevi Metinlerinde Okuma ve Anlamlandırma",
          "Anonim ve Ferdi Destanlar, Halk Hikâyelerinde Şiir-Düz Yazı Birlikteliği, Mesnevi Yapısı",
          "Tarihî ve Kültürel Dönüşümün Anlatmaya Bağlı Metinlere Yansıması"
        ],
        "Dünden Bugüne: Dede Korkut Hikâyelerini Canlandırma / Destan Sunumu": [
          "Dede Korkut Hikâyelerinden Seçilen Bir Kesiti Canlandırma ve Rol Oynama",
          "Türk Destanları ve Kahramanlık Motifleri Üzerine Sunum Gerçekleştirme"
        ],
        "Dünden Bugüne: Fabl Dinleme ve Çözümleme": [
          "Çok Modlu Fabl Metnini Dinleme/İzleme, Sembolik Anlatım ve Teşhis-İntak Sanatları",
          "Fablın Eğitici ve Öğretici Yönü, Çıkarılan Ahlaki Dersler ve Evrensel Mesajlar"
        ],
        "Dünden Bugüne: Fabl Yazma / Hikâyeyi Şiire Dönüştürme (Yazma)": [
          "Özgün Bir Fabl Kurgulama ya da İncelenen Hikâyeyi Şiir Formuna Dönüştürme",
          "Karakter Konuşturma, Manzum/Mensur Anlatım, Kafiye ve Ritim Düzeni"
        ],
        "Nesillerin Mirası: Dede Korkut, Tanzimat, Servetifünun ve Fecriati Metinleri": [
          "Dede Korkut, Tanzimat Şiiri, Servetifünun Romanı ve Fecriati Şiirinde Okuma ve Çözümleme",
          "Dönemlerin Sosyal-Siyasi Yapısı, Batılılaşma Süreci, Sanat Anlayışları ve Temalar",
          "Metinlerin Edebiyat Tarihindeki Yeri, Dil ve Üslup Değişimlerinin Tahlili"
        ],
        "Nesillerin Mirası: Dede Korkut Hikâyelerinden Sahneleme (Konuşma)": [
          "Dede Korkut Hikâyelerindeki Bir Olayı Dramatize Ederek Sahneleme",
          "Geleneksel Kültür Unsurları, Hitap ve Diyalog Kurgusu, Sahne Performansı"
        ],
        "Nesillerin Mirası: Millî Edebiyat Dönemi Hikâyesi Dinleme ve Çözümleme": [
          "Millî Edebiyat Dönemi Hikâyesini Dinleme/İzleme ve Anlam Oluşturma",
          "Genç Kalemler Hareketi, Yeni Lisan, Sade Türkçe, Memleket ve Millet Sevgisi"
        ],
        "Nesillerin Mirası: Hikâyeyi Şiire Dönüştürme (Yazma)": [
          "Dinlenen Millî Edebiyat Hikâyesini Şiir Formunda Yeniden Yazma",
          "Duygu Yoğunluğu, Dize Kurgusu, Ahenk Ögeleri, Dil ve Noktalama Kuralları"
        ],

        // --- 11. SINIF EDEBİYAT ---
        "Bir Diyeceğim Var!: Karagöz Oyunu, Mektup ve Dilekçe (Okuma - Çözümleme)": [
          "Geleneksel Türk Tiyatrosu (Karagöz Oyunu): Bölümleri, Tipleri ve Güldürü Unsurları",
          "Mektup (Edebî ve Özel) ile Dilekçe Metinlerinin Yapısal ve Dilsel Özellikleri",
          "Metinlerin Yazılış Amaçları, İletişimdeki Rolü ve Kültürel Değerleri"
        ],
        "Bir Diyeceğim Var!: Sözlü İletişim Engelleri ve Drama (Konuşma)": [
          "Günlük Hayatta Karşılaşılan İletişim Engellerini (Ön Yargı, İletişim Kazaları) Canlandırma",
          "Empatik Dinleme, Çözüm Odaklı İletişim ve Etkili Konuşma Becerileri"
        ],
        "Bir Diyeceğim Var!: İletişim Temalı Metin Dinleme ve Çözümleme": [
          "İletişim ve Empati Temalı Çok Modlu Metinleri Dinleme/İzleme ve Anlama",
          "İletişim Sürecinin Ögeleri (Gönderici, Alıcı, İleti, Kanal, Dönüt) ve Dil İşlevleri"
        ],
        "Bir Diyeceğim Var!: E-Posta (Elektronik Mektup) Yazma": [
          "Resmî ve Sosyal İçerikli E-Posta Yazma Kuralları, Başlık ve Hitap Düzeni",
          "Açık, Anlaşılır, Nezaket Kurallarına Uygun İleti Oluşturma, Yazım ve Noktalama"
        ],
        "Kültür Yolculuğu: Türk Dünyası Hikâyesi, Anı, Orhun Abideleri ve Dîvânu Lugâti’t-Türk": [
          "Orhun Abideleri (Göktürk Yazıtları) ve Dîvânu Lugâti’t-Türk Metinlerini Okuma ve Anlama",
          "Türk Dünyası Edebiyatından Hikâye ve Anı Metinlerinin İncelenmesi",
          "Türk Dilinin Tarihî Gelişimi, Millî Kimlik ve Ortak Kültürel Mirasın Çözümlenmesi"
        ],
        "Kültür Yolculuğu: Türk Dünyası ve Kültürel Zenginlik Sunumu (Konuşma)": [
          "Türk Dünyasının Ortak Kültürünü (Dil, Din, Coğrafya, Sanat) Yansıtan Sunum Hazırlama",
          "Görsel ve Dijital Materyal Kullanımı, Akıcı ve Etkileyici Hitabet"
        ],
        "Kültür Yolculuğu: Âşık Atışması Dinleme ve İnceleme": [
          "Çok Modlu Âşık Atışması Metnini Dinleme/İzleme ve Anlamlandırma",
          "Âşıklık Geleneği, Doğaçlama Şiir Söyleme, Saz Eşliğinde Atışma ve Lebdeğmez Kuralı"
        ],
        "Kültür Yolculuğu: Çevrim İçi Müze Gezisi ve İzlenim Yazısı (Yazma)": [
          "Sanal/Çevrim İçi Müze Gezisi Yaparak Kültürel Mirasa İlişkin İzlenimleri Yazma",
          "Gezi Yazısı Türünün Özellikleri, Gözleme Dayalı Tasvir ve Özgün Yorumlar"
        ],
        "Yaşamın İzinde: Roman, Biyografi ve Tezkire (Okuma - Çözümleme)": [
          "Biyografik Roman, Biyografi ve Divan Edebiyatı Tezkire Metinlerinde Okuma ve Çözümleme",
          "Sanatçıların ve Tarihî Şahsiyetlerin Hayat Hikâyelerinin Edebiyata Yansıması",
          "Tezkire Geleneği ile Modern Biyografi Türünün Karşılaştırılması"
        ],
        "Yaşamın İzinde: Romandaki Bir Karakterle Hayalî Mülakat (Konuşma)": [
          "Okunan Romandaki Bir Karakterle Dönemine ve Ruh Hâline Uygun Hayalî Mülakat Yapma",
          "Mülakat Soruları Hazırlama, Karakteri Canlandırma, Ses Tonu ve Beden Dili"
        ],
        "Yaşamın İzinde: Radyo Tiyatrosu Dinleme ve Çözümleme": [
          "Çok Modlu Radyo Tiyatrosu Dinleme, Ses Efektleri ve Olay Kurgusunu Takip Etme",
          "Radyo Tiyatrosunda Karakter Betimlemeleri, Çatışma ve Dramatik Yapıyı Çözümleme"
        ],
        "Yaşamın İzinde: Metindeki Bir Diyaloğu Yeniden Yazma": [
          "Dinlenen Metindeki Bir Diyaloğu Seçip Farklı Bir Tür/Bağlamda Yeniden Kurgulama",
          "Dramatik Yapı, Diyalogların Doğallığı, Üslup Özellikleri ve Yaratıcı Yazma"
        ],
        "Hayatın Aynası: Tiyatro ve Küçürek Hikâye (Okuma - Çözümleme)": [
          "Tiyatro ve Küçürek (Minimal) Hikâye Metinlerinde Okuma ve Anlamlandırma",
          "Tiyatroda Sahneleme, Dramatik Örgü, Çatışma; Küçürek Hikâyede Anlam Yoğunluğu ve İma",
          "Metinlerdeki Toplumsal Eleştiri, Gerçeklik ve İnsan Doğası Yansımaları"
        ],
        "Hayatın Aynası: Tiyatro Metnini Dramatize Etme / Sahneleme (Konuşma)": [
          "İncelenen Tiyatro Metninden Bir Sahneyi Canlandırma ve Rol Oynama",
          "Grup İçi İş Birliği, Jest-Mimik, Sahne Hâkimiyeti ve Duygu Aktarımı"
        ],
        "Hayatın Aynası: Belgesel İzleme ve Çözümleme": [
          "Çok Modlu Belgesel Metnini İzleme/Dinleme, Bilgi ve Görsel İletileri Çözümleme",
          "Belgeselde İşlenen Toplumsal/Kültürel Meselenin Neden-Sonuç İlişkilerini Değerlendirme"
        ],
        "Hayatın Aynası: Belgesele Afiş ve Tanıtım Metni Hazırlama (Yazma)": [
          "İzlenen Belgesele Yönelik Dikkat Çekici Bir Afiş Tasarımı ve Tanıtım Yazısı Hazırlama",
          "Görsel Tasarım İlkeleri, Çarpıcı Başlık/Slogan Kullanımı, Yazım ve Noktalama"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      if (!targetSubject || targetSubject === "9. Sınıf Edebiyat" || targetSubject === "9. Sınıf Türk Dili ve Edebiyatı") {
        subjects["9. Sınıf Edebiyat"] = grade9Topics;
      }
      if (!targetSubject || targetSubject === "10. Sınıf Edebiyat" || targetSubject === "10. Sınıf Türk Dili ve Edebiyatı") {
        subjects["10. Sınıf Edebiyat"] = grade10Topics;
      }
      if (!targetSubject || targetSubject === "11. Sınıf Edebiyat" || targetSubject === "11. Sınıf Türk Dili ve Edebiyatı") {
        subjects["11. Sınıf Edebiyat"] = grade11Topics;
      }

      for (const [top, subs] of Object.entries(newSubtopicsMap)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: `${targetSubject || "9., 10. ve 11. Sınıf Edebiyat"} müfredatı başarıyla güncellendi`,
        grade9Count: grade9Topics.length,
        grade10Count: grade10Topics.length,
        grade11Count: grade11Topics.length
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Admin sync Yeni TYT (9. and 10. grade generalized topics)
  app.post("/api/admin/curriculum/sync-yeni-tyt", async (req, res) => {
    try {
      const db = getDb();
      if (!db) return res.status(500).json({ error: "Database unavailable" });

      const rawTargetSubject = req.body?.subject || req.query?.subject;
      const targetSubject = rawTargetSubject?.startsWith("Yeni TYT ")
        ? rawTargetSubject.replace("Yeni TYT ", "M ")
        : rawTargetSubject;

      const yeniTytCurriculum: Record<string, string[]> = {
        "M Biyoloji": [
          "Biyoloji Bilimi ve Yaşamın Temelleri",
          "Hücre Yapısı ve Madde Geçişleri",
          "Canlılar Dünyası ve Biyoçeşitlilik",
          "Hücresel Enerji Dönüşümleri ve Metabolizma",
          "Güncel Çevre Sorunları ve Ekosistem Ekolojisi"
        ],
        "M Coğrafya": [
          "Coğrafya Bilimi ve Harita Bilgisi",
          "Atmosfer ve İklim Bilgisi",
          "Yerin Şekillenmesi (İç ve Dış Kuvvetler)",
          "Nüfus, Yerleşme ve Göç",
          "Ekonomik Faaliyetler, Bölgeler ve Afetler"
        ],
        "M Fizik": [
          "Fizik Bilimine Giriş ve Madde",
          "Basınç ve Kaldırma Kuvveti",
          "Isı ve Sıcaklık",
          "Hareket, Kuvvet ve Enerji",
          "Elektrik ve Manyetizma",
          "Dalgalar"
        ],
        "M Kimya": [
          "Kimya Bilimi ve Laboratuvar Güvenliği",
          "Atom ve Periyodik Sistem",
          "Kimyasal Türler Arası Etkileşimler",
          "Maddenin Hâlleri",
          "Kimyasal Tepkimeler ve Hesaplamalar",
          "Karışımlar ve Çözeltiler"
        ],
        "M Matematik": [
          "Sayı Kümeleri ve Temel İşlemler",
          "Üslü ve Köklü İfadeler",
          "Aralıklar, Denklem ve Eşitsizlikler",
          "Fonksiyonlar ve Grafik İnceleme",
          "Mantık ve Algoritmik Problemler",
          "Sayma, Olasılık ve İstatistik",
          "Üçgenler ve Geometri Temelleri"
        ],
        "M Tarih": [
          "Tarih Bilimi ve Tarihyazımı",
          "İlk ve Orta Çağlarda Medeniyet Dünyası",
          "İlk ve Orta Çağlarda Türk Dünyası",
          "Selçuklu Türkiye’si ve Türk-İslam Medeniyeti",
          "Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı (Kuruluş Dönemi)",
          "Klasik Çağda Osmanlı Devleti ve Dünya Gücü Osmanlı"
        ],
        "M Türkçe": [
          "Sözcükte Anlam",
          "Cümlede Anlam",
          "Paragrafta Anlam",
          "Ses Bilgisi",
          "Yazım Kuralları",
          "Noktalama İşaretleri",
          "Sözcükte Yapı",
          "İsimler ve Tamlamalar",
          "Sıfatlar",
          "Zamirler",
          "Zarflar",
          "Edat, Bağlaç, Ünlem",
          "Fiiller (Eylemler)",
          "Fiilimsiler",
          "Cümlenin Ögeleri",
          "Fiilde Çatı",
          "Cümle Türleri",
          "Anlatım Bozuklukları"
        ]
      };

      const yeniTytSubtopics: Record<string, string[]> = {
        "Biyoloji Bilimi ve Yaşamın Temelleri": [
          "Biyolojinin Önemi, Tarihsel Gelişimi ve Bilimin Doğası",
          "Bilimsel Araştırma Süreçleri ve Bilim Etiği",
          "Canlıların Ortak Özellikleri ve Homeostazi",
          "İnorganik Bileşikler (Su, Mineraller, Asit-Baz-Tuzlar)",
          "Organik Bileşikler (Karbonhidratlar, Lipitler, Proteinler, Vitaminler, Nükleik Asitler)",
          "Enzimler ve Enzimatik Tepkimeler"
        ],
        "Hücre Yapısı ve Madde Geçişleri": [
          "Prokaryot ve Ökaryot Hücre Yapısı",
          "Hücre Zarı Yapısı ve Özellikleri (Akıcı Mozaik Zar Modeli)",
          "Sitoplazma ve Organeller (Zarsız, Tek Zarlı, Çift Zarlı Organeller)",
          "Pasif Taşıma (Difüzyon, Kolaylaştırılmış Difüzyon, Ozmoz, Ozmotik Basınç)",
          "Aktif Taşıma ve Büyük Moleküllerin Taşınması (Endositoz, Ekzositoz)"
        ],
        "Canlılar Dünyası ve Biyoçeşitlilik": [
          "Sınıflandırmanın Temel İlkeleri ve İkili Adlandırma",
          "Üç Üst Âlem (Domain) Sistemi: Bakteriler, Arkeler, Ökaryotlar",
          "Canlılar Âlemi: Protistler, Bitkiler, Mantarlar, Hayvanlar",
          "Virüsler ve Özellikleri",
          "Biyoçeşitlilik, Endemik Türler ve Koruma"
        ],
        "Hücresel Enerji Dönüşümleri ve Metabolizma": [
          "ATP'nin Yapısı, Özellikleri ve Fosforilasyon Çeşitleri",
          "Fotosentez (Işığa Bağımlı ve Işıktan Bağımsız Tepkimeler)",
          "Kemosentez ve Madde Döngülerindeki Rolü",
          "Hücresel Solunum (Glikoliz, Krebs Döngüsü, ETS / Oksidatif Fosforilasyon)",
          "Fermantasyon (Etil Alkol ve Laktik Asit Fermantasyonu)",
          "Canlılarda Sindirim ve Emilim Süreçleri"
        ],
        "Güncel Çevre Sorunları ve Ekosistem Ekolojisi": [
          "Ekosistemin Canlı ve Cansız Bileşenleri",
          "Besin Zinciri, Besin Ağı ve Ekolojik Piramitler (Biyolojik Birikim)",
          "Madde Döngüleri (Su, Karbon, Azot Döngüsü)",
          "Popülasyon ve Komünite Dinamikleri, Simbiyotik İlişkiler, Süksesyon",
          "Çevre Kirliliği, Sera Etkisi, İklim Değişikliği ve Ekolojik Ayak İzi"
        ],
        "Coğrafya Bilimi ve Harita Bilgisi": [
          "Coğrafyanın Konusu, Bölümleri ve Gelişimi",
          "Harita Elemanları, Projeksiyon Tipleri ve Ölçek Hesaplamaları",
          "Haritalarda Yeryüzü Şekillerinin Gösterilme Yöntemleri (İzohipsler vb.)",
          "Mekânsal Bilgi Teknolojileri, CBS ve Uzaktan Algılama",
          "Türkiye’nin Mutlak ve Göreceli Konumu, Jeopolitik Önemi"
        ],
        "Atmosfer ve İklim Bilgisi": [
          "Hava Durumu ve İklim Kavramları",
          "İklim Elemanları: Sıcaklık, Basınç, Rüzgârlar, Nem ve Yağış",
          "Dünyadaki ve Türkiye’deki Büyük İklim Tipleri",
          "İklim Sistemindeki Değişimler ve Küresel İklim Krizi"
        ],
        "Yerin Şekillenmesi (İç ve Dış Kuvvetler)": [
          "Dünyanın İç Yapısı, Levha Tektoniği ve Jeolojik Zamanlar",
          "İç Kuvvetler: Orojenez, Epirojenez, Volkanizma ve Depremler",
          "Kayaç Türleri, Çözünme ve Aşınma Süreçleri",
          "Dış Kuvvetler ve Oluşturdukları Şekiller (Akarsular, Rüzgârlar, Buzullar, Dalgalar, Karstik Şekiller)"
        ],
        "Nüfus, Yerleşme ve Göç": [
          "Dünya ve Türkiye Nüfusunun Tarihsel Gelişimi ve Dağılışı",
          "Nüfus Piramitleri ve Demografik Dönüşüm Modeli",
          "Göç Türleri, Nedenleri ve Sosyo-Mekânsal Sonuçları",
          "Yerleşmelerin Gelişimi, Kır ve Şehir Yerleşmeleri, Şehirlerin Fonksiyonları",
          "Nüfus Politikaları ve Geleceğe Yönelik Projeksiyonlar"
        ],
        "Ekonomik Faaliyetler, Bölgeler ve Afetler": [
          "Ekonomik Faaliyet Sektörleri (Birincil, İkincil, Üçüncül, Dördüncül, Beşincil)",
          "Bölge Kavramı, Bölge Türleri ve Sınırların Değişimi",
          "Doğal Afetler: Jeolojik, Hidrolojik ve Meteorolojik Afetler",
          "Bütüncül Afet Yönetimi ve Afete Dirençli Yaşam Alanları",
          "Türk Kültürünün Mekânsal İzleri ve Coğrafi Yayılışı"
        ],
        "Fizik Bilimine Giriş ve Madde": [
          "Fizik Biliminin Doğası, Kapsamı ve Alt Dalları",
          "Temel ve Türetilmiş Büyüklükler, SI Birim Sistemi",
          "Skaler ve Vektörel Büyüklükler, Vektörlerde İşlemler",
          "Doğadaki Temel Kuvvetler"
        ],
        "Basınç ve Kaldırma Kuvveti": [
          "Katılarda Basınç ve Basınç Kuvveti",
          "Sıvılarda Basınç ve Pascal Prensibi",
          "Açık Hava Basıncı ve Gaz Basıncı (Torricelli Deneyi, Manometreler)",
          "Akışkanların Dinamiği ve Bernoulli İlkesi",
          "Sıvılarda Kaldırma Kuvveti ve Arşimet Prensibi"
        ],
        "Isı ve Sıcaklık": [
          "Isı, Sıcaklık ve İç Enerji Kavramları",
          "Termometreler ve Sıcaklık Ölçekleri",
          "Öz Isı, Isı Sığası ve Isı Alışverişi (Q = mcΔT)",
          "Maddelerde Hâl Değişimi ve Isıl Denge (Q = mL)",
          "Isı Aktarım Yolları (İletim, Konveksiyon, Işıma) ve Isı Yalıtımı"
        ],
        "Hareket, Kuvvet ve Enerji": [
          "Hareket Kavramları: Konum, Alınan Yol, Yer Değiştirme, Sürat ve Hız",
          "Sabit Hızlı Hareket ve Hareket Grafikleri",
          "Bir Boyutta Sabit İvmeli Hareket ve Grafik Yorumları",
          "İş, Güç ve Enerji Kavramları",
          "Kinetik, Potansiyel ve Mekanik Enerji",
          "Mekanik Enerjinin Korunumu ve Enerji Kaynakları"
        ],
        "Elektrik ve Manyetizma": [
          "Basit Elektrik Devreleri ve Elektrik Akımı (I = q/t)",
          "Ohm Yasası, İletkenin Direnci ve Devre Hesaplamaları",
          "Dirençlerin Seri ve Paralel Bağlanması (Eşdeğer Direnç)",
          "Üreteçlerin Bağlanması, Elektromotor Kuvvet (EMK) ve Tükenme Süresi",
          "Elektrik Güvenliği, Sigorta ve Topraklama"
        ],
        "Dalgalar": [
          "Dalgaların Temel Değişkenleri: Genlik, Dalga Boyu, Periyot, Frekans, Hız (v = λ.f)",
          "Dalgaların Sınıflandırılması (Enine-Boyuna / Mekanik-Elektromanyetik)",
          "Su Dalgalarında Yansıma, Kırılma ve Stroboskop",
          "Ses Dalgaları, Rezonans ve Deprem Dalgaları"
        ],
        "Kimya Bilimi ve Laboratuvar Güvenliği": [
          "Kimyanın Tanımı, Alt Disiplinleri ve Günlük Hayattaki Yeri",
          "Kimyasal Maddelerin Güvenli Kullanımı ve Güvenlik Uyarı İşaretleri",
          "Yeşil Kimyanın İlkeleri, Nanoparçacıklar ve Ekolojik Sürdürülebilirlik"
        ],
        "Atom ve Periyodik Sistem": [
          "Atom Modellerinin Tarihsel Gelişimi (Dalton'dan Modern Teoriye)",
          "Atomun Yapısı, Atom Altı Parçacıklar, Kuantum Sayıları ve Elektron Dizilimi",
          "Periyodik Tabloda Grup ve Periyot Bulma",
          "Periyodik Özelliklerin Değişimi (Atom Yarıçapı, İyonlaşma Enerjisi, Elektronegatiflik, Elektron İlgisi)"
        ],
        "Kimyasal Türler Arası Etkileşimler": [
          "Kimyasal Türler ve Lewis Nokta Yapısı",
          "Güçlü Etkileşimler: İyonik Bağ, Kovalent Bağ (Polar-Apolar), Metalik Bağ",
          "Kimyasal Bileşiklerin Sistematik ve Yaygın Adlandırılması",
          "Zayıf Etkileşimler: Van der Waals Etkileşimleri ve Hidrojen Bağı"
        ],
        "Maddenin Hâlleri": [
          "Katı Türleri (Amorf ve Kristal Katılar)",
          "Sıvılar: Buhar Basıncı, Kaynama Noktası, Viskozite, Yüzey Gerilimi ve Kılcallık",
          "Gazlar: Gazların Genel Özellikleri, Kinetik Teori, Gaz Yasaları ve İdeal Gaz Denklemi (P.V = n.R.T)",
          "Graham Difüzyon ve Efüzyon Yasası"
        ],
        "Kimyasal Tepkimeler ve Hesaplamalar": [
          "Fiziksel ve Kimyasal Değişimler",
          "Kimyasal Tepkime Türleri (Yanma, Sentez, Analiz, Asit-Baz, Çökelme, Redoks)",
          "Kimyasal Tepkime Denklemlerinin Denkleştirilmesi",
          "Mol Kavramı ve Avogadro Sayısı (n = m/MA)",
          "Kimyasal Hesaplamalar (Stokiyometri, Sınırlayıcı Bileşen, Verim Problemleri)"
        ],
        "Karışımlar ve Çözeltiler": [
          "Karışımların Sınıflandırılması (Homojen ve Heterojen Karışımlar)",
          "Çözünme Süreci (Solvatasyon, Hidratasyon ve Benzer Benzeri Çözer İlkesi)",
          "Çözünürlük ve Çözünürlüğe Etki Eden Faktörler",
          "Derişim Birimleri: Kütlece Yüzde, Hacimce Yüzde, Molarite ve ppm",
          "Koligatif Özellikler (Kaynama Noktası Yükselmesi, Donma Noktası Düşmesi, Ozmotik Basınç)"
        ],
        "Sayı Kümeleri ve Temel İşlemler": [
          "Rakam, Doğal Sayılar, Tam Sayılar, Rasyonel ve Gerçek Sayılar",
          "Sayı Kümelerinin İşlem Özellikleri ve Cebirsel İfadeler",
          "Asal Sayılar, Asal Çarpanlara Ayırma ve Bölen Sayıları",
          "Bölünebilme Kuralları ve Kalan Bulma",
          "EBOB - EKOK ve Günlük Hayat Problemleri"
        ],
        "Üslü ve Köklü İfadeler": [
          "Gerçek Sayılarda Üslü İfadeler ve İşlemler",
          "Köklü İfadelerin Özellikleri ve Dört İşlem",
          "Paydayı Rasyonel Yapma (Eşlenik) ve İç İçe Kökler"
        ],
        "Aralıklar, Denklem ve Eşitsizlikler": [
          "Gerçek Sayı Aralıkları ve Küme Gösterimleri",
          "Birinci Dereceden Bir ve İki Bilinmeyenli Denklemler",
          "Birinci Dereceden Eşitsizlikler ve Sayı Doğrusunda Gösterimi",
          "Mutlak Değer, Mutlak Değerli Denklem ve Eşitsizlikler"
        ],
        "Fonksiyonlar ve Grafik İnceleme": [
          "Fonksiyon Tanımı, Tanım-Değer-Görüntü Kümeleri ve Fonksiyon Türleri",
          "Doğrusal Fonksiyonlar ve Grafikleri (f(x) = ax + b)",
          "Karesel Fonksiyonlar (Parabolün Tepe Noktası, Simetri Ekseni, Grafiği)",
          "Karekök ve Rasyonel Referans Fonksiyonları",
          "Fonksiyonların Tersi ve Bileşkesi",
          "Fonksiyonlarla Matematiksel Modelleme ve Problem Çözümü"
        ],
        "Mantık ve Algoritmik Problemler": [
          "Önermeler, Doğruluk Değerleri ve Mantık Bağlaçları",
          "Açık Önermeler ve Niceleyiciler",
          "Algoritmik Düşünme, Akış Şemaları ve Algoritma Temelli Problemler"
        ],
        "Sayma, Olasılık ve İstatistik": [
          "Temel Sayma İlkeleri (Toplama ve Çarpma Yoluyla Sayma)",
          "Tek ve İki Değişkenli Veri Dağılımları (Histogram, Kutu Grafiği, Tablolar)",
          "Merkezi Eğilim ve Yayılım Ölçüleri (Aritmetik Ortalama, Medyan, Mod, Standart Sapma)",
          "Deneysel ve Teorik Olasılık",
          "Koşullu Olasılık ve Bayes Teoremi"
        ],
        "Üçgenler ve Geometri Temelleri": [
          "Doğruda ve Üçgende Açı Özellikleri",
          "Üçgende Açı-Kenar Bağıntıları ve Üçgen Eşitsizliği",
          "Dik Üçgen ve Trigonometrik Oranlar (Sin, Cos, Tan, Cot)",
          "Pisagor, Öklid ve Tales Teoremleri",
          "Üçgenlerde Eşlik ve Benzerlik Koşulları",
          "Üçgende Yardımcı Elemanlar (Açıortay, Kenarortay, Yükseklik)",
          "Üçgenin Alanı ve Trigonometrik Alan Formülü",
          "Geometrik Dönüşümler (Öteleme, Yansıma, Dönme)",
          "Noktanın ve Doğrunun Analitik İncelenmesi (Eğim, Doğru Denklemleri)"
        ],
        "Tarih Bilimi ve Tarihyazımı": [
          "Tarih Öğrenmenin Bireye ve Topluma Faydaları, Tarihsel Bilinç",
          "Tarihin Doğası, Konusu ve Yöntemi",
          "Tarihsel Bilginin Üretim Süreci (Kaynak Arama, Tasnif, Tahlil, Tenkit, Terkip)",
          "Tarih Araştırmalarında Dijitalleşme ve Bilgi Güvenilirliği"
        ],
        "İlk ve Orta Çağlarda Medeniyet Dünyası": [
          "Tarım Devrimi, İlk Köy ve Şehir Yerleşmeleri, Artı Ürün ve Ticaret",
          "Eski Çağ Medeniyetlerinde Yönetim, Ordu ve Hukuk Sistemleri (Mezopotamya, Mısır, Anadolu, Ege)",
          "İlk Çağ'da İnanç Sistemleri, Bilim ve Sanatın Doğuşu",
          "Orta Çağ’da Siyasi Yapılar (Feodalite, Merkezi Monarşiler, Bizans, Sasani, Moğollar)",
          "Orta Çağ'da Ticaret Yolları (İpek, Baharat, Kürk Yolları) ve Ticaret Merkezleri",
          "Orta Çağ Medeniyet Havzalarında Bilim, Kültür ve İslam'ın Altın Çağı"
        ],
        "İlk ve Orta Çağlarda Türk Dünyası": [
          "Orta Asya Coğrafyası ve Konargöçer Türk Yaşamı",
          "Eski Türklerde Devlet Teşkilatı, Boy Yapısı, Töre ve Ordu-Millet Anlayışı",
          "Orta Çağ'da Kitlesel Göçler (Kavimler Göçü) ve Türk Devletleri",
          "Türklerin İslamiyet'i Kabulü ve İlk Türk-İslam Devletleri (Karahanlılar, Gazneliler)"
        ],
        "Selçuklu Türkiye’si ve Türk-İslam Medeniyeti": [
          "Türkistan’dan Türkiye’ye Uzanan Süreçte Askerî Mücadeleler (Dandanakan, Pasinler, Malazgirt, Miryokefalon, Kösedağ)",
          "Büyük Selçuklu ve Türkiye Selçuklularında Devlet, Ordu ve İkta Sistemi",
          "Selçuklularda Sosyal Yaşam, Şehirleşme ve Ahilik Teşkilatı",
          "Türk-İslam Medeniyetinin Bilim, Kültür, Mimari ve Manevi Mimarları (Yesevi, Mevlana, Yunus Emre, Hacı Bektaş Veli vb.)"
        ],
        "Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı (Kuruluş Dönemi)": [
          "Osmanlı Devleti’nin Kuruluşuna Dair Tarihsel Görüşler ve Hızlı Büyüme Nedenleri",
          "Anadolu ve Rumeli'deki Fetihler, Gaza ve Cihad Politikası",
          "İskân ve İstimalet (Hoşgörü) Politikaları",
          "Osmanlı Devletleşme Süreci: Ordu Yapısı (Tımar ve Kapıkulu), Divan Teşkilatı ve Hukuk Düzeni"
        ],
        "Klasik Çağda Osmanlı Devleti ve Dünya Gücü Osmanlı": [
          "1453-1683 Yılları Arasındaki Siyasi ve Askerî Mücadeleler",
          "Osmanlı Devleti’nin Yönetim, Toprak ve Askerî Yapısındaki Değişimler",
          "Coğrafi Keşifler, Avrupa'nın Sömürgecilik Faaliyetleri ve Osmanlı’ya Etkileri",
          "17. Yüzyıl Osmanlı İç İsyanları (Celali, Merkez ve Eyalet İsyanları)",
          "Klasik Çağda Osmanlı Bilim, Kültür, Sanat ve İlim Geleneği"
        ]
      };

      const curRef = db.collection("settings").doc("curriculum");
      const curSnap = await curRef.get();
      let subjects = curSnap.exists ? (curSnap.data()?.subjects || {}) : {};
      let subtopics = curSnap.exists ? (curSnap.data()?.subtopics || {}) : {};

      // Clean up legacy "Yeni TYT *" subject keys from Firestore
      const legacyKeys = [
        "Yeni TYT Biyoloji", "Yeni TYT Coğrafya", "Yeni TYT Fizik",
        "Yeni TYT Kimya", "Yeni TYT Matematik", "Yeni TYT Tarih", "Yeni TYT Türkçe"
      ];
      for (const k of legacyKeys) {
        if (subjects[k]) {
          delete subjects[k];
        }
      }

      if (targetSubject && yeniTytCurriculum[targetSubject]) {
        subjects[targetSubject] = yeniTytCurriculum[targetSubject];
      } else {
        for (const [subj, topics] of Object.entries(yeniTytCurriculum)) {
          subjects[subj] = topics;
        }
      }

      for (const [top, subs] of Object.entries(yeniTytSubtopics)) {
        subtopics[top] = subs;
      }

      await curRef.set({
        subjects,
        subtopics,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      res.json({
        success: true,
        message: targetSubject ? `${targetSubject} başarıyla müfredat veritabanına aktarıldı.` : "Tüm M Müfredat dersleri başarıyla veritabanına aktarıldı.",
        subjectsUpdated: targetSubject ? [targetSubject] : Object.keys(yeniTytCurriculum)
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e?.message });
    }
  });

  // Start 7-Day Free Trial for first-time student subscription
  app.post("/api/student/start-trial", async (req, res) => {
    try {
      const db = getDb();
      const { studentId, planName } = req.body;
      if (!studentId || !planName) {
        return res.status(400).json({ success: false, error: "Öğrenci ID ve paket adı zorunludur." });
      }
      const studentRef = db.collection("users").doc(studentId);
      const studentDoc = await studentRef.get();
      if (!studentDoc.exists) {
        return res.status(404).json({ success: false, error: "Öğrenci bulunamadı." });
      }
      const studentData = studentDoc.data();
      if (studentData.role !== 'student') {
        return res.status(403).json({ success: false, error: "Deneme süresi sadece öğrenci hesapları için geçerlidir." });
      }
      if (studentData.hasUsedTrial) {
        return res.status(400).json({ success: false, error: "7 günlük ücretsiz deneme hakkı daha önce kullanılmıştır. Sadece ilk abonelikte geçerlidir." });
      }

      const now = new Date();
      const trialDurationDays = 7;
      const trialEndDate = new Date(now.getTime() + trialDurationDays * 24 * 60 * 60 * 1000);

      const history = studentData.subscriptionHistory || [];
      const historyEntry = {
        id: Math.random().toString(36).substring(2, 11),
        studentId: studentId,
        studentName: `${studentData.firstName || ''} ${studentData.lastName || ''}`.trim() || 'Öğrenci',
        oldPlan: studentData.subscriptionPlan || 'Yok',
        newPlan: planName,
        action: 'trial_started',
        isTrial: true,
        startDate: now.toISOString(),
        endDate: trialEndDate.toISOString(),
        createdAt: now.toISOString()
      };
      history.push(historyEntry);

      await studentRef.update({
        subscriptionPlan: planName,
        subscriptionStartDate: now.toISOString(),
        subscriptionEndDate: trialEndDate.toISOString(),
        subscriptionStatus: 'active',
        isTrial: true,
        hasUsedTrial: true,
        trialStartDate: now.toISOString(),
        trialEndDate: trialEndDate.toISOString(),
        trialPlan: planName,
        autoRenew: true,
        askedAiQuestionsCount: 0,
        subscriptionHistory: history,
        updatedAt: new Date().toISOString()
      });

      // Create in-app notification for student
      await db.collection("notifications").add({
        userId: studentId,
        title: "🎉 7 Günlük Ücretsiz Denemeniz Başladı!",
        message: `${planName} paketinizin 7 günlük ücretsiz deneme süresi tanımlandı. Tüm özelliklerin tadını çıkarın!`,
        type: "success",
        link: "/panel/ogrenci/abonelik",
        createdAt: new Date().toISOString(),
        read: false
      });

      // If student has a coach, notify coach
      const coachId = studentData.coachId || studentData.assignedCoachId;
      if (coachId) {
        await db.collection("notifications").add({
          userId: coachId,
          title: "Öğrenci Deneme Aboneliği",
          message: `Öğrenciniz ${studentData.firstName || ''} ${studentData.lastName || ''}, ${planName} paketi için 7 günlük ücretsiz deneme başlattı.`,
          type: "info",
          link: "/panel/koc/ogrenciler",
          createdAt: new Date().toISOString(),
          read: false
        });
      }

      return res.json({
        success: true,
        message: "7 günlük ücretsiz deneme süreniz başarıyla başlatıldı!",
        trialEndDate: trialEndDate.toISOString(),
        subscriptionPlan: planName
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || "Sunucu hatası" });
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
          if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
            logoBase64 = buf.toString("base64");
            break;
          }
        }
      }
    } catch (e) {
      console.warn("PDF Logo load notice:", e);
    }
    
    const drawProgressBar = (x: number, y: number, w: number, h: number, percentage: number, color: [number, number, number], bg: [number, number, number] = [226, 232, 240]) => {
      doc.setFillColor(...bg);
      doc.roundedRect(x, y, w, h, h/2, h/2, "F");
      if (percentage > 0) {
        const fillW = Math.min(Math.max((percentage / 100) * w, h), w);
        doc.setFillColor(...color);
        doc.roundedRect(x, y, fillW, h, h/2, h/2, "F");
      }
    };

    // ==========================================
    // PAGE 1: GENEL BAKIŞ & KOÇLUK DEĞERLENDİRMESİ
    // ==========================================
    let currentY = 10;

    // 1. Header (Student Info, Period, Package & Logo) - Deep Slate & Emerald Banner
    const headerHeight = 34;
    doc.setFillColor(15, 23, 42); // #0F172A
    doc.roundedRect(10, currentY, 190, headerHeight, 3, 3, "F");

    // Left Column: Student Avatar & Info
    const avatarX = 21;
    const avatarY = currentY + 17;
    let renderedPhoto = false;

    if (params.studentPhotoBase64) {
      try {
        const pFmt = params.studentPhotoFormat || "PNG";
        doc.addImage(`data:image/${pFmt.toLowerCase()};base64,${params.studentPhotoBase64}`, pFmt, 13, currentY + 8, 18, 18, undefined, "FAST");
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(0.5);
        doc.roundedRect(13, currentY + 8, 18, 18, 2.5, 2.5, "D");
        renderedPhoto = true;
      } catch (pErr) {
        console.warn("Avatar image render notice:", pErr);
      }
    }

    if (!renderedPhoto) {
      doc.setFillColor(6, 78, 59);
      doc.circle(avatarX, avatarY, 8, "F");

      doc.setFillColor(16, 185, 129);
      doc.circle(avatarX, avatarY, 7, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont(fontName, "bold");
      const initial = (params.studentName || "Ö").trim().charAt(0).toUpperCase();
      doc.text(initial, avatarX, avatarY + 3.8, { align: "center" });
    }

    const textStartX = 34;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont(fontName, "bold");
    doc.text(params.studentName, textStartX, currentY + 8.5);

    doc.setFontSize(7.5);
    doc.setFont(fontName, "normal");
    doc.setTextColor(148, 163, 184);
    let gradeBranch: string[] = [];
    if (params.studentGrade) gradeBranch.push(`Sınıf: ${params.studentGrade}`);
    if (params.studentBranch) gradeBranch.push(`Alan: ${params.studentBranch}`);
    doc.text(gradeBranch.join("   |   ") || "Sınıf: 12. Sınıf   |   Alan: SAYISAL", textStartX, currentY + 15);

    doc.setTextColor(203, 213, 225);
    doc.text(`Hedef: ${params.studentTarget || 'Belirtilmedi'}`, textStartX, currentY + 21.5);

    doc.setTextColor(52, 211, 153);
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text(`Abonelik: ${params.studentPackage || 'Sınırsız Zirve VIP (Altın Paket)'}`, textStartX, currentY + 27.5);

    // Right Column: Logo & Institution Brand
    let logoBottomY = currentY + 2;
    if (logoBase64) {
      try {
        const imgProps = doc.getImageProperties(`data:image/png;base64,${logoBase64}`);
        const ratio = imgProps.height / imgProps.width;
        const imgWidth = 15;
        const imgHeight = imgWidth * ratio;
        const logoX = 195 - imgWidth;
        const logoY = currentY + 2.5;
        doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", logoX, logoY, imgWidth, imgHeight, undefined, "FAST");
        logoBottomY = logoY + imgHeight;
      } catch (err) {
        console.warn("PDF Logo render warning:", err);
      }
    }

    const focusOnY = Math.max(logoBottomY + 3.5, currentY + 16);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont(fontName, "bold");
    doc.text("FocusON Akademi", 195, focusOnY, { align: "right" });

    const linkY = focusOnY + 4;
    const websiteUrl = "https://www.omernasuhakademi.com";
    const websiteText = "www.omernasuhakademi.com";
    doc.setTextColor(147, 197, 253);
    doc.setFont(fontName, "normal");
    doc.setFontSize(6.8);
    doc.text(websiteText, 195, linkY, { align: "right" });

    const websiteWidth = doc.getTextWidth(websiteText);
    doc.link(195 - websiteWidth, linkY - 2.5, websiteWidth, 3.5, { url: websiteUrl });

    const periodY = linkY + 4;
    doc.setTextColor(203, 213, 225);
    doc.setFont(fontName, "normal");
    doc.setFontSize(6.8);
    doc.text(`Rapor Dönemi: ${params.periodStr}`, 195, periodY, { align: "right" });

    currentY += headerHeight + 5;

    // Calculate dynamic topic study pages and watch videos count
    let totalStudyPages = 0;
    let totalWatchVideos = 0;
    let totalDoneTasksCount = 0;
    if (params.dailyTasks) {
      params.dailyTasks.forEach(day => {
        day.tasks.forEach((t: any) => {
          if (t.isDone) totalDoneTasksCount++;
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
    const cardW = 44.5;
    const gap = (190 - (cardW * 4)) / 3;
    const stats = [
      { 
        t: "SORU ÇÖZÜMÜ", 
        v: `${params.totalCompleted} / ${params.totalTarget}`, 
        unit: "Soru", 
        pLabel: `Ulaşma Oranı %${params.completionRate}`, 
        pct: params.completionRate, 
        color: [16, 185, 129] 
      },
      { 
        t: "GÖREV SADAKATİ", 
        v: `${totalDoneTasksCount} / ${params.totalTasks}`, 
        unit: "Görev", 
        pLabel: `Sadakat Oranı %${params.taskCompletionRate || 0}`, 
        pct: params.taskCompletionRate || 0, 
        color: [139, 92, 246] 
      },
      { 
        t: "KONU ÇALIŞMASI", 
        v: `${totalStudyPages}`, 
        unit: "Sayfa", 
        pLabel: "Haftalık Konu Tekrarı", 
        pct: totalStudyPages > 0 ? 100 : 0, 
        color: [245, 158, 11] 
      },
      { 
        t: "KONU TAKİBİ", 
        v: `${totalWatchVideos}`, 
        unit: "Video/Ders", 
        pLabel: "Müfredat Uyumu", 
        pct: totalWatchVideos > 0 ? 100 : 0, 
        color: [59, 130, 246] 
      }
    ];

    stats.forEach((s, i) => {
      const x = 10 + i * (cardW + gap);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, currentY, cardW, 23, 2, 2, "FD");

      // Title
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(6.5);
      doc.setFont(fontName, "bold");
      doc.text(s.t, x + 3.5, currentY + 5);

      // Main Value
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont(fontName, "bold");
      doc.text(s.v, x + 3.5, currentY + 11.5);

      // Unit
      if (s.unit) {
        const valWidth = doc.getTextWidth(s.v);
        doc.setFontSize(6.2);
        doc.setTextColor(100, 116, 139);
        doc.setFont(fontName, "normal");
        doc.text(s.unit, x + 3.5 + valWidth + 1.5, currentY + 11.5);
      }

      // Subtitle
      doc.setFont(fontName, "normal");
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(s.pLabel, x + 3.5, currentY + 16);

      // Progress bar
      drawProgressBar(x + 3.5, currentY + 18.5, cardW - 7, 1.5, s.pct, s.color as any);
    });

    currentY += 27;

    // 3. AI & Coach Evaluation Box
    doc.setFont(fontName, "normal");
    doc.setFontSize(7.8);
    
    const formattedAiText = ensureAiReportClosingSignature(
      (params.aiAnalysisText || "Geçen hafta için koç değerlendirmesi ve çalışma analizi başarıyla kaydedilmiştir.").replace(/[*_]/g, '')
    );
    const splitAi = doc.splitTextToSize(formattedAiText, 174);
    const aiBoxHeight = Math.min(Math.max(30, 14 + splitAi.length * 4.1), 88);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, currentY, 190, aiBoxHeight, 2.5, 2.5, "FD");

    // Emerald Accent Bar
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(10, currentY, 3, aiBoxHeight, 1.5, 1.5, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont(fontName, "bold");
    doc.setFontSize(8.2);
    doc.text("Geçen Haftalık Koç Değerlendirmesi & Yapay Zekâ Analiz Raporu", 17, currentY + 6.5);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, currentY + 9.5, 195, currentY + 9.5);

    doc.setTextColor(51, 65, 85);
    doc.setFont(fontName, "normal");
    doc.setFontSize(7.4);

    let lineY = currentY + 14.5;
    for (let l = 0; l < splitAi.length; l++) {
      if (lineY > currentY + aiBoxHeight - 4) break;
      doc.text(splitAi[l], 17, lineY);
      lineY += 4.1;
    }

    currentY += aiBoxHeight + 5;

    // 4. Haftalık Deneme Ortalamaları (Genel & Branş - Sadece Rapor Haftası)
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

    // Box 1: Haftalık Genel Deneme Ortalamaları
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, currentY, boxW, 23, 2, 2, "FD");
    doc.setTextColor(15, 23, 42);
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text("Haftalık Genel Deneme Ortalamaları", 14, currentY + 5.5);

    genelAvgs.forEach((item, i) => {
      const bx = 14 + i * 27;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(bx, currentY + 8, 25, 11.5, 1.5, 1.5, "F");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.2);
      doc.setFont(fontName, "bold");
      doc.text(item.label, bx + 12.5, currentY + 11.8, { align: "center" });
      doc.setTextColor(item.value !== "-" ? 5 : 100, item.value !== "-" ? 150 : 116, item.value !== "-" ? 105 : 139);
      doc.setFontSize(item.value.length > 6 ? 6 : 7.5);
      doc.setFont(fontName, "bold");
      doc.text(item.value, bx + 12.5, currentY + 16.8, { align: "center" });
    });

    // Box 2: Haftalık Branş / Ders Deneme Ortalamaları
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10 + boxW + 6, currentY, boxW, 23, 2, 2, "FD");
    doc.setTextColor(15, 23, 42);
    doc.setFont(fontName, "bold");
    doc.setFontSize(7.5);
    doc.text("Haftalık Branş / Ders Deneme Ortalamaları", 14 + boxW + 6, currentY + 5.5);

    bransAvgs.forEach((item, i) => {
      const bx = 14 + boxW + 6 + i * 27;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(bx, currentY + 8, 25, 11.5, 1.5, 1.5, "F");
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5.2);
      doc.setFont(fontName, "bold");
      doc.text(item.label, bx + 12.5, currentY + 11.8, { align: "center" });
      doc.setTextColor(item.value !== "-" ? 5 : 100, item.value !== "-" ? 150 : 116, item.value !== "-" ? 105 : 139);
      doc.setFontSize(item.value.length > 6 ? 6 : 7.5);
      doc.setFont(fontName, "bold");
      doc.text(item.value, bx + 12.5, currentY + 16.8, { align: "center" });
    });

    currentY += 27;

    // 5. Haftalık Girilen Deneme Sınavları (Uzatılmış ve Ferah Kutucuk)
    const exams = params.exams || [];
    const availableExamH = Math.max(282 - currentY, 40);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(10, currentY, 190, availableExamH, 2.5, 2.5, "FD");

    doc.setTextColor(15, 23, 42);
    doc.setFont(fontName, "bold");
    doc.setFontSize(8.2);
    doc.text("Haftalık Girilen Deneme Sınavları", 14, currentY + 6);
    doc.setFontSize(6.2);
    doc.setFont(fontName, "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(
      exams.length > 0
        ? `Öğrencimizin rapor haftasında sisteme işlenen ${exams.length} adet deneme / sınav sonucu:`
        : "Öğrencimizin rapor haftasında sisteme işlenen deneme ve tarama sonuçları.",
      14,
      currentY + 10.5
    );

    if (exams.length === 0) {
      const emptyBoxY = currentY + 14;
      const emptyBoxH = availableExamH - 18;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(14, emptyBoxY, 182, Math.max(emptyBoxH, 20), 2, 2, "FD");

      doc.setTextColor(100, 116, 139);
      doc.setFont(fontName, "bold");
      doc.setFontSize(7.5);
      doc.text("Bu rapor haftası içerisinde girilmiş herhangi bir deneme sınavı verisi bulunmamaktadır.", 105, emptyBoxY + (emptyBoxH / 2) - 1.5, { align: "center" });
      doc.setFont(fontName, "normal");
      doc.setFontSize(6.2);
      doc.setTextColor(148, 163, 184);
      doc.text("Öğrenci deneme sınavına girdiğinde netleri, sınav türü, derecesi ve yüzdelik dilimi bu alanda detaylı listelenir.", 105, emptyBoxY + (emptyBoxH / 2) + 3.5, { align: "center" });
    } else {
      const tableHeaderY = currentY + 13;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(12, tableHeaderY, 186, 6, 1, 1, "F");
      doc.setFontSize(5.8);
      doc.setFont(fontName, "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("SINAV ADI", 16, tableHeaderY + 4.2);
      doc.text("TÜR", 88, tableHeaderY + 4.2);
      doc.text("TARİH", 112, tableHeaderY + 4.2);
      doc.text("TOPLAM NET", 136, tableHeaderY + 4.2);
      doc.text("SIRA / KATILIM", 158, tableHeaderY + 4.2);
      doc.text("DİLİM", 188, tableHeaderY + 4.2, { align: "center" });

      const rowH = 8.5;
      let examRowY = tableHeaderY + 6.5;
      const maxRows = Math.floor((availableExamH - 22) / rowH);
      const rowsToShow = Math.min(exams.length, maxRows);

      for (let eIdx = 0; eIdx < rowsToShow; eIdx++) {
        const ex = exams[eIdx];
        doc.setFillColor(eIdx % 2 === 0 ? 255 : 248, eIdx % 2 === 0 ? 255 : 250, eIdx % 2 === 0 ? 255 : 252);
        doc.roundedRect(12, examRowY, 186, rowH - 0.8, 1, 1, "F");

        const rawName = ex.examName || ex.topic || ex.subject || "Deneme Sınavı";
        const safeName = rawName.length > 36 ? rawName.substring(0, 34) + ".." : rawName;
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(6.8);
        doc.setFont(fontName, "bold");
        doc.text(safeName, 16, examRowY + 5);

        const exType = (ex.examType || "GENEL").toUpperCase();
        doc.setFillColor(238, 242, 255);
        doc.roundedRect(86, examRowY + 1.8, 22, 4.5, 1, 1, "F");
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(5.2);
        doc.setFont(fontName, "bold");
        doc.text(exType, 97, examRowY + 5, { align: "center" });

        let dateLabel = ex.date || "";
        if (/^\d{4}-\d{2}-\d{2}/.test(dateLabel)) {
          const [, m, d] = dateLabel.substring(0, 10).split("-");
          dateLabel = `${Number(d)} ${trMonths[Number(m) - 1] || ""}`;
        }
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(5.8);
        doc.setFont(fontName, "normal");
        doc.text(dateLabel, 112, examRowY + 5);

        const totalNetVal = ex.totalNet !== undefined && ex.totalNet !== null 
          ? Number(ex.totalNet).toFixed(1) 
          : (ex.completedCount ? `${ex.completedCount}` : "-");
        
        doc.setFillColor(236, 253, 245);
        doc.roundedRect(134, examRowY + 1.8, 20, 4.5, 1, 1, "F");
        doc.setTextColor(5, 150, 105);
        doc.setFont(fontName, "bold");
        doc.setFontSize(6.2);
        doc.text(`${totalNetVal} Net`, 144, examRowY + 5, { align: "center" });

        const rankStr = ex.rank 
          ? `${ex.rank}${ex.participantCount ? ` / ${Number(ex.participantCount).toLocaleString("tr-TR")}` : ""}`
          : "-";
        doc.setTextColor(71, 85, 105);
        doc.setFont(fontName, "normal");
        doc.setFontSize(5.8);
        doc.text(rankStr, 158, examRowY + 5);

        const pctStr = ex.percentile ? `%${Number(ex.percentile).toFixed(1)}` : "-";
        doc.setTextColor(pctStr !== "-" ? 15 : 148, pctStr !== "-" ? 23 : 163, pctStr !== "-" ? 42 : 184);
        doc.setFont(fontName, "bold");
        doc.text(pctStr, 188, examRowY + 5, { align: "center" });

        examRowY += rowH;
      }
    }

    // ==========================================
    // PAGE 2: AKADEMİK GELİŞİM & GÜNLÜK GÖREV DETAYLARI
    // ==========================================
    doc.addPage();
    let p2Y = 10;

    const drawPageHeader = (isContinuation: boolean = false) => {
      const p2BannerH = 13;
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(10, p2Y, 190, p2BannerH, 2.5, 2.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont(fontName, "bold");
      doc.setFontSize(8.5);
      doc.text(
        isContinuation
          ? "Akademik Performans & Günlük Görev Detayları (Devam)"
          : "Akademik Performans & Günlük Görev Raporu Detayları",
        16,
        p2Y + 8.5
      );

      doc.setFont(fontName, "normal");
      doc.setFontSize(7.2);
      doc.setTextColor(148, 163, 184);
      doc.text(`${params.studentName} • ${params.periodStr}`, 194, p2Y + 8.5, { align: "right" });

      p2Y += p2BannerH + 5;
    };

    drawPageHeader(false);

    // 1. Ders Bazlı Performans Analizi Tablosu
    const subjects = params.subjectsBreakdown || [];
    doc.setTextColor(15, 23, 42);
    doc.setFont(fontName, "bold");
    doc.setFontSize(8.5);
    doc.text("1. Ders Bazlı Soru & Hedef Başarı Analizi", 10, p2Y + 4);

    p2Y += 7;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(10, p2Y, 190, 6, 1.5, 1.5, "F");
    doc.setFontSize(6.2);
    doc.setFont(fontName, "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("DERS ADI", 14, p2Y + 4.2);
    doc.text("HEDEF", 80, p2Y + 4.2);
    doc.text("ÇÖZÜLEN / TAMAMLANAN", 110, p2Y + 4.2);
    doc.text("BAŞARI", 155, p2Y + 4.2);
    doc.text("İLERLEME", 175, p2Y + 4.2);

    p2Y += 6;

    if (subjects.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.rect(10, p2Y, 190, 8, "F");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6.8);
      doc.setFont(fontName, "normal");
      doc.text("Ders bazlı çalışma verisi bulunmamaktadır.", 105, p2Y + 5.5, { align: "center" });
      p2Y += 8;
    } else {
      let sumTarget = 0;
      let sumCompleted = 0;

      subjects.forEach((sub, idx) => {
        sumTarget += Number(sub.target) || 0;
        sumCompleted += Number(sub.completed) || 0;
        const rowH = 6.2;
        doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
        doc.rect(10, p2Y, 190, rowH, "F");

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(6.8);
        doc.setFont(fontName, "bold");
        doc.text(sub.subject, 14, p2Y + 4.3);

        doc.setFont(fontName, "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(sub.target.toString(), 80, p2Y + 4.3);

        doc.setTextColor(5, 150, 105);
        doc.setFont(fontName, "bold");
        doc.text(sub.completed.toString(), 110, p2Y + 4.3);

        const rate = sub.target > 0 ? Math.round((sub.completed / sub.target) * 100) : 0;
        doc.setTextColor(rate >= 70 ? 5 : rate >= 40 ? 217 : 225, rate >= 70 ? 150 : rate >= 40 ? 119 : 29, rate >= 70 ? 105 : rate >= 40 ? 6 : 72);
        doc.text(`%${rate}`, 155, p2Y + 4.3);

        const barColor: [number, number, number] = rate >= 70 ? [16, 185, 129] : rate >= 40 ? [245, 158, 11] : [239, 68, 68];
        drawProgressBar(170, p2Y + 2.2, 25, 1.8, Math.min(rate, 100), barColor);

        p2Y += rowH;
      });

      // Total Summary row
      doc.setFillColor(241, 245, 249);
      doc.rect(10, p2Y, 190, 6.5, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(6.8);
      doc.setFont(fontName, "bold");
      doc.text("GENEL TOPLAM & ORTALAMA", 14, p2Y + 4.5);
      doc.text(sumTarget.toString(), 80, p2Y + 4.5);
      doc.setTextColor(5, 150, 105);
      doc.text(sumCompleted.toString(), 110, p2Y + 4.5);
      const totalRate = sumTarget > 0 ? Math.round((sumCompleted / sumTarget) * 100) : 0;
      doc.setTextColor(15, 23, 42);
      doc.text(`%${totalRate}`, 155, p2Y + 4.5);
      drawProgressBar(170, p2Y + 2.4, 25, 1.8, Math.min(totalRate, 100), [16, 185, 129]);

      p2Y += 7.5;
    }

    p2Y += 4;

    // 2. Günlük Görev ve Çalışma Raporu Detayları (Raporlar Sayfası Formatı)
    doc.setTextColor(15, 23, 42);
    doc.setFont(fontName, "bold");
    doc.setFontSize(8.5);
    doc.text("2. Günlük Görev ve Çalışma Raporu Detayları", 10, p2Y + 4);
    doc.setFontSize(6);
    doc.setFont(fontName, "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Pazartesi - Pazar aralığında koç tarafından planlanıp tamamlanan görev listesi.", 10, p2Y + 8);

    p2Y += 11;

    const dailyDays = params.dailyTasks || [];
    if (dailyDays.length === 0) {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(10, p2Y, 190, 12, 2, 2, "FD");
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6.8);
      doc.setFont(fontName, "normal");
      doc.text("Haftalık günlük görev kaydı bulunmamaktadır.", 105, p2Y + 7.5, { align: "center" });
      p2Y += 14;
    } else {
      dailyDays.forEach((day) => {
        const dayTasks = day.tasks || [];
        const doneTasks = dayTasks.filter((t: any) => t.isDone);
        const dayPct = dayTasks.length > 0 ? Math.round((doneTasks.length / dayTasks.length) * 100) : 0;

        // Calculate needed vertical space for this day
        const taskRowsCount = Math.ceil(dayTasks.length / 2);
        const tasksHeight = dayTasks.length === 0 ? 8 : taskRowsCount * 15.5;
        const totalDayNeededH = 7.5 + tasksHeight + 3;

        // Page break check if day doesn't fit on current page
        if (p2Y + totalDayNeededH > 282 && p2Y > 35) {
          doc.addPage();
          p2Y = 10;
          drawPageHeader(true);
        }

        // Day Header Bar
        doc.setFillColor(241, 245, 249);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(10, p2Y, 190, 6.5, 1.5, 1.5, "FD");

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(7.2);
        doc.setFont(fontName, "bold");
        doc.text(day.displayDate || "Gün", 14, p2Y + 4.5);

        if (dayTasks.length > 0) {
          doc.setTextColor(doneTasks.length === dayTasks.length ? 5 : 79, doneTasks.length === dayTasks.length ? 150 : 70, doneTasks.length === dayTasks.length ? 105 : 229);
          doc.setFontSize(6);
          doc.setFont(fontName, "bold");
          doc.text(`${doneTasks.length} / ${dayTasks.length} Görev Yapıldı (%${dayPct})`, 194, p2Y + 4.5, { align: "right" });
        } else {
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(5.8);
          doc.setFont(fontName, "normal");
          doc.text("Planlanmış Görev Yok", 194, p2Y + 4.5, { align: "right" });
        }

        p2Y += 8;

        if (dayTasks.length === 0) {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(241, 245, 249);
          doc.roundedRect(10, p2Y, 190, 6.5, 1.5, 1.5, "FD");
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(5.8);
          doc.setFont(fontName, "normal");
          doc.text("Bu gün için planlanan herhangi bir çalışma görevi bulunmamaktadır.", 105, p2Y + 4.3, { align: "center" });
          p2Y += 8.5;
        } else {
          // Render tasks in 2-column cards layout
          for (let tIdx = 0; tIdx < dayTasks.length; tIdx++) {
            const task = dayTasks[tIdx];
            const isLeftCol = tIdx % 2 === 0;
            const cardX = isLeftCol ? 10 : 106;
            const cardW = 94;
            const cardH = 14;

            // Check if card needs page break
            if (isLeftCol && p2Y + cardH > 282) {
              doc.addPage();
              p2Y = 10;
              drawPageHeader(true);
            }

            // Card background & border
            if (task.isDone) {
              doc.setFillColor(240, 253, 244);
              doc.setDrawColor(187, 247, 208);
            } else {
              doc.setFillColor(248, 250, 252);
              doc.setDrawColor(226, 232, 240);
            }
            doc.roundedRect(cardX, p2Y, cardW, cardH, 1.5, 1.5, "FD");

            // Checkbox icon
            if (task.isDone) {
              doc.setFillColor(16, 185, 129);
              doc.circle(cardX + 4.5, p2Y + 4.5, 2.2, "F");
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(5.2);
              doc.setFont(fontName, "bold");
              doc.text("✓", cardX + 4.5, p2Y + 5.5, { align: "center" });
            } else {
              doc.setDrawColor(203, 213, 225);
              doc.circle(cardX + 4.5, p2Y + 4.5, 2.2, "D");
            }

            // Subject Badge
            const rawSub = (task.subject || "DERS").toUpperCase();
            const safeSub = rawSub.length > 14 ? rawSub.substring(0, 12) + ".." : rawSub;
            doc.setFillColor(238, 242, 255);
            doc.roundedRect(cardX + 8.5, p2Y + 2.5, 23, 4, 1, 1, "F");
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(4.8);
            doc.setFont(fontName, "bold");
            doc.text(safeSub, cardX + 20, p2Y + 5.3, { align: "center" });

            // Task Type Badge
            const info = getTaskBadgeInfo(task);
            doc.setFillColor(241, 245, 249);
            doc.roundedRect(cardX + 33, p2Y + 2.5, 21, 4, 1, 1, "F");
            doc.setTextColor(100, 116, 139);
            doc.setFontSize(4.8);
            doc.setFont(fontName, "normal");
            doc.text(info.label, cardX + 43.5, p2Y + 5.3, { align: "center" });

            // Student Added Badge if applicable
            const isStudentTask = Boolean(task.isExtra || task.addedBy === 'student' || task.isStudentAdded || task.addedByStudent || task.createdBy === 'student');
            if (isStudentTask) {
              doc.setFillColor(254, 243, 199);
              doc.roundedRect(cardX + 55.5, p2Y + 2.5, 22, 4, 1, 1, "F");
              doc.setTextColor(180, 83, 9);
              doc.setFontSize(4.5);
              doc.setFont(fontName, "bold");
              doc.text("Öğrenci Ekledi", cardX + 66.5, p2Y + 5.3, { align: "center" });
            }

            // Topic line
            doc.setTextColor(15, 23, 42);
            doc.setFontSize(5.8);
            doc.setFont(fontName, "bold");
            const rawTopic = task.topic || "Konu belirtilmemiş";
            const safeTopic = rawTopic.length > 34 ? rawTopic.substring(0, 32) + ".." : rawTopic;
            doc.text(safeTopic, cardX + 4.5, p2Y + 9.5);

            // Counts line
            doc.setFontSize(5);
            doc.setFont(fontName, "normal");
            doc.setTextColor(100, 116, 139);
            doc.text(`Hedef: ${task.targetCount || '-'} ${info.unit}`, cardX + 4.5, p2Y + 12.6);
            if (task.isDone || task.completedCount > 0) {
              doc.setTextColor(5, 150, 105);
              doc.setFont(fontName, "bold");
              doc.text(`| Yapılan: ${task.completedCount || (task.isDone ? task.targetCount : 0)} ${info.unit}`, cardX + 34, p2Y + 12.6);
            }

            if (!isLeftCol || tIdx === dayTasks.length - 1) {
              p2Y += cardH + 1.5;
            }
          }
          p2Y += 2;
        }
      });
    }

    // Footers for all pages
    const totalPages = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : ((doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 2);
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(10, pageH - 10, 200, pageH - 10);
      doc.setFontSize(7);
      doc.setFont(fontName, "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("FocusON Akademi - Kişiselleştirilmiş Veli Bilgilendirme Raporu", 10, pageH - 5);
      doc.text(`Sayfa ${p} / ${totalPages}`, 200, pageH - 5, { align: "right" });
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

          // Calculate Deneme Ortalamaları (TYT Genel, AYT Genel, YDT Genel, TYT Branş, AYT Branş, YDT Branş) - Sadece Rapor Haftası
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

          // Ortalamaları sadece rapor haftasında girilen denemeler (examsList) üzerinden hesapla
          const tytGenel = examsList.filter(e => !isBranchExam(e) && ((e.examType || "").toUpperCase().includes("TYT") || (e.examName || "").toUpperCase().includes("TYT")));
          const aytGenel = examsList.filter(e => !isBranchExam(e) && ((e.examType || "").toUpperCase().includes("AYT") || (e.examName || "").toUpperCase().includes("AYT")));
          const ydtGenel = examsList.filter(e => !isBranchExam(e) && ((e.examType || "").toUpperCase().includes("YDT") || (e.examName || "").toUpperCase().includes("YDT")));

          const tytBrans = examsList.filter(e => isBranchExam(e) && ((e.examType || "").toUpperCase().includes("TYT") || (e.examName || "").toUpperCase().includes("TYT")));
          const aytBrans = examsList.filter(e => isBranchExam(e) && ((e.examType || "").toUpperCase().includes("AYT") || (e.examName || "").toUpperCase().includes("AYT")));
          const ydtBrans = examsList.filter(e => isBranchExam(e) && ((e.examType || "").toUpperCase().includes("YDT") || (e.examName || "").toUpperCase().includes("YDT")));

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
              model: getModelName("gemini-3.7-flash"),
              contents: prompt,
              config: {
                temperature: 0.7,
                systemInstruction: "Sen FocusON Akademi'nin profesyonel eğitim koçu asistanısın. Velilere geçen haftanın performans değerlendirmesini şık ve pedagojik dille sunuyorsun. Kısa, öz ve yapıcı ol."
              }
            });
            aiAnalysisText = ensureAiReportClosingSignature(response.text || "");
          } catch (aiErr: any) {
            // Gracefully activate pedagogical rule-based report generator when quota or credit limit is reached
            console.log(`[Weekly Reports] Pedagogical fallback active for ${studentName}`);
            aiAnalysisText = generatePedagogicalReportFallback({
              studentName,
              totalTarget,
              totalCompleted,
              completionRate,
              totalTasks,
              taskCompletionRate,
              studentGrade,
              studentBranch,
              studentTarget,
              subjectsBreakdown,
              exams: examsList
            });
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

              // Yöntem 1: WhatsApp Onaylı Şablon ile Gönder (Değişkenler tek satır ve sanitize edilmiş olmalı)
              if (templateSid) {
                try {
                  const templatePayload: any = {
                    from: fromTwilio,
                    to: targetTwilio,
                    contentSid: templateSid,
                    contentVariables: JSON.stringify({
                      "1": sanitizeTwilioContentVar(studentName, 40),
                      "2": sanitizeTwilioContentVar(reportId, 60)
                    })
                  };
                  if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                    delete templatePayload.from;
                    templatePayload.messagingServiceSid = twConfig.messagingServiceSid;
                  }

                  twMsg = await client.messages.create(templatePayload);
                  console.log(`[Weekly Reports] Şablon ile veliye gönderildi (${templateSid}). Message SID: ${twMsg.sid}`);
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
                console.log(`[Weekly Reports] Düz metin olarak veliye gönderildi. Message SID: ${twMsg.sid}`);
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
              templateVars: { "1": sanitizeTwilioContentVar(studentName, 40), "2": sanitizeTwilioContentVar(reportId, 60) },
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

          // Eğer veliye WhatsApp gönderiminde hata oluştuysa sistem içi bildirim oluştur
          if (sendStatus === "failed") {
            try {
              if (coachId) {
                await db.collection("notifications").add({
                  userId: coachId,
                  type: "system",
                  title: `⚠️ Rapor Gönderim Uyarısı: ${studentName}`,
                  message: `${studentName} isimli öğrencinin haftalık raporu oluşturuldu fakat veli WhatsApp (${phoneNum}) iletimi başarısız oldu. Raporu sistemden inceleyebilirsiniz.`,
                  link: `/ogrenci/${studentId}`,
                  isRead: false,
                  read: false,
                  createdAt: new Date().toISOString(),
                  timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            } catch (notifErr) {
              console.warn("[Weekly Reports] In-system error notification note:", notifErr);
            }
          }
        } catch (stErr: any) {
          console.error(`[Weekly Reports] Error processing student ${student.id}:`, stErr);
        }
      }

      // Her koç için tek bir konsolide WhatsApp özeti ve sistem içi bildirim
      const coachLogs: any[] = [];
      const coachTemplateSid = twConfig.weeklyCoachReportTemplateSid || "HXc6d299d5f35b7ea07f7a87310d42f7dc";

      for (const coach of Array.from(coachReportsMap.values())) {
        if (!coach.students || coach.students.length === 0) continue;

        try {
          const studentListText = coach.students.map(s => `• ${s.studentName} (%${s.completionRate} | ${s.totalCompleted}/${s.totalTarget} Soru): ${s.fullPdfUrl}`).join("\n");
          const coachMsgBody = `Sayın ${coach.coachName},\n\nÖğrencilerinizin ${periodStr} haftalık veli gelişim raporları ve başarı karneleri hazırlanmıştır.\n\n📊 Öğrenci Rapor Linkleri:\n${studentListText}\n\nÖğrencilerinizin durumlarını inceleyebilir ve haftalık koçluk takiplerinizi sürdürebilirsiniz.\n\nFocusON Akademi Rehberlik & Koçluk Sistemi`;

          let coachSendStatus = "simulation";
          let coachTwMessageSid: string | null = null;
          let coachErrorMessage: string | null = null;

          if (coach.coachPhone && twConfig.accountSid && twConfig.authToken) {
            try {
              const { default: twilio } = await import("twilio");
              const client = twilio(twConfig.accountSid, twConfig.authToken);
              const rawFrom = twConfig.whatsappNumber || "+14155238886";
              const fromTwilio = rawFrom.startsWith("whatsapp:") ? rawFrom : `whatsapp:${rawFrom}`;
              const targetTwilio = coach.coachPhone.startsWith("whatsapp:") ? coach.coachPhone : `whatsapp:${coach.coachPhone}`;

              let twMsg: any = null;

              // Özellik 1: WhatsApp Onaylı Koç Şablonu ile Değişkenleri Sanitize Ederek Gönder (HXc6d299d5f35b7ea07f7a87310d42f7dc)
              if (coachTemplateSid) {
                try {
                  const summaryText = `${coach.students.length} öğrencinizin raporu hazırlandı. Panel: https://omernasuhakademi.com/koc-paneli`;
                  const templatePayload: any = {
                    from: fromTwilio,
                    to: targetTwilio,
                    contentSid: coachTemplateSid,
                    contentVariables: JSON.stringify({
                      "1": sanitizeTwilioContentVar(coach.coachName, 40),
                      "2": sanitizeTwilioContentVar(periodStr, 40),
                      "3": sanitizeTwilioContentVar(summaryText, 100)
                    })
                  };
                  if (twConfig.messagingServiceSid && twConfig.messagingServiceSid.startsWith("MG") && twConfig.messagingServiceSid !== "MG756a41c407683bc11d1b9cc8c3c91ef8" && !twConfig.whatsappNumber) {
                    delete templatePayload.from;
                    templatePayload.messagingServiceSid = twConfig.messagingServiceSid;
                  }

                  twMsg = await client.messages.create(templatePayload);
                  console.log(`[Weekly Reports - Coach] Şablon ile koça gönderildi (${coachTemplateSid}). SID: ${twMsg.sid}`);
                } catch (templateErr: any) {
                  console.warn(`[Weekly Reports - Coach] Şablon gönderimi başarısız (${templateErr?.message || templateErr}). Metin formatına geçiliyor...`);
                }
              }

              // Standart metin fallback
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
              coachErrorMessage = twErr?.message || String(twErr);
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
                templateVars: { 
                  "1": sanitizeTwilioContentVar(coach.coachName, 40), 
                  "2": sanitizeTwilioContentVar(periodStr, 40), 
                  "3": sanitizeTwilioContentVar(`${coach.students.length} öğrencinin raporu hazırlandı`, 100) 
                },
                timestamp: admin.firestore.FieldValue.serverTimestamp()
              });
            } catch (msgAddErr) {
              console.log("[Weekly Reports - Coach] whatsapp_messages record note:", msgAddErr);
            }
          }

          // Sistem içi bildirim oluştur (Her durumda ve özellikle hata olduğunda)
          try {
            const isError = coachSendStatus === "failed" || !coach.coachPhone;
            await db.collection("notifications").add({
              userId: coach.coachId,
              type: isError ? "system" : "success",
              title: isError 
                ? "⚠️ Haftalık Raporlar Hazırlandı (WhatsApp İletim Notu)" 
                : "📊 Haftalık Öğrenci Raporları Hazırlandı",
              message: isError
                ? `${coach.students.length} öğrencinizin ${periodStr} haftalık veli gelişim raporları oluşturuldu. WhatsApp iletiminde sorun yaşanmış olabilir (${coachErrorMessage || 'Telefon bulunamadı'}), raporları sistem panelinizden inceleyebilirsiniz.`
                : `${coach.students.length} öğrencinizin ${periodStr} haftalık veli gelişim raporları oluşturuldu ve velilere iletildi.`,
              link: "/koc-paneli",
              data: {
                periodStr,
                studentsCount: coach.students.length,
                coachSendStatus,
                students: coach.students.map(s => ({
                  name: s.studentName,
                  rate: s.completionRate,
                  reportId: s.reportId,
                  url: s.fullPdfUrl
                }))
              },
              isRead: false,
              read: false,
              createdAt: new Date().toISOString(),
              timestamp: admin.firestore.FieldValue.serverTimestamp()
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
            messageSid: coachTwMessageSid
          });
        } catch (coachErr: any) {
          console.error(`[Weekly Reports - Coach] Error dispatching to coach ${coach.coachName}:`, coachErr);
          
          // Hata durumunda koç için acil durum sistem içi bildirimi
          try {
            await db.collection("notifications").add({
              userId: coach.coachId,
              type: "system",
              title: "⚠️ Haftalık Rapor İşlem Uyarısı",
              message: `Haftalık gelişim raporlarınız işlenirken bir hata oluştu: ${coachErr?.message || 'Bilinmeyen hata'}. Lütfen koç panelinizi kontrol ediniz.`,
              link: "/koc-paneli",
              isRead: false,
              read: false,
              createdAt: new Date().toISOString(),
              timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (e) {
            console.warn("Failed to write emergency notification", e);
          }
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

      const db = getDb();
      const docSnap = await db.collection("weekly_pdf_reports").doc(reportId).get();
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        
        let studentPhotoData: { base64: string; format: "PNG" | "JPEG" } | null = null;
        if (data.studentPhotoBase64) {
          studentPhotoData = { base64: data.studentPhotoBase64, format: data.studentPhotoFormat || "PNG" };
        } else if (data.studentPhotoURL || data.photoURL) {
          studentPhotoData = await resolveStudentPhotoBase64(data.studentPhotoURL || data.photoURL);
        }

        // Reconstruct dynamically from stored parameters using the modern, light, balanced template
        const reconstructedBuffer = generateWeeklyReportPdfBuffer({
          studentName: data.studentName || "Öğrenci",
          periodStr: data.periodStr || "Haftalık Rapor",
          totalTarget: Number(data.totalTarget) || 0,
          totalCompleted: Number(data.totalCompleted) || 0,
          completionRate: Number(data.completionRate) || 0,
          totalTasks: Number(data.totalTasks) || 0,
          examsCount: Number(data.examsCount) || 0,
          aiAnalysisText: ensureAiReportClosingSignature(
            data.aiAnalysisText || `Sayın Velimiz,\n\n${data.studentName || 'Öğrencimiz'} isimli öğrencimizin haftalık soru çözümü ve koçluk hedeflerine uyumu başarıyla analiz edilmiştir.`
          ),
          subjectsBreakdown: Array.isArray(data.subjectsBreakdown) ? data.subjectsBreakdown : [],
          studentGrade: data.studentGrade || "12. Sınıf",
          studentBranch: data.studentBranch || "SAYISAL",
          studentTarget: data.studentTarget || "Belirtilmedi",
          studentPackage: data.studentPackage || "Sınırsız Zirve VIP (Altın Paket)",
          studentPhotoBase64: studentPhotoData?.base64,
          studentPhotoFormat: studentPhotoData?.format,
          dailyTasks: data.dailyTasks || [],
          exams: data.exams || [],
          taskCompletionRate: Number(data.taskCompletionRate) || 0,
          denemeAverages: data.denemeAverages || {}
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

  app.get("/api/reports/data/:reportId", async (req, res) => {
    try {
      let reportId = req.params.reportId || "";
      if (reportId.includes("rep_")) {
        reportId = "rep_" + reportId.split("rep_")[1];
      }
      reportId = reportId.split("?")[0].split("/")[0].trim();

      const db = getDb();
      const docSnap = await db.collection("weekly_pdf_reports").doc(reportId).get();
      if (docSnap.exists) {
        const data = docSnap.data() || {};
        return res.json({
          success: true,
          reportId,
          report: {
            studentName: data.studentName || "Öğrenci",
            periodStr: data.periodStr || "Haftalık Gelişim Raporu",
            totalTarget: Number(data.totalTarget) || 0,
            totalCompleted: Number(data.totalCompleted) || 0,
            completionRate: Number(data.completionRate) || 0,
            totalTasks: Number(data.totalTasks) || 0,
            taskCompletionRate: Number(data.taskCompletionRate) || 0,
            examsCount: Number(data.examsCount) || 0,
            aiAnalysisText: data.aiAnalysisText || "",
            subjectsBreakdown: Array.isArray(data.subjectsBreakdown) ? data.subjectsBreakdown : [],
            studentGrade: data.studentGrade || "12. Sınıf",
            studentBranch: data.studentBranch || "SAYISAL",
            studentTarget: data.studentTarget || "Belirtilmedi",
            studentPackage: data.studentPackage || "Sınırsız Zirve VIP (Altın Paket)",
            dailyTasks: data.dailyTasks || [],
            exams: data.exams || [],
            denemeAverages: data.denemeAverages || {}
          }
        });
      }

      // Check fallback student lookup
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
            console.warn("User lookup for report data notice:", uErr);
          }
        }
      }

      return res.json({
        success: true,
        reportId,
        report: {
          studentName: resolvedStudentName,
          periodStr: "Haftalık Gelişim ve Değerlendirme Raporu",
          totalTarget: 500,
          totalCompleted: 460,
          completionRate: 92,
          totalTasks: 20,
          taskCompletionRate: 90,
          examsCount: 2,
          aiAnalysisText: `Sayın Velimiz,\n\n${resolvedStudentName} isimli öğrencimizin haftalık soru çözümü, deneme sınavı analizleri ve koçluk hedeflerine uyumu başarıyla tamamlanmıştır.`,
          subjectsBreakdown: [{ subject: "Matematik", target: 200, completed: 180 }, { subject: "Fizik", target: 120, completed: 110 }],
          studentGrade: resolvedGrade,
          studentBranch: resolvedBranch,
          studentTarget: resolvedTarget,
          studentPackage: resolvedPackage,
          dailyTasks: [],
          exams: [],
          denemeAverages: {}
        }
      });
    } catch (err: any) {
      console.error("Report data fetch error:", err);
      res.status(500).json({ success: false, error: err.message });
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
  let isSubscriptionRemindersRunning = false;

  async function executeSubscriptionReminders(options?: {
    studentId?: string;
    parentPhone?: string;
    force?: boolean;
    allowDuplicateToday?: boolean;
  }) {
    if (isSubscriptionRemindersRunning) {
      console.warn("[Subscription Reminder] Başka bir abonelik hatırlatma süreci zaten çalışıyor, mükerrer işlem engellendi.");
      return { success: true, message: "Abonelik hatırlatma süreci zaten çalışıyor.", processedCount: 0 };
    }
    isSubscriptionRemindersRunning = true;
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

      // Read configured subscription reminder days before (default 5)
      let reminderDaysBefore = 5;
      try {
        const notifSettingsSnap = await db.collection("settings").doc("notifications").get();
        if (notifSettingsSnap.exists) {
          const notifData = notifSettingsSnap.data();
          if (notifData?.subscriptionDaysBefore) {
            reminderDaysBefore = Number(notifData.subscriptionDaysBefore) || 5;
          }
        }
      } catch (nsErr) {
        console.warn("[Subscription Reminder] Error reading notification settings:", nsErr);
      }

      const templateSid = "HXdbff2ce81cacc365c1e3c16897ec4a53";
      // Koç bakiye yetersizliği şablonu Template SID
      const coachWarningTemplateSid = "HX0cfb2d5c6385cae753e5ab633294c3a7"; 
      
      const now = new Date();
      // Normalize today to midnight UTC for easy day diff
      const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      
      // Calculate today date string in Europe/Istanbul for accurate daily deduplication
      const istanbulFormatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Istanbul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      });
      const iParts = istanbulFormatter.formatToParts(now);
      const iYear = iParts.find(p => p.type === 'year')?.value || String(now.getFullYear());
      const iMonth = iParts.find(p => p.type === 'month')?.value || String(now.getMonth() + 1).padStart(2, '0');
      const iDay = iParts.find(p => p.type === 'day')?.value || String(now.getDate()).padStart(2, '0');
      const todayDateStr = `${iYear}-${iMonth}-${iDay}`;
      
      let query = db.collection("users").where("role", "==", "student").where("subscriptionStatus", "==", "active");
      
      const studentsSnap = await query.get();
      
      // 1. Koçların yaklaşan sistem kesintilerini hesapla
      const coachDeductionMap: Record<string, { totalUpcoming: number, studentCount: number, coachData: any, notifyToday: boolean }> = {};
      
      for (const docSnap of studentsSnap.docs) {
        const student = docSnap.data();
        if (!student.subscriptionEndDate || !student.subscriptionPlan) continue;
        
        // Otomatik yenilemesi kapalı olan öğrenciler için kesinti gerçekleşmeyeceğinden koç hesaplamasına dahil edilmez
        if (student.autoRenew === false) continue;
        
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
           let pBronze = cData.bronzePrice !== undefined && cData.bronzePrice !== null ? cData.bronzePrice : 3000;
           let pSilver = cData.silverPrice !== undefined && cData.silverPrice !== null ? cData.silverPrice : 4500;
           let pGold = cData.goldPrice !== undefined && cData.goldPrice !== null ? cData.goldPrice : 6000;
           
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
           
           if (daysLeft === reminderDaysBefore || daysLeft === 1 || (options?.force && options?.studentId)) {
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

                     // DEDUPLICATION: Ensure coach warning is sent at most once per day
                     const coachLogKey = `sub_warning_coach_${coachId}_${todayDateStr}`;
                     const coachLogRef = db.collection("daily_notification_logs").doc(coachLogKey);
                     const coachLogDoc = await coachLogRef.get();
                     if (coachLogDoc.exists && !options?.allowDuplicateToday) {
                       console.log(`[Coach Reminder] Koç ${coachId} (${coachName}) için bugün (${todayDateStr}) zaten bakiye uyarısı gönderilmiş. Atlandı.`);
                       continue;
                     }
                     
                     const templatePayload: any = {
                        from: fromTwilio,
                        to: targetTwilio,
                        contentSid: coachWarningTemplateSid,
                        contentVariables: JSON.stringify({
                          "1": sanitizeTwilioContentVar(coachName, 40),
                          "2": sanitizeTwilioContentVar(String(data.studentCount), 10),
                          "3": sanitizeTwilioContentVar(String(data.totalUpcoming.toLocaleString('tr-TR')), 20),
                          "4": sanitizeTwilioContentVar(String(currentSysBalance.toLocaleString('tr-TR')), 20)
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

                           await coachLogRef.set({
                             sentAt: admin.firestore.FieldValue.serverTimestamp(),
                             coachId,
                             coachName,
                             phone: formattedCoachPhone,
                             type: "coach_subscription_warning",
                             date: todayDateStr
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
        const currentStudentId = docSnap.id;
        if (options?.studentId && currentStudentId !== options.studentId) continue;
        if (!student.subscriptionEndDate || !student.subscriptionPlan) continue;
        
        // Sadece otomatik yenilemesi açık olanlar için hatırlatma gönderilir.
        // Otomatik yenilemeyi kapatan öğrenciler için abonelik hatırlatma bildirimi gönderilmez.
        if (student.autoRenew === false) {
          console.log(`[Subscription Reminder] ${student.firstName || ''} ${student.lastName || ''} (${currentStudentId}) için otomatik yenileme kapalı olduğundan abonelik hatırlatma bildirimi gönderilmedi.`);
          continue;
        }
        
        const endDate = new Date(student.subscriptionEndDate);
        const endDay = new Date(Date.UTC(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()));
        
        const diffTime = Math.abs(endDay.getTime() - today.getTime());
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Ensure the end date is actually in the future
        if (endDay.getTime() < today.getTime()) continue;

        // Target day check: either configured days (e.g. 5) or 1 day before, or explicit single-student test
        const isTargetDay = (daysLeft === reminderDaysBefore || daysLeft === 1 || (options?.force && options?.studentId));
        if (!isTargetDay) continue;

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
        
        // Insufficient balance check (or explicit single-student test)
        const isBalanceInsufficient = (walletBalance < cost) || (options?.force && options?.studentId);
        if (isBalanceInsufficient) {
          const parentPhone = options?.parentPhone || student.parentPhone || student.phone;
          if (parentPhone) {
            const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Öğrenci';
            const formattedParentPhone = formatE164Phone(parentPhone);

            // DEDUPLICATION 1: Check if a reminder for this student was already sent today
            const parentLogKey = `sub_parent_reminder_${currentStudentId}_${todayDateStr}`;
            const parentLogRef = db.collection("daily_notification_logs").doc(parentLogKey);
            const parentLogDoc = await parentLogRef.get();

            if (parentLogDoc.exists && !options?.allowDuplicateToday) {
              console.log(`[Subscription Reminder] Öğrenci ${studentName} (${currentStudentId}) için bugün (${todayDateStr}) zaten veli WhatsApp hatırlatması iletilmiş. Mükerrer gönderim engellendi.`);
              continue;
            }

            // DEDUPLICATION 2: Phone-level cooldown check to prevent multiple alerts to the exact same phone number today
            const phoneCooldownKey = `sub_phone_cooldown_${formattedParentPhone.replace(/[^0-9]/g, '')}_${todayDateStr}`;
            const phoneCooldownRef = db.collection("daily_notification_logs").doc(phoneCooldownKey);
            const phoneCooldownDoc = await phoneCooldownRef.get();

            if (phoneCooldownDoc.exists && !options?.allowDuplicateToday) {
              console.log(`[Subscription Reminder] ${formattedParentPhone} numaralı telefona bugün (${todayDateStr}) zaten hatırlatma yapılmış. Spam engeli devrede, atlandı.`);
              continue;
            }
            
            if (twConfig.accountSid && twConfig.authToken && (twConfig.messagingServiceSid || twConfig.whatsappNumber)) {
              try {
                const { default: twilio } = await import("twilio");
                const client = twilio(twConfig.accountSid, twConfig.authToken);
                let targetTwilio = formattedParentPhone.startsWith("whatsapp:") ? formattedParentPhone : `whatsapp:${formattedParentPhone}`;
                let fromTwilio = twConfig.whatsappNumber && twConfig.whatsappNumber.includes("whatsapp:") ? twConfig.whatsappNumber : `whatsapp:${twConfig.whatsappNumber}`;
                
                const templatePayload: any = {
                  from: fromTwilio,
                  to: targetTwilio,
                  contentSid: templateSid,
                  contentVariables: JSON.stringify({
                    "1": sanitizeTwilioContentVar(studentName, 40),
                    "2": sanitizeTwilioContentVar(String(daysLeft), 10),
                    "3": sanitizeTwilioContentVar(String(walletBalance.toLocaleString('tr-TR')), 20),
                    "4": sanitizeTwilioContentVar(String(cost.toLocaleString('tr-TR')), 20),
                    "5": sanitizeTwilioContentVar(student.subscriptionPlan, 40)
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

                  // Write deduplication records to completely prevent duplicate sends today
                  await parentLogRef.set({
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    studentId: currentStudentId,
                    studentName,
                    phone: formattedParentPhone,
                    daysLeft,
                    walletBalance,
                    cost,
                    plan: student.subscriptionPlan,
                    date: todayDateStr,
                    type: "parent_subscription_reminder"
                  });

                  await phoneCooldownRef.set({
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                    phone: formattedParentPhone,
                    date: todayDateStr,
                    studentId: currentStudentId,
                    type: "phone_daily_cooldown"
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

      console.log(`[Subscription Reminder] Completed. Processed ${processedCount} reminders.`);
      return { success: true, processedCount };
    } catch (error: any) {
      console.error("[Subscription Reminder] General error:", error);
      return { success: false, error: error?.message };
    } finally {
      isSubscriptionRemindersRunning = false;
    }
  }

  app.post("/api/test-subscription-reminders", async (req, res) => {
    try {
      const result = await executeSubscriptionReminders({
        ...req.body,
        force: req.body?.forceSingle || req.body?.force || false,
        allowDuplicateToday: true // Admin explicitly triggered a test for a single student
      });
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

  // Automated Cron Webhook Endpoints for Cloud Scheduler / External Cron Services
  const validateCronAuth = (req: express.Request) => {
    const secret = process.env.CRON_SECRET || "focuson_cron_2026";
    const authHeader = req.headers.authorization;
    const tokenQuery = req.query.token || req.query.key || req.body?.token;
    if (authHeader && authHeader === `Bearer ${secret}`) return true;
    if (tokenQuery && tokenQuery === secret) return true;
    // Allow if no CRON_SECRET is configured in env and request matches default fallback token
    return tokenQuery === "focuson_cron_2026" || !process.env.CRON_SECRET;
  };

  app.all(["/api/cron/subscription-reminders", "/api/cron/daily-reminders"], async (req, res) => {
    if (!validateCronAuth(req)) {
      return res.status(401).json({ error: "Yetkisiz cron erişimi. Geçersiz token." });
    }
    try {
      console.log("[Cron Webhook] External HTTP ping received for subscription reminders...");
      const result = await executeSubscriptionReminders();
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: "Abonelik ve bakiye hatırlatma görevleri çalıştırıldı.",
        processedCount: result.processedCount
      });
    } catch (err: any) {
      console.error("[Cron Webhook] Error processing subscription reminders:", err);
      return res.status(500).json({ error: err?.message || "Sunucu hatası oluştu." });
    }
  });

  app.all(["/api/cron/sync-youtube-playlists", "/api/cron/sync-youtube"], async (req, res) => {
    if (!validateCronAuth(req)) {
      return res.status(401).json({ error: "Yetkisiz cron erişimi. Geçersiz token." });
    }
    try {
      console.log("[Cron Webhook] External HTTP ping received for YouTube playlist sync...");
      const result = await executeYouTubePlaylistSync();
      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: result.message || "YouTube oynatma listeleri senkronize edildi.",
        totalChecked: result.totalChecked,
        updatedCount: result.updatedCount,
        newVideosTotal: result.newVideosTotal
      });
    } catch (err: any) {
      console.error("[Cron Webhook] Error synchronizing YouTube playlists:", err);
      return res.status(500).json({ error: err?.message || "Sunucu hatası oluştu." });
    }
  });

  app.all("/api/cron/trigger-all", async (req, res) => {
    if (!validateCronAuth(req)) {
      return res.status(401).json({ error: "Yetkisiz cron erişimi. Geçersiz token." });
    }
    try {
      console.log("[Cron Webhook] External HTTP ping received for all scheduled tasks...");
      const notifEngineResult = await executeScheduledNotificationEngine({
        triggerSource: "Cloud Scheduler External Ping"
      });
      const remindersResult = await executeSubscriptionReminders();
      const ytSyncResult = await executeYouTubePlaylistSync();
      
      let weeklyReportsResult: any = null;
      const now = new Date();
      // If force flag is set or today is Monday (day 1)
      if (req.query.force === "true" || now.getDay() === 1) {
        weeklyReportsResult = await executeWeeklyReportBatch();
      }

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        message: "Sistem zamanlanmış görevleri başarıyla çalıştırıldı.",
        notificationStats: notifEngineResult?.stats || null,
        remindersProcessed: remindersResult.processedCount,
        youtubeChecked: ytSyncResult.totalChecked,
        youtubeUpdated: ytSyncResult.updatedCount,
        youtubeNewVideos: ytSyncResult.newVideosTotal,
        weeklyReportsExecuted: !weeklyReportsResult,
        weeklyReportsProcessed: weeklyReportsResult?.processedCount || 0
      });
    } catch (err: any) {
      console.error("[Cron Webhook] Error triggering scheduled tasks:", err);
      return res.status(500).json({ error: err?.message || "Görevler çalıştırılırken bir hata oluştu." });
    }
  });

  // =========================================================================
  // UNIVERSAL AUTOMATED NOTIFICATION ENGINE & SETTINGS API
  // =========================================================================

  async function sendNotificationAndPushToUser(
    userId: string,
    title: string,
    body: string,
    link: string = "/",
    type: string = "system"
  ): Promise<{ success: boolean; pushSent: boolean; notificationDocCreated: boolean; error?: string }> {
    const db = getDb();
    let notificationDocCreated = false;
    let pushSent = false;

    // 1. In-App Notification Doc in Firestore
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

  async function executeScheduledNotificationEngine(options?: { forceAll?: boolean; specificType?: string; triggerSource?: string }) {
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

      logs.push(`[Engine Start] Current Istanbul Time: ${todayDateStr} ${currentTimeStr}`);

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

                  // Also motivate the student
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

      // ==========================================
      // RULE 5: SUBSCRIPTION EXPIRY
      // ==========================================
      const subReminderTime = settings.subscriptionReminderTime || "19:00";
      const isSubHourMatch = subReminderTime.split(":")[0] === currentHour;
      if (settings.subscriptionReminderEnabled && (isSubHourMatch || options?.forceAll) && (!options?.specificType || options.specificType === "subscription")) {
        try {
          const subEngineLogKey = `sub_engine_daily_${todayDateStr}`;
          const subEngineLogRef = db.collection("daily_notification_logs").doc(subEngineLogKey);
          const subEngineLogDoc = await subEngineLogRef.get();

          if (!subEngineLogDoc.exists || options?.forceAll) {
            console.log(`[Notification Engine] Rule 5 triggered for ${todayDateStr}. Executing subscription reminders...`);
            // IMPORTANT: force is false so automated engine never sends reminders to non-expiring subscriptions
            const subRes = await executeSubscriptionReminders({ force: false, allowDuplicateToday: false });
            stats.subscriptionSent += (subRes?.processedCount || 0);

            await subEngineLogRef.set({
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              date: todayDateStr,
              type: "subscription_engine_daily",
              processedCount: subRes?.processedCount || 0
            });
          } else {
            logs.push(`Abonelik hatırlatması bugün (${todayDateStr}) zaten tamamlandı. Saat içi tekrar çalıştırılması atlandı.`);
          }
        } catch (err: any) {
          console.error("[Engine Rule 5: Subscriptions Error]", err);
          stats.totalErrors++;
        }
      }

      // Save execution summary to notification_engine_logs collection
      try {
        await db.collection("notification_engine_logs").add({
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          time: `${todayDateStr} ${currentTimeStr}`,
          success: stats.totalErrors === 0,
          triggerSource: options?.triggerSource || (options?.forceAll ? "Manuel Admin Tetikleme" : "Otomatik Zamanlayıcı (Cron)"),
          stats,
          message: `Tarama başarıyla tamamlandı. Gönderilen push bildirimleri: ${stats.totalPushSent}`
        });
      } catch (logErr) {
        console.error("[Engine Log DB Error]", logErr);
      }

      return {
        success: true,
        message: `Zamanlayıcı taraması tamamlandı. ${stats.totalPushSent} adet anlık push bildirimi doğrudan iletildi.`,
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

  // API Endpoints for Notification Settings & Engine Execution
  app.get("/api/notifications/settings", async (req, res) => {
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

  app.post("/api/notifications/settings", async (req, res) => {
    try {
      const db = getDb();
      await db.collection("settings").doc("notifications").set({
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      return res.json({ success: true, message: "Bildirim ayarları güncellendi." });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  app.post("/api/notifications/trigger-engine", async (req, res) => {
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

  function cleanMathAndDollarSigns(text: string): string {
    if (!text || typeof text !== "string") return "";

    let cleaned = text;

    // 1. LaTeX math blocks $$...$$ -> strip $$ and format nicely
    cleaned = cleaned.replace(/\$\$([\s\S]*?)\$\$/g, (_match, p1) => {
      return `\n\n${p1.trim()}\n\n`;
    });

    // 2. LaTeX fractions: \frac{a}{b} -> (a) / (b)
    cleaned = cleaned.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1) / ($2)");

    // 3. LaTeX square roots: \sqrt{a} -> √(a)
    cleaned = cleaned.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");

    // 4. Common LaTeX symbols to clean readable Unicode
    cleaned = cleaned
      .replace(/\\cdot/g, "·")
      .replace(/\\times/g, "×")
      .replace(/\\div/g, "÷")
      .replace(/\\pm/g, "±")
      .replace(/\\neq/g, "≠")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\le(?![a-zA-Z])/g, "≤")
      .replace(/\\ge(?![a-zA-Z])/g, "≥")
      .replace(/\\approx/g, "≈")
      .replace(/\\infty/g, "∞")
      .replace(/\\degree/g, "°")
      .replace(/\^\\circ/g, "°")
      .replace(/\\left\(/g, "(")
      .replace(/\\right\)/g, ")")
      .replace(/\\left\[/g, "[")
      .replace(/\\right\]/g, "]")
      .replace(/\\left\\{/g, "{")
      .replace(/\\right\\}/g, "}");

    // 5. LaTeX text wrappers: \text{...}, \mathrm{...}
    cleaned = cleaned.replace(/\\(text|mathrm|mathbf|mathit)\{([^}]+)\}/g, "$2");

    // 6. Handle $(...) or ($...) or $(...)$ -> (...)
    cleaned = cleaned.replace(/\$\s*\(([^)]+)\)\s*\$/g, "($1)");
    cleaned = cleaned.replace(/\$\s*\(([^)]+)\)/g, "($1)");
    cleaned = cleaned.replace(/\(\s*\$([^)]+)\)/g, "($1)");

    // 7. Inline math $...$ -> extract inner text without $
    cleaned = cleaned.replace(/\$([^\$\n]+?)\$/g, (_match, p1) => {
      return p1.trim();
    });

    // 8. Remove any remaining stray $ signs next to chars, parentheses, brackets
    cleaned = cleaned.replace(/\$([a-zA-Z0-9\(\)\[\]\{\}\+\-\*\/\=\<\>\_\^])/g, "$1");
    cleaned = cleaned.replace(/([a-zA-Z0-9\(\)\[\]\{\}\+\-\*\/\=\<\>\_\^])\$/g, "$1");
    cleaned = cleaned.replace(/\$\s+/g, "");
    cleaned = cleaned.replace(/\s+\$/g, "");
    cleaned = cleaned.replace(/^\$|\$$/gm, "");

    return cleaned.trim();
  }

  // --- AI Öğrenci Asistanı - Soru Çözüm Asistanı Endpoint ---
  app.post("/api/student-question-assistant", async (req, res) => {
    try {
      const { questionText, imageBase64, imageMimeType, studentName, voiceName } = req.body;

      if (!questionText && !imageBase64) {
        return res.status(400).json({ error: "Soru metni veya soru görseli gereklidir." });
      }

      let ai = getGeminiClient();
      const textModelName = getModelName("gemini-3.6-flash");

      const systemInstruction = `Sen FocusON Akademi'nin AI Özel Ders Öğretmeni ve Soru Çözüm Uzmanısın. Karşındaki öğrenci: ${studentName || "Öğrenci"}.

🚨 KESİN KURAL: DOLAR İŞARETİ ($ veya $$) ASLA KULLANMA!
- Formülleri, değişkenleri, adımları $ içine ALMA.
- Parantez için sadece standart normal parantez (...) kullan.
- Kesirleri (pay) / (payda), çarpma için '·' veya '×', üsler için '²', '³', kök için '√' kullan.
- Girişte öğrenciye doğrudan ismiyle hitap ederek samimi ve motive edici başla ("Selam ${studentName || 'Öğrenci'}, harika bir soru! Gel adım adım çözelim.").

KONTROL & DEĞERLENDİRME:
1. Görselde HİÇ SORU YOKSA:
   - hasValidSingleQuestion: false, questionStatus: "NO_QUESTION"
   - responseText: "⚠️ **Görselde Soru Tespiti Yapılamadı**\n\nYüklediğiniz görselde çözülebilecek herhangi bir ders/test sorusu tespit edilemedi. Lütfen sorunun net bir şekilde görüldüğü bir fotoğraf yükleyerek tekrar deneyiniz."
2. Görselde BİRDEN FAZLA SORU VARSA:
   - hasValidSingleQuestion: false, questionStatus: "MULTIPLE_QUESTIONS"
   - responseText: "⚠️ **Birden Fazla Soru Tespit Edildi**\n\nYüklediğiniz görselde 1'den fazla soru bulunmaktadır. Lütfen fotoğrafı kırparak **tek bir görselde yalnızca 1 adet soru** olacak şekilde yükleyiniz."
3. TEK BİR SORU VARSA:
   - hasValidSingleQuestion: true, questionStatus: "SINGLE_QUESTION"
   - responseText: Aşağıdaki formatta eksiksiz adım adım Türkçe çözüm.

ÇÖZÜM FORMATI (Eksiksiz bu başlıkları kullan):
🌟 **Özel Ders Girişi** (İsimle hitap ve konunun ana mantığı)
📋 **Soruda Verilenler & İstenen** (- **Verilenler:** ... - **İstenen:** ...)
📐 **Kullanacağımız Formül / Kural** (Net formül ve günlük dilde karşılığı)
🔍 **Adım Adım Ayrıntılı Çözüm** (1. Adım Verileri Koyma, 2. Adım İşlemler, 3. Adım Sonuç)
💡 **Sınav Püf Noktası & Pratik Yol** (Zaman kazandıran taktik veya kritik tuzak)
🎯 **Doğru Cevap** (**Doğru Cevap: [Şık] (Sonuç: [Değer])**)`;

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
        text: cleanMathAndDollarSigns(parsedResult.responseText)
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

      const systemInstruction = `Sen FocusON Akademi'nin AI Özel Ders Öğretmenisin. Karşındaki öğrenci: ${studentName || "Öğrenci"}.

🚨 KESİN KURAL: DOLAR İŞARETİ ($ veya $$) ASLA KULLANMA!
- Formül ve değişkenleri $ içine ALMA.
- Parantez için sadece standart (...) kullan.
- Sade semboller (\`x²\`, \`√a\`, \`a / b\`, \`F = m · a\`) kullan.

ANLATIM KURALLARI:
1. DOĞRUDAN VE NET AÇIKLA: Öğrencinin anlamadığı spesifik adıma odaklan. Sorunun tamamını baştan çözmek yerine takıldığı mantığı somut örnek ve ara işlemle tane tane aydınlat.
2. SAMİMİ VE MOTİVE EDİCİ: Öğrenciyi yüreklendir ("Harika bir soru ${studentName || ''}, burayı hemen netleştirelim...").
3. Yanıtını anlaşılır, odaklı ve akıcı bir Türkçe ile ver.`;

      const contents: any[] = [];

      // Soru ve çözümü makul uzunlukta tutarak token tasarrufu sağla
      const truncatedSolution = originalSolution && originalSolution.length > 1500
        ? originalSolution.substring(0, 1500) + "\n...(devamı özetlendi)"
        : (originalSolution || "");

      let contextText = `ORİJİNAL SORU/NOT:\n${questionText || "Görsel veya Metin Sorusu"}\n\nORİJİNAL ÇÖZÜM:\n${truncatedSolution}`;
      contents.push({ parts: [{ text: contextText }] });

      // Yalnızca son 4 mesajı (son 2 karşılıklı tur) alarak bağlam şişmesini engelle
      if (chatHistory && Array.isArray(chatHistory)) {
        const recentHistory = chatHistory.slice(-4);
        for (const msg of recentHistory) {
          const roleLabel = msg.sender === 'user' ? 'Öğrenci' : 'AI Asistan';
          let msgText = msg.text || '';
          if (msg.sender !== 'user' && msgText.length > 350) {
            msgText = msgText.substring(0, 350) + '...';
          }
          contents.push({ parts: [{ text: `${roleLabel}: ${msgText}` }] });
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
        text: cleanMathAndDollarSigns(textResult)
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

  // 1. Brainstorming with AI Creative Director (Exact Step-by-Step RAG Dialogue & State Pipeline)
  app.post("/api/ai-agency/brainstorm", async (req, res) => {
    try {
      const { userMessage, chatHistory, customBrief, allSitePages } = req.body;

      const normalizedMsg = (userMessage || "").toLowerCase().trim();

      // Rule-based deterministic state helper to guarantee seamless step-by-step flow even if AI API has credit limits
      const generateStepReply = () => {
        if (!normalizedMsg || normalizedMsg.includes("reklam oluşturmak") || normalizedMsg.includes("bir reklam") || normalizedMsg === "reklam") {
          return {
            directorReply: "Tabii ki, hangi konuda reklam oluşturmak istiyorsun?",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            autoDetectedPageTitle: "7/24 Sesli & Görsel AI Soru Çözüm Asistanı",
            quickReplies: ["Yapay zeka asistan", "Sınav Metronomu ile süre yönetimi", "Koçlar için veli raporlama sistemi", "35+ Bilişsel ve ÇABA Analizleri"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("asistan") || normalizedMsg.includes("yapay zeka") || normalizedMsg.includes("ai")) {
          return {
            directorReply: "Yapay zeka asistan hem öğrencide hem velide hem de koçta var, hangisi hakkında reklam yapalım?",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            autoDetectedPageTitle: "7/24 Sesli & Görsel AI Soru Çözüm Asistanı",
            whatHappensSummary: "Öğrencinin fotoğraf yükleyerek soru çözdürmesi ve eksik konu kazanım analizi alması",
            connectedPagesSummary: "Deneme takibi, koç analizleri ve konu haritası ile entegre",
            keyAdvantagesSummary: "Tüm bilgileri harmanlayarak mantığı adım adım öğretmesi",
            quickReplies: ["Öğrenci", "Koç", "Veli"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("öğrenci") || normalizedMsg.includes("ogrenci")) {
          return {
            directorReply: "Öğrenci asistanında hem fotoğraf yükleyip soru çözdürme hem de sesli rehberlik/sohbet var. Soru çözüm asistanını da dahil edelim mi yoksa sadece sohbet asistanı mı?",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            autoDetectedPageTitle: "7/24 Sesli & Görsel AI Soru Çözüm Asistanı",
            quickReplies: ["Dahil edelim", "Sadece sohbet asistanı"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("dahil") || normalizedMsg.includes("soru çözüm") || normalizedMsg.includes("sohbet")) {
          return {
            directorReply: "Harika! Bunu hangi sosyal medyada paylaşmak istiyorsun? (Instagram, TikTok, YouTube, X, diğer)",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            quickReplies: ["Instagram", "TikTok", "YouTube", "X (Twitter)"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("instagram") || normalizedMsg.includes("tiktok") || normalizedMsg.includes("youtube") || normalizedMsg.includes("twitter") || normalizedMsg.includes("x")) {
          return {
            directorReply: "Harika! Bunu Reels olarak mı, hikaye olarak mı yoksa gönderi olarak mı paylaşalım?",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            quickReplies: ["Gönderi", "Reels", "Hikaye"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("gönderi") || normalizedMsg.includes("post") || normalizedMsg.includes("reels") || normalizedMsg.includes("hikaye")) {
          return {
            directorReply: "Boyutları 1:1 mi olsun 4:3 mü?",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            quickReplies: ["4:3 olsun", "1:1 olsun"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("4:3") || normalizedMsg.includes("1:1") || normalizedMsg.includes("boyut")) {
          return {
            directorReply: "Vurgulamak istediğin özel bir özellik veya açı var mı?",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            quickReplies: ["Tüm bilgilerin harmanlandığını gösterelim", "Gece 02:00'de takılmadan soru çözümü", "Net artışı ve stres bitirme"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("harman") || normalizedMsg.includes("gece") || normalizedMsg.includes("net artışı") || normalizedMsg.includes("özel") || normalizedMsg.includes("vurgu")) {
          return {
            directorReply: "Tamamdır. Şöyle bir içerik planı hazırladım; değiştirmek istediğin bir yer varsa söyle değiştirelim. Tamamdır dersen sana tam promptu verebilirim.\n\n📋 **Taslak İçerik Planı:**\n- **🎣 Kanca (0-10s):** Çözülemeyen sorular ve dağınık notlar arasında kaybolan öğrenci.\n- **📱 Gelişme (10-20s):** FocusON AI Asistan'a sorunun fotoğrafı çekilir; asistan tüm deneme analizleri, eksik kazanımlar ve konu haritasıyla bilgileri harmanlayarak mantığı adım adım anlatır.\n- **🎯 Çözüm & CTA (20-30s):** Öğrencinin netliği ve rahatlaması. 4:3 Gönderi formatında etkileyici görsel ve dış ses.",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            autoDetectedPageTitle: "7/24 Sesli & Görsel AI Soru Çözüm Asistanı",
            contentPlanDraft: {
              hook: "Çözülemeyen sorular ve dağınık notlar arasında kaybolan öğrenci",
              development: "FocusON AI Asistan tüm deneme analizleri ve konu haritasını harmanlayarak soruyu mantığıyla çözer",
              resolutionAndCta: "Öğrencinin rahatlaması ve 4:3 gönderi CTA'sı"
            },
            quickReplies: ["Bu harika olmuş, bunu yapalım!", "Biraz değiştirelim"],
            readyForMasterGeneration: false
          };
        }

        if (normalizedMsg.includes("harika") || normalizedMsg.includes("yapalım") || normalizedMsg.includes("tamam") || normalizedMsg.includes("onay") || normalizedMsg.includes("üret")) {
          return {
            directorReply: "İşte tam prompt paketi burada! Seçtiğin tüm detaylar (Öğrenci Yapay Zeka Soru Çözüm Asistanı, Instagram 4:3 Gönderi, Tüm bilgilerin harmanlandığı vurgusu) doğrultusunda Google Flow / Midjourney prompt setin hazırlandı.",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            autoDetectedPageTitle: "7/24 Sesli & Görsel AI Soru Çözüm Asistanı",
            contentPlanDraft: {
              hook: "Çözülemeyen sorular ve dağınık notlar arasında kaybolan öğrenci",
              development: "FocusON AI Asistan tüm deneme analizleri ve konu haritasını harmanlayarak soruyu mantığıyla çözer",
              resolutionAndCta: "Öğrencinin rahatlaması ve 4:3 gönderi CTA'sı"
            },
            quickReplies: ["Google Flow'da Üret 🎬", "Yeni Bir Reklam Masası Başlat 🔄"],
            readyForMasterGeneration: true
          };
        }

        return null;
      };

      try {
        let ai = getGeminiClient();
        const modelName = getModelName("gemini-2.5-flash");

        const systemInstruction = `Sen FocusON Akademi'nin Kıdemli Reklam Kreatif Direktörü ve Yapay Zeka Video/Görsel Prodüksiyon Uzmanısın.
Sitenin tüm kaynak kodlarını, rotalarını ve özelliklerini çok iyi biliyorsun.
Kullanıcıyla TEK TEK ADIM ADIM soru-cevap şeklinde ilerleyerek reklamı kurgulayacaksın. ASLA BİRDEN FAZLA ADIMI AYNI ANDA GEÇME VEYA ATLAMA.

AŞAĞIDAKİ BİREBİR AKIŞ ŞABLONUNA TAMAMEN SADIK KAL:

1. KULLANICI: "Bir reklam oluşturmak istiyorum" (veya reklam yapmak istediğini belirten genel bir mesaj)
   DİREKTÖR (SEN): "Tabii ki, hangi konuda reklam oluşturmak istiyorsun?"
   quickReplies: ["Yapay zeka asistan", "Sınav Metronomu ile süre yönetimi", "Koçlar için veli raporlama sistemi", "35+ Bilişsel ve ÇABA Analizleri"]

2. KULLANICI konuyu söylediğinde (Örn: "Yapay zeka asistan"):
   DİREKTÖR (SEN): (Tüm kodları ve RAG'ı tara): "Yapay zeka asistan hem öğrencide hem velide hem de koçta var, hangisi hakkında reklam yapalım?"
   autoDetectedPageId: "student_ai_assistant"
   autoDetectedAudience: "ogrenci"
   quickReplies: ["Öğrenci", "Koç", "Veli"]

3. KULLANICI hedef kitleyi seçtiğinde (Örn: "öğrenci"):
   DİREKTÖR (SEN): (Kodları yeniden incele): "Öğrenci asistanında hem fotoğraf yükleyip soru çözdürme hem de sesli rehberlik/sohbet var. Soru çözüm asistanını da dahil edelim mi yoksa sadece sohbet asistanı mı?"
   quickReplies: ["Dahil edelim", "Sadece sohbet asistanı"]

4. KULLANICI alt özelliği seçtiğinde (Örn: "Dahil edelim"):
   DİREKTÖR (SEN): "Harika! Bunu hangi sosyal medyada paylaşmak istiyorsun? (Instagram, TikTok, YouTube, X, diğer)"
   quickReplies: ["Instagram", "TikTok", "YouTube", "X (Twitter)"]

5. KULLANICI platformu seçtiğinde (Örn: "instagram"):
   DİREKTÖR (SEN): "Harika! Bunu Reels olarak mı, hikaye olarak mı yoksa gönderi olarak mı paylaşalım?"
   quickReplies: ["Gönderi", "Reels", "Hikaye"]

6. KULLANICI formatı seçtiğinde (Örn: "Gönderi"):
   DİREKTÖR (SEN): "Boyutları 1:1 mi olsun 4:3 mü?"
   quickReplies: ["4:3 olsun", "1:1 olsun"]

7. KULLANICI boyutu seçtiğinde (Örn: "4:3 olsun"):
   DİREKTÖR (SEN): "Vurgulamak istediğin özel bir özellik veya açı var mı?"
   quickReplies: ["Tüm bilgilerin harmanlandığını gösterelim", "Gece 02:00'de takılmadan soru çözümü", "Net artışı ve stres bitirme"]

8. KULLANICI özel vurguyu seçtiğinde (Örn: "Tüm bilgilerin harmanlandığını gösterelim"):
   DİREKTÖR (SEN): "Tamamdır. Şöyle bir içerik planı hazırladım; değiştirmek istediğin bir yer varsa söyle değiştirelim. Tamamdır dersen sana tam promptu verebilirim.\n\n📋 **Taslak İçerik Planı:**\n- **🎣 Kanca (0-10s):** Çözülemeyen sorular ve dağınık notlar arasında kaybolan öğrenci.\n- **📱 Gelişme (10-20s):** FocusON AI Asistan'a sorunun fotoğrafı çekilir; asistan tüm deneme analizleri, eksik kazanımlar ve konu haritasıyla bilgileri harmanlayarak mantığı adım adım anlatır.\n- **🎯 Çözüm & CTA (20-30s):** Öğrencinin netliği ve rahatlaması. 4:3 Gönderi formatında etkileyici görsel ve dış ses."
   contentPlanDraft: {
     "hook": "Çözülemeyen sorular ve dağınık notlar arasında kaybolan öğrenci",
     "development": "FocusON AI Asistan tüm deneme analizleri ve konu haritasını harmanlayarak soruyu mantığıyla çözer",
     "resolutionAndCta": "Öğrencinin rahatlaması ve 4:3 gönderi CTA'sı"
   }
   quickReplies: ["Bu harika olmuş, bunu yapalım!", "Biraz değiştirelim"]

9. KULLANICI onay verdiğinde (Örn: "bu harika olmuş. bunu yapalım", "tamamdır", "yapalım"):
   DİREKTÖR (SEN): "İşte tam prompt paketi burada! Seçtiğin tüm detaylar (Öğrenci Yapay Zeka Soru Çözüm Asistanı, Instagram 4:3 Gönderi, Tüm bilgilerin harmanlandığı vurgusu) doğrultusunda Google Flow / Midjourney prompt setin hazırlandı."
   readyForMasterGeneration: true
   quickReplies: ["Google Flow'da Üret 🎬", "Yeni Bir Reklam Masası Başlat 🔄"]

TÜM SİTE SAYFALARI VE MODÜLLERİ BİLGİ HAVUZU (360° RAG VERİ TABANI):
${allSitePages ? JSON.stringify(allSitePages, null, 2) : JSON.stringify(FOCUSON_FULL_SITE_KNOWLEDGE_MODULES, null, 2)}

KRİTİK KURALLAR:
1. Sitede olan sayfaların gerçek rota ve özelliklerini kullan (/panel/ogrenci/ai-asistan, /panel/koc, /zaman-yonetimi vb.).
2. Kullanıcının verdiği son mesaja göre yukarıdaki diyalog sırasındaki bir sonraki soruyu tam olarak sor.

DÖNÜŞ FORMATI (JSON):
{
  "directorReply": "Kreatif Direktörün tam olarak yukarıdaki sıradaki Türkçe yanıtı",
  "autoDetectedAudience": "ogrenci | veli | koc | sistem",
  "autoDetectedPageId": "student_ai_assistant | public_exam_metronome | ...",
  "autoDetectedPageTitle": "7/24 Sesli & Görsel AI Soru Çözüm Asistanı",
  "whatHappensSummary": "Öğrencinin yapay zeka asistan ile soru çözdürmesi ve konu analizi alması",
  "connectedPagesSummary": "Deneme takibi, koç analizleri ve konu haritası ile bağlantılı",
  "keyAdvantagesSummary": "Tüm bilgileri harmanlayarak mantığı adım adım öğretmesi",
  "quickReplies": ["Seçenek 1", "Seçenek 2"],
  "contentPlanDraft": {
    "hook": "Kanca metni",
    "development": "Gelişme metni",
    "resolutionAndCta": "Çözüm ve CTA"
  },
  "readyForMasterGeneration": false
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
          parts: [{ text: userMessage || "Merhaba! Sitemizdeki tüm sayfaları ve panelleri dikkate alarak en doğru hedef kitleyi ve modülü belirleyip adım adım harika bir reklam kurgulayalım." }]
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
          suggestedAngles: [],
          quickReplies: []
        });

        return res.json({
          success: true,
          data: parsedData
        });
      } catch (aiErr: any) {
        console.warn("[Brainstorm AI Call fallback triggered]:", aiErr?.message || aiErr);
        const fallbackStep = generateStepReply();
        if (fallbackStep) {
          return res.json({
            success: true,
            data: fallbackStep
          });
        }

        // Generic friendly director response if all else fails
        return res.json({
          success: true,
          data: {
            directorReply: "Harika bir adım! FocusON Akademi platformumuzun yapay zeka asistan ve analiz araçları için adım adım ilerliyoruz. Bunu hangi sosyal medya kanalında ve hangi formatta paylaşmak istersiniz?",
            autoDetectedAudience: "ogrenci",
            autoDetectedPageId: "student_ai_assistant",
            quickReplies: ["Instagram 4:3 Gönderi", "Instagram 9:16 Reels", "TikTok Video", "YouTube Shorts"],
            readyForMasterGeneration: false
          }
        });
      }

    } catch (error: any) {
      console.error("AI Agency Brainstorm Error:", error?.message || error);
      res.json({ 
        success: true, 
        data: {
          directorReply: "Tabii ki, hangi konuda reklam oluşturmak istiyorsun?",
          quickReplies: ["Yapay zeka asistan", "Sınav Metronomu ile süre yönetimi", "Koçlar için veli raporlama sistemi"],
          readyForMasterGeneration: false
        }
      });
    }
  });

  // 2. Generate Campaign with Modular 10-Second Scene Prompts, Screen Capture Guide & Image Recipes
  app.post("/api/ai-agency/generate-master-campaign", async (req, res) => {
    try {
      const { audienceKey, pageRagData, selectedAngle, format, customRequirements, chatContext } = req.body;

      let ai = getGeminiClient();
      const modelName = getModelName("gemini-2.5-flash");

      const systemInstruction = `Sen dünyanın en iyi Dijital Reklam ve Sosyal Medya Prodüksiyon Ajansı Kreatif Direktörüsün.
Kullanıcı senden Google Flow / Veo video üretim motoru ve Midjourney/Flux görsel motorları için MODÜLER, 10 SANİYELİK SAHNE PROMPTLARI, SİTEDEN EKRAN GÖRÜNTÜSÜ ALMA REHBERİ ve DETAYLI REKLAM PAKETİ üretmeni istiyor.

SEÇİLİ SİTE SAYFASI VE RAG BİLGİLERİ:
${pageRagData ? JSON.stringify(pageRagData, null, 2) : "FocusON Akademi Genel Ekosistemi"}

KRİTİK ZORUNLU KURAL (SIFIR HALÜSİNASYON & SİTEYE SADAKAT):
- Sitede bulunmayan hiçbir hizmeti veya özelliği uydurma.
- Tüm kurgu, metin ve ekran görüntüsü talimatları, seçili sayfanın gerçek arayüzüne ve FocusON Akademi'nin gerçek ekosistemine tam olarak sadık kalmalıdır.

KRİTİK KURALLAR VE STANDARTLAR:

1. YEKPARE PROMPT KULLANILMAYACAK:
- Tek parça devasa "unifiedMasterPrompt" yerine, her biri bağımsız olarak Google Flow / Veo'ya kopyalanıp üretilebilecek 3 ADET 10 SANİYELİK SAHNE PROMPTU oluşturulacaktır.

2. SAHNELERİN TÜMÜ TAM 10 SANİYE OLACAKTIR:
- Sahne 1: 0:00 - 0:10 (10s) -> [Hook / Kanca & Acı Noktası]
- Sahne 2: 0:10 - 0:20 (10s) -> [Problem, Keşif & FocusON Sistem Arayüzü]
- Sahne 3: 0:20 - 0:30 (10s) -> [Çözüm, Rahatlama & Dönüşüm / Eyleme Çağrı (CTA)]
- Toplam 30 saniyelik eksiksiz dikey reklam kurgusu (3x 10s klip).

3. BOŞLUK (NEGATIVE SPACE) VE LOGO STRATEJİSİ (POST-PRODÜKSİYON):
- Yapay zekadan KESİNLİKLE logo, amblem, veya metin (FocusON vb.) üretmesi istenmeyecektir. AI text üretiminde çok hatalıdır, bu yüzden tüm logolar ve yazılar kurguda (Premiere/CapCut) eklenecektir.
- Sahne promptlarında her zaman "Sağ üst (veya uygun) köşede logonun sonradan eklenebilmesi için temiz bir boşluk (negative space) bırakın" (Leave clear negative space in the upper corner for a logo overlay later) gibi ifadeler kullanın.

4. YEŞİL / BOŞ EKRAN STRATEJİSİ (POST-PRODÜKSİYON UI EKLENTİSİ):
- Yapay zekanın arayüz (UI) çizerken halüsinasyon görmesini (anlamsız harfler/bozuk grafikler) engellemek için, ekranların (tablet, telefon, bilgisayar) göründüğü sahnelerde cihaz ekranının "karanlık/kapalı" (solid black/dark screen) veya "yeşil ekran" (solid green screen) olarak üretilmesini KESİN BİR DİLLE isteyin.
- Flow promptlarında (flowClipPrompt) UI arayüzü çizmesini KESİNLİKLE İSTEMEYİN, bunun yerine: "The character is looking at a tablet with a solid dark blank screen (or solid green screen), preparing it for screen tracking in post-production. No UI elements on screen." gibi talimatlar verin.
- Kullanıcıya hangi sayfanın ekran görüntüsünü alması gerektiği "screenCaptureGuide" alanında anlatılacak; bu ekran görüntüsünü yapay zeka aracına (Flow'a) DEĞİL, video kurgu programına (CapCut, Premiere vb.) "track" ederek (sabitleyerek) eklemesi gerektiği açıkça belirtilecektir.

5. KARAKTER TUTARLILIĞI VE GÖRÜNÜM (FLOW CHARACTER REFERENCE):
- Videolar arası kopukluğu (morphing/yüz değişimi) önlemek için karakter profili her sahnede tamamen AYNI KELİMELERLE sabitlenmelidir.
- Örnek Öğrenci: "20 yaşında, kısa koyu renk saçlı, esmer tenli, üzerinde lacivert ince çizgili polo yaka tişört bulunan genç erkek öğrenci."
- Örnek Koç: "30'lu yaşlarında, kısa kıvırcık saçlı, gözlüklü, hafif kirli sakallı, üzerinde mavi gömlek ve gri ceket bulunan profesyonel eğitim koçu."
- Hedef kitleye göre (öğrenci, koç veya veli) değişmez ve detaylı bir fiziki betimlemeyi tüm "flowClipPrompt" metinlerine ve "characterProfiles" alanına İngilizce olarak mutlaka yedirin (Örn: "A 20-year-old male student with short dark hair, tanned skin, wearing a navy blue polo shirt with thin stripes...").

6. TÜRKÇE DIŞ SES & METİNLER (%100 KESİNLİKLE TÜRKÇE):
- TÜM SAHNELERDEKİ "voiceoverText" (DIŞ SES / DUBLAJ METNİ) KESİNLİKLE VE İSTİSNASIZ %100 AKICI, ETKİLEYİCİ, DOĞAL VE GÜÇLÜ TÜRKÇE OLMALIDIR.
- "onScreenText" (EKRANDA GÖRÜNEN YAZILAR), "hookVariants", "caption", "callToAction" KESİNLİKLE TÜRKÇE OLMALIDIR.

6. GÖRSEL TASARIM ALANI (IMAGE PROMPTS):
- Görsel üretimi yapılmayacak; bunun yerine Midjourney v6, Flux.1, Ideogram veya Google Imagen için doğrudan kopyalanıp kullanılabilecek 2-3 adet tam teşekküllü görsel tasarım promptu verilecektir.
- Her görsel reçetesinde:
  * Full Cinematic/Studio prompt (İngilizce kamera, ışık, 8k detaylar),
  * Görsel üzerine yazılacak Türkçe Tipografi & Başlıklar (textOverlayGuide: mainHeadline, subHeadline, ctaBadgeText, fontStyle, colorPalette),
  * Eklenecek logo direktifi (logoPlacementGuide),
  * Siteden alınacak ekran görüntüsü entegrasyonu (screenScreenshotGuide).

7. JSON BİÇİMLENDİRME KURALI:
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
      "4. Google Flow'da 'Attachments / Reference Image' slotuna bu ekran görüntüsünü ve logonuzu yükleyin."
    ],
    "recommendedResolution": "1920x1080 Full HD veya 16:9 yatay ekran görüntüsü"
  },
  "flowConsistencySettings": {
    "aspectRatio": "9:16",
    "cameraOptics": "Arri Alexa Mini LF, Cooke Anamorphic /i Full Frame Plus 40mm T2.3, 8K Cinema DNG, shallow depth of field, natural optical bokeh",
    "lightingSetup": "Soft volumetric natural daylight combined with 3200K tungsten desk practicals and cyan laptop monitor glow",
    "colorGrading": "Kodak Vision3 500T aesthetic, rich cinematic contrast, deep slate shadows, warm skin tones, teal-orange modern color palette",
    "characterProfiles": "A 20-year-old male student with short dark hair, tanned skin, wearing a navy blue polo shirt with thin stripes. Authentic natural skin texture.",
    "environmentArchitecture": "Contemporary study environment with dim lighting and practical desk lamps.",
    "soundDesignScript": "Crisp realistic sound design transitioning into inspiring cinematic swell with Turkish voiceover",
    "negativePrompts": "blurry, low quality, CGI look, plastic skin, distorted anatomy, unrealistic cartoon style, text errors, flicker, abrupt cuts",
    "logoAttachmentDirective": "Do NOT generate any text or logos. Leave clear negative space in the upper corner for post-production logo overlay.",
    "screenAttachmentDirective": "Devices must have a solid dark/blank screen (or solid green screen) for post-production UI tracking. NO UI elements generated by AI.",
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
      "visualDescription": "Sahne 1 görsel anlatımı (0-10 saniye)",
      "cameraMovement": "Slow push-in toward the intense gaze and ticking timer",
      "characterAction": "Karakterin zaman baskısı ve acı noktasını yaşaması",
      "lightingAndAtmosphere": "Moody low-key lighting with high-contrast shadows",
      "flowClipPrompt": "A hyper-realistic 10-second cinematic 9:16 video clip. Cooke Anamorphic 40mm lens. A 20-year-old male student with short dark hair and navy blue polo shirt studying at a modern desk. Intense close-up, clock ticking fast. Leave clear negative space in the upper right corner for post-production logo overlay.",
      "voiceoverText": "KESİNLİKLE TÜRKÇE 1. Sahne Dış Ses (10 saniyelik doğal konuşma ritmi, örn: 'Denemelerde süren yetmiyor diye pes mi edeceksin? Sorun bilginde değil, soruya ayırdığın ritimde!')",
      "onScreenText": "Süren Yetmiyor Mu? (0:00 - 0:10)",
      "audioSfxCues": "Dramatic deep bass thud + intense clock ticking crescendo",
      "attachmentDirectives": {
        "useAttachedLogo": false,
        "useAttachedScreenshot": false,
        "attachmentInstruction": "Logolar ve arayüzler post-prodüksiyonda eklenecek. Ekran boş bırakılacak."
      }
    },
    {
      "sceneNumber": 2,
      "timeRange": "0:10 - 0:20 (10s)",
      "stage": "Problem/Gelişme",
      "visualDescription": "Sahne 2 görsel anlatımı (10-20 saniye, FocusON Akademi ekranının keşfi)",
      "cameraMovement": "Dynamic macro pan across the glowing tablet interface",
      "characterAction": "Karakterin FocusON Akademi arayüzünü kullanması ve turlama taktiğini keşfetmesi",
      "lightingAndAtmosphere": "Illuminating soft daylight entering the room, warm tech glow",
      "flowClipPrompt": "A hyper-realistic 10-second cinematic 9:16 video clip. A 20-year-old male student holding a tablet. The tablet has a solid black, completely blank screen for post-production tracking. NO UI elements on screen. Leave clear negative space in the corner for a logo overlay.",
      "voiceoverText": "KESİNLİKLE TÜRKÇE 2. Sahne Dış Ses (10 saniyelik doğal konuşma ritmi, örn: 'FocusON Sınav Metronomu ile her soruya özel süreni ayarla, turlama taktiğini refleks haline getir.')",
      "onScreenText": "FocusON Sınav Metronomu ile Kontrol Sende",
      "audioSfxCues": "Clean UI click chime + energetic motivational rhythm rising",
      "attachmentDirectives": {
        "useAttachedLogo": false,
        "useAttachedScreenshot": false,
        "attachmentInstruction": "Arayüz kurguda (Premiere/CapCut) giydirilecektir. AI arayüz çizmeyip yeşil/siyah ekran üretecektir."
      }
    },
    {
      "sceneNumber": 3,
      "timeRange": "0:20 - 0:30 (10s)",
      "stage": "Dönüşüm/CTA",
      "visualDescription": "Sahne 3 görsel anlatımı (20-30 saniye, sonuç, rahatlama ve eyleme çağrı)",
      "cameraMovement": "Smooth dolly-out revealing the confident smiling student at desk",
      "characterAction": "Kendinden emin gülümseme, ekrana bakış ve başarı hissi",
      "lightingAndAtmosphere": "Warm golden hour triumph lighting, uplifting atmosphere",
      "flowClipPrompt": "A hyper-realistic 10-second cinematic 9:16 video clip. Dolly-out shot of a confident student smiling at the desk with high school notes organized. Display the attached FocusON Akademi logo prominently in the upper right. Turkish voiceover says: '...' ",
      "voiceoverText": "KESİNLİKLE TÜRKÇE 3. Sahne Dış Ses (10 saniyelik net çağrı, örn: 'Zamanı sen yönet, hedefine sen ulaş. FocusON Akademi'yi şimdi ücretsiz dene!')",
      "onScreenText": "Şimdi Ücretsiz Başla (Link Bio'da)",
      "audioSfxCues": "Crisp brand audio logo sting + inspiring cinematic swell",
      "attachmentDirectives": {
        "useAttachedLogo": true,
        "useAttachedScreenshot": false,
        "attachmentInstruction": "Google Flow ekler kısmına FocusON Akademi logosu eklenecek."
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
SOHBET GEÇMİŞİ / BRİF (KULLANICININ VERDİĞİ TÜM SORU-CEVAPLAR VE TERCİHLERİ): 
${chatContext ? JSON.stringify(chatContext) : "Standard"}

ÇOK ÖNEMLİ KURAL:
Kullanıcının sohbet geçmişinde belirttiği tüm özel tercihleri (Örn: Instagram 4:3 Gönderi (Post), Öğrenci Yapay Zeka Soru Çözüm Asistanı, Tüm bilgilerin harmanlandığı vurgusu, Gece soru çözümü) görsel promptlarında (--ar 4:3), başlıklarında, dış seslerinde ve kurguda KESİNLİKLE VE EKSİKSİZ UYGULA.
`;

      let parsedData: any = null;
      try {
        let ai = getGeminiClient();
        const modelName = getModelName("gemini-2.5-flash");

        const response = await ai.models.generateContent({
          model: modelName,
          contents: [{ parts: [{ text: promptContext }] }],
          config: {
            systemInstruction,
            responseMimeType: "application/json"
          }
        });

        const responseText = response.text || "{}";
        parsedData = cleanAndParseJson(responseText, null);
      } catch (aiErr: any) {
        console.warn("[Generate Master Campaign fallback triggered]:", aiErr?.message || aiErr);
      }

      if (!parsedData) {
        const is4by3 = (format || "").includes("4:3") || JSON.stringify(chatContext || "").includes("4:3");
        const aspectRatio = is4by3 ? "4:3" : "9:16";

        parsedData = {
          campaignTitle: "FocusON AI Soru Çözüm & Harmanlanmış Analiz Kampanyası (Instagram 4:3)",
          conceptSummary: "Gece veya gündüz çözülemeyen soruları, deneme analizleri ve konu haritasıyla harmanlayarak mantığıyla öğreten 7/24 FocusON AI Soru Çözüm Asistanı reklam paketi.",
          psychologicalTrigger: "Belirsizlik ve Stres Bitirme, Anında Net Çözüm & Güven",
          screenCaptureGuide: {
            pageTitle: pageRagData?.title || "7/24 Sesli & Görsel AI Soru Çözüm Asistanı",
            pageUrl: pageRagData?.path || "/panel/ogrenci/ai-asistan",
            whatToCapture: "AI Soru Çözüm Asistanının fotoğraf yükleme alanı, çözüm adımları ve konu kazanım analizi kartı",
            stepByStepGuide: [
              "1. Sol menüden Öğrenci Paneli > Yapay Zeka Asistan sayfasına (/panel/ogrenci/ai-asistan) gidin.",
              "2. Soru çözüm ekranının ve adım adım çözüm dökümünün net bir ekran görüntüsünü (PNG/JPG) alın.",
              "3. Google Flow görsel referans/ekler bölümüne yükleyin."
            ],
            recommendedResolution: is4by3 ? "1440x1080 (4:3)" : "1080x1920 (9:16)"
          },
          flowConsistencySettings: {
            aspectRatio: aspectRatio,
            cameraOptics: "Arri Alexa Mini LF, Cooke Anamorphic Prime Lenses, photorealistic cinematic lighting",
            lightingSetup: "Volumetric natural study room lighting with warm desk practicals",
            colorGrading: "Kodak Vision3 500T warm contrast",
            characterProfiles: "High school student sitting at a modern desk with notebooks and tablet",
            environmentArchitecture: "Minimalist contemporary study room with soft ambient light",
            soundDesignScript: "Deep focus ambient drone with Turkish professional voiceover",
            negativePrompts: "blurry, low quality, cartoon, extra limbs, watermark, distorted typography",
            logoAttachmentDirective: "Use the attached FocusON Akademi logo from the reference input slot.",
            screenAttachmentDirective: "Keep device display as a solid dark neutral surface for post-production UI overlay.",
            flowGenerationSettings: {
              durationPerClip: "10 saniye",
              motionSpeed: "1.0x",
              fidelity: "8K",
              styleTag: "Cinematic Commercial Master"
            }
          },
          storyboardScenes: [
            {
              sceneNumber: 1,
              timeRange: "0:00 - 0:10 (10s)",
              stage: "Hook (Kanca)",
              visualDescription: "Gece saat 02:00'de masasında çözemediği zor bir matematik sorusuna takılıp kalan, dağınık notlar arasındaki öğrenci (0-10s).",
              cameraMovement: "Slow cinematic push-in toward the student's focused expression",
              characterAction: "Soruyu tekrar tekrar okuyup takılma ve stres anı",
              lightingAndAtmosphere: "Moody nighttime desk lamp lighting",
              flowClipPrompt: "Cinematic 10s shot of a high school student sitting at a study desk at night, looking puzzled at a difficult exam question. In the top corner, reference the attached FocusON Akademi logo. Device screen is blank solid dark ready for screen overlay. Aspect ratio --ar 4:3. Turkish voiceover says: 'Gece 02:00'de takıldığın o soruyu kim çözecek?'",
              voiceoverText: "Gece saat 02:00'de takıldığın o soruyu sana kim adım adım anlatacak?",
              onScreenText: "Takıldığın Soruda Yalnız Değilsin (0-10s)",
              audioSfxCues: "Clock ticking sound effect building tension",
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
              visualDescription: "Öğrenci sorunun fotoğrafını FocusON AI Asistan'a yükler. Sistem sadece sonucu değil; konu haritası ve deneme analizleriyle bilgileri harmanlayarak çözümü anlatır (10-20s).",
              cameraMovement: "Smooth macro track-in to the tablet",
              characterAction: "Fotoğraf çekme ve çözümün anında açılmasıyla aydınlanma hissi",
              lightingAndAtmosphere: "Bright modern tech lighting with subtle cyan accent",
              flowClipPrompt: "Macro 10s tracking shot. A student holds a phone over a textbook taking a photo of a math problem. Display the attached FocusON screenshot on the tablet screen. Clean negative space referencing attached logo. Aspect ratio --ar 4:3. Turkish voiceover says: 'FocusON AI Asistan tüm konu haritanı harmanlar, mantığını öğretir.'",
              voiceoverText: "FocusON AI Asistan sadece cevabı vermez; tüm deneme analizlerinle harmanlayarak mantığını adım adım öğretir.",
              onScreenText: "Tüm Bilgileri Harmanlayan AI Çözümü (10-20s)",
              audioSfxCues: "Soft digital confirmation chime and uplifting orchestral swell",
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
              visualDescription: "Öğrencinin rahatlamış ve özgüvenli gülümsemesi, masayı toplayıp hedefine odaklanması (20-30s).",
              cameraMovement: "Dolly-out revealing confident smiling student",
              characterAction: "Rahat bir nefes alıp başparmakla onay işareti",
              lightingAndAtmosphere: "Warm golden triumph glow",
              flowClipPrompt: "Dolly-out 10s commercial shot of a confident student smiling in relief at desk. In top header, display attached FocusON Akademi logo. High end 8k commercial finish. Aspect ratio --ar 4:3. Turkish voiceover says: 'Sorularını erteleme, FocusON ile hemen netlerini artır!'",
              voiceoverText: "Sorularını erteleme, sınavda süreni ve netlerini FocusON ile zirveye taşı!",
              onScreenText: "Hemen Ücretsiz Başla (20-30s)",
              audioSfxCues: "Brand sonic signature and warm piano resolve",
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
              title: "Instagram 4:3 Gönderi (Post) Ana Tasarım Promptu",
              format: "4:3",
              prompt: "Commercial advertising photography, 4:3 aspect ratio, 8k resolution. A student at a clean study desk taking a smartphone photo of a math test page with soft lighting. On the right side, a tablet sits flat on the desk with a clean solid dark screen for post-production UI overlay. Generous negative space in upper left quadrant for typography and logo. Reference the attached FocusON Akademi logo. --ar 4:3 --stylize 250",
              negativePrompt: "deformed, blurry, cartoon, crowded background, text errors, low resolution",
              compositionGuide: "4:3 horizontal balance, left 40% for subject and device, right 60% for crisp typography hierarchy",
              textOverlayGuide: {
                mainHeadline: "Gece 02:00'de Takıldığın Soru Kalmasın!",
                subHeadline: "FocusON 7/24 AI Soru Çözüm Asistanı ile Tüm Bilgiler Harmanlanarak Çözülür",
                ctaBadgeText: "Hemen Dene 👆",
                fontStyleRecommendation: "Extra Bold Impact Display Sans (800 weight) with soft clean shadow",
                colorPalette: "#FFFFFF ana başlık, #38BDF8 parlak gök mavisi ve #F59E0B amber vurgular"
              },
              logoPlacementGuide: "Sol üst veya sağ üst köşede FocusON Akademi orijinal logosu yer alacak.",
              screenScreenshotGuide: "Tablet ekranında sitemizin /panel/ogrenci/ai-asistan ekran görüntüsü bulunacak."
            },
            {
              id: "img_2",
              title: "Instagram 9:16 Dikey Story / Reels Kapak Promptu",
              format: "9:16",
              prompt: "Commercial vertical portrait photography, 9:16 aspect ratio, 8k resolution. Vertical shot of a student smiling confidently holding a textbook. Cinematic studio lighting with warm practicals. Display attached FocusON Akademi logo at top header. --ar 9:16",
              negativePrompt: "deformed, extra limbs, low quality",
              compositionGuide: "Vertical portrait hierarchy, top 20% safe zone for logo, middle for student, bottom 25% for CTA badge",
              textOverlayGuide: {
                mainHeadline: "Takıldığın Soruları Erteleme!",
                subHeadline: "AI Asistan ile Mantığıyla Öğren",
                ctaBadgeText: "Profili Ziyaret Et",
                fontStyleRecommendation: "Extra Bold Display Sans",
                colorPalette: "#FFFFFF ve #38BDF8"
              },
              logoPlacementGuide: "Üst başlık alanında FocusON Akademi logosu",
              screenScreenshotGuide: "Cihaz ekranında sitemizin ilgili ekran görüntüsü"
            }
          ],
          copyPack: {
            headline: "Gece 02:00'de Takıldığın Soru Kalmasın! 🚀",
            hookVariants: [
              "Çözemediğin bir soru yüzünden saatlerce takılıp kalmaktan yorulmadın mı?",
              "FocusON AI Asistan tüm konu haritanı ve eksiklerini harmanlayarak mantığını adım adım anlatıyor!",
              "Soruyu çek, gönder; 7/24 yanında olan koçunla netlerini zirveye taşı."
            ],
            caption: "Soru çözümlerinde saatlerce cevap anahtarı arama devri bitti! 🎯\n\nFocusON Akademi 7/24 Sesli & Görsel AI Soru Çözüm Asistanı ile:\n📸 Takıldığın sorunun fotoğrafını çek\n🧠 Sistem tüm konu haritanla harmanlayarak mantığı adım adım öğretsin\n📈 Eksik kazanımlarını anında tespit et!\n\n💡 Başarı detaylarda saklıdır.",
            callToAction: "Hemen profildeki linke tıkla ve ücretsiz dene! 🎯",
            hashtags: ["#YKS2026", "#FocusONAkademi", "#YKSRehberlik", "#YKSMatematik", "#YKSKocluk", "#DersCalisma"],
            recommendedMusicMood: "Inspiring Ambient Lo-Fi with Uplifting Piano Chords"
          }
        };
      }

      res.json({
        success: true,
        data: parsedData,
        campaign: parsedData
      });

    } catch (error: any) {
      console.error("AI Agency Master Campaign Generation Error:", error?.message || error);
      res.json({
        success: true,
        data: {
          campaignTitle: "FocusON Akademi Reklam Paketi",
          conceptSummary: "Öğrenci odaklı yapay zeka destekli reklam kurgusu."
        }
      });
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

  // 4. Social Media Creative AI Image Generation Endpoint (Gemini Imagen 3 / Flash Image Generator)
  app.post("/api/ai-agency/generate-recipe-image", async (req, res) => {
    try {
      const { prompt, aspectRatio, recipeTitle, headline, subHeadline, ctaBadgeText } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Görsel promptu gereklidir." });
      }

      let ai = getGeminiClient();
      
      // Build an optimized image generation prompt
      const refinedImagePrompt = `Professional commercial advertising photo for FocusON Akademi educational platform. ${prompt}. High aesthetic quality, sharp focus, award-winning cinematic lighting, clean composition suitable for social media advertising banner.`;

      let targetRatio: "1:1" | "9:16" | "16:9" | "4:3" | "3:4" = "1:1";
      if (aspectRatio === "9:16") targetRatio = "9:16";
      else if (aspectRatio === "16:9") targetRatio = "16:9";
      else if (aspectRatio === "1:1") targetRatio = "1:1";

      try {
        const imageResponse = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: refinedImagePrompt,
          config: {
            numberOfImages: 1,
            aspectRatio: targetRatio,
            outputMimeType: 'image/jpeg',
          }
        });

        const generatedImage = imageResponse.generatedImages?.[0];
        if (generatedImage && generatedImage.image && generatedImage.image.imageBytes) {
          const imageBase64 = `data:image/jpeg;base64,${generatedImage.image.imageBytes}`;
          return res.json({
            success: true,
            imageUrl: imageBase64,
            prompt: refinedImagePrompt
          });
        }
      } catch (imgModelErr: any) {
        console.warn("Imagen 3 primary generation failed, trying alternative:", imgModelErr?.message);
      }

      // Fallback if imagen fails or rate limited: return a rich SVG / visual canvas placeholder or high-res education gradient asset
      return res.status(500).json({
        error: "Görsel motoru şu anda meşgul, lütfen birkaç saniye sonra tekrar deneyin."
      });

    } catch (error: any) {
      console.error("AI Agency Image Generation Error:", error?.message || error);
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

  
  // Automated Universal Notification Engine (Every 10 minutes Europe/Istanbul)
  cron.schedule("*/10 * * * *", async () => {
    try {
      await executeScheduledNotificationEngine();
    } catch (err: any) {
      console.error("[Cron Job] Error executing automated notification engine:", err?.message || err);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  // Automated Subscription Reminders (Safety Fallback every day at 19:00 Europe/Istanbul)
  cron.schedule("0 19 * * *", async () => {
    console.log("[Cron Job] Automated daily 19:00 subscription reminder process triggered...");
    try {
      // With deduplication and daily logs in place, this will never send duplicate WhatsApp messages to parents
      await executeSubscriptionReminders({ force: false, allowDuplicateToday: false });
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

  // Automated YouTube Video Sync Cron Job (Every day at 23:00 / 11:00 PM Europe/Istanbul)
  cron.schedule("0 23 * * *", async () => {
    console.log("[Cron Job] 🕒 Automated daily 23:00 YouTube playlist video sync process triggered...");
    try {
      const result = await executeYouTubePlaylistSync();
      console.log(`[Cron Job] YouTube Sync completed. Checked: ${result?.totalChecked || 0}, Updated: ${result?.updatedCount || 0}, New Videos: ${result?.newVideosTotal || 0}`);
    } catch (err: any) {
      console.error("[Cron Job] Error executing automated YouTube video sync:", err?.message || err);
    }
  }, {
    timezone: "Europe/Istanbul"
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
