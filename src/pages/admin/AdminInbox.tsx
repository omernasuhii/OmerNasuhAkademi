import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Inbox, Search, ExternalLink, Calendar, CheckCircle2, ChevronRight, MessageCircle, Phone, Mail, Briefcase, Send, X, Paperclip, FileText, Image as ImageIcon, Download, Video, Music, ChevronDown, Plus, Trash2, Edit2, Check, AlertCircle, Smartphone, Sparkles, Command, Info, ArrowLeft, RefreshCw, Eye } from 'lucide-react';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, orderBy, getDocs, updateDoc, doc, onSnapshot, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

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

  const [whatsAppSubTab, setWhatsAppSubTab] = useState<'all' | 'admin' | 'templates'>('all');

  // WhatsApp Template management states
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form states for creating a template
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState<'UTILITY' | 'MARKETING' | 'AUTHENTICATION'>('UTILITY');
  const [templateLanguage, setTemplateLanguage] = useState('Türkçe (tr)');
  const [templateHeaderType, setTemplateHeaderType] = useState<'TEXT' | 'IMAGE' | 'NONE'>('NONE');
  const [templateHeaderText, setTemplateHeaderText] = useState('');
  const [templateBody, setTemplateBody] = useState('');
  const [templateFooter, setTemplateFooter] = useState('');
  const [templateButtons, setTemplateButtons] = useState<{ type: 'URL' | 'QUICK_REPLY'; text: string; value?: string }[]>([]);

  // Testing templates
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

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

  // WhatsApp Template helper definitions and hooks
  const getSeedTemplates = (): WhatsAppTemplate[] => [
    {
      id: 'seed_welcome',
      name: 'hosgeldiniz_mesaji_v1',
      category: 'UTILITY',
      language: 'Türkçe (tr)',
      status: 'APPROVED',
      headerType: 'TEXT',
      headerText: 'FocusOn Akademi',
      body: 'Merhaba {{1}},\n\nFocusOn Akademi ailesine hoş geldiniz! Sınav hazırlık süreciniz boyunca size en iyi koçluk hizmetini sunmak için buradayız.\n\n🤖 Akıllı WhatsApp Asistanımızı başlatmak için aşağıdaki butonları kullanabilir veya "/asistan" yazabilirsiniz.',
      footer: 'FocusOn Akademi Robotik Servisi',
      buttons: [
        { type: 'QUICK_REPLY', text: '🤖 Yapay Zeka Asistanı' },
        { type: 'QUICK_REPLY', text: '📅 Randevu İşlemleri' }
      ],
      createdAt: new Date()
    },
    {
      id: 'seed_reminder',
      name: 'randevu_hatirlatici_v1',
      category: 'UTILITY',
      language: 'Türkçe (tr)',
      status: 'APPROVED',
      headerType: 'NONE',
      body: 'Sayın {{1}},\n\n{{2}} tarihindeki {{3}} dersi/koçluk randevunuzu hatırlatmak isteriz. Görüşmeye katılamayacaksanız lütfen en az 2 saat öncesinden iptal ediniz.',
      footer: 'FocusOn Akademi Danışmanlık',
      buttons: [
        { type: 'URL', text: 'Sitede Gör', value: 'https://focusonakademi.com/randevularim' }
      ],
      createdAt: new Date()
    },
    {
      id: 'seed_survey',
      name: 'memnuniyet_anketi_v2',
      category: 'MARKETING',
      language: 'Türkçe (tr)',
      status: 'PENDING',
      headerType: 'TEXT',
      headerText: 'Geri Bildiriminiz Değerlidir',
      body: 'Değerli öğrencimiz {{1}},\n\nBugün tamamladığınız koçluk görüşmesini 1-5 arası puanlayarak değerlendirebilir misiniz?',
      footer: 'Değerlendirme 1 dakika sürer',
      buttons: [
        { type: 'QUICK_REPLY', text: '⭐ 5 - Harika' },
        { type: 'QUICK_REPLY', text: '⭐ 3 - Orta' },
        { type: 'QUICK_REPLY', text: '⭐ 1 - Geliştirilmeli' }
      ],
      createdAt: new Date()
    }
  ];

  const seedDefaultTemplates = async () => {
    try {
      const mockSeeds = getSeedTemplates();
      for (const t of mockSeeds) {
        const { id, ...data } = t;
        await addDoc(collection(db, 'whatsapp_templates'), {
          ...data,
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.error('Error seeding default templates:', err);
      setTemplates(getSeedTemplates());
      setTemplatesLoading(false);
    }
  };

  // Fetch and sync WhatsApp templates from API
  const loadTemplatesFromAPI = async () => {
    setTemplatesLoading(true);
    try {
      const response = await fetch('/api/whatsapp-templates');
      if (!response.ok) {
        throw new Error('Sunucu hatası: ' + response.statusText);
      }
      const data = await response.json();
      if (data.templates && data.templates.length > 0) {
        setTemplates(data.templates);
        if (!selectedTemplateId) {
          setSelectedTemplateId(data.templates[0].id);
        }
      } else {
        seedDefaultTemplates();
      }
    } catch (err) {
      console.error('Error fetching/syncing templates:', err);
      // Fallback to local firestore
      const q = query(collection(db, 'whatsapp_templates'), orderBy('createdAt', 'desc'));
      getDocs(q).then((snap) => {
        if (!snap.empty) {
          const localData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhatsAppTemplate));
          setTemplates(localData);
          if (!selectedTemplateId && localData.length > 0) {
            setSelectedTemplateId(localData[0].id);
          }
        } else {
          seedDefaultTemplates();
        }
      }).catch((dbErr) => {
        console.error('Firestore fallback templates error:', dbErr);
        const mockSeeds = getSeedTemplates();
        setTemplates(mockSeeds);
        if (mockSeeds.length > 0 && !selectedTemplateId) {
          setSelectedTemplateId(mockSeeds[0].id);
        }
      });
    } finally {
      setTemplatesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'whatsapp' && whatsAppSubTab === 'templates') {
      loadTemplatesFromAPI();
    }
  }, [activeTab, whatsAppSubTab]);

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim() || !templateBody.trim()) {
      alert("Lütfen şablon adını ve gövde metnini doldurun.");
      return;
    }

    const nameRegex = /^[a-z0-9_]+$/;
    if (!nameRegex.test(templateName.trim())) {
      alert("Şablon adı sadece küçük harf, rakam ve alt çizgi (_) içerebilir. Boşluk veya özel karakter kullanamazsınız (Örn: randevu_onay_v1).");
      return;
    }

    try {
      const payload = {
        name: templateName.trim(),
        category: templateCategory,
        language: templateLanguage,
        headerType: templateHeaderType,
        headerText: templateHeaderType === 'TEXT' ? templateHeaderText.trim() : '',
        body: templateBody.trim(),
        footer: templateFooter.trim() || '',
        buttons: templateButtons
      };

      const response = await fetch('/api/whatsapp-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Şablon oluşturma hatası');
      }

      const resData = await response.json();
      const isMeta = resData.method === "meta";

      setTemplateName('');
      setTemplateHeaderText('');
      setTemplateBody('');
      setTemplateFooter('');
      setTemplateButtons([]);
      setIsCreateModalOpen(false);

      alert(`Şablon başarıyla oluşturuldu!\n` + 
            (isMeta ? "✅ Meta Cloud API üzerinden onaya gönderildi." : "ℹ️ Simülasyon modunda veritabanına kaydedildi."));

      await loadTemplatesFromAPI();
      if (resData.templateId) {
        setSelectedTemplateId(resData.templateId);
      }
    } catch (err: any) {
      console.error("Error creating template:", err);
      alert("Şablon oluşturulurken hata oluştu: " + err.message);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Bu şablonu silmek istediğinize emin misiniz?")) return;
    const templateToDelete = templates.find(t => t.id === id);
    if (!templateToDelete) return;

    try {
      const response = await fetch(`/api/whatsapp-templates/${id}?name=${templateToDelete.name}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Silme işlemi başarısız oldu.');
      }

      alert("Şablon başarıyla silindi.");
      if (selectedTemplateId === id) {
        setSelectedTemplateId(templates.find(t => t.id !== id)?.id || null);
      }
      await loadTemplatesFromAPI();
    } catch (err) {
      console.error("Error deleting template:", err);
      alert("Şablon silinirken bir hata oluştu.");
    }
  };

  const handleUpdateTemplateStatus = async (id: string, newStatus: 'APPROVED' | 'PENDING' | 'REJECTED') => {
    try {
      await updateDoc(doc(db, 'whatsapp_templates', id), { status: newStatus });
    } catch (err) {
      console.error("Error updating template status:", err);
      setTemplates(templates.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  const handleSendTestTemplate = async (template: WhatsAppTemplate) => {
    if (!testPhoneNumber.trim()) {
      alert("Lütfen bir test telefon numarası girin.");
      return;
    }
    setIsSendingTest(true);
    try {
      let parsedBody = template.body
        .replace(/\{\{1\}\}/g, "Ahmet Yılmaz")
        .replace(/\{\{2\}\}/g, "24 Temmuz 2026 14:00")
        .replace(/\{\{3\}\}/g, "Koçluk Görüşmesi");

      const langCode = (() => {
        const match = template.language.match(/\(([^)]+)\)/);
        return match && match[1] ? match[1].trim() : (template.language.trim().toLowerCase().substring(0, 2) || "tr");
      })();

      const bodyParams: any[] = [];
      const bodyMatches = template.body.match(/\{\{\d+\}\}/g) || [];
      const bodyUniqueCount = new Set(bodyMatches).size;

      for (let i = 1; i <= bodyUniqueCount; i++) {
        let val = "";
        if (i === 1) val = "Ahmet Yılmaz";
        else if (i === 2) val = "24 Temmuz 2026 14:00";
        else if (i === 3) val = "Koçluk Görüşmesi";
        else val = `Parametre ${i}`;
        bodyParams.push({ type: "text", text: val });
      }

      const components: any[] = [];
      if (bodyParams.length > 0) {
        components.push({
          type: "body",
          parameters: bodyParams
        });
      }

      if (template.headerType === "IMAGE") {
        components.push({
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80"
              }
            }
          ]
        });
      }

      const formattedMessageBody = `📢 [Şablon Mesajı: ${template.name}]\n\n${template.headerText ? `*${template.headerText}*\n\n` : ''}${parsedBody}\n\n_${template.footer || ''}_`;

      const response = await fetch('/api/whatsapp-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testPhoneNumber.trim(),
          message: formattedMessageBody,
          template: {
            name: template.name,
            language: {
              code: langCode
            },
            components: components
          }
        })
      });

      if (!response.ok) {
        throw new Error('Real-time API response error');
      }

      const resData = await response.json();
      const isMeta = resData.method === "meta";

      alert(`Test mesajı "${testPhoneNumber}" numarasına başarıyla gönderildi!\n` + 
            (isMeta ? "✅ Meta Cloud API üzerinden gerçek şablon olarak iletildi." : "ℹ️ Simülasyon modunda başarıyla gönderildi."));
      setTestPhoneNumber('');
    } catch (err) {
      console.error("Error sending test template:", err);
      alert("Test mesajı gönderilirken bir hata oluştu. Lütfen bağlantınızı veya parametreleri kontrol edin.");
    } finally {
      setIsSendingTest(false);
    }
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
              onClick={() => setWhatsAppSubTab('templates')}
              className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-1.5 px-2 whitespace-nowrap ${
                whatsAppSubTab === 'templates'
                  ? 'text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles size={16} />
              <span>Şablon Tasarımları ve Onayları</span>
              {whatsAppSubTab === 'templates' && (
                <motion.div layoutId="waSubTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />
              )}
            </button>
          </div>

          {whatsAppSubTab === 'templates' ? (
            <div className="space-y-6">
              {/* Şablon İstatistik Kartları */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Toplam Şablon</p>
                    <p className="text-2xl font-bold text-white mt-1">{templates.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Onaylanmış (Aktif)</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-1">
                      {templates.filter(t => t.status === 'APPROVED').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Onay Bekleyen</p>
                    <p className="text-2xl font-bold text-amber-400 mt-1">
                      {templates.filter(t => t.status === 'PENDING').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center">
                    <AlertCircle size={20} />
                  </div>
                </div>

                <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Reddedilen</p>
                    <p className="text-2xl font-bold text-rose-400 mt-1">{templates.filter(t => t.status === 'REJECTED').length}</p>
                  </div>
                  <div className="w-10 h-10 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center">
                    <X size={20} />
                  </div>
                </div>
              </div>

              {/* Ana Şablon Arayüzü Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Sol Sütun: Şablon Listesi */}
                <div className="lg:col-span-5 bg-slate-900 border border-white/5 rounded-2xl p-4 flex flex-col gap-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Command size={16} className="text-emerald-400" />
                      <span>Onaylı Şablonlar Listesi</span>
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={loadTemplatesFromAPI}
                        title="Meta'dan Güncel Şablonları Çek / Eşitle"
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white rounded-xl transition-all flex items-center justify-center border border-white/5"
                        disabled={templatesLoading}
                      >
                        <RefreshCw size={14} className={templatesLoading ? "animate-spin text-emerald-400" : ""} />
                      </button>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1 shadow-lg shadow-emerald-500/15"
                      >
                        <Plus size={14} />
                        Şablon Tasarla
                      </button>
                    </div>
                  </div>

                  {templatesLoading ? (
                    <div className="p-12 text-center">
                      <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                      <p className="text-xs text-slate-400">Şablonlar yükleniyor...</p>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-white/10 rounded-xl">
                      <FileText className="mx-auto text-slate-600 mb-2" size={32} />
                      <p className="text-xs text-slate-400 font-medium">Kayıtlı WhatsApp şablonu bulunmuyor.</p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="mt-3 text-xs text-emerald-400 hover:underline"
                      >
                        İlk Şablonu Oluşturun
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                      {templates.map(t => {
                        const isSelected = selectedTemplateId === t.id;
                        return (
                          <div
                            key={t.id}
                            className={`p-3.5 rounded-xl border transition-all text-left flex flex-col gap-2 relative group cursor-pointer ${
                              isSelected
                                ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                                : 'bg-slate-950 border-white/5 hover:border-white/10'
                            }`}
                            onClick={() => setSelectedTemplateId(t.id)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-mono text-xs font-bold text-white truncate break-all">
                                  {t.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-semibold uppercase">
                                    {t.category === 'UTILITY' ? 'Hizmet' : t.category === 'MARKETING' ? 'Pazarlama' : 'Yetkilendirme'}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    {t.language}
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0 flex flex-col items-end gap-2">
                                <span className={`inline-flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                  t.status === 'APPROVED'
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : t.status === 'PENDING'
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-rose-500/10 text-rose-400'
                                }`}>
                                  <span className={`w-1 h-1 rounded-full ${
                                    t.status === 'APPROVED' ? 'bg-emerald-500' : t.status === 'PENDING' ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} />
                                  {t.status === 'APPROVED' ? 'ONAYLI' : t.status === 'PENDING' ? 'ONAY BEKLİYOR' : 'REDDEDİLDİ'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-2 italic border-t border-white/[0.03] pt-2 mt-1">
                              {t.body}
                            </p>

                            {/* Admin Simulation Controller & Delete button inside card */}
                            <div className="flex items-center justify-between border-t border-white/[0.03] pt-2 mt-1 gap-2 opacity-85 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                <span className="text-[9px] text-slate-500 uppercase font-bold">Durum Simüle Et:</span>
                                <select
                                  value={t.status}
                                  onChange={(e) => handleUpdateTemplateStatus(t.id, e.target.value as any)}
                                  className="bg-slate-900 border border-white/10 text-slate-300 rounded text-[10px] px-1 py-0.5 outline-none font-bold"
                                >
                                  <option value="APPROVED">APPROVED</option>
                                  <option value="PENDING">PENDING</option>
                                  <option value="REJECTED">REJECTED</option>
                                </select>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(t.id);
                                }}
                                className="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                                title="Şablonu Sil"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sağ Sütun: SmartPhone Mockup & Preview */}
                <div className="lg:col-span-7 space-y-6">
                  {(() => {
                    const previewT = templates.find(t => t.id === selectedTemplateId);
                    if (!previewT) {
                      return (
                        <div className="bg-slate-900 border border-white/5 rounded-2xl p-8 text-center text-slate-400 shadow-xl">
                          <Eye size={32} className="mx-auto mb-2 text-slate-600" />
                          <p className="text-sm">Önizleme yapmak için sol menüden bir şablon seçin.</p>
                        </div>
                      );
                    }

                    // Replace variable placeholders with mock user details for visual preview
                    let formattedPreviewBody = previewT.body
                      .replace(/\{\{1\}\}/g, "Esra Yılmaz")
                      .replace(/\{\{2\}\}/g, "24 Temmuz 2026 Cuma")
                      .replace(/\{\{3\}\}/g, "Sınav Koçluğu Birebir Görüşmesi");

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                        
                        {/* CSS Phone Mockup */}
                        <div className="md:col-span-7 flex justify-center">
                          <div className="w-[280px] h-[540px] rounded-[36px] border-[10px] border-slate-950 bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col select-none ring-4 ring-white/5">
                            {/* iPhone Dynamic Island / Notch */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-30 flex items-center justify-between px-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                              <span className="w-1 h-1 rounded-full bg-slate-900"></span>
                            </div>

                            {/* WhatsApp Header Mockup */}
                            <div className="bg-[#075e54] pt-7 pb-2 px-3 flex items-center gap-2 text-white shrink-0 z-10 shadow-md">
                              <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                                FO
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <h4 className="text-xs font-bold truncate flex items-center gap-1">
                                  <span>FocusOn Akademi</span>
                                  <span className="inline-flex items-center justify-center bg-blue-500 text-white rounded-full w-2.5 h-2.5 text-[7px] font-bold">✓</span>
                                </h4>
                                <p className="text-[9px] text-emerald-100 font-medium">çevrimiçi</p>
                              </div>
                            </div>

                            {/* WhatsApp Chat Wallpaper Area */}
                            <div className="flex-1 bg-[#efeae2] p-3 overflow-y-auto relative flex flex-col justify-end">
                              {/* Background doodle pattern layer */}
                              <div className="absolute inset-0 bg-repeat opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-300 via-green-600 to-emerald-900 pointer-events-none"></div>

                              {/* WhatsApp Message Bubble */}
                              <div className="bg-white rounded-xl shadow-md p-3 max-w-[90%] self-start relative flex flex-col gap-1.5 z-10 text-slate-800 border border-slate-200 text-left">
                                
                                {/* Header Text/Image */}
                                {previewT.headerType === 'TEXT' && previewT.headerText && (
                                  <div className="font-bold text-[11px] text-[#075e54] uppercase tracking-wide border-b border-slate-100 pb-1.5">
                                    {previewT.headerText}
                                  </div>
                                )}
                                {previewT.headerType === 'IMAGE' && (
                                  <div className="aspect-video bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 text-[10px] gap-1 border border-slate-200/50 mb-1">
                                    <ImageIcon size={20} className="text-slate-400" />
                                    <span>Görsel Medya (1.91:1)</span>
                                  </div>
                                )}

                                {/* Body Text */}
                                <p className="text-[11px] leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
                                  {formattedPreviewBody}
                                </p>

                                {/* Footer Text */}
                                {previewT.footer && (
                                  <p className="text-[9px] text-slate-400 mt-0.5 border-t border-slate-50 pt-1">
                                    {previewT.footer}
                                  </p>
                                )}

                                {/* Timestamp */}
                                <div className="text-right text-[8px] text-slate-400 font-mono mt-0.5 self-end">
                                  11:42
                                </div>

                                {/* Dynamic buttons rendering inside bubble for WhatsApp template */}
                                {previewT.buttons && previewT.buttons.length > 0 && (
                                  <div className="border-t border-slate-100 mt-2 pt-1 divide-y divide-slate-100 flex flex-col">
                                    {previewT.buttons.map((btn, btnIndex) => (
                                      <div
                                        key={btnIndex}
                                        className="text-[#00a884] font-semibold text-[10px] py-1.5 text-center hover:bg-slate-50 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        {btn.type === 'URL' ? <ExternalLink size={10} /> : <MessageCircle size={10} />}
                                        <span>{btn.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* WhatsApp Footer Textbox Mockup */}
                            <div className="bg-[#f0f2f5] p-2 flex items-center gap-1.5 shrink-0 border-t border-slate-200">
                              <div className="flex-1 bg-white rounded-full px-3 py-1 text-[10px] text-slate-400 text-left">
                                Mesaj yazın...
                              </div>
                              <div className="w-6 h-6 bg-[#00a884] rounded-full flex items-center justify-center text-white shrink-0">
                                <Send size={10} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hızlı Test & Bilgiler */}
                        <div className="md:col-span-5 space-y-4">
                          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 shadow-xl">
                            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                              <Smartphone size={15} className="text-emerald-400" />
                              <span>Şablon Test Yayını</span>
                            </h3>
                            <p className="text-slate-400 text-[11px] leading-relaxed mb-3.5">
                              Bu onaylı şablonu gerçek veya kayıtlı bir numaraya WhatsApp mesajı olarak gönderebilirsiniz. Değişkenler otomatik olarak simüle edilecektir.
                            </p>

                            <div className="space-y-3 text-left">
                              <div>
                                <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Alıcı Telefon Numarası</label>
                                <input
                                  type="text"
                                  placeholder="+905051234567"
                                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500"
                                  value={testPhoneNumber}
                                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                                />
                              </div>

                              <button
                                type="button"
                                onClick={() => handleSendTestTemplate(previewT)}
                                disabled={isSendingTest || !testPhoneNumber.trim() || previewT.status !== 'APPROVED'}
                                className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                  previewT.status === 'APPROVED'
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 active:scale-95 cursor-pointer'
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {isSendingTest ? (
                                  <div className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full"></div>
                                ) : (
                                  <>
                                    <Send size={12} />
                                    <span>Test Mesajı Gönder</span>
                                  </>
                                )}
                              </button>

                              {previewT.status !== 'APPROVED' && (
                                <p className="text-[10px] text-amber-500 italic text-center">
                                  ⚠️ Sadece onaylı (APPROVED) şablonlar test amaçlı gönderilebilir.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 shadow-xl text-[11px] text-slate-400 space-y-2 text-left">
                            <h4 className="font-bold text-white uppercase text-xs flex items-center gap-1">
                              <Info size={14} className="text-blue-400" />
                              <span>Değişken Kuralları</span>
                            </h4>
                            <p>WhatsApp Cloud API şablonlarında değişkenler <code className="bg-slate-950 text-emerald-400 px-1 rounded">{"{{1}}"}</code>, <code className="bg-slate-950 text-emerald-400 px-1 rounded">{"{{2}}"}</code> formatında belirtilir.</p>
                            <p>Metinleri tasarlarken bu kod bloklarını kullanarak alıcı ad soyad, tarih gibi parametreleri dinamik kılabilirsiniz.</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Yeni Şablon Tasarım Modalı */}
              {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-slate-900 border border-white/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Plus size={16} className="text-emerald-400" />
                        <span>Yeni WhatsApp Şablonu Tasarla</span>
                      </h3>
                      <button 
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 text-xs text-left">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Şablon İsmi (Küçük harf & alt çizgi)</label>
                        <input
                          type="text"
                          required
                          placeholder="randevu_bilgilendirme_v1"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Sadece küçük harfler, sayılar ve alt çizgi (_) kullanın. Meta kuralları gereği boşluk içeremez.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Kategori</label>
                          <select
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                            value={templateCategory}
                            onChange={(e) => setTemplateCategory(e.target.value as any)}
                          >
                            <option value="UTILITY">UTILITY (Hizmet/Bilgi)</option>
                            <option value="MARKETING">MARKETING (Pazarlama/Kampanya)</option>
                            <option value="AUTHENTICATION">AUTHENTICATION (Doğrulama)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Dil</label>
                          <input
                            type="text"
                            required
                            placeholder="Türkçe (tr)"
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                            value={templateLanguage}
                            onChange={(e) => setTemplateLanguage(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Üst Bilgi Tipi (Header)</label>
                          <select
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                            value={templateHeaderType}
                            onChange={(e) => setTemplateHeaderType(e.target.value as any)}
                          >
                            <option value="NONE">Yok</option>
                            <option value="TEXT">Metin Başlığı</option>
                            <option value="IMAGE">Medya (Görsel Banner)</option>
                          </select>
                        </div>
                        {templateHeaderType === 'TEXT' && (
                          <div>
                            <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Başlık Metni</label>
                            <input
                              type="text"
                              placeholder="FocusOn Akademi"
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                              value={templateHeaderText}
                              onChange={(e) => setTemplateHeaderText(e.target.value)}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Şablon Gövdesi (Body)</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="Merhaba {{1}},\n\n{{2}} tarihindeki koçluk randevunuz onaylanmıştır."
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed text-xs"
                          value={templateBody}
                          onChange={(e) => setTemplateBody(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Değişkenler için {"{{1}}"}, {"{{2}}"} yer tutucularını kullanabilirsiniz.</p>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-black mb-1">Alt Bilgi (Footer - İsteğe Bağlı)</label>
                        <input
                          type="text"
                          placeholder="FocusOn Akademi Robotik Servisleri"
                          className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:ring-1 focus:ring-emerald-500"
                          value={templateFooter}
                          onChange={(e) => setTemplateFooter(e.target.value)}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-[10px] text-slate-400 uppercase font-black">Butonlar (Maks 3)</label>
                          {templateButtons.length < 3 && (
                            <button
                              type="button"
                              onClick={() => setTemplateButtons([...templateButtons, { type: 'QUICK_REPLY', text: '' }])}
                              className="text-xs text-emerald-400 hover:underline flex items-center gap-0.5"
                            >
                              <Plus size={12} />
                              Ekle
                            </button>
                          )}
                        </div>

                        {templateButtons.length > 0 && (
                          <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-white/5">
                            {templateButtons.map((btn, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <select
                                  value={btn.type}
                                  onChange={(e) => {
                                    const updated = [...templateButtons];
                                    updated[index] = { ...updated[index], type: e.target.value as any };
                                    setTemplateButtons(updated);
                                  }}
                                  className="bg-slate-900 border border-white/10 rounded-lg p-1.5 text-white"
                                >
                                  <option value="QUICK_REPLY">Hızlı Yanıt</option>
                                  <option value="URL">Web Bağlantısı (URL)</option>
                                </select>
                                <input
                                  type="text"
                                  required
                                  placeholder="Buton Yazısı"
                                  className="bg-slate-900 border border-white/10 rounded-lg p-1.5 text-white flex-1"
                                  value={btn.text}
                                  onChange={(e) => {
                                    const updated = [...templateButtons];
                                    updated[index].text = e.target.value;
                                    setTemplateButtons(updated);
                                  }}
                                />
                                {btn.type === 'URL' && (
                                  <input
                                    type="text"
                                    required
                                    placeholder="https://..."
                                    className="bg-slate-900 border border-white/10 rounded-lg p-1.5 text-white flex-1 animate-fadeIn"
                                    value={btn.value || ''}
                                    onChange={(e) => {
                                      const updated = [...templateButtons];
                                      updated[index].value = e.target.value;
                                      setTemplateButtons(updated);
                                    }}
                                  />
                                )}
                                <button
                                  type="button"
                                  onClick={() => setTemplateButtons(templateButtons.filter((_, i) => i !== index))}
                                  className="text-red-400 hover:text-red-500 p-1"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setIsCreateModalOpen(false)}
                          className="px-4 py-2 bg-slate-800 text-slate-300 font-semibold rounded-xl hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/15"
                        >
                          Şablonu Kaydet
                        </button>
                      </div>
                    </form>
                  </motion.div>
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
                                        <img src={proxiedUrl} alt={fName || "Görsel"} className="max-h-48 object-contain rounded w-full bg-slate-900/50" />
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
