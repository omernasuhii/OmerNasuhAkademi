import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, "teststudent1@example.com", "123456");
    } catch(e) {
      cred = await createUserWithEmailAndPassword(auth, "teststudent1@example.com", "123456");
    }
    
    console.log("Logged in as:", cred.user.uid);
    const cabaRef = doc(db, "caba_tests", cred.user.uid);
    const cabaSnap = await getDoc(cabaRef);
    console.log("Caba exists:", cabaSnap.exists());
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
