import { FileText, Target, Users, Clock, Eye, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import GoldenStrip from './GoldenStrip';

export default function ActivitiesOverview() {
  const activities = [
    {
      id: "surec",
      icon: <Eye className="text-rose-400" size={32} />,
      title: "Sınav Süreç Takibi",
      desc: "Sınav esnasındaki odaklanma sürenizi ve fiziksel alışkanlıklarınızı analiz ederek verimliliğinizi maksimize edin.",
      url: "/sinav-surec-takibi",
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200",
      colSpan: "md:col-span-4",
      color: "from-rose-500/20 to-rose-900/80"
    },
    {
      id: "deneme",
      icon: <Target className="text-blue-400" size={32} />,
      title: "Deneme Takibi",
      desc: "Net analizlerinizi ve gelişiminizi grafiklerle anında takip edin.",
      url: "/deneme-takibi",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
      colSpan: "md:col-span-2",
      color: "from-blue-500/20 to-blue-900/80"
    },
    {
      id: "derin",
      icon: <FileText className="text-purple-400" size={32} />,
      title: "Derin Deneme Analizi",
      desc: "Hangi konularda, hangi tip sorularda hata yaptığınızı detaylıca analiz edin.",
      url: "/derin-deneme-analizi",
      image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=800",
      colSpan: "md:col-span-2",
      color: "from-purple-500/20 to-purple-900/80"
    },
    {
      id: "kisilik",
      icon: <Users className="text-indigo-400" size={32} />,
      title: "Kişilik Analizleri",
      desc: "Öğrenme stilinizi ve güçlü yönlerinizi keşfederek kendinize en uygun yolu çizin.",
      url: "/kisilik-analizleri",
      image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&q=80&w=800",
      colSpan: "md:col-span-2",
      color: "from-indigo-500/20 to-indigo-900/80"
    },
    {
      id: "metronom",
      icon: <Clock className="text-emerald-400" size={32} />,
      title: "Sınav Metronomu",
      desc: "Özel sınav zamanlayıcısıyla süre yönteminizi geliştirin ve tam odaklanmayı sağlayın.",
      url: "/sinav-metronomu",
      image: "https://images.pexels.com/photos/5563404/pexels-photo-5563404.jpeg?auto=compress&cs=tinysrgb&h=650&w=940",
      colSpan: "md:col-span-2",
      color: "from-emerald-500/20 to-emerald-900/80"
    }
  ];

  return (
    <section className="relative">
      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Target className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Özel Analizler</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Clock className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Zaman Yönetimi</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Eye className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Süreç Takibi</span>
          </div>
        </div>
      </GoldenStrip>

      <div className="py-24 px-4 sm:px-6 relative overflow-hidden bg-slate-950">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-full mb-6 relative hover:bg-slate-800/50 transition-colors group">
              <span className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur opacity-30 group-hover:opacity-50 transition duration-500"></span>
              <span className="relative text-xs sm:text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={16} className="text-blue-400" />
                Akademik Araçlarımız
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tight text-white">
              Faaliyetlerimiz
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-light">
              Öğrencilerimizi başarıya taşıyacak benzersiz sistemlerimiz. Derinlemesine veriler ve detaylı analizlerle süreci profesyonel şekilde yönetin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-6 lg:gap-8 auto-rows-[300px] sm:auto-rows-[350px] lg:auto-rows-[400px]">
            {activities.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: "easeOut" }}
                className={`${item.colSpan} relative group rounded-3xl overflow-hidden cursor-pointer bg-slate-900 shadow-2xl border border-white/10 hover:border-white/20 transition-colors`}
              >
                <Link to={item.url} className="absolute inset-0 z-20" aria-label={item.title}></Link>
                
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                  <img 
                    src={item.image} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-80"
                  />
                  {/* Subtle noise texture over image */}
                  <div className="absolute inset-0 mix-blend-overlay opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
                </div>

                {/* Gradient Overlays */}
                <div className={`absolute inset-0 z-0 bg-gradient-to-t ${item.color} mix-blend-multiply opacity-60 transition-opacity duration-500 group-hover:opacity-40`}></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"></div>

                {/* Content */}
                <div className="absolute inset-0 z-10 p-6 sm:p-8 flex flex-col justify-end">
                  <div className="transform transition-transform duration-500 group-hover:-translate-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 shadow-lg border border-white/20 group-hover:bg-white/20 transition-colors">
                      {item.icon}
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-sm">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm sm:text-base text-slate-300 line-clamp-2 md:line-clamp-3 font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                      {item.desc}
                    </p>
                  </div>
                  
                  {/* Read More button expanding on hover */}
                  <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 right-6 sm:right-8 overflow-hidden opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 flex items-center text-sm font-bold text-white uppercase tracking-wider">
                    Detayları Keşfet 
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform duration-500" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
