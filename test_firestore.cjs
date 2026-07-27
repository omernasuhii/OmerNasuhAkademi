const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp({
  projectId: serviceAccount.projectId
});

async function run() {
  const db = getFirestore(admin.apps[0], serviceAccount.firestoreDatabaseId);
  const parent = await db.collection('users').doc('TXPRJ6FuocPo2MWtZzk6rGdwSkj1').get();
  console.log("Parent:", parent.data());
  process.exit(0);
}
run();
