import { initializeApp } from 'firebase/app';
import { getFirestore, addDoc, collection } from 'firebase/firestore';
import config from './firebase-applet-config.json';

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  const code = `REF-TEST-${Math.floor(Math.random() * 1000)}`;
  try {
    await addDoc(collection(db, 'coupons'), {
      code,
      name: 'Davet İndirimi (Yeni Kayıt)',
      discount: 10,
      generatedFrom: 'referral',
      ownerId: 'test-user',
      status: 'pending'
    });
    console.log("Success! Coupon created.");
  } catch (err) {
    console.error("Failed to create coupon:", err);
  }
}
run();
