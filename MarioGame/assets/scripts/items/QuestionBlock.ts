import Player from '../player/Player';
import { PlayerState } from '../player/PlayerState';
import AudioManager from '../managers/AudioManager';

const { ccclass, property } = cc._decorator;

@ccclass
export default class QuestionBlock extends cc.Component {

    @property(cc.SpriteAtlas)
    atlas: cc.SpriteAtlas = null;

    @property(cc.Prefab)
    mushroomPrefab: cc.Prefab = null;

    private sprite:     cc.Sprite = null;
    private player:     Player    = null;
    private isUsed:     boolean   = false;
    private frameTimer: number    = 0;
    private frameIndex: number    = 0;
    private bumpTimer:  number    = 0;
    private originY:    number    = 0;

    // Animation frames (items atlas)
    private readonly ACTIVE_FRAMES = ['items_10', 'items_11', 'items_12', 'items_13'];
    private readonly EMPTY_FRAME   = 'items_14';
    private readonly FRAME_INTERVAL = 0.2;

    // Block: 16×16 local × scale3 = 48×48 world, anchor (0.5, 0)
    // Player small: 14×16 × scale3 = 42×48 world
    private readonly HIT_RANGE_X   = 24 + 21 + 8;  // half-widths + buffer = 53
    private readonly BUMP_HEIGHT   = 12;             // world units to bounce up
    private readonly BUMP_DURATION = 0.15;           // seconds

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        this.sprite  = this.getComponent(cc.Sprite);
        this.originY = this.node.y;
    }

    start() {
        const byPath = cc.find('Canvas/World/Player');
        if (byPath) {
            this.player = byPath.getComponent(Player);
        } else {
            const found = cc.director.getScene().getComponentsInChildren(Player);
            if (found && found.length > 0) this.player = found[0];
        }
        this.setFrame(this.ACTIVE_FRAMES[0]);
    }

    update(dt: number) {
        if (!this.isUsed) {
            this.animateBlock(dt);
            this.checkHit();
        }
        if (this.bumpTimer > 0) this.doBump(dt);
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private animateBlock(dt: number) {
        this.frameTimer += dt;
        if (this.frameTimer >= this.FRAME_INTERVAL) {
            this.frameTimer = 0;
            this.frameIndex = (this.frameIndex + 1) % this.ACTIVE_FRAMES.length;
            this.setFrame(this.ACTIVE_FRAMES[this.frameIndex]);
        }
    }

    private checkHit() {
        if (!this.player) return;
        if (this.player.playerState === PlayerState.DEAD) return;

        const vy = this.player.rigidbody.linearVelocity.y;
        if (vy < 100) return;   // must be jumping upward

        const myWorld = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);   // block bottom-center
        const pWorld  = this.player.node.convertToWorldSpaceAR(cc.Vec2.ZERO); // player bottom-center

        const dx  = Math.abs(myWorld.x - pWorld.x);
        // gap: distance from player bottom to block bottom (positive = player below block)
        const gap = myWorld.y - pWorld.y;

        // gap < 100 covers both small (top=48) and big (top=78) Mario
        if (dx < this.HIT_RANGE_X && gap > 0 && gap < 100) {
            this.onHit();
        }
    }

    private onHit() {
        this.isUsed    = true;
        this.originY   = this.node.y;
        this.bumpTimer = this.BUMP_DURATION;
        this.setFrame(this.EMPTY_FRAME);
        AudioManager.playSFX(AudioManager.I?.sfxPowerUpAppear);
        this.spawnMushroom();
    }

    private doBump(dt: number) {
        this.bumpTimer -= dt;
        const t = 1 - this.bumpTimer / this.BUMP_DURATION;   // 0 → 1
        this.node.y = this.originY + Math.sin(t * Math.PI) * this.BUMP_HEIGHT;
        if (this.bumpTimer <= 0) this.node.y = this.originY;
    }

    private spawnMushroom() {
        if (!this.mushroomPrefab) return;
        const world = cc.find('Canvas/World');
        if (!world) return;

        const mushroom  = cc.instantiate(this.mushroomPrefab);
        mushroom.parent = world;

        // Spawn at block's top (block height = 48 world units)
        const myWorld  = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const localPos = world.convertToNodeSpaceAR(cc.v2(myWorld.x, myWorld.y + 48));
        mushroom.setPosition(localPos.x, localPos.y);
    }

    private setFrame(name: string) {
        if (!this.atlas || !this.sprite) return;
        const f = this.atlas.getSpriteFrame(name)
               || this.atlas.getSpriteFrame(name + '.png');
        if (f) this.sprite.spriteFrame = f;
    }
}
