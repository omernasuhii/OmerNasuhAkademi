const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;

let app;
if (serviceAccountPath) {
  app = initializeApp({
    credential: cert(serviceAccountPath)
  });
} else {
  // Use default
  app = initializeApp();
}
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkUser() {
  const usersRef = db.collection("users");
  const q = usersRef.where("email", "==", "omernasuhagir2@gmail.com");
  const snap = await q.get();
  snap.forEach(doc => {
    console.log(`User found! ID: ${doc.id}, Role: ${doc.data().role}`);
  });
}
checkUser();
