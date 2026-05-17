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

    // Collider dimensions (local units; prefab scale = 3 → multiply by 3 for world)
    private readonly WALK_COL_H  = 24;
    private readonly WALK_COL_OY = 12;
    private readonly SHELL_COL_H  = 14;
    private readonly SHELL_COL_OY = 7;

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

            case TurtleState.SHELL_SLIDING: {
                // velocity-stuck fallback: if shell got blocked and vx collapsed, reverse
                const vx = this.rb.linearVelocity.x;
                if (Math.abs(vx) < 30 && this.hitCooldown <= 0) {
                    this.direction *= -1;
                    this.hitCooldown = 0.2;
                }
                this.rb.linearVelocity = cc.v2(
                    this.direction * this.SLIDE_SPEED,
                    this.rb.linearVelocity.y
                );
                // Enemies don't physically collide with each other, so use proximity scan
                this.checkEnemyKill();
                this.checkPlayerOverlap();
                break;
            }
        }
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (this.isDead) return;

        if (this.turtleState === TurtleState.SHELL_SLIDING) {
            // Kill enemy on contact
            const enemy = other.node.getComponent(EnemyBase);
            if (enemy && !enemy['isDead'] && other.node !== this.node) {
                GameManager.addScore(100);
                AudioManager.playSFX(AudioManager.I?.sfxStomp);
                other.node.destroy();
                return;
            }
            // Wall reversal via contact normal (velocity-stuck in update() is backup)
            try {
                const normal = contact.getWorldManifold().normal;
                if (Math.abs(normal.x) >= 0.6) this.direction *= -1;
            } catch (_e) {}
            return;
        }

        // Stomp detection at contact moment — position-only check is reliable here
        // because physics contact only fires when the bodies are actually touching.
        // A player above myWorldY + threshold AND in contact must be landing from above.
        const playerComp = other.node.getComponent(Player);
        if (playerComp && this.hitCooldown <= 0 && playerComp.playerState !== PlayerState.DEAD) {
            const myWorldY = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y;
            const pWorldY  = playerComp.node.convertToWorldSpaceAR(cc.Vec2.ZERO).y;
            const stompThreshold = this.turtleState === TurtleState.SHELL_IDLE ? 15 : 40;

            if (pWorldY > myWorldY + stompThreshold) {
                this.handleStomp(playerComp);
                return;
            }
        }

        if (this.turtleState === TurtleState.WALKING) {
            super.onBeginContact(contact, self, other);
        }
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private handleStomp(playerComp: Player) {
        switch (this.turtleState) {
            case TurtleState.WALKING:
                this.enterShell();
                playerComp.stomp();
                GameManager.addScore(100);
                AudioManager.playSFX(AudioManager.I?.sfxStomp);
                this.hitCooldown = 0.3;
                break;

            case TurtleState.SHELL_SLIDING:
                // Stomp on sliding shell → stop it (back to idle)
                this.enterShell();
                playerComp.stomp();
                GameManager.addScore(100);
                AudioManager.playSFX(AudioManager.I?.sfxStomp);
                this.hitCooldown = 0.3;
                break;

            case TurtleState.SHELL_IDLE:
                // Stomp on idle shell → completely destroy
                playerComp.stomp();
                GameManager.addScore(100);
                AudioManager.playSFX(AudioManager.I?.sfxStomp);
                this.die();
                this.scheduleOnce(() => this.node.destroy(), 0.3);
                this.hitCooldown = 0.3;
                break;
        }
    }

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
        const stompLine = myPos.y + (this.turtleState === TurtleState.SHELL_IDLE ? 20 : 45);
        const isStomp   = playerVy < -1 && pPos.y > stompLine;

        switch (this.turtleState) {
            case TurtleState.WALKING:
                if (isStomp) {
                    this.handleStomp(this.player);
                } else {
                    this.player.takeDamage();
                    this.hitCooldown = 0.5;
                }
                break;

            case TurtleState.SHELL_IDLE:
                if (isStomp) {
                    this.handleStomp(this.player);
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
                    this.handleStomp(this.player);
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

        // Shrink collider to shell size
        this.col.size   = cc.size(this.col.size.width, this.SHELL_COL_H);
        this.col.offset = cc.v2(0, this.SHELL_COL_OY);
        this.col.apply();

        this.setFrame(this.SHELL_FRAME);
    }

    private revive() {
        this.turtleState          = TurtleState.WALKING;
        this.edgeDetectionEnabled = true;

        // Restore walk collider
        this.col.size   = cc.size(this.col.size.width, this.WALK_COL_H);
        this.col.offset = cc.v2(0, this.WALK_COL_OY);
        this.col.apply();

        this.setFrame(this.WALK_FRAMES[0]);
    }

    // Proximity-based enemy kill for sliding shell (enemies don't physically collide)
    private checkEnemyKill() {
        const world = cc.find('Canvas/World');
        if (!world) return;
        const myPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);

        for (const child of world.children) {
            if (child === this.node) continue;
            const enemy = child.getComponent(EnemyBase);
            if (!enemy || enemy['isDead']) continue;

            const ePos = child.convertToWorldSpaceAR(cc.Vec2.ZERO);
            if (Math.abs(myPos.x - ePos.x) < 52 && Math.abs(myPos.y - ePos.y) < 80) {
                GameManager.addScore(100);
                AudioManager.playSFX(AudioManager.I?.sfxStomp);
                child.destroy();
            }
        }
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
