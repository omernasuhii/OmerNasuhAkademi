import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Inbox, Search, ExternalLink, Calendar, CheckCircle2, ChevronRight, MessageCircle, Phone, Mail, Briefcase, Send, X, Paperclip, FileText, Image as ImageIcon, Download, Video, Music, ChevronDown, Plus, Trash2, Edit2, Check, AlertCircle, Smartphone, Sparkles, Command, Info, ArrowLeft, RefreshCw, Eye, Radio, Copy, ShieldCheck, Terminal, Globe, Activity, Lock, Key, Clock } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { db, storage } from '../../lib/firebase';

interface InboxMessage {
  id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  topic: string;
  message?: string;
  status: 'new' | 'read' | 'resolved';
  type: string;
  coachId?: string;
  coachName?: string;
  createdAt: any;
  assignedDate?: string;
  assignedTime?: string;
}

interface WhatsAppMessage {
  id: string;
  phone: string;
  body: string;
  senderName: string | null;
  direction: 'inbound' | 'outbound';
  timestamp: any;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | string;
  fileName?: string;
  fileSize?: string;
}

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  headerType: 'TEXT' | 'IMAGE' | 'NONE';
  headerText?: string;
  body: string;
  footer?: string;
  buttons?: { type: 'URL' | 'QUICK_REPLY'; text: string; value?: string }[];
  createdAt: any;
}

export default function AdminInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTab = searchParams.get('tab');

  const [whatsAppSubTab, setWhatsAppSubTab] = useState<'all' | 'admin' | 'status'>('all');

  // Twilio WhatsApp Integration & Webhook Status states
  const [twilioAccountSid, setTwilioAccountSid] = useState('');
  const [twilioAuthToken, setTwilioAuthToken] = useState('');
  const [twilioWhatsappNumber, setTwilioWhatsappNumber] = useState('');
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [savingTwilioSettings, setSavingTwilioSettings] = useState(false);
  const [twilioStatus, setTwilioStatus] = useState<any>(null);
  const [twilioStatusLoading, setTwilioStatusLoading] = useState(false);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);
  const [webhookLogsLoading, setWebhookLogsLoading] = useState(false);
  const [selectedWebhookLog, setSelectedWebhookLog] = useState<any>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Testing WhatsApp sending
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [testMessageBody, setTestMessageBody] = useState('FocusON Akademi Twilio WhatsApp test mesajıdır.');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Haftalık Otomatik WhatsApp Raporu State'leri
  const [isTriggeringWeeklyReports, setIsTriggeringWeeklyReports] = useState(false);
  const [weeklyReportLogMessage, setWeeklyReportLogMessage] = useState<string | null>(null);

  // Sadece 1 Öğrencide Test Etme State'leri
  const [singleTestStudentId, setSingleTestStudentId] = useState('demo_student_1');
  const [singleTestCustomName, setSingleTestCustomName] = useState('');
  const [singleTestPhone, setSingleTestPhone] = useState('');
  const [isSingleTesting, setIsSingleTesting] = useState(false);
  const [singleTestResult, setSingleTestResult] = useState<any>(null);
  const [firestoreStudents, setFirestoreStudents] = useState<{ id: string; name: string; phone: string }[]>([]);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const q = query(collection(db, 'users'));
        const snap = await getDocs(q);
        const list: { id: string; name: string; phone: string }[] = [];
        snap.forEach(d => {
          const u = d.data();
          if (u.role === 'student' || !u.role) {
            const rawName = u.name || u.displayName || u.fullName || u.studentName || 
                            (u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : '') || 
                            (u.email ? u.email.split('@')[0] : '') || 'Öğrenci';
            list.push({
              id: d.id,
              name: rawName,
              phone: u.parentPhone || u.phone || u.phoneNumber || ''
            });
          }
        });
        setFirestoreStudents(list);
      } catch (e) {
        console.log("Students fetch note:", e);
      }
    };
    loadStudents();
  }, []);

  const handleRunSingleStudentTest = async () => {
    setIsSingleTesting(true);
    setSingleTestResult(null);
    try {
      const selectedStudentObj = firestoreStudents.find(s => s.id === singleTestStudentId);
      const studentName = singleTestCustomName.trim() || selectedStudentObj?.name || (singleTestStudentId === 'demo_student_2' ? 'Zeynep Kaya' : 'Ahmet Yılmaz');
      
      const res = await fetch('/api/send-weekly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: singleTestStudentId,
          parentPhone: singleTestPhone.trim() || selectedStudentObj?.phone || undefined,
          studentName,
          force: true
        })
      });
      const data = await res.json();
      if (res.ok && data.logs && data.logs.length > 0) {
        setSingleTestResult({
          success: true,
          message: data.message,
          log: data.logs[0]
        });
      } else {
        setSingleTestResult({
          success: false,
          error: data.error || 'Test sırasında bir hata oluştu.'
        });
      }
    } catch (err: any) {
      setSingleTestResult({
        success: false,
        error: err.message
      });
    } finally {
      setIsSingleTesting(false);
    }
  };

  const handleTriggerWeeklyReports = async () => {
    setIsTriggeringWeeklyReports(true);
    setWeeklyReportLogMessage(null);
    try {
      const res = await fetch('/api/send-weekly-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      if (res.ok) {
        setWeeklyReportLogMessage(`✅ ${data.message} (Toplam İşlenen Öğrenci: ${data.totalStudents || 0})`);
      } else {
        setWeeklyReportLogMessage(`⚠️ Hata: ${data.error || 'Rapor oluşturulamadı.'}`);
      }
    } catch (err: any) {
      setWeeklyReportLogMessage(`⚠️ Gönderim hatası: ${err.message}`);
    } finally {
      setIsTriggeringWeeklyReports(false);
    }
  };

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [whatsappMessages, setWhatsAppMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'resolved'>('all');
  const [activeTab, setActiveTab] = useState<'forms' | 'contact' | 'hr' | 'whatsapp'>(() => {
    if (queryTab && ['forms', 'contact', 'hr', 'whatsapp'].includes(queryTab)) {
      return queryTab as any;
    }
    return 'forms';
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [hasSetDefaultTab, setHasSetDefaultTab] = useState(false);

  // Sync state if query parameter changes externally (e.g. from sidebar clicks)
  useEffect(() => {
    if (queryTab && ['forms', 'contact', 'hr', 'whatsapp'].includes(queryTab)) {
      setActiveTab(queryTab as any);
    }
  }, [queryTab]);

  const handleTabChange = (tabId: 'forms' | 'contact' | 'hr' | 'whatsapp') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };
  
  // WhatsApp Chat states
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [whatsAppSearchTerm, setWhatsAppSearchTerm] = useState('');
  const [chatInputText, setChatInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    name: string;
    size: string;
    previewUrl?: string;
    type: 'document' | 'image' | 'audio' | 'video';
  } | null>(null);

  // System users and current ticking time states
  const [systemUsers, setSystemUsers] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  const findMatchedUser = (phone: string) => {
    if (!phone) return null;
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return null;

    // Compare suffixes of last 10 digits to robustly match numbers across different prefixes
    const suffix = cleanPhone.slice(-10);
    if (suffix.length < 10) return null;

    return systemUsers.find(u => {
      const uPhone = (u.phone || '').replace(/\D/g, '');
      return uPhone && uPhone.slice(-10) === suffix;
    });
  };

  const fetchMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const q = query(collection(db, 'inbox_messages'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboxMessage));
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchWhatsAppMessages = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const q = query(collection(db, 'whatsapp_messages'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppMessage));
      setWhatsAppMessages(data);
    } catch (err) {
      console.error('Error fetching whatsapp messages:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      await Promise.all([
        fetchMessages(false),
        fetchWhatsAppMessages(false)
      ]);
    } catch (err) {
      console.error('Error fetching all data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    
    // Live listener for inbox_messages
    const qMessages = query(collection(db, 'inbox_messages'), orderBy('createdAt', 'desc'));
    const unsubscribeMessages = onSnapshot(qMessages, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InboxMessage));
      setMessages(data);
      setLoading(false);
    }, (err) => {
      console.error('Error listening to messages:', err);
      setLoading(false);
    });

    // Live listener for whatsapp_messages
    const qWA = query(collection(db, 'whatsapp_messages'), orderBy('timestamp', 'desc'));
    const unsubscribeWA = onSnapshot(qWA, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppMessage));
      setWhatsAppMessages(data);
    }, (err) => {
      console.error('Error listening to whatsapp messages:', err);
    });

    // Live listener for system users
    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSystemUsers(data);
    }, (err) => {
      console.error('Error listening to system users:', err);
    });

    // 1-second timer interval for counting down active 24-hour windows
    const timeInterval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      unsubscribeMessages();
      unsubscribeWA();
      unsubscribeUsers();
      clearInterval(timeInterval);
    };
  }, []);

  // Click outside listener for the dropdown menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Twilio Settings & Status Fetchers
  const fetchTwilioSettings = async () => {
    setTwilioStatusLoading(true);
    try {
      const res = await fetch('/api/whatsapp-settings');
      if (res.ok) {
        const data = await res.json();
        setTwilioAccountSid(data.accountSid || '');
        setTwilioWhatsappNumber(data.whatsappNumber || '');
        setTwilioStatus(data);
      }
    } catch (err) {
      console.error('Twilio settings fetch error:', err);
    } finally {
      setTwilioStatusLoading(false);
    }
  };

  const saveTwilioSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTwilioSettings(true);
    try {
      const res = await fetch('/api/whatsapp-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountSid: twilioAccountSid.trim(),
          authToken: twilioAuthToken.trim(),
          whatsappNumber: twilioWhatsappNumber.trim()
        })
      });
      if (res.ok) {
        alert('Twilio WhatsApp ayarları başarıyla kaydedildi!');
        fetchTwilioSettings();
      } else {
        const err = await res.json();
        alert('Hata: ' + (err.error || 'Ayarlar kaydedilemedi.'));
      }
    } catch (err: any) {
      alert('Ayarlar kaydedilirken hata oluştu: ' + err.message);
    } finally {
      setSavingTwilioSettings(false);
    }
  };

  const handleSendTestTwilioMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber.trim()) {
      alert('Lütfen bir alıcı telefon numarası girin.');
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhoneNumber.trim(),
          phone: testPhoneNumber.trim(),
          message: testMessageBody.trim() || 'FocusOn Akademi Twilio WhatsApp Test Mesajı'
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Test mesajı başarıyla gönderildi!\nİletim Yöntemi: ${data.method === 'twilio' ? 'Canlı Twilio API' : 'Simülasyon Modu'}\nMesaj ID: ${data.messageId || '-'}`);
      } else {
        alert('Gönderim hatası: ' + (data.error || 'Mesaj gönderilemedi.'));
      }
    } catch (err: any) {
      alert('Gönderim hatası: ' + err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'whatsapp' && whatsAppSubTab === 'status') {
      fetchTwilioSettings();
      setWebhookLogsLoading(true);
      const qLogs = query(collection(db, 'whatsapp_webhook_logs'), orderBy('timestamp', 'desc'), limit(50));
      const unsubscribe = onSnapshot(qLogs, (snapshot) => {
        const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setWebhookLogs(logs);
        setWebhookLogsLoading(false);
      }, (err) => {
        console.error('Webhook logs snapshot error:', err);
        setWebhookLogsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab, whatsAppSubTab]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleResolveEscalation = async (phone: string) => {
    try {
      const conversation = conversations.find(c => c.phone === phone);
      if (!conversation) return;
      
      const payload = {
        phone: phone,
        body: "💬 Yönetici görüşmeyi tamamladı. Akıllı asistanımız tekrar aktif hale getirildi.",
        senderName: "Sistem",
        direction: 'outbound' as const,
        timestamp: new Date()
      };
      await addDoc(collection(db, 'whatsapp_messages'), payload);
      alert("Yönetici talebi çözümlendi ve akıllı asistan tekrar devreye sokuldu.");
      fetchWhatsAppMessages(false);
    } catch (err) {
      console.error("Error resolving escalation:", err);
      alert("Hata oluştu.");
    }
  };

  // Set default active tab based on highest notification count once initial load completes (only if not specified in URL)
  useEffect(() => {
    if (!queryTab && !loading && !hasSetDefaultTab && (messages.length > 0 || whatsappMessages.length > 0)) {
      const formsCount = messages.filter(m => m.type !== 'contact_message' && m.type !== 'hr_application' && m.status === 'new').length;
      const contactCount = messages.filter(m => m.type === 'contact_message' && m.status === 'new').length;
      const hrCount = messages.filter(m => m.type === 'hr_application' && m.status === 'new').length;
      const whatsappCount = whatsappMessages.filter(m => m.direction === 'inbound').length;

      const tabsByCount = [
        { id: 'forms' as const, count: formsCount },
        { id: 'contact' as const, count: contactCount },
        { id: 'hr' as const, count: hrCount },
        { id: 'whatsapp' as const, count: whatsappCount }
      ];

      tabsByCount.sort((a, b) => b.count - a.count);
      
      // If there is any tab with notifications, select the highest one by default
      if (tabsByCount[0].count > 0) {
        setActiveTab(tabsByCount[0].id);
      }
      setHasSetDefaultTab(true);
    }
  }, [loading, messages, whatsappMessages, hasSetDefaultTab, queryTab]);

  const handleSendWhatsAppReply = async (phone: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, message: replyText })
      });
      if (!res.ok) {
        throw new Error('Failed to send message');
      }
      setReplyText('');
      setReplyingTo(null);
      fetchWhatsAppMessages(false); // Refresh silently
    } catch (err) {
      console.error('Error sending reply:', err);
      alert('Mesaj gönderilirken hata oluştu.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: 20MB
    if (file.size > 20 * 1024 * 1024) {
      alert("Seçilen dosya çok büyük. Lütfen 20 MB'tan küçük bir dosya seçin.");
      return;
    }

    let type: 'document' | 'image' | 'audio' | 'video' = 'document';
    if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
    } else if (file.type.startsWith('video/')) {
      type = 'video';
    }

    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 
      ? `${(sizeKB / 1024).toFixed(1)} MB` 
      : `${sizeKB} KB`;

    setSelectedFile({
      file,
      name: file.name,
      size: sizeStr,
      previewUrl: type === 'image' ? URL.createObjectURL(file) : undefined,
      type
    });
    e.target.value = '';
  };

  const handleSendDirectWhatsApp = async (phone: string, text: string) => {
    if ((!text.trim() && !selectedFile) || isSending) return;
    setIsSending(true);
    try {
      let mediaUrl = '';
      if (selectedFile) {
        // Upload to Firebase Storage
        const fileRef = ref(storage, `whatsapp_media/${Date.now()}_${selectedFile.name}`);
        const snapshot = await uploadBytes(fileRef, selectedFile.file);
        mediaUrl = await getDownloadURL(snapshot.ref);
      }

      const payload: any = {
        to: phone,
        message: text.trim() || (selectedFile ? `📎 [Belge: ${selectedFile.name}]` : '')
      };

      if (selectedFile && mediaUrl) {
        payload.mediaUrl = mediaUrl;
        payload.mediaType = selectedFile.type;
        payload.fileName = selectedFile.name;
        payload.fileSize = selectedFile.size;
      }

      const res = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to send message');
      }
      const resData = await res.json().catch(() => ({}));
      
      setChatInputText('');
      setSelectedFile(null);
      await fetchWhatsAppMessages(false); // Refresh messages to show the outbound message

      if (resData.metaAuthError) {
        alert("WhatsApp API Yetkilendirme Hatası (Meta OAuth Error 190): Erişim anahtarınızın (Token) süresi dolmuş. Mesajınız simülasyon modunda başarıyla kaydedildi, yapay zeka simüle edilmiş yanıtı gönderecektir.");
      }
    } catch (err) {
      console.error('Error sending direct reply:', err);
      alert('Mesaj gönderilirken hata oluştu.');
    } finally {
      setIsSending(false);
    }
  };

  const handletoggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'resolved' ? 'new' : 'resolved';
      await updateDoc(doc(db, 'inbox_messages', id), {
        status: newStatus
      });
      setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus as any } : m));
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = (
      msg.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const matchesFilter = filter === 'all' || msg.status === filter;
    
    const matchesTab = activeTab === 'forms'
      ? (msg.type !== 'contact_message' && msg.type !== 'hr_application')
      : activeTab === 'contact'
        ? (msg.type === 'contact_message')
        : (msg.type === 'hr_application');

    return matchesSearch && matchesFilter && matchesTab;
  });

  const filteredWhatsAppMessages = whatsappMessages.filter(msg => {
    return msg.phone.includes(searchTerm) || msg.body?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Group WhatsApp messages by phone to create chat sessions/conversations
  const conversationsMap: { [phone: string]: { phone: string; senderName: string; messages: WhatsAppMessage[]; lastMessage: WhatsAppMessage } } = {};

  whatsappMessages.forEach(msg => {
    if (!conversationsMap[msg.phone]) {
      conversationsMap[msg.phone] = {
        phone: msg.phone,
        senderName: msg.senderName || msg.phone,
        messages: [],
        lastMessage: msg
      };
    }
    conversationsMap[msg.phone].messages.push(msg);
  });

  const conversations = Object.values(conversationsMap).map(conv => {
    // Sort chronologically (oldest to newest) inside the thread
    const sortedMsgs = [...conv.messages].sort((a, b) => {
      const timeA = a.timestamp?.seconds || (a.timestamp?.toDate ? Math.floor(a.timestamp.toDate().getTime() / 1000) : 0);
      const timeB = b.timestamp?.seconds || (b.timestamp?.toDate ? Math.floor(b.timestamp.toDate().getTime() / 1000) : 0);
      return timeA - timeB;
    });

    const matchedUser = findMatchedUser(conv.phone);
    const hasMatch = !!matchedUser;
    
    const latestInboundMsg = [...conv.messages].find(m => m.direction === 'inbound' && m.senderName);
    const senderName = matchedUser 
      ? `${matchedUser.firstName} ${matchedUser.lastName}`
      : (latestInboundMsg?.senderName || conv.messages[0]?.senderName || conv.phone);

    return {
      ...conv,
      senderName,
      matchedUser,
      hasMatch,
      messages: sortedMsgs,
      lastMessage: conv.messages[0] // original query orders desc, so 0 index is the newest
    };
  });

  // Sort conversations so that the one with the newest message is at the very top
  conversations.sort((a, b) => {
    const timeA = a.lastMessage.timestamp?.seconds || (a.lastMessage.timestamp?.toDate ? Math.floor(a.lastMessage.timestamp.toDate().getTime() / 1000) : 0);
    const timeB = b.lastMessage.timestamp?.seconds || (b.lastMessage.timestamp?.toDate ? Math.floor(b.lastMessage.timestamp.toDate().getTime() / 1000) : 0);
    return timeB - timeA;
  });

  const isEscalated = (conv: typeof conversations[0]) => 
    conv.messages.some(m => m.body?.toLowerCase().includes('/yonetici') || (m as any).isEscalated || (m as any).isAdminMode || (m as any).mode === 'admin');

  const adminEscalatedCount = conversations.filter(isEscalated).length;

  const activeConversations = whatsAppSubTab === 'admin'
    ? conversations.filter(isEscalated)
    : conversations;

  const filteredConversations = activeConversations.filter(conv => {
    const term = whatsAppSearchTerm.toLowerCase().trim();
    if (!term) return true;
    return (
      conv.phone.includes(term) ||
      conv.senderName.toLowerCase().includes(term) ||
      conv.messages.some(m => m.body.toLowerCase().includes(term))
    );
  });

  const formsCount = messages.filter(m => m.type !== 'contact_message' && m.type !== 'hr_application' && m.status === 'new').length;
  const contactCount = messages.filter(m => m.type === 'contact_message' && m.status === 'new').length;
  const hrCount = messages.filter(m => m.type === 'hr_application' && m.status === 'new').length;
  const whatsappCount = whatsappMessages.filter(m => m.direction === 'inbound').length;

  const tabsConfig = [
    {
      id: 'forms' as const,
      label: 'Randevu Talepleri',
      icon: Inbox,
      count: formsCount,
      activeColor: 'bg-blue-600 text-white shadow-lg',
      badgeColor: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
    },
    {
      id: 'contact' as const,
      label: 'İletişim Mesajları',
      icon: Mail,
      count: contactCount,
      activeColor: 'bg-violet-600 text-white shadow-lg',
      badgeColor: 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
    },
    {
      id: 'hr' as const,
      label: 'İK Başvuruları',
      icon: Briefcase,
      count: hrCount,
      activeColor: 'bg-indigo-600 text-white shadow-lg',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
    },
    {
      id: 'whatsapp' as const,
      label: 'WhatsApp',
      icon: MessageCircle,
      count: whatsappCount,
      activeColor: 'bg-emerald-600 text-white shadow-lg',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
    }
  ];

  const activeTabConfig = tabsConfig.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold font-display text-white">Gelen Kutusu</h1>
            {activeTabConfig && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                activeTab === 'whatsapp' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : activeTab === 'forms' 
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                    : activeTab === 'contact' 
                      ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' 
                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {activeTabConfig.label}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">Ücretsiz randevu, İletişim talepleri ve WhatsApp mesajları.</p>
        </div>
      </div>

      {activeTab === 'whatsapp' ? (
        <div className="space-y-4">
          {/* WhatsApp Alt Sekmeleri */}
          <div className="flex border-b border-white/5 pb-1 gap-2 sm:gap-4 overflow-x-auto scrollbar-none shrink-0">
            <button
              onClick={() => setWhatsAppSubTab('all')}
              className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 px-2 whitespace-nowrap ${
                whatsAppSubTab === 'all'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageCircle size={16} />
              <span>Tüm Mesajlar</span>
              {whatsAppSubTab === 'all' && (
                <motion.div layoutId="waSubTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
            <button
              onClick={() => setWhatsAppSubTab('admin')}
              className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 px-2 whitespace-nowrap ${
                whatsAppSubTab === 'admin'
                  ? 'text-red-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertCircle size={16} />
              <span>Yönetici Mesajları</span>
              {adminEscalatedCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {adminEscalatedCount}
                </span>
              )}
              {whatsAppSubTab === 'admin' && (
                <motion.div layoutId="waSubTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setWhatsAppSubTab('status')}
              className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 px-2 whitespace-nowrap ${
                whatsAppSubTab === 'status'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio size={16} />
              <span>Twilio WhatsApp & Webhook Durumu</span>
              {whatsAppSubTab === 'status' && (
                <motion.div layoutId="waSubTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          </div>

          {whatsAppSubTab === 'status' ? (
            <div className="space-y-6">
              {/* Twilio Canlı Bağlantı Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl shadow-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Twilio API Bağlantısı</span>
                    <div className="mt-2 flex items-center gap-2">
                      {twilioStatusLoading ? (
                        <div className="animate-spin w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                      ) : twilioStatus?.twilioConnected ? (
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          Twilio API Aktif & Bağlı
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-full flex items-center gap-1.5">
                          Simülasyon Modu (Kimlik Bilgileri Eksik)
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={fetchTwilioSettings}
                    disabled={twilioStatusLoading}
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all"
                    title="Durumu Yenile"
                  >
                    <RefreshCw size={18} className={twilioStatusLoading ? "animate-spin" : ""} />
                  </button>
                </div>

                <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl shadow-xl">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Twilio WhatsApp Numarası</span>
                  <p className="text-lg font-bold text-white mt-1">
                    {twilioWhatsappNumber || 'Yapılandırılmadı'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sağlayıcı: <span className="text-emerald-400 font-semibold">Twilio Sandbox / Messaging Service</span>
                  </p>
                </div>

                <div className="bg-slate-900 border border-white/5 p-5 rounded-2xl shadow-xl">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Account SID</span>
                  <p className="text-sm font-mono font-bold text-slate-200 mt-1 truncate">
                    {twilioAccountSid ? `${twilioAccountSid.substring(0, 10)}...` : 'Yapılandırılmadı'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Durum: <span className="text-emerald-400 font-semibold">{twilioAccountSid ? 'Kayıtlı' : 'Eksik'}</span>
                  </p>
                </div>
              </div>

              {/* Twilio Webhook Yapılandırması */}
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl space-y-5">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Twilio Console Webhook Yapılandırması</h3>
                      <p className="text-xs text-slate-400">Gelen WhatsApp mesajları için Twilio Console URL adresi</p>
                    </div>
                  </div>
                  <a
                    href="https://console.twilio.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} />
                    <span>Twilio Console</span>
                  </a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe size={14} className="text-emerald-400" />
                        <span>Sabit Alan Adı Webhook URL</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded font-mono">Önerilen</span>
                    </label>
                    <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl overflow-hidden p-1">
                      <input
                        type="text"
                        readOnly
                        value="https://omernasuhakademi.com/api/whatsapp-webhook"
                        className="bg-transparent text-xs text-slate-200 px-3 py-1.5 w-full outline-none font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard("https://omernasuhakademi.com/api/whatsapp-webhook", 'webhookUrl')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedField === 'webhookUrl' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedField === 'webhookUrl' ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe size={14} className="text-blue-400" />
                        <span>Canlı Container Webhook URL</span>
                      </span>
                      <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 px-1.5 py-0.5 rounded font-mono">Doğrudan Bağlantı</span>
                    </label>
                    <div className="flex items-center bg-slate-950 border border-white/10 rounded-xl overflow-hidden p-1">
                      <input
                        type="text"
                        readOnly
                        value={`${window.location.origin}/api/whatsapp-webhook`}
                        className="bg-transparent text-xs text-slate-200 px-3 py-1.5 w-full outline-none font-mono text-[11px]"
                      />
                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/api/whatsapp-webhook`, 'directWebhookUrl')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                      >
                        {copiedField === 'directWebhookUrl' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedField === 'directWebhookUrl' ? 'Kopyalandı' : 'Kopyala'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4 text-xs text-slate-300 space-y-2">
                  <h4 className="font-bold text-emerald-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Info size={14} />
                    <span>Twilio WhatsApp Sandbox / Phone Number Kurulum Adımları</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 leading-relaxed">
                    <li><strong className="text-white">console.twilio.com</strong> adresine giriş yapın.</li>
                    <li><strong className="text-white">Messaging &gt; Settings &gt; WhatsApp sandbox settings</strong> bölümüne gidin.</li>
                    <li><strong className="text-white">"WHEN A MESSAGE COMES IN"</strong> alanına yukarıdaki Webhook URL adresini yapıştırın ve HTTP POST metodunu seçin.</li>
                    <li>Değişiklikleri kaydedin. Artık gelen WhatsApp mesajları doğrudan asistan robot tarafından işlenecektir.</li>
                  </ol>
                </div>
              </div>

              {/* OTOMATİK PAZARTESİ 10:00 HAFTALIK RAPOR SİSTEMİ KARTI */}
              <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
                      <Clock size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white">Otomatik Pazartesi 10:00 WhatsApp Veli Raporu</h3>
                        <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Zamanlayıcı Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Her Pazartesi saat 10:00'da tüm öğrencilerin verileri analiz edilir, PDF oluşturulur ve WhatsApp'tan iletilir.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerWeeklyReports}
                    disabled={isTriggeringWeeklyReports}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    {isTriggeringWeeklyReports ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Raporlar Oluşturuluyor & Gönderiliyor...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Hemen Rapor Oluştur & WhatsApp'tan Gönder</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 4 Temel Sistem Mimarisi Bileşeni */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-slate-950/80 border border-white/5 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center text-[11px]">1</span>
                      Zamanlayıcı Görev
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Her Pazartesi 10:00'da insan müdahalesi olmadan otomatik tetiklenen sunucu cron zamanlayıcısı.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-white/5 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-[11px]">2</span>
                      Yapay Zeka Analizi
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Gemini API ile son 7 günlük soru, deneme ve konu verilerinden pedagojik veli metni üretilir.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-white/5 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center text-[11px]">3</span>
                      Sunucu Tarafı PDF
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      jsPDF motoru ile kurum logolu, soru karneli ve grafikli resmi veli PDF raporu oluşturulur.
                    </p>
                  </div>

                  <div className="bg-slate-950/80 border border-white/5 p-3.5 rounded-xl space-y-1">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                      <span className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-[11px]">4</span>
                      WhatsApp İletimi
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Twilio WhatsApp Business API üzerinden PDF eki ile birlikte velinin telefonuna iletilir.
                    </p>
                  </div>
                </div>

                {/* SADECE 1 ÖĞRENCİDE TEST ETME PANELDEN KONTROL KUTUSU */}
                <div className="bg-slate-950/90 border border-emerald-500/30 p-4.5 rounded-xl space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                        Sadece 1 Öğrencide Sistem Test Paneli
                      </h4>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                      Tekil Test Modu
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        1) Öğrenci Seçin
                      </label>
                      <select
                        value={singleTestStudentId}
                        onChange={(e) => {
                          setSingleTestStudentId(e.target.value);
                          const found = firestoreStudents.find(s => s.id === e.target.value);
                          if (found?.phone) setSingleTestPhone(found.phone);
                        }}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                      >
                        <option value="demo_student_1">Ahmet Yılmaz (Demo Öğrenci - Sayısal)</option>
                        <option value="demo_student_2">Zeynep Kaya (Demo Öğrenci - EA)</option>
                        {firestoreStudents.map(st => (
                          <option key={st.id} value={st.id}>
                            {st.name} {st.phone ? `(${st.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        2) Veli Telefon Numarası (Opsiyonel Test No)
                      </label>
                      <input
                        type="text"
                        value={singleTestPhone}
                        onChange={(e) => setSingleTestPhone(e.target.value)}
                        placeholder="Örn: +905550001122 veya kendi telefonunuz"
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleRunSingleStudentTest}
                        disabled={isSingleTesting}
                        className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                      >
                        {isSingleTesting ? (
                          <>
                            <div className="animate-spin w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                            <span>Test Ediliyor...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            <span>Sadece Bu 1 Öğrencide Çalıştır</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {singleTestResult && (
                    <div className={`p-4 rounded-xl text-xs space-y-2.5 border ${
                      singleTestResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200' : 'bg-red-950/40 border-red-500/30 text-red-200'
                    }`}>
                      <div className="flex items-center justify-between font-bold flex-wrap gap-2">
                        <span>{singleTestResult.success ? '✅ Test Başarıyla Tamamlandı!' : '⚠️ Test Başarısız'}</span>
                        {singleTestResult.log?.reportId && (
                          <a
                            href={`/api/reports/pdf/${singleTestResult.log.reportId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-slate-950 font-black rounded-lg text-[11px] hover:bg-emerald-400 transition-all"
                          >
                            <Download size={13} />
                            <span>Oluşturulan PDF Raporunu İndir / Görüntüle</span>
                          </a>
                        )}
                      </div>

                      <p>{singleTestResult.message || singleTestResult.error}</p>

                      {singleTestResult.log && (
                        <div className="bg-slate-950 p-3 rounded-lg border border-white/5 space-y-1 font-mono text-[11px] text-slate-300">
                          <div><strong className="text-white">Test Edilen Öğrenci:</strong> {singleTestResult.log.studentName}</div>
                          <div><strong className="text-white">Alıcı WhatsApp Tel:</strong> {singleTestResult.log.parentPhone}</div>
                          <div><strong className="text-white">Haftalık Soru Sadakati:</strong> %{singleTestResult.log.completionRate} ({singleTestResult.log.totalCompleted} Soru)</div>
                          <div><strong className="text-white">WhatsApp Gönderim Durumu:</strong> {singleTestResult.log.status === 'sent' ? 'Twilio Canlı Mesaj İletildi' : 'Simülasyon / Test Modu Kaydedildi'}</div>
                          <div><strong className="text-white">PDF Bağlantısı:</strong> {singleTestResult.log.mediaUrl}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {weeklyReportLogMessage && (
                  <div className="p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 font-mono">
                    {weeklyReportLogMessage}
                  </div>
                )}
              </div>

              {/* Twilio Test Mesajı Gönderme Formu */}
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Send size={18} className="text-emerald-400" />
                  <span>Twilio WhatsApp Test Mesajı Gönder</span>
                </h3>
                <form onSubmit={handleSendTestTwilioMessage} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Alıcı Telefon Numarası
                      </label>
                      <input
                        type="text"
                        value={testPhoneNumber}
                        onChange={(e) => setTestPhoneNumber(e.target.value)}
                        placeholder="+905xxxxxxxxx"
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Mesaj Gövdesi
                      </label>
                      <input
                        type="text"
                        value={testMessageBody}
                        onChange={(e) => setTestMessageBody(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white outline-none focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSendingTest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{isSendingTest ? 'Gönderiliyor...' : 'Test Mesajını Gönder'}</span>
                  </button>
                </form>
              </div>

              {/* Webhook Canlı Log Akışı */}
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal size={18} className="text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Canlı Webhook Günlükleri (Webhook Logs)</h3>
                    <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                      {webhookLogs.length} Kayıt
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Gerçek Zamanlı Dinleniyor
                  </span>
                </div>

                {webhookLogsLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">Günlükler yükleniyor...</div>
                ) : webhookLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-white/5">
                    Henüz kaydedilmiş webhook günlüğü bulunmuyor. Twilio üzerinden mesaj gönderildiğinde kayıtlar burada belirecektir.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-white/5 bg-slate-950/50">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900 border-b border-white/5 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                          <th className="p-3">Tarih / Saat</th>
                          <th className="p-3">Yöntem</th>
                          <th className="p-3">Durum / Olay</th>
                          <th className="p-3">Gönderen / Detay</th>
                          <th className="p-3 text-right">Eylem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                        {webhookLogs.map((log) => {
                          const dateStr = log.timestamp?.toDate ? format(log.timestamp.toDate(), 'dd MMM HH:mm:ss', { locale: tr }) : 'Şimdi';
                          return (
                            <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="p-3 text-slate-400 whitespace-nowrap">{dateStr}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {log.method || 'POST'}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`font-semibold ${
                                  log.status === 'verification_success' || log.status === 'message_received'
                                    ? 'text-emerald-400'
                                    : 'text-amber-400'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400 max-w-[200px] truncate">
                                {log.parsedData?.from || log.parsedData?.From || log.ip || '-'}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setSelectedWebhookLog(log)}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded-lg transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                                >
                                  <Eye size={12} />
                                  <span>İncele</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Webhook JSON İnceleme Modalı */}
              {selectedWebhookLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
                  <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2">
                        <Terminal size={16} className="text-emerald-400" />
                        <span>Webhook Log Detayı ({selectedWebhookLog.id})</span>
                      </h3>
                      <button
                        onClick={() => setSelectedWebhookLog(null)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="bg-slate-950 border border-white/5 rounded-xl p-4 max-h-[400px] overflow-y-auto">
                      <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-all">
                        {JSON.stringify(selectedWebhookLog, null, 2)}
                      </pre>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setSelectedWebhookLog(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Kapat
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 lg:min-h-[600px] lg:h-[650px] min-h-[500px]">
          {/* Sol Panel: Sohbet Listesi (col-span-4) */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/5 flex flex-col bg-slate-950/25 h-[400px] lg:h-full">
            <div className="p-4 border-b border-white/5 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sohbetler</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                  type="text" 
                  placeholder="Sohbet veya numara ara..."
                  className="w-full bg-slate-900 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  value={whatsAppSearchTerm}
                  onChange={(e) => setWhatsAppSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
                <p className="text-xs text-slate-400">Yükleniyor...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 max-h-[500px] scrollbar-thin">
                {filteredConversations.map((conv) => {
                  const isActive = selectedPhone === conv.phone;
                  const isLastInbound = conv.lastMessage.direction === 'inbound';
                  return (
                    <button
                      key={conv.phone}
                      onClick={() => setSelectedPhone(conv.phone)}
                      className={`w-full text-left p-4 flex items-start gap-3 transition-all duration-200 border-b border-white/[0.03] ${
                        isActive 
                          ? 'bg-emerald-600/10 border-l-4 border-emerald-500' 
                          : conv.hasMatch
                            ? 'hover:bg-slate-800/40 border-l-4 border-transparent'
                            : 'bg-rose-500/[0.02] border-l-4 border-rose-500/30 hover:bg-rose-500/[0.06]'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                        isActive 
                          ? 'bg-emerald-500 text-white' 
                          : conv.hasMatch 
                            ? 'bg-slate-800 text-slate-300' 
                            : 'bg-rose-950/40 text-rose-300 border border-rose-500/15'
                      }`}>
                        {conv.senderName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-white text-sm truncate">{conv.senderName}</span>
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {conv.lastMessage.timestamp?.toDate 
                              ? format(conv.lastMessage.timestamp.toDate(), 'HH:mm', { locale: tr }) 
                              : ''}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {conv.hasMatch ? (
                            <span className="inline-block px-1.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-black rounded uppercase tracking-wider">
                              Kayıtlı: {conv.matchedUser?.role === 'student' ? 'Öğrenci' : conv.matchedUser?.role === 'coach' ? 'Koç' : conv.matchedUser?.role === 'parent' ? 'Veli' : 'Kullanıcı'}
                            </span>
                          ) : (
                            <span className="inline-block px-1.5 py-0.5 bg-rose-500/10 text-rose-400 text-[9px] font-black rounded uppercase tracking-wider">
                              Sistemde Kayıtlı Değil
                            </span>
                          )}
                          {isLastInbound && (
                            <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-black rounded uppercase tracking-wider">
                              YENİ
                            </span>
                          )}
                          {isEscalated(conv) && (
                            <span className="inline-block px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black rounded uppercase tracking-wider border border-red-500/20 animate-pulse">
                              Yönetici Talebi ⚠️
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                          {!isLastInbound && <span className="text-emerald-500 font-medium mr-1">Siz:</span>}
                          {conv.lastMessage.body ? (
                            conv.lastMessage.body
                          ) : (conv.lastMessage.mediaUrl || (conv.lastMessage as any).media_url) ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <Paperclip size={11} className="shrink-0" />
                              {(((conv.lastMessage.mediaType || (conv.lastMessage as any).media_type) === 'image' || (conv.lastMessage.mediaType || (conv.lastMessage as any).media_type)?.startsWith('image/'))) ? 'Fotoğraf' : 'Dosya'}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Boş mesaj</span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <MessageCircle size={32} className="mb-2 text-slate-600" />
                <p className="text-xs">Sohbet bulunamadı</p>
              </div>
            )}
          </div>

          {/* Sağ Panel: Sohbet Ekranı (col-span-8) */}
          <div className="lg:col-span-8 flex flex-col h-full bg-slate-900/40">
            {selectedPhone ? (() => {
              const activeConv = conversations.find(c => c.phone === selectedPhone);
              if (!activeConv) return null;

              // Find last message from the other party (inbound)
              const lastInbound = [...activeConv.messages].reverse().find(m => m.direction === 'inbound');
              const lastInboundDate = lastInbound?.timestamp?.toDate 
                ? lastInbound.timestamp.toDate() 
                : lastInbound?.timestamp?.seconds 
                  ? new Date(lastInbound.timestamp.seconds * 1000) 
                  : lastInbound?.timestamp 
                    ? new Date(lastInbound.timestamp) 
                    : null;

              const isExpired = lastInboundDate 
                ? (now.getTime() - lastInboundDate.getTime() > 24 * 60 * 60 * 1000) 
                : true; // if no inbound msg, consider expired/closed

              const msRemaining = lastInboundDate 
                ? (lastInboundDate.getTime() + 24 * 60 * 60 * 1000) - now.getTime() 
                : 0;

              const formatCountdown = (ms: number) => {
                if (ms <= 0) return 'Süre Doldu';
                const totalSeconds = Math.floor(ms / 1000);
                const hours = Math.floor(totalSeconds / 3600);
                const minutes = Math.floor((totalSeconds % 3600) / 60);
                const seconds = totalSeconds % 60;
                return `${hours}s ${minutes}dk ${seconds}sn`;
              };

              // Group activeConv.messages by day
              const getDayLabel = (date: Date) => {
                const today = new Date();
                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);

                const dateStr = format(date, 'yyyy-MM-dd');
                const todayStr = format(today, 'yyyy-MM-dd');
                const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

                if (dateStr === todayStr) {
                  return 'Bugün';
                } else if (dateStr === yesterdayStr) {
                  return 'Dün';
                } else {
                  return format(date, 'd MMMM yyyy, EEEE', { locale: tr });
                }
              };

              interface GroupedMessages {
                dayLabel: string;
                messages: WhatsAppMessage[];
              }

              const groupedMessages: GroupedMessages[] = [];
              let currentGroup: GroupedMessages | null = null;

              activeConv.messages.forEach((msg) => {
                const msgDate = msg.timestamp?.toDate 
                  ? msg.timestamp.toDate() 
                  : msg.timestamp?.seconds 
                    ? new Date(msg.timestamp.seconds * 1000) 
                    : new Date(msg.timestamp);

                const label = getDayLabel(msgDate);

                if (!currentGroup || currentGroup.dayLabel !== label) {
                  currentGroup = {
                    dayLabel: label,
                    messages: [msg]
                  };
                  groupedMessages.push(currentGroup);
                } else {
                  currentGroup.messages.push(msg);
                }
              });

              return (
                <div className="flex flex-col h-full overflow-hidden">
                  {/* Sohbet Başlığı */}
                  <div className="p-4 border-b border-white/5 bg-slate-950/20 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{activeConv.senderName}</span>
                        {activeConv.hasMatch && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500/15 text-blue-400 rounded">
                            {activeConv.matchedUser?.role === 'student' ? 'Öğrenci' : activeConv.matchedUser?.role === 'coach' ? 'Koç' : activeConv.matchedUser?.role === 'parent' ? 'Veli' : 'Sistem'}
                          </span>
                        )}
                      </h2>
                      <p className="text-slate-400 text-xs mt-0.5 font-mono">{activeConv.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        isExpired 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                        {isExpired ? 'Pencere Kapalı' : 'Pencere Açık'}
                      </div>
                    </div>
                  </div>

                  {/* 24-Saat Durum Şeridi */}
                  <div className={`px-4 py-2 text-xs flex items-center justify-between border-b border-white/5 ${
                    isExpired 
                      ? 'bg-rose-500/5 text-rose-400' 
                      : 'bg-emerald-500/5 text-emerald-400 animate-pulse'
                  }`}>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span>{isExpired ? '⚠️ 24 Saatlik Yanıt Penceresi Doldu' : '⏱️ 24 Saatlik Yanıt Penceresi Aktif'}</span>
                    </div>
                    {lastInboundDate && (
                      <div className="text-right">
                        {!isExpired ? (
                          <span className="font-bold font-mono bg-emerald-500/20 px-2.5 py-0.5 rounded-md text-emerald-300">
                            Kalan Süre: {formatCountdown(msRemaining)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            Son Gelen: {format(lastInboundDate, 'dd MMM HH:mm', { locale: tr })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Yönetici Talep Şeridi */}
                  {isEscalated(activeConv) && (
                    <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 text-red-400 text-xs font-semibold flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="animate-pulse w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                        <span>Bu kullanıcı <strong>/yonetici</strong> komutuyla doğrudan sizinle iletişime geçmek istemiştir. Bot devredışıdır.</span>
                      </div>
                      <button 
                        onClick={() => handleResolveEscalation(activeConv.phone)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-[10px] uppercase rounded-lg transition-all shrink-0 shadow-lg shadow-red-900/20 flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} />
                        Talebi Kapat / Botu Aç
                      </button>
                    </div>
                  )}

                  {/* Mesaj Alanı */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-6 max-h-[460px] scrollbar-thin bg-slate-950/10">
                    {groupedMessages.map((group, groupIndex) => (
                      <div key={groupIndex} className="space-y-4">
                        {/* Gün Başlığı */}
                        <div className="flex justify-center my-4">
                          <span className="bg-slate-800/80 border border-white/5 text-slate-300 text-[10px] uppercase font-black tracking-wider px-3 py-1 rounded-full shadow-sm">
                            {group.dayLabel}
                          </span>
                        </div>

                        {group.messages.map((msg) => {
                          const isMe = msg.direction === 'outbound';
                          const formattedTime = msg.timestamp?.toDate 
                            ? format(msg.timestamp.toDate(), 'HH:mm', { locale: tr }) 
                            : msg.timestamp?.seconds 
                              ? format(new Date(msg.timestamp.seconds * 1000), 'HH:mm', { locale: tr }) 
                              : '';
                          
                          const mUrl = msg.mediaUrl || (msg as any).media_url;
                          const mType = msg.mediaType || (msg as any).media_type;
                          const fName = msg.fileName || (msg as any).file_name;
                          const fSize = msg.fileSize || (msg as any).file_size;

                          const proxiedUrl = mUrl && (mUrl.includes('facebook.com') || mUrl.includes('fbsbx.com'))
                            ? `/api/whatsapp-media?url=${encodeURIComponent(mUrl)}`
                            : mUrl;

                          return (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-md whitespace-pre-wrap ${
                                isMe 
                                  ? 'bg-emerald-600 text-white rounded-tr-none' 
                                  : 'bg-slate-800 text-slate-100 rounded-tl-none border border-white/5'
                              }`}>
                                {proxiedUrl && (
                                  <div className="mb-2 overflow-hidden rounded-lg bg-slate-950/20 p-2 border border-white/10 flex flex-col gap-1.5">
                                    {(mType === 'image' || mType?.startsWith('image/')) ? (
                                      <a href={proxiedUrl} target="_blank" rel="noreferrer" className="block relative group overflow-hidden rounded">
                                        <img 
                                          src={proxiedUrl} 
                                          alt={fName || "Görsel"} 
                                          className="max-h-48 object-contain rounded w-full bg-slate-900/50" 
                                          onError={(e) => {
                                            const target = e.currentTarget;
                                            target.style.display = 'none';
                                            if (target.parentElement) {
                                              const fallback = document.createElement('div');
                                              fallback.className = 'p-2.5 bg-slate-900/90 rounded border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2 font-medium';
                                              fallback.innerHTML = '<span>⚠️ Medya Süresi Doldu (Meta 30 Günlük Sınır)</span>';
                                              target.parentElement.appendChild(fallback);
                                            }
                                          }}
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-semibold">
                                          Görseli Aç
                                        </div>
                                      </a>
                                    ) : (
                                      <div className="flex items-center gap-2.5 min-w-[200px]">
                                        <div className="p-2 bg-white/5 rounded-lg text-white">
                                          {(mType === 'video' || mType?.startsWith('video/')) ? (
                                            <Video size={18} className="text-blue-400" />
                                          ) : (mType === 'audio' || mType?.startsWith('audio/')) ? (
                                            <Music size={18} className="text-amber-400" />
                                          ) : (
                                            <FileText size={18} className="text-emerald-400" />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-bold text-xs text-white truncate" title={fName}>{fName || 'Belge.pdf'}</p>
                                          {fSize && (
                                            <p className="text-[10px] text-slate-400 mt-0.5">{fSize}</p>
                                          )}
                                        </div>
                                        <a 
                                          href={proxiedUrl} 
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="p-1.5 hover:bg-white/10 rounded-md text-slate-300 hover:text-white transition-all shrink-0"
                                          title="İndir / Görüntüle"
                                        >
                                          <Download size={14} />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {msg.body}
                              </div>
                              <span className="text-[10px] text-slate-500 mt-1 px-1 font-mono">
                                {formattedTime}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>

                  {/* Mesaj Yazma Alanı */}
                  <div className="p-4 border-t border-white/5 bg-slate-950/20">
                    {isExpired ? (
                      <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4 text-center space-y-2 max-w-2xl mx-auto">
                        <p className="text-sm text-rose-300 font-bold flex items-center justify-center gap-1.5">
                          <span>⚠️ Yanıt Süresi Sınırı Geçildi (24 Saat)</span>
                        </p>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          WhatsApp Business politikaları gereğince, müşterinin son mesajından itibaren 24 saat geçtiğinde serbest yazışma penceresi kapanır. Sadece şablon mesajlar gönderilebilir. Normal sohbet girişi pasiftir.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Seçili Dosya Önizleme Şeridi */}
                        {selectedFile && (
                          <div className="bg-slate-900 border border-emerald-500/20 rounded-xl p-3 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 min-w-0">
                              {selectedFile.type === 'image' && selectedFile.previewUrl ? (
                                <img src={selectedFile.previewUrl} alt="Önizleme" className="w-10 h-10 object-cover rounded-lg border border-white/10 shrink-0" />
                              ) : (
                                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                                  {selectedFile.type === 'video' ? (
                                    <Video size={18} />
                                  ) : selectedFile.type === 'audio' ? (
                                    <Music size={18} />
                                  ) : (
                                    <FileText size={18} />
                                  )}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{selectedFile.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">{selectedFile.size}</p>
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => setSelectedFile(null)}
                              className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendDirectWhatsApp(selectedPhone, chatInputText);
                          }}
                          className="flex gap-2"
                        >
                          <input 
                            type="file" 
                            id="whatsapp-file-input" 
                            className="hidden" 
                            onChange={handleFileChange}
                            accept="*/*"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById('whatsapp-file-input')?.click()}
                            disabled={isSending}
                            className="p-3 bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-400 hover:text-white rounded-xl transition-all flex items-center justify-center shrink-0"
                            title="Belge veya Dosya Ekle"
                          >
                            <Paperclip size={18} />
                          </button>
                          <input
                            type="text"
                            placeholder={selectedFile ? "Dosya için bir açıklama ekleyin..." : "WhatsApp üzerinden mesaj gönderin..."}
                            className="flex-1 bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                            value={chatInputText}
                            onChange={(e) => setChatInputText(e.target.value)}
                            disabled={isSending}
                          />
                          <button
                            type="submit"
                            disabled={(!chatInputText.trim() && !selectedFile) || isSending}
                            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all flex items-center gap-2 disabled:opacity-50 shrink-0 font-sans"
                          >
                            {isSending ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <>
                                <Send size={16} />
                                <span>Gönder</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-slate-800/80 border border-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-xl">
                  <MessageCircle size={32} />
                </div>
                <h3 className="text-white font-bold text-lg mb-1">WhatsApp Sohbet Ekranı</h3>
                <p className="text-slate-400 text-sm max-w-sm">
                  Görüşmeleri ve mesaj geçmişini incelemek, yeni mesaj göndermek için sol taraftaki sohbet listesinden bir kullanıcı seçin.
                </p>
              </div>
            )}
          </div>
        </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder={activeTab === 'forms' ? "İsim veya konu ara..." : activeTab === 'contact' ? "İsim, e-posta, konu veya mesaj ara..." : activeTab === 'hr' ? "İsim, e-posta veya pozisyon ara..." : "Numara veya mesaj ara..."}
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {(activeTab === 'forms' || activeTab === 'contact' || activeTab === 'hr') && (
              <div className="flex gap-2">
                {(['all', 'new', 'resolved'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      filter === f
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-950 border border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {f === 'all' ? 'Tümü' : f === 'new' ? 'Bekleyenler' : 'Tamamlananlar'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent flex items-center justify-center rounded-full mx-auto mb-4"></div>
              <p className="text-slate-400">Yükleniyor...</p>
            </div>
          ) : (
            filteredMessages.length > 0 ? (
              <div className="divide-y divide-white/5">
                {filteredMessages.map((msg, index) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    key={msg.id} 
                    className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors ${msg.status === 'new' ? 'bg-blue-500/5' : 'hover:bg-slate-800/50'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        msg.status === 'new' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {msg.status === 'new' ? <MessageCircle size={24} /> : <CheckCircle2 size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-white text-lg">{msg.firstName} {msg.lastName}</h3>
                          {msg.status === 'new' && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">YENİ</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-400">
                          {activeTab === 'forms' ? (
                            <div className="flex items-center gap-1.5">
                              <Phone size={14} />
                              {msg.phone}
                            </div>
                          ) : activeTab === 'contact' ? (
                            <div className="flex items-center gap-1.5">
                              <Mail size={14} className="text-slate-400" />
                              {msg.email}
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5">
                                <Mail size={14} className="text-slate-400" />
                                {msg.email}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Phone size={14} className="text-slate-400" />
                                {msg.phone}
                              </div>
                            </>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'dd MMM yyyy HH:mm', { locale: tr }) : 'Tarih yok'}
                          </div>
                        </div>
                        <p className="mt-3 text-slate-300 text-sm">
                          <span className="font-semibold text-white">Konu:</span> {msg.topic}
                        </p>
                        {(activeTab === 'contact' || activeTab === 'hr') && msg.message && (
                          <div className="mt-3 text-slate-300 text-sm whitespace-pre-wrap bg-slate-950 p-4 rounded-xl border border-white/5">
                            {msg.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t border-white/5 md:border-t-0 pt-4 md:pt-0">
                      <button 
                        onClick={() => handletoggleStatus(msg.id, msg.status)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex flex-1 justify-center md:flex-none items-center gap-2 ${
                          msg.status === 'new'
                            ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CheckCircle2 size={16} />
                        {msg.status === 'new' ? 'İşlemi Tamamla' : 'Geri Al'}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                  <Inbox size={32} />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Kayıt Bulunamadı</h3>
                <p className="text-slate-400 text-sm">Arama kriterlerine uygun talep bulunmuyor.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
