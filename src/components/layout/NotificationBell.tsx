import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { notificationService, Notification } from '../../services/notificationService';

interface NotificationBellProps {
  notifications: Notification[];
}

export default function NotificationBell({ notifications }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    if (user?.uid) {
      await notificationService.markAllAsRead(user.uid);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await notificationService.deleteNotification(id);
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      notificationService.markAsRead(n.id);
    }
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-notification-modal', { detail: n }));
  };
  
  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/profil', { state: { activeTab: 'Bildirimler' } });
  };
  
  // Sadece son 5 bildirimi göster
  const displayNotifications = notifications.slice(0, 5);

  const getRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 60000); // in minutes
    if (diff < 1) return 'Şimdi';
    if (diff < 60) return `${diff} dk önce`;
    if (diff < 1440) return `${Math.floor(diff / 60)} saat önce`;
    return `${Math.floor(diff / 1440)} gün önce`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
      >
        <Bell size={20} className={isOpen ? 'text-emerald-400' : 'group-hover:rotate-12 transition-transform'} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-[10px] font-black text-white rounded-full flex items-center justify-center border-2 border-[#070b14] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-4 w-80 sm:w-96 bg-[#0c121e] border border-white/5 rounded-3xl shadow-2xl z-[100] overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Bildirimler</h3>
                <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                  {unreadCount > 0 ? `${unreadCount} Okunmamış İleti` : 'Tüm Bildirimler Okundu'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-colors flex items-center gap-1"
                >
                  <Check size={12} /> Hepsini Oku
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {displayNotifications.length > 0 ? (
                <div className="divide-y divide-white/5">
                  {displayNotifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-5 hover:bg-white/[0.02] transition-colors cursor-pointer group relative ${!n.isRead ? 'bg-emerald-500/[0.02]' : ''}`}
                    >
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-emerald-500" />
                      )}
                      <div className="flex justify-between gap-4">
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold mb-1 ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>
                            {n.title}
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            <Clock size={12} /> {getRelativeTime(n.createdAt)}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/5 rounded-lg text-slate-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center">
                  <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-slate-700 mx-auto mb-4 border border-white/5">
                    <Bell size={24} />
                  </div>
                  <p className="text-slate-500 font-medium italic text-sm">Hiç bildiriminiz bulunmuyor.</p>
                </div>
              )}
            </div>

            <button 
              onClick={handleViewAll}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] transition-all border-t border-white/5"
            >
              Tümünü Görüntüle
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
