import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase-project') || supabaseAnonKey.includes('your-anon-key')) {
  console.warn(
    '【提醒】尚未設定完整的 Supabase 連線資訊。請在專案根目錄的 `.env.local` 中填寫正確的 VITE_SUPABASE_URL 與 VITE_SUPABASE_ANON_KEY！'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
