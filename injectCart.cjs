const admin = require('firebase-admin');
const fs = require('fs');

const configPath = './firebase-applet-config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(config.serviceAccountKey)
});

const db = admin.firestore();

async function run() {
  const usersRef = db.collection('users');
  const snap = await usersRef.where('role', '==', 'student').limit(1).get();
  
  if (snap.empty) {
    console.log('No students found.');
    process.exit(0);
  }
  
  const student = snap.docs[0];
  await student.ref.update({
    cart: {
      items: [
        {
          id: 'product_test',
          itemId: 'test_item_id',
          type: 'product',
          title: 'Test Kitap Seti',
          price: 250,
          quantity: 2
        },
        {
          id: 'subscription_test',
          itemId: 'test_sub_id',
          type: 'subscription',
          title: 'Premium Abonelik',
          price: 500,
          quantity: 1
        }
      ],
      updatedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString() // 25 hours ago, so it shows '24 Saatten Eski'
    }
  });
  
  console.log(`Injected abandoned cart for student ${student.data().email}`);
  process.exit(0);
}

run();
