const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./firebase-applet-config.json');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: serviceAccount.projectId
  });
}

const db = getFirestore(admin.apps[0], serviceAccount.firestoreDatabaseId);

async function testQuery() {
  console.log("Running simple orderBy query on custom db:", serviceAccount.firestoreDatabaseId);
  try {
    const snap = await db.collection("bolumler").count().get();
    console.log("Total bolumler count:", snap.data().count);
  } catch (err) {
    console.error("Simple orderBy query failed:", err.message);
  }
  process.exit(0);
}

testQuery();
