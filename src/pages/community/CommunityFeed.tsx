import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, Image as ImageIcon, Smile, MessageSquare, Heart, Share2, 
  MoreHorizontal, User
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';

export default function CommunityFeed() {
  const { user, userData } = useAuth();
  const [postText, setPostText] = useState('');

  const [posts, setPosts] = useState([
    {
      id: '1',
      authorName: 'Ahmet Yılmaz',
      authorRole: 'Öğrenci',
      content: 'Bugün TYT Matematik denemesinde nihayet 30 netin üzerine çıktım! 🎉 Programımı düzenleyen koçuma teşekkürler.',
      timestamp: '2 saat önce',
      likes: 24,
      comments: 5
    },
    {
      id: '2',
      authorName: 'Selin Yıldız',
      authorRole: 'Koç',
      content: 'Günün motivasyon sorusu: Hayalindeki üniversite için bugün ne yaptın? Cevapları altta bekliyorum 👇',
      timestamp: '5 saat önce',
      likes: 56,
      comments: 18
    }
  ]);

  const handlePost = () => {
    if (!postText.trim()) return;
    
    const newPost = {
      id: Math.random().toString(),
      authorName: userData ? `${userData.firstName} ${userData.lastName}` : 'Kullanıcı',
      authorRole: userData?.role === 'coach' ? 'Koç' : userData?.role === 'admin' ? 'Yönetici' : 'Öğrenci',
      content: postText,
      timestamp: 'Şimdi',
      likes: 0,
      comments: 0
    };
    
    setPosts([newPost, ...posts]);
    setPostText('');
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Create Post Card */}
        <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-4 shadow-xl">
          <div className="flex gap-4">
             <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center shrink-0 border border-indigo-500/30">
               <User size={20} />
             </div>
             <div className="flex-1">
               <textarea 
                 value={postText}
                 onChange={e => setPostText(e.target.value)}
                 placeholder="Bugün neler öğrendin? Toplulukla paylaş..."
                 className="w-full bg-transparent border-none text-white resize-none outline-none min-h-[80px] p-2 placeholder:text-slate-500"
               />
               <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-2">
                 <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-xl transition-all">
                      <ImageIcon size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-pink-400 hover:bg-white/5 rounded-xl transition-all">
                      <Smile size={18} />
                    </button>
                 </div>
                 <button 
                   onClick={handlePost}
                   className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg"
                 >
                   <Send size={16} /> Paylaş
                 </button>
               </div>
             </div>
          </div>
        </div>

        {/* Feed Posts */}
        <div className="space-y-6">
           <AnimatePresence>
             {posts.map(post => (
               <motion.div 
                 key={post.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-5 shadow-xl"
               >
                 {/* Post Header */}
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/10">
                          <User size={16} className="text-slate-400" />
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-sm">{post.authorName}</h3>
                            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {post.authorRole}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{post.timestamp}</p>
                       </div>
                    </div>
                    <button className="p-2 text-slate-500 hover:text-white rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                 </div>

                 {/* Post Content */}
                 <div className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                   {post.content}
                 </div>

                 {/* Post Actions */}
                 <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                    <button className="flex items-center gap-2 text-slate-400 hover:text-rose-400 transition-colors text-xs font-bold">
                       <Heart size={16} /> {post.likes > 0 && post.likes}
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors text-xs font-bold">
                       <MessageSquare size={16} /> {post.comments > 0 && post.comments}
                    </button>
                    <button className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-xs font-bold ml-auto">
                       <Share2 size={16} /> Paylaş
                    </button>
                 </div>
               </motion.div>
             ))}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
