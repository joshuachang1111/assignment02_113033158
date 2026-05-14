const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelLoader extends cc.Component {

    onLoad() {
        // 啟動 2D 物理引擎
        const physics = cc.director.getPhysicsManager();
        physics.enabled = true;
        physics.gravity = cc.v2(0, -960);

        this.generateGroundColliders();
    }

    private generateGroundColliders() {
        const tiledMap = this.getComponent(cc.TiledMap);
        const layer    = tiledMap.getLayer('Ground');
        const layerSize = layer.getLayerSize();   // { width: 欄數, height: 列數 }
        const tileSize  = layer.getMapTileSize(); // { width: 16,   height: 16  }
        const numCols   = layerSize.width;
        const numRows   = layerSize.height;

        // 逐列掃描，把連續的 tile 合併成一個寬版碰撞體
        for (let row = 0; row < numRows; row++) {
            let runStart = -1;
            let runLen   = 0;

            for (let col = 0; col <= numCols; col++) {
                const gid     = col < numCols ? layer.getTileGIDAt(cc.v2(col, row)) : 0;
                const hasTile = gid > 0;

                if (hasTile) {
                    if (runStart === -1) { runStart = col; runLen = 1; }
                    else                { runLen++;                    }
                } else if (runStart !== -1) {
                    this.spawnCollider(runStart, row, runLen, numRows, tileSize);
                    runStart = -1;
                    runLen   = 0;
                }
            }
        }

        cc.log('[LevelLoader] Ground colliders generated');
    }

    private spawnCollider(
        startCol: number,
        tiledRow: number,
        runLen:   number,
        numRows:  number,
        tileSize: cc.Size
    ) {
        const node = new cc.Node('GndCol');
        node.parent = this.node;

        // Tiled row 0 = 頂部；CC 座標 Y 朝上，需要翻轉
        const localX = startCol * tileSize.width + (runLen * tileSize.width) / 2;
        const localY = (numRows - 1 - tiledRow) * tileSize.height + tileSize.height / 2;
        node.setPosition(localX, localY);

        // Static 碰撞體（不受重力影響）
        const rb  = node.addComponent(cc.RigidBody);
        rb.type   = cc.RigidBodyType.Static;

        const box  = node.addComponent(cc.PhysicsBoxCollider);
        box.size   = cc.size(runLen * tileSize.width, tileSize.height);
        box.offset = cc.v2(0, 0);
        box.apply();
    }
}
