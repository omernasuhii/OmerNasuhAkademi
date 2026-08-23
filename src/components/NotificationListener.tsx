import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Megaphone, 
  Calendar, 
  X, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  Info, 
  MessageSquare, 
  CreditCard, 
  GraduationCap,
  AlertTriangle,
  Flame,
  Tag,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';
import { notificationService, Notification as AppNotification } from '../services/notificationService';
import { fcmService } from '../services/fcmService';

export function NotificationListener() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const lastNotificationTime = useRef<number>(Date.now());

  // State Management for Notification Modal & Toast
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [toastNotification, setToastNotification] = useState<AppNotification | null>(null);

  // Redirect Action Logic
  const handleRedirect = (notif: AppNotification) => {
    if (notif.id && !notif.id.startsWith('fcm-')) {
      notificationService.markAsRead(notif.id).catch(() => {});
    }
    
    setSelectedNotification(null);
    setToastNotification(null);

    const targetUrl = notif.actionUrl || notif.link;
    if (targetUrl && targetUrl.trim().length > 0 && targetUrl.trim() !== '#' && targetUrl.trim() !== '/') {
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        window.open(targetUrl, '_blank');
      } else {
        navigate(targetUrl);
      }
      return;
    }

    // Fallbacks if no link specified
    if (isAnnouncement(notif)) {
      if (userData?.role === 'admin') {
        navigate('/panel/admin/duyurular');
      } else {
        navigate('/panel');
      }
      return;
    }

    if (isProgram(notif)) {
      if (userData?.role === 'admin') {
        navigate('/panel/admin/programlar');
      } else if (userData?.role === 'coach') {
        navigate('/panel/koc/ogrenci/program');
      } else {
        navigate('/panel/ogrenci/online-egitimler');
      }
      return;
    }

    if (notif.link) {
      navigate(notif.link);
    } else {
      navigate('/panel');
    }
  };

  // Global window event listener to open notification modal from anywhere
  useEffect(() => {
    const handleOpenModal = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification>;
      if (customEvent.detail) {
        const notif = customEvent.detail;
        
        if (isAnnouncement(notif)) {
          setSelectedNotification(notif);
          if (!notif.isRead && notif.id) {
            notificationService.markAsRead(notif.id).catch(err => console.warn('Mark as read error:', err));
          }
        } else {
          // Instead of opening modal, directly navigate for non-announcement notifications
          handleRedirect(notif);
        }
      }
    };

    window.addEventListener('open-notification-modal', handleOpenModal);
    return () => window.removeEventListener('open-notification-modal', handleOpenModal);
  }, [userData, navigate]);

  // Real-time listener for the active selected announcement (live updates on edit)
  useEffect(() => {
    if (!selectedNotification?.announcementId) return;

    const annRef = doc(db, 'announcements', selectedNotification.announcementId);
    const unsubscribe = onSnapshot(annRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSelectedNotification(prev => {
          if (!prev) return null;
          return {
            ...prev,
            title: data.title ? `📢 ${data.title.replace(/^📢\s*/, '')}` : prev.title,
            summary: data.summary ?? prev.summary,
            message: data.summary || data.content?.substring(0, 100) || prev.message,
            content: data.content || prev.content,
            category: data.category || prev.category,
            priority: data.priority || prev.priority,
            bannerUrl: data.bannerUrl ?? prev.bannerUrl,
            actionUrl: data.actionUrl ?? prev.actionUrl,
            actionLabel: data.actionLabel ?? prev.actionLabel,
            link: data.actionUrl ?? prev.link
          };
        });
      }
    }, (err) => console.warn("Live announcement sync warning:", err));

    return () => unsubscribe();
  }, [selectedNotification?.announcementId]);

  // Firestore Notification Listener
  useEffect(() => {
    if (!userData?.uid) return;

    const unsubscribe = notificationService.onNotificationsChange(userData.uid, (notifications) => {
      const now = Date.now();
      
      // Sadece yeni gelen ve okunmamış bildirimleri filtrele
      const newNotifications = (notifications || []).filter(
        notif => notif && !notif.isRead && new Date(notif.createdAt).getTime() > lastNotificationTime.current
      );

      if (newNotifications.length > 0) {
        const latestNotif = newNotifications[0];
        
        // Ekran içi anlık toast göster
        setToastNotification(latestNotif);

        // Tarayıcı push bildirimi gönder (varsa ve izin verildiyse)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const browserNotif = new Notification(latestNotif.title || 'FocusON Akademi', {
              body: latestNotif.message,
              icon: '/images/ON-Logo.png',
              badge: '/images/ON-Logo.png'
            });

            browserNotif.onclick = () => {
              window.focus();
              browserNotif.close();
              setSelectedNotification(latestNotif);
              if (!latestNotif.isRead && latestNotif.id) {
                notificationService.markAsRead(latestNotif.id).catch(() => {});
              }
            };
          } catch (e) {
            console.error("Tarayıcı bildirimi tetiklenemedi:", e);
          }
        }
        
        lastNotificationTime.current = now;
      }
    });

    // FCM Message Listener
    const listenToFCM = async () => {
      try {
        const payload: any = await fcmService.onMessageListener();
        if (payload?.notification) {
          const fcmNotif: AppNotification = {
            id: 'fcm-' + Date.now(),
            userId: userData.uid,
            title: payload.notification.title || 'FocusON Akademi',
            message: payload.notification.body || '',
            type: 'system',
            isRead: false,
            createdAt: new Date().toISOString(),
            link: payload.data?.link || '/'
          };

          setToastNotification(fcmNotif);

          if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotif = new Notification(fcmNotif.title, {
              body: fcmNotif.message,
              icon: '/images/ON-Logo.png',
              badge: '/images/ON-Logo.png'
            });
            browserNotif.onclick = () => {
              window.focus();
              browserNotif.close();
              setSelectedNotification(fcmNotif);
            };
          }
        }
        listenToFCM();
      } catch (e) {
        console.log("FCM Listener:", e);
      }
    };

    listenToFCM();

    return () => unsubscribe();
  }, [userData?.uid]);

  // Auto hide toast banner after 7 seconds
  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        setToastNotification(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification]);

  // Classification Helpers
  const isAnnouncement = (notif: AppNotification) => {
    if (notif.announcementId || notif.category) return true;
    const text = (notif.title + ' ' + notif.message + ' ' + (notif.link || '')).toLowerCase();
    return text.includes('duyuru') || text.includes('announcement') || notif.link?.includes('duyurular');
  };

  const isProgram = (notif: AppNotification) => {
    const text = (notif.title + ' ' + notif.message + ' ' + (notif.link || '')).toLowerCase();
    return text.includes('program') || text.includes('ders takvimi') || text.includes('haftalık') || notif.link?.includes('program');
  };

  // Priority Styling Generator
  const getPriorityConfig = (priority?: string) => {
    switch (priority) {
      case 'critical':
        return {
          headerBg: 'bg-gradient-to-r from-rose-600 via-pink-600 to-red-600',
          containerBorder: 'border-rose-500/60 shadow-[0_0_35px_rgba(244,63,94,0.3)]',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse',
          label: 'KRİTİK ÖNEM',
          icon: <Flame size={12} className="text-rose-400 animate-bounce" />
        };
      case 'high':
        return {
          headerBg: 'bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500',
          containerBorder: 'border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          label: 'YÜKSEK ÖNEM',
          icon: <AlertTriangle size={12} className="text-amber-400" />
        };
      case 'low':
        return {
          headerBg: 'bg-gradient-to-r from-slate-700 to-slate-800',
          containerBorder: 'border-slate-800 shadow-xl',
          badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
          label: 'DÜŞÜK ÖNEM',
          icon: <Info size={12} className="text-slate-400" />
        };
      case 'normal':
      default:
        return {
          headerBg: 'bg-gradient-to-r from-purple-600 to-indigo-600',
          containerBorder: 'border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)]',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          label: 'NORMAL',
          icon: <Info size={12} className="text-purple-400" />
        };
    }
  };

  const getNotificationIcon = (notif: AppNotification) => {
    if (isAnnouncement(notif)) {
      return <Megaphone className="text-purple-400" size={24} />;
    }
    if (isProgram(notif)) {
      return <Calendar className="text-amber-400" size={24} />;
    }
    switch (notif.type) {
      case 'appointment':
        return <Clock className="text-blue-400" size={24} />;
      case 'message':
        return <MessageSquare className="text-emerald-400" size={24} />;
      case 'payment':
        return <CreditCard className="text-yellow-400" size={24} />;
      case 'exam':
        return <GraduationCap className="text-indigo-400" size={24} />;
      default:
        return <Bell className="text-purple-400" size={24} />;
    }
  };

  const getNotificationBadge = (notif: AppNotification) => {
    if (isAnnouncement(notif)) {
      return (
        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <Megaphone size={11} /> {notif.category || 'Duyuru'}
        </span>
      );
    }
    if (isProgram(notif)) {
      return (
        <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
          <Calendar size={11} /> Program
        </span>
      );
    }
    return (
      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
        <Bell size={11} /> Sistem İletisi
      </span>
    );
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'Az önce';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('tr-TR', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Link Presence Check helper
  const getActionTarget = (notif: AppNotification | null) => {
    if (!notif) return null;
    const url = (notif.actionUrl || notif.link || '').trim();
    if (url && url !== '#' && url !== '/') {
      const lowerUrl = url.toLowerCase();
      // Role-based restrictions
      if (userData?.role !== 'student' && lowerUrl.includes('/panel/ogrenci')) return null;
      if (userData?.role !== 'coach' && lowerUrl.includes('/panel/koc')) return null;
      if (userData?.role !== 'parent' && lowerUrl.includes('/panel/veli')) return null;
      if (userData?.role !== 'admin' && lowerUrl.includes('/panel/admin')) return null;

      return url;
    }
    return null;
  };

  const isParentRole = userData?.role === 'parent';

  return (
    <>
      {/* Floating In-App Toast Banner */}
      <AnimatePresence>
        {toastNotification && !selectedNotification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            onClick={() => {
              setSelectedNotification(toastNotification);
              setToastNotification(null);
            }}
            className="fixed top-5 right-5 z-[110] max-w-sm w-full bg-slate-900/95 border border-purple-500/30 rounded-3xl p-4 shadow-2xl backdrop-blur-xl cursor-pointer group transition-all hover:border-purple-500/60"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-2xl border border-purple-500/20 shrink-0">
                {getNotificationIcon(toastNotification)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  {getNotificationBadge(toastNotification)}
                  <span className="text-[10px] text-slate-500 font-bold">Şimdi</span>
                </div>
                <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                  {toastNotification.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                  {toastNotification.summary || toastNotification.message}
                </p>
                <p className="text-[10px] text-purple-400 font-bold mt-2 flex items-center gap-1">
                  <span>Detayları Görmek İçin Tıklayın</span> &rarr;
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToastNotification(null);
                }}
                className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (() => {
          const isAnn = isAnnouncement(selectedNotification);
          const prioConfig = getPriorityConfig(selectedNotification.priority);
          const actionTarget = getActionTarget(selectedNotification);
          const banner = (selectedNotification.bannerUrl || '').trim();
          const cleanTitle = selectedNotification.title.replace(/^📢\s*/, '');

          return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`bg-slate-900 border ${isAnn ? prioConfig.containerBorder : 'border-white/10'} rounded-3xl max-w-xl w-full shadow-2xl relative my-auto overflow-hidden flex flex-col max-h-[90vh]`}
              >
                {/* Top Accent Bar */}
                <div className={`h-2 shrink-0 ${
                  isAnn 
                    ? prioConfig.headerBg 
                    : isProgram(selectedNotification) 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500' 
                    : 'bg-gradient-to-r from-blue-500 to-emerald-500'
                }`} />

                {/* Modal Header */}
                <div className="p-6 md:p-7 pb-4 border-b border-white/5 relative shrink-0">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer z-10"
                  >
                    <X size={18} />
                  </button>

                  <div className="flex items-start gap-4 pr-10">
                    <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl shrink-0">
                      {getNotificationIcon(selectedNotification)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Category Tag */}
                        <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                          <Megaphone size={11} />
                          {selectedNotification.category || 'Önemli Duyuru'}
                        </span>

                        {/* Priority Tag (Hidden for Parent Role as requested) */}
                        {!isParentRole && selectedNotification.priority && (
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 ${prioConfig.badgeClass}`}>
                            {prioConfig.icon}
                            {prioConfig.label}
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-black text-white tracking-tight leading-snug">
                        {cleanTitle}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-6 md:p-7 space-y-5 overflow-y-auto custom-scrollbar flex-1">
                  {/* Banner Image (Only shown if bannerUrl exists) */}
                  {banner ? (
                    <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-lg group">
                      <img 
                        src={banner} 
                        alt={cleanTitle} 
                        className="w-full h-48 md:h-56 object-cover transform group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Hide image container on broken image link
                          (e.target as HTMLElement).parentElement?.classList.add('hidden');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />
                    </div>
                  ) : null}

                  {/* Short Summary (Kısa Özet / Bildirim Metni) - Only shown if distinct from detailed content */}
                  {(() => {
                    const sum = (selectedNotification.summary || '').trim();
                    const det = (selectedNotification.content || selectedNotification.message || '').trim();
                    if (!sum || sum === det) return null;

                    return (
                      <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl text-xs text-purple-200/90 leading-relaxed font-medium flex items-start gap-3">
                        <Sparkles size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-0.5">Kısa Özet</span>
                          <p>{sum}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Detailed Content (Duyuru Detay İçeriği) */}
                  <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Tag size={13} className="text-purple-400" />
                      Duyuru Detay İçeriği
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-normal">
                      {selectedNotification.content || selectedNotification.message}
                    </p>
                  </div>

                  {/* Timestamp Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-2">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={13} /> {formatTime(selectedNotification.createdAt)}
                    </span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Okundu
                    </span>
                  </div>
                </div>

                {/* Modal Action Footer */}
                <div className="p-5 md:p-6 bg-slate-950/60 border-t border-white/5 flex items-center justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Kapat
                  </button>

                  {/* Action Link Button (ONLY rendered if actionUrl / link exists) */}
                  {actionTarget ? (
                    <button
                      onClick={() => handleRedirect(selectedNotification)}
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>{selectedNotification.actionLabel || 'Duyuru Detayına Git / İncele'}</span>
                      <ExternalLink size={15} />
                    </button>
                  ) : null}
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </>
  );
}
