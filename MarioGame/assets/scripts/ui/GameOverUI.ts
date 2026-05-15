import GameManager from '../managers/GameManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameOverUI extends cc.Component {

    @property(cc.Node)
    returnButton: cc.Node = null;

    onLoad() {
        this.node.active = false;
        GameManager.onLoseLife = (lives) => this.handleLoseLife(lives);
    }

    onDestroy() {
        GameManager.onLoseLife = null;
    }

    private handleLoseLife(lives: number) {
        this.node.active = true;
        if (lives <= 0) {
            if (this.returnButton) this.returnButton.active = true;
        } else {
            if (this.returnButton) this.returnButton.active = false;
            this.scheduleOnce(() => {
                GameManager.resetTimer();
                GameManager.score = 0;
                cc.director.loadScene('Game');
            }, 2.5);
        }
    }

    onReturnClicked() {
        GameManager.startNewGame();
        cc.director.loadScene('MainMenu');
    }
}
