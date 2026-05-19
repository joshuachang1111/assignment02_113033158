const { ccclass, property, requireComponent } = cc._decorator;

@ccclass
@requireComponent(cc.RigidBody)
export default class EnemyBase extends cc.Component {

    @property
    moveSpeed: number = 80;

    @property
    mapLeftBoundary: number = -613;

    // How far ahead (px, world space) to probe for a missing floor
    @property
    edgeSensorOffset: number = 28;

    protected direction: number = -1;   // -1 = left, +1 = right
    protected rb: cc.RigidBody = null;
    protected col: cc.PhysicsBoxCollider = null;
    protected isDead: boolean = false;
    get dead(): boolean { return this.isDead; }

    // Subclasses can disable edge detection (e.g. Turtle shell states)
    protected edgeDetectionEnabled: boolean = true;

    // Start > 0 so the frame-1 velocity (still 0) doesn't trigger stuck-detection
    private reverseCooldown: number = 0.15;

    // ── lifecycle ─────────────────────────────────────────────────────────────

    onLoad() {
        this.rb = this.getComponent(cc.RigidBody);
        this.rb.fixedRotation = true;
        this.rb.linearDamping = 0;
        this.col = this.getComponent(cc.PhysicsBoxCollider);
        cc.director.getPhysicsManager().enabledContactListener = true;
        this.node.group = 'enemy';
    }

    update(dt: number) {
        if (this.isDead) return;

        const worldPos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);

        // Fell into a pit — destroy silently (no score)
        if (worldPos.y < -500) {
            this.node.destroy();
            return;
        }

        if (this.reverseCooldown > 0) this.reverseCooldown -= dt;

        // Left map boundary — reverse if past the edge
        if (worldPos.x <= this.mapLeftBoundary && this.direction < 0 && this.reverseCooldown <= 0) {
            this.direction = 1;
            this.reverseCooldown = 0.3;
        }

        // Platform edge detection (only when roughly on ground, vy ≈ 0)
        if (this.edgeDetectionEnabled && this.reverseCooldown <= 0 && Math.abs(this.rb.linearVelocity.y) < 15) {
            if (this.isAtEdge(worldPos)) {
                this.direction *= -1;
                this.reverseCooldown = 0.5;
            }
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

        // Horizontal flip: sprite faces LEFT by default (scaleX > 0 = facing left)
        const absScale = Math.abs(this.node.scaleX);
        this.node.scaleX = absScale * (this.direction < 0 ? 1 : -1);
    }

    // Mushroom should pass through enemies — disable physical impulse from both sides
    onPreSolve(
        contact: cc.PhysicsContact,
        _self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (other.node.getComponent('Mushroom')) {
            contact.disabled = true;
        }
    }

    // Contact callback kept for pipe / raised-platform walls
    onBeginContact(
        contact: cc.PhysicsContact,
        _self: cc.PhysicsCollider,
        other: cc.PhysicsCollider
    ) {
        if (this.isDead) return;
        // Ignore mushroom contacts — mushroom passes through enemies
        if (other.node.getComponent('Mushroom')) return;
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

    // ── edge detection ────────────────────────────────────────────────────────

    // Cast a ray downward from just ahead of the enemy's front foot.
    // Returns true if no static ground is found below (= we are at an edge).
    private isAtEdge(worldPos: cc.Vec2): boolean {
        const sensorX = worldPos.x + this.direction * this.edgeSensorOffset;
        const start   = cc.v2(sensorX, worldPos.y + 5);
        const end     = cc.v2(sensorX, worldPos.y - 60);
        const pm      = cc.director.getPhysicsManager();
        const results = pm.rayCast(start, end, cc.RayCastType.Any);
        return !results.some(r => {
            if (!r.collider || !r.collider.node) return false;
            if (r.collider.node === this.node) return false;
            const rb = r.collider.node.getComponent(cc.RigidBody);
            return rb && rb.type === cc.RigidBodyType.Static;
        });
    }
}
