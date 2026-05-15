import GameManager from '../managers/GameManager';

const { ccclass } = cc._decorator;

// Triggered by flagpole in Stage 9
@ccclass
export default class LevelClearUI extends cc.Component {

    show() {
        this.node.active = true;
        // Time bonus: remaining seconds × 30
        GameManager.addScore(Math.ceil(GameManager.timer) * 30);
        GameManager.timer = 0;
        this.scheduleOnce(() => {
            cc.director.loadScene('LevelSelect');
        }, 4.0);
    }
}
