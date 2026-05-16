import GameManager from '../managers/GameManager';
import { PlayerState } from '../player/PlayerState';
import Player from '../player/Player';

const { ccclass } = cc._decorator;

@ccclass
export default class Flagpole extends cc.Component {

    private player: Player = null;
    private triggered: boolean = false;

    private readonly TRIGGER_X = 60;
    private readonly TRIGGER_Y = 400;

    start() {
        const pNode = cc.find('Canvas/World/Player');
        if (pNode) this.player = pNode.getComponent(Player);
    }

    update(_dt: number) {
        if (this.triggered || !this.player) return;
        if (this.player.playerState === PlayerState.DEAD) return;

        const myPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const pPos  = this.player.node.convertToWorldSpaceAR(cc.Vec2.ZERO);

        const dx = Math.abs(myPos.x - pPos.x);
        const dy = Math.abs(myPos.y - pPos.y);

        if (dx < this.TRIGGER_X && dy < this.TRIGGER_Y) {
            this.triggered = true;
            if (GameManager.onLevelClear) GameManager.onLevelClear();
        }
    }
}
