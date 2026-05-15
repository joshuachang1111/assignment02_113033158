# Assignment02 — Web Mario

**學號**：113033158  
**課程**：CS2410 軟體設計與實驗（Software Studio）  
**引擎**：Cocos Creator 2.4.8  
**語言**：TypeScript  
**部署**：Firebase Hosting

---

## 遊戲說明

Mario 風格的橫向捲軸遊戲，共兩關。

### 操作方式

| 按鍵 | 動作 |
|------|------|
| `←` / `→` | 左右移動 |
| `Space` / `↑` | 跳躍 |

### 遊戲規則

- 踩踏敵人頭部可消滅敵人並得分
- 側面碰觸敵人會受傷（大 Mario → 小 Mario，小 Mario → 死亡）
- 頂到問號磚可獲得道具（蘑菇讓 Mario 變大）
- 掉出邊界會扣除一條命
- 命數歸零即 Game Over

---

## 已完成功能

### 基本功能（Basic Rules）

- [x] World Map：物理重力、背景與 Camera 跟隨玩家（含 lookahead 偏移）
- [x] Level Design：Static 牆壁與地板（TiledMap Ground layer 自動生成碰撞體）
- [x] Level Design：問號磚（Objects layer Tiled Point → CC prefab 自動生成）
- [x] Player：鍵盤控制、受傷/死亡/重生、大小狀態切換
- [x] Enemies：Goomba — 走路動畫、碰牆轉向、踩頭擊殺/被側碰傷害玩家
- [ ] Enemies：Turtle
- [x] Question Blocks：超級蘑菇（頂到磚塊彈出蘑菇、觸碰蘑菇 Mario 變大）

### 動畫與音效

- [x] 玩家行走、跳躍、死亡動畫（PlayerAnim）
- [x] 玩家變大/縮小閃爍動畫
- [x] Goomba 行走動畫
- [x] BGM：MainMenu/LevelSelect → bgm1，Level 1 → bgm2，Level 2 → bgm3
- [x] 跳躍、死亡、踩敵人音效
- [x] 吃蘑菇（PowerUp）、縮小（PowerDown）、蘑菇出現、GameOver 音效

### UI

- [x] 主選單（MainMenu）：START GAME 按鈕，進入 LevelSelect
- [x] 關卡選擇（LevelSelect）：顯示當前命數、累積金幣、最高分數，STAGE 1 / STAGE 2 按鈕
- [x] HUD：命數、分數（前綴 SCORE:）、計時器（前綴 TIME:，倒數至 0 玩家死亡）
- [x] Game Over 畫面：每次死亡顯示，命歸零時出現 Return 按鈕回主選單
- [ ] 過關畫面（LevelClear）：腳本已寫，尚未接旗竿觸發

### Firebase 功能（Bonus）

- [ ] 會員機制：Email/Password 註冊與登入
- [ ] 儲存/讀取遊戲進度（最佳分數、關卡解鎖狀態）
- [ ] 全站排行榜（依分數排序，同分依完成時間排序）

---

## 關卡設計

| 關卡 | 說明 |
|------|------|
| Level 1 | — |
| Level 2 | — |

---

## 專案結構

```
assets/
├── scenes/         # MainMenu、LevelSelect、Game
├── scripts/        # 所有 TypeScript 腳本
│   ├── managers/   # GameManager、SceneManager、AudioManager、FirebaseManager
│   ├── player/     # Player、PlayerState、PlayerAnim
│   ├── enemies/    # EnemyBase、Goomba、Turtle
│   ├── items/      # QuestionBlock、Mushroom、Coin
│   ├── world/      # LevelLoader、CameraFollow、DeathZone
│   └── ui/         # HUD、各場景 UI
├── prefabs/        # 所有預製體
├── tilemaps/       # level1.tmx、level2.tmx
└── resources/      # 素材（sprites、audio、fonts）
```

---

## 使用素材來源

- 遊戲素材：課堂提供的 AS2_source（Mario sprite sheets、音效等）
