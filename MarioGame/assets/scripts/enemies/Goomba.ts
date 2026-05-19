import EnemyBase from './EnemyBase';
import Player from '../player/Player';
import { PlayerState } from '../player/PlayerState';
import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';

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

        // Goomba geometry (anchor bottom-center, world space)
        // 18×22 px × scale3 = 54×66 world
        const myPos     = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const myCenter  = cc.v2(myPos.x, myPos.y + 33);
        const goombaTop = myPos.y + 66;

        // Player geometry
        const pPos        = this.player.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const playerHalfH = this.player.playerState === PlayerState.BIG ? 39 : 24;
        const pCenter     = cc.v2(pPos.x, pPos.y + playerHalfH);

        // X range check first (early exit)
        const dx = Math.abs(myCenter.x - pCenter.x);
        if (dx > this.OVERLAP_X + 8) return;

        const playerVy  = this.player.rigidbody.linearVelocity.y;
        const stompLine = myPos.y + 49;   // 75% of Goomba height

        // ── Stomp: use player BOTTOM (pPos.y) vs Goomba geometry ─────────────
        // pPos.y must be within [stompLine, goombaTop + 12] — player bottom
        // must be near or at the actual Goomba hitbox top (12px tolerance for
        // one physics step at normal fall speed).
        if (pPos.y >= stompLine && pPos.y <= goombaTop + 12 && playerVy <= 100) {
            this.onStomped();
            return;
        }

        // ── Damage: standard AABB, player not above stomp line ───────────────
        const dy = Math.abs(myCenter.y - pCenter.y);
        if (dy > this.OVERLAP_Y + 8) return;
        if (pPos.y > stompLine) return;   // above stomp line but not in stomp window

        this.player.takeDamage();
        this.hitCooldown = 0.5;
    }

    private onStomped() {
        this.die();
        this.setFrame(this.SQUISH_FRAME);
        this.player.stomp();
        GameManager.addScore(100);
        AudioManager.playSFX(AudioManager.I?.sfxStomp);
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
