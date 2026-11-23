/**
 * Arena - Renders an animated cyberpunk battle colosseum with multi-layer parallax cityscapes,
 * giant holographic synthwave moon, flying hovercar traffic, cheering crowd silhouettes,
 * volumetric spotlights, crackling electric containment pillars, and reflective combat deck.
 */
class Arena {
  constructor(width = 1280, height = 720) {
    this.width = width;
    this.height = height;

    this.groundY = 580;
    this.minX = 140;
    this.maxX = 1140;

    this.time = 0;

    // Atmospheric sweeping spotlights
    this.spotlights = [
      { angle: 0.25, speed: 0.55, color: 'rgba(0, 240, 255, 0.12)', x: 260 },
      { angle: -0.35, speed: 0.42, color: 'rgba(255, 0, 85, 0.12)', x: 1020 },
      { angle: 0.1, speed: 0.38, color: 'rgba(255, 183, 0, 0.08)', x: 640 }
    ];

    // Flying hovercar traffic across the background
    this.hovercars = [
      { x: 100, y: 140, vx: 180, length: 36, color: '#00f0ff', tail: '#0099ff' },
      { x: 600, y: 180, vx: -140, length: 28, color: '#ff0055', tail: '#ff5500' },
      { x: 900, y: 110, vx: 220, length: 42, color: '#ffffff', tail: '#00f0ff' },
      { x: 350, y: 220, vx: -160, length: 32, color: '#ffea00', tail: '#ff0055' }
    ];

    // Cheering spectator crowd in the colosseum midground
    this.crowdMembers = [];
    for (let i = 0; i < 48; i++) {
      this.crowdMembers.push({
        x: 120 + i * 22,
        baseY: this.groundY - 146,
        bobSpeed: 3 + Math.random() * 4,
        bobPhase: Math.random() * Math.PI * 2,
        lightColor: Math.random() > 0.5 ? '#00f0ff' : (Math.random() > 0.5 ? '#ff0055' : '#ffea00'),
        stickAngle: (Math.random() - 0.5) * 0.8
      });
    }

    // Distant cyber skyscrapers
    this.skyscrapers = [
      { x: 40, w: 110, h: 440, winColor: '#00f0ff', beacon: true },
      { x: 170, w: 90, h: 370, winColor: '#ff0055', beacon: false },
      { x: 280, w: 130, h: 490, winColor: '#00f0ff', beacon: true },
      { x: 430, w: 100, h: 410, winColor: '#ffea00', beacon: false },
      { x: 550, w: 150, h: 540, winColor: '#00f0ff', beacon: true },
      { x: 720, w: 130, h: 470, winColor: '#ff0055', beacon: false },
      { x: 870, w: 110, h: 390, winColor: '#00f0ff', beacon: true },
      { x: 1000, w: 160, h: 520, winColor: '#ffea00', beacon: false },
      { x: 1180, w: 120, h: 430, winColor: '#00f0ff', beacon: true }
    ];
  }

  update(dt) {
    this.time += dt;

    // Update spotlights
    for (const spot of this.spotlights) {
      spot.angle = Math.sin(this.time * spot.speed) * 0.5;
    }

    // Update hovercar traffic
    for (const car of this.hovercars) {
      car.x += car.vx * dt;
      if (car.vx > 0 && car.x > this.width + 100) {
        car.x = -120;
        car.y = 90 + Math.random() * 140;
      } else if (car.vx < 0 && car.x < -120) {
        car.x = this.width + 100;
        car.y = 90 + Math.random() * 140;
      }
    }
  }

  /* ==========================================================
     BACKGROUND RENDERING (SKY, MOON, CITY, BILLBOARD, CROWD)
     ========================================================== */
  renderBackground(ctx) {
    // 1. Deep Galactic Cyber Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
    skyGrad.addColorStop(0, '#02040a');
    skyGrad.addColorStop(0.4, '#080d1e');
    skyGrad.addColorStop(0.8, '#101732');
    skyGrad.addColorStop(1, '#182042');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(-200, -200, this.width + 400, this.height + 400);

    // 2. Giant Holographic Synthwave Cyber Moon
    this.renderHoloMoon(ctx);

    // 3. Distant City Skyline & Windows
    this.renderSkyscrapers(ctx);

    // 4. Flying Hovercar Traffic with Light Trails
    this.renderHovercars(ctx);

    // 5. Sweeping Atmospheric Spotlights
    this.renderSpotlights(ctx);

    // 6. Colosseum Stands & Cheering Crowd
    this.renderCrowd(ctx);

    // 7. Central Animated Holographic Billboard
    this.renderCentralBillboard(ctx);

    // 8. Crackling Containment Forcefield Posts
    this.renderContainmentPost(ctx, this.minX - 10, true);
    this.renderContainmentPost(ctx, this.maxX + 10, false);
  }

  renderHoloMoon(ctx) {
    ctx.save();
    const mx = this.width / 2 + 180;
    const my = 150;
    const mr = 75;

    // Glowing halo
    const moonGrad = ctx.createRadialGradient(mx, my, 20, mx, my, mr * 1.6);
    moonGrad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    moonGrad.addColorStop(0.5, 'rgba(255, 0, 85, 0.15)');
    moonGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Solid inner celestial sphere
    const sphereGrad = ctx.createLinearGradient(mx, my - mr, mx, my + mr);
    sphereGrad.addColorStop(0, '#ff0077');
    sphereGrad.addColorStop(1, '#00f0ff');
    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();

    // Synthwave Horizontal Scanline Grooves
    ctx.fillStyle = '#050a18';
    for (let sy = my - mr + 24; sy < my + mr; sy += 8) {
      const sliceH = (sy - (my - mr)) / (mr * 2) * 5;
      ctx.fillRect(mx - mr, sy, mr * 2, sliceH);
    }

    // Outer Digital Orbit Ring
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(mx, my, mr * 1.45, mr * 0.4, -0.25, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  renderSkyscrapers(ctx) {
    ctx.save();
    for (const b of this.skyscrapers) {
      // Skyscraper base
      ctx.fillStyle = '#070c17';
      ctx.fillRect(b.x, this.groundY - b.h, b.w, b.h);

      // Top edge neon strip
      ctx.fillStyle = b.winColor;
      ctx.globalAlpha = 0.6;
      ctx.fillRect(b.x, this.groundY - b.h, b.w, 3);

      // Rooftop antenna tower
      if (b.beacon) {
        ctx.fillRect(b.x + b.w / 2 - 1, this.groundY - b.h - 35, 2, 35);
        // Blinking red aviation hazard beacon
        if (Math.sin(this.time * 5 + b.x) > 0) {
          ctx.fillStyle = '#ff0033';
          ctx.shadowColor = '#ff0033';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(b.x + b.w / 2, this.groundY - b.h - 35, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      // Glowing illuminated office windows
      ctx.globalAlpha = 0.35;
      for (let wy = this.groundY - b.h + 24; wy < this.groundY - 140; wy += 26) {
        for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 20) {
          if ((wx + wy) % 5 !== 0) {
            ctx.fillStyle = b.winColor;
            ctx.fillRect(wx, wy, 8, 14);
          }
        }
      }
      ctx.globalAlpha = 1.0;
    }
    ctx.restore();
  }

  renderHovercars(ctx) {
    ctx.save();
    for (const car of this.hovercars) {
      // Light trail streak
      ctx.strokeStyle = car.tail;
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(car.x - (car.vx > 0 ? car.length * 1.5 : -car.length * 1.5), car.y);
      ctx.lineTo(car.x, car.y);
      ctx.stroke();

      // Vehicle headlight pod
      ctx.fillStyle = car.color;
      ctx.shadowColor = car.color;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.arc(car.x, car.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderSpotlights(ctx) {
    ctx.save();
    for (const spot of this.spotlights) {
      ctx.save();
      ctx.translate(spot.x, this.groundY - 100);
      ctx.rotate(spot.angle);

      const spotGrad = ctx.createRadialGradient(0, -350, 30, 0, -350, 650);
      spotGrad.addColorStop(0, spot.color);
      spotGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = spotGrad;

      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(35, 0);
      ctx.lineTo(190, -800);
      ctx.lineTo(-190, -800);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
    ctx.restore();
  }

  renderCrowd(ctx) {
    ctx.save();
    // Colosseum railing platform
    ctx.fillStyle = '#080e1b';
    ctx.fillRect(80, this.groundY - 170, this.width - 160, 24);

    // Metallic truss girders
    ctx.strokeStyle = '#121c32';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 80; x < this.width - 160; x += 50) {
      ctx.moveTo(x, this.groundY - 170);
      ctx.lineTo(x + 50, this.groundY - 140);
      ctx.lineTo(x + 100, this.groundY - 170);
    }
    ctx.stroke();

    // Cheering Spectator Silhouettes with Animated Glowsticks
    for (const m of this.crowdMembers) {
      const bob = Math.sin(this.time * m.bobSpeed + m.bobPhase) * 6;
      const cy = m.baseY + bob;

      // Dark spectator head & shoulders silhouette
      ctx.fillStyle = '#050811';
      ctx.beginPath();
      ctx.arc(m.x, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(m.x - 7, cy + 5, 14, 12);

      // Waving Neon Glowstick
      const sway = Math.sin(this.time * 6 + m.x) * 0.45;
      const stickLen = 14;
      const sx = m.x + 6;
      const sy = cy + 2;
      const ex = sx + Math.cos(m.stickAngle + sway) * stickLen;
      const ey = sy - Math.sin(Math.PI * 0.5 + sway) * stickLen;

      ctx.strokeStyle = m.lightColor;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = m.lightColor;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  renderCentralBillboard(ctx) {
    const cx = this.width / 2;
    const cy = 230;

    ctx.save();
    // Glowing Hologram Screen Frame
    ctx.fillStyle = 'rgba(0, 240, 255, 0.05)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 200, cy - 42, 400, 84);
    ctx.fillRect(cx - 200, cy - 42, 400, 84);

    // Corner tech bracket accents
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    const bLen = 14;
    // Top-left
    ctx.beginPath(); ctx.moveTo(cx - 200, cy - 42 + bLen); ctx.lineTo(cx - 200, cy - 42); ctx.lineTo(cx - 200 + bLen, cy - 42); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(cx + 200 - bLen, cy - 42); ctx.lineTo(cx + 200, cy - 42); ctx.lineTo(cx + 200, cy - 42 + bLen); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(cx - 200, cy + 42 - bLen); ctx.lineTo(cx - 200, cy + 42); ctx.lineTo(cx - 200 + bLen, cy + 42); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(cx + 200 - bLen, cy + 42); ctx.lineTo(cx + 200, cy + 42); ctx.lineTo(cx + 200, cy + 42 - bLen); ctx.stroke();

    // Animated Hologram Title
    ctx.textAlign = 'center';
    ctx.font = "900 26px 'Orbitron', sans-serif";
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 16;
    ctx.fillText("AI BATTLE ARENA", cx, cy + 6);

    ctx.font = "700 12px 'Rajdhani', sans-serif";
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    const pulseText = Math.sin(this.time * 4) > 0 ? "SECTOR-09 // NEURAL LINK SYNCHRONIZED" : "⚡ CHAMPIONSHIP PROTOCOL ACTIVE ⚡";
    ctx.fillText(pulseText, cx, cy + 26);

    ctx.restore();
  }

  renderContainmentPost(ctx, x, isLeft) {
    ctx.save();
    // Heavy metal column
    ctx.fillStyle = '#0c1322';
    ctx.fillRect(x - 14, this.groundY - 330, 28, 330);

    // Glowing emitter cap
    ctx.fillStyle = isLeft ? '#00f0ff' : '#ff0055';
    ctx.fillRect(x - 16, this.groundY - 335, 32, 6);

    // Neon laser containment beam
    const pulse = (Math.sin(this.time * 8) + 1) * 0.5;
    const beamColor = isLeft ? '#00f0ff' : '#ff0055';
    ctx.strokeStyle = beamColor;
    ctx.shadowColor = beamColor;
    ctx.shadowBlur = 20;
    ctx.lineWidth = 4 + pulse * 2.5;

    ctx.beginPath();
    ctx.moveTo(x, this.groundY - 330);
    ctx.lineTo(x, this.groundY);
    ctx.stroke();

    // Animated Crackling Electric Lightning Arcs on the posts!
    if (Math.random() > 0.3) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let ly = this.groundY - 330;
      let lx = x;
      ctx.moveTo(lx, ly);
      while (ly < this.groundY) {
        ly += 30 + Math.random() * 25;
        lx = x + (Math.random() - 0.5) * 14;
        ctx.lineTo(lx, Math.min(ly, this.groundY));
      }
      ctx.stroke();
    }

    // Glowing warning glyphs
    ctx.fillStyle = beamColor;
    ctx.font = "900 11px 'Orbitron', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText("BARRIER", x, this.groundY - 290);
    ctx.restore();
  }

  /* ==========================================================
     FLOOR PLATFORM & MIRROR REFLECTIONS
     ========================================================== */
  renderFloor(ctx, player, ai) {
    ctx.save();

    // 1. Polished Obsidian / Metal Platform Base
    const floorGrad = ctx.createLinearGradient(0, this.groundY, 0, this.height);
    floorGrad.addColorStop(0, '#10162a');
    floorGrad.addColorStop(0.25, '#0b0f1d');
    floorGrad.addColorStop(1, '#04060c');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(-200, this.groundY, this.width + 400, this.height - this.groundY + 200);

    // 2. Real-time Glossy Mirrored Reflections of the Combatants!
    if (player && ai) {
      this.renderFighterReflection(ctx, player);
      this.renderFighterReflection(ctx, ai);
    }

    // 3. Reactive Illuminated Hex Floor Grid
    this.renderHexFloorGrid(ctx);

    // 4. High-Tech Edge Border Glow Strip
    const edgeGrad = ctx.createLinearGradient(this.minX, 0, this.maxX, 0);
    edgeGrad.addColorStop(0, '#00f0ff');
    edgeGrad.addColorStop(0.5, '#ffffff');
    edgeGrad.addColorStop(1, '#ff0055');

    ctx.strokeStyle = edgeGrad;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 16;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.minX - 30, this.groundY);
    ctx.lineTo(this.maxX + 30, this.groundY);
    ctx.stroke();

    ctx.restore();
  }

  renderFighterReflection(ctx, fighter) {
    if (fighter.isDefeated && fighter.state !== 'DEFEATED') return;

    ctx.save();
    ctx.translate(fighter.x, this.groundY);
    ctx.scale(fighter.facing, -0.65); // Invert vertically & slightly compress
    ctx.globalAlpha = 0.22; // subtle glossy mirror reflection

    // Draw inverted reflection silhouette with theme glow
    ctx.fillStyle = fighter.themeColor;
    ctx.shadowColor = fighter.themeColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(-20, 0, 40, 75);

    ctx.restore();
  }

  renderHexFloorGrid(ctx) {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1.5;

    // Perspective perspective lines extending toward viewer
    for (let x = this.minX; x <= this.maxX; x += 80) {
      const pulse = Math.sin(this.time * 3 + x * 0.02) * 0.05;
      ctx.strokeStyle = `rgba(0, 240, 255, ${0.08 + pulse})`;
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x + (x - this.width / 2) * 0.45, this.height);
      ctx.stroke();
    }

    // Horizontal grid rungs
    for (let y = this.groundY + 25; y < this.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(-100, y);
      ctx.lineTo(this.width + 100, y);
      ctx.stroke();
    }

    ctx.restore();
  }

  renderForeground(ctx) {
    ctx.save();
    // Atmospheric arena bottom fog
    const fogGrad = ctx.createLinearGradient(0, this.groundY - 50, 0, this.groundY + 40);
    fogGrad.addColorStop(0, 'transparent');
    fogGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.05)');
    fogGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, this.groundY - 50, this.width, 90);
    ctx.restore();
  }
}
