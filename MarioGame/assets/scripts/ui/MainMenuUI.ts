import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';

const { ccclass } = cc._decorator;

@ccclass
export default class MainMenuUI extends cc.Component {

    start() {
        AudioManager.playBGM(AudioManager.I?.bgm1);
    }

    onStartClicked() {
        GameManager.startNewGame();
        GameManager.currentLevel = 1;
        cc.director.loadScene('LevelSelect');
    }
}
