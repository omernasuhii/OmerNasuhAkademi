const admin = require('firebase-admin');
admin.initializeApp({ projectId: "gen-lang-client-0140076974" });
const dbCustom = admin.firestore(admin.app(), "ai-studio-84291387-c606-49b9-a640-979708195be5");
dbCustom.collection("whatsapp_messages").add({ test: true })
  .then((ref) => console.log("Success writing!", ref.id))
  .catch(e => console.error("Write Failed:", e.message));
