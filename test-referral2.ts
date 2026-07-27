import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import config from './firebase-applet-config.json';

const app = initializeApp(config);
const auth = getAuth();
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  await signInWithEmailAndPassword(auth, "omernasuhagir2@gmail.com", "123456"); // I don't know the password
  // ...
}
