# 🌟 React + Supabase 高質感毛玻璃留言板教學手冊

本教學手冊完整記錄了「心聲留言板」的專案架構、資料庫建置、本地測試執行、Git 版本控制以及 Vercel 部署的全部步驟，方便您日後學習、修改或重建本專案。

---

## 📂 專案架構說明

本專案採用 **Vite + React + TypeScript** 進行開發，前端樣式完全使用 **Vanilla CSS** 客製化，捨棄第三方樣式庫以達到極致的流暢動畫與毛玻璃 (Glassmorphism) 效果。

```text
留言板/
├── .git/                 # Git 版本控制資料夾
├── 0617/                 # 依要求新增的特定資料夾 (含 .gitkeep)
├── public/               # 靜態資源 (圖示、SVG)
├── src/
│   ├── assets/           # React 標誌與靜態圖片
│   ├── App.tsx           # 核心邏輯、UI 元件與狀態管理
│   ├── index.css         # 核心設計系統、毛玻璃樣式與點擊/懸停動畫
│   ├── main.tsx          # 前端程式進入點
│   └── supabaseClient.ts # Supabase 初始化連線程式
├── .env.example          # 環境變數範本檔
├── .env.local            # 本地環境變數設定檔 (已忽略，不提交至 Git)
├── .gitignore            # Git 忽略清單
├── package.json          # 專案套件依賴與腳本設定
├── tsconfig.json         # TypeScript 設定檔
└── vercel.json           # Vercel 部署的路由設定檔
```

---

## 🛠️ 第一步：Supabase 資料庫設定

我們使用 **Supabase** 作為後端雲端資料庫。請按照以下步驟完成資料表與安全機制設定：

1. 登入 [Supabase 控制台](https://supabase.com) 並建立一個免費專案。
2. 在左側選單點選 **SQL Editor**，接著點擊 **New Query**。
3. 複製並貼上以下 SQL 程式碼，然後點擊 **Run** 執行：

```sql
-- 1. 建立 messages 留言資料表
create table messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  content text not null,
  emoji text not null,
  theme text default 'default' not null,
  likes integer default 0 not null
);

-- 2. 啟用資料列層級安全政策 (Row Level Security, RLS)
alter table messages enable row level security;

-- 3. 建立安全讀取政策 (允許所有人 Select)
create policy "Allow public read access" on messages for select using (true);

-- 4. 建立安全寫入政策 (允許所有人 Insert)
create policy "Allow public insert access" on messages for insert with check (true);

-- 5. 建立安全點讚的預存程序 (Store Procedure / RPC)
-- 這可確保當多個使用者同時點讚同一張卡片時，點讚數以 +1 的方式在資料庫端安全累加，防止前端寫入衝突。
create or replace function increment_likes(message_id uuid)
returns void as $$
begin
  update messages
  set likes = likes + 1
  where id = message_id;
end;
$$ language plpgsql security definer;
```

---

## 🔑 第二步：本地環境變數設定

為了在本地連接您的 Supabase 資料庫，專案根目錄下設有 `.env.local` 檔案（該檔案已被寫入 `.gitignore`，因此不會被推送到 GitHub 造成金鑰外洩）：

請確保該檔案內容為您的正確 API 金鑰：
```env
VITE_SUPABASE_URL=https://foujwbsycwhoziuhdrnu.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_3iJJnM2SaIyVal_HqqwzAA_AOLGxDto
```

*(註：以上金鑰已由 Antigravity 為您寫入完畢)*

---

## 💻 第三步：本地開發與測試執行

在您的電腦中執行本地測試的步驟如下：

1. 開啟終端機並切換到專案路徑 `d:\努豆先生\antigravity\留言板`。
2. 執行以下指令安裝依賴套件（若先前已安裝可跳過）：
   ```bash
   npm install
   ```
3. 啟動 Vite 本地開發伺服器：
   ```bash
   npm run dev
   ```
4. 終端機將輸出本地網址，例如：`http://localhost:5173/`。使用瀏覽器開啟此網址即可進行即時的留言、點讚、主題變換等功能測試。

---

## 🚀 第四步：Git 版本控制與 GitHub 推送

為了將專案備份至 GitHub 並設定 Vercel 自動部署，我們已經在本地初始化了 Git 儲存庫：

### 已執行的 Git 設定：
1. **設定本機認證 (本機無全域 Git 時適用)**：
   ```bash
   git config --local user.name "antigravity"
   git config --local user.email "antigravity@gemini.google.com"
   ```
2. **初始化與首次提交**：
   ```bash
   git init
   git add .
   git commit -m "feat: 建立高質感心聲留言板 (React + Supabase)"
   git branch -M main
   ```
3. **連結遠端與推播**：
   ```bash
   git remote add origin https://github.com/storynow02-tech/test0617.git
   git push -u origin main
   ```

*(註：未來若您在本地修改了程式碼，只需在終端機執行：`git add .` -> `git commit -m "您的說明"` -> `git push`，程式碼便會自動同步到 GitHub，Vercel 也會自動偵測並重新部署)*

---

## 🌐 第五步：Vercel 自動化部署

Vercel 提供了與 GitHub 無縫整合的 CI/CD 自動部署服務。

1. 登入 [Vercel 官網](https://vercel.com)。
2. 點選 **Add New -> Project**。
3. 在 GitHub 列表中找到並匯入您的專案 `storynow02-tech/test0617`。
4. **關鍵設定**：在部署設定頁面中，展開 **Environment Variables** (環境變數) 區塊，將 Supabase 的 API 連線資訊輸入進去：
   * 變數名稱：`VITE_SUPABASE_URL`，值：`https://foujwbsycwhoziuhdrnu.supabase.co`
   * 變數名稱：`VITE_SUPABASE_ANON_KEY`，值：`sb_publishable_3iJJnM2SaIyVal_HqqwzAA_AOLGxDto`
5. 點擊 **Deploy** 按鈕，大約 1 分鐘後即可獲得 Vercel 自動產生的網域，您的留言板即正式上線！

---

## 🎨 核心技術解說

1. **`supabaseClient.ts`**：
   透過官方套件 `@supabase/supabase-js` 提供的 `createClient` 建立連線執行個體，於 `App.tsx` 中直接進行資料操作。
2. **`App.tsx` 狀態管理**：
   - 使用 `useState` 追蹤留言清單、讀取狀態、表單輸入內容。
   - 使用 `useEffect` 在頁面首次載入時至 Supabase 讀取歷史留言，並根據 `created_at`（時間）由新到舊排序。
   - 點讚功能在觸發時會同步使用樂觀更新 (Optimistic Update) 提升前端流暢度，隨即呼叫資料庫的預存程序 `increment_likes`，防止數值寫入覆蓋。
   - 留言送出成功後，使用 `canvas-confetti` 觸發全螢幕彩帶特效。
3. **`index.css` 視覺系統**：
   - 採用 **CSS backdrop-filter** 實現精緻的磨砂毛玻璃背板。
   - 定義多套卡片配色主題類別（如 `.theme-emerald`, `.theme-rose` 等），滑鼠懸停時卡片邊框與背景會亮起相對應的霓虹漸層發光（box-shadow）。
   - 加入 `@keyframes` 動態漂浮背景發光球，以及留言卡片載入時的向上滑入漸變動畫。
