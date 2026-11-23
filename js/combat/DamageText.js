/**
 * Floating Combat Text - Displays numeric damage and combat alerts (BLOCK, DODGE, CRITICAL).
 * Styled with high-impact anime manga aesthetics, elastic pop scaling, and dual outline glow.
 */
class DamageTextSystem {
  constructor() {
    this.texts = [];
  }

  add(text, x, y, type = 'normal') {
    let color = '#ffffff';
    let size = 20;
    let vy = -110;
    let life = 0.85;
    let badge = null;
    let rotation = (Math.random() - 0.5) * 0.15;

    if (type === 'critical') {
      color = '#ffea00';
      size = 32;
      vy = -140;
      life = 1.1;
      badge = 'CRITICAL!!';
      rotation = (Math.random() > 0.5 ? 1 : -1) * 0.18;
    } else if (type === 'block') {
      color = '#00f0ff';
      size = 18;
      vy = -75;
      life = 0.75;
      badge = 'GUARD';
      rotation = 0;
    } else if (type === 'dodge') {
      color = '#a5b4fc';
      size = 18;
      vy = -75;
      life = 0.75;
      badge = 'EVADE';
      rotation = (Math.random() - 0.5) * 0.1;
    } else if (type === 'special') {
      color = '#ff0055';
      size = 34;
      vy = -150;
      life = 1.2;
      badge = 'BURST!!';
      rotation = (Math.random() > 0.5 ? 1 : -1) * 0.22;
    }

    this.texts.push({
      text: text.toString(),
      badge,
      type,
      x: x + (Math.random() - 0.5) * 24,
      y: y - 25,
      vx: (Math.random() - 0.5) * 40,
      vy,
      color,
      size,
      rotation,
      scale: 1.8,
      targetScale: 1.0,
      alpha: 1.0,
      life,
      maxLife: life
    });
  }

  update(dt) {
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const item = this.texts[i];
      item.life -= dt;
      if (item.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }

      item.x += item.vx * dt;
      item.y += item.vy * dt;
      item.vy += 95 * dt; // gravity arc

      // Elastic pop animation in the beginning
      const elapsed = item.maxLife - item.life;
      if (elapsed < 0.12) {
        // Fast snap from 1.8 down to 1.0
        item.scale = 1.8 - (elapsed / 0.12) * 0.8;
      } else if (elapsed < 0.22) {
        // Subtle bounce back to 1.1
        item.scale = 1.0 + Math.sin(((elapsed - 0.12) / 0.1) * Math.PI) * 0.15;
      } else {
        item.scale = 1.0;
      }

      item.alpha = Math.min(1.0, (item.life / item.maxLife) * 1.6);
    }
  }

  render(ctx) {
    if (this.texts.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const item of this.texts) {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.rotation);
      ctx.scale(item.scale, item.scale);
      ctx.globalAlpha = item.alpha;

      // Anime action badge backdrop for Critical or Special
      if (item.badge) {
        ctx.font = `900 ${Math.max(12, Math.round(item.size * 0.42))}px 'Orbitron', 'Rajdhani', sans-serif`;
        const bWidth = ctx.measureText(item.badge).width + 12;
        
        ctx.fillStyle = item.type === 'critical' ? 'rgba(255, 234, 0, 0.2)' : 
                       item.type === 'special' ? 'rgba(255, 0, 85, 0.25)' : 'rgba(0, 240, 255, 0.2)';
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 1.5;
        
        // Skewed badge container
        ctx.beginPath();
        ctx.moveTo(-bWidth / 2 - 4, -item.size * 0.65 - 10);
        ctx.lineTo(bWidth / 2 + 6, -item.size * 0.65 - 10);
        ctx.lineTo(bWidth / 2 + 2, -item.size * 0.65 + 4);
        ctx.lineTo(-bWidth / 2 - 8, -item.size * 0.65 + 4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.badge, 0, -item.size * 0.65 - 3);
      }

      // Draw Main Damage Text
      ctx.font = `900 ${item.size}px 'Orbitron', sans-serif`;

      // Thick anime dark outline
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#050811';
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(item.text, 0, 0);

      // Inner color stroke
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = item.color;
      ctx.strokeText(item.text, 0, 0);

      // Glowing text core
      ctx.fillStyle = item.type === 'critical' ? '#ffffff' : item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 12;
      ctx.fillText(item.text, 0, 0);

      // High-energy white core fill
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 0;
      ctx.fillText(item.text, 0, 0);

      ctx.restore();
    }

    ctx.restore();
  }

  clear() {
    this.texts = [];
  }
}

window.damageTextSystem = new DamageTextSystem();
