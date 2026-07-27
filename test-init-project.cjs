const admin = require('firebase-admin');
try {
  admin.initializeApp({ projectId: "gen-lang-client-0140076974" });
  const db = admin.firestore();
  // We need to also specify the databaseId since it's "ai-studio-84291387-c606-49b9-a640-979708195be5"
  const dbCustom = admin.firestore(admin.app(), "ai-studio-84291387-c606-49b9-a640-979708195be5");
  dbCustom.collection("test").limit(1).get().then(() => {
    console.log("Success reading from DB!");
  }).catch(e => console.error("DB Read Failed:", e.message));
} catch (e) {
  console.error("Init Failed:", e.message);
}
