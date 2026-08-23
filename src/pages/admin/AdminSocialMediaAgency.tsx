import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  Video, 
  Image as ImageIcon, 
  Layers, 
  Users, 
  BrainCircuit, 
  Film, 
  Share2, 
  MessageSquare, 
  RefreshCw, 
  Zap, 
  Target, 
  FileText, 
  Download, 
  Sliders, 
  Clock, 
  HelpCircle, 
  Eye, 
  Maximize2, 
  Volume2, 
  Camera, 
  Palette, 
  Compass, 
  ChevronRight,
  ShieldCheck,
  Award,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Filter,
  Wand2,
  Globe,
  ArrowRight,
  Network,
  Activity,
  CheckCheck,
  Play,
  Pause,
  Mic,
  VolumeX,
  Headphones,
  Save,
  Trash2,
  FolderHeart,
  ExternalLink,
  Monitor,
  Search,
  Type,
  Layout,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  COMPLETE_SITE_RAG_PAGES, 
  ROLE_PROFILES, 
  PageRagItem 
} from '../../data/completeSiteRag';
import { 
  TargetAudienceKey, 
  AdFormatKey, 
  BrainstormMessage, 
  GeneratedCampaign, 
  VideoClipScene, 
  ImagePromptRecipe,
  ScreenCaptureGuide,
  FlowConsistencySettings
} from '../../types/socialAgency';

export default function AdminSocialMediaAgency() {
  // Navigation: Active main tab
  const [activeTab, setActiveTab] = useState<'studio' | 'saved_prompts'>('studio');

  // State: Briefing & RAG - Complete Site Pages
  const [selectedAudience, setSelectedAudience] = useState<TargetAudienceKey>('ogrenci');
  const [selectedPageId, setSelectedPageId] = useState<string>('public_exam_metronome');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [pageSearchQuery, setPageSearchQuery] = useState<string>('');
  const [customBrief, setCustomBrief] = useState<string>('');
  const [adFormat, setAdFormat] = useState<AdFormatKey>('reels_short_video');
  const [autoDetectedBadge, setAutoDetectedBadge] = useState<string | null>(null);

  // State: Chat & Brainstorming
  const [messages, setMessages] = useState<BrainstormMessage[]>([
    {
      id: 'init_1',
      sender: 'director',
      text: 'Merhaba! Ben FocusON Akademi Kıdemli Kreatif Direktörünüz. 360° Tam Site RAG motorumuz devrede.\n\nSitemizin hem **herkese açık sayfaları (Ana sayfa, Metronom, YÖK Tercih Robotu, vb.)** hem de **Öğrenci, Veli, Koç panel sayfaları (ÇABA Testi, 35+ Teşhis Analizi, Sesli AI Asistan, Haftalık WhatsApp Karnesi, Koçluk Masası)** tam teşekküllü taranmaktadır.\n\nAklınızdaki herhangi bir fikri, hedefi veya sorunu serbestçe yazın; yapay zeka **Hedef Kitleyi ve ilgili Site Sayfasını otomatik olarak tespit edecek**, her biri **10 saniyelik 3 modüler sahne promptu**, sitemizden **ekran görüntüsü alma rehberi**, logo entegrasyonu, **konuya özel canlı görsel tasarımı** ve **yüksek dönüşümlü sosyal medya metinlerini** hazırlayacaktır.',
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      suggestedAngles: [
        {
          id: 'angle_metronome_stress',
          title: 'Zaman Baskısı & TYT Süre Krizi Çözümü (10s Modüler)',
          hook: 'TYT\'de süren yetmiyor mu? Sorun bilginde değil, ritminde!',
          coreConcept: 'Öğrencinin son 20 soruyu yetiştirememesi korkusuna dokunup Sınav Metronomu ile turlama refleksini 10 saniyelik 3 sahnede öne çıkarma.',
          recommendedFormat: 'reels_short_video'
        },
        {
          id: 'angle_parent_transparency',
          title: 'Veli İçin Sıfır Çatışma & Haftalık WhatsApp Karnesi',
          hook: 'Çocuğunuzla "Ders çalıştın mı?" kavgasına son!',
          coreConcept: 'Her pazartesi 10:00\'da gelen otomatik veli gelişim raporunun sağladığı huzur ve şeffaflık.',
          recommendedFormat: 'reels_short_video'
        },
        {
          id: 'angle_caba_scholarship',
          title: 'Ezbere Değil Çabaya Burs (%100 Potansiyel Testi)',
          hook: 'Sadece derece yapanlar değil, azmedenler kazanıyor: ÇABA Testi Başladı!',
          coreConcept: 'Potansiyelini keşfetmek isteyen öğrencilere 15 dakikada bilimsel karne sunma.',
          recommendedFormat: 'reels_short_video'
        }
      ]
    }
  ]);
  const [inputText, setInputText] = useState<string>('');
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  // State: Generated Campaign
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState<boolean>(false);
  const [selectedAngle, setSelectedAngle] = useState<any>(null);

  // Copying feedback states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Saved campaigns (Firestore + local storage fallback)
  const [savedCampaigns, setSavedCampaigns] = useState<GeneratedCampaign[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);
  const [isSavingDb, setIsSavingDb] = useState<boolean>(false);
  const [savedSearchQuery, setSavedSearchQuery] = useState<string>('');
  const [activeSavedFilter, setActiveSavedFilter] = useState<string>('all');
  const [viewingSavedModal, setViewingSavedModal] = useState<GeneratedCampaign | null>(null);

  // Turkish Voiceover TTS States
  const [playingTtsId, setPlayingTtsId] = useState<string | null>(null);
  const [ttsRate, setTtsRate] = useState<number>(1.0);

  // Generated Visual Art Assets State for Image Recipes & Social Media Graphics
  const [generatedImages, setGeneratedImages] = useState<{ [recipeId: string]: string }>({});
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);

  // AI Image generation handler using Google Imagen 3 / Gemini Creative API
  const handleGenerateRecipeImage = async (recipe: ImagePromptRecipe) => {
    setGeneratingImageId(recipe.id);
    try {
      const res = await fetch('/api/ai-agency/generate-recipe-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: recipe.prompt,
          aspectRatio: recipe.format,
          recipeTitle: recipe.title,
          headline: recipe.textOverlayGuide?.mainHeadline,
          subHeadline: recipe.textOverlayGuide?.subHeadline,
          ctaBadgeText: recipe.textOverlayGuide?.ctaBadgeText
        })
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setGeneratedImages(prev => ({
          ...prev,
          [recipe.id]: data.imageUrl
        }));
      } else {
        alert(data.error || "Görsel üretilemedi. Lütfen tekrar deneyiniz.");
      }
    } catch (err: any) {
      console.error("Image generation error:", err);
      alert("Görsel oluşturulurken bir hata meydana geldi: " + (err?.message || "Bağlantı hatası"));
    } finally {
      setGeneratingImageId(null);
    }
  };

  // Fetch saved campaigns on mount
  useEffect(() => {
    fetchSavedCampaigns();
  }, []);

  const fetchSavedCampaigns = async () => {
    setIsLoadingSaved(true);
    try {
      const res = await fetch('/api/ai-agency/saved-campaigns');
      const data = await res.json();
      if (data.success && Array.isArray(data.campaigns) && data.campaigns.length > 0) {
        setSavedCampaigns(data.campaigns);
        localStorage.setItem('focuson_saved_ad_campaigns', JSON.stringify(data.campaigns));
      } else {
        // Fallback to local storage if DB is empty
        const local = localStorage.getItem('focuson_saved_ad_campaigns');
        if (local) {
          setSavedCampaigns(JSON.parse(local));
        }
      }
    } catch (e) {
      console.warn('Failed to load saved campaigns from DB, checking local storage:', e);
      const local = localStorage.getItem('focuson_saved_ad_campaigns');
      if (local) {
        try {
          setSavedCampaigns(JSON.parse(local));
        } catch (err) {}
      }
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handlePlayVoiceoverTts = (text: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert("Tarayıcınız ses sentezleme (TTS) özelliğini desteklemiyor.");
      return;
    }

    if (playingTtsId === id) {
      window.speechSynthesis.cancel();
      setPlayingTtsId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#"`]/g, '').trim();
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'tr-TR';
    utterance.rate = ttsRate;
    utterance.pitch = 1.0;

    // Retrieve and pick the most authentic native Turkish voice
    const voices = window.speechSynthesis.getVoices();
    const turkishVoice = voices.find(v => v.lang === 'tr-TR' || v.lang === 'tr_TR') ||
      voices.find(v => v.lang.toLowerCase().startsWith('tr') || v.name.toLowerCase().includes('turkish'));
    if (turkishVoice) {
      utterance.voice = turkishVoice;
    }

    utterance.onend = () => setPlayingTtsId(null);
    utterance.onerror = () => setPlayingTtsId(null);

    setPlayingTtsId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopTts = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingTtsId(null);
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isChatLoading]);

  const currentPage = COMPLETE_SITE_RAG_PAGES.find(p => p.id === selectedPageId) || COMPLETE_SITE_RAG_PAGES[0];
  const currentAudienceInfo = ROLE_PROFILES[selectedAudience];

  const categories = [
    { id: 'all', label: 'Tüm Sayfalar (360° RAG)' },
    { id: 'kamu_ve_ziyaretci', label: 'Herkese Açık & Vitrin' },
    { id: 'ogrenci_paneli', label: 'Öğrenci Paneli' },
    { id: 'veli_sistemi', label: 'Veli & WhatsApp' },
    { id: 'koc_ekosistemi', label: 'Koçluk & Mentörlük' },
    { id: 'analiz_ve_psikoloji', label: '35+ Analiz & Psikoloji' },
    { id: 'akademik_ve_sinav', label: 'Akademik & Sınavlar' },
    { id: 'topluluk_ve_sosyal', label: 'Topluluk & Yarışma' },
    { id: 'finans_ve_magaza', label: 'Burs & Cüzdan' }
  ];

  const filteredPages = COMPLETE_SITE_RAG_PAGES.filter(p => {
    // Category match
    const categoryMatches = selectedCategory === 'all' 
      || p.category === selectedCategory 
      || (selectedCategory === 'veli_sistemi' && p.category === 'veli_paneli') 
      || (selectedCategory === 'koc_ekosistemi' && p.category === 'koc_paneli');
    
    if (!categoryMatches) return false;

    // Search query match
    if (!pageSearchQuery.trim()) return true;
    const q = pageSearchQuery.toLowerCase().trim();
    return (
      p.title.toLowerCase().includes(q) ||
      p.urlPath.toLowerCase().includes(q) ||
      p.keywords.some(k => k.toLowerCase().includes(q)) ||
      p.painPointsSolved.some(pp => pp.toLowerCase().includes(q)) ||
      p.keyBenefitsAndAdvantages.some(b => b.toLowerCase().includes(q)) ||
      p.whatHappensOnPage.some(w => w.toLowerCase().includes(q))
    );
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputText;
    if (!textToSend.trim() || isChatLoading) return;

    const userMsg: BrainstormMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setInputText('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/ai-agency/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: textToSend,
          chatHistory: messages.map(m => ({ sender: m.sender, text: m.text })),
          customBrief,
          allSitePages: COMPLETE_SITE_RAG_PAGES
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        if (result.data.autoDetectedAudience && ROLE_PROFILES[result.data.autoDetectedAudience as TargetAudienceKey]) {
          setSelectedAudience(result.data.autoDetectedAudience as TargetAudienceKey);
        }
        if (result.data.autoDetectedPageId) {
          const match = COMPLETE_SITE_RAG_PAGES.find(p => p.id === result.data.autoDetectedPageId);
          if (match) {
            setSelectedPageId(match.id);
            setAutoDetectedBadge(`${match.title} • (${ROLE_PROFILES[result.data.autoDetectedAudience as TargetAudienceKey]?.label || 'Otomatik'})`);
            setTimeout(() => setAutoDetectedBadge(null), 7000);
          }
        }

        const directorMsg: BrainstormMessage = {
          id: `dir_${Date.now()}`,
          sender: 'director',
          text: result.data.directorReply || 'Harika bir fikir! Promptunuza göre en uygun hedef kitleyi ve ilgili site sayfasını RAG sistemiyle otomatik tespit ettim.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          suggestedAngles: result.data.suggestedAngles || [],
          autoDetectionInfo: result.data.autoDetectedPageTitle ? {
            detectedAudience: (result.data.autoDetectedAudience || selectedAudience) as TargetAudienceKey,
            detectedPageId: result.data.autoDetectedPageId || selectedPageId,
            detectedPageTitle: result.data.autoDetectedPageTitle || currentPage.title,
            whatHappensSummary: result.data.whatHappensSummary || '',
            connectedPagesSummary: result.data.connectedPagesSummary || '',
            keyAdvantagesSummary: result.data.keyAdvantagesSummary || ''
          } : undefined
        };
        setMessages(prev => [...prev, directorMsg]);
      } else {
        throw new Error(result.error || 'Yanıt alınamadı');
      }
    } catch (err: any) {
      const errorMsg: BrainstormMessage = {
        id: `err_${Date.now()}`,
        sender: 'director',
        text: `Fikir alışverişi sırasında küçük bir pürüz oluştu: ${err?.message || 'Lütfen tekrar deneyiniz.'}`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleGenerateMasterCampaign = async (angleToUse?: any) => {
    const angle = angleToUse || selectedAngle || {
      title: `${currentPage.title} - ${currentAudienceInfo.label} Reklam Paketi`,
      hook: currentPage.hookSuggestions[0] || 'Hedefine odaklan!',
      coreConcept: currentPage.keyBenefitsAndAdvantages[0] || 'FocusON Akademi Akıllı Çözümü'
    };

    setSelectedAngle(angle);
    setIsGeneratingCampaign(true);

    try {
      const response = await fetch('/api/ai-agency/generate-master-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audienceKey: selectedAudience,
          pageRagData: currentPage,
          selectedAngle: angle,
          format: adFormat,
          customRequirements: customBrief,
          chatContext: messages.slice(-4).map(m => `${m.sender}: ${m.text}`)
        })
      });

      const result = await response.json();
      if (result.success && result.campaign) {
        const c = result.campaign;
        const fullCampaign: GeneratedCampaign = {
          id: `camp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          campaignTitle: c.campaignTitle || angle.title,
          audienceKey: selectedAudience,
          targetFeatureId: currentPage.id,
          featureTitle: currentPage.title,
          format: adFormat,
          conceptSummary: c.conceptSummary || '',
          psychologicalTrigger: c.psychologicalTrigger || '',
          ragDiagnostic: c.ragDiagnostic || {
            pageTitle: currentPage.title,
            pagePath: currentPage.urlPath,
            whatHappensOnPage: currentPage.whatHappensOnPage,
            connectedPages: currentPage.connectedPages.map(con => ({ title: con.title, path: con.path, description: con.description })),
            keyAdvantages: currentPage.keyBenefitsAndAdvantages
          },
          screenCaptureGuide: c.screenCaptureGuide || {
            pageTitle: currentPage.title,
            pageUrl: currentPage.urlPath,
            whatToCapture: `${currentPage.title} sayfasının temel arayüz ekran görüntüsü`,
            stepByStepGuide: [
              `1. Sitemizde ${currentPage.urlPath} sayfasına gidin.`,
              '2. Tarayıcıyı tam ekran yapıp yüksek çözünürlüklü ekran görüntüsü (PNG/JPG) alın.',
              '3. Google Flow veya Midjourney\'de referans/ekler bölümüne yükleyin.'
            ],
            recommendedResolution: '1920x1080 (16:9)'
          },
          flowConsistencySettings: c.flowConsistencySettings || {
            aspectRatio: '9:16',
            cameraOptics: 'Arri Alexa Mini LF, Cooke Anamorphic 40mm',
            lightingSetup: 'Volumetric cinematic lighting with tungsten study desk practicals',
            colorGrading: 'Kodak Vision3 500T aesthetic',
            characterProfiles: 'High school student or parent, authentic micro-expressions',
            environmentArchitecture: 'Contemporary modern study room',
            soundDesignScript: 'Inspiring atmospheric soundscape with %100 Turkish voiceover',
            negativePrompts: 'blurry, low quality, CGI, plastic skin, distorted anatomy, text errors',
            logoAttachmentDirective: 'Use the attached FocusON Akademi logo from the input attachment/reference slot.',
            screenAttachmentDirective: 'Display the attached UI screenshot onto the device display screen.',
            flowGenerationSettings: {
              durationPerClip: '10 saniye',
              motionSpeed: '1.0x',
              fidelity: '8K',
              styleTag: 'Cinematic Hyper-Realistic Commercial'
            }
          },
          storyboardScenes: c.storyboardScenes || [],
          imageRecipes: c.imageRecipes || [],
          copyPack: c.copyPack || {
            headline: '',
            hookVariants: [],
            caption: '',
            callToAction: '',
            hashtags: [],
            recommendedMusicMood: ''
          }
        };

        setCampaign(fullCampaign);

        // Auto-save to database and state
        saveCampaignToDatabase(fullCampaign, false);

        // Notify in chat
        const notificationMsg: BrainstormMessage = {
          id: `dir_ready_${Date.now()}`,
          sender: 'director',
          text: `🎉 **"${fullCampaign.campaignTitle}"** reklam paketi eksiksiz hazırlandı!\n\n✨ **Öne Çıkan Özellikler:**\n- 🎬 **3 Adet 10 Saniyelik Modüler Flow Sahne Promptu**\n- 📸 **Siteden Ekran Görüntüsü Alma & Flow Eklerine Logo Yükleme Rehberi**\n- 🎨 **Görsel Tasarım & Tipografi Prompt Reçeteleri + Anlık Canlı Görsel Üretimi (Imagen 3)**\n- ✍️ **Sosyal Medya Metinleri & Kancalar (Konuya Özel Kart Tasarımı)**\n- 💾 **Veritabanına Otomatik Kaydedildi** ("Kayıtlı Promptlar" sekmesinden istediğiniz zaman erişebilirsiniz).`,
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, notificationMsg]);
      } else {
        throw new Error(result.error || 'Kampanya oluşturulamadı');
      }
    } catch (err: any) {
      alert(`Kampanya üretilirken hata oluştu: ${err?.message || 'Bilinmeyen hata'}`);
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

  const saveCampaignToDatabase = async (campaignToSave: GeneratedCampaign, showSuccessAlert = true) => {
    setIsSavingDb(true);
    try {
      // 1. Save to server / Firestore
      const res = await fetch('/api/ai-agency/saved-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign: campaignToSave })
      });
      const data = await res.json();

      // 2. Update local state
      const updated = [campaignToSave, ...savedCampaigns.filter(c => c.id !== campaignToSave.id)];
      setSavedCampaigns(updated);
      localStorage.setItem('focuson_saved_ad_campaigns', JSON.stringify(updated));

      if (showSuccessAlert) {
        alert('✅ Reklam promptları ve kampanya paketi başarıyla veritabanına kaydedildi!');
      }
    } catch (e: any) {
      console.error('Error saving campaign:', e);
      // Local fallback
      const updated = [campaignToSave, ...savedCampaigns.filter(c => c.id !== campaignToSave.id)];
      setSavedCampaigns(updated);
      localStorage.setItem('focuson_saved_ad_campaigns', JSON.stringify(updated));
      if (showSuccessAlert) {
        alert('Kampanya yerel arşive kaydedildi.');
      }
    } finally {
      setIsSavingDb(false);
    }
  };

  const handleDeleteSavedCampaign = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('Bu reklam paketini veritabanından silmek istediğinize emin misiniz?')) return;

    try {
      await fetch(`/api/ai-agency/saved-campaigns/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete endpoint error:', err);
    }

    const updated = savedCampaigns.filter(c => c.id !== id);
    setSavedCampaigns(updated);
    localStorage.setItem('focuson_saved_ad_campaigns', JSON.stringify(updated));

    if (viewingSavedModal?.id === id) {
      setViewingSavedModal(null);
    }
  };

  const handleLoadSavedToStudio = (savedCamp: GeneratedCampaign) => {
    setCampaign(savedCamp);
    setSelectedAudience(savedCamp.audienceKey);
    setSelectedPageId(savedCamp.targetFeatureId || 'public_exam_metronome');
    setActiveTab('studio');
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  // Filter saved campaigns for the archive tab
  const filteredSavedCampaigns = savedCampaigns.filter(c => {
    const matchesSearch = !savedSearchQuery || 
      c.campaignTitle.toLowerCase().includes(savedSearchQuery.toLowerCase()) ||
      c.featureTitle?.toLowerCase().includes(savedSearchQuery.toLowerCase()) ||
      c.conceptSummary?.toLowerCase().includes(savedSearchQuery.toLowerCase());

    const matchesFilter = activeSavedFilter === 'all' || c.audienceKey === activeSavedFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div id="ai-social-agency-container" className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-slate-100 font-sans">
      
      {/* 1. Header Banner & Main Tab Navigation */}
      <div id="agency-header" className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1527] to-slate-950 border border-white/10 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles size={14} className="animate-spin text-red-400" />
              FocusON AI Reklam Ajansı & Video Prodüksiyon Masası
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Modüler Reklam & Video Prompt Stüdyosu
            </h1>
            <p className="text-sm sm:text-base text-slate-400 max-w-3xl leading-relaxed">
              Google Flow ve AI video/görsel motorları için <strong>her biri 10 saniyelik modüler sahne promptları</strong>, sitemizden <strong>ekran görüntüsü alma rehberi</strong>, logomuzun Flow eklerine entegrasyonu ve <strong>%100 Türkçe dış sesler</strong> üreten profesyonel kreatif direktör.
            </p>
          </div>

          {/* Top Main Tabs Switcher */}
          <div className="flex items-center gap-2 bg-slate-950/80 border border-white/10 p-1.5 rounded-2xl backdrop-blur-md shrink-0 shadow-lg">
            <button
              id="tab-studio-btn"
              onClick={() => setActiveTab('studio')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                activeTab === 'studio'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-lg shadow-red-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Wand2 size={15} />
              Reklam Stüdyosu
            </button>
            <button
              id="tab-saved-prompts-btn"
              onClick={() => setActiveTab('saved_prompts')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all relative ${
                activeTab === 'saved_prompts'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FolderHeart size={15} />
              Kayıtlı Promptlar & Arşiv
              {savedCampaigns.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                  {savedCampaigns.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STUDIO VIEW */}
      {/* ========================================================================= */}
      {activeTab === 'studio' && (
        <div className="space-y-8">
          {/* Auto-Detection Notification Banner */}
          <AnimatePresence>
            {autoDetectedBadge && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-gradient-to-r from-amber-500/20 via-red-500/20 to-blue-500/20 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300">
                    <Wand2 size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">Promptunuza Göre Sistem Tarafından Otomatik Tespit Edildi!</p>
                    <p className="text-xs text-slate-300">Aktif Sayfa & Hedef Kitle: <strong className="text-white">{autoDetectedBadge}</strong></p>
                  </div>
                </div>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 font-semibold flex items-center gap-1">
                  <CheckCheck size={12} /> Otomatik Eşleşti
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1: 360° RAG Site Explorer & Auto-Detected Status */}
          <div id="step-1-briefing" className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-red-500/20">1</span>
                <div>
                  <h2 className="text-lg font-bold text-white">360° Site RAG Bilgi Tabanı (Ziyaretçi & Panel Sayfaları)</h2>
                  <p className="text-xs text-slate-400">Siz yazın, yapay zeka otomatik tespit etsin. İsterseniz buradan manuel de değiştirebilirsiniz.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-1.5">
                  <Wand2 size={12} className="text-amber-400" /> Kitle: <strong className="text-white">{currentAudienceInfo.label}</strong>
                </span>
                <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 flex items-center gap-1.5">
                  <Globe size={12} /> Sayfa: <strong className="text-white">{currentPage.title}</strong>
                </span>
              </div>
            </div>

            {/* Audience Buttons */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Users size={14} className="text-red-400" /> Hedef Kitle (Prompt İle Otomatik Belirlenir)
                </label>
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ⚡ Otomatik Tespit Aktif
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(ROLE_PROFILES) as TargetAudienceKey[]).map(key => {
                  const info = ROLE_PROFILES[key];
                  const isSelected = selectedAudience === key;
                  return (
                    <button
                      key={key}
                      id={`audience-btn-${key}`}
                      onClick={() => setSelectedAudience(key)}
                      className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                        isSelected
                          ? 'bg-red-600/15 border-red-500 text-white shadow-lg shadow-red-600/10 ring-1 ring-red-500'
                          : 'bg-slate-800/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                      }`}
                    >
                      <p className="text-xs font-bold text-white mb-1">{info.label}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{info.tone}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full-Site Index Search & Categories */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <BrainCircuit size={14} className="text-blue-400" /> Bütünleşik 360° Site İndeksi ({COMPLETE_SITE_RAG_PAGES.length} Sayfa/Modül)
                  </label>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-medium flex items-center gap-1">
                    <ShieldCheck size={11} /> Sıfır Halüsinasyon Garantisi
                  </span>
                </div>

                {/* Instant Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={pageSearchQuery}
                    onChange={e => setPageSearchQuery(e.target.value)}
                    placeholder="Site indeksinde ara (Metronom, DOPA, Veli, YÖK...)"
                    className="w-full bg-slate-950/90 border border-white/10 rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  {pageSearchQuery && (
                    <button
                      onClick={() => setPageSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* RAG Site Pages Grid */}
              {filteredPages.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                  <AlertCircle size={24} className="mx-auto text-amber-400 opacity-60" />
                  <p className="text-xs text-slate-400">"{pageSearchQuery}" aramasına uygun site modülü bulunamadı.</p>
                  <button
                    onClick={() => { setPageSearchQuery(''); setSelectedCategory('all'); }}
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Tüm site indeksini göster
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto custom-scrollbar p-1">
                  {filteredPages.map(page => {
                    const isSelected = selectedPageId === page.id;
                    return (
                      <button
                        key={page.id}
                        id={`page-btn-${page.id}`}
                        onClick={() => setSelectedPageId(page.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-600/10 ring-1 ring-blue-500'
                            : 'bg-slate-800/40 border-white/5 text-slate-400 hover:border-white/20 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white line-clamp-1">{page.title}</span>
                          {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shrink-0 ml-1" />}
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
                          {page.whatHappensOnPage[0]}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                          <span className="font-mono">{page.urlPath}</span>
                          <span className="text-slate-400">{page.connectedPages.length} Bağlantı</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Custom Brief */}
            <div className="pt-2 border-t border-white/5 space-y-2">
              <label className="text-xs font-semibold text-slate-300">Özel İstek / Kampanya Brifi (Opsiyonel)</label>
              <input
                id="custom-brief-input"
                type="text"
                value={customBrief}
                onChange={e => setCustomBrief(e.target.value)}
                placeholder="Örn: Sınava 3 ay kala süre yetiştiremeyen öğrenciler için aciliyet hissi veren 10 saniyelik 3 sahne kurgusu..."
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Step 2: Interactive AI Creative Director Chat */}
          <div id="step-2-chat" className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-lg shadow-amber-500/20">2</span>
                <div>
                  <h2 className="text-lg font-bold text-white">Kreatif Direktör Masası (Serbest Fikir & Otomatik Eşleşme)</h2>
                  <p className="text-xs text-slate-400">Ne yapmak istediğinizi serbestçe yazın, yapay zeka siteyi tarayıp 10 saniyelik sahne açılarını önersin.</p>
                </div>
              </div>
            </div>

            {/* Chat Box */}
            <div className="h-96 overflow-y-auto custom-scrollbar space-y-4 p-4 rounded-xl bg-slate-950/60 border border-white/5">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-2xl p-4 rounded-2xl text-xs sm:text-sm leading-relaxed space-y-3 ${
                      msg.sender === 'user'
                        ? 'bg-red-600 text-white rounded-br-none shadow-lg shadow-red-600/20'
                        : 'bg-slate-800/90 text-slate-200 border border-white/10 rounded-bl-none shadow-md'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 border-b border-white/10 pb-1.5 mb-1.5">
                      <span className="font-semibold flex items-center gap-1">
                        {msg.sender === 'director' ? <Sparkles size={11} className="text-amber-400" /> : <Users size={11} />}
                        {msg.sender === 'director' ? 'Kreatif Direktör (AI)' : 'Siz (Reklam Yöneticisi)'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <p className="whitespace-pre-line">{msg.text}</p>

                    {/* Auto-detected page analysis badge */}
                    {msg.autoDetectionInfo && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-xs space-y-2">
                        <div className="flex items-center justify-between text-blue-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Wand2 size={13} /> Otomatik Tespit Edilen Sayfa & Kitle:
                          </span>
                          <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-200">
                            {msg.autoDetectionInfo.detectedPageTitle}
                          </span>
                        </div>
                        {msg.autoDetectionInfo.whatHappensSummary && (
                          <p className="text-slate-300 text-[11px]">
                            <strong>Sayfada Yapılanlar:</strong> {msg.autoDetectionInfo.whatHappensSummary}
                          </p>
                        )}
                        {msg.autoDetectionInfo.keyAdvantagesSummary && (
                          <p className="text-emerald-300 text-[11px]">
                            <strong>Somut Avantajlar:</strong> {msg.autoDetectionInfo.keyAdvantagesSummary}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Suggested Angles in Chat */}
                    {msg.suggestedAngles && msg.suggestedAngles.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Zap size={12} /> Önerilen 10 Saniyelik Reklam Açıları (Tıklayarak Üretin):
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.suggestedAngles.map(angle => (
                            <div
                              key={angle.id}
                              className="p-3 rounded-xl bg-slate-900/90 border border-white/10 hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
                            >
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                                  {angle.title}
                                </p>
                                <p className="text-[11px] text-amber-400 italic">
                                  "{angle.hook}"
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  {angle.coreConcept}
                                </p>
                              </div>
                              <button
                                onClick={() => handleGenerateMasterCampaign(angle)}
                                disabled={isGeneratingCampaign}
                                className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-red-600/20 transition-all disabled:opacity-50"
                              >
                                <Sparkles size={13} />
                                Bu Açıyı Üret
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isChatLoading && (
                <div className="flex items-center gap-2 text-xs text-amber-400 p-3 bg-white/5 rounded-xl max-w-xs animate-pulse">
                  <Sparkles size={14} className="animate-spin" />
                  Kreatif Direktör RAG sayfalarını tarıyor ve açıları kurguluyor...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-2">
              <input
                id="director-chat-input"
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder="Aklınızdaki fikri veya derdi yazın (Örn: 'Sınavda zamanı yetmeyenler için metronomu öne çıkaralım')"
                className="flex-1 bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500 shadow-inner"
              />
              <button
                id="send-director-msg-btn"
                onClick={() => handleSendMessage()}
                disabled={isChatLoading || !inputText.trim()}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Gönder</span>
              </button>
            </div>
          </div>

          {/* Step 3: Generated Campaign Package Display */}
          <AnimatePresence>
            {isGeneratingCampaign && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-amber-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 animate-spin">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  360° RAG Röntgeni & 10s Modüler Sahne Promptları Üretiliyor...
                </h3>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  Google Flow için 10 saniyelik 3 sahne klip promptları, sitemizden ekran görüntüsü alma rehberi, logo ekleme yönergeleri ve %100 Türkçe dış sesler hazırlanıyor.
                </p>
              </motion.div>
            )}

            {campaign && !isGeneratingCampaign && (
              <motion.div
                id="generated-campaign-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                {/* Campaign Header & Save Button */}
                <div className="bg-gradient-to-br from-slate-900 via-[#131d36] to-slate-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-300">
                        {ROLE_PROFILES[campaign.audienceKey]?.label} Reklam Paketi
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 flex items-center gap-1">
                        <Globe size={11} /> {campaign.featureTitle}
                      </span>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-600/20 border border-amber-500/30 text-amber-300">
                        3x 10 Saniye Klip (30s)
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">
                      {campaign.campaignTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-3xl">
                      {campaign.conceptSummary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      id="save-campaign-btn"
                      onClick={() => saveCampaignToDatabase(campaign, true)}
                      disabled={isSavingDb}
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
                    >
                      <Save size={16} />
                      {isSavingDb ? 'Kaydediliyor...' : 'Veritabanına Kaydet'}
                    </button>
                  </div>
                </div>

                {/* 1. SCREEN CAPTURE GUIDE (Siteden Ekran Görüntüsü Alma & Flow Eklerine Ekleme Rehberi) */}
                <div id="screen-capture-guide-card" className="bg-gradient-to-br from-slate-900 via-[#101b33] to-slate-950 border-2 border-blue-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4 relative z-10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                          <Monitor size={16} />
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          📸 Siteden Ekran Görüntüsü Alma & Flow Eklerine Ekleme Rehberi
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Google Flow ve video sahnelerinde gerçek sitemizin arayüzünü kullanmak için hangi sayfanın görüntüsünü nasıl ekleyeceğiniz:
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-3 py-1.5 rounded-xl border border-blue-500/30">
                        URL: {campaign.screenCaptureGuide?.pageUrl || currentPage.urlPath}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 text-xs">
                    {/* Page & Screenshot Info */}
                    <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-blue-400 font-bold">
                        <Globe size={15} />
                        <h4>1. Alınacak Sayfa & Görüntü</h4>
                      </div>
                      <p className="text-white font-semibold">
                        {campaign.screenCaptureGuide?.pageTitle || currentPage.title}
                      </p>
                      <p className="text-slate-300 leading-relaxed">
                        {campaign.screenCaptureGuide?.whatToCapture || "İlgili sayfanın ana arayüz ekran görüntüsü"}
                      </p>
                      <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                        <strong>Önerilen Format:</strong> {campaign.screenCaptureGuide?.recommendedResolution || '1920x1080 Full HD (16:9)'}
                      </div>
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 font-bold">
                        <CheckCircle2 size={15} />
                        <h4>2. Adım Adım Nasıl Çekilecek?</h4>
                      </div>
                      <ul className="space-y-2 text-slate-300">
                        {(campaign.screenCaptureGuide?.stepByStepGuide || [
                          `1. Sitemizde ${currentPage.urlPath} sayfasına gidin.`,
                          '2. Tarayıcıyı tam ekran yapıp net bir ekran görüntüsü kaydedin.',
                          '3. Google Flow ekler bölümüne yükleyin.'
                        ]).map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Flow Attachment Slot & Logo Directive */}
                    <div className="bg-slate-950/80 border border-red-500/30 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-red-400 font-bold">
                        <Sparkles size={15} />
                        <h4>3. Google Flow Ekler (Reference) Yönergesi</h4>
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        Google Flow / Veo'da üretim yaparken <strong>'Attachments / Reference Image'</strong> slotuna:
                      </p>
                      <div className="space-y-2 text-[11px]">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-200">
                          <strong>1. Slot:</strong> FocusON Akademi Orijinal Logosu (PNG/Vektör)
                        </div>
                        <div className="p-2 bg-white/5 rounded-lg border border-white/5 text-slate-200">
                          <strong>2. Slot:</strong> {campaign.screenCaptureGuide?.pageTitle || currentPage.title} Ekran Görüntüsü
                        </div>
                      </div>
                      <p className="text-[10px] text-emerald-400 italic">
                        💡 Sahne 2 Flow promptunda bu referans görselleri ekrandaki cihaza ve üst köşeye otomatik giydirilecektir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. 10-SECOND MODULAR SCENE STORYBOARD FOR FLOW VIDEO GENERATION */}
                <div id="storyboard-scenes-card" className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-red-500/20">🎬</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">
                            10 Saniyelik Modüler Sahne Storyboard'u (3x 10s Klip)
                          </h3>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                            AI Video Optimize Edildi
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Google Flow, Veo, Kling, Runway ve Luma için tek tek üretilebilecek bağımsız 10 saniyelik sinematik klip promptları
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(campaign.flowConsistencySettings.negativePrompts || "on-screen camera metadata, camera model text, Cooke Anamorphic text, lens info overlay, timestamps, text watermarks, AI pseudo-text, garbled characters, distorted font, gibberish letters on screen, fake Latin text, blurry, low quality", 'global_negative_prompt')}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
                        title="Video motorlarında Negative Prompt alanına yapıştırmak için kopyalayın"
                      >
                        {copiedKey === 'global_negative_prompt' ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        Negatif Promptu Kopyala
                      </button>
                      <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 font-mono font-bold">
                        3x 10s (30 Saniye)
                      </span>
                    </div>
                  </div>

                  {/* Production Quality Rules Callout */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        👤 Flow Karakter &amp; Mekan Sürekliliği
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Flow karakter slotunuz baz alınır; 3 sahne boyunca aynı çalışma masası ve sabit aydınlatma korunur.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1">
                        🗣️ Arka Ses vs. Karakter Konuşması
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        1. ve 2. sahnede dudak kıpırdamaz (dış ses konuşur); 3. sahnede karakter doğrudan kameraya konuşur.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                        ⏱️ Kesintisiz 10s Seslendirme
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Metinler 12-16 kelime ile sınırlandırıldı; ses yarıda kesilmeden 5-7 saniyede kusursuz tamamlanır.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1">
                        🛡️ Sıfır Kamera Yazısı &amp; Temiz Ekran
                      </span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Monitörde AI uydurması yazılar ve ekranda kamera etiketleri render edilmez; temiz alan bırakılır.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {campaign.storyboardScenes.map(scene => {
                      const isPlayingThis = playingTtsId === `scene_tts_${scene.sceneNumber}`;
                      const fullSceneExport = `[Sahne ${scene.sceneNumber} - ${scene.timeRange} - ${scene.stage}]\n\nPROMPT:\n${scene.flowClipPrompt}\n\nNEGATIVE PROMPT:\n${campaign.flowConsistencySettings.negativePrompts || "on-screen camera metadata, camera model text, Cooke Anamorphic text, lens info overlay, timestamps, text watermarks, AI pseudo-text, garbled characters, distorted font, gibberish letters on screen, fake Latin text, blurry, low quality"}\n\nTÜRKÇE DIŞ SES (10s):\n"${scene.voiceoverText}"\n\nEKRANDA YAZI:\n${scene.onScreenText}`;

                      return (
                        <div
                          key={scene.sceneNumber}
                          className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/40 transition-all shadow-md"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white bg-white/10 px-2.5 py-1 rounded-lg">
                                Sahne {scene.sceneNumber}
                              </span>
                              <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
                                {scene.timeRange || `0:${(scene.sceneNumber - 1) * 10} - 0:${scene.sceneNumber * 10} (10s)`}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase text-blue-400 tracking-wider">
                                Aşama: {scene.stage}
                              </span>
                              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                {scene.visualDescription}
                              </p>
                            </div>

                            {/* Camera & Lighting */}
                            <div className="space-y-1.5 text-[11px] bg-white/5 p-3 rounded-xl">
                              <p className="text-slate-300"><strong>🎥 Kamera:</strong> {scene.cameraMovement}</p>
                              <p className="text-slate-400"><strong>💡 Işık & Atmosfer:</strong> {scene.lightingAndAtmosphere}</p>
                              {scene.attachmentDirectives && (
                                <p className="text-emerald-300 text-[10px] pt-1 border-t border-white/5">
                                  <strong>📎 Ekler:</strong> {scene.attachmentDirectives.attachmentInstruction}
                                </p>
                              )}
                            </div>

                            {/* Turkish Voiceover / Character Dialogue Box */}
                            <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                    <Mic size={12} />
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    (scene as any).speakerType === 'character_dialogue' || scene.sceneNumber === 3
                                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  }`}>
                                    {(scene as any).speakerRoleLabel || (scene.sceneNumber === 3 ? '🗣️ Karakter Konuşması (Lip-sync)' : '🎙️ Arka Ses (Dış Ses)')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(scene.voiceoverText, `vo_${scene.sceneNumber}`)}
                                    className="text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5 flex items-center gap-1"
                                    title="Metni Kopyala"
                                  >
                                    {copiedKey === `vo_${scene.sceneNumber}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                                    Kopyala
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePlayVoiceoverTts(scene.voiceoverText, `scene_tts_${scene.sceneNumber}`)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${
                                      isPlayingThis 
                                        ? 'bg-red-500 text-white animate-pulse' 
                                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
                                    }`}
                                  >
                                    {isPlayingThis ? <Pause size={10} /> : <Play size={10} />}
                                    {isPlayingThis ? 'Durdur' : 'Dinle'}
                                  </button>
                                </div>
                              </div>
                              <p className="text-slate-100 font-medium italic text-xs leading-relaxed">
                                "{scene.voiceoverText}"
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                                <span>{(scene as any).speakerType === 'character_dialogue' || scene.sceneNumber === 3 ? '🎭 Karakter kameraya konuşur' : '🤫 Karakter dudak oynatmaz'}</span>
                                <span className="text-amber-400/80 font-mono font-medium">10s Kesintisiz Senkron (~5-7s)</span>
                              </div>
                            </div>

                            {/* On-screen Text & SFX */}
                            <div className="text-[11px] space-y-1 bg-white/5 p-2.5 rounded-lg">
                              <p className="text-amber-300 font-semibold">
                                <strong>✍️ Ekranda Yazı:</strong> {scene.onScreenText}
                              </p>
                              <p className="text-slate-400 text-[10px]">
                                <strong>🔊 Ses/SFX:</strong> {scene.audioSfxCues}
                              </p>
                            </div>
                          </div>

                          {/* Copy Flow 10s Clip Prompt */}
                          <div className="pt-2 border-t border-white/5 space-y-2">
                            <div className="bg-slate-900 p-2.5 rounded-lg border border-white/5 text-[10px] font-mono text-slate-300 max-h-24 overflow-y-auto custom-scrollbar leading-relaxed">
                              {scene.flowClipPrompt}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <button
                                onClick={() => handleCopy(scene.flowClipPrompt, `scene_${scene.sceneNumber}`)}
                                className="py-2.5 rounded-xl bg-gradient-to-r from-red-600/30 to-amber-500/30 hover:from-red-600/50 hover:to-amber-500/50 border border-amber-500/40 text-amber-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md"
                              >
                                {copiedKey === `scene_${scene.sceneNumber}` ? (
                                  <>
                                    <Check size={12} className="text-emerald-300" />
                                    Kopyalandı!
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    Video Promptu
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(
                                  scene.flowAudioPrompt || `Language: Native Turkish (tr-TR, Istanbul accent). Voice: ${((scene as any).speakerType === 'character_dialogue' || scene.sceneNumber === 3 ? "Assigned Flow Character Voice (Lip-sync)" : "Assigned Flow Voice")}. Spoken line: "${scene.voiceoverText}"`,
                                  `audio_prompt_${scene.sceneNumber}`
                                )}
                                className="py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                                title="Google Flow Ses / Replik Alanına yapıştırmak için Türkçe ses direktifini kopyalar"
                              >
                                {copiedKey === `audio_prompt_${scene.sceneNumber}` ? (
                                  <>
                                    <Check size={12} className="text-emerald-300" />
                                    Ses Direktifi Alındı!
                                  </>
                                ) : (
                                  <>
                                    <Mic size={12} className="text-purple-400" />
                                    Ses Promptu
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleCopy(fullSceneExport, `full_scene_${scene.sceneNumber}`)}
                                className="py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all"
                                title="Prompt, Negatif Prompt ve Dış Ses paketini birlikte kopyalar"
                              >
                                {copiedKey === `full_scene_${scene.sceneNumber}` ? (
                                  <>
                                    <Check size={12} className="text-emerald-300" />
                                    Tümü Alındı!
                                  </>
                                ) : (
                                  <>
                                    <Sparkles size={12} className="text-amber-400" />
                                    Tam Paket
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. IMAGE DESIGN RECIPES, FULL PROMPTS & LIVE AI VISUAL GENERATION (Görsel Tasarım & Tipografi Prompt Reçeteleri + Anlık Üretim) */}
                <div id="image-recipes-card" className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-purple-600/30">📸</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">Görsel Tasarım & Tipografi Prompt Reçeteleri</h3>
                          <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-semibold flex items-center gap-1">
                            <Sparkles size={10} /> Konuyla İlgili Görsel Üretimi Aktif
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Seçilen konu ({campaign.featureTitle || campaign.targetFeatureId}) ve hedef kitleye özel Midjourney v6 / Imagen 3 görsel promptları, canlı yapay zeka görseli üretimi ve üzerine giydirilecek Türkçe tipografi katmanı.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {campaign.imageRecipes.map(recipe => {
                      const hasGeneratedImage = !!generatedImages[recipe.id];
                      const isGeneratingThis = generatingImageId === recipe.id;

                      return (
                        <div
                          key={recipe.id}
                          className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-purple-500/40 transition-all shadow-md"
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <ImageIcon size={16} className="text-purple-400" />
                                {recipe.title}
                              </h4>
                              <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-lg border border-purple-500/20 font-bold">
                                {recipe.format}
                              </span>
                            </div>

                            {/* Live AI Generated Image or Visual Preview Card with Typography Overlay */}
                            <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-950 group">
                              {hasGeneratedImage ? (
                                <div className="relative w-full aspect-video sm:aspect-square max-h-72 overflow-hidden flex items-center justify-center bg-black">
                                  <img
                                    src={generatedImages[recipe.id]}
                                    alt={recipe.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                  />
                                  {/* Typography Banner Overlay directly on the generated image */}
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/40 to-transparent p-4 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                      <div className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-amber-300 flex items-center gap-1">
                                        <Sparkles size={11} /> FocusON AI Tasarım
                                      </div>
                                      <a
                                        href={generatedImages[recipe.id]}
                                        download={`focuson_ad_${recipe.id}.jpg`}
                                        className="p-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white text-xs flex items-center gap-1"
                                        title="Görseli İndir"
                                      >
                                        <Download size={13} />
                                      </a>
                                    </div>
                                    <div className="space-y-1.5">
                                      <h5 className="text-sm sm:text-base font-extrabold text-white leading-tight drop-shadow-md">
                                        {recipe.textOverlayGuide?.mainHeadline}
                                      </h5>
                                      {recipe.textOverlayGuide?.subHeadline && (
                                        <p className="text-xs text-slate-200 line-clamp-1 drop-shadow">
                                          {recipe.textOverlayGuide.subHeadline}
                                        </p>
                                      )}
                                      {recipe.textOverlayGuide?.ctaBadgeText && (
                                        <span className="inline-block text-[10px] font-bold bg-amber-500 text-slate-950 px-2 py-0.5 rounded shadow">
                                          {recipe.textOverlayGuide.ctaBadgeText}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-5 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px]">
                                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                                    <Palette size={22} />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-white">Konuya Özel Görsel & Tipografi Tasarımı</p>
                                    <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                                      {recipe.textOverlayGuide?.mainHeadline ? `"${recipe.textOverlayGuide.mainHeadline}" temalı görsel oluşturun` : 'Yapay zeka ile bu reçeteye uygun anlık görsel üretin.'}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleGenerateRecipeImage(recipe)}
                                    disabled={isGeneratingThis}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
                                  >
                                    {isGeneratingThis ? (
                                      <>
                                        <RefreshCw size={13} className="animate-spin" />
                                        Görsel Çiziliyor (AI Imagen 3)...
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles size={13} />
                                        Bu Konu İçin Görseli Oluştur
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Full Visual Prompt Box */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-purple-300 tracking-wider flex items-center gap-1">
                                  <Camera size={12} /> Midjourney / Flux / Ideogram Promptu:
                                </span>
                                <button
                                  onClick={() => handleCopy(recipe.prompt, `prompt_${recipe.id}`)}
                                  className="text-[11px] text-purple-400 hover:text-white flex items-center gap-1"
                                >
                                  {copiedKey === `prompt_${recipe.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                  Promptu Kopyala
                                </button>
                              </div>
                              <div className="bg-slate-900 p-3 rounded-xl border border-white/5 text-xs font-mono text-slate-200 max-h-24 overflow-y-auto custom-scrollbar leading-relaxed">
                                {recipe.prompt}
                              </div>
                            </div>

                            {/* Typography & Text Overlay Guide */}
                            {recipe.textOverlayGuide && (
                              <div className="p-3 bg-purple-950/30 border border-purple-500/20 rounded-xl space-y-2 text-xs">
                                <span className="text-[10px] font-bold uppercase text-amber-300 tracking-wider flex items-center gap-1">
                                  <Type size={12} /> Görsel Üzerine Yazılacak Türkçe Tipografi & Başlıklar:
                                </span>
                                <div className="space-y-1 text-slate-200">
                                  <p><strong>Ana Başlık:</strong> <span className="text-amber-300 font-bold">"{recipe.textOverlayGuide.mainHeadline}"</span></p>
                                  {recipe.textOverlayGuide.subHeadline && (
                                    <p><strong>Alt Başlık:</strong> <span className="text-slate-300">"{recipe.textOverlayGuide.subHeadline}"</span></p>
                                  )}
                                  {recipe.textOverlayGuide.ctaBadgeText && (
                                    <p><strong>Rozet/Buton Metni:</strong> <span className="text-emerald-300 font-semibold">{recipe.textOverlayGuide.ctaBadgeText}</span></p>
                                  )}
                                  <p className="text-slate-400 text-[11px]"><strong>Font Tavsiyesi:</strong> {recipe.textOverlayGuide.fontStyleRecommendation}</p>
                                  <p className="text-slate-400 text-[11px]"><strong>Renk Paleti:</strong> {recipe.textOverlayGuide.colorPalette}</p>
                                </div>
                              </div>
                            )}

                            {/* Logo and Screenshot Guides */}
                            <div className="space-y-1.5 text-[11px] bg-white/5 p-3 rounded-xl">
                              <p className="text-slate-300">
                                <strong>🏷️ Logo Yerleşimi:</strong> {recipe.logoPlacementGuide || "Referans ekindeki FocusON Akademi logosu sağ üst köşede yer alacak."}
                              </p>
                              <p className="text-slate-400">
                                <strong>💻 Ekran Entegrasyonu:</strong> {recipe.screenScreenshotGuide || "Cihaz ekranında sitemizin ilgili ekran görüntüsü bulunacak."}
                              </p>
                              <p className="text-slate-400">
                                <strong>📐 Kompozisyon:</strong> {recipe.compositionGuide}
                              </p>
                            </div>
                          </div>

                          {/* Copy & Regenerate Actions */}
                          <div className="pt-3 border-t border-white/5 flex gap-2">
                            {!hasGeneratedImage && (
                              <button
                                onClick={() => handleGenerateRecipeImage(recipe)}
                                disabled={isGeneratingThis}
                                className="px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md shrink-0"
                              >
                                {isGeneratingThis ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                                Görsel Üret
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const fullRecipeText = `[${recipe.title} - ${recipe.format}]\n\nGÖRSEL PROMPTU:\n${recipe.prompt}\n\nTİPOGRAFİ & BAŞLIKLAR:\nAna Başlık: ${recipe.textOverlayGuide?.mainHeadline}\nAlt Başlık: ${recipe.textOverlayGuide?.subHeadline || '-'}\nButon: ${recipe.textOverlayGuide?.ctaBadgeText || '-'}\nFont: ${recipe.textOverlayGuide?.fontStyleRecommendation}\nRenk: ${recipe.textOverlayGuide?.colorPalette}\n\nLOGO REHBERİ: ${recipe.logoPlacementGuide}\nEKRAN REHBERİ: ${recipe.screenScreenshotGuide}`;
                                handleCopy(fullRecipeText, `img_${recipe.id}`);
                              }}
                              className="flex-1 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                            >
                              {copiedKey === `img_${recipe.id}` ? <Check size={14} /> : <Copy size={14} />}
                              Tüm Görsel & Tipografi Reçetesini Kopyala
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. SOCIAL MEDIA COPY PACK & DESIGN CARD (Sosyal Medya Metinleri & Kancalar + Konuya Özel Tasarım) */}
                <div id="copy-pack-card" className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-emerald-600/30">✍️</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">Sosyal Medya Metinleri & Kancalar</h3>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                            Yüksek Dönüşümlü Post & Banner
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">Instagram, TikTok ve LinkedIn için yüksek dönüşümlü açıklamalar ve paylaşıma hazır kart tasarımı</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature & Topic Banner Card (Konu İle Alakalı Görsel Kart Tasarımı) */}
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-950 to-blue-950/30 border border-emerald-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layout size={15} className="text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Belirlenen Konu Reklam Kartı Önizlemesi ({campaign.featureTitle || campaign.targetFeatureId})
                        </span>
                      </div>
                      <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-semibold">
                        {ROLE_PROFILES[campaign.audienceKey]?.label || 'Öğrenci'} Hedefli
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left 2 cols: Concept & Typography */}
                      <div className="md:col-span-2 space-y-2 bg-slate-900/90 p-4 rounded-xl border border-white/5">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                          🎯 Vurucu Kampanya Başlığı:
                        </span>
                        <h4 className="text-base font-extrabold text-white">
                          {campaign.copyPack.headline || campaign.campaignTitle}
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {campaign.conceptSummary || "Bu reklam tasarımı, öğrencilerin sınav anındaki süre stresine dokunup sitemizin somut modülünü devreye sokar."}
                        </p>
                        <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                          <span className="bg-emerald-500/10 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-medium">
                            💡 Tetikleyici: {campaign.psychologicalTrigger || "Zaman Kaygısı & Başarı"}
                          </span>
                          <span className="bg-blue-500/10 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-500/20 font-medium">
                            📌 Sayfa: {campaign.screenCaptureGuide?.pageTitle || campaign.featureTitle}
                          </span>
                        </div>
                      </div>

                      {/* Right col: Call to action pill & music */}
                      <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-white/5 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            🎵 Önerilen Ses/Müzik:
                          </span>
                          <p className="text-xs font-semibold text-amber-300">
                            {campaign.copyPack.recommendedMusicMood || "Energetic Lo-Fi with Inspiring Piano Drops"}
                          </p>
                        </div>
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <span className="text-[10px] text-emerald-400 font-bold block">Eyleme Çağrı (CTA):</span>
                          <span className="text-xs text-white font-bold">{campaign.copyPack.callToAction}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Vurucu Kanca Alternatifleri (Hook Variants)
                        </span>
                        <div className="space-y-2 mt-2">
                          {campaign.copyPack.hookVariants.map((hook, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-slate-950/80 border border-white/5 rounded-xl flex items-center justify-between group hover:border-amber-500/30 transition-colors"
                            >
                              <span className="text-slate-200 font-medium">"{hook}"</span>
                              <button
                                onClick={() => handleCopy(hook, `hook_${idx}`)}
                                className="text-slate-500 hover:text-amber-400 transition-colors p-1"
                              >
                                {copiedKey === `hook_${idx}` ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Önerilen Müzik / Ses Ambiyansı
                        </span>
                        <p className="p-3 bg-slate-950/80 border border-white/5 rounded-xl text-amber-300 font-semibold mt-2">
                          🎵 {campaign.copyPack.recommendedMusicMood}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Instagram / Facebook Gönderi Metni (Caption)
                        </span>
                        <div className="p-4 bg-slate-950/80 border border-white/5 rounded-xl whitespace-pre-line text-slate-300 mt-2 relative">
                          {campaign.copyPack.caption}
                          <button
                            onClick={() => handleCopy(campaign.copyPack.caption, 'full_caption')}
                            className="absolute top-3 right-3 text-slate-500 hover:text-white p-1 bg-white/5 rounded-lg border border-white/10"
                          >
                            {copiedKey === 'full_caption' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-950/80 border border-white/5 rounded-xl">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Harekete Geçirici Mesaj (CTA):</span>
                          <span className="text-white font-bold">{campaign.copyPack.callToAction}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(campaign.copyPack.callToAction, 'cta_copy')}
                          className="text-slate-400 hover:text-white p-1.5"
                        >
                          {copiedKey === 'cta_copy' ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 block mb-1.5">Hashtag Paketi:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {campaign.copyPack.hashtags.map((tag, idx) => (
                            <span key={idx} className="bg-white/5 border border-white/10 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SAVED PROMPTS & ARCHIVE TAB (Veritabanında Saklanan Reklam Promptları) */}
      {/* ========================================================================= */}
      {activeTab === 'saved_prompts' && (
        <div id="saved-prompts-archive-container" className="space-y-6">
          <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-500/20">
                  <FolderHeart size={16} />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-white">Veritabanında Kayıtlı Reklam Promptları & Arşiv</h2>
                  <p className="text-xs text-slate-400">Üretilen tüm 10 saniyelik sahne promptları, ekran görüntüsü rehberleri ve seslendirmeler burada saklanır.</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSavedCampaigns}
                  disabled={isLoadingSaved}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold flex items-center gap-1.5 text-slate-300 transition-colors"
                >
                  <RefreshCw size={13} className={isLoadingSaved ? 'animate-spin' : ''} />
                  Yenile
                </button>
              </div>
            </div>

            {/* Search & Audience Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={savedSearchQuery}
                  onChange={e => setSavedSearchQuery(e.target.value)}
                  placeholder="Kayıtlı kampanyalarda başlık, sayfa veya konsept ara..."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveSavedFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    activeSavedFilter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
                  }`}
                >
                  Tümü ({savedCampaigns.length})
                </button>
                {(Object.keys(ROLE_PROFILES) as TargetAudienceKey[]).map(key => {
                  const count = savedCampaigns.filter(c => c.audienceKey === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveSavedFilter(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 ${
                        activeSavedFilter === key
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-slate-400 border border-white/5'
                      }`}
                    >
                      {ROLE_PROFILES[key].label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Saved Campaigns Grid */}
          {filteredSavedCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 border border-white/10 rounded-3xl space-y-4">
              <FolderHeart size={48} className="mx-auto text-slate-600" />
              <h3 className="text-base font-bold text-slate-300">Henüz Kayıtlı Kampanya Bulunmuyor</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Reklam Stüdyosu sekmesinden bir kampanya ürettiğinizde otomatik olarak veritabanına kaydedilir veya "Veritabanına Kaydet" butonuna basabilirsiniz.
              </p>
              <button
                onClick={() => setActiveTab('studio')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 text-white text-xs font-bold"
              >
                Reklam Stüdyosuna Git
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSavedCampaigns.map(saved => (
                <div
                  key={saved.id}
                  className="bg-slate-900/80 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-xl transition-all hover:-translate-y-1"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                        {ROLE_PROFILES[saved.audienceKey]?.label || 'Genel'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {saved.createdAt ? new Date(saved.createdAt).toLocaleDateString('tr-TR') : 'Kayıtlı'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-2">
                      {saved.campaignTitle}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {saved.conceptSummary || '10 Saniyelik 3 Sahne Flow Prompt Paketi'}
                    </p>

                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-white/5 space-y-1 text-[11px]">
                      <p className="text-blue-300 font-semibold">
                        <strong>🎯 Sayfa:</strong> {saved.featureTitle || saved.targetFeatureId}
                      </p>
                      <p className="text-amber-300">
                        <strong>🎬 Sahneler:</strong> {saved.storyboardScenes?.length || 3} adet 10s sahne
                      </p>
                      <p className="text-purple-300">
                        <strong>📸 Görseller:</strong> {saved.imageRecipes?.length || 2} adet prompt reçetesi
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleLoadSavedToStudio(saved)}
                        className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
                      >
                        <Wand2 size={13} />
                        Stüdyoda Aç
                      </button>
                      <button
                        onClick={() => setViewingSavedModal(saved)}
                        className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye size={13} />
                        İncele
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          const scenesText = saved.storyboardScenes?.map(s => `[Sahne ${s.sceneNumber} - ${s.timeRange}]:\n${s.flowClipPrompt}`).join('\n\n') || '';
                          handleCopy(scenesText, `saved_scenes_${saved.id}`);
                        }}
                        className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedKey === `saved_scenes_${saved.id}` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        10s Sahneleri Kopyala
                      </button>

                      <button
                        onClick={(e) => handleDeleteSavedCampaign(saved.id, e)}
                        className="text-[11px] text-slate-500 hover:text-red-400 transition-colors p-1"
                        title="Veritabanından Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / Detailed Viewer for Saved Campaign */}
          <AnimatePresence>
            {viewingSavedModal && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900 border border-white/10 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 shadow-2xl relative"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-blue-600/20 text-blue-300 px-2.5 py-0.5 rounded border border-blue-500/30">
                        {ROLE_PROFILES[viewingSavedModal.audienceKey]?.label}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-1">
                        {viewingSavedModal.campaignTitle}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          handleLoadSavedToStudio(viewingSavedModal);
                          setViewingSavedModal(null);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5"
                      >
                        <Wand2 size={13} />
                        Stüdyoya Yükle
                      </button>
                      <button
                        onClick={() => setViewingSavedModal(null)}
                        className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 10s Scenes in Modal */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      🎬 10 Saniyelik Modüler Flow Sahneleri
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {viewingSavedModal.storyboardScenes?.map(scene => (
                        <div key={scene.sceneNumber} className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">Sahne {scene.sceneNumber}</span>
                            <span className="text-[10px] text-amber-400 font-mono">{scene.timeRange}</span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{scene.visualDescription}</p>
                          <div className="p-2 bg-white/5 rounded text-[10px] italic text-amber-200">
                            🗣️ "{scene.voiceoverText}"
                          </div>
                          <button
                            onClick={() => handleCopy(scene.flowClipPrompt, `modal_scene_${scene.sceneNumber}`)}
                            className="w-full py-1.5 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 text-[10px] font-bold"
                          >
                            {copiedKey === `modal_scene_${scene.sceneNumber}` ? 'Kopyalandı!' : 'Flow Promptunu Kopyala'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Image Recipes in Modal */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-purple-300 flex items-center gap-2">
                      📸 Görsel Tasarım & Tipografi Reçeteleri
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {viewingSavedModal.imageRecipes?.map(recipe => (
                        <div key={recipe.id} className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-white">{recipe.title}</span>
                            <span className="text-[10px] text-purple-400 font-mono">{recipe.format}</span>
                          </div>
                          <div className="p-2 bg-white/5 rounded font-mono text-[10px] text-slate-300 max-h-24 overflow-y-auto">
                            {recipe.prompt}
                          </div>
                          {recipe.textOverlayGuide && (
                            <p className="text-[11px] text-amber-300">
                              <strong>Başlık:</strong> "{recipe.textOverlayGuide.mainHeadline}"
                            </p>
                          )}
                          <button
                            onClick={() => handleCopy(recipe.prompt, `modal_img_${recipe.id}`)}
                            className="w-full py-1.5 rounded bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 text-[10px] font-bold"
                          >
                            {copiedKey === `modal_img_${recipe.id}` ? 'Kopyalandı!' : 'Görsel Promptunu Kopyala'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
