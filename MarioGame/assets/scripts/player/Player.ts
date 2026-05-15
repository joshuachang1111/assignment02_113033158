import { PlayerState } from './PlayerState';
import GameManager from '../managers/GameManager';
import AudioManager from '../managers/AudioManager';

const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
@requireComponent(cc.RigidBody)
export default class Player extends cc.Component {

    @property
    moveSpeed: number = 200;

    @property
    jumpSpeed: number = 700;

    // Map left edge in world space (Map.x=-640, anchor=0 → left wall at -640).
    // Player collider half-width = 14*scale3/2 = 21, so center limit = -619.
    @property
    mapLeftBoundary: number = -619;

    // ── public state (read by PlayerAnim / enemies / items) ──────────────────
    public playerState: PlayerState = PlayerState.SMALL;
    public isFacingRight: boolean = true;

    // ── private refs / state ─────────────────────────────────────────────────
    private rb: cc.RigidBody = null;
    private col: cc.PhysicsBoxCollider = null;

    // Velocity-based grounded: after a jump, lock out re-jump for 0.75 s so
    // the player can't double-jump at the apex where vy ≈ 0 again.
    private jumpLockout: number = 0;
    private jumpPressed: boolean = false;

    private isInvincible: boolean = false;
    private invincibleTimer: number = 0;

    public isTransforming: boolean = false;
    public displayBig: boolean = false;

    private spawnPos: cc.Vec2 = cc.v2(0, 0);

    // key state map — CC2.4.8 has no cc.sys.isKeyPressed; track via events
    private keys: { [code: number]: boolean } = {};

    // ── lifecycle ────────────────────────────────────────────────────────────

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.rb.fixedRotation = true;
        this.rb.linearDamping = 0;

        this.col = this.getComponent(cc.PhysicsBoxCollider);
        this.applyColliderSize();

        this.spawnPos = cc.v2(this.node.x, this.node.y);

        cc.director.getPhysicsManager().enabledContactListener = true;

        // Move Player to last sibling so it renders on top of the TiledMap.
        // scheduleOnce(0) runs after all nodes finish onLoad.
        this.node.zIndex = 100;
        this.scheduleOnce(() => {
            const parent = this.node.parent;
            if (parent) {
                parent.removeChild(this.node, false);
                parent.addChild(this.node);
                this.node.zIndex = 100;
            }
        }, 0);

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP,   this.onKeyUp,   this);
    }

    onDestroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP,   this.onKeyUp,   this);
    }

    private onKeyDown(e: cc.Event.EventKeyboard) { this.keys[e.keyCode] = true;  }
    private onKeyUp  (e: cc.Event.EventKeyboard) { this.keys[e.keyCode] = false; }
    private key(code: number): boolean { return !!this.keys[code]; }

    // ── contact callbacks — kept for Stage 4/5 (enemies, blocks) ────────────

    onBeginContact(_c: cc.PhysicsContact, _self: cc.PhysicsCollider, _other: cc.PhysicsCollider) {}
    onEndContact  (_c: cc.PhysicsContact, _self: cc.PhysicsCollider, _other: cc.PhysicsCollider) {}

    // ── getters ───────────────────────────────────────────────────────────────

    // Velocity-based: standing on ground → vy ≈ 0.
    // jumpLockout prevents double-jump at the apex where vy briefly ≈ 0 again.
    get isGrounded(): boolean {
        if (this.jumpLockout > 0) return false;
        return Math.abs(this.rb.linearVelocity.y) < 15;
    }

    get rigidbody(): cc.RigidBody { return this.rb; }

    // ── update ────────────────────────────────────────────────────────────────

    update(dt: number) {
        if (this.playerState === PlayerState.DEAD) return;
        if (this.jumpLockout > 0) this.jumpLockout -= dt;
        this.handleInvincible(dt);
        this.handleMovement();
        this.enforceLeftBoundary();
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private handleMovement() {
        if (this.isTransforming) {
            this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
            return;
        }
        const left  = this.key(cc.macro.KEY.left)  || this.key(cc.macro.KEY.a);
        const right = this.key(cc.macro.KEY.right) || this.key(cc.macro.KEY.d);
        const jumpDown = this.key(cc.macro.KEY.up)
                      || this.key(cc.macro.KEY.w)
                      || this.key(cc.macro.KEY.space);

        const jumpJustPressed = jumpDown && !this.jumpPressed;
        this.jumpPressed = jumpDown;

        let vx = 0;
        if (right)     { vx =  this.moveSpeed; this.isFacingRight = true;  }
        else if (left) { vx = -this.moveSpeed; this.isFacingRight = false; }

        if (jumpJustPressed && this.isGrounded) {
            this.rb.linearVelocity = cc.v2(vx, this.jumpSpeed);
            this.jumpLockout = 0.75;   // blocks re-jump until past the apex
            AudioManager.playSFX(AudioManager.I?.sfxJump);
        } else {
            this.rb.linearVelocity = cc.v2(vx, this.rb.linearVelocity.y);
        }
    }

    private handleInvincible(dt: number) {
        if (!this.isInvincible) return;
        this.invincibleTimer -= dt;
        // flash: alternate full / dim opacity
        this.node.opacity = Math.floor(this.invincibleTimer * 10) % 2 === 0 ? 255 : 80;
        if (this.invincibleTimer <= 0) {
            this.isInvincible = false;
            this.node.opacity = 255;
        }
    }

    private enforceLeftBoundary() {
        const worldX = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
        if (worldX < this.mapLeftBoundary) {
            // Stop leftward velocity and push node back to boundary
            if (this.rb.linearVelocity.x < 0) {
                this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
            }
            const localBound = this.node.parent
                ? this.node.parent.convertToNodeSpaceAR(cc.v2(this.mapLeftBoundary, 0)).x
                : this.mapLeftBoundary;
            this.node.x = localBound;
        }
    }

    private applyColliderSize() {
        if (!this.col) return;
        if (this.playerState === PlayerState.BIG) {
            this.col.size   = cc.size(14, 26);
            this.col.offset = cc.v2(0, 13);
        } else {
            this.col.size   = cc.size(14, 16);
            this.col.offset = cc.v2(0, 8);
        }
        this.col.friction = 0;   // prevent wall-sticking caused by side friction
        this.col.apply();
    }

    private startInvincible(duration: number) {
        this.isInvincible = true;
        this.invincibleTimer = duration;
    }

    // ── public API (called by enemies / items / DeathZone) ────────────────────

    takeDamage() {
        if (this.isInvincible || this.playerState === PlayerState.DEAD) return;
        if (this.isTransforming) return;
        if (this.playerState === PlayerState.BIG) {
            this.startTransformAnim(false);
        } else {
            this.die();
        }
    }

    die() {
        if (this.playerState === PlayerState.DEAD) return;
        this.playerState = PlayerState.DEAD;
        this.groundContacts = 0;
        AudioManager.stopBGM();
        AudioManager.playSFX(AudioManager.I?.sfxDie);
        // make sensor so player passes through level geometry during death arc
        this.col.sensor = true;
        this.col.apply();
        // small hop then free-fall off screen
        this.rb.linearVelocity = cc.v2(0, 400);
        this.scheduleOnce(() => this.respawn(), 2.5);
    }

    private respawn() {
        this.node.opacity = 255;
        GameManager.loseLife();
        // GameOverUI handles scene reload or game over screen
    }

    growBig() {
        if (this.playerState !== PlayerState.SMALL) return;
        if (this.isTransforming) return;
        this.startTransformAnim(true);
    }

    private startTransformAnim(growingToBig: boolean) {
        this.isTransforming = true;
        this.displayBig     = !growingToBig;   // start from current appearance

        const totalFlashes = 8;
        let   count        = 0;

        const flash = () => {
            count++;
            this.displayBig = (count % 2 === 1) ? growingToBig : !growingToBig;
            if (count >= totalFlashes) {
                this.unschedule(flash);
                this.displayBig     = growingToBig;
                this.isTransforming = false;
                if (growingToBig) {
                    this.playerState = PlayerState.BIG;
                } else {
                    this.playerState = PlayerState.SMALL;
                    AudioManager.playSFX(AudioManager.I?.sfxPowerDown);
                    this.startInvincible(2.0);
                }
                this.applyColliderSize();
            }
        };
        this.schedule(flash, 0.07);
    }

    // Called by enemies when player stomps them — small upward bounce
    stomp() {
        this.jumpLockout = 0.1;
        this.rb.linearVelocity = cc.v2(this.rb.linearVelocity.x, 400);
    }
}
