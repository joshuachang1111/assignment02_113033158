import GameManager from '../managers/GameManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameStartUI extends cc.Component {

    // 拖入包含 "GAME ★ START" 文字+圖示的容器節點
    @property(cc.Node)
    contentNode: cc.Node = null;

    // 淡入 0.4s → 停留 1.2s → 淡出 0.4s → 跳 Game（共 2s）
    private readonly FADE_IN  = 0.4;
    private readonly HOLD     = 1.2;
    private readonly FADE_OUT = 0.4;

    start() {
        // 每次進 GameStart 都從 0 開始計分，並重置計時器
        GameManager.score = 0;
        GameManager.levelCleared = false;
        GameManager.resetTimer();

        if (!this.contentNode) {
            cc.warn('[GameStartUI] contentNode 未設定，直接跳轉');
            this.scheduleOnce(() => cc.director.loadScene('Game'), 0.1);
            return;
        }

        this.contentNode.opacity = 0;

        cc.tween(this.contentNode)
            .to(this.FADE_IN,  { opacity: 255 }, { easing: 'fadeIn' })
            .delay(this.HOLD)
            .to(this.FADE_OUT, { opacity: 0 },   { easing: 'fadeOut' })
            .call(() => cc.director.loadScene('Game'))
            .start();
    }
}
