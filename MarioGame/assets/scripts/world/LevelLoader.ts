import GameManager from '../managers/GameManager';
import Player from '../player/Player';

const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelLoader extends cc.Component {

    @property(cc.TiledMapAsset)
    level2Asset: cc.TiledMapAsset = null;

    @property(cc.Prefab)
    questionBlockPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    goombaPrefab: cc.Prefab = null;

    @property(cc.Prefab)
    turtlePrefab: cc.Prefab = null;

    @property(cc.Prefab)
    flagpolePrefab: cc.Prefab = null;

    onLoad() {
        const physics = cc.director.getPhysicsManager();
        physics.enabled = true;
        physics.gravity = cc.v2(0, -1200);

        // Switch to level 2 map asset if needed
        if (GameManager.currentLevel === 2 && this.level2Asset) {
            // 隱藏整個 World 節點（含 Map、Player、敵人）
            // 等 TMX 換好、碰撞體生成、Player 位置設定完畢後再顯示
            const world = this.node.parent;
            if (world) world.opacity = 0;
            this.getComponent(cc.TiledMap).tmxAsset = this.level2Asset;
            this.scheduleOnce(() => {
                this.generateGroundColliders();
                if (world) world.opacity = 255;
            }, 0.1);
        } else {
            this.generateGroundColliders();
        }
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

    private spawnObjects(numRows: number, tileSize: cc.Size) {
        const tiledMap = this.getComponent(cc.TiledMap);
        const group    = tiledMap.getObjectGroup('Objects');
        if (!group) return;
        const objects = group.getObjects();
        if (!objects) return;

        const world = cc.find('Canvas/World');
        if (!world) { cc.warn('[LevelLoader] Canvas/World not found'); return; }

        for (const obj of objects) {
            try {
                const type = obj['name'] as string;
                const pos  = this.tiledToWorld(obj['x'], obj['y'], numRows, tileSize);
                cc.log(`[LevelLoader] spawning "${type}" at (${pos.x.toFixed(1)}, ${pos.y.toFixed(1)})`);

                switch (type) {
                    case 'question_block':
                        this.spawnPrefab(this.questionBlockPrefab, pos, world, 'questionBlockPrefab');
                        break;

                    case 'goomba':
                        this.spawnPrefab(this.goombaPrefab, pos, world, 'goombaPrefab');
                        break;

                    case 'turtle':
                        this.spawnPrefab(this.turtlePrefab, pos, world, 'turtlePrefab');
                        break;

                    case 'flagpole':
                        this.spawnPrefab(this.flagpolePrefab, pos, world, 'flagpolePrefab');
                        break;

                    case 'player': {
                        const playerNode = cc.find('Canvas/World/Player');
                        if (playerNode) {
                            const playerComp = playerNode.getComponent(Player);
                            if (playerComp) playerComp.setSpawnPos(pos);
                        }
                        break;
                    }

                    default:
                        cc.warn(`[LevelLoader] unknown object name: "${type}"`);
                }
            } catch (e) {
                cc.error('[LevelLoader] failed to spawn object:', e);
            }
        }
    }

    private spawnPrefab(prefab: cc.Prefab, pos: cc.Vec2, parent: cc.Node, label: string) {
        if (!prefab) {
            cc.warn(`[LevelLoader] ${label} not assigned on Map node`);
            return;
        }
        const node = cc.instantiate(prefab);
        node.parent = parent;
        node.setPosition(pos.x, pos.y);
    }

    // CC 2.4.x getObjects() already returns obj['y'] in Y-up coords from map bottom.
    // Use the coords directly; no row-snapping that would shift objects downward.
    private tiledToWorld(ox: number, oy: number, _numRows: number, _tileSize: cc.Size): cc.Vec2 {
        return cc.v2(
            ox * this.node.scaleX + this.node.x,
            oy * this.node.scaleY + this.node.y,
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
