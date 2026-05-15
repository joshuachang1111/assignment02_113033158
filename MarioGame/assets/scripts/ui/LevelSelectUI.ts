import GameManager from '../managers/GameManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelSelectUI extends cc.Component {

    @property(cc.Label)
    livesLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    coinsLabel: cc.Label = null;

    start() {
        this.updateLabels();
    }

    private updateLabels() {
        if (this.livesLabel) this.livesLabel.string = String(GameManager.lives);
        if (this.scoreLabel) this.scoreLabel.string = String(GameManager.highScore).padStart(7, '0');
        if (this.coinsLabel) this.coinsLabel.string = String(GameManager.coins);
    }

    onLevel1Clicked() {
        GameManager.currentLevel = 1;
        cc.director.loadScene('Game');
    }

    onLevel2Clicked() {
        GameManager.currentLevel = 2;
        cc.director.loadScene('Game');
    }

    onBackClicked() {
        cc.director.loadScene('MainMenu');
    }
}
