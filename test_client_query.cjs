const admin = require("firebase-admin");
const { getAuth: getAdminAuth } = require("firebase-admin/auth");
const { initializeApp: initClient } = require("firebase/app");
const { getAuth, signInWithCustomToken } = require("firebase/auth");
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require("firebase/firestore");
const fs = require("fs");

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : null;
const adminApp = admin.initializeApp(serviceAccountPath ? { credential: admin.credential.cert(serviceAccountPath) } : undefined);

const clientApp = initClient(config);
const auth = getAuth(clientApp);
const db = getFirestore(clientApp, config.firestoreDatabaseId);

async function run() {
  try {
    const customToken = await getAdminAuth(adminApp).createCustomToken("1TyeGdgPLMgYS2vrBoIzR3hNC0H2");
    const cred = await signInWithCustomToken(auth, customToken);
    console.log("Logged in as:", cred.user.uid);
    
    // test getDoc on caba_tests
    try {
      const cabaRef = doc(db, "caba_tests", cred.user.uid);
      const cabaSnap = await getDoc(cabaRef);
      console.log("Caba exists:", cabaSnap.exists());
    } catch(e) {
      console.error("Caba error:", e.code, e.message);
    }

    // test query on book_tracking
    try {
      const q = query(collection(db, "book_tracking"), where("studentId", "==", cred.user.uid));
      const snap = await getDocs(q);
      console.log("Book tracking size:", snap.size);
    } catch(e) {
      console.error("Book tracking error:", e.code, e.message);
    }
  } catch (e) {
    console.error("Error:", e);
  }
  process.exit(0);
}
run();
