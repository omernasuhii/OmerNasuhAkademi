import React, { useState, useEffect } from 'react';
import { fcmService } from '../services/fcmService';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../lib/AuthContext';
import { BellRing, AlertTriangle, Info } from 'lucide-react';

export function NotificationPrompt() {
  const { userData } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch (e) {
      setIsInIframe(true);
    }

    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
    
    const dismissed = localStorage.getItem('notificationPromptDismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const token = await fcmService.requestPermissionAndGetToken();
      if (token) {
        setPermissionStatus('granted');
        if (userData?.uid) {
          notificationService.addNotification(userData.uid, {
            title: 'Bildirimler Aktif!',
            message: 'Artık anlık uyarıları alacaksınız.',
            type: 'success',
            link: ''
          });
        }
      } else {
        setPermissionStatus(Notification.permission);
      }
    } catch (e) {
      console.error(e);
      setPermissionStatus(Notification.permission || 'denied');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (permissionStatus === 'granted') {
    return null;
  }

  // If dismissed and permission is default, don't show
  if (isDismissed && permissionStatus === 'default') {
    return null;
  }

  if (permissionStatus === 'unsupported') {
    return null; // Don't bother the user if their browser doesn't support it at all
  }

  return (
    <div className="bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/30 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 shrink-0">
          {permissionStatus === 'denied' || isInIframe ? (
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          ) : (
            <BellRing className="w-6 h-6" />
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-1">
            {isInIframe 
              ? 'Bildirimler İçin Yeni Sekme' 
              : permissionStatus === 'denied' 
                ? 'Bildirimler Engellendi' 
                : 'Anlık Bildirimleri Aç'}
          </h3>
          <p className="text-slate-400 text-sm">
            {isInIframe 
              ? 'Tarayıcı kısıtlamaları nedeniyle bu önizleme penceresinde bildirimlere izin verilemiyor. Sağ üstten uygulamayı "Yeni Sekmede Aç"arak bildirimleri etkinleştirebilirsiniz.' 
              : permissionStatus === 'denied'
                ? 'Tarayıcınız üzerinden bildirim iznini engellediniz. Bildirimleri almak için tarayıcınızın adres çubuğundaki (kilit simgesinden) izinleri sıfırlayabilirsiniz.'
                : 'Mesajlar, randevular ve önemli duyurular için bildirim alın.'}
          </p>
        </div>
      </div>
      
      {!isInIframe && permissionStatus === 'default' && (
        <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
          <button 
            onClick={handleDismiss}
            className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-medium transition-colors border border-slate-700"
          >
            Şimdi Değil
          </button>
          <button 
            onClick={handleEnableNotifications}
            className="flex-1 md:flex-none bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold transition-colors shadow-lg shadow-indigo-500/25 shrink-0"
          >
            İzin Ver
          </button>
        </div>
      )}
    </div>
  );
}
