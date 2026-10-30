import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  Square, 
  Maximize, 
  Minimize,
  AlertCircle, 
  Settings, 
  Volume2, 
  Headphones, 
  Timer, 
  Clock, 
  StopCircle, 
  Lock,
  ChevronRight,
  ChevronLeft,
  Flag,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Bell,
  Sliders,
  Flame,
  HelpCircle
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../lib/AuthContext';

export interface ExamModeConfig {
  id: string;
  name: string;
  shortName: string;
  durationMinutes: number;
  totalQuestions: number;
  secondsPerQuestion: number;
  startHour: number;
  startMinute: number;
  description: string;
}

export const EXAM_MODES: Record<string, ExamModeConfig> = {
  'TYT': {
    id: 'TYT',
    name: 'TYT (Temel Yeterlilik)',
    shortName: 'TYT',
    durationMinutes: 165,
    totalQuestions: 125,
    secondsPerQuestion: 75,
    startHour: 10,
    startMinute: 15,
    description: '165 Dakika • 125 Soru • Soru Başı İdeal Süre: ~75 sn'
  },
  'AYT': {
    id: 'AYT',
    name: 'AYT (Alan Yeterlilik)',
    shortName: 'AYT',
    durationMinutes: 180,
    totalQuestions: 80,
    secondsPerQuestion: 135,
    startHour: 10,
    startMinute: 15,
    description: '180 Dakika • 80 Soru • Soru Başı İdeal Süre: ~135 sn'
  },
  'YDT': {
    id: 'YDT',
    name: 'YDT (Yabancı Dil)',
    shortName: 'YDT',
    durationMinutes: 120,
    totalQuestions: 80,
    secondsPerQuestion: 90,
    startHour: 15,
    startMinute: 45,
    description: '120 Dakika • 80 Soru • Soru Başı İdeal Süre: ~90 sn'
  },
  'LGS_SOZEL': {
    id: 'LGS_SOZEL',
    name: 'LGS Sözel Bölüm',
    shortName: 'LGS Sözel',
    durationMinutes: 75,
    totalQuestions: 50,
    secondsPerQuestion: 90,
    startHour: 9,
    startMinute: 30,
    description: '75 Dakika • 50 Soru • Soru Başı İdeal Süre: ~90 sn'
  },
  'LGS_SAYISAL': {
    id: 'LGS_SAYISAL',
    name: 'LGS Sayısal Bölüm',
    shortName: 'LGS Sayısal',
    durationMinutes: 80,
    totalQuestions: 40,
    secondsPerQuestion: 120,
    startHour: 11,
    startMinute: 30,
    description: '80 Dakika • 40 Soru • Soru Başı İdeal Süre: ~120 sn'
  },
  'CUSTOM': {
    id: 'CUSTOM',
    name: 'Serbest Ritim Antrenmanı',
    shortName: 'Serbest Mod',
    durationMinutes: 30,
    totalQuestions: 30,
    secondsPerQuestion: 60,
    startHour: 10,
    startMinute: 0,
    description: 'Kendi soru sayını ve süreni belirle'
  }
};

const MACRO_INTERVAL_SECONDS = 1200; // 20 dakika

/* -------------------------------------------------------------------------- */
/*                               PomodoroTimer                                */
/* -------------------------------------------------------------------------- */
function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const timerRef = useRef<any>(null);

  const MODES_CFG = {
    work: { label: 'Çalışma', minutes: 25, color: 'bg-rose-500', textColor: 'text-rose-500' },
    shortBreak: { label: 'Kısa Mola', minutes: 5, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
    longBreak: { label: 'Uzun Mola', minutes: 15, color: 'bg-blue-500', textColor: 'text-blue-500' }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (timerRef.current) clearInterval(timerRef.current);
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(587.33, ctx.currentTime);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
                osc.start();
                osc.stop(ctx.currentTime + 1.2);
              }
            } catch {
              // ignore audio error
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES_CFG[mode].minutes * 60);
  };

  const changeMode = (newMode: 'work' | 'shortBreak' | 'longBreak') => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(MODES_CFG[newMode].minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="flex bg-slate-800/50 p-1.5 rounded-2xl mb-8 border border-white/5">
        {Object.entries(MODES_CFG).map(([key, config]) => (
          <button
            key={key}
            id={`pomodoro-tab-${key}`}
            onClick={() => changeMode(key as any)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              mode === key 
                ? `${config.color} text-white shadow-lg` 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {config.label} ({config.minutes} dk)
          </button>
        ))}
      </div>

      <div className={`w-full bg-slate-900 border border-white/10 py-14 sm:py-20 flex items-center justify-center rounded-[2.5rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden px-4 ${isRunning ? 'border-' + MODES_CFG[mode].color.split('-')[1] + '-500/30 shadow-' + MODES_CFG[mode].color.split('-')[1] + '-500/10' : ''}`}>
        <div className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-bold ${MODES_CFG[mode].textColor} tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors`}
             style={{ fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace" }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          id="pomodoro-toggle-btn"
          onClick={toggleTimer}
          className={`w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-400' : MODES_CFG[mode].color}`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1.5" />}
        </button>
        <button 
          id="pomodoro-reset-btn"
          onClick={resetTimer}
          className="w-16 h-16 flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all hover:scale-105 active:scale-95 border border-white/5"
          title="Sıfırla"
        >
          <RotateCcw size={22} />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                           ExamMetronomeContent                             */
/* -------------------------------------------------------------------------- */
export function ExamMetronomeContent({ isFocusMode, setIsFocusMode }: { isFocusMode: boolean; setIsFocusMode: (val: boolean) => void }) {
  // Mode selection & custom parameters
  const [selectedModeKey, setSelectedModeKey] = useState<string>('TYT');
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [customQuestions, setCustomQuestions] = useState<number>(30);
  const [customSecondsPerQuestion, setCustomSecondsPerQuestion] = useState<number>(60);

  // Helper to update custom inputs and auto calculate seconds per question
  const handleCustomMinutesChange = (newMinutes: number) => {
    setCustomMinutes(newMinutes);
    if (customQuestions > 0) {
      const calculatedSec = Math.max(5, Math.round((newMinutes * 60) / customQuestions));
      setCustomSecondsPerQuestion(calculatedSec);
    }
  };

  const handleCustomQuestionsChange = (newQuestions: number) => {
    setCustomQuestions(newQuestions);
    if (newQuestions > 0) {
      const calculatedSec = Math.max(5, Math.round((customMinutes * 60) / newQuestions));
      setCustomSecondsPerQuestion(calculatedSec);
    }
  };

  // Active configuration
  const currentConfig: ExamModeConfig = useMemo(() => {
    if (selectedModeKey === 'CUSTOM') {
      return {
        id: 'CUSTOM',
        name: 'Serbest Ritim Antrenmanı',
        shortName: 'Serbest Mod',
        durationMinutes: customMinutes,
        totalQuestions: customQuestions,
        secondsPerQuestion: customSecondsPerQuestion,
        startHour: 10,
        startMinute: 0,
        description: `${customMinutes} Dakika • ${customQuestions} Soru • Soru Başı: ${customSecondsPerQuestion} sn`
      };
    }
    return EXAM_MODES[selectedModeKey] || EXAM_MODES['TYT'];
  }, [selectedModeKey, customMinutes, customQuestions, customSecondsPerQuestion]);

  // Running and elapsed states
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState<number>(1);
  const [questionElapsedSeconds, setQuestionElapsedSeconds] = useState<number>(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [timeDisplayMode, setTimeDisplayMode] = useState<'countdown' | 'simulatedClock' | 'questionTimer'>('countdown');
  
  // Status banner and notifications
  const [statusText, setStatusText] = useState<string>('Sınava başlamak için hazır.');
  const [turlamaAlertActive, setTurlamaAlertActive] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Sound settings
  const [rhythmVolume, setRhythmVolume] = useState<number>(60);
  const [chimeVolume, setChimeVolume] = useState<number>(85);
  const [soundStyle, setSoundStyle] = useState<'click' | 'beep' | 'wood'>('wood');
  const [beatCadence, setBeatCadence] = useState<'exam_pace' | 'twenty_min_only' | 'silent' | 'question_and_countdown' | 'every_second' | 'every_5_sec'>('exam_pace');
  const [envSoundType, setEnvSoundType] = useState<string>('3d_osym_hall');
  const [envVolume, setEnvVolume] = useState<number>(35);
  const [isAmbientPreviewing, setIsAmbientPreviewing] = useState<boolean>(false);
  const [autoAdvanceQuestion, setAutoAdvanceQuestion] = useState<boolean>(true);
  const [recentChimeNotice, setRecentChimeNotice] = useState<string | null>(null);

  // References for reliable clock engine
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rhythmGainRef = useRef<GainNode | null>(null);
  const chimeGainRef = useRef<GainNode | null>(null);
  const envGainRef = useRef<GainNode | null>(null);
  const envAudioNodesRef = useRef<{ sources: AudioNode[]; timers: any[] } | null>(null);

  const startTimeRef = useRef<number>(0);
  const pausedAtElapsedRef = useRef<number>(0);
  const currentQuestionRef = useRef<number>(1);
  const questionStartTimeRef = useRef<number>(0);
  const lastProcessedElapsedRef = useRef<number>(-1);
  
  const timerIntervalRef = useRef<any>(null);
  const workerRef = useRef<Worker | null>(null);
  const wakeLockRef = useRef<any>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  // Sync refs with state
  useEffect(() => {
    currentQuestionRef.current = currentQuestionNumber;
  }, [currentQuestionNumber]);

  /* ---------------------- Audio Engine Initialization --------------------- */
  const initAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass) {
          const ctx = new AudioCtxClass();
          audioCtxRef.current = ctx;

          const rGain = ctx.createGain();
          rGain.connect(ctx.destination);
          rhythmGainRef.current = rGain;

          const cGain = ctx.createGain();
          cGain.connect(ctx.destination);
          chimeGainRef.current = cGain;

          const eGain = ctx.createGain();
          eGain.connect(ctx.destination);
          envGainRef.current = eGain;
        }
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
      updateVolumeGains();
    } catch (e) {
      console.warn("Web Audio API init error:", e);
    }
  }, []);

  const updateVolumeGains = useCallback(() => {
    if (rhythmGainRef.current) {
      rhythmGainRef.current.gain.value = Math.max(0, rhythmVolume / 100);
    }
    if (chimeGainRef.current) {
      chimeGainRef.current.gain.value = Math.max(0, chimeVolume / 100);
    }
    if (envGainRef.current) {
      envGainRef.current.gain.value = Math.max(0, (envVolume / 100) * 0.65);
    }
  }, [rhythmVolume, chimeVolume, envVolume]);

  useEffect(() => {
    updateVolumeGains();
  }, [rhythmVolume, chimeVolume, envVolume, updateVolumeGains]);

  /* ------------------------- Sound Synthesizers --------------------------- */
  // Soru geçişlerinde dikkati dağıtmayan, yumuşak ve zarif bip/tık sesi
  const playQuestionTick = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current;
    const gainNode = rhythmGainRef.current;
    if (!ctx || !gainNode) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;

    if (soundStyle === 'beep') {
      // Yumuşak, dikkat dağıtmayan sinüs bip (880 Hz, 45ms, kulak yormaz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.048);
      osc.connect(gain);
      gain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (soundStyle === 'click') {
      // Zarif, kısa mekanik tık sesi
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.03);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.32, now + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      osc.connect(gain);
      gain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.035);
    } else {
      // 'wood' (varsayılan): Doğal, tok ve sakin ahşap metronom vuruşu
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.04);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.38, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(gainNode);
      osc.start(now);
      osc.stop(now + 0.045);
    }
  }, [initAudio, soundStyle]);

  const playRhythmTick = playQuestionTick;

  const playCountdownPip = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current;
    const gainNode = rhythmGainRef.current;
    if (!ctx || !gainNode) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1320, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    osc.connect(gain);
    gain.connect(gainNode);
    osc.start(now);
    osc.stop(now + 0.055);
  }, [initAudio]);

  const playQuestionChime = playQuestionTick;

  // 20 dakikalık periyotlarda tek bir dinlendirici çan sesi (Tek vuruş, 528 Hz akustiği)
  const playTwentyMinuteBell = useCallback(() => {
    initAudio();
    const ctx = audioCtxRef.current;
    const gainNode = chimeGainRef.current;
    if (!ctx || !gainNode) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const now = ctx.currentTime;

    // Tek bir zarif çan vuruşu (528 Hz - dingin ve berrak frekans)
    const fundamental = 528.0;
    const partials = [
      { ratio: 1.0, gain: 1.0, decay: 2.8 },
      { ratio: 2.0, gain: 0.35, decay: 2.0 },
      { ratio: 2.76, gain: 0.16, decay: 1.5 },
      { ratio: 4.07, gain: 0.07, decay: 0.9 }
    ];

    partials.forEach(({ ratio, gain: pGain, decay }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * ratio, now);

      const peak = 0.5 * pGain * 0.4;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(peak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gain);
      gain.connect(gainNode);
      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  }, [initAudio]);

  const playMacroNotification = playTwentyMinuteBell;

  /* ------------------- Synthesized 3D Ambient Sound Generator ------------- */
  const stopAmbientSound = useCallback(() => {
    if (envAudioNodesRef.current) {
      envAudioNodesRef.current.timers.forEach(t => {
        clearInterval(t);
        clearTimeout(t);
      });
      envAudioNodesRef.current.sources.forEach(src => {
        try {
          if ('stop' in src && typeof (src as any).stop === 'function') {
            (src as any).stop();
          }
          src.disconnect();
        } catch (_) {}
      });
      envAudioNodesRef.current = null;
    }
  }, []);

  const startAmbientSound = useCallback((type: string) => {
    stopAmbientSound();
    if (type === 'none') return;
    initAudio();

    const ctx = audioCtxRef.current;
    const gainNode = envGainRef.current;
    if (!ctx || !gainNode) return;
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});

    const activeSources: AudioNode[] = [];
    const activeTimers: any[] = [];

    // Web Audio Stereo / 3D Spatial Panner Node Helper
    const createSpatialPanner = (panValue: number): AudioNode => {
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = Math.max(-1, Math.min(1, panValue));
        return panner;
      }
      return ctx.createGain();
    };

    try {
      if (type === 'focus_binaural') {
        // 432 Hz saf alfa frekansı ve dingin binaural rezonans
        const osc = ctx.createOscillator();
        const biquad = ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(432, ctx.currentTime);
        biquad.type = 'lowpass';
        biquad.frequency.setValueAtTime(800, ctx.currentTime);
        osc.connect(biquad);
        biquad.connect(gainNode);
        osc.start();
        activeSources.push(osc, biquad);
        envAudioNodesRef.current = { sources: activeSources, timers: activeTimers };
        return;
      }

      if (type === 'brown_noise' || type === 'white_noise') {
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastVal = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'brown_noise') {
            lastVal = (lastVal + (0.02 * white)) / 1.02;
            data[i] = lastVal * 3.5;
          } else {
            data[i] = white * 0.25;
          }
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'brown_noise' ? 350 : 1600;
        source.connect(filter);
        filter.connect(gainNode);
        source.start();
        activeSources.push(source, filter);
        envAudioNodesRef.current = { sources: activeSources, timers: activeTimers };
        return;
      }

      // -------------------------------------------------------------
      // 3 BOYUTLU GERÇEKÇİ SINAV ORTAMI (Uğultusuz & Saf Akustik)
      // Arka plandaki tüm uğultu, dip gürültüsü ve bas frekanslar
      // 380 Hz High-pass akustik filtre ile tamamen sıfırlanmıştır.
      // Sadece gerçek sınavdaki gibi sessiz zemin üzerinde 3D doğal
      // kurşun kalem, optik kodlama, silgi ve sayfa sesleri duyulur.
      // (3d_osym_hall | 3d_library | 3d_amphi | 3d_rain_hall)
      // -------------------------------------------------------------

      const roomAcousticFilter = ctx.createBiquadFilter();
      roomAcousticFilter.type = 'highpass';
      roomAcousticFilter.frequency.value = 380; // Uğultu, rezonans ve dip gürültüsünü tamamen keser
      roomAcousticFilter.connect(gainNode);
      activeSources.push(roomAcousticFilter);

      // 1. Yağmurlu Salon Seçeneği İçin: Sadece Hafif Cam Damlaları (Uğultusuz)
      if (type === '3d_rain_hall') {
        const rainBufSize = Math.floor(ctx.sampleRate * 2.5);
        const rainBuf = ctx.createBuffer(2, rainBufSize, ctx.sampleRate);
        const lRain = rainBuf.getChannelData(0);
        const rRain = rainBuf.getChannelData(1);
        for (let i = 0; i < rainBufSize; i++) {
          // Yalnızca tiz pencerelere çarpan ince su damlaları, alçak frekans uğultusu yok
          const dropL = Math.random() < 0.003 ? (Math.random() * 0.18) : 0;
          const dropR = Math.random() < 0.003 ? (Math.random() * 0.18) : 0;
          lRain[i] = dropL;
          rRain[i] = dropR;
        }
        const rainSrc = ctx.createBufferSource();
        rainSrc.buffer = rainBuf;
        rainSrc.loop = true;
        const rainFilter = ctx.createBiquadFilter();
        rainFilter.type = 'highpass';
        rainFilter.frequency.value = 1400; // Uğultuyu tamamen kes, sadece ince damla sesleri
        const rainGain = ctx.createGain();
        rainGain.gain.value = 0.35;
        rainSrc.connect(rainFilter);
        rainFilter.connect(rainGain);
        rainGain.connect(roomAcousticFilter);
        rainSrc.start();
        activeSources.push(rainSrc, rainFilter, rainGain);
      }

      // 2. 3D Kurşun Kalem Karalama & Optik Form Doldurma
      // (Optik form yuvarlak karalama, formül çözme ve ince grafit sürtünmesi)
      const playProceduralPencilScratch = (pan: number, mode: 'optical' | 'math' | 'tap' = 'math') => {
        if (!audioCtxRef.current || !envGainRef.current) return;
        const currentCtx = audioCtxRef.current;
        const panner = createSpatialPanner(pan);
        panner.connect(roomAcousticFilter);

        const startTime = currentCtx.currentTime;

        if (mode === 'tap') {
          // Kalem ucunun kağıda/masaya hafif dokunuşu (tekil mikro tık)
          const sampleCount = Math.floor(currentCtx.sampleRate * 0.025);
          const buf = currentCtx.createBuffer(1, sampleCount, currentCtx.sampleRate);
          const d = buf.getChannelData(0);
          for (let k = 0; k < sampleCount; k++) d[k] = (Math.random() * 2 - 1) * 0.18;
          const src = currentCtx.createBufferSource();
          src.buffer = buf;
          const f = currentCtx.createBiquadFilter();
          f.type = 'bandpass';
          f.frequency.value = 2400;
          f.Q.value = 4.0;
          const g = currentCtx.createGain();
          g.gain.setValueAtTime(0.001, startTime);
          g.gain.exponentialRampToValueAtTime(0.18, startTime + 0.003);
          g.gain.exponentialRampToValueAtTime(0.001, startTime + 0.024);
          src.connect(f);
          f.connect(g);
          g.connect(panner);
          src.start(startTime);
          src.stop(startTime + 0.03);
          return;
        }

        const strokeCount = mode === 'optical' ? (5 + Math.floor(Math.random() * 3)) : (3 + Math.floor(Math.random() * 3));
        const strokeGap = mode === 'optical' ? 0.048 : (0.07 + Math.random() * 0.03);

        for (let s = 0; s < strokeCount; s++) {
          const strokeTime = startTime + (s * strokeGap);
          const strokeDuration = mode === 'optical' ? 0.032 : (0.035 + Math.random() * 0.025);
          const sampleCount = Math.floor(currentCtx.sampleRate * strokeDuration);
          const strokeBuf = currentCtx.createBuffer(1, sampleCount, currentCtx.sampleRate);
          const sData = strokeBuf.getChannelData(0);

          for (let k = 0; k < sampleCount; k++) {
            sData[k] = (Math.random() * 2 - 1) * 0.24;
          }

          const sSrc = currentCtx.createBufferSource();
          sSrc.buffer = strokeBuf;

          // Gerçek kurşun grafit ve kağıt dokusu rezonansı (3200Hz - 4200Hz)
          const sFilter = currentCtx.createBiquadFilter();
          sFilter.type = 'bandpass';
          sFilter.frequency.value = 3300 + (s * 70) + (Math.random() * 400);
          sFilter.Q.value = 3.8;

          const sGain = currentCtx.createGain();
          const targetVol = mode === 'optical' ? 0.22 : 0.19;
          sGain.gain.setValueAtTime(0.001, strokeTime);
          sGain.gain.exponentialRampToValueAtTime(targetVol, strokeTime + 0.005);
          sGain.gain.exponentialRampToValueAtTime(0.001, strokeTime + strokeDuration);

          sSrc.connect(sFilter);
          sFilter.connect(sGain);
          sGain.connect(panner);

          sSrc.start(strokeTime);
          sSrc.stop(strokeTime + strokeDuration + 0.01);
        }
      };

      // 3. 3D Silgi Kullanma Sesi (Kağıtta hatayı silme - 3-4 ritmik silme sürtünmesi)
      const playProceduralEraser = (pan: number) => {
        if (!audioCtxRef.current || !envGainRef.current) return;
        const currentCtx = audioCtxRef.current;
        const panner = createSpatialPanner(pan);
        panner.connect(roomAcousticFilter);

        const startTime = currentCtx.currentTime;
        const strokeCount = 3 + Math.floor(Math.random() * 2);

        for (let s = 0; s < strokeCount; s++) {
          const sTime = startTime + (s * 0.11);
          const sDur = 0.075;
          const sCount = Math.floor(currentCtx.sampleRate * sDur);
          const buf = currentCtx.createBuffer(1, sCount, currentCtx.sampleRate);
          const d = buf.getChannelData(0);
          for (let k = 0; k < sCount; k++) {
            d[k] = (Math.random() * 2 - 1) * 0.22;
          }
          const src = currentCtx.createBufferSource();
          src.buffer = buf;

          // Silgi kauçuğunun kağıda sürtünmesi (daha tok ve pürüzsüz bant filtre ~1250 Hz)
          const f = currentCtx.createBiquadFilter();
          f.type = 'bandpass';
          f.frequency.value = 1250 + (s % 2 === 0 ? 80 : -60);
          f.Q.value = 2.2;

          const g = currentCtx.createGain();
          g.gain.setValueAtTime(0.001, sTime);
          g.gain.linearRampToValueAtTime(0.19, sTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, sTime + sDur);

          src.connect(f);
          f.connect(g);
          g.connect(panner);

          src.start(sTime);
          src.stop(sTime + sDur + 0.02);
        }
      };

      // 4. 3D Sayfa Çevirme & Soru Kitapçığı Hışırtısı
      const playProceduralPageTurn = (pan: number) => {
        if (!audioCtxRef.current || !envGainRef.current) return;
        const currentCtx = audioCtxRef.current;
        const panner = createSpatialPanner(pan);
        panner.connect(roomAcousticFilter);

        const now = currentCtx.currentTime;
        // Aşama 1: Sayfayı tutma ve hafif kaldırma
        const buf1Size = Math.floor(currentCtx.sampleRate * 0.14);
        const buf1 = currentCtx.createBuffer(1, buf1Size, currentCtx.sampleRate);
        const d1 = buf1.getChannelData(0);
        for (let i = 0; i < buf1Size; i++) d1[i] = (Math.random() * 2 - 1) * 0.16;

        const s1 = currentCtx.createBufferSource();
        s1.buffer = buf1;
        const f1 = currentCtx.createBiquadFilter();
        f1.type = 'bandpass';
        f1.frequency.value = 1700;
        f1.Q.value = 1.6;

        const g1 = currentCtx.createGain();
        g1.gain.setValueAtTime(0.001, now);
        g1.gain.linearRampToValueAtTime(0.17, now + 0.03);
        g1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        s1.connect(f1);
        f1.connect(g1);
        g1.connect(panner);
        s1.start(now);
        s1.stop(now + 0.15);

        // Aşama 2: Sayfanın katlanıp diğer tarafa yatması (çıtır hışırtı)
        const buf2Size = Math.floor(currentCtx.sampleRate * 0.12);
        const buf2 = currentCtx.createBuffer(1, buf2Size, currentCtx.sampleRate);
        const d2 = buf2.getChannelData(0);
        for (let i = 0; i < buf2Size; i++) d2[i] = (Math.random() * 2 - 1) * 0.20;

        const s2 = currentCtx.createBufferSource();
        s2.buffer = buf2;
        const f2 = currentCtx.createBiquadFilter();
        f2.type = 'bandpass';
        f2.frequency.value = 3100;
        f2.Q.value = 2.1;

        const g2 = currentCtx.createGain();
        g2.gain.setValueAtTime(0.001, now + 0.07);
        g2.gain.linearRampToValueAtTime(0.20, now + 0.10);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.19);

        s2.connect(f2);
        f2.connect(g2);
        g2.connect(panner);
        s2.start(now + 0.07);
        s2.stop(now + 0.21);
      };

      // 5. 3D Kalemi Masaya Bırakma / Masaya Çok Hafif Dokunuş (Sıfır Uğultu - Yalnızca Tiz Tık Sesi)
      const playProceduralDeskTap = (pan: number) => {
        if (!audioCtxRef.current || !envGainRef.current) return;
        const currentCtx = audioCtxRef.current;
        const panner = createSpatialPanner(pan);
        panner.connect(roomAcousticFilter);

        const now = currentCtx.currentTime;
        // Bas frekans ve sinüs dalgası kaldırıldı; yalnızca 0.015 sn mikro temas tıkırtısı
        const tapCount = Math.floor(currentCtx.sampleRate * 0.015);
        const tapBuf = currentCtx.createBuffer(1, tapCount, currentCtx.sampleRate);
        const tData = tapBuf.getChannelData(0);
        for (let k = 0; k < tapCount; k++) {
          tData[k] = (Math.random() * 2 - 1) * 0.12;
        }
        const src = currentCtx.createBufferSource();
        src.buffer = tapBuf;
        const f = currentCtx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 2800; // Tiz çıt/tık sesi, sıfır uğultu
        f.Q.value = 5.0;

        const g = currentCtx.createGain();
        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.06, now + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.014);

        src.connect(f);
        f.connect(g);
        g.connect(panner);
        src.start(now);
        src.stop(now + 0.02);
      };

      // -------------------------------------------------------------
      // ZAMANLAYICILAR (Gerçek Sınav Dinamiği & Rastgele Aralıklar)
      // -------------------------------------------------------------
      // Kalemle işlem yapma ve optik kodlama (Sağ, sol, ön sıralardan sık aralıklarla)
      const pencilIntervalMs = type === '3d_library' ? 7500 : type === '3d_amphi' ? 3200 : 3800;
      const pencilTimer = setInterval(() => {
        const pans = [-0.75, 0.70, -0.35, 0.40, -0.90, 0.85, 0.15, -0.2];
        const randomPan = pans[Math.floor(Math.random() * pans.length)];
        const dice = Math.random();
        if (dice < 0.38) {
          playProceduralPencilScratch(randomPan, 'optical'); // Optik doldurma
        } else if (dice < 0.82) {
          playProceduralPencilScratch(randomPan, 'math'); // Formül / soru çözme
        } else {
          playProceduralPencilScratch(randomPan, 'tap'); // Kalem ucu dokunuşu
        }
      }, pencilIntervalMs);
      activeTimers.push(pencilTimer);

      // Sayfa Çevirmeleri (Seyrek aralıklarla farklı sıralardan)
      const pageIntervalMs = type === '3d_library' ? 22000 : 15000;
      const pageTimer = setInterval(() => {
        const randomPan = (Math.random() - 0.5) * 1.6;
        playProceduralPageTurn(randomPan);
      }, pageIntervalMs);
      activeTimers.push(pageTimer);

      // Silgi Kullanma Sesleri (Öğrencilerin cevap değiştirme / silme anları)
      const eraserIntervalMs = type === '3d_library' ? 32000 : 21000;
      const eraserTimer = setInterval(() => {
        const randomPan = (Math.random() - 0.5) * 1.5;
        playProceduralEraser(randomPan);
      }, eraserIntervalMs);
      activeTimers.push(eraserTimer);

      // Çok seyrek hafif masa teması / kalem bırakma
      const tapTimer = setInterval(() => {
        const randomPan = (Math.random() - 0.5) * 1.4;
        playProceduralDeskTap(randomPan);
      }, 29000);
      activeTimers.push(tapTimer);

      // Kullanıcı önizlemeye veya sınava başladığı anda anında gerçekçi ses duysun:
      const initialPencilTimer = setTimeout(() => {
        playProceduralPencilScratch(-0.65, 'math');
      }, 350);
      activeTimers.push(initialPencilTimer);

      const initialPageTimer = setTimeout(() => {
        playProceduralPageTurn(0.7);
      }, 1600);
      activeTimers.push(initialPageTimer);

      envAudioNodesRef.current = { sources: activeSources, timers: activeTimers };
    } catch (err) {
      console.warn("3D Ambient sound synthesis error:", err);
    }
  }, [initAudio, stopAmbientSound]);

  // Çevre sesini hem sınav esnasında hem de önizleme açıkken çalıştırır
  useEffect(() => {
    if ((isRunning || isAmbientPreviewing) && envSoundType !== 'none') {
      startAmbientSound(envSoundType);
    } else {
      stopAmbientSound();
    }
    return () => {
      stopAmbientSound();
    };
  }, [isRunning, isAmbientPreviewing, envSoundType, startAmbientSound, stopAmbientSound]);

  const toggleAmbientPreview = useCallback(() => {
    initAudio();
    if (isAmbientPreviewing) {
      setIsAmbientPreviewing(false);
      if (!isRunning) {
        stopAmbientSound();
      }
    } else {
      if (envSoundType === 'none') {
        setEnvSoundType('3d_osym_hall');
      }
      setIsAmbientPreviewing(true);
    }
  }, [initAudio, isAmbientPreviewing, isRunning, stopAmbientSound, envSoundType]);

  /* ------------------- Background & Screen Wake Lock Support -------------- */
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {
      // ignore
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    const handleVisibility = () => {
      if (isRunning) {
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
        if (document.visibilityState === 'visible') {
          requestWakeLock();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isRunning]);

  // Try optional web worker with safe fallback
  useEffect(() => {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) timer = setInterval(() => self.postMessage('tick'), 200);
          } else if (e.data === 'stop') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        }
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      workerRef.current = new Worker(URL.createObjectURL(blob));
    } catch {
      workerRef.current = null;
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /* ------------------------- Question Navigation -------------------------- */
  const nextQuestion = useCallback(() => {
    const currentNow = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
      : 0;
    setCurrentQuestionNumber(prev => {
      const nextNum = prev < currentConfig.totalQuestions ? prev + 1 : prev;
      currentQuestionRef.current = nextNum;
      questionStartTimeRef.current = currentNow;
      setQuestionElapsedSeconds(0);
      setTurlamaAlertActive(false);
      return nextNum;
    });
  }, [currentConfig.totalQuestions]);

  const prevQuestion = useCallback(() => {
    const currentNow = startTimeRef.current 
      ? Math.floor((Date.now() - startTimeRef.current) / 1000) 
      : 0;
    setCurrentQuestionNumber(prev => {
      const prevNum = prev > 1 ? prev - 1 : 1;
      currentQuestionRef.current = prevNum;
      questionStartTimeRef.current = currentNow;
      setQuestionElapsedSeconds(0);
      setTurlamaAlertActive(false);
      return prevNum;
    });
  }, []);

  const toggleFlagQuestion = useCallback(() => {
    setFlaggedQuestions(prev => {
      if (prev.includes(currentQuestionNumber)) {
        return prev.filter(q => q !== currentQuestionNumber);
      } else {
        return [...prev, currentQuestionNumber].sort((a, b) => a - b);
      }
    });
  }, [currentQuestionNumber]);

  /* --------------------------- Master Timer Tick -------------------------- */
  const onTimerTick = useCallback(() => {
    if (!startTimeRef.current) return;
    const now = Date.now();
    const currentElapsed = Math.floor((now - startTimeRef.current) / 1000);

    if (currentElapsed >= 0 && currentElapsed !== lastProcessedElapsedRef.current) {
      lastProcessedElapsedRef.current = currentElapsed;
      setElapsedSeconds(currentElapsed);

      const targetSec = currentConfig.secondsPerQuestion;

      // 1. Her 20 Dakikada Bir Tek Bir Dingin Çan Sesi (20m, 40m, 60m...)
      const is20MinMark = currentElapsed > 0 && currentElapsed % MACRO_INTERVAL_SECONDS === 0;
      if (is20MinMark && beatCadence !== 'silent') {
        playTwentyMinuteBell();
        const elapsedMins = Math.floor(currentElapsed / 60);
        setStatusText(`🔔 ${elapsedMins}. dakika geride kaldı.`);
        setRecentChimeNotice(`${elapsedMins}. Dakika Çanı`);
        setTimeout(() => {
          setRecentChimeNotice(null);
        }, 8000);
      }

      // 2. Soru Süresi Takibi ve Otomatik Soru Geçişi
      const qElapsed = Math.max(0, currentElapsed - questionStartTimeRef.current);

      if (qElapsed >= targetSec) {
        // Soru süresi tamamlandı: Süreyi sıfırla ve yeni soru başlangıcını işaretle
        questionStartTimeRef.current = currentElapsed;
        setQuestionElapsedSeconds(0);

        // Dikkat dağıtmayan zarif bip/tık sesi çal (20 dk çanıyla çakışmıyorsa)
        if (!is20MinMark && beatCadence !== 'silent' && beatCadence !== 'twenty_min_only') {
          playQuestionTick();
        }

        // Otomatik Soru Geçişi: Öğrencinin tuşa basmasına gerek kalmadan ilerler
        if (autoAdvanceQuestion) {
          if (currentQuestionRef.current < currentConfig.totalQuestions) {
            const nextNum = currentQuestionRef.current + 1;
            currentQuestionRef.current = nextNum;
            setCurrentQuestionNumber(nextNum);
            setStatusText(`⏱️ ${nextNum}. Soru başladı (~${targetSec} sn)`);
          } else {
            setStatusText(`✅ Hedef soru sayısı tamamlandı! Kalan sürede turlama ve kontrollerinizi yapabilirsiniz.`);
          }
        }
      } else {
        setQuestionElapsedSeconds(qElapsed);

        // İsteğe bağlı ikincil ritim modları (Örn: son 5 saniye geri sayım veya sürekli tik-tak)
        const remainingQSec = targetSec - qElapsed;
        if (beatCadence === 'question_and_countdown') {
          if (remainingQSec > 0 && remainingQSec <= 5) {
            playCountdownPip();
          }
        } else if (beatCadence === 'every_second') {
          playRhythmTick();
        } else if (beatCadence === 'every_5_sec') {
          if (currentElapsed % 5 === 0) {
            playRhythmTick();
          }
        }
      }

      // 3. Toplam Sınav Süresi Tamamlandı
      const totalExamSeconds = currentConfig.durationMinutes * 60;
      if (currentElapsed >= totalExamSeconds) {
        setIsRunning(false);
        setIsFocusMode(false);
        setStatusText("🏁 SINAV TAMAMLANDI! Kalemleri bırakın.");
        playTwentyMinuteBell();
        setTimeout(playTwentyMinuteBell, 1200);
        releaseWakeLock();
      }
    }
  }, [
    currentConfig.durationMinutes,
    currentConfig.secondsPerQuestion,
    currentConfig.totalQuestions,
    beatCadence,
    playCountdownPip,
    playRhythmTick,
    playQuestionTick,
    playTwentyMinuteBell,
    autoAdvanceQuestion,
    setIsFocusMode
  ]);

  /* ------------------- Dual Timer Hook (Interval + Worker) ----------------- */
  useEffect(() => {
    if (isRunning) {
      requestWakeLock();
      // Primary guaranteed high-resolution interval loop
      timerIntervalRef.current = setInterval(onTimerTick, 100);

      // Optional background worker message listener
      if (workerRef.current) {
        workerRef.current.onmessage = () => {
          onTimerTick();
        };
        workerRef.current.postMessage('start');
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
      releaseWakeLock();
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      if (workerRef.current) {
        workerRef.current.postMessage('stop');
      }
      releaseWakeLock();
    };
  }, [isRunning, onTimerTick]);

  /* ---------------------- Fullscreen Focus Mode Engine --------------------- */
  const toggleFocusMode = useCallback(async () => {
    if (!isFocusMode) {
      setIsFocusMode(true);
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          await docEl.requestFullscreen();
        } else if ((docEl as any).webkitRequestFullscreen) {
          await (docEl as any).webkitRequestFullscreen();
        }
      } catch (err) {
        // Handled gracefully via fixed fullscreen overlay
      }
    } else {
      setIsFocusMode(false);
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            await (document as any).webkitExitFullscreen();
          }
        }
      } catch (err) {
        // ignore
      }
    }
  }, [isFocusMode, setIsFocusMode]);

  // Synchronize state if user exits fullscreen with Esc or browser controls
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isDocFullscreen = Boolean(document.fullscreenElement || (document as any).webkitFullscreenElement);
      if (!isDocFullscreen && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [isFocusMode, setIsFocusMode]);

  /* ---------------------- Keyboard Shortcut Support ----------------------- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as any)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleTimer();
      } else if (e.code === 'ArrowRight' && isRunning) {
        e.preventDefault();
        nextQuestion();
      } else if (e.code === 'ArrowLeft' && isRunning) {
        e.preventDefault();
        prevQuestion();
      } else if (e.key.toLowerCase() === 'f') {
        toggleFlagQuestion();
      } else if (e.code === 'Escape' && isFocusMode) {
        toggleFocusMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, nextQuestion, prevQuestion, toggleFlagQuestion, isFocusMode, toggleFocusMode]);

  /* --------------------------- Timer Controls ----------------------------- */
  const toggleTimer = () => {
    initAudio();

    if (!isRunning) {
      const now = Date.now();
      startTimeRef.current = now - (pausedAtElapsedRef.current * 1000);
      questionStartTimeRef.current = pausedAtElapsedRef.current - questionElapsedSeconds;
      setIsRunning(true);
      setStatusText(`Sınav başladı. Soru başı tempo: ${currentConfig.secondsPerQuestion} saniye.`);
    } else {
      setIsRunning(false);
      pausedAtElapsedRef.current = elapsedSeconds;
      setStatusText("Sınav duraklatıldı.");
    }
  };

  const confirmReset = () => {
    setShowConfirmModal(false);
    setIsRunning(false);
    setIsFocusMode(false);
    setIsAmbientPreviewing(false);
    setElapsedSeconds(0);
    setQuestionElapsedSeconds(0);
    setCurrentQuestionNumber(1);
    setFlaggedQuestions([]);
    setTurlamaAlertActive(false);
    pausedAtElapsedRef.current = 0;
    lastProcessedElapsedRef.current = -1;
    startTimeRef.current = 0;
    questionStartTimeRef.current = 0;
    setStatusText("Süre sıfırlandı. Yeni sınava hazır.");
    stopAmbientSound();
  };

  /* -------------------------- Time Format Helpers ------------------------- */
  const totalExamSeconds = currentConfig.durationMinutes * 60;
  const remainingExamSeconds = Math.max(0, totalExamSeconds - elapsedSeconds);

  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatSimulatedClock = (elapsedSec: number) => {
    const totalSec = (currentConfig.startHour * 3600) + (currentConfig.startMinute * 60) + elapsedSec;
    const h = Math.floor(totalSec / 3600) % 24;
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatMS = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Expected question number based on target pacing (e.g. 75s/q)
  const expectedQuestionNumber = useMemo(() => {
    const targetSec = currentConfig.secondsPerQuestion || 75;
    if (elapsedSeconds <= 0) return 1;
    const qNum = Math.floor(elapsedSeconds / targetSec) + 1;
    return Math.min(currentConfig.totalQuestions, qNum);
  }, [elapsedSeconds, currentConfig.secondsPerQuestion, currentConfig.totalQuestions]);

  const nextChimeMinute = Math.floor(elapsedSeconds / 1200) * 20 + 20;

  // Question progress calculation
  const questionTargetSec = currentConfig.secondsPerQuestion;
  const questionPercent = Math.min(100, Math.round((questionElapsedSeconds / questionTargetSec) * 100));
  const examPercent = Math.min(100, Math.round((elapsedSeconds / totalExamSeconds) * 100));

  /* -------------------------------------------------------------------------- */
  /*                  DEDICATED FULLSCREEN FOCUS MODE VIEW                      */
  /* -------------------------------------------------------------------------- */
  if (isFocusMode) {
    return (
      <div 
        ref={mainRef}
        id="exam-metronome-focus-screen"
        className="fixed inset-0 z-[99999] w-screen h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden"
      >
        {/* Top Header */}
        <div className="w-full flex items-start justify-between z-20">
          {/* Sol Üst Köşe: Olması Gereken Soru Sayısı */}
          <div className="flex flex-col items-start bg-slate-900/90 border border-amber-500/20 px-4 sm:px-6 py-3 rounded-2xl backdrop-blur-md shadow-2xl">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Clock size={14} className="text-amber-400" />
              Olması Gereken Soru
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl sm:text-5xl font-black text-amber-400 tabular-nums">
                {expectedQuestionNumber}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500">
                / {currentConfig.totalQuestions}
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
              Tempo: ~{currentConfig.secondsPerQuestion} sn/soru
            </span>
          </div>

          {/* Sağ Üst Köşe: Saat Modu ve Odak Modundan Çıkış */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center bg-slate-900/80 p-1 rounded-xl border border-white/10 backdrop-blur-md">
              <button
                type="button"
                onClick={() => setTimeDisplayMode('countdown')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeDisplayMode === 'countdown' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                Kalan Süre
              </button>
              <button
                type="button"
                onClick={() => setTimeDisplayMode('simulatedClock')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  timeDisplayMode === 'simulatedClock' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                ÖSYM Salon Saati
              </button>
            </div>

            <button
              id="exit-focus-mode-btn"
              type="button"
              onClick={toggleFocusMode}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/15 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 backdrop-blur-md transition-all shadow-lg active:scale-95 cursor-pointer"
              title="Odak Modundan Çık (Esc)"
            >
              <Minimize size={16} />
              <span className="hidden sm:inline">Odak Modundan Çık</span>
              <span className="text-[10px] text-slate-400 font-normal">(Esc)</span>
            </button>
          </div>
        </div>

        {/* Ortada: SADECE SAAT */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-6">
          <div 
            onClick={toggleTimer}
            className="cursor-pointer select-none text-center group transition-transform active:scale-[0.99] p-4 rounded-3xl"
            title="Duraklatmak veya Başlatmak için tıklayın (Kısayol: Boşluk tuşu)"
          >
            <div 
              className="text-7xl sm:text-8xl md:text-9xl lg:text-[12rem] xl:text-[14rem] font-bold text-amber-500 tracking-wider leading-none tabular-nums drop-shadow-2xl transition-all"
              style={{ 
                fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace",
                textShadow: isRunning ? "0 0 50px rgba(245, 158, 11, 0.45)" : "none"
              }}
            >
              {timeDisplayMode === 'countdown' && formatHMS(remainingExamSeconds)}
              {timeDisplayMode === 'simulatedClock' && formatSimulatedClock(elapsedSeconds)}
              {timeDisplayMode === 'questionTimer' && formatMS(questionElapsedSeconds)}
            </div>

            {/* Minimal Durum Bilgisi */}
            <div className="mt-8 flex items-center justify-center gap-3">
              {isRunning ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs sm:text-sm font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  Sınav Devam Ediyor • Duraklatmak için tıkla (Boşluk)
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs sm:text-sm font-bold">
                  <Pause size={14} />
                  Duraklatıldı • Başlatmak için tıkla (Boşluk)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Alt Bilgi Barı: 20 Dakikalık Çan ve Bilgi */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 z-20">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-amber-400" />
            <span>
              20 Dk Çanı Aktif: Sonraki çan <strong className="text-white font-bold">{nextChimeMinute}.</strong> dakikada çalacak
            </span>
            {recentChimeNotice && (
              <span className="ml-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 animate-bounce">
                🔔 {recentChimeNotice}
              </span>
            )}
            {envSoundType !== 'none' && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-medium ml-2">
                <Headphones size={11} className="text-purple-400" />
                {envSoundType === '3d_osym_hall' && '3D ÖSYM Salonu'}
                {envSoundType === '3d_library' && '3D Kütüphane'}
                {envSoundType === '3d_amphi' && '3D Üniversite Amfisi'}
                {envSoundType === '3d_rain_hall' && '3D Yağmurlu Salon'}
                {envSoundType === 'focus_binaural' && '432 Hz Alfa'}
                {envSoundType === 'brown_noise' && 'Kahverengi Gürültü'}
                {envSoundType === 'white_noise' && 'Beyaz Gürültü'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="text-slate-300 font-semibold">{currentConfig.name}</span>
            <span>•</span>
            <button 
              type="button"
              onClick={() => {
                if (timeDisplayMode === 'countdown') setTimeDisplayMode('simulatedClock');
                else setTimeDisplayMode('countdown');
              }}
              className="text-amber-400 hover:text-amber-300 underline underline-offset-4 cursor-pointer"
            >
              {timeDisplayMode === 'countdown' ? "ÖSYM Salon Saatine Geç" : "Kalan Süreye Geç"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                  REGULAR METRONOME VIEW                                    */
  /* -------------------------------------------------------------------------- */
  return (
    <div 
      ref={mainRef}
      className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center transition-all duration-500 relative"
    >
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-4 z-20">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest flex items-center gap-1.5">
            <Flame size={13} className="text-indigo-400" />
            {currentConfig.shortName}
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Hedef: <strong className="text-white">{currentConfig.secondsPerQuestion} sn</strong>/soru
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Trigger */}
          <button
            id="metronome-settings-toggle-btn"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
              showSettingsDrawer 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
            }`}
            title="Ses ve Metronom Ayarları"
          >
            <Sliders size={16} />
            <span className="hidden sm:inline">Ayarlar</span>
          </button>

          {/* Focus Mode / Fullscreen Toggle */}
          <button
            id="metronome-focus-mode-toggle-btn"
            onClick={toggleFocusMode}
            className="p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800 hover:text-white"
            title="Odak Modu (Tam Ekran)"
          >
            <Maximize size={16} />
            <span className="hidden sm:inline">Odak Modu (Tam Ekran)</span>
          </button>
        </div>
      </div>

      {/* Mode Selector (When not running or when user wants to change modes) */}
      {!isFocusMode && !isRunning && elapsedSeconds === 0 && (
        <div className="w-full mb-8">
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-3">
            {Object.keys(EXAM_MODES).map((modeKey) => {
              const cfg = EXAM_MODES[modeKey];
              const isSel = selectedModeKey === modeKey;
              return (
                <button
                  key={modeKey}
                  id={`mode-select-${modeKey}`}
                  onClick={() => {
                    setSelectedModeKey(modeKey);
                    if (modeKey === 'CUSTOM' && customQuestions > 0) {
                      setCustomSecondsPerQuestion(Math.max(5, Math.round((customMinutes * 60) / customQuestions)));
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all ${
                    isSel 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105 border border-indigo-400' 
                      : 'bg-slate-900/80 text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {cfg.shortName}
                </button>
              );
            })}
          </div>

          {/* Custom Mode Inputs */}
          {selectedModeKey === 'CUSTOM' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/90 border border-white/10 p-4 rounded-2xl max-w-xl mx-auto mb-4 grid grid-cols-3 gap-3"
            >
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Toplam Süre (Dk)</label>
                <input
                  type="number"
                  min="1"
                  max="300"
                  value={customMinutes}
                  onChange={(e) => handleCustomMinutesChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm font-bold text-center"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Soru Sayısı</label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={customQuestions}
                  onChange={(e) => handleCustomQuestionsChange(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-800 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm font-bold text-center"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Soru Başı Süre (Sn)</label>
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">Oto</span>
                </div>
                <input
                  type="number"
                  min="5"
                  max="600"
                  value={customSecondsPerQuestion}
                  onChange={(e) => setCustomSecondsPerQuestion(Math.max(5, parseInt(e.target.value) || 5))}
                  title="Süre ve soru sayısına göre otomatik hesaplanır (isteğe bağlı değiştirebilirsiniz)"
                  className="w-full bg-slate-800 border border-emerald-500/30 focus:border-emerald-400 rounded-lg px-2.5 py-1.5 text-emerald-400 text-sm font-black text-center"
                />
              </div>
            </motion.div>
          )}

          <p className="text-center text-xs text-slate-400">
            {currentConfig.description}
          </p>
        </div>
      )}

      {/* Settings Drawer / Panel */}
      <AnimatePresence>
        {showSettingsDrawer && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full bg-slate-900/95 border border-indigo-500/20 p-5 rounded-3xl mb-6 shadow-2xl backdrop-blur-md overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders size={16} className="text-indigo-400" /> Sınav Metronomu & Ses Ayarları
              </h4>
              <button 
                onClick={() => setShowSettingsDrawer(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-white/5"
              >
                Kapat
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Cadence */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">Metronom Vuruş Şekli</label>
                <select
                  value={beatCadence}
                  onChange={(e) => setBeatCadence(e.target.value as any)}
                  className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none border border-slate-700 focus:border-indigo-500"
                >
                  <option value="exam_pace">🎯 Soru Başı Zarif Bip/Tık + 20 Dk Tek Çan (Önerilen Sınav Modu)</option>
                  <option value="twenty_min_only">🔔 Sadece 20 Dakikada Bir Tek Çan (Soru Sesleri Kapalı)</option>
                  <option value="silent">Tamamen Sessiz (Sadece Görsel Saat)</option>
                  <option value="question_and_countdown">Soru Geçişi + Son 5sn Geri Sayım Biplemesi</option>
                  <option value="every_second">Her Saniye Canlı Tik-Tak (Klasik Metronom)</option>
                  <option value="every_5_sec">Her 5 Saniyede Bir Vuruş</option>
                </select>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {beatCadence === 'exam_pace'
                    ? 'Soru süresi bittiğinde dikkatinizi dağıtmayacak zarif bir tık/bip sesi verir ve otomatik olarak sonraki soruya geçer. Her 20 dakikada bir tek bir çan sesiyle genel süreyi hatırlatır.'
                    : beatCadence === 'twenty_min_only' 
                    ? 'Soru çözerken arka planda ses çalmaz; her 20 dakikada bir tek bir çan sesiyle temponuzu hatırlatır.' 
                    : beatCadence === 'question_and_countdown' 
                    ? 'Soru süresi bitimine son 5 saniye kala bip çalar, süre bitince geçiş yapar.' 
                    : beatCadence === 'every_second' 
                    ? 'Odağınızı sabit tutmak için her saniye ritim vurur.' 
                    : 'Ritmik sesli sınav rehberi.'}
                </p>
              </div>

              {/* Volume & Sound Tone */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-bold">Vuruş & Çan Sesi:</span>
                  <select
                    value={soundStyle}
                    onChange={(e) => setSoundStyle(e.target.value as any)}
                    className="bg-slate-800 text-white rounded-lg px-2 py-1 text-xs border border-slate-700"
                  >
                    <option value="wood">Ahşap Metronom (Tok & Dingin)</option>
                    <option value="beep">Zarif Sinüs Bip (Kulak Yormaz)</option>
                    <option value="click">Yumuşak Saat Klik</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 w-12">Ritim</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={rhythmVolume} 
                    onChange={e => setRhythmVolume(Number(e.target.value))} 
                    className="flex-1 accent-indigo-500" 
                  />
                  <span className="text-[10px] text-slate-400 font-bold w-6">{rhythmVolume}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 w-12">Çan</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={chimeVolume} 
                    onChange={e => setChimeVolume(Number(e.target.value))} 
                    className="flex-1 accent-emerald-500" 
                  />
                  <span className="text-[10px] text-slate-400 font-bold w-6">{chimeVolume}%</span>
                </div>
              </div>

              {/* Ambient Sounds */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Headphones size={13} className="text-purple-400" />
                    Çevre & Odaklama Sesi (3D)
                  </label>
                  {isAmbientPreviewing && (
                    <span className="text-[10px] text-purple-400 font-bold animate-pulse">
                      ● Çalıyor
                    </span>
                  )}
                </div>
                <select
                  value={envSoundType}
                  onChange={(e) => setEnvSoundType(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-xl px-3 py-2 text-xs font-semibold outline-none border border-slate-700 focus:border-purple-500"
                >
                  <optgroup label="🎧 GERÇEK SINAV ORTAMLARI (UĞULTUSUZ & 3D DOĞAL AKUSTİK)">
                    <option value="3d_osym_hall">🎧 3D Gerçek ÖSYM Salonu (Kalem, Optik Kodlama & Sayfa)</option>
                    <option value="3d_library">📚 3D Sessiz Kütüphane (Dingin & Seyrek Sayfa Çevirme)</option>
                    <option value="3d_amphi">🏛️ 3D Üniversite Amfisi (Çoklu Masalarda Soru Çözümü)</option>
                    <option value="3d_rain_hall">🌧️ 3D Yağmurlu Sınav Salonu (Cam Tıpırtısı & Kalemler)</option>
                  </optgroup>
                  <optgroup label="🧘 ODAKLANMA FREKANSLARI">
                    <option value="focus_binaural">🧘 432 Hz Alfa Frekansı (Zihin Dinginliği)</option>
                    <option value="brown_noise">☕ Derin Kahverengi Gürültü (Ses Yalıtımı)</option>
                    <option value="white_noise">⚪ Beyaz Gürültü (Zihin Susturucu)</option>
                  </optgroup>
                  <optgroup label="DİĞER">
                    <option value="none">🔇 Kapalı (Tamamen Sessiz)</option>
                  </optgroup>
                </select>

                {/* Açıklama Metni */}
                <p className="text-[11px] text-slate-400 leading-relaxed min-h-[30px]">
                  {envSoundType === '3d_osym_hall' && 'Arka plan uğultusu sıfırlanmıştır. Gerçek bir sınav salonundaki gibi sessiz zemin üzerinde sağ, sol ve ön sıralardan optik form doldurma, formül karalama, silgi kullanma ve seyrek sayfa çevirme sesleri duyulur.'}
                  {envSoundType === '3d_library' && 'Dip gürültüsü olmayan saf sessizlik; yalnızca belirli aralıklarla yumuşak yaprak çevirmeleri ve seyrek kalem dokunuşları.'}
                  {envSoundType === '3d_amphi' && 'Geniş salonda çevre sıralardan gelen doğal soru çözme tıkırtıları, silgi ve optik işaretleme sesleri.'}
                  {envSoundType === '3d_rain_hall' && 'Uğultusuz; pencerelere vuran hafif yağmur damlası tıpırtıları ve sınav salonundaki doğal kurşun kalem sesleri.'}
                  {envSoundType === 'focus_binaural' && '432 Hz alfa rezonansı: Sınav heyecanını dengeler ve derin odaklanma sağlar.'}
                  {envSoundType === 'brown_noise' && 'Dış ortamdaki gürültüleri ve dikkat dağıtıcı ani sesleri maskelemek için idealdir.'}
                  {envSoundType === 'white_noise' && 'Homojen frekans spektrumu ile zihni dış dünyadan izole eder.'}
                  {envSoundType === 'none' && 'Arka plan sesi kapalı. Yalnızca metronom ve çan sesleri çalacaktır.'}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] text-slate-400">Ortam Ses:</span>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    disabled={envSoundType === 'none'}
                    value={envVolume} 
                    onChange={e => setEnvVolume(Number(e.target.value))} 
                    className="flex-1 accent-purple-500 disabled:opacity-30" 
                  />
                  <span className="text-[10px] text-slate-400 font-bold w-6">{envVolume}%</span>
                </div>
              </div>
            </div>

            {/* Test buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5 mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  id="test-twenty-bell-btn"
                  onClick={playTwentyMinuteBell} 
                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Bell size={13} className="text-amber-400" /> 🔔 20 Dk Tek Çan Testi
                </button>
                <button 
                  id="test-q-tick-btn"
                  onClick={playQuestionTick} 
                  className="px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 rounded-xl text-xs font-bold border border-indigo-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 size={13} className="text-indigo-400" /> 🎯 Soru Başı Bip/Tık Testi
                </button>
                <button 
                  id="test-ambient-preview-btn"
                  onClick={toggleAmbientPreview} 
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    isAmbientPreviewing 
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30' 
                      : 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border-purple-500/30'
                  }`}
                >
                  <Headphones size={13} className={isAmbientPreviewing ? "text-white animate-pulse" : "text-purple-400"} />
                  {isAmbientPreviewing ? '⏹️ 3D Sesi Durdur' : '🎧 3D Ortamı Önizle'}
                </button>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-medium select-none">
                <input 
                  type="checkbox" 
                  checked={autoAdvanceQuestion} 
                  onChange={(e) => setAutoAdvanceQuestion(e.target.checked)} 
                  className="rounded accent-indigo-500" 
                />
                Süre bitince otomatik sonraki soruya geç
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Question Status & Turlama Alert Banner */}
      <div className="w-full flex flex-col items-center mb-6">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md">
          {/* Question Counter Pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1 bg-indigo-500/10 border border-indigo-500/30 px-3.5 py-1.5 rounded-xl">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Soru</span>
              <span className="text-xl font-black text-white">{currentQuestionNumber}</span>
              <span className="text-xs font-bold text-slate-400">/ {currentConfig.totalQuestions}</span>
            </div>

            <button
              id="metronome-flag-btn"
              onClick={toggleFlagQuestion}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                flaggedQuestions.includes(currentQuestionNumber)
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-white/5 hover:text-white'
              }`}
              title="Bu soruyu turlama listesine ekle/çıkar (Kısayol: F)"
            >
              <Flag size={14} fill={flaggedQuestions.includes(currentQuestionNumber) ? "currentColor" : "none"} />
              <span className="text-[11px] hidden sm:inline">
                {flaggedQuestions.includes(currentQuestionNumber) ? 'Turlanacak' : 'İşaretle'}
              </span>
            </button>
          </div>

          {/* Question Tempo & Progress Indicator */}
          <div className="flex-1 max-w-sm w-full">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-400 font-medium">Bu Soru İçin Süre:</span>
              <span className={`font-black tabular-nums ${questionElapsedSeconds > questionTargetSec ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatMS(questionElapsedSeconds)} / {formatMS(questionTargetSec)}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-300 ${
                  questionPercent >= 100 
                    ? 'bg-rose-500 animate-pulse' 
                    : questionPercent > 75 
                    ? 'bg-amber-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, questionPercent)}%` }}
              />
            </div>
          </div>

          {/* Quick Question Next/Prev Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="metronome-prev-q-btn"
              onClick={prevQuestion}
              disabled={currentQuestionNumber <= 1}
              className="p-2 rounded-xl bg-slate-800 border border-white/5 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 transition-all"
              title="Önceki Soru (Sol Ok)"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              id="metronome-next-q-btn"
              onClick={nextQuestion}
              disabled={currentQuestionNumber >= currentConfig.totalQuestions}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              title="Sonraki Soru (Boşluk / Sağ Ok)"
            >
              <span>Sonraki Soru</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Turlama Alert Banner */}
        <AnimatePresence>
          {turlamaAlertActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mt-3 p-3.5 bg-gradient-to-r from-amber-600/30 via-rose-600/30 to-amber-600/30 border border-amber-500/50 rounded-2xl flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="text-amber-400 animate-bounce" size={24} />
                <div>
                  <h5 className="text-sm font-black text-amber-300">TURLAMA VAKTİ: Süre Doldu!</h5>
                  <p className="text-xs text-slate-200">
                    {currentQuestionNumber}. soruyla inatlaşmayın! Soruyu işaretleyin ve hemen bir sonrakine geçin.
                  </p>
                </div>
              </div>
              <button
                id="turlama-next-btn"
                onClick={nextQuestion}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs whitespace-nowrap shadow-lg transition-transform active:scale-95"
              >
                Sonraki Soruya Atla ⚡
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Big Digital Metronome Display Box */}
      <div className={`relative w-full bg-slate-900/90 border border-white/10 rounded-[2.5rem] shadow-2xl transition-all duration-500 overflow-hidden flex flex-col items-center justify-center p-8 sm:p-14 mb-8 ${
        isRunning ? 'border-amber-500/40 shadow-amber-500/10' : ''
      }`}>
        
        {/* Toggle Clock Display Mode (Countdown vs ÖSYM Clock) */}
        <div className="flex items-center gap-2 mb-4 bg-slate-800/60 p-1 rounded-xl border border-white/5">
          <button
            id="time-mode-countdown"
            onClick={() => setTimeDisplayMode('countdown')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeDisplayMode === 'countdown' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kalan Süre (Geri Sayım)
          </button>
          <button
            id="time-mode-simulated"
            onClick={() => setTimeDisplayMode('simulatedClock')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeDisplayMode === 'simulatedClock' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            ÖSYM Sınav Saati
          </button>
          <button
            id="time-mode-qtimer"
            onClick={() => setTimeDisplayMode('questionTimer')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              timeDisplayMode === 'questionTimer' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Bu Soru Süresi
          </button>
        </div>

        {/* Digital Clock Numbers */}
        <div 
          onClick={() => {
            if (timeDisplayMode === 'countdown') setTimeDisplayMode('simulatedClock');
            else if (timeDisplayMode === 'simulatedClock') setTimeDisplayMode('questionTimer');
            else setTimeDisplayMode('countdown');
          }}
          className="cursor-pointer select-none text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-amber-500 tracking-wider leading-none tabular-nums drop-shadow-2xl transition-all"
          style={{ 
            fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace", 
            textShadow: isRunning ? "0 0 25px rgba(245, 158, 11, 0.45)" : "none" 
          }}
          title="Görünümü değiştirmek için tıklayın"
        >
          {timeDisplayMode === 'countdown' && formatHMS(remainingExamSeconds)}
          {timeDisplayMode === 'simulatedClock' && formatSimulatedClock(elapsedSeconds)}
          {timeDisplayMode === 'questionTimer' && formatMS(questionElapsedSeconds)}
        </div>

        {/* Overall Exam Progress Bar under clock */}
        <div className="w-full max-w-lg mt-6">
          <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5">
            <span>Sınav İlerlemesi: %{examPercent}</span>
            <span>Geçen: {formatHMS(elapsedSeconds)} / {formatHMS(totalExamSeconds)}</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-amber-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${examPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="mt-4 text-center text-xs sm:text-sm text-slate-400 font-medium">
          {statusText}
        </div>
      </div>

      {/* Primary Action Controls (Always accessible in both regular & focus mode) */}
      <div className="w-full flex flex-wrap items-center justify-center gap-4 z-20">
        {/* Play/Pause Toggle */}
        <button
          id="metronome-start-pause-btn"
          onClick={toggleTimer}
          className={`px-8 py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95 min-w-[220px] ${
            isRunning 
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/25' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause size={24} />
              <span>Duraklat</span>
            </>
          ) : (
            <>
              <Play size={24} className="ml-1" />
              <span>{elapsedSeconds > 0 ? "Devam Et" : "Sınavı Başlat"}</span>
            </>
          )}
        </button>

        {/* Next Question Shortcut Button */}
        {isRunning && (
          <button
            id="metronome-mid-next-btn"
            onClick={nextQuestion}
            className="px-6 py-4 rounded-2xl font-black text-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition-all active:scale-95"
            title="Sonraki Soruya Geç (Boşluk Tuşu)"
          >
            <span>Sonraki Soru ({currentQuestionNumber + 1})</span>
            <ChevronRight size={22} />
          </button>
        )}

        {/* Finish / Reset */}
        {elapsedSeconds > 0 && (
          <button
            id="metronome-finish-btn"
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-4 rounded-2xl font-bold text-base bg-slate-900 border border-rose-500/30 text-rose-400 hover:bg-rose-950/30 hover:border-rose-500 transition-all flex items-center gap-2"
          >
            <Square size={18} />
            <span>Sınavı Bitir / Sıfırla</span>
          </button>
        )}
      </div>

      {/* Flagged / Turlanan Sorular Badges */}
      {flaggedQuestions.length > 0 && (
        <div className="w-full mt-6 bg-slate-900/60 border border-amber-500/20 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Flag size={14} /> Turlanacak Sorular ({flaggedQuestions.length} Adet):
            </span>
            <span className="text-[11px] text-slate-400">İlk tur bittikten sonra bu sorulara dönün</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {flaggedQuestions.map(qNum => (
              <button
                key={qNum}
                onClick={() => {
                  setCurrentQuestionNumber(qNum);
                  questionStartTimeRef.current = elapsedSeconds;
                  setQuestionElapsedSeconds(0);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                  currentQuestionNumber === qNum 
                    ? 'bg-amber-500 text-slate-950' 
                    : 'bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                Soru {qNum}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <h3 className="text-xl font-bold text-white mb-2">Sınavı Bitir</h3>
              <p className="text-slate-300 text-sm mb-6">
                Sınavı tamamlamak ve süreyi sıfırlamak istediğinize emin misiniz?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all"
                >
                  İptal
                </button>
                <button 
                  id="confirm-reset-yes-btn"
                  onClick={confirmReset} 
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-rose-600/30"
                >
                  Evet, Bitir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               StopwatchTimer                               */
/* -------------------------------------------------------------------------- */
function StopwatchTimer() {
  const { user } = useAuth();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'study_sessions'),
        where('studentId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         data.sort((a: any, b: any) => {
           const timeA = a.createdAt?.seconds || Number.MAX_SAFE_INTEGER;
           const timeB = b.createdAt?.seconds || Number.MAX_SAFE_INTEGER;
           return timeB - timeA;
         });
         setSessions(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const stopAndSave = async () => {
    setIsRunning(false);
    if (time > 0 && user?.uid) {
      try {
        await addDoc(collection(db, 'study_sessions'), {
          studentId: user.uid,
          duration: time,
          createdAt: serverTimestamp(),
          date: new Date().toISOString().split('T')[0]
        });
        setTime(0);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalOverallDuration = sessions.reduce((acc: number, session: any) => acc + (session.duration || 0), 0);

  const groupedSessions = sessions.reduce((acc: any, session: any) => {
    const dateStr = session.createdAt?.seconds 
      ? new Date(session.createdAt.seconds * 1000).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })
      : 'Bugün';
    
    if (!acc[dateStr]) {
      acc[dateStr] = {
        totalDuration: 0,
        sessions: []
      };
    }
    acc[dateStr].sessions.push(session);
    acc[dateStr].totalDuration += session.duration || 0;
    return acc;
  }, {});

  const toggleDay = (dateStr: string) => {
    setExpandedDays(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr]
    }));
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="w-full bg-slate-900 border border-amber-500/30 py-14 sm:py-20 flex items-center justify-center rounded-[2.5rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden shadow-amber-500/10 px-4">
        <div className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-amber-500 tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors"
             style={{ fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace" }}>
          {formatTime(time)}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          id="stopwatch-toggle-btn"
          onClick={toggleTimer}
          className={`w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
        </button>
        <button
          id="stopwatch-save-btn"
          onClick={stopAndSave}
          disabled={time === 0}
          className="w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Durdur ve Kaydet"
        >
          <Square size={28} fill="currentColor" />
        </button>
      </div>

      <div className="w-full bg-slate-800/50 rounded-3xl p-6 mt-8 border border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-lg font-bold text-white">Günlük Çalışma Kayıtları</h3>
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            <span className="text-xs font-semibold text-slate-300">Toplam Çalışma:</span>
            <span className="text-sm font-black text-amber-400 tracking-wider">{formatTime(totalOverallDuration)}</span>
          </div>
        </div>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(groupedSessions).length > 0 ? (
            Object.entries(groupedSessions).map(([dateStr, data]: [string, any]) => (
              <div key={dateStr} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                <button 
                  onClick={() => toggleDay(dateStr)}
                  className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold text-sm">{dateStr}</span>
                    <span className="text-[11px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-lg">
                      {(data.sessions || []).length} Oturum
                    </span>
                  </div>
                  <span className="text-amber-400 font-black tracking-wider bg-amber-500/10 px-3 py-1 rounded-lg text-sm">
                    {formatTime(data.totalDuration)}
                  </span>
                </button>
                
                {expandedDays[dateStr] && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {(data.sessions || []).map((session: any) => (
                      <div key={session.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400 text-xs font-medium">
                          {session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi'}
                        </span>
                        <span className="text-amber-400 text-xs font-bold tracking-wider">
                          {formatTime(session.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm">Henüz çalışma kaydınız bulunmuyor.</p>
              <p className="text-slate-600 text-xs mt-1">Kronometreyi başlatıp çalışmanızı kaydedebilirsiniz.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Main Component                               */
/* -------------------------------------------------------------------------- */
export default function ExamMetronomeApp() {
  const [activeTab, setActiveTab] = useState<'metronome' | 'pomodoro' | 'stopwatch'>('metronome');
  const [isFocusMode, setIsFocusMode] = useState(false);

  return (
    <div className={`flex-1 flex flex-col items-center justify-start p-4 transition-colors duration-500 min-h-[85vh] ${isFocusMode ? 'bg-slate-950' : ''}`}>
      {!isFocusMode && (
        <div className="text-center mb-6 w-full mt-2">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full text-indigo-400 text-xs font-bold mb-3">
            <Sparkles size={14} /> Sınav Hız & Turlama Simülatörü
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-2 text-white">Zaman Yönetimi & Metronom</h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Sınav temposunu refleks haline getirin, soru başına sürenizi kontrol edin ve turlama taktiğiyle sürenizi mükemmelleştirin.
          </p>
        </div>
      )}

      {!isFocusMode && (
        <div className="flex bg-slate-900/90 border border-white/5 p-1 rounded-2xl mb-8 shadow-lg">
          <button
            id="tab-btn-metronome"
            onClick={() => setActiveTab('metronome')}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'metronome' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Clock size={16} /> Sınav Metronomu
          </button>
          <button
            id="tab-btn-pomodoro"
            onClick={() => setActiveTab('pomodoro')}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'pomodoro' 
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Timer size={16} /> Pomodoro
          </button>
          <button
            id="tab-btn-stopwatch"
            onClick={() => setActiveTab('stopwatch')}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'stopwatch' 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <StopCircle size={16} /> Kronometre
          </button>
        </div>
      )}

      {activeTab === 'metronome' ? (
        <ExamMetronomeContent isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
      ) : activeTab === 'pomodoro' ? (
        <PomodoroTimer />
      ) : (
        <StopwatchTimer />
      )}
    </div>
  );
}
