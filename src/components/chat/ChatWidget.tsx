import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, X, Send, Loader2, User, Phone as PhoneIcon } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { collection, query, getDocs, where, doc, getDoc, onSnapshot, addDoc, serverTimestamp, updateDoc, orderBy, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';

function formatE164Phone(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  if (cleaned.startsWith("90")) cleaned = cleaned.substring(2);
  if (cleaned.length === 10) return `+90${cleaned}`;
  return phone;
}

export default function ChatWidget() {
  const { userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [spaces, setSpaces] = useState<any[]>([]);
  const [activeSpace, setActiveSpace] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [whatsappMsgs, setWhatsappMsgs] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const prevUnreadCount = useRef(0);

  // Dynamic user photo cache for chat participants
  const [userPhotos, setUserPhotos] = useState<Record<string, string>>({});
  const fetchedUidsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userData) return;

    const neededUids = new Set<string>();

    spaces.forEach(space => {
      if (space.participants) {
        space.participants.forEach((uid: string) => {
          neededUids.add(uid);
        });
      }
    });

    if (activeSpace?.participants) {
      activeSpace.participants.forEach((uid: string) => {
        neededUids.add(uid);
      });
    }

    messages.forEach(msg => {
      if (msg.senderId) {
        neededUids.add(msg.senderId);
      }
    });

    const uidsToFetch = Array.from(neededUids).filter(uid => !fetchedUidsRef.current.has(uid));

    if (uidsToFetch.length === 0) return;

    uidsToFetch.forEach(uid => fetchedUidsRef.current.add(uid));

    uidsToFetch.forEach(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserPhotos(prev => ({
            ...prev,
            [uid]: data.photoURL || ''
          }));
        }
      } catch (err) {
        console.error("Error fetching photo for user", uid, err);
      }
    });
  }, [spaces, activeSpace, messages, userData]);

  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880.00, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    let unsubscribeChats: (() => void) | undefined;

    if (userData) {
      setLoading(true);
      
      let q;
      if (userData.role === 'admin') {
        q = query(collection(db, 'chats'));
      } else {
        q = query(
          collection(db, 'chats'),
          where('participants', 'array-contains', userData.uid)
        );
      }
      
      unsubscribeChats = onSnapshot(q, (snapshot) => {
        const loadedSpaces = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort in memory to avoid requiring complex composite indexes
        loadedSpaces.sort((a: any, b: any) => {
          const timeA = a.updatedAt?.toMillis?.() || 0;
          const timeB = b.updatedAt?.toMillis?.() || 0;
          return timeB - timeA;
        });
        setSpaces(loadedSpaces);
        setLoading(false);
      }, (error) => {
        console.error("Error in chats listener:", error);
        setLoading(false);
      });

      if (userData.role === 'admin') {
        getDocs(query(collection(db, 'users'))).then(snapshot => {
          setAllUsers(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
        });
      }
    }

    return () => {
      if (unsubscribeChats) {
        unsubscribeChats();
      }
    };
  }, [userData]);

  useEffect(() => {
    const currentUnreadCount = spaces.reduce((sum, space) => sum + (space.unreadCount?.[userData?.uid || ''] || 0), 0);
    if (currentUnreadCount > prevUnreadCount.current) {
      playNotificationSound();
    }
    prevUnreadCount.current = currentUnreadCount;
  }, [spaces, userData]);

  const derivedSpaces = React.useMemo(() => {
    if (!userData || userData.role === 'admin') return spaces;
    const waSpace = {
      id: 'virtual-whatsapp',
      isVirtualWhatsApp: true,
      participantNames: { 'virtual-whatsapp': 'WhatsApp' },
      participants: [userData.uid, 'virtual-whatsapp'],
      lastMessage: 'Gönderilen ve alınan WhatsApp mesajları',
      updatedAt: null,
      unreadCount: {}
    };
    return [waSpace, ...spaces];
  }, [spaces, userData]);

  useEffect(() => {
    if (activeSpace && userData) {
      let unsubscribeChat = () => {};
      let unsubscribeWa = () => {};

      if (!activeSpace.isVirtualWhatsApp) {
        const q = query(
          collection(db, `chats/${activeSpace.id}/messages`),
          orderBy('createdAt', 'asc')
        );
        unsubscribeChat = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(msgs);
          setTimeout(() => {
            if (chatContainerRef.current) {
              chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }
          }, 100);
        }, (error) => {
          console.error("Error in messages listener:", error);
        });
      } else {
        setMessages([]);
      }

      let targetPhone = '';
      if (activeSpace.isVirtualWhatsApp) {
         targetPhone = userData.phone || userData.phoneNumber || userData.parentPhone || '';
      } else if (userData.role === 'admin') {
         const otherUserId = activeSpace.participants.find((p: string) => p !== userData.uid);
         const otherUser = allUsers.find(u => u.id === otherUserId);
         if (otherUser) {
           targetPhone = otherUser.phone || otherUser.phoneNumber || otherUser.parentPhone || '';
         }
      }

      if (targetPhone) {
        const cleanPhone = formatE164Phone(targetPhone);
        if (cleanPhone) {
          const waQ = query(
            collection(db, 'whatsapp_messages'),
            where('phone', '==', cleanPhone)
          );
          unsubscribeWa = onSnapshot(waQ, (snapshot) => {
            const wMsgs = snapshot.docs.map(doc => ({ id: doc.id, isWhatsApp: true, ...doc.data() }));
            setWhatsappMsgs(wMsgs);
            setTimeout(() => {
              if (chatContainerRef.current) {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
              }
            }, 100);
          }, (err) => console.error("Error in whatsapp listener:", err));
        }
      } else {
        setWhatsappMsgs([]);
      }

      return () => {
        unsubscribeChat();
        unsubscribeWa();
      };
    }
  }, [activeSpace, userData, allUsers]);

  const combinedMessages = React.useMemo(() => {
    if (!activeSpace) return [];
    const combined = [...messages];
    whatsappMsgs.forEach(wa => {
      const t = wa.timestamp?.toDate ? wa.timestamp.toDate() : (wa.timestamp ? new Date(wa.timestamp) : new Date());
      combined.push({
        id: wa.id,
        isWhatsApp: true,
        text: wa.body,
        senderId: wa.direction === 'inbound' ? 'whatsapp_user' : 'whatsapp_system',
        senderName: wa.direction === 'inbound' ? (wa.senderName || 'Kullanıcı (WhatsApp)') : 'Sistem (WhatsApp)',
        createdAt: { toDate: () => t },
        direction: wa.direction
      });
    });

    return combined.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tA - tB;
    });
  }, [messages, whatsappMsgs, activeSpace]);

  useEffect(() => {
    if (activeSpace && userData && !activeSpace.isVirtualWhatsApp) {
      const currentSpace = spaces.find(s => s.id === activeSpace.id);
      if (currentSpace && currentSpace.unreadCount?.[userData.uid] > 0) {
        updateDoc(doc(db, 'chats', activeSpace.id), {
          [`unreadCount.${userData.uid}`]: 0
        }).catch(console.error);
      }
    }
  }, [spaces, activeSpace, userData]);

  const handleSpaceClick = async (space: any) => {
    setActiveSpace(space);
    if (userData && !space.isVirtualWhatsApp && (space.unreadCount?.[userData.uid] > 0 || space.unreadCount?.[userData.uid] === undefined)) {
      try {
        await updateDoc(doc(db, 'chats', space.id), {
          [`unreadCount.${userData.uid}`]: 0
        });
      } catch (e) {
        console.error("Error resetting unread count:", e);
      }
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeSpace || !userData) return;
    
    const msgText = newMessage.trim();
    setNewMessage('');
    
    try {
      await addDoc(collection(db, `chats/${activeSpace.id}/messages`), {
        text: msgText,
        senderId: userData.uid,
        senderName: `${userData.firstName} ${userData.lastName}`,
        createdAt: serverTimestamp()
      });
      
      const updateData: any = {
        updatedAt: serverTimestamp(),
        lastMessage: msgText
      };
      
      activeSpace.participants.forEach((p: string) => {
        if (p !== userData.uid) {
          updateData[`unreadCount.${p}`] = increment(1);
        }
      });
      
      await updateDoc(doc(db, 'chats', activeSpace.id), updateData);
    } catch (e) {
      console.error(e);
    }
  };

  const loadContacts = async () => {
    if (!userData) return;
    try {
      setLoading(true);
      setIsCreatingChat(true);
      const contactsList: any[] = [];
      const role = userData.role;

      if (role !== 'admin') {
        const qAdmins = query(collection(db, 'users'), where('role', '==', 'admin'));
        const adminDocs = await getDocs(qAdmins);
        adminDocs.forEach(d => {
          if (d.id !== userData.uid) contactsList.push({ id: d.id, ...d.data() });
        });
      }

      if (role === 'admin') {
        const qAll = query(collection(db, 'users'));
        const allDocs = await getDocs(qAll);
        allDocs.forEach(d => {
          if (d.id !== userData.uid) contactsList.push({ id: d.id, ...d.data() });
        });
      } else if (role === 'coach') {
        const qStudents = query(collection(db, 'users'), where('coachId', '==', userData.uid));
        const stdDocs = await getDocs(qStudents);
        stdDocs.forEach(d => {
           contactsList.push({ id: d.id, ...d.data() });
        });
      } else if (role === 'student' || role === 'parent') {
        let targetCoachId = null;
        if (role === 'student') {
          targetCoachId = userData.coachId;
        } else if (role === 'parent' && userData.studentUid) {
          const studentDoc = await getDoc(doc(db, 'users', userData.studentUid));
          if (studentDoc.exists()) {
             targetCoachId = studentDoc.data().coachId;
          }
        }
        
        if (targetCoachId) {
          const coachDoc = await getDoc(doc(db, 'users', targetCoachId));
          if (coachDoc.exists()) {
             contactsList.push({ id: coachDoc.id, ...coachDoc.data() });
          }
        }
      }

      const uniqueContacts = Array.from(new Map(contactsList.map(item => [item.id, item])).values());
      setContacts(uniqueContacts);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const startChatWith = async (contact: any) => {
    if (!userData) return;
    try {
      setLoading(true);
      
      // Check if chat already exists
      const existingChat = spaces.find(s => 
        s.participants.includes(userData.uid) && 
        s.participants.includes(contact.id) &&
        s.participants.length === 2
      );
      
      if (existingChat) {
        setIsCreatingChat(false);
        setActiveSpace(existingChat);
        setLoading(false);
        return;
      }
      
      // Create new chat
      const chatData = {
        participants: [userData.uid, contact.id],
        participantNames: {
          [userData.uid]: `${userData.firstName} ${userData.lastName}`,
          [contact.id]: `${contact.firstName} ${contact.lastName}`
        },
        participantRoles: {
          [userData.uid]: userData.role,
          [contact.id]: contact.role
        },
        unreadCount: {
          [userData.uid]: 0,
          [contact.id]: 0
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'chats'), chatData);
      setIsCreatingChat(false);
      setActiveSpace({ id: docRef.id, ...chatData });
      
    } catch (e: any) {
      console.error(e);
      alert('Sohbet oluşturulamadı: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const totalUnreadCount = spaces.reduce((sum, space) => {
    return sum + (space.unreadCount?.[userData.uid] || 0);
  }, 0);

  if (!userData) return null;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-full hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
        aria-label="Sohbet"
      >
        <MessageSquare size={20} />
        {totalUnreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-slate-900">
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </span>
        )}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-sm h-full bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50 backdrop-blur-md shrink-0">
              <h3 className="font-bold text-white flex items-center gap-2">
                <MessageSquare size={18} className="text-blue-400" />
                Sohbet
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loading && !activeSpace && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                </div>
              )}

              {!activeSpace && !loading && !isCreatingChat && (
                <div className="space-y-4">
                  {userData.role === 'admin' && (
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Kullanıcı veya mesaj ara..."
                        className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Sohbetler</div>
                      <button
                        onClick={loadContacts}
                        className="text-xs text-blue-400 hover:text-blue-300 font-bold"
                      >
                        + Yeni
                      </button>
                    </div>
                    {(() => {
                      const queryStr = searchQuery.trim().toLowerCase();
                      const isSearching = queryStr.length > 1;
                      
                      const displaySpaces = (userData.role === 'admin' && isSearching) ? derivedSpaces.filter(s => {
                        let names = '';
                        if (s.participants.includes(userData.uid)) {
                          const otherParticipantId = s.participants.find((p: string) => p !== userData.uid);
                          names = (s.participantNames?.[otherParticipantId] || '').toLowerCase();
                        } else {
                          names = Object.values(s.participantNames || {}).join(' ').toLowerCase();
                        }
                        const lastMsg = (s.lastMessage || '').toLowerCase();
                        return names.includes(queryStr) || lastMsg.includes(queryStr);
                      }) : derivedSpaces;

                      const displayUsers = (userData.role === 'admin' && isSearching) ? allUsers.filter(u => 
                        u.id !== userData.uid &&
                        ((u.firstName || '').toLowerCase().includes(queryStr) || 
                         (u.lastName || '').toLowerCase().includes(queryStr) ||
                         (u.email || '').toLowerCase().includes(queryStr))
                      ) : [];

                      return (
                        <>
                          {displaySpaces.length > 0 ? (
                            displaySpaces.map(space => {
                              let otherName = 'Sohbet';
                              let otherRole = undefined;
                              let otherPhoto = null;
                              if (space.isVirtualWhatsApp) {
                                otherName = 'WhatsApp (SMS Geçmişi)';
                                otherPhoto = null;
                              } else if (space.participants.includes(userData.uid)) {
                                const otherParticipantId = space.participants.find((p: string) => p !== userData.uid);
                                otherName = space.participantNames?.[otherParticipantId] || 'Sohbet';
                                otherRole = space.participantRoles?.[otherParticipantId];
                                otherPhoto = otherParticipantId ? userPhotos[otherParticipantId] : null;
                              } else {
                                otherName = Object.values(space.participantNames || {}).join(' & ');
                              }
                              
                              return (
                                <button 
                                  key={space.id}
                                  onClick={() => handleSpaceClick(space)}
                                  className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3"
                                >
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${space.isVirtualWhatsApp ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
                                    {space.isVirtualWhatsApp ? (
                                      <MessageSquare size={16} className="text-emerald-400" />
                                    ) : otherPhoto ? (
                                      <img src={otherPhoto} alt={otherName} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={16} className="text-blue-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 truncate">
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 truncate">
                                        <h4 className="text-sm font-semibold text-white truncate">{otherName}</h4>
                                        {otherRole === 'admin' && (
                                          <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                                            Yönetici
                                          </span>
                                        )}
                                      </div>
                                      {space.unreadCount?.[userData.uid] > 0 && (
                                        <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                          {space.unreadCount[userData.uid]}
                                        </span>
                                      )}
                                    </div>
                                    {space.lastMessage && (
                                      <p className={`text-xs truncate mt-0.5 ${space.unreadCount?.[userData.uid] > 0 ? 'text-white font-medium' : 'text-slate-400'}`}>
                                        {space.lastMessage}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              );
                            })
                          ) : !isSearching ? (
                            <div className="text-center py-8">
                              <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                              <p className="text-sm text-slate-400 mb-4">Henüz bir sohbet bulunamadı.</p>
                              <button 
                                onClick={loadContacts}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                Yeni Sohbet Oluştur
                              </button>
                            </div>
                          ) : null}

                          {isSearching && userData.role === 'admin' && displayUsers.length > 0 && (
                            <div className="mt-6">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Kullanıcılar</div>
                              {displayUsers.map(contact => (
                                <button 
                                  key={contact.id}
                                  onClick={() => startChatWith(contact)}
                                  className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3"
                                >
                                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                                    {contact.photoURL ? (
                                      <img src={contact.photoURL} alt={`${contact.firstName} ${contact.lastName}`} className="w-full h-full object-cover" />
                                    ) : (
                                      <User size={16} className="text-slate-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 truncate">
                                      <h4 className="text-sm font-semibold text-white truncate">{contact.firstName} {contact.lastName}</h4>
                                      {contact.role === 'admin' && (
                                        <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                                          Yönetici
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400 capitalize">{contact.role === 'coach' ? 'Koç' : contact.role === 'admin' ? 'Yönetici' : contact.role === 'parent' ? 'Veli' : 'Öğrenci'}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {isSearching && displaySpaces.length === 0 && displayUsers.length === 0 && (
                            <div className="text-center py-8">
                              <p className="text-sm text-slate-400">Sonuç bulunamadı.</p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              {!activeSpace && !loading && isCreatingChat && (
                <div className="space-y-2 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={() => {
                        setIsCreatingChat(false);
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
                    >
                      &larr; Sohbetlere Dön
                    </button>
                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kişiler</div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                    {contacts.length > 0 ? (
                      contacts.map(contact => (
                        <button 
                          key={contact.id}
                          onClick={() => startChatWith(contact)}
                          className="w-full text-left p-3 rounded-xl hover:bg-white/5 transition-colors flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {contact.photoURL ? (
                              <img src={contact.photoURL} alt={`${contact.firstName} ${contact.lastName}`} className="w-full h-full object-cover" />
                            ) : (
                              <User size={16} className="text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 truncate">
                              <h4 className="text-sm font-semibold text-white truncate">{contact.firstName} {contact.lastName}</h4>
                              {contact.role === 'admin' && (
                                <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                                  Yönetici
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 capitalize">{contact.role === 'coach' ? 'Koç' : contact.role === 'admin' ? 'Yönetici' : contact.role === 'parent' ? 'Veli' : 'Öğrenci'}</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">İletişime geçebileceğiniz kişi bulunamadı.</p>
                    )}
                  </div>
                </div>
              )}

              {activeSpace && !isCreatingChat && (
                <div className="flex flex-col h-full">
                  <button 
                    onClick={() => setActiveSpace(null)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold mb-4 flex items-center gap-1 shrink-0"
                  >
                    &larr; Sohbetlere Dön
                  </button>
                  <div className="flex items-center gap-2.5 mb-4 shrink-0">
                    {(() => {
                      if (activeSpace.isVirtualWhatsApp) {
                        return (
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                            <MessageSquare size={14} className="text-emerald-400" />
                          </div>
                        );
                      }
                      if (activeSpace.participants.includes(userData.uid)) {
                        const otherParticipantId = activeSpace.participants.find((p: string) => p !== userData.uid);
                        const otherPhoto = otherParticipantId ? userPhotos[otherParticipantId] : null;
                        const otherName = activeSpace.participantNames?.[otherParticipantId] || 'Sohbet';
                        return otherPhoto ? (
                          <img src={otherPhoto} alt={otherName} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                            <User size={14} className="text-blue-400" />
                          </div>
                        );
                      }
                      return (
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                          <User size={14} className="text-blue-400" />
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-bold truncate">
                          {activeSpace.isVirtualWhatsApp
                            ? 'WhatsApp (SMS Geçmişi)'
                            : activeSpace.participants.includes(userData.uid) 
                            ? (activeSpace.participantNames?.[activeSpace.participants.find((p: string) => p !== userData.uid)] || 'Sohbet')
                            : Object.values(activeSpace.participantNames || {}).join(' & ')}
                        </h4>
                        {activeSpace.participants.includes(userData.uid) && activeSpace.participantRoles?.[activeSpace.participants.find((p: string) => p !== userData.uid)] === 'admin' && (
                          <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                            Yönetici
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    ref={chatContainerRef}
                    data-no-auto-scroll-top="true"
                    className="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2"
                  >
                    {combinedMessages.length > 0 ? (
                      combinedMessages.map(msg => {
                        let isMe = msg.senderId === userData.uid;
                        if (msg.isWhatsApp) {
                           if (userData.role === 'admin') {
                             isMe = msg.direction === 'outbound'; // For admin, outbound is "me" (system)
                           } else {
                             isMe = msg.direction === 'inbound'; // For user, inbound is "me" (what they sent)
                           }
                        }
                        return (
                          <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isMe ? 'flex-row-reverse self-end' : 'flex-row self-start'}`}>
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 mt-1 bg-slate-800 flex items-center justify-center">
                              {isMe ? (
                                userData.photoURL ? (
                                  <img src={userData.photoURL} alt="Ben" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-[10px] text-white font-bold">
                                    {userData.firstName?.[0]?.toUpperCase() || 'B'}
                                  </div>
                                )
                              ) : (
                                userPhotos[msg.senderId] ? (
                                  <img src={userPhotos[msg.senderId]} alt={msg.senderName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold">
                                    {msg.senderName?.[0]?.toUpperCase() || 'U'}
                                  </div>
                                )
                              )}
                            </div>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              {!isMe && activeSpace.participantRoles?.[msg.senderId] === 'admin' && (
                                <span className="bg-purple-500/20 text-purple-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold mb-1">
                                  Yönetici
                                </span>
                              )}
                              <div className={`p-3 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'} ${msg.isWhatsApp ? 'border border-emerald-500/30' : ''}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                {msg.isWhatsApp && <MessageSquare size={10} className="text-emerald-400" />}
                                {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'}) : 'Şimdi'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-xs text-slate-500 text-center">Henüz mesaj yok.</p>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {!activeSpace.isVirtualWhatsApp && (
                    <form onSubmit={sendMessage} className="flex gap-2 shrink-0">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Mesaj yazın..."
                        className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button 
                        type="submit"
                        disabled={!newMessage.trim() || loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}