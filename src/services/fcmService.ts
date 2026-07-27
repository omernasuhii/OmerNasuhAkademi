import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, auth } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const fcmService = {
  async requestPermissionAndGetToken() {
    try {
      if (!messaging) {
        console.warn('Messaging is not supported on this device/browser.');
        return null;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        // TODO: Replace with your actual VAPID key from Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
        const currentToken = await getToken(messaging, { 
        vapidKey: 'BCAbUobwcqEI2hPEa-Q3hsoMNjLaK5CfAuG3wC26zbja5TUh8mS5eVuT1ijEHE6499kzn25I0GZcIg9aUaKG7wo' 
        });

        if (currentToken) {
          console.log('FCM Token:', currentToken);
          // Save the token to Firestore for this user
          if (auth.currentUser) {
            await setDoc(doc(db, 'userTokens', auth.currentUser.uid), {
              token: currentToken,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
          return currentToken;
        } else {
          console.log('No registration token available.');
          return null;
        }
      } else {
        console.log('Unable to get permission to notify.');
        return null;
      }
    } catch (error) {
      console.error('An error occurred while retrieving token. ', error);
      return null;
    }
  },

  onMessageListener() {
    return new Promise((resolve) => {
      if (messaging) {
        onMessage(messaging, (payload) => {
          resolve(payload);
        });
      }
    });
  }
};
