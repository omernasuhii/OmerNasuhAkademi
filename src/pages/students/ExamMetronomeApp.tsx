import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Square, Maximize, AlertCircle, Settings, Volume2, Headphones, Timer, Clock, StopCircle, Lock } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../../lib/AuthContext';

const MODES = {
  'TYT': { duration: 165, tickInterval: 75, startH: 10, startM: 15 },
  'AYT': { duration: 180, tickInterval: 135, startH: 10, startM: 15 },
  'YDT': { duration: 120, tickInterval: 90, startH: 15, startM: 45 }
};

const MACRO_INTERVAL = 1200; // 20 dakika = 1200 saniye

function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
            // Play sound
            const audio = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=success-1-6297.mp3');
            audio.play().catch(() => {});
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
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center">
      <div className="flex bg-slate-800/50 p-1 rounded-2xl mb-8">
        {Object.entries(MODES_CFG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => changeMode(key as any)}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              mode === key 
                ? `${config.color} text-white shadow-lg` 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className={`w-full bg-slate-900 border border-white/10 py-16 sm:py-24 flex items-center justify-center rounded-[3rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden px-4 ${isRunning ? 'border-' + MODES_CFG[mode].color.split('-')[1] + '-500/30 shadow-' + MODES_CFG[mode].color.split('-')[1] + '-500/10' : ''}`}>
        <div className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold ${MODES_CFG[mode].textColor} tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors`}
             style={{ fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace" }}>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={toggleTimer}
          className={`w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-400' : MODES_CFG[mode].color}`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} className="ml-2" />}
        </button>
        <button 
          onClick={resetTimer}
          className="w-16 h-16 flex items-center justify-center rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all hover:scale-105 active:scale-95"
        >
          <Square size={24} />
        </button>
      </div>
    </div>
  );
}

function ExamMetronomeContent({ isFocusMode, setIsFocusMode }: any) {
  const navigate = useNavigate();
  
  const [currentMode, setCurrentMode] = useState<'TYT' | 'AYT' | 'YDT'>('TYT');
  const [isRunning, setIsRunning] = useState(false);
  const [pausedElapsedSeconds, setPausedElapsedSeconds] = useState(0);
  const [statusText, setStatusText] = useState('Başlamak için hazır.');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const [rhythmVolume, setRhythmVolume] = useState(50);
  const [chimeVolume, setChimeVolume] = useState(70);
  const [soundType, setSoundType] = useState<'beep' | 'click'>('beep');

  // Environment Sound State
  const [envSoundType, setEnvSoundType] = useState<string>('none');
  const [envVolume, setEnvVolume] = useState(30);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rhythmGainRef = useRef<GainNode | null>(null);
  const chimeGainRef = useRef<GainNode | null>(null);
  const envGainRef = useRef<GainNode | null>(null);
  const envSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  const animationFrameRef = useRef<number | null>(null);
  const startTimeMsRef = useRef<number>(0);
  const lastProcessedElapsedRef = useRef<number>(-1);
  const mainRef = useRef<HTMLDivElement>(null);

  const initAudio = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtxRef.current = new AudioContextClass();
        
        rhythmGainRef.current = audioCtxRef.current.createGain();
        rhythmGainRef.current.connect(audioCtxRef.current.destination);
        
        chimeGainRef.current = audioCtxRef.current.createGain();
        chimeGainRef.current.connect(audioCtxRef.current.destination);

        envGainRef.current = audioCtxRef.current.createGain();
        envGainRef.current.connect(audioCtxRef.current.destination);
        
        updateVolumes(rhythmVolume, chimeVolume, envVolume);
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }, [rhythmVolume, chimeVolume, envVolume]);

  const updateVolumes = useCallback((rVol: number, cVol: number, eVol: number) => {
    if (rhythmGainRef.current) {
      rhythmGainRef.current.gain.value = (rVol / 100) * (rVol / 100);
    }
    if (chimeGainRef.current) {
      chimeGainRef.current.gain.value = (cVol / 100) * (cVol / 100);
    }
    if (envGainRef.current) {
      envGainRef.current.gain.value = (eVol / 100) * (eVol / 100);
    }
  }, []);

  useEffect(() => {
    updateVolumes(rhythmVolume, chimeVolume, envVolume);
  }, [rhythmVolume, chimeVolume, envVolume, updateVolumes]);

  const toggleEnvSound = useCallback((type: string) => {
    initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    if (envSourceRef.current) {
      if (envSourceRef.current instanceof AudioBufferSourceNode) {
         envSourceRef.current.stop();
         envSourceRef.current.disconnect();
      } else if ((envSourceRef.current as any).pause) {
         (envSourceRef.current as any).pause();
         (envSourceRef.current as any).src = "";
      }
      envSourceRef.current = null;
    }
    
    if (type === 'none') return;
    
    // Custom predefined audio from internet
    if (type === 'lofi' || type === 'cafe' || type === 'library') {
      const PRESET_SOUNDS: Record<string, string> = {
        'lofi': 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf581.mp3?filename=lofi-study-112191.mp3',
        'cafe': 'https://cdn.pixabay.com/download/audio/2023/10/24/audio_dc395cfb61.mp3?filename=ambience-cafe-24151.mp3',
        'library': 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=classroom-6977.mp3'
      };
      
      const audio = new Audio(PRESET_SOUNDS[type]);
      audio.crossOrigin = 'anonymous';
      audio.loop = true;
      try {
        const source = ctx.createMediaElementSource(audio);
        if (envGainRef.current) source.connect(envGainRef.current);
        audio.play().catch(e => console.log('Custom audio playback blocked:', e));
        envSourceRef.current = source as any; 
        (envSourceRef.current as any).pause = () => audio.pause();
        (envSourceRef.current as any).src = ""; 
      } catch (err) {
        audio.volume = envVolume / 100;
        audio.play().catch(e => console.log(e));
        envSourceRef.current = audio as any;
      }
      return;
    }

    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
        let white = Math.random() * 2 - 1;
        if (type === 'brown') {
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        } else {
            data[i] = white;
        }
    }
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    if (type === 'murmur') {
        filter.frequency.value = 300; 
    } else if (type === 'brown') {
        filter.frequency.value = 800; // Rain / Brown noise
    } else {
        filter.frequency.value = 2000; // Pink-ish focus
    }
    
    source.connect(filter);
    if (envGainRef.current) filter.connect(envGainRef.current);
    
    source.start();
    envSourceRef.current = source;
  }, [initAudio]);

  useEffect(() => {
    if (envSoundType === 'none') {
      if (envSourceRef.current) {
        envSourceRef.current.stop();
        envSourceRef.current.disconnect();
        envSourceRef.current = null;
      }
    } else if (isRunning || !isFocusMode) {
      toggleEnvSound(envSoundType);
    }
  }, [envSoundType, isRunning, isFocusMode, toggleEnvSound]);

  const playClickSound = useCallback(() => {
    const ctx = audioCtxRef.current;
    const gainNode = rhythmGainRef.current;
    if (!ctx || !gainNode) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(gainNode);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(1.0, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }, []);

  const playBeepSound = useCallback(() => {
    const ctx = audioCtxRef.current;
    const gainNode = rhythmGainRef.current;
    if (!ctx || !gainNode) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(gainNode);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime); 
    
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }, []);

  const playChimeSound = useCallback(() => {
    const ctx = audioCtxRef.current;
    const gainNode = chimeGainRef.current;
    if (!ctx || !gainNode) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(gainNode);
    
    osc1.type = 'sine';
    osc2.type = 'triangle';
    
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.setValueAtTime(1760, ctx.currentTime); 
    
    gain.gain.setValueAtTime(0.8, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 2.5);
    osc2.stop(ctx.currentTime + 2.5);
  }, []);

  const playCurrentMicroSound = useCallback(() => {
    if (soundType === 'beep') playBeepSound();
    else playClickSound();
  }, [soundType, playBeepSound, playClickSound]);

  const triggerFlashEffect = useCallback(() => {
    if (mainRef.current) {
      mainRef.current.classList.add('bg-emerald-900');
      setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.classList.remove('bg-emerald-900');
        }
      }, 1000);
    }
  }, []);

  const endTimer = useCallback(() => {
    setIsRunning(false);
    setIsFocusMode(false);
    setPausedElapsedSeconds(MODES[currentMode].duration * 60);
    setStatusText("SINAV BİTTİ!");
    
    playChimeSound();
    setTimeout(playChimeSound, 1000);
    triggerFlashEffect();
    
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  }, [currentMode, playChimeSound, triggerFlashEffect, setIsFocusMode]);

  const gameLoop = useCallback(() => {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTimeMsRef.current) / 1000);

    if (elapsedSeconds !== lastProcessedElapsedRef.current && elapsedSeconds >= 0) {
      lastProcessedElapsedRef.current = elapsedSeconds;
      setPausedElapsedSeconds(elapsedSeconds);

      if (elapsedSeconds > 0) {
        const isMacroTick = (elapsedSeconds % MACRO_INTERVAL === 0);
        const isMicroTick = (elapsedSeconds % MODES[currentMode].tickInterval === 0);

        if (isMacroTick) {
          playChimeSound();
          triggerFlashEffect();
          const blocks = elapsedSeconds / MACRO_INTERVAL;
          setStatusText(`${blocks * 20} dakika geride kaldı!`);
        } else if (isMicroTick) {
          playCurrentMicroSound();
        }
      }

      if (elapsedSeconds >= MODES[currentMode].duration * 60) {
        endTimer();
        return;
      }
    }

    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    }
  }, [currentMode, playChimeSound, playCurrentMicroSound, triggerFlashEffect, endTimer, isRunning]);

  useEffect(() => {
    if (isRunning) {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isRunning, gameLoop]);

  const toggleTimer = () => {
    initAudio();

    if (!isRunning) {
      setIsRunning(true);
      setIsFocusMode(true);
      startTimeMsRef.current = Date.now() - (pausedElapsedSeconds * 1000);
      const currentTick = MODES[currentMode].tickInterval;
      setStatusText(`Sınav saati çalışıyor. Her ${currentTick} saniyede ritim duyacaksınız.`);
      
      const elem = mainRef.current || document.documentElement;
      if (elem.requestFullscreen && !document.fullscreenElement) {
        elem.requestFullscreen().catch(err => {
          console.log(`Tam ekran hatası: ${err.message}`);
        });
      }
    } else {
      setIsRunning(false);
      setStatusText("Sınav duraklatıldı.");
    }
  };

  const confirmReset = () => {
    setShowConfirmModal(false);
    setIsRunning(false);
    setIsFocusMode(false);
    setPausedElapsedSeconds(0);
    lastProcessedElapsedRef.current = -1;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    setStatusText("Süre sıfırlandı. Başlamak için hazır.");
    if (mainRef.current) mainRef.current.classList.remove('bg-emerald-900');
    
    if (envSourceRef.current) {
      envSourceRef.current.stop();
      envSourceRef.current.disconnect();
      envSourceRef.current = null;
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(err => console.log(err));
    }
  };

  const toggleFullScreen = () => {
    const elem = mainRef.current || document.documentElement;
    if (!document.fullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.log(`Tam ekran hatası: ${err.message}`);
        });
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(err => console.log(err));
      }
    }
  };

  const formatSimulatedTime = (elapsedSecs: number) => {
    const { startH, startM } = MODES[currentMode];
    let totalSecs = (startH * 3600) + (startM * 60) + elapsedSecs;
    
    const h = Math.floor(totalSecs / 3600) % 24;
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={mainRef} className={`w-full flex flex-col items-center justify-center transition-colors duration-500 ${isFocusMode ? 'bg-black absolute inset-0 z-50 rounded-none p-4' : ''}`}>
      
      <AnimatePresence>
        {isFocusMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4 z-50 flex items-center gap-2 group"
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 overflow-hidden items-center bg-black/50 backdrop-blur-md p-2 rounded-2xl border border-white/5">
              <button 
                onClick={toggleTimer} 
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isRunning ? 'bg-amber-600/20 text-amber-500 hover:bg-amber-600/30' : 'bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600/30'}`}
                title={isRunning ? "Duraklat" : "Devam Et"}
              >
                {isRunning ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button 
                onClick={() => setShowConfirmModal(true)} 
                className="w-12 h-12 flex items-center justify-center bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 rounded-xl transition-all"
                title="Sınavı Bitir"
              >
                <Square size={20} />
              </button>
              <button 
                onClick={toggleFullScreen} 
                className="w-12 h-12 flex items-center justify-center bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-xl transition-all"
                title="Tam Ekran Değiştir"
              >
                <Maximize size={20} />
              </button>
            </div>
            <div className="w-12 h-12 flex items-center justify-center text-slate-600 hover:text-white transition-colors cursor-pointer bg-black/20 rounded-xl">
              <Settings size={20} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full max-w-4xl flex flex-col items-center transition-all duration-500 ${isFocusMode ? 'scale-100 sm:scale-105 md:scale-110' : ''}`}>
        
        <AnimatePresence>
          {!isFocusMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="w-full flex flex-col items-center overflow-hidden"
            >
              <div className="flex flex-wrap justify-center gap-4 mb-8 w-full">
                {Object.keys(MODES).map((mode) => {
                  const isActive = currentMode === mode;
                  return (
                    <button 
                      key={mode}
                      onClick={() => !isRunning && setCurrentMode(mode as any)}
                      className={`px-8 py-3 rounded-xl font-bold text-lg transition-all ${
                        isActive 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 -translate-y-1' 
                          : 'bg-slate-800 border border-white/5 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {mode} <span className="block text-xs font-normal opacity-80">{MODES[mode as any].duration} Dk ({MODES[mode as any].tickInterval}sn)</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-4 mb-12 w-full max-w-2xl bg-slate-900 border border-white/5 p-4 md:p-6 rounded-2xl mx-auto">
                <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Volume2 size={16} className="text-slate-400" />
                    <span className="text-slate-300 text-sm whitespace-nowrap">Ritim:</span>
                    <input type="range" min="0" max="100" value={rhythmVolume} onChange={e => setRhythmVolume(Number(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div className="hidden md:block w-px h-8 bg-slate-800"></div>
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <AlertCircle size={16} className="text-emerald-500" />
                    <span className="text-slate-300 text-sm whitespace-nowrap">Çan:</span>
                    <input type="range" min="0" max="100" value={chimeVolume} onChange={e => setChimeVolume(Number(e.target.value))} className="w-full accent-emerald-500" />
                  </div>
                </div>
                
                <div className="h-px w-full bg-slate-800 my-2"></div>

                <div className="flex flex-col md:flex-row flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Headphones size={16} className="text-purple-400" />
                    <span className="text-slate-300 text-sm whitespace-nowrap">Çevre Sesi:</span>
                    <select value={envSoundType} onChange={e => { initAudio(); setEnvSoundType(e.target.value as any); }} className="bg-slate-800 text-white rounded-lg px-2 py-1.5 text-sm outline-none border border-slate-700 focus:border-purple-500 w-full">
                      <option value="none">Kapalı</option>
                      <option value="lofi">Lofi Çalışma</option>
                      <option value="cafe">Kafe Ortamı</option>
                      <option value="library">Kütüphane</option>
                      <option value="murmur">Sınıf Uğultusu (Simüle)</option>
                      <option value="brown">Yağmur Sesi (Simüle)</option>
                      <option value="pink">Odak Frekansı (Simüle)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                     <span className="text-slate-300 text-sm whitespace-nowrap">Ses:</span>
                     <input type="range" min="0" max="100" value={envVolume} onChange={e => setEnvVolume(Number(e.target.value))} className="w-full accent-purple-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings size={16} className="text-slate-400" />
                    <select value={soundType} onChange={e => setSoundType(e.target.value as 'beep' | 'click')} className="bg-slate-800 text-white rounded-lg px-2 py-1.5 text-sm outline-none border border-slate-700 focus:border-indigo-500">
                      <option value="beep">Bip Sesi</option>
                      <option value="click">Tık Sesi</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button onClick={() => { initAudio(); playCurrentMicroSound(); }} className="px-4 py-2 bg-slate-800 border border-white/5 rounded-lg hover:bg-slate-700 text-xs font-semibold text-white transition-colors">Ritim Test</button>
                  <button onClick={() => { initAudio(); playChimeSound(); }} className="px-4 py-2 bg-slate-800 border border-white/5 rounded-lg hover:bg-slate-700 text-xs font-semibold text-white transition-colors">Çan Test</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`relative w-full ${isFocusMode ? 'bg-transparent border-transparent py-20' : 'bg-slate-900 border border-white/10 py-16 sm:py-24 rounded-[2rem] shadow-2xl mb-12'} flex items-center justify-center transition-all duration-500 overflow-hidden px-4`}>
          <div 
            className={`text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-amber-500 tracking-wider leading-none tabular-nums drop-shadow-lg`}
            style={{ fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace", textShadow: "0 0 20px rgba(245, 158, 11, 0.5)" }}
          >
            {formatSimulatedTime(pausedElapsedSeconds)}
          </div>
          
          <div className={`absolute -bottom-10 left-0 right-0 text-center font-medium text-sm md:text-base ${isFocusMode ? 'text-slate-600' : 'text-slate-400'}`}>
            {statusText}
          </div>
        </div>

        <AnimatePresence>
          {!isFocusMode && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-wrap justify-center gap-4 z-10 w-full"
            >
              <button 
                onClick={toggleTimer} 
                className={`px-8 py-4 ${isRunning ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'} text-white font-bold rounded-2xl text-lg shadow-lg flex items-center justify-center gap-3 transition-all min-w-[200px]`}
              >
                {isRunning ? <><Pause size={24} /> Duraklat</> : <><Play size={24} /> {pausedElapsedSeconds > 0 ? "Devam Et" : "Sınavı Başlat"}</>}
              </button>
              
              {pausedElapsedSeconds > 0 && (
                <button 
                  onClick={() => setShowConfirmModal(true)} 
                  className="px-6 py-4 bg-slate-800 border border-rose-500/20 hover:bg-rose-900/30 hover:border-rose-500 text-rose-400 font-bold justify-center rounded-2xl text-lg transition-all flex items-center gap-2"
                >
                  <Square size={20} /> Bitir / Sıfırla
                </button>
              )}

              <button 
                onClick={toggleFullScreen} 
                className="px-6 py-4 bg-slate-800 border border-white/5 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-lg transition-all flex items-center gap-2" 
                title="Tam Ekran"
              >
                <Maximize size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 p-8 rounded-3xl max-w-sm w-full text-center border border-white/10 shadow-2xl"
            >
              <h3 className="text-2xl font-bold text-white mb-4">Sınavı Bitir</h3>
              <p className="text-slate-300 mb-8">Sınavı bitirmek ve süreyi sıfırlamak istediğinize emin misiniz?</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all">İptal</button>
                <button onClick={confirmReset} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-all">Evet, Bitir</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function StopwatchTimer() {
  const { user } = useAuth();
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'study_sessions'),
        where('studentId', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
         const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
         // Sort locally to avoid needing a composite index
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
      <div className="w-full bg-slate-900 border border-amber-500/30 py-16 sm:py-24 flex items-center justify-center rounded-[3rem] shadow-2xl mb-8 transition-colors duration-500 overflow-hidden shadow-amber-500/10 px-4">
        <div className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-bold text-amber-500 tracking-widest leading-none tabular-nums drop-shadow-lg transition-colors"
             style={{ fontFamily: "'Digital-7 Mono', 'Share Tech Mono', 'Courier New', monospace" }}>
          {formatTime(time)}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTimer}
          className={`w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${isRunning ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
        >
          {isRunning ? <Pause size={32} /> : <Play size={32} />}
        </button>
        <button
          onClick={stopAndSave}
          disabled={time === 0}
          className="w-20 h-20 flex items-center justify-center rounded-3xl text-white shadow-lg transition-all hover:scale-105 active:scale-95 bg-rose-500 hover:bg-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square size={32} fill="currentColor" />
        </button>
      </div>

      <div className="w-full bg-slate-800/50 rounded-3xl p-6 mt-8 border border-white/5">
        <h3 className="text-xl font-bold text-white mb-4">Günlük Çalışma Kayıtları</h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {Object.keys(groupedSessions).length > 0 ? (
            Object.entries(groupedSessions).map(([dateStr, data]: [string, any]) => (
              <div key={dateStr} className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                <button 
                  onClick={() => toggleDay(dateStr)}
                  className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-white font-bold">{dateStr}</span>
                    <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded-lg">
                      {data.sessions.length} Oturum
                    </span>
                  </div>
                  <span className="text-amber-400 font-black tracking-wider bg-amber-500/10 px-3 py-1 rounded-lg">
                    {formatTime(data.totalDuration)}
                  </span>
                </button>
                
                {expandedDays[dateStr] && (
                  <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
                    {data.sessions.map((session: any) => (
                      <div key={session.id} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/5">
                        <span className="text-slate-400 text-sm font-medium">
                          {session.createdAt?.seconds ? new Date(session.createdAt.seconds * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi'}
                        </span>
                        <span className="text-amber-400 text-sm font-bold tracking-wider">
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
              <p className="text-slate-500">Henüz çalışma kaydınız bulunmuyor.</p>
              <p className="text-slate-600 text-sm mt-1">Hemen kronometreyi başlatın!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExamMetronomeApp() {
  const { userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'pomodoro' | 'metronome' | 'stopwatch'>('pomodoro');
  const [isFocusMode, setIsFocusMode] = useState(false);

  const plan = userData?.subscriptionPlan || '';
  const isSilver = plan.includes('Gümüş');

  return (
    <div className={`flex-1 flex flex-col items-center justify-start p-4 transition-colors duration-500 min-h-[80vh] ${isFocusMode ? 'bg-black' : ''}`}>
      {!isFocusMode && (
        <div className="text-center mb-8 w-full mt-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-2 text-white">Zaman Yönetimi</h1>
          <p className="text-slate-400">Çalışma sürenizi ve sınav ritminizi yönetin</p>
        </div>
      )}

      {!isFocusMode && (
        <div className="flex bg-slate-800/50 p-1 rounded-2xl mb-12">
          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'pomodoro' 
                ? 'bg-rose-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Timer size={18} /> Pomodoro
          </button>
          <button
            onClick={() => {
              if (isSilver) {
                alert("Sınav Metronomu özelliği sadece Altın Paket (Sınırsız Zirve VIP) abonelerine özeldir. Paketinizi yükselterek bu özelliğe erişebilirsiniz!");
                return;
              }
              setActiveTab('metronome');
            }}
            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'metronome' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            } ${isSilver ? 'opacity-60' : ''}`}
          >
            <Clock size={18} /> Sınav Metronomu {isSilver && <Lock size={12} className="inline text-yellow-500" />}
          </button>
          <button
            onClick={() => setActiveTab('stopwatch')}
            className={`px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'stopwatch' 
                ? 'bg-amber-500 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <StopCircle size={18} /> Kronometre
          </button>
        </div>
      )}

      {activeTab === 'pomodoro' ? (
        <PomodoroTimer />
      ) : activeTab === 'stopwatch' ? (
        <StopwatchTimer />
      ) : (
        <ExamMetronomeContent isFocusMode={isFocusMode} setIsFocusMode={setIsFocusMode} />
      )}
    </div>
  );
}
