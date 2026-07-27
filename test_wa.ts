import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkMessages() {
  const q = query(collection(db, "whatsapp_messages"), orderBy("timestamp", "desc"));
  const snap = await getDocs(q);
  console.log(`Found ${snap.size} messages.`);
  snap.docs.slice(0, 5).forEach(doc => {
    console.log(doc.data().body);
  });
}
checkMessages();
