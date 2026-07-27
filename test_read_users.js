import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const q = query(collection(db, "users"), where("email", "==", "omernasuhagir2@gmail.com"));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log("No user found with email omernasuhagir2@gmail.com");
    } else {
      snap.forEach(doc => {
        const data = doc.data();
        console.log("User doc ID:", doc.id);
        console.log("Email:", data.email);
        console.log("Role:", data.role);
        console.log("StudentUid:", data.studentUid);
      });
    }
  } catch (e) {
    console.error("Error reading users:", e);
  }
  process.exit(0);
}
run();
