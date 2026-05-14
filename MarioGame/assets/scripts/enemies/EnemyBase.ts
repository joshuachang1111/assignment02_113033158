const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
@requireComponent(cc.RigidBody)
export default class EnemyBase extends cc.Component {

    @property
    moveSpeed: number = 80;

    // Map left edge (-640) + Goomba half-width (27) = -613; use -619 as safe default
    @property
    mapLeftBoundary: number = -613;

    protected direction: number = -1;   // -1 = left, +1 = right
    protected rb: cc.RigidBody = null;
    protected col: cc.PhysicsBoxCollider = null;
    protected isDead: boolean = false;
    // Start > 0 so the frame-1 velocity (still 0) doesn't trigger stuck-detection
    private reverseCooldown: number = 0.15;

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.rb.fixedRotation = true;
        this.rb.linearDamping = 0;
        this.col = this.getComponent(cc.PhysicsBoxCollider);
        cc.director.getPhysicsManager().enabledContactListener = true;
    }

    update(dt: number) {
        if (this.isDead) return;
        if (this.reverseCooldown > 0) this.reverseCooldown -= dt;

        // Left map boundary — reverse if past the edge
        const worldX = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO).x;
        if (worldX <= this.mapLeftBoundary && this.direction < 0 && this.reverseCooldown <= 0) {
            this.direction = 1;
            this.reverseCooldown = 0.3;
        }

        // Velocity-stuck: only fire once per cooldown window so we don't oscillate
        const vx = this.rb.linearVelocity.x;
        if (Math.abs(vx) < 5 && this.reverseCooldown <= 0) {
            this.direction *= -1;
            this.reverseCooldown = 0.3;
        }

        this.rb.linearVelocity = cc.v2(
            this.direction * this.moveSpeed,
            this.rb.linearVelocity.y
        );
    }

    // Contact callback kept for pipe / raised-platform walls
    onBeginContact(
        contact: cc.PhysicsContact,
        _self: cc.PhysicsCollider,
        _other: cc.PhysicsCollider
    ) {
        if (this.isDead) return;
        if (this.reverseCooldown > 0) return;
        try {
            const normal = contact.getWorldManifold().normal;
            if (Math.abs(normal.x) > 0.7) {
                this.direction *= -1;
                this.reverseCooldown = 0.3;
            }
        } catch (_e) {}
    }

    // ── shared death logic ────────────────────────────────────────────────────

    protected die() {
        this.isDead = true;
        this.rb.linearVelocity = cc.v2(0, this.rb.linearVelocity.y);
        this.col.sensor = true;
        this.col.apply();
    }
}
