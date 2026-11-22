/**
 * Projectile - Special attack energy projectile.
 */
class Projectile {
  constructor(x, y, vx, vy, facing, owner, color = '#00f0ff', damage = 180) {
    this.x = x;
    this.y = y;
    this.vx = vx * facing;
    this.vy = vy;
    this.facing = facing;
    this.owner = owner;
    this.color = color;
    this.damage = damage;
    this.radius = 16;
    this.lifetime = 1.8;
    this.spent = false;
    this.time = 0;
  }

  update(dt) {
    this.time += dt;
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.spent = true;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Trail particle
    if (window.particleSystem && Math.random() > 0.3) {
      window.particleSystem.particles.push({
        type: 'plasma',
        x: this.x - this.facing * 12 + (Math.random() - 0.5) * 8,
        y: this.y + (Math.random() - 0.5) * 8,
        vx: -this.vx * 0.15,
        vy: (Math.random() - 0.5) * 40,
        size: Math.random() * 4 + 2,
        color: this.color,
        alpha: 0.8,
        life: 0.25,
        maxLife: 0.25,
        gravity: 0
      });
    }
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  toHitbox() {
    return new Hitbox(
      this.x - this.radius,
      this.y - this.radius,
      this.radius * 2,
      this.radius * 2,
      this.damage,
      380, // Knockback X
      -180, // Knockback Y (launch)
      0.4, // Hitstun
      4 // Special Attack Type
    );
  }

  render(ctx) {
    if (this.spent) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    // Glowing energy core
    const pulse = 1 + Math.sin(this.time * 20) * 0.15;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;

    // Outer aura
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 1.4 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.8 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Horizontal energy spikes
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.moveTo(this.facing * 28, 0);
    ctx.lineTo(-this.facing * 14, -8);
    ctx.lineTo(-this.facing * 14, 8);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
