import { PlayerState } from './PlayerState';
import Player from './Player';

const { ccclass, property } = cc._decorator;

// Internal animation state (independent of PlayerState)
enum AnimState { IDLE, WALK, AIR, DEAD }

// Frame name arrays — adjust indices here after inspecting the sprite sheets in-game
const FRAMES = {
    small: {
        [AnimState.IDLE]: ['mario_small_0'],
        [AnimState.WALK]: ['mario_small_1', 'mario_small_2', 'mario_small_3'],
        [AnimState.AIR]:  ['mario_small_5'],
        [AnimState.DEAD]: ['mario_small_6'],
    },
    big: {
        [AnimState.IDLE]: ['mario_big_0'],
        [AnimState.WALK]: ['mario_big_1', 'mario_big_2', 'mario_big_3'],
        [AnimState.AIR]:  ['mario_big_5'],
        [AnimState.DEAD]: ['mario_big_0'],  // big mario degrades to small before dying
    },
};

@ccclass
export default class PlayerAnim extends cc.Component {

    // Both atlases set in the editor (drag mario_small.plist / mario_big.plist)
    @property(cc.SpriteAtlas)
    smallAtlas: cc.SpriteAtlas = null;

    @property(cc.SpriteAtlas)
    bigAtlas: cc.SpriteAtlas = null;

    private sprite: cc.Sprite = null;
    private player: Player = null;
    private rb: cc.RigidBody = null;

    private currentAnim: AnimState = AnimState.IDLE;
    private frameIndex: number = 0;
    private frameTimer: number = 0;
    private readonly FRAME_INTERVAL = 0.1;  // 10 fps walk cycle

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        this.sprite = this.getComponent(cc.Sprite);
        // PlayerAnim lives on a child "Visual" node; Player lives on the parent root
        this.player = this.node.parent.getComponent(Player);
        this.rb     = this.node.parent.getComponent(cc.RigidBody);
    }

    update(dt: number) {
        if (!this.player || !this.sprite) return;

        // ── resolve which animation should be playing ─────────────────────────
        const want = this.resolveAnim();
        if (want !== this.currentAnim) {
            this.currentAnim = want;
            this.frameIndex  = 0;
            this.frameTimer  = 0;
        }

        // ── horizontal flip ───────────────────────────────────────────────────
        // Flip this (Visual) node; parent (physics node) stays at positive scaleX
        this.node.scaleX = this.player.isFacingRight ? 1 : -1;

        // ── advance walk-cycle frame timer ────────────────────────────────────
        const frames = this.getFrameNames();
        if (frames.length > 1) {
            this.frameTimer += dt;
            if (this.frameTimer >= this.FRAME_INTERVAL) {
                this.frameTimer -= this.FRAME_INTERVAL;
                this.frameIndex = (this.frameIndex + 1) % frames.length;
            }
        }

        // ── apply sprite frame ────────────────────────────────────────────────
        const isBig  = this.player.playerState === PlayerState.BIG;
        const atlas  = isBig ? this.bigAtlas : this.smallAtlas;
        if (!atlas) return;
        const frame = atlas.getSpriteFrame(frames[this.frameIndex]);
        if (frame) this.sprite.spriteFrame = frame;
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private resolveAnim(): AnimState {
        if (this.player.playerState === PlayerState.DEAD) return AnimState.DEAD;
        if (!this.player.isGrounded) return AnimState.AIR;
        const vx = this.rb ? this.rb.linearVelocity.x : 0;
        return Math.abs(vx) > 10 ? AnimState.WALK : AnimState.IDLE;
    }

    private getFrameNames(): string[] {
        const isBig = this.player.playerState === PlayerState.BIG;
        return (isBig ? FRAMES.big : FRAMES.small)[this.currentAnim];
    }
}
