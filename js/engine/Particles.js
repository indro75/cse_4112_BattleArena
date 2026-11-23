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

  // Anime Action Starbursts - 4-pointed diamond starbursts & comic manga impact frames
  emitAnimeHitStarburst(x, y, color = '#ffea00', isHeavy = false) {
    if (!this.enabled) return;
    const count = isHeavy ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const angle = (i * Math.PI * 2) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 80 + 30;
      this.particles.push({
        type: 'starburst',
        x: x + Math.cos(angle) * (isHeavy ? 18 : 10),
        y: y + Math.sin(angle) * (isHeavy ? 18 : 10),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 12,
        size: isHeavy ? (Math.random() * 22 + 20) : (Math.random() * 14 + 10),
        color,
        alpha: 1.0,
        life: isHeavy ? 0.28 : 0.20,
        maxLife: isHeavy ? 0.28 : 0.20
      });
    }

    // High intensity comic impact flash circle
    this.particles.push({
      type: 'impactFlash',
      x,
      y,
      radius: isHeavy ? 45 : 25,
      maxRadius: isHeavy ? 80 : 50,
      color: '#ffffff',
      alpha: 0.9,
      life: 0.12,
      maxLife: 0.12
    });
  }

  // Anime Speedlines - Dynamic kinetic lines radiating in the direction of the blow
  emitSpeedlines(x, y, dir = 1, isHeavy = false) {
    if (!this.enabled) return;
    const count = isHeavy ? 8 : 4;
    for (let i = 0; i < count; i++) {
      const length = isHeavy ? (Math.random() * 140 + 90) : (Math.random() * 80 + 50);
      const angle = (dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 0.45;
      this.particles.push({
        type: 'speedline',
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * (Math.random() * 300 + 400),
        vy: Math.sin(angle) * 100,
        angle,
        length,
        width: Math.random() * 2.5 + 1.5,
        color: Math.random() > 0.4 ? '#ffffff' : (dir > 0 ? '#00f0ff' : '#ff0055'),
        alpha: 0.9,
        life: 0.22,
        maxLife: 0.22
      });
    }
  }

  // Electric Lightning Arcs - Crackling zigzag sparks on heavy cuts or special hits
  emitLightningArcs(x, y, color = '#00f0ff', count = 4) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const length = Math.random() * 50 + 25;
      const segments = 4;
      const points = [{ x, y }];
      let cx = x;
      let cy = y;
      for (let s = 1; s <= segments; s++) {
        const segDist = length / segments;
        cx += Math.cos(angle) * segDist + (Math.random() - 0.5) * 16;
        cy += Math.sin(angle) * segDist + (Math.random() - 0.5) * 16;
        points.push({ x: cx, y: cy });
      }
      this.particles.push({
        type: 'lightning',
        points,
        color,
        lineWidth: Math.random() * 2 + 1.5,
        alpha: 1.0,
        life: 0.16,
        maxLife: 0.16
      });
    }
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
      } else if (p.type === 'starburst') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rotation += p.rotSpeed * dt;
      } else if (p.type === 'speedline') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      } else if (p.type === 'impactFlash') {
        const progress = 1 - (p.life / p.maxLife);
        p.radius = 25 + (p.maxRadius - 25) * progress;
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
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 12;
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
      } else if (p.type === 'starburst') {
        // Render 4-pointed anime starburst
        this.drawAnimeStar(ctx, p.x, p.y, p.size, p.rotation, p.color);
      } else if (p.type === 'speedline') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - Math.cos(p.angle) * p.length, p.y - Math.sin(p.angle) * p.length);
        ctx.stroke();
      } else if (p.type === 'lightning') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.lineWidth;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        for (let idx = 0; idx < p.points.length; idx++) {
          if (idx === 0) ctx.moveTo(p.points[idx].x, p.points[idx].y);
          else ctx.lineTo(p.points[idx].x, p.points[idx].y);
        }
        ctx.stroke();
      } else if (p.type === 'impactFlash') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  drawAnimeStar(ctx, x, y, size, rotation, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // 4-pointed diamond star
    const w = size;
    const h = size * 0.22;

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;

    // Horizontal diamond
    ctx.beginPath();
    ctx.moveTo(-w, 0);
    ctx.lineTo(0, -h);
    ctx.lineTo(w, 0);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // Vertical diamond
    ctx.beginPath();
    ctx.moveTo(0, -w);
    ctx.lineTo(-h, 0);
    ctx.lineTo(0, w);
    ctx.lineTo(h, 0);
    ctx.closePath();
    ctx.fill();

    // Intense white inner core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    ctx.fill();

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
