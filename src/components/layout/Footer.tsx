import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900/50 backdrop-blur-xl border-t border-white/10 pt-20 pb-10 px-6 md:px-12 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
        <div className="md:col-span-4 space-y-6">
          <Link to="/" className="inline-block">
            <img src="/images/logo.png" alt="FocusON Akademi Logo" width="450" height="175" className="h-16 md:h-20 w-auto object-contain" />
          </Link>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Deneme Sınavları, Öğrenci Koçluğu ve Birebir Özel Ders FocusON Akademi'de
          </p>
        </div>
        
        <div className="md:col-span-4">
          <h3 className="font-bold text-white tracking-wide uppercase text-sm mb-6">Kurumsal</h3>
          <ul className="space-y-4 text-sm text-slate-400">
            <li><Link to="/koclar-icin" className="hover:text-emerald-400 transition-colors">Koçlar İçin FocusON</Link></li>
            <li><Link to="/koc-basvuru" className="hover:text-emerald-400 transition-colors font-medium text-emerald-400/90">Koç Başvurusu</Link></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Biz Kimiz?</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Amacımız</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Sıkça Sorulan Sorular</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">İletişim</a></li>
          </ul>
        </div>
        
        <div className="md:col-span-4">
          <h3 className="font-bold text-white tracking-wide uppercase text-sm mb-6">Koşullar ve Sözleşmeler</h3>
          <ul className="space-y-4 text-sm text-slate-400">
            <li><Link to="/kullanim-kosullari" className="hover:text-blue-400 transition-colors">Kullanım Koşulları</Link></li>
            <li><Link to="/gizlilik-politikasi" className="hover:text-blue-400 transition-colors">Gizlilik Sözleşmesi</Link></li>
            <li>
              <button
                onClick={() => {
                  localStorage.removeItem('focuson_cookie_consent');
                  window.location.reload();
                }}
                className="hover:text-blue-400 transition-colors text-left"
              >
                Çerez Tercihleri
              </button>
            </li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Üyelik Sözleşmesi</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Mesafeli Satış Sözleşmesi</a></li>
            <li><a href="#" className="hover:text-blue-400 transition-colors">Teslimat ve İade Koşulları</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-500">
        <div className="flex gap-6 items-center opacity-60 hover:opacity-100 transition-opacity">
          <span className="font-extrabold tracking-tighter text-xl">VISA</span>
          <span className="font-bold italic text-lg opacity-80">MasterCard</span>
          <span className="font-black italic text-xl">troy</span>
        </div>
        <p className="font-medium tracking-wide font-sans text-[11px] uppercase">&copy; 2026 FocusON Akademi. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
