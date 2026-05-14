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

    private minX: number = 0;
    private maxX: number = 0;

    start() {
        const halfW   = cc.winSize.width / 2;          // 640
        const mapLeft = this.mapNode ? this.mapNode.x : -halfW;
        this.minX = mapLeft + halfW;                    // 左邊界：地圖左 + 半螢幕
        this.maxX = mapLeft + this.mapWorldWidth - halfW; // 右邊界：地圖右 - 半螢幕
    }

    update() {
        if (!this.playerNode) return;

        // 取玩家在世界空間（Canvas 座標）的 X
        const wx = this.playerNode.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
        this.node.x = cc.misc.clampf(wx, this.minX, this.maxX);
        // Y 軸固定，不跟隨上下
    }
}
