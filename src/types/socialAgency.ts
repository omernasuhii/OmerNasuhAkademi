import { PageRagItem } from '../data/completeSiteRag';

export type TargetAudienceKey = 'ogrenci' | 'veli' | 'koc' | 'sistem';

export type AdFormatKey = 'reels_short_video' | 'single_feed_post' | 'carousel_post' | 'story_series';

export interface BrainstormMessage {
  id: string;
  sender: 'user' | 'director';
  text: string;
  timestamp: string;
  suggestedAngles?: {
    id: string;
    title: string;
    hook: string;
    coreConcept: string;
    recommendedFormat: AdFormatKey;
  }[];
  // Auto-detection analysis info in response
  autoDetectionInfo?: {
    detectedAudience: TargetAudienceKey;
    detectedPageId: string;
    detectedPageTitle: string;
    whatHappensSummary: string;
    connectedPagesSummary: string;
    keyAdvantagesSummary: string;
  };
}

export interface VideoClipScene {
  sceneNumber: number;
  timeRange: string; // e.g. "0:00 - 0:10 (10s)", "0:10 - 0:20 (10s)", "0:20 - 0:30 (10s)"
  stage: 'Hook (Kanca)' | 'Problem/Gelişme' | 'Çözüm/Arayüz' | 'Dönüşüm/CTA';
  speakerType?: 'voiceover' | 'character_dialogue';
  speakerRoleLabel?: string; // e.g. "🎙️ Arka Ses (Dış Ses)" | "🗣️ Karakter Konuşması (Lip-sync)"
  visualDescription: string;
  cameraMovement: string;
  characterAction: string;
  lightingAndAtmosphere: string;
  flowClipPrompt: string; // Ready to copy into Google Flow for this specific 10s clip with attached logo & UI screenshot references
  flowAudioPrompt?: string; // Explicit native Turkish audio / voice directive for Flow
  voiceoverText: string; // %100 Doğal İstanbul Türkçesi dış ses / replik
  onScreenText: string; // Ekranda görünecek Türkçe yazı
  audioSfxCues: string;
  attachmentDirectives?: {
    useAttachedLogo: boolean;
    useAttachedScreenshot: boolean;
    attachmentInstruction: string;
  };
}

export interface ScreenCaptureGuide {
  pageTitle: string;
  pageUrl: string; // e.g. "/panel/ogrenci/metronom"
  whatToCapture: string; // What exact element/view to screenshot
  stepByStepGuide: string[];
  recommendedResolution: string; // e.g. "1920x1080 Full HD (16:9)"
}

export interface FlowConsistencySettings {
  aspectRatio: '9:16' | '1:1' | '16:9';
  cameraOptics: string;
  lightingSetup: string;
  colorGrading: string;
  characterProfiles: string;
  environmentArchitecture: string;
  soundDesignScript: string;
  voiceAndAccentDirective?: string; // Explicit native Istanbul Turkish voice & accent instructions for Flow
  negativePrompts: string;
  logoAttachmentDirective: string;
  screenAttachmentDirective: string;
  flowGenerationSettings: {
    durationPerClip: string; // "10 saniye"
    motionSpeed: string;
    fidelity: string;
    styleTag: string;
  };
}

export interface SocialMediaCopyPack {
  headline: string;
  hookVariants: string[];
  caption: string;
  callToAction: string;
  hashtags: string[];
  recommendedMusicMood: string;
}

export interface ImagePromptRecipe {
  id: string;
  title: string;
  format: '1:1' | '9:16' | '16:9';
  prompt: string; // Full production Midjourney / Flux / Ideogram prompt
  negativePrompt: string;
  compositionGuide: string;
  textOverlayGuide: {
    mainHeadline: string; // Görsel üzerine yazılacak Türkçe Ana Başlık
    subHeadline?: string; // Türkçe Alt Başlık
    ctaBadgeText?: string; // Rozet / Buton Yazısı
    fontStyleRecommendation: string; // Font stili ve ağırlığı
    colorPalette: string; // Renk kodları ve kontrast
  };
  logoPlacementGuide: string; // Logo yerleşim yönergesi
  screenScreenshotGuide: string; // Siteden alınacak ekran görüntüsü entegrasyonu
}

export interface GeneratedCampaign {
  id: string;
  createdAt: string;
  campaignTitle: string;
  audienceKey: TargetAudienceKey;
  targetFeatureId: string;
  featureTitle: string;
  format: AdFormatKey;
  conceptSummary: string;
  psychologicalTrigger: string;
  // RAG Diagnostic Output
  ragDiagnostic?: {
    pageTitle: string;
    pagePath: string;
    whatHappensOnPage: string[];
    connectedPages: { title: string; path: string; description: string }[];
    keyAdvantages: string[];
  };
  screenCaptureGuide: ScreenCaptureGuide;
  flowConsistencySettings: FlowConsistencySettings;
  storyboardScenes: VideoClipScene[];
  imageRecipes: ImagePromptRecipe[];
  copyPack: SocialMediaCopyPack;
  isSaved?: boolean;
}
