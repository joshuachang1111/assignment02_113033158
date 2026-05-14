import { PlayerState } from './PlayerState';

const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
@requireComponent(cc.RigidBody)
export default class Player extends cc.Component {

    @property
    moveSpeed: number = 200;

    @property
    jumpSpeed: number = 700;

    // ── public state (read by PlayerAnim / enemies / items) ──────────────────
    public playerState: PlayerState = PlayerState.SMALL;
    public isFacingRight: boolean = true;

    // ── private refs / state ─────────────────────────────────────────────────
    private rb: cc.RigidBody = null;
    private col: cc.PhysicsBoxCollider = null;

    private groundContacts: number = 0;
    private jumpPressed: boolean = false;       // tracks "was jump held last frame"

    private isInvincible: boolean = false;
    private invincibleTimer: number = 0;

    private spawnPos: cc.Vec2 = cc.v2(0, 0);

    // ── lifecycle ────────────────────────────────────────────────────────────

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.rb.fixedRotation = true;
        this.rb.linearDamping = 0;

        this.col = this.getComponent(cc.PhysicsBoxCollider);
        this.applyColliderSize();

        this.spawnPos = cc.v2(this.node.x, this.node.y);

        cc.director.getPhysicsManager().enabledContactListener = true;
    }

    // ── contact callbacks (called by Box2D via CC) ────────────────────────────

    onBeginContact(_c: cc.PhysicsContact, _self: cc.PhysicsCollider, _other: cc.PhysicsCollider) {
        this.groundContacts++;
    }

    onEndContact(_c: cc.PhysicsContact, _self: cc.PhysicsCollider, _other: cc.PhysicsCollider) {
        this.groundContacts = Math.max(0, this.groundContacts - 1);
    }

    // ── getters ───────────────────────────────────────────────────────────────

    // Velocity check prevents "grounded" while bonking a ceiling
    get isGrounded(): boolean {
        return this.groundContacts > 0 && this.rb.linearVelocity.y < 50;
    }

    get rigidbody(): cc.RigidBody { return this.rb; }

    // ── update ────────────────────────────────────────────────────────────────

    update(dt: number) {
        if (this.playerState === PlayerState.DEAD) return;
        this.handleInvincible(dt);
        this.handleMovement();
    }

    // ── private helpers ───────────────────────────────────────────────────────

    private handleMovement() {
        const left  = cc.sys.isKeyPressed(cc.macro.KEY.left)  || cc.sys.isKeyPressed(cc.macro.KEY.a);
        const right = cc.sys.isKeyPressed(cc.macro.KEY.right) || cc.sys.isKeyPressed(cc.macro.KEY.d);
        const jumpDown = cc.sys.isKeyPressed(cc.macro.KEY.up)
                      || cc.sys.isKeyPressed(cc.macro.KEY.w)
                      || cc.sys.isKeyPressed(cc.macro.KEY.space);

        const jumpJustPressed = jumpDown && !this.jumpPressed;
        this.jumpPressed = jumpDown;

        let vx = 0;
        if (right)     { vx =  this.moveSpeed; this.isFacingRight = true;  }
        else if (left) { vx = -this.moveSpeed; this.isFacingRight = false; }

        if (jumpJustPressed && this.isGrounded) {
            this.rb.linearVelocity = cc.v2(vx, this.jumpSpeed);
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

    private applyColliderSize() {
        if (!this.col) return;
        if (this.playerState === PlayerState.BIG) {
            this.col.size   = cc.size(14, 26);
            this.col.offset = cc.v2(0, 13);
        } else {
            this.col.size   = cc.size(14, 16);
            this.col.offset = cc.v2(0, 8);
        }
        this.col.apply();
    }

    private startInvincible(duration: number) {
        this.isInvincible = true;
        this.invincibleTimer = duration;
    }

    // ── public API (called by enemies / items / DeathZone) ────────────────────

    takeDamage() {
        if (this.isInvincible || this.playerState === PlayerState.DEAD) return;
        if (this.playerState === PlayerState.BIG) {
            this.playerState = PlayerState.SMALL;
            this.applyColliderSize();
            this.startInvincible(2.0);
        } else {
            this.die();
        }
    }

    die() {
        if (this.playerState === PlayerState.DEAD) return;
        this.playerState = PlayerState.DEAD;
        this.groundContacts = 0;
        // make sensor so player passes through level geometry during death arc
        this.col.sensor = true;
        this.col.apply();
        // small hop then free-fall off screen
        this.rb.linearVelocity = cc.v2(0, 400);
        this.scheduleOnce(() => this.respawn(), 2.5);
    }

    private respawn() {
        this.playerState = PlayerState.SMALL;
        this.node.setPosition(this.spawnPos.x, this.spawnPos.y);
        this.rb.linearVelocity = cc.v2(0, 0);
        this.groundContacts = 0;
        this.node.opacity = 255;
        this.col.sensor = false;
        this.applyColliderSize();
        this.startInvincible(2.0);
        // TODO Stage 6: GameManager.getInstance().loseLife()
    }

    growBig() {
        if (this.playerState !== PlayerState.SMALL) return;
        this.playerState = PlayerState.BIG;
        this.applyColliderSize();
    }
}
