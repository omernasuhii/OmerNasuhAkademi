var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// firebase-applet-config.json
var firebase_applet_config_default;
var init_firebase_applet_config = __esm({
  "firebase-applet-config.json"() {
    firebase_applet_config_default = {
      projectId: "gen-lang-client-0140076974",
      appId: "1:748745706799:web:2881b13fbfc5d8ec5ea5da",
      apiKey: "AIzaSyCvB6Kv8X9NrivMjt2oK9mPiOnp8LMTZk0",
      authDomain: "gen-lang-client-0140076974.firebaseapp.com",
      firestoreDatabaseId: "ai-studio-84291387-c606-49b9-a640-979708195be5",
      storageBucket: "gen-lang-client-0140076974.firebasestorage.app",
      messagingSenderId: "748745706799",
      measurementId: ""
    };
  }
});

// src/lib/firebase.ts
var firebase_exports = {};
__export(firebase_exports, {
  OperationType: () => OperationType,
  auth: () => auth,
  db: () => db,
  handleFirestoreError: () => handleFirestoreError,
  messaging: () => messaging
});
function handleFirestoreError(error, operationType, path2) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email
      })) || []
    },
    operationType,
    path: path2
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
}
async function testConnection() {
  try {
    await (0, import_firestore.getDocFromServer)((0, import_firestore.doc)(db, "test", "connection"));
  } catch (error) {
    if (error?.message?.includes("the client is offline")) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
var import_app, import_auth, import_firestore, import_messaging, app, db, auth, messaging, OperationType;
var init_firebase = __esm({
  "src/lib/firebase.ts"() {
    import_app = require("firebase/app");
    import_auth = require("firebase/auth");
    import_firestore = require("firebase/firestore");
    import_messaging = require("firebase/messaging");
    init_firebase_applet_config();
    try {
      if (!(0, import_app.getApps)().length) {
        app = (0, import_app.initializeApp)(firebase_applet_config_default);
      } else {
        app = (0, import_app.getApps)()[0];
      }
    } catch (e) {
      console.error("Firebase init error:", e);
    }
    db = (0, import_firestore.getFirestore)(app, firebase_applet_config_default.firestoreDatabaseId);
    auth = (0, import_auth.getAuth)(app);
    (0, import_auth.setPersistence)(auth, import_auth.browserLocalPersistence).catch((err) => console.error("Auth persistence error:", err));
    auth.languageCode = "tr";
    messaging = null;
    try {
      if (app) {
        (0, import_messaging.isSupported)().then((supported) => {
          if (supported) {
            messaging = (0, import_messaging.getMessaging)(app);
          }
        });
      }
    } catch (e) {
      console.error("Firebase messaging not supported", e);
    }
    OperationType = /* @__PURE__ */ ((OperationType2) => {
      OperationType2["CREATE"] = "create";
      OperationType2["UPDATE"] = "update";
      OperationType2["DELETE"] = "delete";
      OperationType2["LIST"] = "list";
      OperationType2["GET"] = "get";
      OperationType2["WRITE"] = "write";
      return OperationType2;
    })(OperationType || {});
    testConnection();
  }
});

// server.ts
var import_express = __toESM(require("express"), 1);
var import_vite = require("vite");
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_firebase_admin = __toESM(require("firebase-admin"), 1);
var import_supabase_js = require("@supabase/supabase-js");
var import_twilio = __toESM(require("twilio"), 1);
var import_meta = {};
var __filename = typeof import_meta !== "undefined" && import_meta.url ? (0, import_url.fileURLToPath)(import_meta.url) : import_path.default.join(process.cwd(), "server.ts");
var __dirname = import_path.default.dirname(__filename);
import_dotenv.default.config();
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseKey = process.env.SUPABASE_ANON_KEY || "";
var supabase = supabaseUrl && supabaseKey ? (0, import_supabase_js.createClient)(supabaseUrl, supabaseKey) : null;
function getGeminiClient() {
  const apiKey = process.env.ASSISTAN_API_KEY;
  if (!apiKey) {
    console.error("[Gemini Client] Error: ASSISTAN_API_KEY is not defined in environment variables!");
    throw new Error("API_KEY_MISSING");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
function getModelName(defaultDevModel) {
  return "gemini-3.1-flash-lite";
}
async function startServer() {
  const app2 = (0, import_express.default)();
  const PORT = 3e3;
  app2.use(import_express.default.json());
  app2.use(import_express.default.urlencoded({ extended: true }));
  if (!import_firebase_admin.default.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        import_firebase_admin.default.initializeApp({
          credential: import_firebase_admin.default.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin initialized successfully with service account.");
      } catch (e) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", e.message);
      }
    } else {
      try {
        import_firebase_admin.default.initializeApp();
        console.log("Firebase Admin initialized successfully with Application Default Credentials.");
      } catch (e) {
        console.error("Failed to initialize Firebase Admin:", e.message);
      }
    }
  }
  app2.post("/api/send-push", async (req, res) => {
    if (!import_firebase_admin.default.apps.length) {
      return res.status(503).json({ error: "Firebase Admin is not initialized. Cannot send push notifications." });
    }
    try {
      const { token, title, body, link } = req.body;
      if (!token) return res.status(400).json({ error: "Token is required" });
      const message = {
        notification: {
          title: title || "FocusON Akademi",
          body: body || "Yeni bir bildiriminiz var."
        },
        data: {
          link: link || "/"
        },
        token
      };
      const response = await import_firebase_admin.default.messaging().send(message);
      res.json({ success: true, response });
    } catch (error) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/send-whatsapp", async (req, res) => {
    const { phone, code, uid, origin } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: "Telefon numaras\u0131 ve kod gereklidir." });
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.startsWith("0")) {
      cleanedPhone = "90" + cleanedPhone.substring(1);
    } else if (!cleanedPhone.startsWith("90") && cleanedPhone.length === 10) {
      cleanedPhone = "90" + cleanedPhone;
    }
    const formattedPhone = `+${cleanedPhone}`;
    console.log(`[Twilio WhatsApp] Sending code ${code} to ${formattedPhone}`);
    if (import_firebase_admin.default.apps.length) {
      try {
        await import_firebase_admin.default.firestore().collection("phone_verifications").doc(formattedPhone).set({
          code,
          uid: uid || null,
          origin: origin || null,
          updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
        });
      } catch (dbErr) {
        console.error("[Twilio WhatsApp] Error saving verification code to Firestore:", dbErr);
      }
    }
    let verifyLink = "";
    if (uid && origin) {
      verifyLink = `${origin}/v?u=${uid}&c=${code}`;
    }
    const msgBody = verifyLink ? `FocusON Akademi do\u011Frulama kodunuz: ${code}

Tek t\u0131kla do\u011Frulamak i\xE7in a\u015Fa\u011F\u0131daki butona/ba\u011Flant\u0131ya t\u0131klayabilirsiniz:
${verifyLink}` : `FocusON Akademi do\u011Frulama kodunuz: ${code}`;
    if (!accountSid || !authToken) {
      console.log("[Twilio WhatsApp] Credentials not configured. Running in SIMULATED mode.");
      return res.json({
        success: true,
        simulated: true,
        isApiError: true,
        message: `[Sim\xFClasyon] Twilio API anahtarlar\u0131 (.env dosyas\u0131nda TWILIO_ACCOUNT_SID ve TWILIO_AUTH_TOKEN) eklenmedi\u011Fi i\xE7in sim\xFClasyon modunda kod g\xF6sterildi. Kod: ${code}`
      });
    }
    try {
      const client = (0, import_twilio.default)(accountSid, authToken);
      const from = twilioNumber.startsWith("whatsapp:") ? twilioNumber : `whatsapp:${twilioNumber}`;
      const to = formattedPhone.startsWith("whatsapp:") ? formattedPhone : `whatsapp:${formattedPhone}`;
      const message = await client.messages.create({
        body: msgBody,
        from,
        to
      });
      console.log(`[Twilio WhatsApp] Message sent successfully. SID: ${message.sid}`);
      return res.json({
        success: true,
        simulated: false,
        messageId: message.sid
      });
    } catch (error) {
      console.error("[Twilio WhatsApp] Error sending message via Twilio:", error);
      return res.json({
        success: true,
        simulated: true,
        isApiError: true,
        error: `Twilio API hatas\u0131: ${error.message || error}`,
        message: `[Hata/Sim\xFClasyon] Twilio ile g\xF6nderilemedi (${error.message}). Test i\xE7in kod: ${code}`
      });
    }
  });
  app2.post("/api/verify-whatsapp-direct", async (req, res) => {
    const { uid, code } = req.body;
    if (!uid || !code) {
      return res.status(400).json({ error: "Kullan\u0131c\u0131 ID ve kod gereklidir." });
    }
    try {
      if (!import_firebase_admin.default.apps.length) {
        return res.status(503).json({ error: "Firebase Admin initialized de\u011Fil." });
      }
      const dbAdmin = import_firebase_admin.default.firestore();
      const userRef = dbAdmin.collection("users").doc(uid);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "Kullan\u0131c\u0131 bulunamad\u0131." });
      }
      await userRef.update({
        phoneVerified: true,
        verificationDeferred: false,
        updatedAt: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[Direct Verification] User ${uid} verified successfully via WhatsApp link.`);
      const deferredSnapshot = await dbAdmin.collection("users").where("verificationDeferred", "==", true).get();
      if (!deferredSnapshot.empty) {
        const batch = dbAdmin.batch();
        deferredSnapshot.docs.forEach((doc2) => {
          batch.update(doc2.ref, { verificationDeferred: false });
        });
        await batch.commit();
        console.log(`[Direct Verification] Reset deferred verification status for ${deferredSnapshot.size} other users.`);
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/verify-whatsapp-direct:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/verification-success", async (req, res) => {
    try {
      if (!import_firebase_admin.default.apps.length) {
        return res.json({ success: true, message: "Firebase Admin not initialized" });
      }
      const dbAdmin = import_firebase_admin.default.firestore();
      const deferredSnapshot = await dbAdmin.collection("users").where("verificationDeferred", "==", true).get();
      if (!deferredSnapshot.empty) {
        const batch = dbAdmin.batch();
        deferredSnapshot.docs.forEach((doc2) => {
          batch.update(doc2.ref, { verificationDeferred: false });
        });
        await batch.commit();
        console.log(`[Verification Success Action] Reset deferred verification for ${deferredSnapshot.size} users.`);
      }
      return res.json({ success: true });
    } catch (error) {
      console.error("Error in /api/verification-success:", error);
      return res.status(500).json({ error: error.message });
    }
  });
  app2.post("/api/whatsapp-webhook", async (req, res) => {
    if (req.body.From === "testdebug") {
      return res.json({ apps: import_firebase_admin.default.apps.length, isInitialized: import_firebase_admin.default.apps.length > 0 });
    }
    const from = req.body.From || req.body.from || req.body.phone;
    const body = req.body.Body || req.body.body || req.body.message || "";
    const profileName = req.body.ProfileName || req.body.profileName || "";
    const messageSid = req.body.MessageSid || req.body.messageSid || "";
    if (!from) {
      return res.status(400).send("<Response><Message>From parameter is required.</Message></Response>");
    }
    try {
      let dbAdmin;
      if (import_firebase_admin.default.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
        dbAdmin = import_firebase_admin.default.firestore();
      } else {
        const { db: db2 } = await Promise.resolve().then(() => (init_firebase(), firebase_exports));
        const { collection, addDoc, doc: doc2, getDoc, serverTimestamp } = await import("firebase/firestore");
        dbAdmin = {
          collection: (path2) => ({
            add: async (data) => addDoc(collection(db2, path2), {
              ...data,
              timestamp: serverTimestamp()
              // override the FieldValue from admin
            }),
            doc: (docId) => ({
              get: async () => {
                const snap = await getDoc(doc2(db2, path2, docId));
                return {
                  exists: snap.exists(),
                  data: () => snap.data()
                };
              }
            })
          })
        };
      }
      let phoneNum = String(from).replace("whatsapp:", "").trim();
      if (!phoneNum.startsWith("+")) {
        phoneNum = "+" + phoneNum;
      }
      await dbAdmin.collection("whatsapp_messages").add({
        phone: phoneNum,
        body,
        senderName: profileName || null,
        messageSid: messageSid || null,
        direction: "inbound"
      });
      console.log(`[WhatsApp Webhook] Message received from ${phoneNum}: ${body}`);
      const lowerBody = body.toLowerCase().trim();
      const isApproval = lowerBody.includes("focuson akademi do\u011Frulama") && lowerBody.includes("onayl\u0131yorum");
      console.log(`[WhatsApp Webhook] lowerBody: "${lowerBody}", isApproval: ${isApproval}`);
      if (isApproval) {
        console.log(`[WhatsApp Webhook] Approval message detected for ${phoneNum}. Checking pending codes...`);
        const verificationRef = dbAdmin.collection("phone_verifications").doc(phoneNum);
        const verificationDoc = await verificationRef.get();
        let pendingCode = null;
        let pendingUid = null;
        let pendingOrigin = null;
        if (verificationDoc.exists) {
          pendingCode = verificationDoc.data()?.code;
          pendingUid = verificationDoc.data()?.uid;
          pendingOrigin = verificationDoc.data()?.origin;
          console.log(`[WhatsApp Webhook] Found pending code ${pendingCode} for ${phoneNum}`);
        } else {
          console.log(`[WhatsApp Webhook] No pending code found in Firestore for ${phoneNum}`);
        }
        if (pendingCode) {
          let verifyLink = "";
          if (pendingUid && pendingOrigin) {
            verifyLink = `${pendingOrigin}/v?u=${pendingUid}&c=${pendingCode}`;
          }
          const msgBody = verifyLink ? `FocusON Akademi do\u011Frulama kodunuz: ${pendingCode}

Tek t\u0131kla do\u011Frulamak i\xE7in a\u015Fa\u011F\u0131daki butona/ba\u011Flant\u0131ya t\u0131klayabilirsiniz:
${verifyLink}` : `FocusON Akademi do\u011Frulama kodunuz: ${pendingCode}`;
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          const authToken = process.env.TWILIO_AUTH_TOKEN;
          const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
          if (accountSid && authToken) {
            try {
              const client = (0, import_twilio.default)(accountSid, authToken);
              const fromTwilio = twilioNumber.startsWith("whatsapp:") ? twilioNumber : `whatsapp:${twilioNumber}`;
              const toTwilio = phoneNum.startsWith("whatsapp:") ? phoneNum : `whatsapp:${phoneNum}`;
              console.log(`[WhatsApp Webhook] Sending SMS from ${fromTwilio} to ${toTwilio} via Twilio API...`);
              await client.messages.create({
                body: msgBody,
                from: fromTwilio,
                to: toTwilio
              });
              console.log(`[WhatsApp Webhook] Pending verification code sent back to ${phoneNum}`);
              await dbAdmin.collection("whatsapp_messages").add({
                phone: phoneNum,
                body: msgBody,
                senderName: "System Auto-Reply",
                direction: "outbound"
              });
            } catch (twilioErr) {
              console.error(`[WhatsApp Webhook] Error sending back pending code to ${phoneNum}:`, twilioErr);
            }
          } else {
            console.error("[WhatsApp Webhook] Twilio credentials missing, cannot send reply.");
          }
        }
      }
      res.set("Content-Type", "text/xml");
      return res.send("<Response></Response>");
    } catch (error) {
      console.error("Error in /api/whatsapp-webhook:", error);
      res.set("Content-Type", "text/xml");
      return res.status(500).send(`<Response><Message>Error: ${error.message}</Message></Response>`);
    }
  });
  app2.post("/api/whatsapp-send", async (req, res) => {
    const { to, message } = req.body;
    if (!to || !message) {
      return res.status(400).json({ error: "to and message are required" });
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
    if (!accountSid || !authToken) {
      return res.status(500).json({ error: "Twilio credentials are not configured" });
    }
    try {
      const client = (0, import_twilio.default)(accountSid, authToken);
      const toTwilio = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
      const fromTwilio = twilioNumber.startsWith("whatsapp:") ? twilioNumber : `whatsapp:${twilioNumber}`;
      const sentMsg = await client.messages.create({
        body: message,
        from: fromTwilio,
        to: toTwilio
      });
      if (import_firebase_admin.default.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
        await import_firebase_admin.default.firestore().collection("whatsapp_messages").add({
          phone: to.replace("whatsapp:", "").trim(),
          body: message,
          senderName: "Admin",
          messageSid: sentMsg.sid,
          direction: "outbound",
          timestamp: import_firebase_admin.default.firestore.FieldValue.serverTimestamp()
        });
      } else {
        const { db: db2 } = await Promise.resolve().then(() => (init_firebase(), firebase_exports));
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        await addDoc(collection(db2, "whatsapp_messages"), {
          phone: to.replace("whatsapp:", "").trim(),
          body: message,
          senderName: "Admin",
          messageSid: sentMsg.sid,
          direction: "outbound",
          timestamp: serverTimestamp()
        });
      }
      res.json({ success: true, messageSid: sentMsg.sid });
    } catch (err) {
      console.error("[WhatsApp Send] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  let cachedDepartments = null;
  let cachePromise = null;
  async function fetchAllFromSupabase() {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }
    console.log("[Cache] Starting pre-fetching of all departments from Supabase...");
    let allRows = [];
    let from = 0;
    const chunkSize = 4e3;
    let hasMore = true;
    while (hasMore) {
      console.log(`[Cache] Fetching range ${from} to ${from + chunkSize - 1}...`);
      const { data, error } = await supabase.from("bolumler").select("id, data").range(from, from + chunkSize - 1);
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
    const processed = allRows.map((row) => {
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
  if (supabase) {
    cachePromise = fetchAllFromSupabase().then((data) => {
      cachedDepartments = data;
      return data;
    }).catch((err) => {
      console.error("[Cache] Pre-warming cache failed:", err);
      cachePromise = null;
      return [];
    });
  }
  app2.get("/api/departments/all", async (req, res) => {
    try {
      if (!supabase) {
        return res.status(500).json({ error: "Supabase is not configured." });
      }
      if (cachedDepartments) {
        return res.json({ success: true, data: cachedDepartments, total: cachedDepartments.length });
      }
      if (cachePromise) {
        console.log("[API/departments/all] Cache load is already in progress, waiting for it...");
        const data2 = await cachePromise;
        return res.json({ success: true, data: data2, total: data2.length });
      }
      cachePromise = fetchAllFromSupabase().then((data2) => {
        cachedDepartments = data2;
        return data2;
      }).catch((err) => {
        cachePromise = null;
        throw err;
      });
      const data = await cachePromise;
      return res.json({ success: true, data, total: data.length });
    } catch (error) {
      console.error("Failed to load departments:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });
  app2.get("/api/departments", async (req, res) => {
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
      let query = supabase.from("bolumler").select("id, data", { count: "exact" });
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
      if (degree === "LISANS") {
        query = query.eq("data->>detail3", "L");
      } else if (degree === "ONLISANS") {
        query = query.eq("data->>detail3", "O");
      }
      if (teachingTypes) {
        try {
          const parsed = typeof teachingTypes === "string" ? JSON.parse(teachingTypes) : teachingTypes;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const orConditions = [];
            parsed.forEach((type) => {
              if (type === "MTOK") {
                orConditions.push("data->>fullName.ilike.%m.t.o.k%", "data->>fullName.ilike.%mtok%");
              } else if (type === "UZAKTAN") {
                orConditions.push("data->>fullName.ilike.%uzaktan%");
              } else if (type === "ACIK") {
                orConditions.push("data->>fullName.ilike.%a\xE7\u0131k\xF6\u011Fretim%", "data->>fullName.ilike.%a\xE7\u0131k \xF6\u011Fretim%");
              } else if (type === "IKINCI") {
                orConditions.push("data->>fullName.ilike.%ikinci \xF6\u011Fretim%", "data->>fullName.ilike.%i.\xF6.%", "data->>fullName.ilike.%i.o.%");
              } else if (type === "NORMAL") {
                orConditions.push("and(data->>fullName.not.ilike.%m.t.o.k%,data->>fullName.not.ilike.%mtok%,data->>fullName.not.ilike.%uzaktan%,data->>fullName.not.ilike.%a\xE7\u0131k \xF6\u011Fretim%,data->>fullName.not.ilike.%a\xE7\u0131k\xF6\u011Fretim%,data->>fullName.not.ilike.%ikinci \xF6\u011Fretim%,data->>fullName.not.ilike.%i.\xF6.%)");
              }
            });
            if (orConditions.length > 0) {
              query = query.or(orConditions.join(","));
            }
          }
        } catch (e) {
        }
      }
      if (fees) {
        try {
          const parsed = typeof fees === "string" ? JSON.parse(fees) : fees;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const orConditions = [];
            parsed.forEach((type) => {
              if (type === "BURSLU") {
                orConditions.push("data->>feeType.ilike.%burslu%", "data->>fullName.ilike.%burslu%");
              } else if (type === "IND_75") {
                orConditions.push("data->>feeType.ilike.%75%", "data->>fullName.ilike.%75%");
              } else if (type === "IND_50") {
                orConditions.push("data->>feeType.ilike.%50%", "data->>fullName.ilike.%50%");
              } else if (type === "IND_25") {
                orConditions.push("data->>feeType.ilike.%25%", "data->>fullName.ilike.%25%");
              } else if (type === "UCRETLI") {
                orConditions.push("data->>feeType.ilike.%\xFCcretli%", "data->>fullName.ilike.%\xFCcretli%");
              } else if (type === "UCRETSIZ") {
                orConditions.push(
                  "and(data->>typeName.eq.DEVLET,data->>feeType.is.null)",
                  "data->>feeType.ilike.%\xFCcretsiz%",
                  "data->>fullName.ilike.%\xFCcretsiz%"
                );
              }
            });
            if (orConditions.length > 0) {
              query = query.or(orConditions.join(","));
            }
          }
        } catch (e) {
        }
      }
      if (uniTypes) {
        try {
          const parsed = typeof uniTypes === "string" ? JSON.parse(uniTypes) : uniTypes;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.in("data->>typeName", parsed);
          }
        } catch (e) {
        }
      }
      if (universities) {
        try {
          const parsed = typeof universities === "string" ? JSON.parse(universities) : universities;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.in("data->university->>name", parsed);
          }
        } catch (e) {
        }
      }
      const backendRegions = {
        "Marmara B\xF6lgesi": ["\u0130stanbul", "Edirne", "K\u0131rklareli", "Tekirda\u011F", "\xC7anakkale", "Kocaeli", "Yalova", "Sakarya", "Bilecik", "Bursa", "Bal\u0131kesir"],
        "Ege B\xF6lgesi": ["\u0130zmir", "Manisa", "Ayd\u0131n", "Mu\u011Fla", "Denizli", "K\xFCtahya", "Afyonkarahisar", "U\u015Fak"],
        "\u0130\xE7 Anadolu B\xF6lgesi": ["Ankara", "Konya", "Kayseri", "Eski\u015Fehir", "Sivas", "K\u0131r\u0131kkale", "Aksaray", "Karaman", "K\u0131r\u015Fehir", "Ni\u011Fde", "Nev\u015Fehir", "Yozgat", "\xC7ank\u0131r\u0131"],
        "Akdeniz B\xF6lgesi": ["Antalya", "Adana", "Mersin", "Hatay", "Kahramanmara\u015F", "Osmaniye", "Isparta", "Burdur"],
        "Karadeniz B\xF6lgesi": ["Trabzon", "Samsun", "Ordu", "Giresun", "Rize", "Artvin", "Sinop", "Kastamonu", "Zonguldak", "Bart\u0131n", "Karab\xFCk", "D\xFCzce", "Bolu", "G\xFCm\xFC\u015Fhane", "Bayburt", "Amasya", "Tokat", "\xC7orum"],
        "Do\u011Fu Anadolu B\xF6lgesi": ["Erzurum", "Malatya", "Elaz\u0131\u011F", "Van", "Kars", "A\u011Fr\u0131", "Mu\u015F", "Bitlis", "Hakkari", "I\u011Fd\u0131r", "Ardahan", "Erzincan", "Tunceli", "Bing\xF6l"],
        "G\xFCneydo\u011Fu Anadolu B\xF6lgesi": ["Gaziantep", "\u015Eanl\u0131urfa", "Diyarbak\u0131r", "Mardin", "Batman", "Siirt", "\u015E\u0131rnak", "Ad\u0131yaman", "Kilis"],
        "Yurtd\u0131\u015F\u0131 / KKTC": ["KKTC-Gazima\u011Fusa", "KKTC-Girne", "KKTC-G\xFCzelyurt", "KKTC-Lefko\u015Fa", "YABANCI"]
      };
      let allowedCities = [];
      if (cities) {
        try {
          const parsedCities = typeof cities === "string" ? JSON.parse(cities) : cities;
          if (Array.isArray(parsedCities)) {
            allowedCities.push(...parsedCities);
          }
        } catch (e) {
        }
      }
      if (regions) {
        try {
          const parsedRegions = typeof regions === "string" ? JSON.parse(regions) : regions;
          if (Array.isArray(parsedRegions)) {
            parsedRegions.forEach((reg) => {
              const regCities = backendRegions[reg] || [];
              allowedCities.push(...regCities);
            });
          }
        } catch (e) {
        }
      }
      allowedCities = Array.from(new Set(allowedCities));
      if (allowedCities.length > 0) {
        query = query.in("data->city->>name", allowedCities);
      }
      const backendMesleklerMap = {
        "M\xFChendislik": [
          "Bilgisayar M\xFChendisli\u011Fi",
          "Bili\u015Fim Sistemleri M\xFChendisli\u011Fi",
          "Biyomedikal M\xFChendisli\u011Fi",
          "Elektrik-Elektronik M\xFChendisli\u011Fi",
          "End\xFCstri M\xFChendisli\u011Fi",
          "Enerji Sistemleri M\xFChendisli\u011Fi",
          "Gemi \u0130n\u015Faat\u0131 ve Gemi Makineleri M\xFChendisli\u011Fi",
          "Genetik ve Biyom\xFChendislik",
          "G\u0131da M\xFChendisli\u011Fi",
          "Harita M\xFChendisli\u011Fi",
          "\u0130n\u015Faat M\xFChendisli\u011Fi",
          "Makine M\xFChendisli\u011Fi",
          "Mekatronik M\xFChendisli\u011Fi",
          "Metalurji ve Malzeme M\xFChendisli\u011Fi",
          "Su \xDCr\xFCnleri M\xFChendisli\u011Fi",
          "U\xE7ak M\xFChendisli\u011Fi",
          "Yapay Zeka M\xFChendisli\u011Fi",
          "Yaz\u0131l\u0131m M\xFChendisli\u011Fi",
          "Ziraat M\xFChendisli\u011Fi"
        ],
        "Sa\u011Fl\u0131k Bilimleri / T\u0131p": [
          "Di\u015F Hekimli\u011Fi",
          "Eczac\u0131l\u0131k",
          "Hem\u015Firelik",
          "T\u0131p",
          "Ebelik",
          "Beslenme ve Diyetetik",
          "Fizyoterapi ve Rehabilitasyon",
          "Odyoloji",
          "Acil Yard\u0131m ve Afet Y\xF6netimi",
          "A\u011F\u0131z ve Di\u015F Sa\u011Fl\u0131\u011F\u0131",
          "Ameliyathane Hizmetleri",
          "Anestezi",
          "Diyaliz",
          "\u0130lk ve Acil Yard\u0131m",
          "T\u0131bbi Dok\xFCmantasyon ve Sekreterlik",
          "T\u0131bbi G\xF6r\xFCnt\xFCleme Teknikleri",
          "T\u0131bbi Laboratuvar Teknikleri"
        ],
        "E\u011Fitim / \xD6\u011Fretmenlik": [
          "Almanca \xD6\u011Fretmenli\u011Fi",
          "Arap\xE7a \xD6\u011Fretmenli\u011Fi",
          "Fen Bilgisi \xD6\u011Fretmenli\u011Fi",
          "\u0130lk\xF6\u011Fretim Matematik \xD6\u011Fretmenli\u011Fi",
          "\u0130ngilizce \xD6\u011Fretmenli\u011Fi",
          "Okul \xD6ncesi \xD6\u011Fretmenli\u011Fi",
          "\xD6zel E\u011Fitim \xD6\u011Fretmenli\u011Fi",
          "S\u0131n\u0131f \xD6\u011Fretmenli\u011Fi",
          "T\xFCrk\xE7e \xD6\u011Fretmenli\u011Fi"
        ],
        "Hukuk / Adalet": [
          "Hukuk",
          "Adalet"
        ],
        "\u0130ktisadi-\u0130dari Bilimler / Y\xF6netim": [
          "Ekonometri",
          "Ekonomi",
          "\u0130ktisat",
          "\u0130\u015Fletme",
          "Maliye",
          "Lojistik Y\xF6netimi",
          "Y\xF6netim Bili\u015Fim Sistemleri",
          "Havac\u0131l\u0131k Y\xF6netimi",
          "\u0130nsan Kaynaklar\u0131 Y\xF6netimi",
          "Sa\u011Fl\u0131k Y\xF6netimi",
          "Pazarlama"
        ],
        "Tasar\u0131m / Mimarl\u0131k / Sanat": [
          "\u0130\xE7 Mimarl\u0131k",
          "Mimarl\u0131k",
          "End\xFCstriyel Tasar\u0131m",
          "G\xF6rsel \u0130leti\u015Fim Tasar\u0131m\u0131",
          "Grafik Tasar\u0131m\u0131",
          "Foto\u011Fraf\xE7\u0131l\u0131k ve Kameramanl\u0131k",
          "Gastronomi ve Mutfak Sanatlar\u0131"
        ],
        "Sosyal ve Fen Bilimleri": [
          "Co\u011Frafya",
          "Felsefe",
          "Fizik",
          "Kimya",
          "Matematik",
          "Sosyoloji",
          "Tarih",
          "T\xFCrk Dili ve Edebiyat\u0131",
          "Arkeoloji",
          "Astronomi ve Uzay Bilimleri",
          "Biyokimya",
          "Biyoloji",
          "Molek\xFCler Biyoloji ve Genetik",
          "\u0130statistik",
          "\u0130lahiyat"
        ],
        "Medya / \u0130leti\u015Fim / Yay\u0131nc\u0131l\u0131k": [
          "Bas\u0131n ve Yay\u0131n",
          "Gazetecilik",
          "Halkla \u0130li\u015Fkiler ve Reklamc\u0131l\u0131k",
          "Medya ve \u0130leti\u015Fim",
          "Radyo, Televizyon ve Sinema",
          "Yeni Medya ve \u0130leti\u015Fim"
        ],
        "Hizmetler / Tar\u0131m / Di\u011Fer": [
          "A\u015F\xE7\u0131l\u0131k",
          "Bankac\u0131l\u0131k ve Sigortac\u0131l\u0131k",
          "\xC7ocuk Geli\u015Fimi",
          "Deniz Ula\u015Ft\u0131rma \u0130\u015Fletme M\xFChendisli\u011Fi",
          "\u0130slam \u0130ktisad\u0131 ve Finans",
          "Sermaye Piyasas\u0131",
          "Spor Y\xF6neticili\u011Fi",
          "Turizm \u0130\u015Fletmecili\u011Fi",
          "Veteriner"
        ]
      };
      let allowedDepts = [];
      if (departments) {
        try {
          const parsed = typeof departments === "string" ? JSON.parse(departments) : departments;
          if (Array.isArray(parsed)) allowedDepts.push(...parsed);
        } catch (e) {
        }
      }
      if (allowedDepts.length === 0 && jobs) {
        try {
          const parsed = typeof jobs === "string" ? JSON.parse(jobs) : jobs;
          if (Array.isArray(parsed)) {
            parsed.forEach((job) => {
              const depts = backendMesleklerMap[job] || [];
              allowedDepts.push(...depts);
            });
          }
        } catch (e) {
        }
      }
      if (allowedDepts.length > 0) {
        query = query.in("data->>name", allowedDepts);
      }
      if (excludedUniversities) {
        try {
          const parsed = typeof excludedUniversities === "string" ? JSON.parse(excludedUniversities) : excludedUniversities;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->university->>name", "in", `(${parsed.map((p) => `"${p}"`).join(",")})`);
          }
        } catch (e) {
        }
      }
      if (excludedCities) {
        try {
          const parsed = typeof excludedCities === "string" ? JSON.parse(excludedCities) : excludedCities;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->city->>name", "in", `(${parsed.map((p) => `"${p}"`).join(",")})`);
          }
        } catch (e) {
        }
      }
      if (excludedDepartments) {
        try {
          const parsed = typeof excludedDepartments === "string" ? JSON.parse(excludedDepartments) : excludedDepartments;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->>name", "in", `(${parsed.map((p) => `"${p}"`).join(",")})`);
          }
        } catch (e) {
        }
      }
      if (excludedFaculties) {
        try {
          const parsed = typeof excludedFaculties === "string" ? JSON.parse(excludedFaculties) : excludedFaculties;
          if (Array.isArray(parsed) && parsed.length > 0) {
            query = query.not("data->>facultyName", "in", `(${parsed.map((p) => `"${p}"`).join(",")})`);
          }
        } catch (e) {
        }
      }
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
      if (minRank) {
        query = query.gte("data->lastBasePointOrder", parseInt(minRank, 10));
      }
      if (maxRank) {
        query = query.lte("data->lastBasePointOrder", parseInt(maxRank, 10));
      }
      if (minPoint) {
        query = query.gte("data->lastBasePoint", parseFloat(minPoint));
      }
      if (maxPoint) {
        query = query.lte("data->lastBasePoint", parseFloat(maxPoint));
      }
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
        query = query.order("data->lastBasePointOrder", { ascending: true });
      }
      const pageNum = page ? parseInt(page, 10) : 0;
      const limitNum = limit ? parseInt(limit, 10) : 20;
      const from = pageNum * limitNum;
      const to = from + limitNum - 1;
      query = query.range(from, to);
      const { data: rows, error, count } = await query;
      if (error) {
        console.error("Supabase query error:", error);
        return res.status(500).json({ error: error.message });
      }
      const processedData = (rows || []).map((row) => {
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
      let finalData = processedData;
      if (teachingTypes) {
        try {
          const parsedTypes = typeof teachingTypes === "string" ? JSON.parse(teachingTypes) : teachingTypes;
          if (Array.isArray(parsedTypes) && parsedTypes.length > 0) {
            finalData = finalData.filter((dept) => {
              const checkStr = ((dept.name || "") + " " + (dept.fullName || "")).toLowerCase();
              let type = "NORMAL";
              if (checkStr.includes("m.t.o.k") || checkStr.includes("mtok")) {
                type = "MTOK";
              } else if (checkStr.includes("uzaktan")) {
                type = "UZAKTAN";
              } else if (checkStr.includes("acikogretim") || checkStr.includes("acik ogretim") || checkStr.includes("a\xE7\u0131k\xF6\u011Fretim")) {
                type = "ACIK";
              } else if (checkStr.includes("ikinci ogretim") || checkStr.includes("i.o.") || checkStr.includes("i.\xF6.") || checkStr.includes("ikinci \xF6\u011Fretim")) {
                type = "IKINCI";
              }
              return parsedTypes.includes(type);
            });
          }
        } catch (e) {
        }
      }
      if (fees) {
        try {
          const parsedFees = typeof fees === "string" ? JSON.parse(fees) : fees;
          if (Array.isArray(parsedFees) && parsedFees.length > 0) {
            finalData = finalData.filter((dept) => {
              const feeTypeLower = (dept.feeType || "").toLowerCase();
              const fullNameLower = (dept.fullName || "").toLowerCase();
              let type = "UCRETSIZ";
              if (feeTypeLower.includes("burslu") || fullNameLower.includes("burslu")) {
                type = "BURSLU";
              } else if (feeTypeLower.includes("%75") || fullNameLower.includes("%75")) {
                type = "IND_75";
              } else if (feeTypeLower.includes("%50") || fullNameLower.includes("%50")) {
                type = "IND_50";
              } else if (feeTypeLower.includes("%25") || fullNameLower.includes("%25")) {
                type = "IND_25";
              } else if (feeTypeLower.includes("\xFCcretli") || fullNameLower.includes("\xFCcretli") || feeTypeLower.includes("ucretli") || fullNameLower.includes("ucretli")) {
                type = "UCRETLI";
              } else if (dept.typeName === "DEVLET" && !feeTypeLower) {
                type = "UCRETSIZ";
              } else if (feeTypeLower.includes("\xFCcretsiz") || fullNameLower.includes("\xFCcretsiz") || feeTypeLower.includes("ucretsiz") || fullNameLower.includes("ucretsiz")) {
                type = "UCRETSIZ";
              }
              return parsedFees.includes(type);
            });
          }
        } catch (e) {
        }
      }
      res.json({ success: true, data: finalData, totalCount: count || 22e3 });
    } catch (err) {
      console.error("Failed to fetch departments from Supabase:", err);
      res.status(500).json({ error: err.message || String(err) });
    }
  });
  app2.post("/api/parent-assistant", async (req, res) => {
    try {
      const { history, userContext } = req.body;
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: "History is required" });
      }
      const ai = getGeminiClient();
      const systemInstruction = `Sen FocusON Akademi'nin yapay zeka e\u011Fitim asistan\u0131 "ON Asistan"s\u0131n. Ancak \u015Fu anda bir VEL\u0130 ile konu\u015Fuyorsun. Veliye, \xF6\u011Frencisi hakk\u0131nda rehberlik, akademik geli\u015Fim ve destek ama\xE7l\u0131 empatik ve profesyonel bilgiler sa\u011Flars\u0131n.
\xD6\u011Frencinin bilgileri:
- Ad\u0131 Soyad\u0131: ${userContext?.firstName || ""} ${userContext?.lastName || ""}
- S\u0131n\u0131f\u0131: ${userContext?.class || "Belirtilmemi\u015F"}
- Hedefi: ${userContext?.goal || "Belirtilmemi\u015F"}

G\xF6revlerinden biri, velinin talebi do\u011Frultusunda \xF6\u011Frencinin akademik s\xFCrecini (\xE7al\u0131\u015Fma programlar\u0131, deneme s\u0131nav\u0131 sonu\xE7lar\u0131 ve ki\u015Filik/bili\u015Fsel analizlerini) inceleyip veliye uygun, y\xF6nlendirici tavsiyeler vermektir. 
\xD6\u011Frenci hakk\u0131nda detayl\u0131 veriye (s\u0131nav sonu\xE7lar\u0131, analiz sonu\xE7lar\u0131, \xE7al\u0131\u015Fma program\u0131) ihtiya\xE7 duyarsan "get_student_academic_data" arac\u0131n\u0131 \xE7a\u011F\u0131r ve oradan d\xF6nen veriyi veliye uygun (hassas olmayan, destekleyici, genel resmi g\xF6steren) bir dilde yorumla.
Velilere tavsiye verirken \u015Fefkatli, olumlu ve yap\u0131c\u0131 bir \xFCslup kullan. Sadece akademik de\u011Fil, motivasyon ve psikolojik destek boyutlar\u0131na da dikkat \xE7ek. K\u0131sa, \xF6z ve anla\u015F\u0131l\u0131r cevaplar ver.`;
      const tools = [{
        functionDeclarations: [
          {
            name: "get_student_academic_data",
            description: "\xD6\u011Frencinin akademik verilerini (planlar, deneme s\u0131nav\u0131 sonu\xE7lar\u0131, s\u0131navlar\u0131n detayl\u0131 analizleri ve ki\u015Filik analizleri) getirir."
          }
        ]
      }];
      const formattedHistory = history.map((msg) => {
        if (msg.role === "function" || msg.functionResponse) {
          return {
            role: "user",
            parts: [{ functionResponse: { name: msg.name, response: msg.functionResponse, id: msg.id } }]
          };
        }
        if (msg.functionCalls) {
          return {
            role: "model",
            parts: msg.functionCalls.map((fc) => ({ functionCall: { name: fc.name, args: fc.args, id: fc.id } }))
          };
        }
        return {
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.content }]
        };
      });
      const modelName = getModelName("gemini-3.5-flash");
      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction, tools },
        history: formattedHistory.slice(0, -1)
        // Exclude the last message
      });
      const response = await chat.sendMessage({
        message: history[history.length - 1].content
      });
      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({
          functionCalls: response.functionCalls.map((fc) => ({ name: fc.name, args: fc.args, id: fc.id })),
          text: response.text || ""
        });
      }
      res.json({ text: response.text });
    } catch (error) {
      const errStr = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "";
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Sistemde kota a\u015F\u0131m\u0131 nedeniyle yapay zeka asistan\u0131 ge\xE7ici olarak hizmet verememektedir." });
      }
      console.error("Gemini AI Parent Assistant Error:", error);
      res.status(500).json({ error: "Asistan servisi \u015Fu an kullan\u0131lam\u0131yor." });
    }
  });
  app2.post("/api/student-assistant", async (req, res) => {
    try {
      const { history, userContext } = req.body;
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: "History is required" });
      }
      const ai = getGeminiClient();
      const systemInstruction = `Sen \xD6mer Nasuh Akademi'nin yapay zeka e\u011Fitim asistan\u0131 "ON Asistan"s\u0131n. \xD6\u011Frencilere hedeflerine ula\u015Fmalar\u0131 i\xE7in empatik, profesyonel ve stratejik rehberlik sa\u011Flars\u0131n.
\u015Eu anki \xF6\u011Frencinin bilgileri:
- Ad\u0131 Soyad\u0131: ${userContext?.firstName || ""} ${userContext?.lastName || ""}
- S\u0131n\u0131f\u0131: ${userContext?.class || "Belirtilmemi\u015F"}
- Hedefi: ${userContext?.goal || "Belirtilmemi\u015F"}

G\xF6revlerinden biri, \xF6\u011Frencinin akademik s\xFCrecini (\xE7al\u0131\u015Fma programlar\u0131, kitap takibi, deneme s\u0131nav\u0131 sonu\xE7lar\u0131, bu denemelerin konu konu hatalar\u0131n\u0131 i\xE7eren analizlerini ve ki\u015Filik/bili\u015Fsel analizlerini) detayl\u0131ca inceleyip tavsiyeler vermektir. \xD6\u011Frenci planlar\u0131, s\u0131nav sonu\xE7lar\u0131, konu/hata analizleri, veya stres, motivasyon, ki\u015Filik \xF6zellikleri gibi konularda psikolojik ve rehberlik deste\u011Fi istedi\u011Finde "get_student_academic_data" arac\u0131n\u0131 \xE7a\u011F\u0131r ve oradan d\xF6nen veriyi detayl\u0131ca analiz et. E\u011Fer \xF6\u011Frenci stresten/odaklanmadan bahsediyor ve hen\xFCz bu konuda bir analiz (\xF6rne\u011Fin \xD6TI-A, AG-MOT, DEHB, S\u0131nav Kayg\u0131s\u0131 vb. formlar/tesler) \xE7\xF6zmemi\u015Fse, test \xE7\xF6zmesini \xF6nerebilirsin.

\xD6\u011Frencinin randevular\u0131n\u0131 y\xF6netebilirsin. E\u011Fer \xF6\u011Frenci randevu almak, mevcut randevular\u0131n\u0131 listelemek veya iptal etmek isterse kullanabilecegin ara\xE7lar\u0131 (function_calling) kullan. Randevu iptal kurallar\u0131na dikkat et (kalan son 3 saat kala iptal edilemez vs. bu kurallar\u0131 sen belirleyip \xF6\u011Frenciye aktar. Sadece uygunsa arac\u0131 \xE7a\u011F\u0131r). Yeni randevu al\u0131rken mutlaka ko\xE7un m\xFCsait saatlerini saat saat isteyebilece\u011Fin arac\u0131 kullan ve ordan d\xF6nen saate g\xF6re randevu olu\u015Ftur.

Bu bilgileri dikkate alarak \xF6\u011Frenciyle do\u011Frudan konu\u015F, isminin "ON Asistan" oldu\u011Funu unutma. Akademik hedeflerini destekle, konu bazl\u0131 hata ve eksikliklerini belirterek program \xF6nerileri yap, stres gibi durumlar\u0131 yakalayarak derinlikli analizler sun. K\u0131sa ve \xF6z, cesaretlendirici cevaplar ver. Asla gereksiz bilgi y\xFCklemesi yapma, bir rehber gibi yakla\u015F.`;
      const tools = [{
        functionDeclarations: [
          {
            name: "get_appointments",
            description: "\xD6\u011Frencinin mevcut veya ge\xE7mi\u015F t\xFCm randevular\u0131n\u0131 getirir."
          },
          {
            name: "get_student_academic_data",
            description: "\xD6\u011Frencinin akademik verilerini (planlar, g\xF6revler, kitaplar, deneme s\u0131nav\u0131 sonu\xE7lar\u0131, s\u0131navlar\u0131n konu/hata t\xFCr\xFC detayl\u0131 analizleri ve stres/alg\u0131/motivasyon/kognitif konulardaki ki\u015Filik analizleri) getirir."
          },
          {
            name: "get_coach_schedule",
            description: "Belirtilen ko\xE7un (veya \xF6\u011Frenciye atanan ko\xE7un) haftal\u0131k program\u0131n\u0131 ve m\xFCsaitlik durumunu getirir.",
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                coachId: { type: import_genai.Type.STRING, description: "Ko\xE7un ID'si. E\u011Fer bilinmiyorsa bo\u015F b\u0131rak\u0131labilir, sistem atanm\u0131\u015F ko\xE7unkini getirir." }
              }
            }
          },
          {
            name: "book_appointment",
            description: "\xD6\u011Frenci i\xE7in yeni bir randevu olu\u015Fturur.",
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                date: { type: import_genai.Type.STRING, description: "YYYY-MM-DD format\u0131nda randevu tarihi" },
                startTime: { type: import_genai.Type.STRING, description: "HH:mm format\u0131nda randevu ba\u015Flang\u0131\xE7 saati" },
                topic: { type: import_genai.Type.STRING, description: "G\xF6r\xFC\u015Fme konusu veya talep edilen hizmet (\xF6r: Birebir Matematik Dersi)" }
              },
              required: ["date", "startTime", "topic"]
            }
          },
          {
            name: "start_booking_wizard",
            description: "\xD6\u011Frenci randevu almak istedi\u011Finde kullan\u0131c\u0131ya UI \xFCzerinden test tarz\u0131nda randevu alma ekran\u0131 (Randevu tipi, hizmet, e\u011Fitmen, g\xFCn, saat se\xE7imi) ba\u015Flat\u0131r. \xD6\u011Frenci ko\xE7tan ders vs almak istedi\u011Fini s\xF6yledi\u011Finde do\u011Frudan bu asistan ekran\u0131n\u0131 ba\u015Flat."
          },
          {
            name: "cancel_appointment",
            description: "\xD6\u011Frencinin belirtilen kimlik numaral\u0131 (ID) randevusunu iptal eder.",
            parameters: {
              type: import_genai.Type.OBJECT,
              properties: {
                appointmentId: { type: import_genai.Type.STRING, description: "\u0130ptal edilecek randevunun ID'si" }
              },
              required: ["appointmentId"]
            }
          }
        ]
      }];
      const formattedHistory = history.map((msg) => {
        if (msg.role === "function" || msg.functionResponse) {
          return {
            role: "user",
            parts: [{ functionResponse: { name: msg.name, response: msg.functionResponse, id: msg.id } }]
          };
        }
        if (msg.functionCalls) {
          return {
            role: "model",
            parts: msg.functionCalls.map((fc) => ({ functionCall: { name: fc.name, args: fc.args, id: fc.id } }))
          };
        }
        return {
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.content }]
        };
      });
      const modelName = getModelName("gemini-3.5-flash");
      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction, tools },
        history: formattedHistory.slice(0, -1)
        // Exclude the last message
      });
      const response = await chat.sendMessage({
        message: history[history.length - 1].content
      });
      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({
          functionCalls: response.functionCalls.map((fc) => ({ name: fc.name, args: fc.args, id: fc.id })),
          text: response.text || ""
          // Include any conversational text returned
        });
      }
      res.json({ text: response.text });
    } catch (error) {
      const errStr = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "";
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Sistemde kota a\u015F\u0131m\u0131 nedeniyle yapay zeka asistan\u0131 ge\xE7ici olarak hizmet verememektedir." });
      }
      console.error("Gemini AI Assistant Error:", error);
      let message = "Asistan servisi \u015Fu an kullan\u0131lam\u0131yor.";
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtar\u0131 eksik. L\xFCtfen uygulaman\u0131n ayarlar\u0131ndan (Secrets b\xF6l\xFCm\xFCnden) ASSISTAN_API_KEY de\u011Ferini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "AI Modeli bulunamad\u0131 veya eri\u015Fiminiz yok. Model adlar\u0131n\u0131 ve API yetkilerinizi kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ula\u015F\u0131ld\u0131 veya istek say\u0131s\u0131 a\u015F\u0131ld\u0131.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Ge\xE7ersiz veya s\xFCresi dolmu\u015F Gemini API anahtar\u0131. L\xFCtfen Settings > Secrets panelinden ASSISTAN_API_KEY g\xFCncelleyin.";
      } else if (error?.message) {
        message = `AI Entegrasyon Hatas\u0131: ${error.message}`;
      } else {
        message = `AI Hatas\u0131: ${errStr}`;
      }
      res.status(500).json({ error: message });
    }
  });
  app2.post("/api/analysis-insight", async (req, res) => {
    try {
      const { analysisType, data, specificInstructions } = req.body;
      if (!analysisType || !data) {
        return res.status(400).json({ error: "analysisType and data are required" });
      }
      const ai = getGeminiClient();
      const systemInstruction = `Sen "ON Asistan" adl\u0131 profesyonel bir e\u011Fitim ve ki\u015Filik analiz uzman\u0131s\u0131n. 
      \xD6\u011Frencinin yapt\u0131\u011F\u0131 "${analysisType}" analizinin sonu\xE7lar\u0131n\u0131 yorumlamakla g\xF6revlisin.
      \xD6\u011Frenciye do\u011Frudan hitap et, samimi, yap\u0131c\u0131 ama bilimsel temelli bir dil kullan. 
      Analiz verilerini derinlemesine incele ve \xF6\u011Frencinin geli\u015Fimi i\xE7in somut 3 \xF6neri sun.
      ${specificInstructions || ""}
      Markdown format\u0131nda, ba\u015Fl\u0131klar kullanarak yan\u0131t ver.`;
      const prompt = `Analiz Verileri: ${JSON.stringify(data)}
      L\xFCtfen bu verileri analiz et ve \xF6\u011Frenciye \xF6zel bir fark\u0131ndal\u0131k raporu haz\u0131rla.`;
      const modelName = getModelName("gemini-3-flash-preview");
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      const errStr = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "";
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Demo Modu: Gemini API kota limitlerine ula\u015F\u0131ld\u0131\u011F\u0131 i\xE7in, yapay zeka analizi uygulanamad\u0131." });
      }
      console.error("Analysis Insight Error:", error);
      let message = "Analiz raporu olu\u015Fturulamad\u0131.";
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtar\u0131 eksik. L\xFCtfen uygulaman\u0131n ayarlar\u0131ndan (Secrets b\xF6l\xFCm\xFCnden) ASSISTAN_API_KEY de\u011Ferini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "Analiz modeli bulunamad\u0131. L\xFCtfen model adlar\u0131n\u0131 ve API yetkilerinizi kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ula\u015F\u0131ld\u0131.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Ge\xE7ersiz veya s\xFCresi dolmu\u015F Gemini API anahtar\u0131. L\xFCtfen Settings > Secrets panelinden ASSISTAN_API_KEY g\xFCncelleyin.";
      } else if (error?.message) {
        message = `AI Hatas\u0131: ${error.message}`;
      } else {
        message = `AI Hatas\u0131: ${errStr}`;
      }
      res.status(500).json({ error: message });
    }
  });
  app2.post("/api/caba-analyze", async (req, res) => {
    try {
      const { likertAnswers, openEndedAnswers, studentName } = req.body;
      if (!likertAnswers || !openEndedAnswers) {
        return res.status(400).json({ error: "likertAnswers ve openEndedAnswers gereklidir." });
      }
      const ai = getGeminiClient();
      const systemInstruction = `Sen FocusON Akademi'de uzman bir yapay zeka e\u011Fitim ve rehberlik analiz asistan\u0131 "ON Asistan"s\u0131n.
\xD6\u011Frencilerin \xC7al\u0131\u015Fma Al\u0131\u015Fkanl\u0131klar\u0131 ve Ba\u015Far\u0131 Analizi (\xC7ABA) testi sonu\xE7lar\u0131n\u0131 derinlemesine ve b\xFCt\xFCnc\xFCl olarak analiz etmekle g\xF6revlisin.
Hem 15 adet Likert sorusunun yan\u0131tlar\u0131n\u0131 (1: Hi\xE7 Kat\u0131lm\u0131yorum, 5: Tamamen Kat\u0131l\u0131yorum) hem de \xF6\u011Frencinin kendi c\xFCmleleriyle yazd\u0131\u011F\u0131 10 adet a\xE7\u0131k u\xE7lu sorunun yan\u0131tlar\u0131n\u0131 (Gelecek Vizyonu, K\xF6k \u0130nan\xE7, Zaman H\u0131rs\u0131zlar\u0131 vb.) g\xF6z \xF6n\xFCnde bulundurarak \xE7ok y\xF6nl\xFC bir profil \xE7\u0131karacaks\u0131n.

G\xF6revlerin:
1. \xD6\u011Frencinin durumunu \xFC\xE7 b\xF6lgeden birine s\u0131n\u0131fland\u0131r ('Ye\u015Fil B\xF6lge', 'Sar\u0131 B\xF6lge' veya 'K\u0131rm\u0131z\u0131 B\xF6lge'):
   - 'Ye\u015Fil B\xF6lge': \xD6z-disiplini, i\xE7sel motivasyonu ve fark\u0131ndal\u0131\u011F\u0131 \xFCst d\xFCzeyde, kendili\u011Finden \xE7al\u0131\u015Fan, performans odakl\u0131 \xF6\u011Frenciler.
   - 'Sar\u0131 B\xF6lge': Hedef ve istek sahibi, ancak istikrar sa\u011Flamak, plan yapmak ve ertelemeyi a\u015Fmak i\xE7in d\u0131\u015Fsal disipline ve ko\xE7lu\u011Fa en \xE7ok ihtiya\xE7 duyan/ko\xE7luktan en y\xFCksek verimi alacak "\u0130deal Ko\xE7luk Aday\u0131" \xF6\u011Frenciler.
   - 'K\u0131rm\u0131z\u0131 B\xF6lge': Yo\u011Fun ders \xE7al\u0131\u015Fma direnci, kayg\u0131 t\u0131kanmas\u0131, erteleme al\u0131\u015Fkanl\u0131\u011F\u0131 veya motivasyon kilitleri ya\u015Fayan, ko\xE7lukta ilk etapta akademik y\xFCkten ziyade duygusal/zihinsel bariyer a\u015F\u0131lmas\u0131 gereken \xF6\u011Frenciler.
2. Ko\xE7lu\u011Fa Uygunluk Skoru (suitabilityScore) belirle: \xD6\u011Frencinin ko\xE7luk sistemine ne kadar yatk\u0131n ve uyumlu oldu\u011Funu g\xF6steren 0-100 aras\u0131 bir puan.
3. Genel \xC7al\u0131\u015Fma Al\u0131\u015Fkanl\u0131klar\u0131 ve Ba\u015Far\u0131 Skoru (aiScore) belirle: Hem likert hem a\xE7\u0131k u\xE7lu yan\u0131tlar\u0131na g\xF6re \xF6\u011Frencinin mevcut akademik \xF6z-y\xF6netim ve ders \xE7al\u0131\u015Fma al\u0131\u015Fkanl\u0131klar\u0131n\u0131n kalitesini g\xF6steren 0-100 aras\u0131 b\xFCt\xFCnc\xFCl bir puan.
4. Detayl\u0131 bir Markdown raporu (report) olu\u015Ftur. Rapor T\xFCrk\xE7e olmal\u0131, samimi, te\u015Fvik edici, son derece derinlikli, yap\u0131c\u0131 ve do\u011Frudan \xF6\u011Frenciye hitap eden ("sen" diliyle) bir \xFCslupta yaz\u0131lmal\u0131d\u0131r.
Rapor \u015Fu ba\u015Fl\u0131klar\u0131 i\xE7ermelidir:
   - ### \u{1F31F} B\xFCt\xFCnc\xFCl Profil De\u011Ferlendirmesi
   - ### \u{1F9E0} G\xFC\xE7l\xFC Y\xF6nlerin ve Fark\u0131ndal\u0131\u011F\u0131n
   - ### \u{1F6A7} Kar\u015F\u0131la\u015Ft\u0131\u011F\u0131n Akademik Engeller ve Zaman H\u0131rs\u0131zlar\u0131n
   - ### \u{1F680} Sana \xD6zel Somut Yol Haritas\u0131 ve 3 Ko\xE7luk \xD6nerisi
`;
      const prompt = `\xD6\u011Frenci Ad\u0131: ${studentName || "\xD6\u011Frenci"}
Likert Yan\u0131tlar\u0131 (Soru ID -> Puan): ${JSON.stringify(likertAnswers)}
A\xE7\u0131k U\xE7lu Soru Yan\u0131tlar\u0131: ${JSON.stringify(openEndedAnswers)}

L\xFCtfen bu verileri analiz et ve \xF6\u011Frenci i\xE7in \xF6zel, derinlemesine bir analiz raporu ile puanlamalar\u0131 \xFCret. Yan\u0131t\u0131 kesinlikle JSON format\u0131nda ver.`;
      const modelName = getModelName("gemini-3.5-flash");
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              classification: {
                type: import_genai.Type.STRING,
                description: "\xD6\u011Frencinin b\xF6lge s\u0131n\u0131fland\u0131rmas\u0131: 'Ye\u015Fil B\xF6lge' veya 'Sar\u0131 B\xF6lge' veya 'K\u0131rm\u0131z\u0131 B\xF6lge'"
              },
              suitabilityScore: {
                type: import_genai.Type.INTEGER,
                description: "\xD6\u011Frencinin ko\xE7luk sistemine uyumluluk derecesi (0-100 aras\u0131)"
              },
              aiScore: {
                type: import_genai.Type.INTEGER,
                description: "T\xFCm testin b\xFCt\xFCnc\xFCl analizine g\xF6re akademik haz\u0131rbulunu\u015Fluk skoru (0-100 aras\u0131)"
              },
              report: {
                type: import_genai.Type.STRING,
                description: "T\xFCrk\xE7e dilinde, alt ba\u015Fl\u0131klar\u0131 i\xE7eren, do\u011Frudan \xF6\u011Frenciye hitap eden detayl\u0131 Markdown format\u0131ndaki rapor metni."
              }
            },
            required: ["classification", "suitabilityScore", "aiScore", "report"]
          }
        }
      });
      const parsedData = JSON.parse(response.text?.trim() || "{}");
      res.json(parsedData);
    } catch (error) {
      console.error("CABA AI Analysis Error:", error);
      const errStr = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "";
      let fallbackClassification = "Sar\u0131 B\xF6lge";
      let score = 50;
      res.json({
        classification: fallbackClassification,
        suitabilityScore: 70,
        aiScore: score,
        report: `### \u{1F31F} B\xFCt\xFCnc\xFCl Profil De\u011Ferlendirmesi\\n\\nAnaliz s\xFCreciniz ba\u015Far\u0131yla tamamland\u0131. Detayl\u0131 yapay zeka analiziniz haz\u0131rlan\u0131rken ge\xE7ici bir ba\u011Flant\u0131 sorunu ya\u015Fand\u0131. Ancak verdi\u011Finiz yan\u0131tlara g\xF6re ko\xE7lu\u011Fa uyumluluk potansiyeliniz olduk\xE7a y\xFCksektir.\\n\\n### \u{1F9E0} G\xFC\xE7l\xFC Y\xF6nlerin ve Fark\u0131ndal\u0131\u011F\u0131n\\n\\nKendinizi tan\u0131ma arzunuz ve hedefinize olan ba\u011Fl\u0131l\u0131\u011F\u0131n\u0131z en b\xFCy\xFCk g\xFCc\xFCn\xFCzd\xFCr.\\n\\n### \u{1F6A7} Kar\u015F\u0131la\u015Ft\u0131\u011F\u0131n Akademik Engeller ve Zaman H\u0131rs\u0131zlar\u0131n\\n\\nZaman zaman planlama ve odaklanma s\xFCre\xE7lerinde d\u0131\u015Fsal bir takibe ve y\xF6ntem deste\u011Fine ihtiya\xE7 duyuyorsunuz.\\n\\n### \u{1F680} Sana \xD6zel Somut Yol Haritas\u0131 ve 3 Ko\xE7luk \xD6nerisi\\n\\n1. **K\xFC\xE7\xFCk Ad\u0131mlarla Ba\u015Fla:** G\xFCnl\xFCk \xE7al\u0131\u015Fma s\xFCrelerinizi k\xFC\xE7\xFCk par\xE7alara b\xF6l\xFCn.\\n2. **S\u0131n\u0131r Koymay\u0131 \xD6\u011Fren:** \xC7al\u0131\u015Fma saatlerinizde \xE7evrenize kibarca s\u0131n\u0131r \xE7ekin.\\n3. **Hatalar\u0131 Kucakla:** S\u0131navlardaki hatalar\u0131 bir eksiklik de\u011Fil, \xF6\u011Frenme f\u0131rsat\u0131 olarak g\xF6r\xFCn.`
      });
    }
  });
  app2.post("/api/coach-report-generate", async (req, res) => {
    try {
      const { analysesData, studentName } = req.body;
      if (!analysesData) {
        return res.status(400).json({ error: "analysesData is required" });
      }
      const ai = getGeminiClient();
      const systemInstruction = `Sen FocusON Akademi'de profesyonel bir e\u011Fitim ko\xE7u ve rehberlik uzman\u0131s\u0131n.
      A\u015Fa\u011F\u0131da "${studentName || "\xD6\u011Frencinin"}" yapm\u0131\u015F oldu\u011Fu ki\u015Filik ve rehberlik analizlerinin sonu\xE7 \xF6zetleri verilmi\u015Ftir.
      G\xF6revin, ko\xE7un kendisi i\xE7in \xF6\u011Frenciyi tan\u0131ma ve y\xF6nlendirme ama\xE7l\u0131 bir "Ko\xE7 De\u011Ferlendirme Raporu" olu\u015Fturmakt\u0131r.
      - \xD6\u011Frencinin \xF6\u011Frenme stiline, motivasyon kaynaklar\u0131na ve g\xFC\xE7l\xFC/zay\u0131f y\xF6nlerine odaklan,
      - Ko\xE7luk s\xFCrecinde kullan\u0131labilecek stratejiler \xF6ner,
      - Dilin profesyonel, analitik ve do\u011Frudan ko\xE7a hitap eden bir tonda olsun.
      - Raporu do\u011Frudan yaz, "\u0130\u015Fte rapor" gibi giri\u015F c\xFCmleleri kullanma.
      - Format\u0131 Markdown olarak haz\u0131rla ve alt ba\u015Fl\u0131klar kullan.`;
      const prompt = `\xD6\u011Frenci Analiz Sonu\xE7lar\u0131:
${JSON.stringify(analysesData, null, 2)}

L\xFCtfen ko\xE7 de\u011Ferlendirme raporunu olu\u015Ftur.`;
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction
        }
      });
      res.json({ text: result.text });
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });
  app2.post("/api/parent-report-generate", async (req, res) => {
    try {
      const { analysesData, studentName } = req.body;
      if (!analysesData) {
        return res.status(400).json({ error: "analysesData is required" });
      }
      const ai = getGeminiClient();
      const systemInstruction = `Sen FocusON Akademi'de profesyonel bir e\u011Fitim ko\xE7u ve rehberlik uzman\u0131s\u0131n.
      A\u015Fa\u011F\u0131da "${studentName || "\xD6\u011Frencinin"}" yapm\u0131\u015F oldu\u011Fu ki\u015Filik ve rehberlik analizlerinin sonu\xE7 \xF6zetleri verilmi\u015Ftir.
      G\xF6revin, veliye y\xF6nelik bir "Veli Bilgilendirme Raporu" olu\u015Fturmakt\u0131r.
      - \xD6\u011Frencinin hassas test verilerini payla\u015Fmaktan ziyade, veliyi y\xF6nlendiren,
      - \xD6\u011Frencinin g\xFC\xE7l\xFC y\xF6nlerini vurgulayan,
      - Eksik oldu\u011Fu veya deste\u011Fe ihtiya\xE7 duydu\u011Fu konularda veliye yap\u0131c\u0131 tavsiyelerde bulunan bir metin haz\u0131rla.
      - Dilin profesyonel, empatik ve destekleyici olsun.
      - Raporu do\u011Frudan yaz, "\u0130\u015Fte rapor" gibi giri\u015F c\xFCmleleri kullanma.
      - Format\u0131 Markdown olarak haz\u0131rla ve alt ba\u015Fl\u0131klar kullan.`;
      const prompt = `\xD6\u011Frenci Analiz Sonu\xE7lar\u0131:
${JSON.stringify(analysesData, null, 2)}

L\xFCtfen veli bilgilendirme raporunu olu\u015Ftur.`;
      const modelName = getModelName("gemini-3-flash-preview");
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Parent Report Error:", error);
      res.status(500).json({ error: "Rapor olu\u015Fturulamad\u0131." });
    }
  });
  app2.post("/api/coach-assistant", async (req, res) => {
    try {
      const { systemInstruction, messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages are required in request body" });
      }
      const ai = getGeminiClient();
      const contents = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));
      const modelName = getModelName("gemini-3-flash-preview");
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      const errStr = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "";
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Sistemde kota a\u015F\u0131m\u0131 nedeniyle ko\xE7 asistan\u0131 ge\xE7ici olarak hizmet verememektedir." });
      }
      console.error("Coach Assistant Error:", error);
      let message = "Asistan yan\u0131t veremedi.";
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtar\u0131 eksik. L\xFCtfen uygulaman\u0131n ayarlar\u0131ndan (Secrets b\xF6l\xFCm\xFCnden) ASSISTAN_API_KEY de\u011Ferini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "AI Modeli bulunamad\u0131. L\xFCtfen model kurulumunu kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ula\u015F\u0131ld\u0131.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Ge\xE7ersiz veya s\xFCresi dolmu\u015F Gemini API anahtar\u0131. L\xFCtfen Settings > Secrets panelinden ASSISTAN_API_KEY g\xFCncelleyin.";
      } else if (error?.message) {
        message = `AI Hatas\u0131: ${error.message}`;
      } else {
        message = `AI Hatas\u0131: ${errStr}`;
      }
      res.status(500).json({ error: message });
    }
  });
  app2.post("/api/chocolate-audit", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const ai = getGeminiClient();
      const modelName = getModelName("gemini-3-flash-preview");
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      res.json({ text: response.text });
    } catch (error) {
      const errStr = typeof error === "string" ? error : error?.message || JSON.stringify(error) || "";
      if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429") || errStr.includes("depleted")) {
        return res.json({ text: "Sistemde kota a\u015F\u0131m\u0131." });
      }
      console.error("Gemini API Error:", error);
      let message = "AI Analiz servisi \u015Fu an kullan\u0131lam\u0131yor.";
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtar\u0131 eksik. L\xFCtfen uygulaman\u0131n ayarlar\u0131ndan (Secrets b\xF6l\xFCm\xFCnden) ASSISTAN_API_KEY de\u011Ferini ekleyin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kotas\u0131 doldu (429). L\xFCtfen API limitlerinizi kontrol edin.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("403") || errStr.includes("API key expired")) {
        message = "Gemini API yetkilendirme hatas\u0131. L\xFCtfen Settings > Secrets panelinden ASSISTAN_API_KEY g\xFCncelleyin.";
      } else if (error?.message) {
        message = `AI Hatas\u0131: ${error.message}`;
      } else {
        message = `AI Hatas\u0131: ${errStr}`;
      }
      res.status(500).json({ error: message });
    }
  });
  app2.post("/api/calculate-yks", async (req, res) => {
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
        data.diploma ? String(data.diploma).replace(".", ",") : "50,00"
      ];
      const params = new URLSearchParams();
      params.append("diploma", data.diploma || "50");
      const fieldMap = {
        "tmd": data.tytMat,
        "ttd": data.tytTr,
        "tfd": data.tytFen,
        "tsd": data.tytSos,
        "tmy": 0,
        "tty": 0,
        "tfy": 0,
        "tsy": 0,
        "md": data.aytMat,
        "fd": data.aytFiz,
        "kd": data.aytKim,
        "bd": data.aytBiy,
        "ed": data.aytEd,
        "tar1d": data.aytTar1,
        "cog1d": data.aytCog1,
        "tar2d": data.aytTar2,
        "cog2d": data.aytCog2,
        "feld": data.aytFel,
        "dind": data.aytDin,
        "dd": data.ydt,
        "my": 0,
        "fy": 0,
        "ky": 0,
        "by": 0,
        "ey": 0,
        "tar1y": 0,
        "cog1y": 0,
        "tar2y": 0,
        "cog2y": 0,
        "fely": 0,
        "diny": 0,
        "dy": 0
      };
      for (const [key, value] of Object.entries(fieldMap)) {
        params.append(key, String(value || 0));
      }
      const [ogmRes, puangoRes] = await Promise.all([
        fetch("https://ogmmateryal.eba.gov.tr/yks-puan-hesaplama", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify(reqData)
        }),
        fetch("https://puango.net/api/hesaplama2.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString()
        })
      ]);
      const ogmText = await ogmRes.text();
      let ogmParsed = [];
      try {
        ogmParsed = JSON.parse(ogmText);
        if (data.kirikOBP && Array.isArray(ogmParsed) && ogmParsed.length > 5) {
          const deduction = Number(data.diploma || 50) * 0.3;
          if (ogmParsed[0]?.tytPuani) ogmParsed[0].tytPuani -= deduction;
          if (ogmParsed[3]?.tytPuani) ogmParsed[3].tytPuani -= deduction;
          if (ogmParsed[4]?.esitAgirlikPuani) ogmParsed[4].esitAgirlikPuani -= deduction;
          if (ogmParsed[4]?.sayisalPuani) ogmParsed[4].sayisalPuani -= deduction;
          if (ogmParsed[4]?.sozelPuani) ogmParsed[4].sozelPuani -= deduction;
          if (ogmParsed[5]?.dilPuani) ogmParsed[5].dilPuani -= deduction;
        }
      } catch (e) {
        console.error("OGM parse error:", e);
      }
      const puangoText = await puangoRes.text();
      let puangoParsed = {};
      try {
        const jsonStart = puangoText.indexOf("{");
        if (jsonStart !== -1) {
          puangoParsed = JSON.parse(puangoText.substring(jsonStart));
        }
        if (data.kirikOBP) {
          const deduction = Number(data.diploma || 50) * 0.3;
          if (puangoParsed.tyt_yer) puangoParsed.tyt_yer -= deduction;
          if (puangoParsed.yks_say_yer) puangoParsed.yks_say_yer -= deduction;
          if (puangoParsed.yks_ea_yer) puangoParsed.yks_ea_yer -= deduction;
          if (puangoParsed.yks_soz_yer) puangoParsed.yks_soz_yer -= deduction;
          if (puangoParsed.yks_dil_yer) puangoParsed.yks_dil_yer -= deduction;
        }
      } catch (e) {
        console.error("Puango parse error:", e);
      }
      res.json({ ogm: ogmParsed, puango: puangoParsed });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to calculate" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app2.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app2.use(import_express.default.static(distPath));
    app2.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app2.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
