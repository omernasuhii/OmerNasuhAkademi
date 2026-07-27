const admin = require('firebase-admin');
admin.initializeApp({ projectId: "gen-lang-client-0140076974" });
const dbCustom = admin.firestore().collection("whatsapp_messages").doc("test").set({ test: true })
  .then(() => console.log("Success writing!"))
  .catch(e => console.error("Write Failed:", e.message));
