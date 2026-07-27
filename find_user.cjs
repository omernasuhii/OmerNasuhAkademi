const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

admin.initializeApp({
  projectId: "gen-lang-client-0140076974",
});

async function run() {
  const db = getFirestore(admin.apps[0], "ai-studio-84291387-c606-49b9-a640-979708195be5");
  console.log("Searching for user with email omernasuhagir2@gmail.com...");
  const snapshot = await db.collection('users').where('email', '==', 'omernasuhagir2@gmail.com').get();
  if (snapshot.empty) {
    console.log("No user found with that email!");
  } else {
    snapshot.forEach(doc => {
      console.log("User UID:", doc.id);
      console.log("User Data:", JSON.stringify(doc.data(), null, 2));
    });
  }
  process.exit(0);
}
run();
