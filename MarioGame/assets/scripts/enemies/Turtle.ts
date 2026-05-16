import EnemyBase from './EnemyBase';
import Player from '../player/Player';
import { PlayerState } from '../player/PlayerState';
import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';

const { ccclass, property } = cc._decorator;

const enum TurtleState { WALKING, SHELL_IDLE, SHELL_SLIDING }

@ccclass
export default class Turtle extends EnemyBase {

    @property(cc.SpriteAtlas)
    atlas: cc.SpriteAtlas = null;

    private sprite: cc.Sprite = null;
    private turtleState: TurtleState = TurtleState.WALKING;
    private player: Player = null;
    private frameTimer: number = 0;
    private frameIndex: number = 0;
    private hitCooldown: number = 0;
    private shellIdleTimer: number = 0;

    private readonly WALK_FRAMES    = ['turtle_0', 'turtle_1'];
    private readonly SHELL_FRAME    = 'turtle_3';
    private readonly FRAME_INTERVAL = 0.25;
    private readonly SLIDE_SPEED    = 350;
    private readonly SHELL_IDLE_TIME = 5.0;

    // Turtle ~16×24 px × scale3 = 48×72 world, anchor bottom-center
    private readonly OVERLAP_X = 24 + 21;
    private readonly OVERLAP_Y = 36 + 24;

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        super.onLoad();
        this.sprite = this.getComponent(cc.Sprite);
        this.setFrame(this.WALK_FRAMES[0]);
    }

    start() {
        const byPath = cc.find('Canvas/World/Player');
        if (byPath) {
            this.player = byPath.getComponent(Player);
        } else {
            const found = cc.director.getScene().getComponentsInChildren(Player);
            if (found && found.length > 0) this.player = found[0];
        }
    }

    update(dt: number) {
        if (this.hitCooldown > 0) this.hitCooldown -= dt;

        if (this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y < -500) {
            this.node.destroy();
            return;
        }

        switch (this.turtleState) {
            case TurtleState.WALKING:
                super.update(dt);
                if (!this.isDead) {
                    this.updateWalkAnim(dt);
                    this.checkPlayerOverlap();
                }
                break;

            case TurtleState.SHELL_IDLE:
                this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
                this.checkPlayerOverlap();
                this.shellIdleTimer -= dt;
                if (this.shellIdleTimer <= 0) this.revive();
                break;

            case TurtleState.SHELL_SLIDING:
                this.rb.linearVelocity = cc.v2(
                    this.direction * this.SLIDE_SPEED,
                    this.rb.linearVelocity.y
                );
                this.checkPlayerOverlap();
                break;
        }
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (this.turtleState === TurtleState.SHELL_SLIDING) {
            // Kill enemy on contact
            const enemy = other.node.getComponent(EnemyBase);
            if (enemy && !enemy['isDead'] && other.node !== this.node) {
                GameManager.addScore(100);
                AudioManager.playSFX(AudioManager.I?.sfxStomp);
                other.node.destroy();
                return;
            }
            // Wall reversal
            try {
                const normal = contact.getWorldManifold().normal;
                if (Math.abs(normal.x) > 0.7) this.direction *= -1;
            } catch (_e) {}
            return;
        }

        if (this.turtleState === TurtleState.WALKING) {
            super.onBeginContact(contact, self, other);
        }
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private checkPlayerOverlap() {
        if (!this.player || this.hitCooldown > 0) return;
        if (this.player.playerState === PlayerState.DEAD) return;

        const myPos    = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const myCenter = cc.v2(myPos.x, myPos.y + 36);

        const pPos        = this.player.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const playerHalfH = this.player.playerState === PlayerState.BIG ? 39 : 24;
        const pCenter     = cc.v2(pPos.x, pPos.y + playerHalfH);

        const dx = Math.abs(myCenter.x - pCenter.x);
        const dy = Math.abs(myCenter.y - pCenter.y);
        if (dx > this.OVERLAP_X + 8 || dy > this.OVERLAP_Y + 8) return;

        const playerVy  = this.player.rigidbody.linearVelocity.y;
        const stompLine = myPos.y + (this.turtleState === TurtleState.SHELL_IDLE ? 20 : 50);
        const isStomp   = playerVy < -10 && pPos.y > stompLine;

        switch (this.turtleState) {
            case TurtleState.WALKING:
                if (isStomp) {
                    this.enterShell();
                    this.player.stomp();
                    GameManager.addScore(100);
                    AudioManager.playSFX(AudioManager.I?.sfxStomp);
                } else {
                    this.player.takeDamage();
                    this.hitCooldown = 0.5;
                }
                break;

            case TurtleState.SHELL_IDLE:
                if (isStomp) {
                    // Stomp on idle shell — player bounces, shell stays
                    this.player.stomp();
                    this.hitCooldown = 0.3;
                } else {
                    // Kick shell
                    this.direction = pCenter.x < myCenter.x ? 1 : -1;
                    this.turtleState = TurtleState.SHELL_SLIDING;
                    AudioManager.playSFX(AudioManager.I?.sfxKick);
                    this.hitCooldown = 0.5;
                }
                break;

            case TurtleState.SHELL_SLIDING:
                if (isStomp) {
                    // Stop sliding shell
                    this.enterShell();
                    this.player.stomp();
                    this.hitCooldown = 0.5;
                } else {
                    this.player.takeDamage();
                    this.hitCooldown = 0.5;
                }
                break;
        }
    }

    private enterShell() {
        this.turtleState          = TurtleState.SHELL_IDLE;
        this.shellIdleTimer       = this.SHELL_IDLE_TIME;
        this.edgeDetectionEnabled = false;
        this.rb.linearVelocity    = cc.v2(0, this.rb.linearVelocity.y);
        this.setFrame(this.SHELL_FRAME);
    }

    private revive() {
        this.turtleState          = TurtleState.WALKING;
        this.edgeDetectionEnabled = true;
        this.setFrame(this.WALK_FRAMES[0]);
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
        const f = this.atlas.getSpriteFrame(name)
               || this.atlas.getSpriteFrame(name + '.png');
        if (f) this.sprite.spriteFrame = f;
    }
}
