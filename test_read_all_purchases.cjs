const admin = require("firebase-admin");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

const adminApp = admin.initializeApp(
  serviceAccountPath ? { credential: admin.credential.cert(serviceAccountPath) } : undefined
);

// Get Firestore specifying the databaseId
const db = admin.firestore(adminApp, config.firestoreDatabaseId);

async function run() {
  try {
    console.log("Fetching all purchases...");
    const snap = await db.collection("purchases").get();
    console.log("Total purchases in DB:", snap.size);
    snap.forEach(doc => {
      console.log(`Purchase ID: ${doc.id}`);
      console.log("Data:", JSON.stringify(doc.data(), null, 2));
    });
  } catch (e) {
    console.error("Error reading purchases:", e);
  }
  process.exit(0);
}
run();
