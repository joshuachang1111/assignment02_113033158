# AI Reference — Assignment02 Web Mario

**AI Tool Used**：Claude Sonnet 4.6（Anthropic）  
**使用平台**：Claude Code（CLI）

---

> 本文件記錄所有 AI 輔助開發的互動紀錄。
> 每筆記錄包含：使用者 prompt、Claude 產出內容、實際修改版本與說明。

---

## 互動紀錄

--- 互動 2 ---
使用者 prompt：階段 1 — 專案建立、Tiled 安裝、素材匯入、level1.tmx 製作
               （Canvas 1280x720、Box2D、TiledMap 三層結構、Objects 標記點）
Claude 產出：
- 確認 tile 大小 16x16，設計縮放策略（Map scale 3 → 48px/tile）
- 建立 Tiled 地圖設定（200x15 tiles、Background/Ground/Objects 三層）
- 修正 mario_tiles.tsx 路徑與 TMX version 1.10→1.2 相容性問題
- 建立 Cocos Creator 2.4.8 專案資料夾結構
- 匯入 AS2_source 素材到正確位置
- 新增 .gitignore（排除 library/local/temp/build）
- 初始化 Git repo 並 push 到 GitHub

修改說明：
  Tiled 1.12.1 預設儲存 TMX version 1.10，CC2.4.8 只支援到 1.2。
  需手動編輯 tmx/tsx 標頭，並將 tileset.png 複製到 resources/tilemaps/ 同層。
  這是使用新版 Tiled 搭配舊版 CC 必須處理的已知相容性問題。

--- 互動 3 ---
使用者 prompt：階段 2 — TiledMap 載入、Ground layer 自動生成碰撞體、Camera 跟隨
Claude 產出：
- 新增 assets/scripts/world/LevelLoader.ts
  （啟動 Box2D 物理引擎，掃描 Ground layer 並將連續 tile 合併為 Static 碰撞體）
- 新增 assets/scripts/world/CameraFollow.ts
  （水平跟隨玩家，Y 軸固定，左邊界鎖死）
- 驗證：TestBox 受重力落下並正確停在 Ground tile 上

修改說明：
  LevelLoader 使用 getTileGIDAt 掃描 tile 並以 row-merge 策略減少碰撞體數量。
  座標轉換：Tiled row 0=頂部，CC Y 朝上，localY = (numRows-1-row)*tileH + tileH/2。
  CameraFollow 在 start() 根據 mapNode.x 動態計算左右邊界，不寫死數值。

--- 互動 4 ---
使用者 prompt：階段 3 — Player 控制、狀態機、動畫切換
               （確認方案：contact-count 地面偵測、直接設 linearVelocity、
                 跳躍速度 700、重力 -960、6 動畫狀態、Player node scale 3）
Claude 產出：
- 新增 assets/scripts/player/PlayerState.ts
  （PlayerState enum: SMALL / BIG / DEAD）
- 新增 assets/scripts/player/Player.ts
  （鍵盤輸入 ←/→/Space/↑/WASD、直接設 rb.linearVelocity 水平速度、
   jumpJustPressed 單次跳躍防重複、contact-count isGrounded（含 vy<50 天花板過濾）、
   takeDamage/die/respawn/growBig 公開 API、無敵閃爍效果、
   die 時 sensor=true 使角色穿過地板做死亡飛弧動畫）
- 新增 assets/scripts/player/PlayerAnim.ts
  （掛在 Visual 子節點，透過 node.parent 取得 Player/RigidBody；
   smallAtlas / bigAtlas 兩個 SpriteAtlas 屬性；
   Timer-based frame stepping 10fps；
   node.scaleX=±1 水平翻轉（不影響父節點物理碰撞體））

修改說明：
  Visual 子節點架構：Player root 掛 RigidBody+PhysicsBoxCollider+Player.ts，
  子節點 Visual 掛 cc.Sprite+PlayerAnim.ts，翻轉只改子節點 scaleX，
  保持父節點 scaleX 為正值，Box2D 不受影響。
  Collider size: SMALL=(14,16) offset=(0,8)、BIG=(14,26) offset=(0,13)，
  以 anchor(0.5,0) 使碰撞體底部對齊節點位置（地板面）。
  Frame 分組（初版，可依實際 sprite 調整）：
    idle=[0], walk=[1,2,3], air=[5], dead=[6]。

--- 互動 1 ---
使用者 prompt：閱讀作業簡報，確認規格與技術限制，規劃專案架構
               （Cocos Creator 版本、配分、目錄結構、實作順序）
Claude 產出：
- 分析 2026(Spring)_SS-Assignment_02_Web Mario.pptx 完整內容
- 確認無 Cocos Creator 版本限制，決定使用 2.4.8
- 規劃完整目錄結構（managers / player / enemies / items / world / ui）
- 規劃 Firebase Firestore 資料結構（users、leaderboard collection）
- 規劃玩家狀態機（SMALL / BIG / DEAD）
- 規劃碰撞分層（player / enemy / ground / item / block）
- 建立 CLAUDEREADME.md（專案記憶檔）
- 建立 README.md（作業繳交用說明文件）
- 建立 AI_reference.md（本文件）

修改說明：
  以上為純規劃討論與文件建立，尚未撰寫任何遊戲程式碼。
  所有架構決策已記錄於 CLAUDEREADME.md 供後續對話參考。

---
