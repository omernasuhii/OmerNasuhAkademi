import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Film, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  Layers, 
  Video, 
  Image as ImageIcon, 
  FileText, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  BookmarkCheck,
  Trash2, 
  HelpCircle, 
  Lightbulb, 
  Target, 
  Smartphone, 
  Monitor, 
  Bot, 
  User, 
  Clock, 
  ArrowRight, 
  ChevronRight, 
  Play, 
  Square, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Layout,
  RefreshCw,
  ChevronDown,
  Info,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import { 
  BrainstormMessage, 
  GeneratedCampaign, 
  TargetAudienceKey, 
  AdFormatKey,
  VideoClipScene
} from '../../types/socialAgency';
import { COMPLETE_SITE_RAG_PAGES, PageRagItem } from '../../data/completeSiteRag';

export default function AdminSocialMediaAgency() {
  // State
  const [messages, setMessages] = useState<BrainstormMessage[]>([
    {
      id: 'init_welcome',
      sender: 'director',
      text: 'Merhaba! Ben FocusON Akademi Kıdemli Reklam Kreatif Direktörünüz.\n\nSitemizin tüm kaynak kodları, panelleri (Öğrenci, Koç, Veli) ve 360° RAG motoru aktif durumda.\n\nHadi birlikte adım adım soru-cevaplarla hedefli reklamınızı ve Google Flow / Midjourney prompt setinizi oluşturalım!',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      quickReplies: [
        'Bir reklam oluşturmak istiyorum',
        'Yapay zeka asistan',
        'Sınav Metronomu ile süre yönetimi',
        '35+ Bilişsel ve ÇABA Analizleri'
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isBrainstorming, setIsBrainstorming] = useState(false);
  const [isGeneratingMaster, setIsGeneratingMaster] = useState(false);
  const [currentCampaign, setCurrentCampaign] = useState<GeneratedCampaign | null>(null);
  const [savedCampaigns, setSavedCampaigns] = useState<GeneratedCampaign[]>([]);
  const [showSavedModal, setShowSavedModal] = useState(false);
  
  // UI Tabs & Copy State
  const [activeTab, setActiveTab] = useState<'video_prompts' | 'screen_guide' | 'copy_pack' | 'image_prompts'>('video_prompts');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [speakingSceneIndex, setSpeakingSceneIndex] = useState<number | null>(null);

  // Auto-detected Diagnostic Cache
  const [lastAutoDetection, setLastAutoDetection] = useState<{
    audience: TargetAudienceKey;
    pageId: string;
    pageTitle: string;
    whatHappens: string;
    advantages: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const flowUrl = "https://labs.google/fx/tr/tools/flow";

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isBrainstorming]);

  // Load saved campaigns from localStorage & server
  useEffect(() => {
    loadSavedCampaigns();
  }, []);

  const loadSavedCampaigns = async () => {
    try {
      const local = localStorage.getItem('focuson_saved_ad_campaigns');
      if (local) {
        setSavedCampaigns(JSON.parse(local));
      }
      const res = await fetch('/api/ai-agency/saved-campaigns');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.campaigns) && data.campaigns.length > 0) {
          setSavedCampaigns(data.campaigns);
        }
      }
    } catch (e) {
      console.error('Failed to load saved campaigns:', e);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Text-To-Speech for Turkish Voiceover
  const handleSpeakVoiceover = (text: string, index: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Tarayıcınız seslendirmeyi desteklemiyor.');
      return;
    }

    if (speakingSceneIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingSceneIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingSceneIndex(null);
    utterance.onerror = () => setSpeakingSceneIndex(null);

    setSpeakingSceneIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  // Send Message to Creative Director
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isBrainstorming) return;

    const userMsg: BrainstormMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputMessage('');
    setIsBrainstorming(true);

    try {
      const response = await fetch('/api/ai-agency/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          chatHistory: newHistory,
          allSitePages: COMPLETE_SITE_RAG_PAGES
        })
      });

      const resData = await response.json();

      if (resData.success && resData.data) {
        const data = resData.data;
        
        if (data.autoDetectedAudience && data.autoDetectedPageId) {
          setLastAutoDetection({
            audience: data.autoDetectedAudience,
            pageId: data.autoDetectedPageId,
            pageTitle: data.autoDetectedPageTitle || data.autoDetectedPageId,
            whatHappens: data.whatHappensSummary || '',
            advantages: data.keyAdvantagesSummary || ''
          });
        }

        const directorMsg: BrainstormMessage = {
          id: `dir_${Date.now()}`,
          sender: 'director',
          text: data.directorReply || 'Harika bir fikir, devam edelim.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          suggestedAngles: data.suggestedAngles,
          quickReplies: data.quickReplies || (data.readyForMasterGeneration ? ['Tamamdır, Tam Promptları Üret 🚀', 'Farklı bir açı deneyelim'] : []),
          contentPlanDraft: data.contentPlanDraft,
          readyForMasterGeneration: data.readyForMasterGeneration,
          autoDetectionInfo: data.autoDetectedAudience ? {
            detectedAudience: data.autoDetectedAudience,
            detectedPageId: data.autoDetectedPageId,
            detectedPageTitle: data.autoDetectedPageTitle,
            whatHappensSummary: data.whatHappensSummary,
            connectedPagesSummary: data.connectedPagesSummary,
            keyAdvantagesSummary: data.keyAdvantagesSummary
          } : undefined
        };

        setMessages(prev => [...prev, directorMsg]);

        // If user explicitly confirmed and ready for generation
        if (data.readyForMasterGeneration) {
          // Trigger generation with detected context
          triggerMasterGeneration({
            audience: data.autoDetectedAudience || 'ogrenci',
            pageId: data.autoDetectedPageId || 'student_ai_assistant',
            format: 'reels_short_video',
            customBrief: text
          });
        }
      } else {
        throw new Error(resData.error || 'Yanıt alınamadı');
      }
    } catch (error: any) {
      console.error('Brainstorm error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'director',
          text: 'Üzgünüm, kreatif analiz sırasında bir bağlantı sorunu oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsBrainstorming(false);
    }
  };

  // Generate Master Production Package
  const triggerMasterGeneration = async (params?: {
    audience?: TargetAudienceKey;
    pageId?: string;
    selectedAngle?: any;
    format?: AdFormatKey;
    customBrief?: string;
  }) => {
    setIsGeneratingMaster(true);

    const audience = params?.audience || lastAutoDetection?.audience || 'ogrenci';
    const pageId = params?.pageId || lastAutoDetection?.pageId || 'public_home';
    const foundPage = COMPLETE_SITE_RAG_PAGES.find(p => p.id === pageId) || COMPLETE_SITE_RAG_PAGES[0];

    try {
      const response = await fetch('/api/ai-agency/generate-master-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audienceKey: audience,
          pageRagData: foundPage,
          selectedAngle: params?.selectedAngle || {
            title: foundPage.title,
            hook: foundPage.hookSuggestions?.[0] || 'FocusON Akademi ile geleceğe adım at.',
            coreConcept: foundPage.keyBenefitsAndAdvantages?.[0] || 'Yapay zeka ile sınav hazırlığı'
          },
          format: params?.format || 'reels_short_video',
          customRequirements: params?.customBrief || inputMessage,
          chatContext: messages.map(m => `${m.sender}: ${m.text}`).join('\n')
        })
      });

      const resData = await response.json();
      const campaignData = resData.data || resData.campaign;
      if (resData.success && campaignData) {
        const campaign = campaignData as GeneratedCampaign;
        setCurrentCampaign(campaign);
        setActiveTab('video_prompts');

        // Add confirmation message from director
        setMessages(prev => [
          ...prev,
          {
            id: `gen_${Date.now()}`,
            sender: 'director',
            text: `🎯 **"${campaign.campaignTitle}"** için 10 saniyelik 3 modüler Flow sahne promptu, ekran görüntüsü rehberi ve sosyal medya paketi hazırlandı! Sağ taraftaki stüdyo panelinden promptları kopyalayabilir veya doğrudan Google Flow'da üretime geçebilirsiniz.`,
            timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            quickReplies: ['Başka bir konuda reklam tasarla 🎬', 'Bu kampanyayı kaydet 💾']
          }
        ]);
      } else {
        throw new Error(resData.error || 'Kampanya üretilemedi.');
      }
    } catch (e: any) {
      console.error('Master generation error:', e);
      alert('Kampanya paketi üretilirken bir hata oluştu: ' + e.message);
    } finally {
      setIsGeneratingMaster(false);
    }
  };

  // Save Campaign
  const handleSaveCampaign = async (campaign: GeneratedCampaign) => {
    try {
      const updated = [campaign, ...savedCampaigns.filter(c => c.id !== campaign.id)];
      setSavedCampaigns(updated);
      localStorage.setItem('focuson_saved_ad_campaigns', JSON.stringify(updated));

      await fetch('/api/ai-agency/saved-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign })
      });

      alert('Kampanya ve tüm promptlar başarıyla arşive kaydedildi!');
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  // Delete Campaign
  const handleDeleteSaved = (id: string) => {
    const updated = savedCampaigns.filter(c => c.id !== id);
    setSavedCampaigns(updated);
    localStorage.setItem('focuson_saved_ad_campaigns', JSON.stringify(updated));
  };

  // Reset / Clear Chat
  const handleResetChat = () => {
    if (confirm('Sohbet geçmişini sıfırlayıp yeni bir reklam masası başlatmak istiyor musunuz?')) {
      setMessages([
        {
          id: 'init_new',
          sender: 'director',
          text: 'Masa temizlendi! Yeni reklam fikriniz veya odaklanmak istediğiniz konu nedir?',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          quickReplies: [
            'Yapay zeka asistan için reklam oluşturmak istiyorum',
            'Sınav Metronomu ile turlama taktiği Reels videosu',
            'Koçlar için veli raporlama karmaşasını bitiren reklam',
            'ÇABA Testi ve 35+ Bilişsel Teşhis Analizi'
          ]
        }
      ]);
      setLastAutoDetection(null);
    }
  };

  return (
    <div 
      id="ai-social-agency-studio"
      className="flex flex-col h-full w-full bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
    >
      {/* Üst Bar / Header */}
      <div 
        id="agency-header-bar"
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shrink-0"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Film size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                FocusON Kreatif Reklam & Flow Stüdyosu
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles size={12} /> 360° Kod & RAG Motoru
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Google Flow için 10s modüler sahne promptları, boş ekran/UI tracking rehberi ve sosyal medya paketleri
            </p>
          </div>
        </div>

        {/* Üst Aksiyonlar */}
        <div className="flex items-center gap-2">
          <button
            id="btn-agency-reset"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60"
            title="Yeni Reklam Masası Başlat"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Yeni Masa</span>
          </button>

          <button
            id="btn-agency-saved-archive"
            onClick={() => setShowSavedModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700/60 relative"
            title="Kayıtlı Kampanya Arşivi"
          >
            <Bookmark size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Arşiv</span>
            {savedCampaigns.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full font-bold">
                {savedCampaigns.length}
              </span>
            )}
          </button>

          <a
            id="btn-open-google-flow-external"
            href={flowUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 rounded-lg shadow-md shadow-indigo-500/25 transition-all transform active:scale-95"
            title="Google Flow Video Stüdyosunu Başlat"
          >
            <span>Google Flow'da Aç</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>

      {/* Ana Çalışma Alanı (İki Kolon: Sol Sohbet / Sağ Prodüksiyon Stüdyosu) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-950">
        
        {/* SOL KOLON: Kreatif Direktör İnteraktif Sohbet Masası (5 Kolon) */}
        <div 
          id="agency-chat-column"
          className="lg:col-span-5 flex flex-col border-r border-slate-800/80 bg-slate-950/60 overflow-hidden h-full"
        >
          {/* Sohbet Üst Bilgi Başlığı */}
          <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Bot size={15} className="text-indigo-400" />
              <span className="font-semibold text-slate-200">Kreatif Direktör Masası</span>
            </div>
            {lastAutoDetection && (
              <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium truncate max-w-[200px]">
                🎯 {lastAutoDetection.pageTitle}
              </span>
            )}
          </div>

          {/* Mesaj Listesi */}
          <div 
            id="agency-messages-scroll"
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'director' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-indigo-600/20 mt-1">
                    <Sparkles size={16} />
                  </div>
                )}

                <div className={`max-w-[88%] ${msg.sender === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                  <div 
                    className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/20' 
                        : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Taslak İçerik Planı Kartı (Varsa) */}
                    {msg.contentPlanDraft && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                          <Layout size={13} />
                          <span>Taslak Reklam & Sahne Planı</span>
                        </div>
                        <div className="space-y-1.5 text-slate-300">
                          <p><strong>🎣 0-10s Kanca:</strong> {msg.contentPlanDraft.hook}</p>
                          <p><strong>📱 10-20s Gelişme & Boş Ekran:</strong> {msg.contentPlanDraft.development}</p>
                          <p><strong>🎯 20-30s Çözüm & CTA:</strong> {msg.contentPlanDraft.resolutionAndCta}</p>
                        </div>
                      </div>
                    )}

                    {/* Önerilen Konsept Açıları (Varsa) */}
                    {msg.suggestedAngles && msg.suggestedAngles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                          <Lightbulb size={12} />
                          <span>Önerilen Reklam Açıları</span>
                        </div>
                        <div className="space-y-1.5">
                          {msg.suggestedAngles.map((angle, idx) => (
                            <button
                              key={angle.id || idx}
                              onClick={() => triggerMasterGeneration({ selectedAngle: angle })}
                              className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 transition-all group"
                            >
                              <div className="flex items-center justify-between text-xs font-semibold text-white group-hover:text-indigo-300">
                                <span>{angle.title}</span>
                                <ArrowRight size={13} className="text-slate-500 group-hover:text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{angle.hook}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Hızlı Tıklama Seçenekleri (Quick Replies) */}
                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {msg.quickReplies.map((reply, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleSendMessage(reply)}
                          disabled={isBrainstorming || isGeneratingMaster}
                          className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 rounded-lg border border-slate-800 hover:border-indigo-500/40 transition-all active:scale-95 disabled:opacity-50"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-500 px-1">{msg.timestamp}</span>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md mt-1">
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}

            {/* Yükleniyor / Düşünüyor Animasyonu */}
            {(isBrainstorming || isGeneratingMaster) && (
              <div className="flex gap-3 items-center text-slate-400 text-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 animate-pulse">
                  <Sparkles size={16} />
                </div>
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 rounded-bl-none flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>
                    {isGeneratingMaster 
                      ? '360° RAG Röntgeni & 10s Modüler Sahne Promptları Üretiliyor...' 
                      : 'Kodlar taranıyor & kreatif direktör yanıt hazırlıyor...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sohbet Giriş Formu */}
          <div 
            id="agency-input-box"
            className="p-3.5 bg-slate-900/90 border-t border-slate-800 shrink-0"
          >
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Örn: Yapay zeka asistan için reklam oluşturmak istiyorum..."
                disabled={isBrainstorming || isGeneratingMaster}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isBrainstorming || isGeneratingMaster}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white transition-all shadow-md shadow-indigo-600/20 active:scale-95 disabled:cursor-not-allowed"
                title="Gönder"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* SAĞ KOLON: Prodüksiyon & Google Flow Prompt Stüdyosu (7 Kolon) */}
        <div 
          id="agency-production-column"
          className="lg:col-span-7 flex flex-col bg-slate-950 overflow-hidden h-full"
        >
          {currentCampaign ? (
            /* KAMPANYA ÜRETİLDİĞİNDE GÖRÜNECEK DETAYLI PRODÜKSİYON PANELİ */
            <div className="flex flex-col h-full overflow-hidden">
              
              {/* Kampanya Başlık & Meta Şeridi */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 shrink-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {currentCampaign.audienceKey}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-pink-500/20 text-pink-300 border border-pink-500/30">
                        {currentCampaign.format}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                        {currentCampaign.psychologicalTrigger}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {currentCampaign.campaignTitle}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {currentCampaign.conceptSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSaveCampaign(currentCampaign)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                      title="Kampanyayı Arşive Kaydet"
                    >
                      <Bookmark size={14} className="text-amber-400" />
                      <span>Kaydet</span>
                    </button>

                    <a
                      href={flowUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg shadow-md shadow-indigo-600/30 transition-all"
                    >
                      <span>Flow'da Üret</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {/* Sekmeler / Tabs */}
                <div className="flex items-center gap-1 mt-4 border-b border-slate-800/80 -mb-5 pb-1 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('video_prompts')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                      activeTab === 'video_prompts' 
                        ? 'border-indigo-500 text-indigo-400 bg-slate-800/60' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Video size={14} />
                    <span>3x 10s Sahne Promptları</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('screen_guide')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                      activeTab === 'screen_guide' 
                        ? 'border-indigo-500 text-indigo-400 bg-slate-800/60' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Monitor size={14} />
                    <span>Ekran Görüntüsü & Kurgu Rehberi</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('copy_pack')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                      activeTab === 'copy_pack' 
                        ? 'border-indigo-500 text-indigo-400 bg-slate-800/60' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText size={14} />
                    <span>Sosyal Medya Metinleri</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('image_prompts')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 ${
                      activeTab === 'image_prompts' 
                        ? 'border-indigo-500 text-indigo-400 bg-slate-800/60' 
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <ImageIcon size={14} />
                    <span>Görsel Tasarım Promptları</span>
                  </button>
                </div>
              </div>

              {/* Sekme İçerikleri */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* 1. SEKME: 3x 10s Modüler Google Flow Sahne Promptları */}
                {activeTab === 'video_prompts' && (
                  <div className="space-y-6">
                    {/* Üst Bilgilendirme Notu */}
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
                      <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong>Yapay Zeka Halüsinasyonunu Önleme Stratejisi:</strong> Her sahne promptu, kurguda logonun giydirilebilmesi için <em>"temiz negatif alan (boşluk)"</em> ve tablet/bilgisayar ekranı için <em>"solid dark blank/green screen"</em> direktifi içerir. Siteden alacağınız ekran görüntüsünü CapCut/Premiere'de bu ekrana track ediniz.
                      </div>
                    </div>

                    {/* Sahne Listesi */}
                    <div className="space-y-4">
                      {currentCampaign.storyboardScenes?.map((scene, idx) => (
                        <div 
                          key={idx}
                          className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3 relative group"
                        >
                          {/* Sahne Başlık & Zaman */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">
                                {scene.sceneNumber || idx + 1}
                              </span>
                              <h3 className="text-sm font-bold text-white">
                                {scene.stage || `Sahne ${idx + 1}`}
                              </h3>
                              <span className="text-xs text-slate-400 font-mono">
                                ({scene.timeRange || `${idx * 10}:00 - ${(idx + 1) * 10}:00`})
                              </span>
                            </div>

                            <button
                              onClick={() => handleCopy(scene.flowClipPrompt, `scene_prompt_${idx}`)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 transition-all active:scale-95"
                            >
                              {copiedKey === `scene_prompt_${idx}` ? (
                                <>
                                  <Check size={13} className="text-emerald-400" />
                                  <span className="text-emerald-400">Prompt Kopyalandı</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={13} />
                                  <span>Flow Promptunu Kopyala</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Flow Prompt Metni (İngilizce Optimize) */}
                          <div>
                            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center justify-between">
                              <span>🎬 Google Flow / Veo Prompt (10s Klip):</span>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-indigo-200 select-all leading-relaxed">
                              {scene.flowClipPrompt}
                            </div>
                          </div>

                          {/* Türkçe Dış Ses & TTS */}
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[11px] font-semibold text-slate-400">🎙️ %100 Türkçe Dış Ses:</span>
                              <p className="text-xs text-slate-200 font-medium italic">
                                "{scene.voiceoverText}"
                              </p>
                            </div>
                            <button
                              onClick={() => handleSpeakVoiceover(scene.voiceoverText, idx)}
                              className="self-start sm:self-center px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 shrink-0 transition-colors"
                              title="Seslendir"
                            >
                              {speakingSceneIndex === idx ? <VolumeX size={13} className="text-rose-400" /> : <Volume2 size={13} className="text-emerald-400" />}
                              <span>{speakingSceneIndex === idx ? 'Durdur' : 'Dinle'}</span>
                            </button>
                          </div>

                          {/* Ekran Üstü Türkçe Yazı */}
                          {scene.onScreenText && (
                            <div className="text-xs text-slate-300 flex items-center gap-2">
                              <span className="text-slate-500 font-semibold text-[11px]">📝 Ekranda Görünecek Yazı:</span>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[11px]">
                                {scene.onScreenText}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Hızlı Flow'a Geçiş Çubuğu */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-pink-950/60 border border-indigo-500/30 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Sparkles size={16} className="text-indigo-400" />
                          Promptları Google Flow'da Çalıştırmaya Hazırsınız
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Her sahne promptunu sırayla Flow'a yapıştırıp 10 saniyelik 3 klibinizi anında üretin.
                        </p>
                      </div>
                      <a
                        href={flowUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
                      >
                        <span>Google Flow'u Yeni Sekmede Başlat</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                )}

                {/* 2. SEKME: Ekran Görüntüsü & Kurgu Rehberi */}
                {activeTab === 'screen_guide' && (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                          <Monitor size={20} />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">
                            Siteden Alınacak Ekran Görüntüsü Yönergesi
                          </h3>
                          <p className="text-xs text-slate-400">
                            Hedef Sayfa: <code className="text-indigo-300 font-mono">{currentCampaign.screenCaptureGuide?.pageUrl || '/panel/ogrenci'}</code>
                          </p>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-slate-300">📌 Ekran Görüntüsü Alınacak Öğe / Görünüm:</span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {currentCampaign.screenCaptureGuide?.whatToCapture || 'İlgili sayfanın temiz masaüstü veya mobil tam ekran arayüzü.'}
                        </p>
                      </div>

                      {/* Adım Adım Kurgu Yönergesi */}
                      {currentCampaign.screenCaptureGuide?.stepByStepGuide && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-slate-300">🎬 CapCut / Premiere Pro İle Kurgu Adımları:</span>
                          <div className="space-y-1.5">
                            {currentCampaign.screenCaptureGuide.stepByStepGuide.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                                <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. SEKME: Sosyal Medya Metin & Hashtag Paketi */}
                {activeTab === 'copy_pack' && (
                  <div className="space-y-4">
                    {/* Vurucu Başlık */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>🎯 Vurucu Başlık / Kanca (Headline):</span>
                        <button
                          onClick={() => handleCopy(currentCampaign.copyPack?.headline || '', 'copy_headline')}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'copy_headline' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedKey === 'copy_headline' ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>
                      </div>
                      <p className="text-sm font-bold text-white">
                        {currentCampaign.copyPack?.headline}
                      </p>
                    </div>

                    {/* Gönderi Metni (Caption) */}
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span>📝 Gönderi / Reels Açıklama Metni (Caption):</span>
                        <button
                          onClick={() => handleCopy(currentCampaign.copyPack?.caption || '', 'copy_caption')}
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
                        >
                          {copiedKey === 'copy_caption' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          <span>{copiedKey === 'copy_caption' ? 'Kopyalandı' : 'Kopyala'}</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {currentCampaign.copyPack?.caption}
                      </p>
                    </div>

                    {/* CTA ve Hashtagler */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <span className="text-xs font-bold text-slate-400">⚡ Eyleme Çağrı (Call to Action):</span>
                        <p className="text-xs text-indigo-300 font-semibold">
                          {currentCampaign.copyPack?.callToAction}
                        </p>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5">
                        <span className="text-xs font-bold text-slate-400">🏷️ Hashtag Seti:</span>
                        <div className="flex flex-wrap gap-1">
                          {currentCampaign.copyPack?.hashtags?.map((tag, tIdx) => (
                            <span key={tIdx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. SEKME: Görsel Tasarım Promptları (Midjourney / Flux / Flow) */}
                {activeTab === 'image_prompts' && (
                  <div className="space-y-4">
                    {currentCampaign.imageRecipes?.map((recipe, rIdx) => (
                      <div 
                        key={recipe.id || rIdx}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <ImageIcon size={15} className="text-indigo-400" />
                            <h4 className="text-xs sm:text-sm font-bold text-white">{recipe.title}</h4>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
                              {recipe.format || '1:1'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(recipe.prompt, `img_prompt_${rIdx}`)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs transition-colors"
                          >
                            {copiedKey === `img_prompt_${rIdx}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedKey === `img_prompt_${rIdx}` ? 'Kopyalandı' : 'Promptu Kopyala'}</span>
                          </button>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-200 select-all leading-relaxed">
                          {recipe.prompt}
                        </div>

                        {/* Türkçe Tipografi Kılavuzu */}
                        {recipe.textOverlayGuide && (
                          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 space-y-1 text-xs">
                            <span className="text-slate-400 font-semibold text-[11px]">🎨 Görsel Üzeri Tipografi Önerisi:</span>
                            <p className="text-slate-200"><strong>Başlık:</strong> "{recipe.textOverlayGuide.mainHeadline}"</p>
                            {recipe.textOverlayGuide.subHeadline && (
                              <p className="text-slate-300"><strong>Alt Başlık:</strong> "{recipe.textOverlayGuide.subHeadline}"</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* HENÜZ KAMPANYA ÜRETİLMEDİĞİNDE GÖRÜNECEK BAŞLANGIÇ STÜDYOSU */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
              <div className="max-w-md w-full space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-600/30 text-white">
                  <Film size={32} />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                    Google Flow Modüler Prompt Masası
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    Sol taraftaki direktör ile sohbet ederek sitemizdeki herhangi bir özelliği seçin; sistem sizin için <strong>10s modüler Google Flow sahne promptları</strong>, <strong>UI tracking ekran yönergeleri</strong> ve <strong>Türkçe dış sesleri</strong> hazırlasın.
                  </p>
                </div>

                {/* Hızlı Başlatıcı Kartları */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                  <button
                    onClick={() => handleSendMessage('Sınav Metronomu ve TYT turlama taktiği için bir Reels reklamı yapalım')}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                      <span>⏱️ Sınav Metronomu</span>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      Soru başına süre tutma & denemede hızlanma stratejisi
                    </p>
                  </button>

                  <button
                    onClick={() => handleSendMessage('7/24 Sesli ve Görsel AI Soru Çözüm Asistanı için bir reklam kuralım')}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                      <span>🤖 Sesli AI Asistan</span>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      Gece saat 2'de takılınan soruyu adım adım sesli anlatan yapay zeka
                    </p>
                  </button>

                  <button
                    onClick={() => handleSendMessage('Koçlar için Excel karmaşasını bitiren ve veli raporlarını otomatikleştiren reklam')}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                      <span>📊 Koçluk & Veli Karnesi</span>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      50+ öğrenci takibi ve Pazar günleri otomatik WhatsApp veli raporu
                    </p>
                  </button>

                  <button
                    onClick={() => handleSendMessage('ÇABA Potansiyel Testi ve 35+ Teşhis Analizi için dönüşüm reklamı')}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500/40 transition-all text-xs group"
                  >
                    <div className="font-semibold text-slate-200 group-hover:text-indigo-300 flex items-center justify-between">
                      <span>🧠 35+ Bilişsel Teşhis</span>
                      <ChevronRight size={14} className="text-slate-500 group-hover:text-indigo-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      Kaygı, dikkat, öğrenme stili ve potansiyel haritası
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KAYITLI KAMPANYALAR MODALI / ARŞİV */}
      {showSavedModal && (
        <div 
          id="saved-campaigns-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
        >
          <div className="max-w-2xl w-full max-h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <Bookmark className="text-amber-400" size={18} />
                <h3 className="text-base font-bold text-white">Kayıtlı Reklam Kampanyaları & Prompt Arşivi</h3>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Modal List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {savedCampaigns.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  Henüz kaydedilmiş bir reklam kampanyası bulunmuyor.
                </div>
              ) : (
                savedCampaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300">
                          {camp.audienceKey}
                        </span>
                        <h4 className="text-sm font-bold text-white">{camp.campaignTitle}</h4>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{camp.conceptSummary}</p>
                      <span className="text-[10px] text-slate-500">{camp.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setCurrentCampaign(camp);
                          setShowSavedModal(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                      >
                        Görüntüle
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(camp.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Sil"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
