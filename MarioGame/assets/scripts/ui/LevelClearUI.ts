import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';

const { ccclass } = cc._decorator;

@ccclass
export default class LevelClearUI extends cc.Component {

    onLoad() {
        this.node.active = false;
        GameManager.onLevelClear = () => this.show();
    }

    onDestroy() {
        GameManager.onLevelClear = null;
    }

    show() {
        if (this.node.active) return;
        this.node.active = true;
        AudioManager.stopBGM();
        AudioManager.playSFX(AudioManager.I?.sfxLevelClear);
        GameManager.addScore(Math.ceil(GameManager.timer) * 30);
        GameManager.timer = 0;
        this.scheduleOnce(() => {
            cc.director.loadScene('LevelSelect');
        }, 4.0);
    }
}
