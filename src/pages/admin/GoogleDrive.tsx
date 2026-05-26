import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileBox, 
  Search, 
  Loader2, 
  File, 
  Folder, 
  Download,
  LogOut,
  AlertCircle 
} from 'lucide-react';
import { initAuth, googleSignIn, getAccessToken, logoutWorkspace } from '../../lib/workspaceAuth';

export default function GoogleDrive() {
  const [needsAuth, setNeedsAuth] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInitialFiles = async () => {
      const token = await getAccessToken();
      if (token) {
        setNeedsAuth(false);
        loadFiles(token);
      } else {
        setNeedsAuth(true);
      }
    };

    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        loadFiles(token);
      },
      () => setNeedsAuth(true)
    );

    fetchInitialFiles();

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        loadFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err?.message || 'Giriş yapılamadı.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutWorkspace();
    setFiles([]);
  };

  const loadFiles = async (token: string, query: string = '') => {
    setIsLoading(true);
    setError(null);
    try {
      let url = 'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,webViewLink,iconLink)&orderBy=modifiedTime desc&pageSize=50';
      if (query) {
         url += `&q=name contains '${query}' and trashed = false`;
      } else {
         url += `&q=trashed = false`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Dosyalar alınırken bir hata oluştu.');
      }
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err: any) {
      setError(err?.message || 'Bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getAccessToken();
    if (token) {
      loadFiles(token, searchQuery);
    }
  };

  if (needsAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-slate-900/50 rounded-3xl border border-white/5 p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5" />
        <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6 relative z-10">
          <FileBox className="w-10 h-10 text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 relative z-10">Google Drive Bağlantısı</h2>
        <p className="text-slate-400 mb-8 max-w-md relative z-10">
          Öğrenci veya koç dosyalarınıza erişmek için Google Drive hesabınızı bağlayın.
        </p>
        
        {error && (
           <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 relative z-10 flex items-center gap-2">
             <AlertCircle size={18} />
             {error}
           </div>
        )}

        <button 
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="gsi-material-button bg-white text-slate-800 disabled:opacity-75 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors shadow-xl px-6 py-3 rounded-full flex items-center gap-3 font-semibold relative z-10"
        >
          {isLoggingIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
          ) : (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
          )}
          <span>{isLoggingIn ? 'Bağlanıyor...' : 'Google ile Bağlan'}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
             <FileBox className="text-blue-500" />
             Dosyalarım
          </h1>
          <p className="text-slate-400 text-sm mt-1">Google Drive üzerindeki dosyalarınıza erişin.</p>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={handleLogout}
             className="px-4 py-2 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2 text-sm font-semibold"
           >
             <LogOut size={16} />
             Bağlantıyı Kes
           </button>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-6 backdrop-blur-sm">
        <form onSubmit={handleSearch} className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dosyalarda ara..."
            className="w-full bg-slate-800/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
          />
        </form>

        {error && (
           <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
             <AlertCircle size={18} />
             {error}
           </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file, idx) => (
              <motion.a
                key={file.id}
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-slate-800/30 border border-white/5 rounded-xl hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group flex items-start gap-4"
              >
                <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                  {file.mimeType === 'application/vnd.google-apps.folder' ? (
                    <Folder className="w-5 h-5 text-amber-500" />
                  ) : (
                    <File className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-1">
                     {file.mimeType.replace('application/vnd.google-apps.', '')}
                  </p>
                </div>
              </motion.a>
            ))}
            {files.length === 0 && !isLoading && (
              <div className="col-span-full py-12 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                Dosya bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
