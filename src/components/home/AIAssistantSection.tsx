import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";
import GoldenStrip from './GoldenStrip';
import { Bot, Sparkles, CalendarCheck, FileText, Video, Bell, BookOpen, Presentation, Users, Trophy, Wallet, UserCircle, BarChart2, CheckCircle, TrendingUp } from 'lucide-react';
import { Typewriter } from '../ui/Typewriter';

export default function AIAssistantSection() {
  const [init, setInit] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      fullScreen: {
        enable: false,
      },
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 120,
      interactivity: {
        detect_on: "canvas",
        events: {
          onClick: {
            enable: true,
            mode: "bubble",
          },
          onHover: {
            enable: true,
            mode: "grab",
          },
          resize: {
            enable: true
          }
        },
        modes: {
          grab: {
            distance: 350,
            links: {
              opacity: 0.65,
              color: "#818cf8"
            },
          },
          bubble: {
            distance: 350,
            size: 12,
            duration: 1.54,
            opacity: 0.9,
            speed: 3
          }
        },
      },
      particles: {
        color: {
          value: "#818cf8",
        },
        links: {
          color: "#818cf8",
          distance: 150,
          enable: true,
          opacity: 0.15,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: false,
          speed: 1,
          straight: false,
        },
        number: {
          density: {
            enable: true,
            width: 800
          },
          value: 90,
        },
        opacity: {
          value: 0.15,
        },
        shape: {
          type: "circle",
        },
        size: {
          value: { min: 1, max: 5 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  const typewriterStrings = [
    "Sistemdeki tüm bilgilerinize saniyeler içinde erişir.",
    "Size en doğru ve kişiselleştirilmiş yolu gösterir.",
    "Sürecinizi analiz eder ve stratejiler geliştirir.",
    "Adım adım hedeflerinize ulaşmanızı sağlar."
  ];

  const features = [
    { icon: <CalendarCheck size={18} />, text: "Randevuları, değişiklikleri & iptalleri yönetir" },
    { icon: <BookOpen size={18} />, text: "Programı işaretler, kaç soru çözdüğünü kaydeder" },
    { icon: <Video size={18} />, text: "Online Eğitimler konusunda bilgi sağlar" },
    { icon: <Bell size={18} />, text: "Etkinlik, Grup ve Forum bildirimlerini takip eder" },
    { icon: <FileText size={18} />, text: "Blog önerileri & Ders notları paylaşımı yapar" },
    { icon: <Trophy size={18} />, text: "Deneme sonuçları & Kişilik testlerini analiz eder" },
    { icon: <Presentation size={18} />, text: "Masa rezervasyonu & Mağazadan kitap önerisi sunar" },
    { icon: <Wallet size={18} />, text: "Cüzdan, Abonelik & Profil durumunuzu takip eder" }
  ];

  return (
    <section className="relative overflow-hidden bg-slate-950 min-h-[600px] flex flex-col justify-between border-y border-white/5">
      {init && (
        <Particles
          id="tsparticles"
          options={particlesOptions}
          className="absolute inset-0 z-0 h-full w-full opacity-60"
        />
      )}
      
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-12 py-20 w-full flex-grow flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full">
              <Sparkles className="text-indigo-400 w-4 h-4" />
              <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Yapay Zeka Asistanı</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
              Geleceğinize Rehberlik Eden <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Akıllı Asistan</span>
            </h2>
            
            <div className="h-20 text-lg md:text-xl text-slate-300 font-medium">
              <Typewriter strings={typewriterStrings} />
            </div>

            <div className="flex gap-4">
              <button onClick={() => navigate('/panel/ogrenci/ai-asistan')} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] flex items-center gap-2">
                <Bot size={20} />
                Asistanla Tanış
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10">
              <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">ON Asistan</h3>
                  <p className="text-xs text-indigo-400 font-medium uppercase tracking-widest">En Büyük Destekçiniz</p>
                </div>
              </div>
              
              <ul className="space-y-4">
                {features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-4 group">
                    <div className="mt-0.5 text-slate-500 group-hover:text-indigo-400 transition-colors">
                      {feature.icon}
                    </div>
                    <p className="text-sm font-medium text-slate-300 leading-relaxed">
                      {feature.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-cyan-500/20 blur-3xl -z-10 rounded-full" />
          </div>

        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <GoldenStrip>
          <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
            <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
              <BarChart2 className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
              <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Planlı İlerleme</span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
              <CheckCircle className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
              <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Sıkı Takip</span>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
              <TrendingUp className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
              <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Net Sonuçlar</span>
            </div>
          </div>
        </GoldenStrip>
      </div>
    </section>
  );
}
