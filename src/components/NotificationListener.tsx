import React, { useEffect, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { notificationService } from '../services/notificationService';
import { fcmService } from '../services/fcmService';

export function NotificationListener() {
  const { userData } = useAuth();
  const lastNotificationTime = useRef<number>(Date.now());

  useEffect(() => {
    if (!userData?.uid) return;

    // Sadece tarayıcı desteği ve izni varsa dinle
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const unsubscribe = notificationService.onNotificationsChange(userData.uid, (notifications) => {
      const now = Date.now();
      
      // Sadece yeni gelen ve okunmamış bildirimleri bul
      const newNotifications = notifications.filter(
        notif => !notif.isRead && new Date(notif.createdAt).getTime() > lastNotificationTime.current
      );

      if (newNotifications.length > 0) {
        newNotifications.forEach(notif => {
          try {
            const browserNotif = new Notification(notif.title || 'FocusON Akademi', {
              body: notif.message,
              icon: '/images/ON-Logo.png',
              badge: '/images/ON-Logo.png'
            });

            browserNotif.onclick = () => {
              window.focus();
              browserNotif.close();
            };
          } catch (e) {
            console.error("Tarayıcı bildirimi gösterilemedi:", e);
          }
        });
        
        lastNotificationTime.current = now;
      }
    });

    
    // Firebase Cloud Messaging Message Listener
    const listenToFCM = async () => {
      try {
        const payload: any = await fcmService.onMessageListener();
        if (payload?.notification) {
          const browserNotif = new Notification(payload.notification.title || 'FocusON Akademi', {
            body: payload.notification.body,
            icon: '/images/ON-Logo.png',
            badge: '/images/ON-Logo.png'
          });
          browserNotif.onclick = () => {
            window.focus();
            browserNotif.close();
          };
        }
        // FCM mesajlarını sürekli dinlemeye devam etmesi için recursive çağrı
        listenToFCM();
      } catch (e) {
        console.log("FCM Listener error: ", e);
      }
    };
    
    listenToFCM();

    return () => unsubscribe();
  }, [userData?.uid]);

  return null;
}
