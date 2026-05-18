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
