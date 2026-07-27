const admin = require('firebase-admin');
const serviceAccount = require('./firebase-applet-config.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function run() {
  const db = admin.firestore();
  const doc = await db.collection('users').doc('4vkNUp8qw6ZjfqQAnTQKgXvApCx1').get();
  console.log(doc.data());
  process.exit(0);
}
run();
