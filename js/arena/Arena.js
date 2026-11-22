/**
 * Arena - Renders the cyberpunk battle colosseum with parallax layers, animated billboards,
 * neon lighting, energy boundary barriers, and glossy floor reflections.
 */
class Arena {
  constructor(width = 1280, height = 720) {
    this.width = width;
    this.height = height;

    this.groundY = 580;
    this.minX = 140;
    this.maxX = 1140;

    this.time = 0;
    this.spotlights = [
      { angle: 0.2, speed: 0.6, color: 'rgba(0, 240, 255, 0.08)', x: 300 },
      { angle: -0.3, speed: 0.45, color: 'rgba(255, 0, 85, 0.08)', x: 980 }
    ];

    // Building skyline data
    this.skyscrapers = [
      { x: 50, w: 120, h: 420, winColor: '#00f0ff' },
      { x: 190, w: 90, h: 360, winColor: '#ff0055' },
      { x: 300, w: 140, h: 480, winColor: '#00f0ff' },
      { x: 460, w: 110, h: 390, winColor: '#ffea00' },
      { x: 590, w: 150, h: 520, winColor: '#00f0ff' },
      { x: 760, w: 130, h: 450, winColor: '#ff0055' },
      { x: 910, w: 100, h: 370, winColor: '#00f0ff' },
      { x: 1030, w: 160, h: 500, winColor: '#ffea00' }
    ];
  }

  update(dt) {
    this.time += dt;
    for (const spot of this.spotlights) {
      spot.angle = Math.sin(this.time * spot.speed) * 0.45;
    }
  }

  renderBackground(ctx) {
    // 1. Cyber Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#04060f');
    skyGrad.addColorStop(0.6, '#090e1c');
    skyGrad.addColorStop(1, '#111a33');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-200, -200, this.width + 400, this.height + 400);

    // 2. Distant Cyber Skyscrapers
    for (const b of this.skyscrapers) {
      ctx.fillStyle = '#080d1a';
      ctx.fillRect(b.x, this.groundY - b.h, b.w, b.h);

      // Building accent antenna / edge light
      ctx.fillStyle = b.winColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(b.x + b.w / 2 - 1, this.groundY - b.h - 30, 2, 30);
      ctx.fillRect(b.x, this.groundY - b.h, b.w, 3);

      // Windows
      ctx.globalAlpha = 0.25;
      for (let wy = this.groundY - b.h + 20; wy < this.groundY - 40; wy += 24) {
        for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 18) {
          if ((wx + wy) % 7 !== 0) {
            ctx.fillStyle = b.winColor;
            ctx.fillRect(wx, wy, 8, 12);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }

    // 3. Sweeping Atmospheric Spotlights
    for (const spot of this.spotlights) {
      ctx.save();
      ctx.translate(spot.x, this.groundY);
      ctx.rotate(spot.angle);
      const spotGrad = ctx.createRadialGradient(0, -400, 20, 0, -400, 600);
      spotGrad.addColorStop(0, spot.color);
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;
      ctx.beginPath();
      ctx.moveTo(-40, 0);
      ctx.lineTo(40, 0);
      ctx.lineTo(180, -750);
      ctx.lineTo(-180, -750);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 4. Midground Colosseum Structures & Truss
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(80, this.groundY - 180, this.width - 160, 20);

    // Truss diagonal girders
    ctx.strokeStyle = '#15203a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (let x = 80; x < this.width - 160; x += 60) {
      ctx.moveTo(x, this.groundY - 180);
      ctx.lineTo(x + 60, this.groundY - 140);
      ctx.lineTo(x + 120, this.groundY - 180);
    }
    ctx.stroke();

    // 5. Central Holographic Billboard
    const centerHoloX = this.width / 2;
    const centerHoloY = 220;

    // Glowing Holo Frame
    ctx.save();
    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerHoloX - 180, centerHoloY - 40, 360, 80);
    ctx.fillRect(centerHoloX - 180, centerHoloY - 40, 360, 80);

    // Hologram Header
    ctx.textAlign = 'center';
    ctx.font = "900 24px 'Orbitron', sans-serif";
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.fillText("AI BATTLE ARENA", centerHoloX, centerHoloY + 4);

    ctx.font = "700 11px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    const glitchPulse = Math.sin(this.time * 4) > 0 ? "SECTOR-09 // NEURAL LINK SYNCHRONIZED" : "LIVE COMBAT PROTOCOL ACTIVE";
    ctx.fillText(glitchPulse, centerHoloX, centerHoloY + 24);
    ctx.restore();

    // 6. Energy Forcefield Boundary Posts (Left & Right)
    this.renderBoundaryPost(ctx, this.minX - 10, true);
    this.renderBoundaryPost(ctx, this.maxX + 10, false);
  }

  renderBoundaryPost(ctx, x, isLeft) {
    ctx.save();
    // Heavy metal column
    ctx.fillStyle = '#101726';
    ctx.fillRect(x - 14, this.groundY - 320, 28, 320);

    // Neon laser containment beam
    const beamPulse = (Math.sin(this.time * 8) + 1) * 0.5;
    ctx.strokeStyle = isLeft ? '#00f0ff' : '#ff0055';
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 15;
    ctx.lineWidth = 4 + beamPulse * 2;
    ctx.beginPath();
    ctx.moveTo(x, this.groundY - 320);
    ctx.lineTo(x, this.groundY);
    ctx.stroke();

    // Glowing warning glyphs
    ctx.fillStyle = ctx.strokeStyle;
    ctx.font = "700 10px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText("BARRIER", x, this.groundY - 280);
    ctx.restore();
  }

  renderFloor(ctx) {
    ctx.save();
    // 1. Platform Ground Plate
    const floorGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    floorGrad.addColorStop(0, '#12182b');
    floorGrad.addColorStop(0.3, '#0b101c');
    floorGrad.addColorStop(1, '#05070d');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(-200, this.groundY, this.width + 400, this.height - this.groundY + 200);

    // 2. High-Tech Edge Border Glow Strip
    const edgeGrad = ctx.createLinearGradient(this.minX, 0, this.maxX, 0);
    edgeGrad.addColorStop(0, '#00f0ff');
    edgeGrad.addColorStop(0.5, '#ffffff');
    edgeGrad.addColorStop(1, '#ff0055');

    ctx.strokeStyle = edgeGrad;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.minX - 30, this.groundY);
    ctx.lineTo(this.maxX + 30, this.groundY);
    ctx.stroke();

    // 3. Floor Grid & Metal Segments
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 2;
    for (let x = this.minX; x <= this.maxX; x += 100) {
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + (x - this.width / 2) * 0.4, this.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderForeground(ctx) {
    // Subtle bottom arena fog
    ctx.save();
    const fogGrad = ctx.createLinearGradient(0, this.groundY - 60, 0, this.groundY + 40);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.04)');
    fogGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, this.groundY - 60, this.width, 100);
    ctx.restore();
  }
}
