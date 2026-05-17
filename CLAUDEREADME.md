# CLAUDE 專案記憶檔 — Assignment02 Web Mario

> 這個檔案是給 Claude 在對話框很大時快速重建脈絡用的。
> 每次對話開始前請先讀這份文件。

---

## Claude 維護規則（每次對話必讀）

1. **每次重要改動後，必須更新本檔案（CLAUDEREADME.md）**，確保架構、狀態、決策保持最新。
2. **每次改動後，必須更新 README.md**，將已完成的功能打勾（`[x]`）、補充說明。
3. **每次改動後，必須在 AI_reference.md 新增一筆互動紀錄**，格式如下：

```
--- 互動 N ---
使用者 prompt：[簡短描述使用者的需求]
Claude 產出：
- [新增/修改的檔案路徑]
  （功能說明）
- [新增/修改的檔案路徑]
  （功能說明）

修改說明：
  [說明與原始 Claude 產出的差異、為何這樣修改、邏輯如何運作]
```

4. **每次開始實作新階段前，必須先與使用者討論確認，等使用者說 OK 再開始寫程式碼。**

---

## 專案基本資訊

- **課程**：CS2410 軟體設計與實驗（Software Studio）
- **作業**：Assignment 02 — Web Mario（Mario 風格遊戲）
- **學號**：113033158
- **繳交截止**：2026/05/28 23:59
- **繳交方式**：壓縮成 `Assignment02_113033158.zip`，上傳 FTP，MD5 checksum 填 eeclass，Firebase 部署網頁

---

## 技術選型（已確認）

| 項目 | 選擇 |
|------|------|
| 遊戲引擎 | Cocos Creator **2.4.8** |
| 語言 | **TypeScript** |
| 關卡設計工具 | **Tiled 編輯器**（匯出 .tmx，Cocos Creator 原生支援）|
| 後端 | **Firebase**（Firestore + Hosting + Authentication）|
| 登入方式 | Email / Password |

---

## 作業配分（總計最多 110%）

| 項目 | 分數 | 備註 |
|------|------|------|
| Complete Game Process | 5% | 主選單、選關、遊戲開始/結束流程 |
| World Map | 10% | 物理、背景、Camera 跟隨，至少 1 張地圖 |
| Level Design | 5% | Static 牆壁、問號磚 |
| Player | 15% | 鍵盤控制、傷害、掉落扣命、重生 |
| Enemies | 15% | 至少 1 種，只有踩頭才能殺 |
| Question Blocks | 5% | 至少超級蘑菇 |
| Animations | 10% | 玩家走/跳（5%）+ 敵人動畫（最多 5%）|
| Sound Effects | 10% | BGM（2%）+ 跳躍/死亡（3%）+ 額外（最多 5%）|
| UI | 10% | 命數（3%）+ 分數（5%）+ 計時器（2%）|
| Appearance（主觀） | 10% | — |
| Git | 5% | 定期 commit，不能只有最後一天 |
| **Bonus: Firebase** | **5%** | 部署 + 會員機制 + 存讀進度 |
| **Bonus: Leaderboard** | **5%** | 全站排行榜 |

**不做的 Bonus**：Multi-player game（不在計畫內）

---

## 關卡規劃

- **關卡數量**：2 關
- **格式**：Tiled .tmx 檔案，放在 `assets/tilemaps/`
- **Layer 設計**：
  - `Background`（裝飾，無碰撞）
  - `Ground`（有 PhysicsBoxCollider，static）
  - `Objects`（物件生成點：敵人、道具、旗桿）

---

## 目錄結構

```
assets/
├── scenes/
│   ├── MainMenu.fire
│   ├── LevelSelect.fire
│   └── Game.fire              # 單一遊戲場景，動態載入不同 tmx
│
├── scripts/
│   ├── managers/
│   │   ├── GameManager.ts     # 全域單例：lives, score, timer, currentLevel
│   │   ├── SceneManager.ts    # 場景切換 + 過場動畫
│   │   ├── AudioManager.ts    # BGM/SFX，確保 BGM 不被 SFX 中斷
│   │   └── FirebaseManager.ts # 登入/登出、Firestore 讀寫、排行榜
│   │
│   ├── player/
│   │   ├── Player.ts          # 輸入、物理、狀態機協調
│   │   ├── PlayerState.ts     # enum: SMALL / BIG / DEAD
│   │   └── PlayerAnim.ts      # 動畫控制（走/跳/死/變大縮小）
│   │
│   ├── enemies/
│   │   ├── EnemyBase.ts       # 共用：移動、碰牆轉向、被踩死邏輯
│   │   ├── Goomba.ts
│   │   └── Turtle.ts
│   │
│   ├── items/
│   │   ├── QuestionBlock.ts   # 被頂後 spawn 道具、變成空磚
│   │   ├── Mushroom.ts        # 移動、觸碰玩家變大
│   │   └── Coin.ts            # 觸碰加分
│   │
│   ├── world/
│   │   ├── LevelLoader.ts     # 讀 TiledMap Objects 層，動態生成敵人/道具
│   │   ├── CameraFollow.ts    # 跟隨玩家，限制不超出地圖邊界
│   │   └── DeathZone.ts       # 掉出邊界 → 扣命
│   │
│   └── ui/
│       ├── HUD.ts             # 命數、分數、計時器（倒數）
│       ├── MainMenuUI.ts      # 開始、Firebase 登入/登出
│       ├── LevelSelectUI.ts   # 顯示兩關，可顯示最佳分數
│       ├── GameOverUI.ts
│       ├── LevelClearUI.ts
│       └── LeaderboardUI.ts   # 全站排行榜彈窗
│
├── prefabs/
│   ├── Player.prefab
│   ├── Goomba.prefab
│   ├── Turtle.prefab
│   ├── Mushroom.prefab
│   ├── Coin.prefab
│   └── ScorePopup.prefab      # 踩敵人/得分時浮現的分數文字
│
├── tilemaps/
│   ├── level1.tmx
│   ├── level2.tmx
│   └── tileset.tsx
│
└── resources/                 # 從 AS2_source 匯入的素材
    ├── sprites/
    ├── audio/
    └── fonts/
```

---

## Firebase 資料結構

```
Firestore:

users/{uid}/
  ├── displayName: string
  ├── email: string
  ├── bestScore: number
  └── levelProgress: { level1: boolean, level2: boolean }

leaderboard/{uid}/
  ├── name: string
  ├── score: number          # 主排序：分數高優先
  ├── time: number           # 副排序：完成時間短優先（秒）
  └── updatedAt: timestamp
```

**排行榜排序規則**：分數高的排前面；同分則完成時間短的排前面。

---

## 場景流程

```
MainMenu
  └─→ LevelSelect（選關 1 或 2，顯示個人最佳分數）
        └─→ Game（動態載入 level1.tmx 或 level2.tmx）
              ├─→ GameOver（命數歸零）→ MainMenu
              └─→ LevelClear（過關）→ 上傳分數 Firebase → LevelSelect
```

---

## 玩家狀態機

```
SMALL ──[得蘑菇]──→ BIG
SMALL ──[被攻擊/掉落]──→ DEAD
BIG   ──[被攻擊]──→ SMALL
BIG   ──[掉落]──→ DEAD
DEAD  ──[重生]──→ SMALL（回初始位置）
DEAD + lives == 0 ──→ GameOver
```

---

## 碰撞分層

| Layer | 說明 |
|-------|------|
| `player` | 玩家 |
| `enemy` | 所有敵人 |
| `ground` | 地板、牆壁（static）|
| `item` | 蘑菇、金幣 |
| `block` | 問號磚（semi-static）|

碰撞矩陣：
- player ↔ ground ✓
- player ↔ enemy ✓（側碰傷人，玩家從上方踩 → 殺敵）
- player ↔ item ✓
- player ↔ block ✓（從下方頂 → 觸發）
- enemy ↔ ground ✓（走路 + 碰牆轉向）
- enemy ↔ enemy ✗（穿透，簡化實作）

---

## 實作順序（每階段開始前必須與 Claude 討論確認）

| 階段 | 內容 | 狀態 |
|------|------|------|
| 1 | 專案建立 + 素材匯入 + Tiled 安裝與設定 | ✅ 完成 |
| 2 | TiledMap Level 1 設計 + 物理碰撞設定 + Camera | ✅ 完成 |
| 3 | Player 控制 + 狀態機 + Camera 跟隨 | ✅ 完成 |
| 4 | Goomba 敵人 + 頭踩判定 | ✅ 完成 |
| 5 | QuestionBlock + Mushroom 道具系統 | ✅ 完成 |
| 6 | 傷害/死亡/重生 + GameManager 全域狀態 | ✅ 完成 |
| 7 | UI（HUD + 所有選單場景）| ✅ 完成 |
| 8 | 動畫（Sprite Animation）+ 音效 | ✅ 完成（音效；動畫已在 Stage 3~5 完成）|
| 9 | Level 2 關卡設計 + Turtle 敵人 | 🔄 進行中（Turtle 完成、bug 修正完成、Level 2 地圖待設計）|
| 10 | Firebase 整合（登入、存檔、排行榜）| |
| 11 | Firebase Hosting 部署 | |
| 12 | 測試、Bug 修正、Appearance 調整 | |

---

## 已修正的 Bug（Stage 9 後期）

- **Player.ts die() crash**：`this.groundContacts = 0` 為未宣告變數，已刪除
- **Player.ts 排程殘留**：onDestroy 補上 `this.unscheduleAllCallbacks()`
- **GameManager callbacks 殘留**：startNewGame() 補上 `onLoseLife = null; onLevelClear = null;`
- **QuestionBlock vy 閾值**：從 `< 100` 改為 `< 0`，允許慢速跳躍觸發
- **EnemyBase isDead 存取**：新增 `get dead()` getter，Turtle 改用 `enemy.dead`
- **Mushroom 音效**：BIG 狀態吃蘑菇改播 sfxCoin，不再觸發 growBig
- **Turtle/Goomba 踩頭誤判**：`isStomp` 從純位置改為 `pPos.y > stompLine && playerVy <= 100`
  （向上跳撞側面 vy > 100 → 判傷害；落地/下墜 vy ≤ 100 → 判踩頭）

---

## 已知問題 / 注意事項

- **TMX 版本**：每次用 Tiled 重新儲存 level1.tmx，會自動被蓋回 `version="1.10"`。pre-commit hook 會自動修正。手動修正請執行根目錄的 `fix-tmx.sh`：
  ```bash
  ./fix-tmx.sh
  ```
  執行後在 CC 對 level1 右鍵 → Reimport Asset。
- **Sprite Frame 0**：`mario_small_0` 是 Mario 進水管的背面 frame，不能用於 idle/walk。
- **CameraFollow.playerNode**：每次重建 Player prefab 後，Main Camera 的 playerNode 需重新拖入。
- **AudioManager 節點必須是 Scene 的直接子節點**（跟 Canvas 同層），不能是 Canvas 子節點，否則 `addPersistRootNode` 無效，跨場景後節點消失。
- **⚠️ 字型尚未套用**：目前所有場景（MainMenu、LevelSelect、Game 的 HUD/GameOverPanel）的 Label 節點**全部都沒有套用 yellow_font / white_font**，目前用系統字型代替。Button 裡的 Label 尤其麻煩——bitmap font 在 CC2.4.8 的 Button 子 Label 上會遇到 Size W 無法修改、文字只顯示一個字元等問題。之後需要統一處理字型套用。
- **bitmap font 在 CC2.4.8 的已知限制**：Label 節點的 Size W 會被 bitmap font 鎖死，導致文字被截斷。解法是設 Overflow=NONE 並把 W 設足夠大，或改用系統字型加顏色代替。
- **Turtle Prefab 的 Atlas 欄位**：必須在 Inspector 的 Turtle 腳本元件中指定 SpriteAtlas（Turtle.plist），否則執行時沒有 sprite 圖片。
- **Tiled 物件生成**：Tiled Objects layer 的物件必須用 **Name 欄位**（不是 Type）設定名稱（goomba、turtle、flagpole、question_block）。第一個 flagpole 若用 `addComponent` 方式動態掛載腳本，會拋出例外導致整個 loop 中斷——現已改用 Prefab 方式。
- **EnemyBase 邊緣偵測**：使用 `cc.director.getPhysicsManager().rayCast()` 往前方地面投射射線，僅觸碰 Static RigidBody 才算地面，可有效避免把其他敵人誤判為地板。Turtle 進入 shell 狀態時會停用邊緣偵測（shell 可以滾出邊緣）。
- **EnemyBase Sprite Flip**：sprite 預設面向**左**，往右走時才 flip（scaleX 為負）。公式：`scaleX = absScale * (direction < 0 ? 1 : -1)`。

---

## 重要提醒

- **每次開始實作前，必須先與 Claude 討論確認再開始寫程式**
- 作業需附上 `README.md`（功能說明）
- 有使用 AI 輔助需附上 `AI_reference.pdf`（記錄 prompt、修改說明）
- 不能上傳 `node_modules`（-5 分）
- 需要 MD5 checksum 填入 eeclass
- Git 要定期 commit，不能只有最後一天

---

## 素材清單（AS2_source）

| 資料夾 | 內容 |
|--------|------|
| `player/` | mario_big.plist/.png、mario_small.plist/.png |
| `enemies/` | Goomba.plist/.png、Turtle.plist/.png、Flower.plist/.png |
| `effects_UI_tiles/` | effects、items、score、tiles sprite sheets |
| `audio/` | BGM x3、跳躍、踩踏、金幣、死亡等音效 |
| `pictures/` | 選單背景、按鈕、UI 元件、flag 等 |
| `fonts/` | 字型 |
