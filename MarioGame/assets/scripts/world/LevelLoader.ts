const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelLoader extends cc.Component {

    @property(cc.Prefab)
    questionBlockPrefab: cc.Prefab = null;

    onLoad() {
        const physics = cc.director.getPhysicsManager();
        physics.enabled = true;
        physics.gravity = cc.v2(0, -1200);

        this.generateGroundColliders();
    }

    private generateGroundColliders() {
        const tiledMap  = this.getComponent(cc.TiledMap);
        const layer     = tiledMap.getLayer('Ground');
        const layerSize = layer.getLayerSize();
        const tileSize  = layer.getMapTileSize();
        const numCols   = layerSize.width;
        const numRows   = layerSize.height;

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

        this.spawnBoundaryWalls(numCols, numRows, tileSize);
        this.spawnObjects(numRows, tileSize);
        cc.log('[LevelLoader] Ground colliders + boundary walls + objects generated');
    }

    // Read the Objects layer and spawn prefabs for known types
    private spawnObjects(numRows: number, tileSize: cc.Size) {
        const tiledMap = this.getComponent(cc.TiledMap);
        const group    = tiledMap.getObjectGroup('Objects');
        if (!group) return;
        const objects = group.getObjects();
        if (!objects) return;

        const world = cc.find('Canvas/World');
        if (!world) { cc.warn('[LevelLoader] Canvas/World not found'); return; }

        for (const obj of objects) {
            if (obj['name'] === 'question_block') {
                if (!this.questionBlockPrefab) {
                    cc.warn('[LevelLoader] questionBlockPrefab not assigned on Map node');
                    continue;
                }
                const pos  = this.tiledToWorld(obj['x'], obj['y'], numRows, tileSize);
                const node = cc.instantiate(this.questionBlockPrefab);
                node.parent = world;
                node.setPosition(pos.x, pos.y);
            }
            // goomba / turtle / flagpole will be handled in later stages
        }
    }

    // Convert object coords to world bottom-center of the tile.
    // CC 2.4.x already flips obj['y'] to Y-up from map bottom, so we
    // convert back to Tiled Y-down before the standard row calculation.
    private tiledToWorld(ox: number, oy: number, numRows: number, tileSize: cc.Size): cc.Vec2 {
        const col     = Math.floor(ox / tileSize.width);
        const localXc = col * tileSize.width + tileSize.width / 2;
        const tiledY  = numRows * tileSize.height - oy;   // undo CC's Y-flip
        const row     = Math.floor(tiledY / tileSize.height);
        const localY  = (numRows - 1 - row) * tileSize.height;
        return cc.v2(
            localXc * this.node.scaleX + this.node.x,
            localY  * this.node.scaleY + this.node.y,
        );
    }

    private spawnBoundaryWalls(numCols: number, numRows: number, tileSize: cc.Size) {
        const wallW   = tileSize.width;
        const wallH   = (numRows + 8) * tileSize.height;
        const centerY = numRows * tileSize.height / 2;

        const walls: [string, number][] = [
            ['LeftWall',  -wallW / 2],
            ['RightWall', numCols * tileSize.width + wallW / 2],
        ];

        for (const [name, localX] of walls) {
            const node = new cc.Node(name);
            node.parent = this.node;
            node.setPosition(localX, centerY);

            const rb  = node.addComponent(cc.RigidBody);
            rb.type   = cc.RigidBodyType.Static;

            const col  = node.addComponent(cc.PhysicsBoxCollider);
            col.size   = cc.size(wallW, wallH);
            col.offset = cc.v2(0, 0);
            col.apply();
        }
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

        const localX = startCol * tileSize.width + (runLen * tileSize.width) / 2;
        const localY = (numRows - 1 - tiledRow) * tileSize.height + tileSize.height / 2;
        node.setPosition(localX, localY);

        const rb  = node.addComponent(cc.RigidBody);
        rb.type   = cc.RigidBodyType.Static;

        const box  = node.addComponent(cc.PhysicsBoxCollider);
        box.size   = cc.size(runLen * tileSize.width, tileSize.height);
        box.offset = cc.v2(0, 0);
        box.apply();
    }
}
