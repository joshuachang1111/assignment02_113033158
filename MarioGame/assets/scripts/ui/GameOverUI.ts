import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';

const { ccclass } = cc._decorator;

@ccclass
export default class GameOverUI extends cc.Component {

    onLoad() {
        this.node.active = false;
        GameManager.onLoseLife = (_lives) => {
            AudioManager.stopBGM();
            cc.director.loadScene('GameOver');
        };
    }

    onDestroy() {
        GameManager.onLoseLife = null;
    }
}
