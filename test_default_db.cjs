const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-applet-config.json');

// Initialize with default credentials of the environment (which has the correct IAM permissions)
admin.initializeApp();

async function run() {
  try {
    const db = getFirestore(admin.apps[0], serviceAccount.firestoreDatabaseId);
    console.log("Testing read on custom database:", serviceAccount.firestoreDatabaseId);
    const snapshot = await db.collection('users').limit(5).get();
    console.log("Success! Read custom database.");
    snapshot.forEach(doc => console.log(doc.id, doc.data().email));
  } catch (error) {
    console.error("Custom DB failed:", error.message);
  }

  try {
    const dbDefault = getFirestore(admin.apps[0]);
    console.log("Testing read on (default) database:");
    const snapshotDefault = await dbDefault.collection('users').limit(5).get();
    console.log("Success! Read (default) database.");
    snapshotDefault.forEach(doc => console.log(doc.id, doc.data().email));
  } catch (error) {
    console.error("(default) DB failed:", error.message);
  }
  process.exit(0);
}
run();
