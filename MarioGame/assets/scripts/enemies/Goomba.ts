import EnemyBase from './EnemyBase';
import Player from '../player/Player';
import { PlayerState } from '../player/PlayerState';

const { ccclass, property } = cc._decorator;

@ccclass
export default class Goomba extends EnemyBase {

    @property(cc.SpriteAtlas)
    atlas: cc.SpriteAtlas = null;

    private sprite: cc.Sprite = null;
    private frameTimer: number = 0;
    private frameIndex: number = 0;
    private player: Player = null;
    private hitCooldown: number = 0;

    private readonly WALK_FRAMES    = ['Goomba_0', 'Goomba_1'];
    private readonly SQUISH_FRAME   = 'Goomba_2';
    private readonly FRAME_INTERVAL = 0.2;

    // Goomba sprite 18×22 px × scale 3 → world 54×66, anchor (0.5, 0)
    // Player collider small 14×16 px × scale 3 → world 42×48, anchor (0.5, 0)
    private readonly OVERLAP_X = 27 + 21;   // half-widths sum
    private readonly OVERLAP_Y = 33 + 24;   // half-heights sum

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        super.onLoad();
        this.sprite = this.getComponent(cc.Sprite);
        this.setFrame(this.WALK_FRAMES[0]);
    }

    start() {
        // Try explicit path first; fall back to scene-wide search
        const byPath = cc.find('Canvas/World/Player');
        if (byPath) {
            this.player = byPath.getComponent(Player);
        } else {
            const found = cc.director.getScene().getComponentsInChildren(Player);
            if (found && found.length > 0) this.player = found[0];
        }
    }

    update(dt: number) {
        super.update(dt);
        if (this.hitCooldown > 0) this.hitCooldown -= dt;
        if (!this.isDead) {
            this.updateWalkAnim(dt);
            this.checkPlayerOverlap();
        }
    }

    // Wall-reversal only — player logic moved to per-frame overlap check
    onBeginContact(
        contact: cc.PhysicsContact,
        self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        super.onBeginContact(contact, self, other);
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private checkPlayerOverlap() {
        if (!this.player || this.hitCooldown > 0) return;
        if (this.player.playerState === PlayerState.DEAD) return;

        // Goomba center in world space (anchor bottom-center → center is 33 up)
        const myPos    = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const myCenter = cc.v2(myPos.x, myPos.y + 33);

        // Player bottom-center in world space (center is 24 up for small)
        const pPos    = this.player.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const pCenter = cc.v2(pPos.x, pPos.y + 24);

        const dx = Math.abs(myCenter.x - pCenter.x);
        const dy = Math.abs(myCenter.y - pCenter.y);

        // +8 buffer: Box2D resolves bodies to exact contact (dx == OVERLAP_X),
        // which the strict >= check would miss. Buffer ensures contact always fires.
        if (dx > this.OVERLAP_X + 8 || dy > this.OVERLAP_Y + 8) return;

        const playerVy = this.player.rigidbody.linearVelocity.y;

        // Stomp: falling AND player bottom above 75% of Goomba height (near the top)
        // Using 75% (myPos.y + 50) prevents mid-air side contacts from being misclassified
        const stompLine = myPos.y + 50;
        if (playerVy < -10 && pPos.y > stompLine) {
            this.onStomped();
        } else {
            this.player.takeDamage();
            this.hitCooldown = 0.5;
        }
    }

    private onStomped() {
        this.die();
        this.setFrame(this.SQUISH_FRAME);
        this.player.stomp();
        // TODO Stage 6: GameManager.getInstance().addScore(100);
        this.scheduleOnce(() => this.node.destroy(), 0.4);
    }

    private updateWalkAnim(dt: number) {
        this.frameTimer += dt;
        if (this.frameTimer >= this.FRAME_INTERVAL) {
            this.frameTimer = 0;
            this.frameIndex = (this.frameIndex + 1) % this.WALK_FRAMES.length;
            this.setFrame(this.WALK_FRAMES[this.frameIndex]);
        }
    }

    private setFrame(name: string) {
        if (!this.atlas || !this.sprite) return;
        const frame = this.atlas.getSpriteFrame(name)
                   || this.atlas.getSpriteFrame(name + '.png');
        if (frame) this.sprite.spriteFrame = frame;
    }
}
