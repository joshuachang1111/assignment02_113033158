import { PlayerState } from './PlayerState';
import Player from './Player';

const { ccclass, property } = cc._decorator;

// Internal animation state (independent of PlayerState)
enum AnimState { IDLE, WALK, AIR, DEAD }

// Frame layout for mario_small.png (11 cols × 3 rows, 16×16 each):
//   Row 0 (y=1)  right-facing: col0=back-view(skip), col1=11, col2=15, col3=18,
//                               col4=22, col5=25, col6=28, col7=30, col8=33, col9=4, col10=7
//   Row 1 (y=19) left-facing:  col0=1,  col1=13, col2=16, col3=19,
//                               col4=23, col5=26, col6=29, col7=31, col8=34, col9=5, col10=9
//   Row 2 (y=37) misc/special: col9=6 (death spin), etc.
//
// mario_small_0 is the pipe-entry back-view frame — do NOT use for idle/walk.
// Adjust any index here if the in-game sprite looks wrong.
const FRAMES = {
    small: {
        [AnimState.IDLE]: ['mario_small_11'],
        [AnimState.WALK]: ['mario_small_11', 'mario_small_15', 'mario_small_18'],
        [AnimState.AIR]:  ['mario_small_22'],
        [AnimState.DEAD]: ['mario_small_6'],
    },
    big: {
        [AnimState.IDLE]: ['mario_big_20'],
        [AnimState.WALK]: ['mario_big_20', 'mario_big_21', 'mario_big_22'],
        [AnimState.AIR]:  ['mario_big_27'],
        [AnimState.DEAD]: ['mario_big_20'],
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
        const showBig = this.player.isTransforming
            ? this.player.displayBig
            : this.player.playerState === PlayerState.BIG;
        const atlas  = showBig ? this.bigAtlas : this.smallAtlas;
        if (!atlas) return;
        const name  = frames[this.frameIndex];
        // CC2.4.8 may store frame names with or without .png suffix
        const frame = atlas.getSpriteFrame(name) || atlas.getSpriteFrame(name + '.png');
        if (frame) this.sprite.spriteFrame = frame;
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private resolveAnim(): AnimState {
        if (this.player.playerState === PlayerState.DEAD) return AnimState.DEAD;
        if (this.player.isTransforming) return AnimState.IDLE;
        if (!this.player.isGrounded) return AnimState.AIR;
        const vx = this.rb ? this.rb.linearVelocity.x : 0;
        return Math.abs(vx) > 10 ? AnimState.WALK : AnimState.IDLE;
    }

    private getFrameNames(): string[] {
        const isBig = this.player.isTransforming
            ? this.player.displayBig
            : this.player.playerState === PlayerState.BIG;
        return (isBig ? FRAMES.big : FRAMES.small)[this.currentAnim];
    }
}
