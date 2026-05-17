import Player from '../player/Player';
import { PlayerState } from '../player/PlayerState';
import AudioManager from '../managers/AudioManager';
import EnemyBase from '../enemies/EnemyBase';

const { ccclass, property } = cc._decorator;

@ccclass
export default class Mushroom extends cc.Component {

    @property(cc.SpriteAtlas)
    atlas: cc.SpriteAtlas = null;

    private rb:              cc.RigidBody = null;
    private player:          Player       = null;
    private direction:       number       = 1;     // start moving right
    private reverseCooldown: number       = 0.15;
    private emergeTimer:     number       = 0.4;   // rise out of block for 0.4s before walking

    // Mushroom: 16×16 local × scale3 = 48×48 world, anchor (0.5, 0)
    // Player small: 42×48 world
    private readonly OVERLAP_X    = 24 + 21 + 8;  // 53
    private readonly OVERLAP_Y    = 24 + 24 + 8;  // 56
    private readonly MOVE_SPEED   = 60;
    private readonly EMERGE_SPEED = 80;

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.rb.fixedRotation  = true;
        this.rb.linearDamping  = 0;
        const col = this.getComponent(cc.PhysicsBoxCollider);
        if (col) { col.friction = 0; col.apply(); }
        cc.director.getPhysicsManager().enabledContactListener = true;
    }

    start() {
        const byPath = cc.find('Canvas/World/Player');
        if (byPath) {
            this.player = byPath.getComponent(Player);
        } else {
            const found = cc.director.getScene().getComponentsInChildren(Player);
            if (found && found.length > 0) this.player = found[0];
        }
        const sprite = this.getComponent(cc.Sprite);
        if (sprite && this.atlas) {
            const f = this.atlas.getSpriteFrame('items_46')
                   || this.atlas.getSpriteFrame('items_46.png');
            if (f) sprite.spriteFrame = f;
        }
    }

    update(dt: number) {
        // Fell into a pit — destroy silently
        if (this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y < -500) {
            this.node.destroy();
            return;
        }

        // Rise phase: emerge upward from the block
        if (this.emergeTimer > 0) {
            this.emergeTimer -= dt;
            this.rb.linearVelocity = cc.v2(0, this.EMERGE_SPEED);
            return;
        }

        // Normal walk phase: same velocity-stuck reversal as EnemyBase
        if (this.reverseCooldown > 0) this.reverseCooldown -= dt;

        const vx = this.rb.linearVelocity.x;
        if (Math.abs(vx) < 5 && this.reverseCooldown <= 0) {
            this.direction *= -1;
            this.reverseCooldown = 0.3;
        }

        this.rb.linearVelocity = cc.v2(this.direction * this.MOVE_SPEED, this.rb.linearVelocity.y);

        this.checkPlayerOverlap();
    }

    // Disable physical collision with enemies so mushroom passes through them
    onPreSolve(
        contact: cc.PhysicsContact,
        _self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (other.node.getComponent(EnemyBase)) {
            contact.disabled = true;
        }
    }

    // Contact callback for wall reversal (same as EnemyBase)
    onBeginContact(
        contact: cc.PhysicsContact,
        _self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        // Enemies pass through mushroom — don't change direction on enemy contact
        if (other.node.getComponent(EnemyBase)) return;
        if (this.emergeTimer > 0 || this.reverseCooldown > 0) return;
        try {
            const normal = contact.getWorldManifold().normal;
            if (Math.abs(normal.x) > 0.7) {
                this.direction *= -1;
                this.reverseCooldown = 0.3;
            }
        } catch (_e) {}
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private checkPlayerOverlap() {
        if (!this.player) return;
        if (this.player.playerState === PlayerState.DEAD) return;

        const myPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const pPos  = this.player.node.convertToWorldSpaceAR(cc.Vec2.ZERO);

        const dx = Math.abs(myPos.x - pPos.x);

        // Half-heights in world space: mushroom=24, SMALL=24, BIG=39
        const playerHalfH = this.player.playerState === PlayerState.BIG ? 39 : 24;
        const overlapY    = 24 + playerHalfH + 8;
        const dy = Math.abs((myPos.y + 24) - (pPos.y + playerHalfH));

        if (dx > this.OVERLAP_X || dy > overlapY) return;

        AudioManager.playSFX(AudioManager.I?.sfxPowerUp);
        this.player.growBig();
        this.node.destroy();
    }
}
