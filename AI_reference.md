# AI Reference — Assignment02 Web Mario

**AI Tool Used**：Claude Sonnet 4.6（Anthropic）  
**使用平台**：Claude Code（CLI）

---

> 本文件記錄所有 AI 輔助開發的互動紀錄。
> 每筆記錄包含：使用者 prompt、Claude 產出內容、實際修改版本與說明。

---

## 互動紀錄

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


--- 互動 5 ---
使用者 prompt：階段 3 除錯與鏡頭調整
               （修正移動/跳躍/sprite 方向問題、補左邊界、鏡頭偏移）
Claude 產出：
- 修改 assets/scripts/player/Player.ts
  （① cc.sys.isKeyPressed→cc.systemEvent 事件式按鍵追蹤；
   ② contact-count 地面偵測改為 velocity+lockout（lockout 0.75s 防雙跳）；
   ③ zIndex=100 + scheduleOnce removeChild/addChild 確保 Player 在 Map 之上；
   ④ 新增 mapLeftBoundary 屬性 + enforceLeftBoundary()，阻止 Mario 走出地圖左緣）
- 修改 assets/scripts/world/CameraFollow.ts
  （新增 lookaheadX 屬性（預設 150），讓鏡頭向右偏移，Mario 顯示在畫面偏左）
- 修改 assets/scripts/player/PlayerAnim.ts
  （① getSpriteFrame 加 .png 後綴 fallback；
   ② idle/walk/air frame 改用正面 frame：mario_small_11/15/18，
     捨棄 frame 0（背面進水管 frame））
- 修正 resources/tilemaps/level1.tmx + mario_tiles.tsx
  （TMX version 再次從 1.10 回退，重新 sed 修回 1.2）

修改說明：
  cc.sys.isKeyPressed 在 CC2.4.8 不存在，須改用 cc.systemEvent KEY_DOWN/UP 事件。
  contact-count 因 CC2.4.8 的 Box2D 回呼不穩定而改為 velocity-based：
    isGrounded = abs(vy) < 15 && jumpLockout <= 0。
  mario_small_0 是 NES Mario 進水管的背面 frame，不可用於 idle；
    改用 sprite sheet row 0 col 1 的 mario_small_11 作為正面 idle 起始 frame。
  TMX 每次用 Tiled 重新儲存就會被蓋回 1.10，需在每次 commit 前確認版本。

修改說明：
  以上為純規劃討論與文件建立，尚未撰寫任何遊戲程式碼。
  所有架構決策已記錄於 CLAUDEREADME.md 供後續對話參考。

--- 互動 6 ---
使用者 prompt：階段 4 — Goomba 敵人實作，修正碰牆不轉向與玩家互動無效問題
Claude 產出：
- 修改 assets/scripts/enemies/EnemyBase.ts
  （① 新增 mapLeftBoundary 屬性作左邊界反轉保護；
   ② 新增 velocity-stuck 偵測：若 |vx| < 5 則反轉 direction，替代不穩定的 contact callback；
   ③ onBeginContact 以 worldManifold.normal.x > 0.7 偵測牆壁，保留作輔助）
- 修改 assets/scripts/enemies/Goomba.ts
  （① 在 start() 以 cc.find('Canvas/World/Player') + fallback scene search 快取 Player 參照；
   ② 移除 onBeginContact 玩家偵測，改為 update() 每幀 AABB overlap 檢查；
   ③ 加入 hitCooldown 防止在無敵期間重複傷害；
   ④ 踩頭判定：playerVy < -50 && playerBottom > goombaCenter.y；
   ⑤ 走路動畫保留：Goomba_0/Goomba_1 @ 0.2s，死亡顯示 Goomba_2 後 0.4s destroy）

修改說明：
  CC2.4.8 的 Box2D contact callback 在 Dynamic-Dynamic 碰撞時不穩定，
  導致 Goomba 與 Player 的 onBeginContact 常常不觸發。
  解法：完全放棄在 contact callback 裡做玩家互動，改為在 update() 每幀
  手動計算兩個碰撞體的 AABB 是否重疊（以世界座標計算半寬/半高之和比較）。
  Goomba AABB：寬 54（18px×scale3）、高 66（22px×scale3），anchor(0.5,0)。
  Player AABB：寬 42（14px×scale3）、高 48（16px×scale3），anchor(0.5,0)。
  overlapX threshold=48，overlapY threshold=57。

--- 互動 7 ---
使用者 prompt：修正 Goomba 無左邊界 + 側碰有時不觸發的問題
Claude 產出：
- 修改 assets/scripts/world/LevelLoader.ts
  （新增 spawnBoundaryWalls()：地圖左右各生成一個 Static RigidBody + PhysicsBoxCollider 牆，
   寬 1 tile、高地圖高度 ×2，物理直接擋住 Mario 與 Goomba）
- 修改 assets/scripts/enemies/Goomba.ts
  （AABB 判斷加 8px 緩衝：`dx > OVERLAP_X + 8` 取代原本 `dx >= OVERLAP_X`，
   避免 Box2D 把兩個 Dynamic 碰撞體解算到恰好接觸時被 >= 條件略過）
- 修改 assets/scripts/enemies/EnemyBase.ts
  （reverseCooldown 初始值從 0 改為 0.15，跳過第 1 幀 vx=0 觸發 stuck-detection
   的問題，修正 Goomba 一開始就往右走的 bug）
- 修改 assets/scripts/enemies/Goomba.ts
  （踩頭判定 threshold 從 myCenter.y 改為 myPos.y+50（75% 高），
   防止玩家在跳躍側面中段被誤判成踩頭後什麼都不觸發）
- 修正 resources/tilemaps/level1.tmx（版本再次從 1.10 修回 1.2）

修改說明：
  左右物理牆加在 LevelLoader，為 Map 節點的子節點（Map scale=3，
  所以碰撞體 local size 16×(23+8)*16=496 → world 48×1488）。
  AABB +8px 緩衝解決 Box2D 解算後恰好 dx==threshold 被略過的問題。
  reverseCooldown=0.15 初始值解決第 1 幀 vx=0 觸發方向翻轉的問題。
  TMX version 每次用 Tiled 1.12.1 儲存就會被蓋成 1.10，已有 pre-commit hook 自動修正。

--- 互動 8 ---
使用者 prompt：修正 Mario 貼著懸浮方塊側面會卡住的問題
Claude 產出：
- 修改 assets/scripts/player/Player.ts
  （在 applyColliderSize() 加入 this.col.friction = 0，
   每次設定碰撞體大小時同時清除摩擦力）

修改說明：
  Box2D 計算兩碰撞體之間的摩擦力公式為 sqrt(f1 × f2)。
  Mario 的 PhysicsBoxCollider 預設 friction = 0.2，貼著方塊側面時
  Box2D 會施加向上的摩擦力抵消重力，造成卡牆。
  將 Mario 摩擦力設為 0 後合力摩擦 = 0，貼牆只受重力，自然下滑。
  地面移動不受影響（移動靠直接設 linearVelocity，不依賴摩擦力）。

--- 互動 9 ---
使用者 prompt：Stage 5 — QuestionBlock + Mushroom 實作（問號磚塊彈出蘑菇）
Claude 產出：
- 新增 assets/scripts/items/QuestionBlock.ts
  （4 幀動畫：items_10~13；checkHit() 偵測玩家從下方頂到方塊；
   Bump 動畫：sine wave 12 world units / 0.15s；
   onHit：切換 items_14 空方塊 + spawnMushroom()；
   spawnMushroom：instantiate → parent=World → 位置為方塊頂端 +48 world px）
- 新增 assets/scripts/items/Mushroom.ts
  （emergeTimer=0.4s 浮出動畫；走路速度 60；
   相同 velocity-stuck 反轉機制（reverseCooldown=0.15 初始值）；
   AABB overlap 偵測玩家 → player.growBig() + node.destroy()；
   col.friction=0 防側面卡牆；貼圖：items_46.png）
- 修改 assets/scripts/world/LevelLoader.ts
  （新增 @property questionBlockPrefab；
   新增 spawnObjects()：讀 Objects layer，對 name='question_block' 的 Point
   instantiate prefab 並放到 World 節點；
   新增 tiledToWorld()：轉換 Tiled 物件座標到世界座標）
- 新增 fix-tmx.sh（一鍵修正 TMX version 1.10→1.2 腳本）

修改說明：
  CC 2.4.8 讀取 Objects layer 時 obj['y'] 已做過 Y 翻轉
  （CC local Y-up，= mapHeight_px - tiled_y），
  tiledToWorld 原本把 obj['y'] 當作 Tiled Y-down 再翻一次，導致雙重翻轉，
  方塊出現在畫面頂端。
  修正：先 recover tiledY = numRows*tileH - oy，再執行標準 row 計算。
  蘑菇 sprite 原本設定 items_32（錯誤），
  確認 items.plist 實際 grid 後修正為 items_46（col 3, row 11）。

--- 互動 10 ---
使用者 prompt：變大/縮小時加入逐幀閃爍動畫，動畫期間凍結移動
Claude 產出：
- 修改 assets/scripts/player/Player.ts
  （新增 isTransforming / displayBig 公開旗標；
   growBig() 與 takeDamage() 改為呼叫 startTransformAnim()，狀態與碰撞體在動畫結束後才改；
   startTransformAnim()：this.schedule(flash, 0.07) × 8 格交替 displayBig，結束後 unschedule；
   handleMovement() 加 if (isTransforming) return 凍結輸入）
- 修改 assets/scripts/player/PlayerAnim.ts
  （atlas 選擇改用 showBig = isTransforming ? displayBig : playerState===BIG；
   resolveAnim() 加 if (isTransforming) return IDLE；
   getFrameNames() 同步改用 showBig）
- 修改 assets/scripts/items/QuestionBlock.ts
  （gap 上限從 80 改為 100，確保 BIG Mario 頂磚塊也能可靠觸發）
- 修改 assets/scripts/items/Mushroom.ts
  （checkPlayerOverlap 改為根據 playerState 動態計算 playerHalfH 與 overlapY；
   BIG Mario: playerHalfH=39, overlapY=71，修正頭頂碰不到蘑菇的問題）

修改說明：
  scheduleOnce 對同一函式引用重複呼叫時 CC2.4.8 可能只執行一次（內部去重），
  導致 isTransforming 永遠不被設回 false。改用 schedule + unschedule 解決。
  BIG Mario 碰撞體高度 78（= 26*scale3），原本 OVERLAP_Y=56 寫死 SMALL 半高 24，
  導致蘑菇在 BIG Mario 頭頂時 dy=63>56 被判為不重疊。
  改為動態計算（BIG: 24+39+8=71）修正。

---

--- 互動 11 ---
使用者 prompt：Stage 6+7 合併：GameManager、HUD、所有 UI 場景設定
Claude 產出：
- 新增 assets/scripts/managers/GameManager.ts
  （靜態類別管理 lives/score/timer/currentLevel/highScore/coins；
   addScore() 同步更新 highScore；addCoins()；loseLife() 觸發 onLoseLife callback）
- 新增 assets/scripts/ui/HUD.ts
  （每幀更新 SCORE:/TIME: 前綴 + 數值；計時歸零呼叫 player.die()）
- 新增 assets/scripts/ui/GameOverUI.ts
  （onLoad 時設 active=false 並綁 GameManager.onLoseLife；
   每次死亡顯示面板；lives<=0 才顯示 ReturnButton；lives>0 等 2.5s 重載關卡）
- 新增 assets/scripts/ui/MainMenuUI.ts
  （onStartClicked: startNewGame + loadScene LevelSelect）
- 新增 assets/scripts/ui/LevelSelectUI.ts
  （start 時從 GameManager 讀 lives/highScore/coins 更新 Label；
   onLevel1/2Clicked: 設 currentLevel + loadScene Game；不重置遊戲狀態）
- 新增 assets/scripts/ui/LevelClearUI.ts
  （show: 加時間分數 × 30，4s 後跳 LevelSelect）
- 修改 assets/scripts/enemies/Goomba.ts
  （onStomped 加 GameManager.addScore(100)）
- 修改 MainMenu.fire、LevelSelect.fire、Game.fire
  （場景節點設定：HUDPanel、Stage1/2Button、GameOverPanel 等）

修改說明：
  GameOverPanel 必須在 Editor 中保持 active=true，讓 onLoad 執行後腳本自行設 false。
  若在 Editor 直接設 active=false，onLoad 不觸發，callback 無法註冊。
  HUD 與 GameOverPanel 須為 Main Camera 子節點，否則跟隨 Camera 移動而滾動。
  bitmap font（yellow_font）在 CC2.4.8 Button 子 Label 上的 Size W 會被鎖死，
  目前所有 Label 改用系統字型 + 顏色代替，字型套用留待後續處理。

---

--- 互動 12 ---
使用者 prompt：Stage 8 音效系統
Claude 產出：
- 新增 assets/scripts/managers/AudioManager.ts
  （cc.Component 靜態單例，onLoad 呼叫 addPersistRootNode 跨場景存活；
   playBGM 跳過相同 clip 重複播放；stopBGM；playSFX one-shot；
   11 個 @property AudioClip 欄位：bgm1~3、sfxJump/Stomp/Die/GameOver/PowerUp/PowerDown/PowerUpAppear/LevelClear）
- 修改 MainMenuUI.ts：start() 播 bgm1
- 修改 LevelSelectUI.ts：start() 播 bgm1（相同 clip 不重啟）
- 修改 HUD.ts：start() 依 currentLevel 播 bgm2 或 bgm3
- 修改 Player.ts：跳躍播 sfxJump、die() stopBGM + sfxDie、縮小播 sfxPowerDown
- 修改 Goomba.ts：onStomped 播 sfxStomp
- 修改 Mushroom.ts：收集時播 sfxPowerUp
- 修改 QuestionBlock.ts：onHit 播 sfxPowerUpAppear
- 修改 GameOverUI.ts：lives<=0 時播 sfxGameOver

修改說明：
  AudioManager 節點必須是 Scene 的直接子節點（與 Canvas 同層），
  不能是 Canvas 子節點，否則 addPersistRootNode 無效。
  所有 AudioClip 欄位需在 MainMenu.fire 的 AudioManager 組件 Inspector 中手動拖入，
  跨場景後 instance 仍有效，bgm2/3 和所有 SFX 才能正常播放。

---

--- 互動 13 ---
使用者 prompt：掉落洞裡的死亡判定
Claude 產出：
- 修改 EnemyBase.ts：update 開頭檢查 worldY < -500，直接 destroy（不加分）
- 修改 Mushroom.ts：同上
- 修改 Player.ts：update 結尾檢查 worldY < -500，呼叫 die()
修改說明：用 Y 軸世界座標閾值偵測掉落，不需要額外 collider 或 Editor 設定。

---

--- 互動 14 ---
使用者 prompt：Stage 9 — Turtle 敵人、旗竿、多關卡 LevelLoader、物件生成位置修正、邊緣偵測、Sprite Flip
Claude 產出：
- `scripts/enemies/Turtle.ts`（新增）
  完整 Shell 機制（WALKING / SHELL_IDLE / SHELL_SLIDING 三狀態）、
  走路動畫、玩家重疊檢測（stomp/kick/damage）、5 秒後自動復活、
  shell 滑行時撞牆反彈並消滅其他敵人
- `scripts/world/Flagpole.ts`（新增）
  每幀 proximity 檢測，觸碰時呼叫 GameManager.onLevelClear
- `scripts/ui/LevelClearUI.ts`（新增）
  顯示過關畫面、停 BGM、播過關音效、計算時間獎分、4 秒後回 LevelSelect
- `scripts/world/LevelLoader.ts`（修改）
  新增 goombaPrefab / turtlePrefab / flagpolePrefab 欄位；
  spawnObjects 改用 switch 統一處理各物件類型；
  flagpole 改用 Prefab 方式（原 addComponent 會拋例外中斷 loop）；
  tiledToWorld 簡化為直接使用 CC 已轉換的 Y-up 座標（移除多餘 floor 導致的偏移）；
  整個 loop 加 try-catch 防止單一物件失敗中斷後續生成；
  加 cc.log 方便除錯確認每個物件的座標
- `scripts/enemies/EnemyBase.ts`（修改）
  新增平台邊緣偵測（rayCast 往前下方投射，偵測 Static 地面消失時反向）；
  新增 Sprite Flip（每幀根據 direction 更新 scaleX，預設面向左）；
  新增 edgeDetectionEnabled 旗標供 Turtle shell 狀態停用邊緣偵測；
  新增 edgeSensorOffset 屬性（可在 Inspector 調整）

修改說明：
  - flagpole 原本用 node.addComponent(Flagpole) 但沒有 import Flagpole，
    執行時拋出 ReferenceError，導致 for loop 在第一個 flagpole 後中斷，
    後續所有物件（第 2 個 goomba、第 2 個 turtle 等）全部未生成。
    改用 flagpolePrefab 後 loop 正常完成。
  - tiledToWorld 舊版將 CC Y-up 轉回 Tiled Y-down 再 floor 取 row，
    產生最多一個 tile 高的往下偏移，新版直接使用 obj['y']（CC 已轉換）。
  - Sprite Flip 公式：absScale * (direction < 0 ? 1 : -1)
    因為 Turtle/Goomba sprite 預設面向左，往右走才需要 flip（scaleX 為負）。

--- 互動 15 ---
使用者 prompt：修正 Turtle 踩頭偵測、龜殼打敵人、蘑菇碰撞、終點死亡效果
Claude 產出：
- `scripts/enemies/Turtle.ts`（修改）
  onBeginContact stomp 改為純位置判斷（移除 velocity 閾值，有物理接觸且玩家在頭頂即為 stomp）；
  新增 checkEnemyKill() proximity 掃描（敵人互相穿透不觸發 onBeginContact，改每幀掃描 World 子節點）；
  handleStomp SHELL_SLIDING 改為 enterShell（停止）而非死亡；
  SHELL_IDLE 踩踏才徹底死亡；
  playerVy 閾值全部降至 -1
- `scripts/enemies/EnemyBase.ts`（修改）
  新增 onPreSolve：碰到 Mushroom 時 contact.disabled = true（禁用物理衝力）；
  onBeginContact 過濾 Mushroom 接觸（不轉向）
- `scripts/items/Mushroom.ts`（修改）
  onBeginContact 過濾 EnemyBase 接觸（蘑菇不因碰敵人而轉向）；
  onPreSolve 已有（禁用物理衝力）
- `scripts/managers/GameManager.ts`（修改）
  新增 levelCleared: boolean 旗標，startNewGame 時重置
- `scripts/ui/HUD.ts`（修改）
  timer 倒數與死亡邏輯加 !GameManager.levelCleared 條件
- `scripts/ui/LevelClearUI.ts`（修改）
  show() 開頭設 GameManager.levelCleared = true，防止過關後 timer 觸發死亡

修改說明：
  - 踩頭：onBeginContact 在物理接觸瞬間 velocity 可能已被 physics 修改（Box2D
    在某些情況下先解算再通知），純位置判斷更可靠。
  - 殼打敵人：CC 2.4.x 敵人互相不物理碰撞（設計上穿透），onBeginContact 不觸發，
    改用每幀距離掃描，dx<52 且 dy<80 即殺死。
  - 蘑菇：onPreSolve 禁用衝力但 onBeginContact 仍觸發，雙邊都需過濾才能完全不互動。
  - 終點死亡：LevelClearUI 設 timer=0 → HUD 下幀判定 timer≤0 → die()，
    加 levelCleared 旗標後 HUD 不再倒數也不觸發死亡。

---

--- 互動 16 ---
使用者 prompt：程式碼全面 bug 審查 + 修正、蘑菇吃到時音效邏輯、踩頭偵測精確修正
Claude 產出：
- `scripts/player/Player.ts`（修改）
  移除 die() 中未宣告的 this.groundContacts = 0（會在每次死亡時 crash）；
  onDestroy 加入 this.unscheduleAllCallbacks()（防止場景重載後排程殘留）
- `scripts/managers/GameManager.ts`（修改）
  startNewGame() 補上 onLoseLife = null; onLevelClear = null;
  避免跨場景時舊 UI 的回呼仍掛在靜態變數上
- `scripts/items/QuestionBlock.ts`（修改）
  vy 閾值從 < 100 改為 < 0，允許任何向上動作都能觸發問號磚
  （gap 位置判斷已能防止從上方誤觸發）
- `scripts/enemies/EnemyBase.ts`（修改）
  新增 get dead() 公開 getter，供 Turtle 不用 bracket notation 存取 isDead
- `scripts/enemies/Turtle.ts`（修改）
  enemy['isDead'] 全部改為 enemy.dead（透過公開 getter 存取）
- `scripts/managers/AudioManager.ts`（修改）
  新增 sfxCoin: cc.AudioClip 欄位
- `scripts/items/Mushroom.ts`（修改）
  若玩家已是 BIG 狀態吃到蘑菇，改播 sfxCoin（不再觸發 growBig）；
  若是 SMALL 狀態，照常播 sfxPowerUp 並呼叫 growBig()
- `scripts/enemies/Turtle.ts`（修改）
  checkPlayerOverlap 的 isStomp 判斷：
  舊版移除 velocity check 後造成跳躍側撞被誤判為踩頭；
  改為 pPos.y > stompLine && playerVy <= 100，
  允許落地後 vy ≈ 0 的真實踩頭，同時擋掉 vy > 100 的向上跳側撞
- `scripts/enemies/Goomba.ts`（修改）
  同上，stompLine 從 myPos.y+50 降至 myPos.y+36，
  playerVy 從 < -10 改為 <= 100

修改說明：
  - groundContacts：Player 沒有 contact count 機制（改用 velocity-based isGrounded），
    die() 裡這行是殘留程式碼，直接刪除。
  - 踩頭 isStomp 邏輯：物理落地後 vy 會被瞬間設為 0，原本 playerVy < -1 因此漏判；
    完全移除 vy check 後，向上跳撞到龜身上半部 pPos.y > stompLine 被誤判為踩頭；
    最終方案 playerVy <= 100：跳躍中速度遠高於 100，落地後速度接近 0，兩者能正確區分。

---

--- 互動 17 ---
使用者 prompt：Mario 出生點改由 Tiled Objects 層的 player 物件決定
Claude 產出：
- `scripts/player/Player.ts`（修改）
  新增 setSpawnPos(worldPos) 公開方法：同時設定 node 位置與 this.spawnPos
- `scripts/world/LevelLoader.ts`（修改）
  import Player；spawnObjects switch 新增 'player' case：
  找到 Canvas/World/Player 節點，呼叫 playerComp.setSpawnPos(pos)
  若地圖沒放 player 物件，保留 editor 預設位置（不報錯）
- `resources/tilemaps/level2.tmx`（新增）
  Level 2 地圖（由使用者在 Tiled 設計）

修改說明：
  scene reload 時 LevelLoader 重新跑 spawnObjects，player 物件被偵測到後
  立即移動 Player 節點並更新 spawnPos，確保每次重生都回到 Tiled 設定的位置。
  若 Tiled 沒有放 player 物件則 fallback 到 editor 初始位置。

---

--- 互動 18 ---
使用者 prompt：全面 bug 審查（重點 Turtle），修正發現的問題
Claude 產出：
- `scripts/enemies/Turtle.ts`（修改）
  checkPlayerOverlap：myCenter/myHalfH 改為狀態感知
  （WALKING=36 world, SHELL=21 world = SHELL_COL_OY×3）；
  dy 判斷改為動態 myHalfH + playerHalfH + 8；
  SHELL_IDLE kick：踢出時立即設定 rb.linearVelocity，不等下一幀 update
- `scripts/enemies/Goomba.ts`（修改）
  checkPlayerOverlap：playerHalfH 從寫死 24 改為動態
  （BIG=39, SMALL=24），修正 BIG Mario 踩 Goomba 時重疊中心偏移

修改說明：
  - Turtle shell 中心高度：shell collider height=14 local × scale3 = 42 world，
    offset=7 local × scale3 = 21 world → shell 中心在 myPos.y + 21，
    原本寫死 36 會讓 SHELL 模式的 dy 超出閾值而漏偵測。
  - kick 速度延遲：設定 direction 後要等下一幀 SHELL_SLIDING update 才套速度，
    若玩家剛好靠著牆踢，第一幀 vx=0 → velocity-stuck fallback 可能反向。
    改為踢出時直接設速度。
  - Goomba BIG Mario：pCenter 高度寫死 24，BIG Mario 中心在 39，
    導致 dy 偏大而漏掉某些碰撞判斷。

---

--- 互動 22 ---
使用者 prompt：全面 bug 審查，修正 Goomba 踩頭、score 保留、rayCast、計時器，
               並修正踩頭偵測在高處誤觸發問題
Claude 產出：
- `scripts/enemies/Goomba.ts`（修改）
  stompLine 從 myPos.y+36（55%）改為 myPos.y+49（75% of 66）；
  checkPlayerOverlap 重構：踩頭改用 pPos.y（玩家底部）對 Goomba 幾何判斷，
  不再依賴 dy（center-to-center）——原本 BIG mario 在 Goomba 頂端 dy=72>65 永遠漏判；
  踩頭視窗：pPos.y in [stompLine, goombaTop+12]，12px 為一幀緩衝；
  傷害路徑分離：damage 只在 dy 通過且 pPos.y <= stompLine 時觸發
- `scripts/ui/GameOverUI.ts`（修改）
  移除重生時 GameManager.score=0，分數只在 startNewGame（lives=0 Game Over）時歸零
- `scripts/enemies/EnemyBase.ts`（修改）
  isAtEdge rayCast callback 加 null check：!r.collider || !r.collider.node
- `scripts/ui/HUD.ts`（修改）
  計時器 Math.ceil → Math.floor，倒數更自然

修改說明：
  - Goomba dy bug：dy = |goombaCenter.y - playerCenter.y|。BIG mario 站在 Goomba 頂端
    dy = |(33)-(66+39)| = 72 > 65，導致踩頭路徑完全跳過。
    改用 pPos.y（玩家底端）直接對比 stompLine/goombaTop，不受 playerHalfH 影響。
  - 上限 goombaTop+12：防止玩家在 Goomba 頭頂 80px 外就誤觸發踩頭（原版 +80 太鬆），
    12px 約等於正常落速（vy≈300）一幀的位移，夠緊又不漏判。
  - score 保留：原本每次死亡重生都清零，修改後只有真正 Game Over 才由 startNewGame 歸零。

--- 互動 20 ---
使用者 prompt：排行榜 UI 實作（LeaderboardUI），風格同登入面板
Claude 產出：
- `scripts/ui/LeaderboardUI.ts`（新增）
  onLoad 隱藏面板；show() 呼叫 FirebaseManager.getLeaderboard() 填入 10 行資料；
  Promise.race + 5s timeout 防止卡在「載入中...」；
  每行子節點 RankLabel / NameLabel / ScoreLabel 以 getChildByName 取得
- `scripts/ui/LevelSelectUI.ts`（修改）
  新增 leaderboardPanel @property；onLeaderboardClicked() 呼叫 LeaderboardUI.show()；
  新增 onLogoutClicked()：Firebase.signOut() + loadScene MainMenu
- Editor 設定
  LeaderboardPanel：button_orange SLICED 背景、title_0 標題區、10 個 Row 節點
  每 Row：text_area_0/text_area_1 交替背景 + RankLabel/NameLabel/ScoreLabel

修改說明：
  LeaderboardUI 的 rows[] 陣列每項對應一個 Row 節點，
  show() 時先全部 active=false，拿到資料後逐筆 active=true 並填文字。
  timeout 使用 Promise.race([getLeaderboard(), new Promise(5s→[])])
  防止 Firestore 首次讀取慢或規則錯誤時面板永遠卡住。
  Firestore 規則：leaderboard allow read: if true（不需登入即可看排行榜）

--- 互動 21 ---
使用者 prompt：Score 統計改為所有局的累加總分（totalScore），排行榜也改用 totalScore
Claude 產出：
- `scripts/managers/FirebaseManager.ts`（修改）
  uploadScore()：users/{uid}.totalScore 與 leaderboard/{uid}.score 都改用
  FieldValue.increment(score) 累加，不再比較最高分；
  新增 getTotalScore()：讀取 users/{uid}.totalScore
  移除 getBestScore() 的使用（bestScore 欄位不再維護）
- `scripts/ui/LevelSelectUI.ts`（修改）
  start() 只拉 getTotalScore()，scoreLabel 與 bestScoreLabel 都顯示 totalScore

修改說明：
  原本 bestScore 只記最高單局，leaderboard 也只在破紀錄時更新。
  改為 totalScore 後，每次過關都 +score，排行榜以累積總分排名，
  資料結構更簡單（只有一個數值需要維護）。
  FieldValue.increment() 是 Firestore 的原子操作，不需要先讀再寫，避免 race condition。

--- 互動 19 ---
使用者 prompt：Firebase 登入流程 bug 修正、UI 改善、Game Over 後維持登入狀態
Claude 產出：
- `scripts/managers/FirebaseManager.ts`（修改）
  signUp / signIn 加入 isReady 前置檢查，未就緒回傳「服務載入中，請稍後再試」；
  catch block 改用 e?.code（optional chaining），防止 e.code 為 undefined 時顯示「發生錯誤：undefined」；
  friendlyError 參數型別改為 string | undefined，加 !code 早期回傳「發生未知錯誤，請重試」；
  各 try/catch 加入 cc.error 方便 Console 除錯
- `scripts/ui/MainMenuUI.ts`（修改）
  onAuthChanged：登入成功時先顯示「歡迎，{displayName}！」，延遲 0.5s 再跳 LevelSelect；
  未登入時維持「請登入後開始遊戲」
- `scripts/ui/LevelSelectUI.ts`（修改）
  新增 userLabel: cc.Label @property；
  start() 讀取 FirebaseManager.currentUser.displayName 並顯示「USER: {name}」
- `scripts/ui/GameOverUI.ts`（修改）
  onReturnClicked 從 loadScene('MainMenu') 改為 loadScene('LevelSelect')；
  Game Over 後維持 Firebase 登入狀態，不走重新登入流程
- EditBox Max Length（Editor 設定）
  EmailInput / PasswordInput / NameInput 的 Max Length 從預設 20 改為 100

修改說明：
  - auth/internal-error / undefined：Firebase SDK 拋出的 Error 物件有時不含 .code 屬性
    （特別是 firebase 尚未 init 完成時直接呼叫 signIn，fb 為 undefined，
    呼叫 fb.auth() 直接 TypeError，e.code 為 undefined）。
    解法：isReady 前置檢查 + optional chaining + friendlyError 防 undefined。
  - Game Over 流程：原本跳回 MainMenu 需重新觸發 onAuthStateChanged，
    直接跳 LevelSelect 最可靠，Firebase auth state 跨場景持久存在。
  - Email Enumeration Protection：新版 Firebase 專案預設開啟，
    會把 user-not-found / wrong-password 包裝成 internal-error。
    建議在 Firebase Console → Authentication → Settings 關閉此設定。

--- 互動 23 ---
使用者 prompt：Mushroom 不應該與 Goomba / Turtle 發生碰撞
Claude 產出：
- `scripts/enemies/EnemyBase.ts`（修改）
  onLoad() 加入 this.node.group = 'enemy'，執行時強制覆蓋節點 group，
  不依賴 Editor 手動設定（避免場景舊實例 group 仍為 Default）
- `scripts/items/Mushroom.ts`（修改）
  onLoad() 加入 this.node.group = 'mushroom'，同上
- Editor 設定（Group Manager）
  新增 enemy（Group 1）、mushroom（Group 2）；
  Collide Map 中 enemy × mushroom 取消勾選 → 物理不碰撞

修改說明：
  CC2.4.x 中修改 Prefab 的 Group 後，場景已放置的節點實例不會自動更新，
  導致實際執行時 group 仍為 Default，碰撞過濾無效。
  解法：在 onLoad() 以程式碼直接設定 node.group，確保每次執行都套用正確 group，
  搭配 Group Manager 的 Collide Map 讓 enemy × mushroom 不產生物理碰撞。

--- 互動 24 ---
使用者 prompt：SCORE 標籤應顯示累計總分（baseScore + 本局得分），與排行榜一致
Claude 產出：
- `scripts/managers/GameManager.ts`（修改）
  新增 static baseScore: number = 0（從 Firebase 拉取的歷史累計分數）；
  addScore() 中 highScore 比較改為 baseScore + score
- `scripts/ui/LevelSelectUI.ts`（修改）
  start() 取得 fbTotal 後存入 GameManager.baseScore；
  同時重設 GameManager.score = 0（避免重複進關卡時分數意外累加）
- `scripts/ui/HUD.ts`（修改）
  scoreLabel 顯示改為 GameManager.baseScore + GameManager.score（總計）

修改說明：
  原本 SCORE 只顯示 GameManager.score（本局），排行榜顯示 Firebase totalScore（累計），
  兩者數值不一致。
  解法：進入 LevelSelect 時從 Firebase 拿累計分數存到 baseScore，
  HUD 顯示 baseScore + score，讓遊戲中的分數與排行榜保持一致。

--- 互動 25 ---
使用者 prompt：每次開始遊戲前（選關 / 重生）顯示 GAME START 過場畫面
Claude 產出：
- `scripts/ui/GameStartUI.ts`（新增）
  獨立場景腳本；start() 用 cc.tween 對 contentNode 做
  淡入 0.4s → 停留 1.2s → 淡出 0.4s → loadScene('Game')，共 2 秒；
  contentNode 未設定時有 fallback 直接跳轉
- `scripts/ui/LevelSelectUI.ts`（修改）
  onLevel1Clicked / onLevel2Clicked 改為 loadScene('GameStart')
- `scripts/ui/GameOverUI.ts`（修改）
  重生路徑（lives > 0）改為 loadScene('GameStart')
- Editor 建場景（GameStart.fire）
  Canvas 黑底；Content 節點掛 Horizontal Layout；
  子節點：GameLabel（"GAME"，金黃色）、MarioIcon（mario_small_1）、StartLabel（"START"）；
  Canvas 掛 GameStartUI，contentNode 拖入 Content

修改說明：
  選擇獨立場景而非 overlay，讓過場動畫與遊戲邏輯完全分離。
  GameManager.currentLevel 在跳 GameStart 前已設定，GameStart 場景結束後
  loadScene('Game') 時 LevelLoader 照常讀取正確關卡。
  重生流程原本在 GameOverUI 內 scheduleOnce 2.5s 後直接跳 Game，
  現在改跳 GameStart，讓每次開始都有一致的過場體驗。

--- 互動 26 ---
使用者 prompt：遊戲內 SCORE 只記單場得分，過關才加入 Firebase totalScore，Game Over 不加
Claude 產出：
- `scripts/ui/HUD.ts`（修改）
  scoreLabel 改回只顯示 GameManager.score（移除 baseScore 加總）
- `scripts/ui/GameStartUI.ts`（修改）
  start() 加入 GameManager.score = 0 與 levelCleared = false，
  確保每次進 GameStart 都從 0 開始計分
- `scripts/ui/LevelSelectUI.ts`（修改）
  移除進 LevelSelect 時的 GameManager.score = 0（由 GameStart 統一處理）

修改說明：
  原本 HUD 顯示 baseScore + score，導致進遊戲就看到歷史累計分數。
  改為：HUD 顯示本局 score（從 0 開始），LevelSelect 顯示 Firebase totalScore。
  score 歸零點移至 GameStartUI.start()，覆蓋所有進入 Game 的路徑
  （選關 / 重生都必須經過 GameStart）。
  LevelClearUI 已有 uploadScore(score) → Firebase FieldValue.increment，
  Game Over 路徑不呼叫 uploadScore，符合「只加過關得分」需求。

--- 互動 27 ---
使用者 prompt：外觀改善：MainMenu 加 title_0.png、套用 bitmap font
Claude 產出：
- `scenes/MainMenu.fire`（修改）
  Canvas 下新增 TitleImage 節點（Sprite，title_0.png，位於按鈕上方）；
  英文 Label 套用 white_font / yellow_font bitmap font，中文 Label 保持系統字型
- `scenes/LevelSelect.fire`（修改）
  英文 Label 套用 bitmap font

修改說明：
  CC2.4.8 bitmap font 限制整理：
  1. yellow_font：僅含 A-Z 大寫 + 數字 1-8（無 0、9、小寫、空格）
  2. white_font：含 A-Z 大寫 + 數字 0-9（無小寫、空格）
  3. 文字內容必須全大寫才能正確顯示
  4. Font Size 必須等於 BMFont Original Size（32），用節點 Scale 調整大小
  5. Overflow = NONE（auto-size），W 會自動計算不需手動設定
  中文文字（未登入、訪客模式等）無法用 bitmap font，保持系統字型。
  分數、時間等數字顯示改用 white_font（有完整 0-9）。

--- 互動 28 ---
使用者 prompt：Game Over 頁面做成像 GameStart 的獨立場景
Claude 產出：
- `scripts/ui/GameOverSceneUI.ts`（新增）
  lives <= 0 → 顯示 "GAME OVER"，淡入後等玩家按按鈕，播 sfxGameOver；
  lives > 0 → 顯示 "YOU DIED"，淡入 0.25s → 停留 0.5s → 淡出 0.25s → GameStart；
  label1/label2 文字由腳本動態設定，兩種狀況共用同一場景；
  contentNode 未設定時有 fallback 防止 crash
- `scripts/ui/GameOverUI.ts`（修改）
  簡化為只觸發：stopBGM + loadScene('GameOver')；
  移除原本的 overlay 邏輯、returnButton、scheduleOnce
- `scripts/ui/GameStartUI.ts`（修改）
  start() 加入 GameManager.resetTimer()，統一在 GameStart 重置計時器
- `scenes/GameOver.fire`（新增）
  黑底 Canvas；Content 節點含 Label1 + MarioIcon(mario_small_6) + Label2；
  ReturnButton 在 GAME OVER 時顯示；掛 GameOverSceneUI

修改說明：
  原本 GameOverUI 是 Game 場景內的 overlay，改為獨立場景後流程更清晰：
  死亡 → GameOver 場景（判斷 lives）→ GameStart / LevelSelect。
  bitmap font 在 CC2.4.8 的 Layout 元件中無法正確計算寬度（Label W=0），
  導致節點全部疊在一起，解法是移除 Layout 改用手動 Position X 定位。

--- 互動 29 ---
使用者 prompt：進入 Level 2 時會卡一幀，先看到 Level 1 畫面再切換
Claude 產出：
- `scripts/world/LevelLoader.ts`（修改）
  Level 2 載入時先把整個 World 節點（含 Map、Player、敵人）opacity 設為 0；
  等 TMX 換好、scheduleOnce 0.1s 後 generateGroundColliders 執行完畢
  （碰撞體生成 + Player spawn 位置設定）再把 World opacity 恢復 255

修改說明：
  原本流程：Game 場景載入 → 預設顯示 Level 1 地圖 → 0.1s 後換成 Level 2。
  閃爍原因：TiledMap 換 tmxAsset 需要一幀才能生效，期間顯示舊資產。
  解法：切換前隱藏整個 World 節點，確保玩家看到的第一幀就是完整的 Level 2。
