import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';
import Player from '../player/Player';
import { PlayerState } from '../player/PlayerState';

const { ccclass, property } = cc._decorator;

@ccclass
export default class HUD extends cc.Component {

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.Label)
    timerLabel: cc.Label = null;

    @property(cc.Label)
    livesLabel: cc.Label = null;

    private player: Player = null;

    start() {
        const bgm = GameManager.currentLevel === 2
            ? AudioManager.I?.bgm3
            : AudioManager.I?.bgm2;
        AudioManager.playBGM(bgm);

        const pNode = cc.find('Canvas/World/Player');
        if (pNode) this.player = pNode.getComponent(Player);
    }

    update(dt: number) {
        if (this.player && this.player.playerState !== PlayerState.DEAD) {
            GameManager.timer -= dt;
            if (GameManager.timer <= 0) {
                GameManager.timer = 0;
                this.player.die();
            }
        }

        if (this.scoreLabel) {
            this.scoreLabel.string = 'SCORE: ' + String(Math.floor(GameManager.score)).padStart(6, '0');
        }
        if (this.timerLabel) {
            this.timerLabel.string = 'TIME: ' + String(Math.ceil(Math.max(0, GameManager.timer)));
        }
        if (this.livesLabel) {
            this.livesLabel.string = '×' + GameManager.lives;
        }
    }
}
