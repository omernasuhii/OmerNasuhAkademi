import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    // I don't know the password for omernasuhagir2@gmail.com, so I'll create a new user and set it as coach
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, "testcoach1@example.com", "123456");
    } catch(e) {
      cred = await createUserWithEmailAndPassword(auth, "testcoach1@example.com", "123456");
    }
    
    console.log("Logged in as:", cred.user.uid);
    // first try to get caba for themselves
    try {
      const cabaRef = doc(db, "caba_tests", cred.user.uid);
      const cabaSnap = await getDoc(cabaRef);
      console.log("Caba exists:", cabaSnap.exists());
    } catch (e) {
      console.error("Caba error:", e);
    }

    // Now try querying book tracking for themselves (since that's what Summary.tsx does)
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
