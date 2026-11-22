/**
 * Particle System - High performance visual effects for combat, impacts, shields, and atmosphere.
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.ghostTrails = [];
    this.ambientParticles = [];
    this.enabled = true;

    this.initAmbient(60);
  }

  setEnabled(val) {
    this.enabled = val;
  }

  initAmbient(count) {
    this.ambientParticles = [];
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * 1600 - 200,
        y: Math.random() * 800 - 100,
        vx: (Math.random() - 0.5) * 15,
        vy: -Math.random() * 20 - 10,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.5 ? '#00f0ff' : '#ff0055',
        alpha: Math.random() * 0.4 + 0.1,
        pulseSpeed: Math.random() * 2 + 1
      });
    }
  }

  // Hit sparks when blade strikes flesh or armor
  emitSparks(x, y, color = '#ffea00', count = 16, spread = 350) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * spread + 100;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 8 + 4,
        size: Math.random() * 2 + 1,
        color,
        alpha: 1.0,
        life: 0.25 + Math.random() * 0.15,
        maxLife: 0.25 + Math.random() * 0.15,
        gravity: 600
      });
    }
  }

  // Neon cyber blood / plasma splash
  emitCyberBlood(x, y, color = '#00f0ff', count = 14) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 250 + 80;
      this.particles.push({
        type: 'plasma',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        size: Math.random() * 3 + 2,
        color,
        alpha: 1.0,
        life: 0.35 + Math.random() * 0.2,
        maxLife: 0.35 + Math.random() * 0.2,
        gravity: 700
      });
    }
  }

  // Shield deflection sparks and expanding hexagon
  emitShieldBlock(x, y, color = '#00f0ff') {
    if (!this.enabled) return;
    // Hexagon flash
    this.particles.push({
      type: 'hexShield',
      x,
      y,
      size: 30,
      maxSize: 60,
      color,
      alpha: 1.0,
      life: 0.22,
      maxLife: 0.22
    });

    // Deflection glitter
    for (let i = 0; i < 12; i++) {
      const angle = (Math.random() - 0.5) * Math.PI + (Math.random() > 0.5 ? 0 : Math.PI);
      const speed = Math.random() * 300 + 100;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: 6,
        size: 2,
        color: '#ffffff',
        alpha: 1.0,
        life: 0.2,
        maxLife: 0.2,
        gravity: 400
      });
    }
  }

  // Expanding shockwave ring (for heavy hits or specials)
  emitShockwave(x, y, color = '#00f0ff', maxRadius = 80) {
    if (!this.enabled) return;
    this.particles.push({
      type: 'shockwave',
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      alpha: 1.0,
      life: 0.3,
      maxLife: 0.3,
      lineWidth: 4
    });
  }

  // Dust puff on jump / landing / dash
  emitDust(x, y, count = 8, color = 'rgba(180, 200, 220, 0.4)') {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 140;
      const vy = -Math.random() * 60 - 20;
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() - 0.5) * 20,
        y,
        vx,
        vy,
        size: Math.random() * 6 + 4,
        color,
        alpha: 0.7,
        life: 0.3 + Math.random() * 0.15,
        maxLife: 0.3 + Math.random() * 0.15,
        growth: 15
      });
    }
  }

  // Ghost trail for dodge / dash
  addGhostTrail(fighter) {
    if (!this.enabled) return;
    this.ghostTrails.push({
      x: fighter.x,
      y: fighter.y,
      facing: fighter.facing,
      state: fighter.state,
      color: fighter.trailColor || '#00f0ff',
      alpha: 0.65,
      life: 0.25,
      maxLife: 0.25,
      fighterRef: fighter
    });
  }

  update(dt) {
    // Ambient background drifting particles
    for (let p of this.ambientParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -50) p.y = 750;
      if (p.x < -200) p.x = 1400;
      if (p.x > 1400) p.x = -200;
    }

    // Active combat particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.type === 'spark' || p.type === 'plasma') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
      } else if (p.type === 'dust') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.size += p.growth * dt;
      } else if (p.type === 'shockwave') {
        const progress = 1 - (p.life / p.maxLife);
        p.radius = 10 + (p.maxRadius - 10) * progress;
      } else if (p.type === 'hexShield') {
        const progress = 1 - (p.life / p.maxLife);
        p.size = 30 + (p.maxSize - 30) * progress;
      }
    }

    // Ghost trails update
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const t = this.ghostTrails[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.ghostTrails.splice(i, 1);
        continue;
      }
      t.alpha = (t.life / t.maxLife) * 0.65;
    }
  }

  render(ctx) {
    // Render Ambient Particles
    ctx.save();
    for (const p of this.ambientParticles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Render Ghost Trails (drawn behind fighters)
    ctx.save();
    for (const t of this.ghostTrails) {
      ctx.globalAlpha = t.alpha;
      // Draw silhouette representation
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(t.x - 22, t.y - 70, 44, 70);
    }
    ctx.restore();

    // Render Combat Particles
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;

      if (p.type === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
        ctx.stroke();
      } else if (p.type === 'plasma') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'dust') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'shockwave') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth * p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'hexShield') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 16;
        this.drawHexagon(ctx, p.x, p.y, p.size);
      }
    }
    ctx.restore();
  }

  drawHexagon(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hx = x + r * Math.cos(angle);
      const hy = y + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  clear() {
    this.particles = [];
    this.ghostTrails = [];
  }
}

window.particleSystem = new ParticleSystem();
