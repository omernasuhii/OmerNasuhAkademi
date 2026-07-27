import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, orderBy, where, doc, getDoc } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function testChat() {
  try {
    const q = query(collection(db, "chats"));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log("No chats found.");
      return;
    }
    const chatDoc = snap.docs[0];
    console.log("Found chat:", chatDoc.id, chatDoc.data());
    
    // Now try to fetch its messages
    const msgsQ = query(collection(db, `chats/${chatDoc.id}/messages`), orderBy("createdAt", "asc"));
    const msgsSnap = await getDocs(msgsQ);
    console.log(`Found ${msgsSnap.size} messages.`);
    msgsSnap.forEach(d => {
      console.log("Message:", d.data());
    });
  } catch (err: any) {
    console.error("Query failed:", err.message);
  }
}

testChat();
