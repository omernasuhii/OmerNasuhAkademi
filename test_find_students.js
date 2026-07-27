import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const coachUid = "1TyeGdgPLMgYS2vrBoIzR3hNC0H2";
    const q = query(collection(db, "users"), where("coachId", "==", coachUid));
    const snap = await getDocs(q);
    console.log(`Total students assigned to coach ${coachUid}:`, snap.size);
    snap.forEach(doc => {
      console.log(`Student ID: ${doc.id}`);
      console.log("Data:", JSON.stringify(doc.data(), null, 2));
    });
  } catch (e) {
    console.error("Error finding students:", e);
  }
  process.exit(0);
}
run();
