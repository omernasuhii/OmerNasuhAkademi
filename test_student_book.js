import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "teststudent1@example.com", "123456");
    console.log("Logged in as:", cred.user.uid);

    try {
      const q = query(collection(db, "book_tracking"), where("studentId", "==", cred.user.uid));
      const snap = await getDocs(q);
      console.log("Book tracking size:", snap.size);
    } catch (e) {
      console.error("Book error:", e.code, e.message);
    }
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
