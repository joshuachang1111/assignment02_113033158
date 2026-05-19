import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameOverSceneUI extends cc.Component {

    // 包含兩個 Label + Mario 圖示的容器節點
    @property(cc.Node)
    contentNode: cc.Node = null;

    // 左側文字：GAME 或 YOU
    @property(cc.Label)
    label1: cc.Label = null;

    // 右側文字：OVER 或 DIED
    @property(cc.Label)
    label2: cc.Label = null;

    // 只在 GAME OVER（lives=0）時出現的返回按鈕
    @property(cc.Node)
    returnButton: cc.Node = null;

    private readonly FADE_IN  = 0.25;
    private readonly HOLD     = 0.5;
    private readonly FADE_OUT = 0.25;

    start() {
        const isGameOver = GameManager.lives <= 0;

        // 根據 lives 決定顯示文字
        if (this.label1) this.label1.string = isGameOver ? 'GAME' : 'YOU';
        if (this.label2) this.label2.string = isGameOver ? 'OVER' : 'DIED';
        if (this.returnButton) this.returnButton.active = false;
        if (this.contentNode) this.contentNode.opacity = 0;

        if (!this.contentNode) {
            cc.warn('[GameOverSceneUI] contentNode 未設定，直接跳轉');
            if (GameManager.lives <= 0) {
                AudioManager.playSFX(AudioManager.I?.sfxGameOver);
                if (this.returnButton) this.returnButton.active = true;
            } else {
                this.scheduleOnce(() => cc.director.loadScene('GameStart'), 1);
            }
            return;
        }

        if (isGameOver) {
            // ── GAME OVER：淡入後等玩家按按鈕 ───────────────────────────
            AudioManager.playSFX(AudioManager.I?.sfxGameOver);

            cc.tween(this.contentNode)
                .to(this.FADE_IN, { opacity: 255 }, { easing: 'fadeIn' })
                .call(() => {
                    if (this.returnButton) this.returnButton.active = true;
                })
                .start();

        } else {
            // ── YOU DIED：淡入 → 停留 → 淡出 → GameStart（共 1s）────────
            GameManager.resetTimer();

            cc.tween(this.contentNode)
                .to(this.FADE_IN,  { opacity: 255 }, { easing: 'fadeIn' })
                .delay(this.HOLD)
                .to(this.FADE_OUT, { opacity: 0 },   { easing: 'fadeOut' })
                .call(() => cc.director.loadScene('GameStart'))
                .start();
        }
    }

    // 綁定返回按鈕的 Click Event
    onReturnClicked() {
        GameManager.startNewGame();
        cc.tween(this.contentNode)
            .to(0.3, { opacity: 0 })
            .call(() => cc.director.loadScene('LevelSelect'))
            .start();
    }
}
