import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { notificationService, Notification } from '../../services/notificationService';
import { Bell, CheckCircle2, Circle, Calendar, Info, MessageSquare, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NotificationsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
    }
  }, [user?.uid]);

  const loadNotifications = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      const data = await notificationService.getNotifications(user.uid);
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string, currentStatus: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentStatus) return;
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    try {
      await notificationService.markAllAsRead(user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification", error);
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationService.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      } catch (e) { }
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'appointment': return <Calendar className="w-5 h-5 text-indigo-400" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'system': return <Info className="w-5 h-5 text-blue-400" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Bell className="w-6 h-6 text-indigo-400" />
            Bildirimler
            {unreadCount > 0 && (
              <span className="bg-indigo-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadCount} Yeni
              </span>
            )}
          </h2>
          <p className="text-slate-400 text-sm mt-1">Sistem ve randevu bildirimlerinizi buradan takip edebilirsiniz.</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            Tümünü Okundu İşaretle
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700/50">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-medium">Henüz hiçbir bildiriminiz yok.</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id}
              onClick={() => handleClick(notification)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex gap-4 \${
                notification.isRead 
                  ? 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800/60' 
                  : 'bg-indigo-900/20 border-indigo-500/30 hover:bg-indigo-900/40 relative overflow-hidden'
              }`}
            >
              {!notification.isRead && (
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              )}
              
              <div className={`mt-1 w-10 h-10 shrink-0 rounded-full flex items-center justify-center \${
                notification.isRead ? 'bg-slate-800 text-slate-400' : 'bg-indigo-500/20 text-indigo-400'
              }`}>
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`font-bold truncate \${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
                    {notification.title}
                  </h4>
                  <span className="text-xs text-slate-500 shrink-0 whitespace-nowrap">
                    {new Date(notification.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className={`text-sm \${notification.isRead ? 'text-slate-500' : 'text-slate-300'}`}>
                  {notification.message}
                </p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={(e) => handleMarkAsRead(notification.id, notification.isRead, e)}
                  title={notification.isRead ? "Okundu" : "Okundu olarak işaretle"}
                  className={`p-2 rounded-lg transition-colors \${
                    notification.isRead ? 'text-slate-600 cursor-default' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'
                  }`}
                >
                  {notification.isRead ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <button 
                  onClick={(e) => handleDelete(notification.id, e)}
                  title="Sil"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
