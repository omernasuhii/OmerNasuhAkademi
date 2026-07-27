import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, query, where } from "firebase/firestore";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./firebase-applet-config.json", "utf-8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function checkUser() {
  console.log("Searching for user with email: omernasuhagir2@gmail.com in db:", config.firestoreDatabaseId);
  try {
    const q = query(collection(db, "users"), where("email", "==", "omernasuhagir2@gmail.com"));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log("No user found with that email!");
      // List a few users to see what roles exist
      const allUsersSnap = await getDocs(query(collection(db, "users")));
      console.log(`Found ${allUsersSnap.size} total users in 'users' collection.`);
      allUsersSnap.docs.forEach(doc => {
        console.log(`- User ID: ${doc.id}, Email: ${doc.data().email}, Role: ${doc.data().role}, Name: ${doc.data().name}`);
      });
    } else {
      snap.forEach(doc => {
        console.log(`User found! ID: ${doc.id}, Data:`, JSON.stringify(doc.data(), null, 2));
      });
    }
  } catch (err: any) {
    console.error("Query failed:", err.message);
  }
}

checkUser();
