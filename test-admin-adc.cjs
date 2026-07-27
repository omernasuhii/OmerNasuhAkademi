const admin = require('firebase-admin');
try {
  admin.initializeApp(); // Initialize with ADC
  const db = admin.firestore();
  console.log("Success! DB instance created.");
  db.collection("test").limit(1).get().then(() => console.log("Read success!")).catch(e => console.log("Read Error:", e.message));
} catch (e) {
  console.error("Init Failed:", e.message);
}
