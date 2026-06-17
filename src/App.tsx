import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { 
  Heart, 
  Send, 
  User, 
  MessageSquare, 
  Sparkles, 
  Smile, 
  Palette, 
  HelpCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Message {
  id: string;
  created_at: string;
  name: string;
  content: string;
  emoji: string;
  theme: string;
  likes: number;
}

const EMOJIS = ['😊', '🥰', '🔥', '🎉', '💡', '🌈', '🐱', '☕', '✨', '🥺'];
const THEMES = [
  { id: 'default', label: '靛紫', color: '#8b5cf6' },
  { id: 'violet', label: '粉紫', color: '#a78bfa' },
  { id: 'emerald', label: '翡翠', color: '#34d399' },
  { id: 'amber', label: '琥珀', color: '#fbbf24' },
  { id: 'rose', label: '玫瑰', color: '#f472b6' },
  { id: 'ocean', label: '海洋', color: '#38bdf8' }
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('😊');
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [isDbPlaceholder, setIsDbPlaceholder] = useState(false);

  // Check if Supabase keys are placeholder values
  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key || url.includes('your-supabase-project') || key.includes('your-anon-key')) {
      setIsDbPlaceholder(true);
    }
  }, []);

  // Fetch messages on mount
  useEffect(() => {
    if (isDbPlaceholder) {
      setIsLoading(false);
      // Populate with mockup messages if DB is placeholder
      setMessages([
        {
          id: '1',
          created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          name: '努豆先生',
          content: '哈囉！這是一個高質感留言板的展示範例！請點擊下方的「點讚」看看愛心動畫，或是點選上面的心情 Emoji 吧！🌟\n\n（註：目前尚未填寫您的 Supabase 金鑰，因此顯示為範例資料。）',
          emoji: '✨',
          theme: 'default',
          likes: 8
        },
        {
          id: '2',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          name: '小明',
          content: '這個毛玻璃的 UI 設計真的太美了！非常流暢且有質感！',
          emoji: '🥰',
          theme: 'ocean',
          likes: 3
        },
        {
          id: '3',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          name: '網頁設計愛好者',
          content: '這個設計非常棒，點讚功能也使用了 RPC 技術防止併發寫入衝突。推推！💻🔥',
          emoji: '🔥',
          theme: 'emerald',
          likes: 12
        }
      ]);
      return;
    }

    fetchMessages();
  }, [isDbPlaceholder]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setMessages(data);
      }
    } catch (err) {
      console.error('取得留言失敗:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    if (content.length > 200) return;

    if (isDbPlaceholder) {
      // Offline local mode
      const newMsg: Message = {
        id: Math.random().toString(),
        created_at: new Date().toISOString(),
        name: name.trim(),
        content: content.trim(),
        emoji: selectedEmoji,
        theme: selectedTheme,
        likes: 0
      };
      setMessages([newMsg, ...messages]);
      setContent('');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            name: name.trim(),
            content: content.trim(),
            emoji: selectedEmoji,
            theme: selectedTheme,
            likes: 0
          }
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setMessages([data[0], ...messages]);
        setContent('');
        // Celebration confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('送出留言失敗:', err);
      alert('送出留言失敗，請確認 Supabase Table 與 RLS 設定是否正確！');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Like Handler
  const handleLike = async (id: string) => {
    if (likedIds.includes(id)) return;

    // optimistic update
    setMessages(prev =>
      prev.map(msg => (msg.id === id ? { ...msg, likes: msg.likes + 1 } : msg))
    );
    setLikedIds([...likedIds, id]);

    if (isDbPlaceholder) return;

    try {
      // Call Supabase RPC to securely increment likes
      const { error } = await supabase.rpc('increment_likes', { message_id: id });
      if (error) throw error;
    } catch (err) {
      console.error('點讚失敗:', err);
      // Revert if error
      setMessages(prev =>
        prev.map(msg => (msg.id === id ? { ...msg, likes: msg.likes - 1 } : msg))
      );
      setLikedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Relative time helper
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffSec < 60) return '剛剛';
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    if (diffHr < 24) return `${diffHr} 小時前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Compute stats
  const totalMessages = messages.length;
  const moodDistribution = messages.reduce((acc, msg) => {
    acc[msg.emoji] = (acc[msg.emoji] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topMood = Object.entries(moodDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || '✨';

  // Get hex color of current selected theme for dynamic style bindings
  const currentThemeColor = THEMES.find(t => t.id === selectedTheme)?.color || '#8b5cf6';

  return (
    <>
      <div className="bg-glow"></div>
      <div className="bg-glow-right"></div>
      
      <div className="container">
        {/* Header */}
        <header>
          <h1 className="title-glow">心聲留言板</h1>
          <p className="subtitle">
            寫下你的心聲，留下你的足跡。這是一個使用 React + Supabase 打造的極致毛玻璃風格留言平台。
          </p>
        </header>

        {/* Warning if Placeholder */}
        {isDbPlaceholder && (
          <div className="alert-banner">
            <AlertTriangle className="alert-icon" color="#fbbf24" size={20} />
            <div className="alert-content">
              <p><strong>【尚未連線資料庫】</strong> 系統偵測到 <code>.env.local</code> 仍在使用預設範本金鑰。</p>
              <p>留言板目前運作於<strong>預覽模式</strong>（新增與點讚僅更新於本地瀏覽器記憶體）。請建立您的 Supabase 專案，將 API 資訊填入 <code>.env.local</code> 檔案中以啟用即時儲存功能。</p>
            </div>
          </div>
        )}

        {/* Stats Dashboard */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-value">{totalMessages}</div>
            <div className="stat-label">累積心聲</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#fbbf24' }}>{topMood}</div>
            <div className="stat-label">今日最熱門心情</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#f472b6' }}>
              {messages.reduce((sum, m) => sum + m.likes, 0)}
            </div>
            <div className="stat-label">收到的溫暖點讚</div>
          </div>
        </div>

        {/* Write Message Form */}
        <div 
          className="form-panel"
          style={{ 
            borderColor: `${currentThemeColor}2a`,
            boxShadow: `0 10px 40px ${currentThemeColor}12`
          }}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name-input" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} /> 你的稱呼 / 暱稱
              </label>
              <input
                id="name-input"
                type="text"
                className="input-glow"
                placeholder="輸入你的大名..."
                value={name}
                onChange={e => setName(e.target.value)}
                maxLength={20}
                required
                style={{
                  '--theme-default-color': currentThemeColor,
                  '--theme-default-glow': `${currentThemeColor}44`
                } as React.CSSProperties}
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Smile size={16} /> 當下心情 (Emoji)
              </label>
              <div className="emoji-row">
                {EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    type="button"
                    className={`emoji-btn ${selectedEmoji === emoji ? 'selected' : ''}`}
                    onClick={() => setSelectedEmoji(emoji)}
                    style={{
                      '--theme-default-color': currentThemeColor,
                      '--theme-default-glow': `${currentThemeColor}44`
                    } as React.CSSProperties}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={16} /> 留言卡片配色主題
              </label>
              <div className="theme-row">
                {THEMES.map(theme => (
                  <button
                    key={theme.id}
                    type="button"
                    title={theme.label}
                    className={`theme-dot ${theme.id} ${selectedTheme === theme.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTheme(theme.id)}
                  />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message-input" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={16} /> 留言內容
              </label>
              <textarea
                id="message-input"
                className="input-glow"
                placeholder="寫下你的溫暖話語或是心情點滴吧..."
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={200}
                required
                style={{
                  '--theme-default-color': currentThemeColor,
                  '--theme-default-glow': `${currentThemeColor}44`
                } as React.CSSProperties}
              />
              <div className="char-count">
                {content.length} / 200 字
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-submit"
              disabled={isSubmitting || !name.trim() || !content.trim()}
              style={{
                background: `linear-gradient(135deg, ${currentThemeColor} 0%, #1e1b4b 100%)`,
                boxShadow: `0 4px 20px ${currentThemeColor}40`
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="spinner" size={18} />
                  傳送中...
                </>
              ) : (
                <>
                  <Send size={18} />
                  送出心聲留言
                </>
              )}
            </button>
          </form>
        </div>

        {/* Message Wall Section */}
        <h2 className="message-wall-title">
          <Sparkles size={22} color="#f59e0b" /> 心聲留言牆
        </h2>

        {isLoading ? (
          <div className="grid-wall">
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
            <div className="skeleton-card"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <HelpCircle className="empty-icon" size={48} />
            <p className="empty-text">留言牆目前空空如也，快當第一個留言的人吧！</p>
          </div>
        ) : (
          <div className="grid-wall">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`message-card theme-${msg.theme}`}
              >
                <div className="card-header">
                  <div className="card-author">
                    <div className="card-avatar">
                      {msg.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="author-info">
                      <span className="author-name">{msg.name}</span>
                      <span className="card-time">{getRelativeTime(msg.created_at)}</span>
                    </div>
                  </div>
                  <div className="card-emoji">{msg.emoji}</div>
                </div>

                <div className="card-content">
                  {msg.content}
                </div>

                <div className="card-footer">
                  <button 
                    className={`btn-like ${likedIds.includes(msg.id) ? 'liked' : ''}`}
                    onClick={() => handleLike(msg.id)}
                  >
                    <Heart size={16} />
                    <span>{msg.likes} 個溫暖</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
