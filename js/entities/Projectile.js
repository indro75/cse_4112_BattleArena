/**
 * Projectile - High-fidelity animated special attack energy projectile.
 * Features distinct visual forms for the Hero (Dragon Crescent Blade Wave)
 * and Villain (Demonic Dark Matter Singularity Skull).
 */
class Projectile {
  constructor(x, y, vx, vy, facing, owner, color = '#00f0ff', damage = 185) {
    this.x = x;
    this.y = y;
    this.vx = vx * facing;
    this.vy = vy;
    this.facing = facing;
    this.owner = owner;
    this.type = owner ? owner.type : 'hero';
    this.color = color;
    this.damage = damage;
    this.radius = 20;
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

    // Rich particle trail
    if (window.particleSystem && Math.random() > 0.25) {
      const trailColor = this.type === 'hero' ? '#00f0ff' : '#ff0055';
      const accent = this.type === 'hero' ? '#ffffff' : '#ff8800';

      window.particleSystem.particles.push({
        type: 'plasma',
        x: this.x - this.facing * 16 + (Math.random() - 0.5) * 12,
        y: this.y + (Math.random() - 0.5) * 14,
        vx: -this.vx * 0.12 + (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 50,
        size: Math.random() * 5 + 2,
        color: Math.random() > 0.4 ? trailColor : accent,
        alpha: 0.9,
        life: 0.28,
        maxLife: 0.28,
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
      390, // Knockback X
      -190, // Knockback Y (launch)
      0.45, // Hitstun
      4 // Special Attack Type
    );
  }

  render(ctx) {
    if (this.spent) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    if (this.type === 'hero') {
      this.renderHeroBladeWave(ctx);
    } else {
      this.renderVillainDemonicSkull(ctx);
    }

    ctx.restore();
  }

  /* ==========================================================
     HERO: DRAGON CRESCENT PLASMA WAVE
     ========================================================== */
  renderHeroBladeWave(ctx) {
    const pulse = 1 + Math.sin(this.time * 24) * 0.12;

    ctx.save();
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 24 * pulse;

    // 1. Outer Electric Energy Crescent
    ctx.fillStyle = '#00f0ff';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, 32 * pulse, -Math.PI * 0.55, Math.PI * 0.55);
    ctx.quadraticCurveTo(8, 0, 0, -32 * pulse);
    ctx.closePath();
    ctx.fill();

    // 2. Razor-Sharp White-Hot Cutting Edge
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6, 0, 26 * pulse, -Math.PI * 0.48, Math.PI * 0.48);
    ctx.quadraticCurveTo(12, 0, 6, -26 * pulse);
    ctx.closePath();
    ctx.fill();

    // 3. Electric Lightning Ribs across the crescent
    ctx.strokeStyle = '#66ffff';
    ctx.lineWidth = 2.5;
    const a1 = Math.sin(this.time * 16) * 0.2;
    ctx.beginPath();
    ctx.moveTo(14, -20);
    ctx.lineTo(24 + a1 * 10, 0);
    ctx.lineTo(14, 20);
    ctx.stroke();

    // 4. Trailing Dragon Energy Fins
    ctx.fillStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(-32, -8);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-32, 8);
    ctx.lineTo(-10, 18);
    ctx.closePath();
    ctx.fill();

    // 5. Soundwave / Shock Ring
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(8, 0, 8, 28 * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  /* ==========================================================
     VILLAIN: DEMONIC DARK MATTER SKULL
     ========================================================== */
  renderVillainDemonicSkull(ctx) {
    const pulse = 1 + Math.sin(this.time * 20) * 0.16;

    ctx.save();
    ctx.shadowColor = '#ff0055';
    ctx.shadowBlur = 28 * pulse;

    // 1. Dark Matter Outer Fire Vortex
    const vortexGrad = ctx.createRadialGradient(0, 0, 8, 0, 0, 34 * pulse);
    vortexGrad.addColorStop(0, '#ffffff');
    vortexGrad.addColorStop(0.3, '#ff0055');
    vortexGrad.addColorStop(0.7, '#660022');
    vortexGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = vortexGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 34 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // 2. Fiery Demonic Skull Horns
    ctx.fillStyle = '#ff2200';
    // Top Horn
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.quadraticCurveTo(22, -26, 32, -24);
    ctx.quadraticCurveTo(16, -16, 2, -14);
    ctx.closePath();
    ctx.fill();

    // Bottom Horn
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.quadraticCurveTo(22, 26, 32, 24);
    ctx.quadraticCurveTo(16, 16, 2, 14);
    ctx.closePath();
    ctx.fill();

    // 3. Glowing Demonic Eye Sockets
    ctx.fillStyle = '#ffea00';
    ctx.shadowColor = '#ffea00';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(10, -6, 4, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(10, 6, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Serrated Plasma Teeth / Mouth
    ctx.fillStyle = '#ffffff';
    for (let i = -8; i <= 8; i += 4) {
      ctx.beginPath();
      ctx.moveTo(18, i);
      ctx.lineTo(24, i + 2);
      ctx.lineTo(18, i + 4);
      ctx.closePath();
      ctx.fill();
    }

    // 5. Dark Matter Black Flame Tendrils trailing backward
    ctx.fillStyle = 'rgba(20, 0, 15, 0.85)';
    ctx.beginPath();
    ctx.moveTo(-10, -14);
    ctx.lineTo(-34, -8 + Math.sin(this.time * 25) * 6);
    ctx.lineTo(-14, 0);
    ctx.lineTo(-34, 8 + Math.sin(this.time * 25 + 2) * 6);
    ctx.lineTo(-10, 14);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}
