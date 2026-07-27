const admin = require('firebase-admin');
admin.initializeApp({ projectId: "gen-lang-client-0140076974" });
const db = admin.firestore();
db.settings({ databaseId: "ai-studio-84291387-c606-49b9-a640-979708195be5" });
db.collection("whatsapp_messages").doc("test").set({ test: true })
  .then(() => console.log("Success writing!"))
  .catch(e => console.error("Write Failed:", e.message));
