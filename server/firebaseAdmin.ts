import * as admin from "firebase-admin";

export function initFirebaseAdmin() {
  if (admin.apps.length === 0) {
    let serviceAccount: any = null;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (e) {
        console.error("FIREBASE_SERVICE_ACCOUNT JSON parsing failed:", e);
      }
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID || "ai-studio-84291387-c606-49b9-a640-979708195be5",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      };
    }

    if (serviceAccount) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: serviceAccount.projectId || process.env.FIREBASE_PROJECT_ID || "ai-studio-84291387-c606-49b9-a640-979708195be5"
        });
        console.log("Firebase Admin successfully initialized in modular server.");
      } catch (err) {
        console.error("Firebase Admin initialization error:", err);
      }
    } else {
      try {
        admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "ai-studio-84291387-c606-49b9-a640-979708195be5"
        });
        console.log("Firebase Admin initialized with default project configuration.");
      } catch (err) {
        console.warn("Firebase Admin default fallback initialization warning:", err);
      }
    }
  }
  return admin;
}

export function getDb(): admin.firestore.Firestore {
  initFirebaseAdmin();
  return admin.firestore();
}

export { admin };
