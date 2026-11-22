/**
 * Fighter - Core combatant physics, combat state machine, and 2D procedural rendering.
 */
class Fighter {
  constructor(x, y, facing, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 46;
    this.height = 78;
    this.facing = facing; // 1 = right, -1 = left

    this.groundY = 580;
    this.onGround = true;

    // Combat Stats
    this.maxHealth = 1000;
    this.health = 1000;
    this.maxEnergy = 100;
    this.energy = 100;
    this.energyRegenRate = 14; // SP per second

    // States: IDLE, RUN, JUMP, FALL, CROUCH, ATTACK_1, ATTACK_2, ATTACK_3, SPECIAL, BLOCK, DODGE, HURT, DEFEATED, VICTORY
    this.state = 'IDLE';
    this.stateTimer = 0;

    // Defense & Mobility Flags
    this.isBlocking = false;
    this.isDodging = false;
    this.isInvulnerable = false;
    this.dodgeCooldown = 0;
    this.dodgeDuration = 0.28;
    this.dodgeIFrames = 0.24;

    // Combat & Combo
    this.activeHitbox = null;
    this.hasHitTarget = false;
    this.hitstunTimer = 0;
    this.comboBufferedAttack = false;
    this.attackCooldown = 0;

    // Projectiles spawned by this fighter
    this.projectiles = [];

    // Customization & Aesthetics
    this.name = options.name || 'WARRIOR';
    this.themeColor = options.themeColor || '#00f0ff';
    this.secondaryColor = options.secondaryColor || '#0066cc';
    this.visorColor = options.visorColor || '#00f0ff';
    this.trailColor = options.trailColor || '#00f0ff';

    // Animation physics (running leg cycles, scarf wave)
    this.animTime = 0;
    this.runCycle = 0;
    this.scarfPoints = [
      { x: 0, y: 0 }, { x: -8, y: 4 }, { x: -16, y: 8 }, { x: -24, y: 14 }
    ];

    // Arena Clamping
    this.minX = 160;
    this.maxX = 1120;
  }

  reset(x, y, facing) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;
    this.state = 'IDLE';
    this.stateTimer = 0;
    this.isBlocking = false;
    this.isDodging = false;
    this.isInvulnerable = false;
    this.dodgeCooldown = 0;
    this.activeHitbox = null;
    this.hasHitTarget = false;
    this.hitstunTimer = 0;
    this.comboBufferedAttack = false;
    this.attackCooldown = 0;
    this.projectiles = [];
  }

  get isDefeated() {
    return this.health <= 0 || this.state === 'DEFEATED';
  }

  getHurtbox() {
    const boxHeight = this.state === 'CROUCH' ? this.height * 0.6 : this.height;
    return {
      x: this.x - this.width / 2,
      y: this.y - boxHeight,
      width: this.width,
      height: boxHeight
    };
  }

  /* ==========================================================
     PHYSICS & STATE UPDATES
     ========================================================== */
  update(dt, opponent) {
    this.stateTimer += dt;
    this.animTime += dt;

    // Passive energy regeneration
    if (this.energy < this.maxEnergy && this.state !== 'BLOCK') {
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * dt);
    }

    // Cooldown timers
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt);
      if (proj.spent || proj.x < 100 || proj.x > 1180) {
        this.projectiles.splice(i, 1);
      }
    }

    // State-specific behavior updates
    this.updateState(dt, opponent);

    // Gravity
    if (!this.onGround) {
      this.vy += 1400 * dt;
    }

    // Apply velocities
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Ground collision
    if (this.y >= this.groundY) {
      if (!this.onGround && this.vy > 100) {
        // Landing dust
        if (window.particleSystem) window.particleSystem.emitDust(this.x, this.groundY, 6);
      }
      this.y = this.groundY;
      this.vy = 0;
      this.onGround = true;

      if (this.state === 'JUMP' || this.state === 'FALL') {
        this.changeState('IDLE');
      }
    } else {
      this.onGround = false;
      if (this.vy > 0 && this.state === 'JUMP') {
        this.changeState('FALL');
      }
    }

    // Arena boundary clamping
    if (this.x < this.minX) {
      this.x = this.minX;
      if (this.vx < 0) this.vx = 0;
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      if (this.vx > 0) this.vx = 0;
    }

    // Friction on ground
    if (this.onGround && !['RUN', 'DODGE'].includes(this.state)) {
      this.vx *= Math.pow(0.001, dt);
      if (Math.abs(this.vx) < 5) this.vx = 0;
    }

    // Update cyber scarf waving physics
    this.updateScarfPhysics(dt);
  }

  updateState(dt, opponent) {
    switch (this.state) {
      case 'RUN':
        this.runCycle += dt * 14;
        break;

      case 'ATTACK_1':
        // Active hitbox: 0.08s - 0.18s. Total duration: 0.28s.
        if (this.stateTimer >= 0.08 && this.stateTimer <= 0.18) {
          this.activeHitbox = new Hitbox(
            this.facing === 1 ? this.x + 10 : this.x - 70,
            this.y - 65,
            60,
            55,
            65, // Damage
            180, // Knockback X
            -30, // Knockback Y
            0.24, // Hitstun
            1 // Type
          );
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer >= 0.28) {
          if (this.comboBufferedAttack) {
            this.comboBufferedAttack = false;
            this.startAttack(2);
          } else {
            this.changeState('IDLE');
          }
        }
        break;

      case 'ATTACK_2':
        // Active hitbox: 0.09s - 0.20s. Total duration: 0.32s.
        if (this.stateTimer >= 0.09 && this.stateTimer <= 0.20) {
          this.activeHitbox = new Hitbox(
            this.facing === 1 ? this.x + 12 : this.x - 76,
            this.y - 62,
            64,
            50,
            110, // Damage
            260, // Knockback X
            -60, // Knockback Y
            0.32, // Hitstun
            2 // Type
          );
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer >= 0.32) {
          if (this.comboBufferedAttack) {
            this.comboBufferedAttack = false;
            this.startAttack(3);
          } else {
            this.changeState('IDLE');
          }
        }
        break;

      case 'ATTACK_3':
        // Finisher uppercut: 0.12s - 0.28s. Total duration: 0.44s.
        if (this.stateTimer >= 0.12 && this.stateTimer <= 0.28) {
          this.activeHitbox = new Hitbox(
            this.facing === 1 ? this.x + 10 : this.x - 80,
            this.y - 85,
            70,
            75,
            180, // Heavy Damage
            420, // Huge Knockback X
            -260, // Launch Y
            0.45, // Heavy Hitstun
            3 // Finisher Type
          );
        } else {
          this.activeHitbox = null;
        }

        if (this.stateTimer >= 0.44) {
          this.changeState('IDLE');
        }
        break;

      case 'SPECIAL':
        // Launch projectile at 0.18s
        if (this.stateTimer >= 0.18 && !this.hasLaunchedProjectile) {
          this.hasLaunchedProjectile = true;
          this.spawnSpecialProjectile();
        }
        if (this.stateTimer >= 0.46) {
          this.changeState('IDLE');
        }
        break;

      case 'DODGE':
        this.isDodging = true;
        this.isInvulnerable = this.stateTimer <= this.dodgeIFrames;

        // Periodic ghost trails
        if (window.particleSystem && Math.random() > 0.4) {
          window.particleSystem.addGhostTrail(this);
        }

        if (this.stateTimer >= this.dodgeDuration) {
          this.isDodging = false;
          this.isInvulnerable = false;
          this.vx *= 0.3;
          this.changeState('IDLE');
        }
        break;

      case 'BLOCK':
        this.isBlocking = true;
        this.vx *= 0.7;
        break;

      case 'HURT':
        this.isBlocking = false;
        this.activeHitbox = null;
        if (this.stateTimer >= this.hitstunTimer) {
          this.changeState('IDLE');
        }
        break;

      case 'DEFEATED':
        this.activeHitbox = null;
        this.isBlocking = false;
        this.vx *= 0.85;
        break;
    }
  }

  changeState(newState) {
    if (this.state === 'DEFEATED' || this.state === 'VICTORY') return;
    if (this.state === newState) return;

    // Cleanup leaving state
    if (this.state === 'BLOCK') this.isBlocking = false;
    if (this.state === 'DODGE') {
      this.isDodging = false;
      this.isInvulnerable = false;
    }
    this.activeHitbox = null;

    this.state = newState;
    this.stateTimer = 0;
    this.hasHitTarget = false;
    this.comboBufferedAttack = false;
  }

  /* ==========================================================
     ACTIONS: ATTACK, SPECIAL, DODGE, JUMP, BLOCK
     ========================================================== */
  move(dir) {
    if (['HURT', 'DEFEATED', 'DODGE', 'VICTORY'].includes(this.state)) return;

    if (this.state.startsWith('ATTACK_') || this.state === 'SPECIAL') {
      // Very slight air/ground drift while attacking
      this.vx = dir * 40;
      return;
    }

    if (this.state === 'BLOCK') {
      this.vx = dir * 70;
      return;
    }

    this.facing = dir;
    this.vx = dir * 320;

    if (this.onGround && this.state !== 'RUN') {
      this.changeState('RUN');
    }
  }

  stopMove() {
    if (this.state === 'RUN') {
      this.changeState('IDLE');
    }
  }

  jump() {
    if (!this.onGround || ['HURT', 'DEFEATED', 'DODGE', 'SPECIAL'].includes(this.state)) return;
    if (this.state.startsWith('ATTACK_')) return;

    this.vy = -640;
    this.onGround = false;
    this.changeState('JUMP');

    if (window.audioManager) window.audioManager.playJump();
    if (window.particleSystem) window.particleSystem.emitDust(this.x, this.groundY, 8);
  }

  crouch() {
    if (!this.onGround || ['HURT', 'DEFEATED', 'DODGE'].includes(this.state)) return;
    if (this.state.startsWith('ATTACK_')) return;
    this.changeState('CROUCH');
  }

  uncrouch() {
    if (this.state === 'CROUCH') {
      this.changeState('IDLE');
    }
  }

  startAttack(attackStep = 1) {
    if (['HURT', 'DEFEATED', 'DODGE'].includes(this.state)) return;

    // If currently in attack, buffer next attack in combo chain
    if (this.state === 'ATTACK_1' && attackStep === 1) {
      if (this.stateTimer > 0.12) this.comboBufferedAttack = true;
      return;
    }
    if (this.state === 'ATTACK_2' && attackStep === 1) {
      if (this.stateTimer > 0.14) this.comboBufferedAttack = true;
      return;
    }

    if (this.state.startsWith('ATTACK_') && attackStep === 1) return;

    const stateName = `ATTACK_${attackStep}`;
    this.changeState(stateName);
    this.hasHitTarget = false;

    // Small forward lunge on attack
    this.vx = this.facing * (attackStep === 3 ? 180 : 120);

    if (window.audioManager) {
      window.audioManager.playSwing(attackStep);
    }
  }

  startSpecial() {
    if (['HURT', 'DEFEATED', 'DODGE', 'SPECIAL'].includes(this.state)) return;
    if (this.state.startsWith('ATTACK_')) return;
    if (this.energy < 40) return; // SP Cost

    this.energy -= 40;
    this.changeState('SPECIAL');
    this.hasLaunchedProjectile = false;
    this.vx = -this.facing * 80; // slight backward recoil stance

    if (window.audioManager) {
      window.audioManager.playSpecialBlast();
    }
    if (window.particleSystem) {
      window.particleSystem.emitShockwave(this.x, this.y - 45, this.themeColor, 50);
    }
  }

  spawnSpecialProjectile() {
    const projX = this.x + this.facing * 36;
    const projY = this.y - 48;
    const proj = new Projectile(projX, projY, 580, 0, this.facing, this, this.themeColor, 180);
    this.projectiles.push(proj);
  }

  dodge() {
    if (this.dodgeCooldown > 0) return;
    if (['HURT', 'DEFEATED', 'DODGE'].includes(this.state)) return;
    if (this.energy < 15) return; // Stamina cost

    this.energy = Math.max(0, this.energy - 15);
    this.changeState('DODGE');
    this.dodgeCooldown = 0.65; // prevent spam
    this.vx = this.facing * 650;

    if (window.audioManager) window.audioManager.playDodge();
    if (window.particleSystem) {
      window.particleSystem.emitDust(this.x, this.groundY, 10);
      window.particleSystem.addGhostTrail(this);
    }
  }

  startBlock() {
    if (['HURT', 'DEFEATED', 'DODGE', 'SPECIAL'].includes(this.state)) return;
    if (this.state.startsWith('ATTACK_')) return;
    this.changeState('BLOCK');
  }

  stopBlock() {
    if (this.state === 'BLOCK') {
      this.changeState('IDLE');
    }
  }

  takeDamage(amount, hitstun = 0.25, causesHitstun = true) {
    if (this.state === 'DEFEATED') return;

    this.health = Math.max(0, this.health - amount);

    if (this.health <= 0) {
      this.health = 0;
      this.changeState('DEFEATED');
      this.vy = -260; // death recoil hop
      return;
    }

    if (causesHitstun) {
      this.hitstunTimer = hitstun;
      this.changeState('HURT');
    }
  }

  updateScarfPhysics(dt) {
    // Flowing cyber scarf simulation
    const anchorX = this.x - this.facing * 8;
    const anchorY = this.y - 62;
    this.scarfPoints[0].x = anchorX;
    this.scarfPoints[0].y = anchorY;

    for (let i = 1; i < this.scarfPoints.length; i++) {
      const p = this.scarfPoints[i];
      const prev = this.scarfPoints[i - 1];

      // Wind and movement inertia
      const wind = Math.sin(this.animTime * 6 + i) * 6;
      const targetX = prev.x - this.facing * 10 - this.vx * 0.04;
      const targetY = prev.y + 4 + Math.sin(this.animTime * 8 + i) * 3;

      p.x += (targetX - p.x) * 12 * dt;
      p.y += (targetY - p.y) * 12 * dt;
    }
  }

  /* ==========================================================
     PROCEDURAL 2D PIXEL-ART RENDERER
     ========================================================== */
  render(ctx) {
    // 1. Render floor drop shadow
    ctx.save();
    const shadowDist = Math.max(0, this.groundY - this.y);
    const shadowScale = Math.max(0.4, 1 - shadowDist / 400);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(this.x, this.groundY + 4, 24 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Render Projectiles
    for (const proj of this.projectiles) {
      proj.render(ctx);
    }

    // 3. Render Fighter Body
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    // If dodging or hurt, visual flash
    if (this.isDodging) {
      ctx.globalAlpha = 0.55;
    } else if (this.state === 'HURT') {
      ctx.globalAlpha = (Math.sin(this.stateTimer * 40) > 0) ? 0.4 : 1.0;
    }

    // Draw Cyber Scarf (Behind character)
    this.renderScarf(ctx);

    // Calculate articulation offsets
    let legOffset = 0;
    let bodyBob = 0;
    let weaponAngle = 0;
    let weaponOffsetY = 0;

    if (this.state === 'RUN') {
      legOffset = Math.sin(this.runCycle) * 16;
      bodyBob = Math.abs(Math.sin(this.runCycle)) * 4;
      weaponAngle = 0.3 + Math.sin(this.runCycle) * 0.2;
    } else if (this.state === 'JUMP') {
      legOffset = -6;
      bodyBob = -4;
      weaponAngle = -0.4;
    } else if (this.state === 'FALL') {
      legOffset = 4;
      bodyBob = 0;
      weaponAngle = 0.2;
    } else if (this.state === 'CROUCH') {
      bodyBob = 16;
      weaponOffsetY = 12;
    } else if (this.state === 'ATTACK_1') {
      weaponAngle = -1.2 + (this.stateTimer / 0.28) * 2.4;
      weaponOffsetY = -4;
    } else if (this.state === 'ATTACK_2') {
      weaponAngle = 0.1;
      weaponOffsetY = -8;
    } else if (this.state === 'ATTACK_3') {
      weaponAngle = -2.2 + (this.stateTimer / 0.44) * 3.8;
      bodyBob = -8;
    } else if (this.state === 'SPECIAL') {
      weaponAngle = -0.8;
    } else if (this.state === 'BLOCK') {
      weaponAngle = -0.5;
      weaponOffsetY = 4;
    } else if (this.state === 'DEFEATED') {
      bodyBob = 28;
      weaponAngle = 1.4;
    }

    // Legs
    ctx.fillStyle = '#0f172a';
    // Back leg
    ctx.fillRect(-10 - legOffset * 0.5, -34 + bodyBob, 8, 34);
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(-10 - legOffset * 0.5, -8 + bodyBob, 8, 8); // cyber boot

    // Front leg
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(2 + legOffset * 0.5, -34 + bodyBob, 8, 34);
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(2 + legOffset * 0.5, -8 + bodyBob, 8, 8); // cyber boot

    // Torso Armor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-14, -64 + bodyBob, 28, 32);

    // Armor chestplate
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(-12, -62 + bodyBob, 24, 20);

    // Glowing Energy Reactor Core (Center chest)
    ctx.fillStyle = this.themeColor;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(-4, -54 + bodyBob, 8, 8);
    ctx.shadowBlur = 0;

    // Cyber Helmet & Visor
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-11, -78 + bodyBob, 22, 16);
    // Helmet crest
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(-8, -82 + bodyBob, 16, 4);

    // Glowing Neon Visor
    ctx.fillStyle = this.visorColor;
    ctx.shadowColor = this.visorColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(0, -74 + bodyBob, 12, 5); // Visor eye slit
    ctx.shadowBlur = 0;

    // Cyber Plasma Katana / Weapon
    this.renderWeapon(ctx, weaponAngle, weaponOffsetY + bodyBob);

    // Block Energy Shield (Frontal Barrier)
    if (this.state === 'BLOCK') {
      this.renderShieldBarrier(ctx);
    }

    ctx.restore();
  }

  renderScarf(ctx) {
    ctx.save();
    ctx.strokeStyle = this.themeColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(this.scarfPoints[0].x - this.x, this.scarfPoints[0].y - this.y);
    for (let i = 1; i < this.scarfPoints.length; i++) {
      ctx.lineTo(this.scarfPoints[i].x - this.x, this.scarfPoints[i].y - this.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  renderWeapon(ctx, angle, offsetY) {
    ctx.save();
    ctx.translate(6, -46 + offsetY);
    ctx.rotate(angle);

    // Blade Hilt
    ctx.fillStyle = '#334155';
    ctx.fillRect(-3, -2, 6, 8);

    // Plasma Energy Blade
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 14;
    ctx.fillRect(-2, -50, 4, 48);

    // Outer plasma edge
    ctx.strokeStyle = this.themeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(-2, -50, 4, 48);

    // Dynamic Attack Slash Trail Arc during attacks
    if (this.state.startsWith('ATTACK_')) {
      ctx.save();
      ctx.strokeStyle = this.themeColor;
      ctx.lineWidth = 6;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(0, 0, 52, -Math.PI * 0.4, Math.PI * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  renderShieldBarrier(ctx) {
    ctx.save();
    ctx.strokeStyle = this.themeColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 18;
    ctx.fillStyle = 'rgba(0, 240, 255, 0.15)';

    // Hexagonal forcefield polygon
    const hx = 22;
    const hy = -45;
    const hr = 34;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const px = hx + hr * Math.cos(a);
      const py = hy + hr * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
