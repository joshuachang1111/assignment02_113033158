const { ccclass, property } = cc._decorator;

@ccclass
export default class CameraFollow extends cc.Component {

    @property(cc.Node)
    playerNode: cc.Node = null;

    @property(cc.Node)
    mapNode: cc.Node = null;

    // 地圖總寬（世界像素）= 200 tiles * 16px * scale 3 = 9600
    @property
    mapWorldWidth: number = 9600;

    // 鏡頭向右偏移量（正值 → Mario 偏左顯示）。預設 150，可在 Editor 調整。
    @property
    lookaheadX: number = 150;

    private minX: number = 0;
    private maxX: number = 0;

    start() {
        const halfW   = cc.winSize.width / 2;
        const mapLeft = this.mapNode ? this.mapNode.x : -halfW;
        this.minX = mapLeft + halfW;
        this.maxX = mapLeft + this.mapWorldWidth - halfW;
    }

    update() {
        if (!this.playerNode) return;

        const wx = this.playerNode.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
        this.node.x = cc.misc.clampf(wx + this.lookaheadX, this.minX, this.maxX);
    }
}
