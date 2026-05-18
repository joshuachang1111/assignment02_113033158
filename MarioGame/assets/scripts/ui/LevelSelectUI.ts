import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';
import FirebaseManager from '../managers/FirebaseManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelSelectUI extends cc.Component {

    @property(cc.Label)
    livesLabel: cc.Label = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    coinsLabel: cc.Label = null;

    @property(cc.Label)
    bestScoreLabel: cc.Label = null;   // Firebase 個人最佳（可選）

    @property(cc.Label)
    userLabel: cc.Label = null;        // 顯示登入使用者名稱

    async start() {
        AudioManager.playBGM(AudioManager.I?.bgm1);
        this.updateLabels();

        // 顯示登入使用者暱稱
        const user = FirebaseManager.currentUser;
        if (user && this.userLabel) {
            const name = user.displayName || user.email || '玩家';
            this.userLabel.string = 'USER: ' + name;
        }

        // 嘗試從 Firebase 拉最佳分數（已登入才有）
        const fbBest = await FirebaseManager.getBestScore();
        if (fbBest > 0 && this.bestScoreLabel) {
            this.bestScoreLabel.string = 'BEST: ' + String(fbBest).padStart(7, '0');
        } else if (this.bestScoreLabel) {
            this.bestScoreLabel.string = 'BEST: ' + String(GameManager.highScore).padStart(7, '0');
        }
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
