# Assignment02 — Web Mario

**學號**：113033158  
**課程**：CS2410 軟體設計與實驗（Software Studio）  
**引擎**：Cocos Creator 2.4.8  
**語言**：TypeScript  
**部署**：Firebase Hosting  
**遊戲網址**：https://web-mario-113033158.web.app

---

## 如何開始遊戲

### 1. 開啟遊戲
前往 **https://web-mario-113033158.web.app**，即可在瀏覽器中遊玩。

### 2. 註冊 / 登入帳號

進入主畫面後有兩個按鈕：

| 按鈕 | 說明 |
|------|------|
| **LOG IN** | 已有帳號，輸入 Email 與密碼登入 |
| **SIGN UP** | 新用戶，輸入暱稱、Email 與密碼完成註冊 |

登入成功後會自動跳轉到**關卡選擇畫面**，顯示你的帳號名稱與累積總分。


### 3. 選擇關卡
- 點擊 **STAGE 1** 或 **STAGE 2** 開始遊戲
- 畫面會先顯示 **GAME START** 過場動畫，接著進入遊戲

---

## 操作方式

| 按鍵 | 動作 |
|------|------|
| `←` / `A` | 向左移動 |
| `→` / `D` | 向右移動 |
| `Space` / `↑` / `W` | 跳躍 |

---

## 遊戲規則

- **踩踏敵人頭部**：消滅敵人並得分（Goomba +100 分）
- **側面碰觸敵人**：受傷（大 Mario → 小 Mario；小 Mario → 死亡）
- **頂問號磚**：彈出蘑菇，吃到蘑菇後 Mario 變大
- **抵達終點旗桿**：過關，剩餘時間換算為獎勵分數，分數上傳至排行榜
- **掉出地圖邊界**：扣一條命
- **時間歸零**：Mario 死亡
- **命數歸零**：Game Over，本局分數不計入排行榜

---

## 如何查看排行榜

1. 登入帳號後進入**關卡選擇畫面**
2. 點擊下方 **BOARD** 按鈕
3. 排行榜顯示前 10 名玩家的累積總分（所有過關分數加總）
4. 點擊右上角 **×** 關閉排行榜

---

## 已完成功能

### 基本功能

- [Ｏ] World Map：物理重力、背景與 Camera 跟隨玩家
- [Ｏ] Level Design：Static 牆壁與地板（TiledMap Ground layer 自動生成碰撞體）
- [Ｏ] Level Design：問號磚（頂到磚塊彈出蘑菇、變成空磚）
- [Ｏ] Player：鍵盤控制、受傷／死亡／重生、大小狀態切換（SMALL / BIG）
- [Ｏ] Enemies：Goomba — 走路動畫、碰牆轉向、踩頭擊殺
- [Ｏ] Enemies：Turtle — 走路動畫、Shell 機制（踩踏→殼靜止→踢→殼滑行→自動復活）
- [Ｏ] Question Blocks：超級蘑菇道具系統

### 動畫與音效

- [Ｏ] 玩家行走、跳躍、死亡動畫
- [Ｏ] 玩家變大 / 縮小閃爍動畫
- [Ｏ] Goomba 行走動畫、Turtle 行走 / 殼動畫
- [Ｏ] BGM：主選單 bgm1、Level 1 bgm2、Level 2 bgm3
- [Ｏ] 跳躍、踩敵人、吃蘑菇、縮小、死亡、過關、Game Over 等音效

### UI

- [Ｏ] 主選單（MainMenu）：LOGIN / SIGNUP 按鈕、訪客模式
- [Ｏ] 過場動畫：GAME START（每次開始）、GAME OVER / YOU DIED（死亡）
- [Ｏ] 關卡選擇（LevelSelect）：顯示帳號、累積總分、LEADERBOARD 按鈕、LOGOUT 按鈕
- [Ｏ] HUD：命數、本局分數（SCORE）、倒數計時器（TIME）
- [Ｏ] 過關畫面（LevelClear）：旗桿觸碰觸發，時間獎分，分數上傳 Firebase
- [Ｏ] Game Over 畫面：命歸零顯示 RETURN 按鈕回 LevelSelect

### Firebase 功能（Bonus）

- [Ｏ] Firebase Hosting 部署（https://web-mario-113033158.web.app）
- [Ｏ] 會員機制：Email / Password 註冊與登入（Firebase Authentication）
- [Ｏ] 分數儲存：每次過關以 `FieldValue.increment` 原子累加至 Firestore
- [Ｏ] 全站排行榜：前 10 名，依累積總分降序排列（LeaderboardUI）

---

## 關卡設計

| 關卡 | 說明 |
|------|------|
| Level 1 | 入門關卡，平坦地形為主，有 Goomba 敵人與問號磚 |
| Level 2 | 進階關卡，多層平台與高低差，有 Goomba、Turtle 敵人 |

---

## 專案結構

```
MarioGame/assets/
├── scenes/         # MainMenu、LevelSelect、Game、GameStart、GameOver
├── scripts/
│   ├── managers/   # GameManager、AudioManager、FirebaseManager
│   ├── player/     # Player、PlayerState、PlayerAnim
│   ├── enemies/    # EnemyBase、Goomba、Turtle
│   ├── items/      # QuestionBlock、Mushroom、Coin
│   ├── world/      # LevelLoader、CameraFollow、DeathZone
│   └── ui/         # HUD、MainMenuUI、LevelSelectUI、GameOverUI、
│                   # GameOverSceneUI、GameStartUI、LevelClearUI、LeaderboardUI
├── prefabs/        # Player、Goomba、Turtle、Mushroom、Coin、QuestionBlock
├── resources/      # tilemaps（level1.tmＯ、level2.tmx）
└── textures/       # 素材（sprites、audio、fonts、ui）
```

---

## 使用素材來源

- 遊戲素材：課堂提供的 AS2_source（Mario sprite sheets、音效、字型、UI 圖片）
