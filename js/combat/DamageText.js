/**
 * Floating Combat Text - Displays numeric damage and combat alerts (BLOCK, DODGE, CRITICAL).
 */
class DamageTextSystem {
  constructor() {
    this.texts = [];
  }

  add(text, x, y, type = 'normal') {
    let color = '#ffffff';
    let size = 18;
    let vy = -90;
    let life = 0.8;

    if (type === 'critical') {
      color = '#ffea00';
      size = 24;
      vy = -120;
      life = 1.0;
    } else if (type === 'block') {
      color = '#00f0ff';
      size = 16;
      vy = -70;
      life = 0.7;
    } else if (type === 'dodge') {
      color = '#94a3b8';
      size = 16;
      vy = -70;
      life = 0.7;
    } else if (type === 'special') {
      color = '#ff0055';
      size = 26;
      vy = -130;
      life = 1.1;
    }

    this.texts.push({
      text: text.toString(),
      x: x + (Math.random() - 0.5) * 20,
      y: y - 20,
      vx: (Math.random() - 0.5) * 30,
      vy,
      color,
      size,
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
      item.vy += 80 * dt; // slight downward deceleration
      item.alpha = Math.min(1.0, (item.life / item.maxLife) * 1.5);
    }
  }

  render(ctx) {
    if (this.texts.length === 0) return;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const item of this.texts) {
      ctx.globalAlpha = item.alpha;
      ctx.font = `900 ${item.size}px 'Orbitron', sans-serif`;

      // Text stroke for readability
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#000000';
      ctx.strokeText(item.text, item.x, item.y);

      // Glowing text fill
      ctx.fillStyle = item.color;
      ctx.shadowColor = item.color;
      ctx.shadowBlur = 8;
      ctx.fillText(item.text, item.x, item.y);
    }

    ctx.restore();
  }

  clear() {
    this.texts = [];
  }
}

window.damageTextSystem = new DamageTextSystem();
