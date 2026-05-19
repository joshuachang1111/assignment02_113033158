import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';
import FirebaseManager from '../managers/FirebaseManager';
import LeaderboardUI from './LeaderboardUI';

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

    @property(cc.Node)
    leaderboardPanel: cc.Node = null;  // LeaderboardPanel 節點

    async start() {
        AudioManager.playBGM(AudioManager.I?.bgm1);
        this.updateLabels();

        // 顯示登入使用者暱稱
        const user = FirebaseManager.currentUser;
        if (user && this.userLabel) {
            const name = user.displayName || user.email || '玩家';
            this.userLabel.string = 'USER: ' + name;
        }

        // 從 Firebase 拉累計總分，存入 GameManager.baseScore 供遊戲中 HUD 使用
        const fbTotal = await FirebaseManager.getTotalScore();
        GameManager.baseScore = fbTotal;
        if (this.scoreLabel)     this.scoreLabel.string     = String(fbTotal).padStart(7, '0');
        if (this.bestScoreLabel) this.bestScoreLabel.string = 'BEST: ' + String(fbTotal).padStart(7, '0');
    }

    private updateLabels() {
        if (this.livesLabel) this.livesLabel.string = String(GameManager.lives);
        if (this.scoreLabel) this.scoreLabel.string = String(GameManager.highScore).padStart(7, '0');
        if (this.coinsLabel) this.coinsLabel.string = String(GameManager.coins);
    }

    onLevel1Clicked() {
        GameManager.currentLevel = 1;
        cc.director.loadScene('GameStart');
    }

    onLevel2Clicked() {
        GameManager.currentLevel = 2;
        cc.director.loadScene('GameStart');
    }

    onBackClicked() {
        cc.director.loadScene('MainMenu');
    }

    onLeaderboardClicked() {
        if (!this.leaderboardPanel) return;
        const ui = this.leaderboardPanel.getComponent(LeaderboardUI);
        if (ui) ui.show();
    }

    onLogoutClicked() {
        FirebaseManager.signOut();
        cc.director.loadScene('MainMenu');
    }
}
