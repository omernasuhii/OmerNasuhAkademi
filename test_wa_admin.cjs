const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

let app;
if (serviceAccountPath) {
  app = initializeApp({ credential: cert(serviceAccountPath) });
} else {
  app = initializeApp();
}

const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  const snap = await db.collection("whatsapp_messages").orderBy("timestamp", "desc").limit(5).get();
  console.log("Found:", snap.size);
  snap.forEach(d => console.log(d.id, d.data().body, d.data().direction));
}
check().catch(console.error);
