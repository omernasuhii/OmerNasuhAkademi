import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, getDocs, collection, query, where, orderBy } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const email = "teststudent123@example.com";
    const pass = "123456";
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, pass);
      console.log("Logged in existing test student:", cred.user.uid);
    } catch(e) {
      cred = await createUserWithEmailAndPassword(auth, email, pass);
      console.log("Created and logged in test student:", cred.user.uid);
    }

    const userUid = cred.user.uid;

    // Create user document with role: 'student'
    await setDoc(doc(db, "users", userUid), {
      email: email,
      role: "student",
      firstName: "Test",
      lastName: "Student"
    });
    console.log("Created user document with role: student");

    // Now attempt to query purchases
    try {
      console.log("Attempting query: purchases where studentId == " + userUid);
      const q = query(collection(db, "purchases"), where("studentId", "==", userUid), orderBy("purchasedAt", "desc"));
      const snap = await getDocs(q);
      console.log("Purchases query succeeded, size:", snap.size);
    } catch (e) {
      console.error("Purchases query failed:", e.code, e.message);
    }

  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
