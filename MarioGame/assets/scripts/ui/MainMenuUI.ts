import GameManager from '../managers/GameManager';

const { ccclass } = cc._decorator;

@ccclass
export default class MainMenuUI extends cc.Component {

    onStartClicked() {
        GameManager.startNewGame();
        GameManager.currentLevel = 1;
        cc.director.loadScene('LevelSelect');
    }
}
