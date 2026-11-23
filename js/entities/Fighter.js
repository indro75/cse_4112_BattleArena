/**
 * Fighter - Core combatant physics, combat state machine, and high-fidelity 2D animated rendering.
 * Features dedicated anime/cyberpunk rendering pipelines for both HERO and VILLAIN.
 */
class Fighter {
  constructor(x, y, facing, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = 48;
    this.height = 82;
    this.facing = facing; // 1 = right, -1 = left

    this.groundY = 580;
    this.onGround = true;

    // Entity character archetype: 'hero' or 'villain'
    this.type = options.type || (options.name === 'PLAYER' ? 'hero' : 'villain');

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
    this.title = options.title || (this.type === 'hero' ? 'CYBER WARRIOR' : 'CRIMSON REAPER');
    this.themeColor = options.themeColor || (this.type === 'hero' ? '#00f0ff' : '#ff0055');
    this.secondaryColor = options.secondaryColor || (this.type === 'hero' ? '#0066cc' : '#88002a');
    this.accentColor = options.accentColor || (this.type === 'hero' ? '#ffffff' : '#ffaa00');
    this.visorColor = options.visorColor || (this.type === 'hero' ? '#00ffff' : '#ff0033');
    this.trailColor = options.trailColor || (this.type === 'hero' ? '#00f0ff' : '#ff0055');
    this.coreColor = options.coreColor || (this.type === 'hero' ? '#66ffff' : '#ff3300');

    // Animation physics & cycles
    this.animTime = Math.random() * 10;
    this.runCycle = 0;
    this.blinkTimer = Math.random() * 3 + 2;

    // Double-layered cape / scarf simulation nodes
    this.scarfPoints = [
      { x: 0, y: 0 }, { x: -8, y: 4 }, { x: -16, y: 9 }, { x: -26, y: 15 }, { x: -38, y: 22 }
    ];
    this.capePoints = [
      { x: 0, y: 0 }, { x: -10, y: 12 }, { x: -20, y: 26 }, { x: -30, y: 42 }, { x: -42, y: 60 }
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

    // Visor blink timer
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0) {
      this.blinkTimer = Math.random() * 3.5 + 2.0;
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.update(dt);
      if (proj.spent || proj.x < 80 || proj.x > 1200) {
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
        // Landing dust & shockwave sparks
        if (window.particleSystem) {
          window.particleSystem.emitDust(this.x, this.groundY, 8);
          window.particleSystem.emitSparks(this.x, this.groundY, this.themeColor, 6, 120);
        }
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

    // Ground friction
    if (this.onGround && !['RUN', 'DODGE'].includes(this.state)) {
      this.vx *= Math.pow(0.001, dt);
      if (Math.abs(this.vx) < 5) this.vx = 0;
    }

    // Update anime cape/scarf simulation
    this.updateClothPhysics(dt);
  }

  updateState(dt, opponent) {
    switch (this.state) {
      case 'RUN':
        this.runCycle += dt * 15;
        // Periodic run dust puffs
        if (Math.sin(this.runCycle) > 0.85 && window.particleSystem && Math.random() > 0.5) {
          window.particleSystem.emitDust(this.x - this.facing * 16, this.groundY, 2);
        }
        break;

      case 'ATTACK_1':
        // Active hitbox: 0.08s - 0.18s
        if (this.stateTimer >= 0.08 && this.stateTimer <= 0.18) {
          this.activeHitbox = new Hitbox(
            this.facing === 1 ? this.x + 10 : this.x - 72,
            this.y - 68,
            64,
            58,
            65, // Damage
            190, // Knockback X
            -35, // Knockback Y
            0.24, // Hitstun
            1
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
        // Active hitbox: 0.09s - 0.20s
        if (this.stateTimer >= 0.09 && this.stateTimer <= 0.20) {
          this.activeHitbox = new Hitbox(
            this.facing === 1 ? this.x + 12 : this.x - 78,
            this.y - 65,
            68,
            54,
            115, // Damage
            270, // Knockback X
            -65, // Knockback Y
            0.32,
            2
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
        // Finisher uppercut / spin cleave: 0.12s - 0.28s
        if (this.stateTimer >= 0.12 && this.stateTimer <= 0.28) {
          this.activeHitbox = new Hitbox(
            this.facing === 1 ? this.x + 12 : this.x - 84,
            this.y - 88,
            76,
            78,
            185, // Heavy Damage
            430, // Knockback X
            -270, // Launch Y
            0.46,
            3
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
        if (window.particleSystem && Math.random() > 0.35) {
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
     COMBAT ACTIONS
     ========================================================== */
  move(dir) {
    if (['HURT', 'DEFEATED', 'DODGE', 'VICTORY'].includes(this.state)) return;

    if (this.state.startsWith('ATTACK_') || this.state === 'SPECIAL') {
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
    if (window.particleSystem) {
      window.particleSystem.emitDust(this.x, this.groundY, 8);
      // Cyber booster thruster flame burst!
      window.particleSystem.emitSparks(this.x - this.facing * 8, this.y - 10, this.themeColor, 8, 180);
    }
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

    // Forward momentum surge
    this.vx = this.facing * (attackStep === 3 ? 190 : 130);

    if (window.audioManager) {
      window.audioManager.playSwing(attackStep);
    }
  }

  startSpecial() {
    if (['HURT', 'DEFEATED', 'DODGE', 'SPECIAL'].includes(this.state)) return;
    if (this.state.startsWith('ATTACK_')) return;
    if (this.energy < 40) return;

    this.energy -= 40;
    this.changeState('SPECIAL');
    this.hasLaunchedProjectile = false;
    this.vx = -this.facing * 90;

    if (window.audioManager) {
      window.audioManager.playSpecialBlast();
    }
    if (window.particleSystem) {
      window.particleSystem.emitShockwave(this.x, this.y - 45, this.themeColor, 65);
      window.particleSystem.emitSparks(this.x, this.y - 45, this.accentColor, 16, 280);
    }
  }

  spawnSpecialProjectile() {
    const projX = this.x + this.facing * 40;
    const projY = this.y - 48;
    const proj = new Projectile(projX, projY, 600, 0, this.facing, this, this.themeColor, 185);
    this.projectiles.push(proj);
  }

  dodge() {
    if (this.dodgeCooldown > 0) return;
    if (['HURT', 'DEFEATED', 'DODGE'].includes(this.state)) return;
    if (this.energy < 15) return;

    this.energy = Math.max(0, this.energy - 15);
    this.changeState('DODGE');
    this.dodgeCooldown = 0.65;
    this.vx = this.facing * 660;

    if (window.audioManager) window.audioManager.playDodge();
    if (window.particleSystem) {
      window.particleSystem.emitDust(this.x, this.groundY, 10);
      window.particleSystem.addGhostTrail(this);
      window.particleSystem.emitSparks(this.x, this.y - 30, this.themeColor, 8, 220);
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
      this.vy = -270;
      return;
    }

    if (causesHitstun) {
      this.hitstunTimer = hitstun;
      this.changeState('HURT');
    }
  }

  updateClothPhysics(dt) {
    // 1. Scarf Physics
    const sAnchorX = this.x - this.facing * 10;
    const sAnchorY = this.y - 62;
    this.scarfPoints[0].x = sAnchorX;
    this.scarfPoints[0].y = sAnchorY;

    for (let i = 1; i < this.scarfPoints.length; i++) {
      const p = this.scarfPoints[i];
      const prev = this.scarfPoints[i - 1];
      const targetX = prev.x - this.facing * 11 - this.vx * 0.04;
      const targetY = prev.y + 4 + Math.sin(this.animTime * 9 + i * 0.8) * 4;

      p.x += (targetX - p.x) * 14 * dt;
      p.y += (targetY - p.y) * 14 * dt;
    }

    // 2. Villain Cape Physics
    const cAnchorX = this.x - this.facing * 12;
    const cAnchorY = this.y - 58;
    this.capePoints[0].x = cAnchorX;
    this.capePoints[0].y = cAnchorY;

    for (let i = 1; i < this.capePoints.length; i++) {
      const p = this.capePoints[i];
      const prev = this.capePoints[i - 1];
      const targetX = prev.x - this.facing * 12 - this.vx * 0.05;
      const targetY = prev.y + 11 + Math.sin(this.animTime * 7 + i * 0.9) * 3;

      p.x += (targetX - p.x) * 12 * dt;
      p.y += (targetY - p.y) * 12 * dt;
    }
  }

  /* ==========================================================
     HIGH-FIDELITY ANIMATED PROCEDURAL RENDERER
     ========================================================== */
  render(ctx) {
    // 1. Floor Drop Shadow (Dynamic scale and alpha)
    ctx.save();
    const shadowDist = Math.max(0, this.groundY - this.y);
    const shadowScale = Math.max(0.35, 1 - shadowDist / 420);
    const shadowAlpha = Math.max(0.2, 0.55 - shadowDist / 500);

    const shadowGrad = ctx.createRadialGradient(this.x, this.groundY + 3, 4, this.x, this.groundY + 3, 28 * shadowScale);
    shadowGrad.addColorStop(0, `rgba(0, 0, 0, ${shadowAlpha})`);
    shadowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(this.x, this.groundY + 3, 28 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Render Projectiles
    for (const proj of this.projectiles) {
      proj.render(ctx);
    }

    // 3. Render Fighter Body & Animations
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    // Visual feedback for Dodge / Hurt / Invulnerability
    if (this.isDodging) {
      ctx.globalAlpha = 0.5;
    } else if (this.state === 'HURT') {
      ctx.globalAlpha = (Math.sin(this.stateTimer * 45) > 0) ? 0.35 : 1.0;
    }

    // Calculate dynamic articulation offsets
    const anim = this.calculatePoseOffsets();

    // Render Energy Aura when charged (SP >= 40) or during Special Attack
    if (this.energy >= 40 || this.state === 'SPECIAL') {
      this.renderEnergyAura(ctx, anim);
    }

    // Branch to dedicated character model pipeline!
    if (this.type === 'hero') {
      this.renderHero(ctx, anim);
    } else {
      this.renderVillain(ctx, anim);
    }

    // Render Defensive Barrier
    if (this.state === 'BLOCK') {
      this.renderShieldBarrier(ctx);
    }

    ctx.restore();
  }

  calculatePoseOffsets() {
    let legOffset = 0;
    let bodyBob = 0;
    let bodyTilt = 0;
    let weaponAngle = 0;
    let weaponOffsetX = 0;
    let weaponOffsetY = 0;

    // Idle breathing
    const idleBreath = Math.sin(this.animTime * 3) * 2;
    bodyBob = idleBreath;

    if (this.state === 'RUN') {
      legOffset = Math.sin(this.runCycle) * 18;
      bodyBob = Math.abs(Math.sin(this.runCycle)) * 5;
      bodyTilt = 0.12; // forward lean
      weaponAngle = 0.4 + Math.sin(this.runCycle) * 0.25;
    } else if (this.state === 'JUMP') {
      legOffset = -7;
      bodyBob = -5;
      bodyTilt = -0.08;
      weaponAngle = -0.5;
    } else if (this.state === 'FALL') {
      legOffset = 5;
      bodyBob = 0;
      weaponAngle = 0.3;
    } else if (this.state === 'CROUCH') {
      bodyBob = 18;
      bodyTilt = 0.15;
      weaponOffsetY = 12;
      weaponAngle = 0.2;
    } else if (this.state === 'ATTACK_1') {
      bodyTilt = 0.18;
      weaponAngle = -1.5 + (this.stateTimer / 0.28) * 3.2; // dynamic horizontal arc
      weaponOffsetX = 8;
      weaponOffsetY = -4;
    } else if (this.state === 'ATTACK_2') {
      bodyTilt = 0.22;
      weaponAngle = 0.05; // straight piercing thrust
      weaponOffsetX = 16 * Math.sin(this.stateTimer / 0.32 * Math.PI);
      weaponOffsetY = -6;
    } else if (this.state === 'ATTACK_3') {
      bodyBob = -10;
      bodyTilt = -0.15;
      weaponAngle = -2.6 + (this.stateTimer / 0.44) * 4.6; // spinning uppercut arc
      weaponOffsetX = 10;
      weaponOffsetY = -12;
    } else if (this.state === 'SPECIAL') {
      bodyTilt = -0.12;
      weaponAngle = -1.1; // draw-back stance
      weaponOffsetX = -6;
    } else if (this.state === 'BLOCK') {
      bodyTilt = -0.1;
      weaponAngle = -0.6;
      weaponOffsetY = 6;
    } else if (this.state === 'DEFEATED') {
      bodyBob = 30;
      bodyTilt = 0.4;
      weaponAngle = 1.6;
    } else if (this.state === 'VICTORY') {
      bodyBob = -4;
      weaponAngle = -2.1; // victorious raised blade
      weaponOffsetY = -16;
    }

    return { legOffset, bodyBob, bodyTilt, weaponAngle, weaponOffsetX, weaponOffsetY };
  }

  /* ==========================================================
     HERO RENDERER: CYBER SHINOBI / ANIME BLADE WARRIOR
     ========================================================== */
  renderHero(ctx, anim) {
    const { legOffset, bodyBob, bodyTilt, weaponAngle, weaponOffsetX, weaponOffsetY } = anim;

    // 1. Flowing Cyber Scarf (Behind character)
    this.renderHeroScarf(ctx);

    ctx.save();
    ctx.rotate(bodyTilt);

    // 2. Back Leg & Shinobi Boot
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(-10 - legOffset * 0.45, -36 + bodyBob, 9, 36);
    // Armor knee guard
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(-11 - legOffset * 0.45, -24 + bodyBob, 11, 8);
    // Boot & glowing heel thruster
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-11 - legOffset * 0.45, -10 + bodyBob, 11, 10);
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(-13 - legOffset * 0.45, -8 + bodyBob, 3, 5); // Thruster nozzle

    // 3. Front Leg & Shinobi Boot
    ctx.fillStyle = '#111a2e';
    ctx.fillRect(2 + legOffset * 0.45, -36 + bodyBob, 10, 36);
    // Armor knee guard
    ctx.fillStyle = this.secondaryColor;
    ctx.fillRect(1 + legOffset * 0.45, -24 + bodyBob, 12, 8);
    // Boot & glowing heel thruster
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(1 + legOffset * 0.45, -10 + bodyBob, 12, 10);
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(-1 + legOffset * 0.45, -8 + bodyBob, 3, 5); // Thruster nozzle

    // Jump / Dash booster jet flame
    if (!this.onGround || this.isDodging) {
      ctx.fillStyle = this.themeColor;
      ctx.shadowColor = this.themeColor;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(-13 - legOffset * 0.45, -6 + bodyBob);
      ctx.lineTo(-24 - legOffset * 0.45, -3 + bodyBob);
      ctx.lineTo(-13 - legOffset * 0.45, -1 + bodyBob);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 4. Armored Torso
    // Undersuit
    ctx.fillStyle = '#070b14';
    ctx.fillRect(-14, -66 + bodyBob, 28, 32);

    // Chrome/Slate Chestplate
    ctx.fillStyle = '#18243b';
    ctx.beginPath();
    ctx.moveTo(-13, -64 + bodyBob);
    ctx.lineTo(13, -64 + bodyBob);
    ctx.lineTo(10, -36 + bodyBob);
    ctx.lineTo(-10, -36 + bodyBob);
    ctx.closePath();
    ctx.fill();

    // Armor Bevels & Accent Trim
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Utility Belt & Power Conduits
    ctx.fillStyle = '#0d1526';
    ctx.fillRect(-12, -38 + bodyBob, 24, 5);
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(-4, -37 + bodyBob, 8, 3); // Belt buckle

    // Arc Reactor Core (Pulsing glowing chest center)
    const corePulse = 1 + Math.sin(this.animTime * 8) * 0.2;
    ctx.save();
    ctx.fillStyle = this.coreColor;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 12 * corePulse;
    ctx.beginPath();
    ctx.arc(0, -52 + bodyBob, 5 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Rotating reactor spokes
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    const rAngle = this.animTime * 4;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rAngle) * 5, -52 + bodyBob + Math.sin(rAngle) * 5);
    ctx.lineTo(-Math.cos(rAngle) * 5, -52 + bodyBob - Math.sin(rAngle) * 5);
    ctx.stroke();
    ctx.restore();

    // 5. Shoulder Pauldron
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-8, -67 + bodyBob);
    ctx.lineTo(8, -67 + bodyBob);
    ctx.lineTo(13, -56 + bodyBob);
    ctx.lineTo(-4, -56 + bodyBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.themeColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 6. Anime Cyber Head, Spiky Hair & Glowing Visor
    // Neck
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(-5, -70 + bodyBob, 10, 6);

    // Shinobi Respirator Mask & Face
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(-10, -82 + bodyBob);
    ctx.lineTo(10, -82 + bodyBob);
    ctx.lineTo(8, -68 + bodyBob);
    ctx.lineTo(0, -65 + bodyBob);
    ctx.lineTo(-8, -68 + bodyBob);
    ctx.closePath();
    ctx.fill();

    // Mask air filter vents
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(0, -71 + bodyBob, 7, 2);
    ctx.fillRect(0, -68 + bodyBob, 6, 2);

    // Glowing Neon Visor / Eye (with animated glint)
    const isBlinking = this.blinkTimer < 0.12;
    if (!isBlinking) {
      ctx.fillStyle = this.visorColor;
      ctx.shadowColor = this.visorColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(1, -78 + bodyBob);
      ctx.lineTo(11, -78 + bodyBob);
      ctx.lineTo(10, -74 + bodyBob);
      ctx.lineTo(3, -74 + bodyBob);
      ctx.closePath();
      ctx.fill();

      // Sharp white optical pupil glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6 + Math.sin(this.animTime * 2) * 2, -77 + bodyBob, 2, 2);
      ctx.shadowBlur = 0;
    }

    // Shinobi Forehead Headband
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-11, -85 + bodyBob, 22, 5);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-4, -84 + bodyBob, 8, 3); // Metal plate

    // Spiky Futuristic Anime Hair (Layered with cyan energy streaks)
    this.renderHeroHair(ctx, bodyBob);

    // 7. Arms, Katana & dynamic attack slash effects
    this.renderHeroWeapon(ctx, weaponAngle, weaponOffsetX, weaponOffsetY + bodyBob);

    ctx.restore();
  }

  renderHeroHair(ctx, bodyBob) {
    const hairSway = Math.sin(this.animTime * 6) * 3;

    // Dark base hair spikes
    ctx.fillStyle = '#0d1829';
    ctx.beginPath();
    // Top-back spike
    ctx.moveTo(-8, -84 + bodyBob);
    ctx.lineTo(-20 + hairSway, -92 + bodyBob);
    ctx.lineTo(-12, -87 + bodyBob);
    // Main crown spike
    ctx.lineTo(-8 + hairSway * 0.5, -99 + bodyBob);
    ctx.lineTo(0, -87 + bodyBob);
    // Forward front bangs
    ctx.lineTo(8 + hairSway * 0.3, -95 + bodyBob);
    ctx.lineTo(7, -84 + bodyBob);
    ctx.lineTo(11, -80 + bodyBob);
    ctx.lineTo(8, -82 + bodyBob);
    ctx.closePath();
    ctx.fill();

    // Glowing cyan anime hair highlights
    ctx.fillStyle = this.themeColor;
    ctx.beginPath();
    ctx.moveTo(-10, -86 + bodyBob);
    ctx.lineTo(-17 + hairSway, -91 + bodyBob);
    ctx.lineTo(-11, -88 + bodyBob);
    ctx.lineTo(-7 + hairSway * 0.5, -96 + bodyBob);
    ctx.lineTo(-3, -88 + bodyBob);
    ctx.lineTo(6 + hairSway * 0.3, -93 + bodyBob);
    ctx.lineTo(4, -86 + bodyBob);
    ctx.closePath();
    ctx.fill();
  }

  renderHeroScarf(ctx) {
    ctx.save();
    // Double layered cyber scarf with gradient
    for (let layer = 0; layer < 2; layer++) {
      ctx.beginPath();
      ctx.moveTo(this.scarfPoints[0].x - this.x, this.scarfPoints[0].y - this.y + layer * 3);
      for (let i = 1; i < this.scarfPoints.length; i++) {
        const p = this.scarfPoints[i];
        ctx.lineTo(p.x - this.x, p.y - this.y + layer * 4);
      }
      ctx.strokeStyle = layer === 0 ? this.themeColor : '#ffffff';
      ctx.lineWidth = layer === 0 ? 5 : 2;
      ctx.shadowColor = this.themeColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
    }
    ctx.restore();
  }

  renderHeroWeapon(ctx, angle, offsetX, offsetY) {
    ctx.save();
    ctx.translate(6 + offsetX, -48 + offsetY);
    ctx.rotate(angle);

    // Forearm Gauntlet
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-3, -2, 7, 10);
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(0, 0, 3, 6);

    // Katana Tsuba (Golden guard)
    ctx.fillStyle = '#ffb700';
    ctx.fillRect(-6, -3, 12, 3);

    // Hilt Grip with wrapping
    ctx.fillStyle = '#0a101d';
    ctx.fillRect(-2, 0, 5, 12);
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(-2, 11, 5, 2); // Pommel

    // Plasma Katana Blade ("Muramasa-09")
    // Outer energy glow aura
    ctx.fillStyle = this.themeColor;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 16;
    ctx.fillRect(-2, -54, 5, 52);

    // White-hot plasma core beam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -52, 3, 50);

    // Blade tip point
    ctx.beginPath();
    ctx.moveTo(-1, -52);
    ctx.lineTo(0.5, -58);
    ctx.lineTo(2, -52);
    ctx.closePath();
    ctx.fill();

    // Dynamic Attack Slash Trail Arc & Speedlines during attacks
    if (this.state.startsWith('ATTACK_')) {
      const step = this.state === 'ATTACK_3' ? 3 : (this.state === 'ATTACK_2' ? 2 : 1);
      this.renderAnimeSlashArc(ctx, step, this.themeColor, '#ffffff');
    }

    ctx.restore();
  }

  /* ==========================================================
     VILLAIN RENDERER: DEMONIC CYBER MECHA / CRIMSON REAPER
     ========================================================== */
  renderVillain(ctx, anim) {
    const { legOffset, bodyBob, bodyTilt, weaponAngle, weaponOffsetX, weaponOffsetY } = anim;

    // 1. Tattered Demonic Reaper Cloak (Behind character)
    this.renderVillainCape(ctx);

    ctx.save();
    ctx.rotate(bodyTilt);

    // 2. Heavy Back Mecha Leg
    ctx.fillStyle = '#120811';
    ctx.fillRect(-12 - legOffset * 0.45, -38 + bodyBob, 11, 38);
    // Red power conduit
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(-11 - legOffset * 0.45, -28 + bodyBob, 2, 14);
    // Heavy Spiked Sabaton (Boot)
    ctx.fillStyle = '#220f20';
    ctx.fillRect(-13 - legOffset * 0.45, -12 + bodyBob, 13, 12);
    ctx.fillStyle = '#3a1634';
    ctx.fillRect(-14 - legOffset * 0.45, -4 + bodyBob, 4, 4); // Toe claw

    // 3. Heavy Front Mecha Leg
    ctx.fillStyle = '#1c0c1b';
    ctx.fillRect(2 + legOffset * 0.45, -38 + bodyBob, 12, 38);
    // Red power conduit
    ctx.fillStyle = this.themeColor;
    ctx.fillRect(8 + legOffset * 0.45, -28 + bodyBob, 2, 14);
    // Heavy Spiked Sabaton (Boot)
    ctx.fillStyle = '#2d132a';
    ctx.fillRect(1 + legOffset * 0.45, -12 + bodyBob, 14, 12);
    ctx.fillStyle = '#4a1a42';
    ctx.fillRect(13 + legOffset * 0.45, -4 + bodyBob, 4, 4); // Toe claw

    // 4. Heavy Obsidian Ribcage & Biomechanical Torso
    ctx.fillStyle = '#0f050e';
    ctx.fillRect(-16, -68 + bodyBob, 32, 34);

    // Angled Demon Armor Plates
    ctx.fillStyle = '#250f22';
    ctx.beginPath();
    ctx.moveTo(-16, -66 + bodyBob);
    ctx.lineTo(16, -66 + bodyBob);
    ctx.lineTo(12, -36 + bodyBob);
    ctx.lineTo(-12, -36 + bodyBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.secondaryColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dark Matter Core (Unstable pulsing crimson / purple singularity)
    const corePulse = 1 + Math.sin(this.animTime * 9) * 0.25;
    ctx.save();
    ctx.fillStyle = this.coreColor;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 18 * corePulse;
    ctx.beginPath();
    ctx.arc(0, -53 + bodyBob, 6 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Demonic core electric tendrils
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    const a = this.animTime * 6;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 6, -53 + bodyBob + Math.sin(a) * 6);
    ctx.lineTo(Math.cos(a + 2) * 8, -53 + bodyBob + Math.sin(a + 2) * 8);
    ctx.stroke();
    ctx.restore();

    // 5. Massive Spiked Mecha Pauldrons
    ctx.fillStyle = '#3a1435';
    // Front spiked shoulder
    ctx.beginPath();
    ctx.moveTo(-8, -70 + bodyBob);
    ctx.lineTo(16, -70 + bodyBob);
    ctx.lineTo(24, -62 + bodyBob); // shoulder blade spike
    ctx.lineTo(14, -54 + bodyBob);
    ctx.lineTo(-6, -56 + bodyBob);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.themeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 6. Demonic Horned Helmet & Triple-Eye Visor Array
    ctx.fillStyle = '#0f050e';
    ctx.fillRect(-6, -72 + bodyBob, 12, 6); // Heavy neck

    // Oni Demonic Helmet Faceplate
    ctx.fillStyle = '#220c1f';
    ctx.beginPath();
    ctx.moveTo(-12, -86 + bodyBob);
    ctx.lineTo(12, -86 + bodyBob);
    ctx.lineTo(9, -70 + bodyBob);
    ctx.lineTo(0, -66 + bodyBob); // sharp chin
    ctx.lineTo(-9, -70 + bodyBob);
    ctx.closePath();
    ctx.fill();

    // Cooling vapor exhaust vents
    ctx.fillStyle = '#0a0309';
    ctx.fillRect(0, -73 + bodyBob, 8, 2);
    ctx.fillRect(0, -70 + bodyBob, 6, 2);

    // Curved Demonic Obsidian Horns with Glowing Tips
    this.renderVillainHorns(ctx, bodyBob);

    // Triple Optical Eye Sensor Array (3 glowing predatory red eyes)
    const isBlinking = this.blinkTimer < 0.12;
    if (!isBlinking) {
      ctx.fillStyle = this.visorColor;
      ctx.shadowColor = this.visorColor;
      ctx.shadowBlur = 14;
      // Top eye
      ctx.beginPath();
      ctx.arc(6, -81 + bodyBob, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Mid eye
      ctx.beginPath();
      ctx.arc(9, -77 + bodyBob, 2.2, 0, Math.PI * 2);
      ctx.fill();
      // Lower eye
      ctx.beginPath();
      ctx.arc(4, -75 + bodyBob, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // 7. Heavy Cleaver Blade & Savage Attack Visuals
    this.renderVillainWeapon(ctx, weaponAngle, weaponOffsetX, weaponOffsetY + bodyBob);

    ctx.restore();
  }

  renderVillainHorns(ctx, bodyBob) {
    // Back horn
    ctx.fillStyle = '#110610';
    ctx.beginPath();
    ctx.moveTo(-6, -86 + bodyBob);
    ctx.quadraticCurveTo(-18, -94 + bodyBob, -24, -104 + bodyBob);
    ctx.quadraticCurveTo(-14, -98 + bodyBob, -2, -88 + bodyBob);
    ctx.closePath();
    ctx.fill();

    // Front large curved demon horn
    ctx.fillStyle = '#2b0f27';
    ctx.beginPath();
    ctx.moveTo(0, -86 + bodyBob);
    ctx.quadraticCurveTo(10, -96 + bodyBob, 18, -108 + bodyBob);
    ctx.quadraticCurveTo(8, -98 + bodyBob, -4, -86 + bodyBob);
    ctx.closePath();
    ctx.fill();

    // Glowing crimson horn tips
    ctx.fillStyle = this.themeColor;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(18, -108 + bodyBob, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-24, -104 + bodyBob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  renderVillainCape(ctx) {
    ctx.save();
    // Tattered demonic cloak with glowing circuit runes
    ctx.fillStyle = '#200a1c';
    ctx.strokeStyle = this.themeColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(this.capePoints[0].x - this.x, this.capePoints[0].y - this.y);
    for (let i = 1; i < this.capePoints.length; i++) {
      const p = this.capePoints[i];
      ctx.lineTo(p.x - this.x, p.y - this.y);
    }
    // Jagged tattered bottom edge
    const last = this.capePoints[this.capePoints.length - 1];
    ctx.lineTo(last.x - this.x + 8, last.y - this.y - 12);
    ctx.lineTo(last.x - this.x + 16, last.y - this.y);
    ctx.lineTo(this.capePoints[0].x - this.x + 8, this.capePoints[0].y - this.y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  renderVillainWeapon(ctx, angle, offsetX, offsetY) {
    ctx.save();
    ctx.translate(8 + offsetX, -46 + offsetY);
    ctx.rotate(angle);

    // Heavy Biomechanical Gauntlet
    ctx.fillStyle = '#2d132a';
    ctx.fillRect(-4, -4, 9, 12);

    // Demonic Cleaver Shaft
    ctx.fillStyle = '#140612';
    ctx.fillRect(-3, 0, 6, 16);

    // Serrated Executioner Cleaver Blade
    // Heavy obsidian spine
    ctx.fillStyle = '#240a20';
    ctx.beginPath();
    ctx.moveTo(-4, -60);
    ctx.lineTo(12, -60);
    ctx.lineTo(16, -10);
    ctx.lineTo(-4, 0);
    ctx.closePath();
    ctx.fill();

    // Glowing crimson serrated plasma edge
    ctx.fillStyle = this.themeColor;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(12, -60);
    ctx.lineTo(16, -10);
    ctx.lineTo(8, -10);
    ctx.lineTo(5, -58);
    ctx.closePath();
    ctx.fill();

    // Jagged energy teeth along blade
    ctx.fillStyle = '#ffffff';
    for (let ty = -50; ty <= -15; ty += 10) {
      ctx.beginPath();
      ctx.moveTo(12, ty);
      ctx.lineTo(18, ty + 4);
      ctx.lineTo(12, ty + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Savage Crimson Attack Slash Arcs
    if (this.state.startsWith('ATTACK_')) {
      const step = this.state === 'ATTACK_3' ? 3 : (this.state === 'ATTACK_2' ? 2 : 1);
      this.renderAnimeSlashArc(ctx, step, this.themeColor, '#ff8800');
    }

    ctx.restore();
  }

  /* ==========================================================
     ANIME SLASH ARCS & SPEEDLINES
     ========================================================== */
  renderAnimeSlashArc(ctx, step, colorPrimary, colorAccent) {
    ctx.save();
    const progress = Math.min(1.0, this.stateTimer / 0.35);

    // Outer luminous energy crescent
    const radius = step === 3 ? 68 : (step === 2 ? 58 : 54);
    const startAngle = -Math.PI * 0.55 + progress * 0.3;
    const endAngle = Math.PI * 0.45;

    ctx.strokeStyle = colorPrimary;
    ctx.lineWidth = step === 3 ? 12 : 8;
    ctx.shadowColor = colorPrimary;
    ctx.shadowBlur = 24;
    ctx.globalAlpha = 0.85;

    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.stroke();

    // Inner bright core crescent
    ctx.strokeStyle = colorAccent;
    ctx.lineWidth = step === 3 ? 5 : 3;
    ctx.beginPath();
    ctx.arc(0, 0, radius, startAngle + 0.1, endAngle - 0.1);
    ctx.stroke();

    // Speedline streaks
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const sa = startAngle + i * 0.25;
      ctx.beginPath();
      ctx.moveTo(Math.cos(sa) * (radius - 12), Math.sin(sa) * (radius - 12));
      ctx.lineTo(Math.cos(sa) * (radius + 16), Math.sin(sa) * (radius + 16));
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ==========================================================
     ENERGY AURA (CHARGED SPECIAL READY)
     ========================================================== */
  renderEnergyAura(ctx, anim) {
    ctx.save();
    const auraAlpha = this.state === 'SPECIAL' ? 0.75 : 0.35;
    ctx.globalAlpha = auraAlpha;
    ctx.strokeStyle = this.themeColor;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2.5;

    const time = this.animTime * 10;
    // Radiant flame wisps climbing upward
    for (let i = 0; i < 5; i++) {
      const offsetX = (i - 2) * 10 + Math.sin(time + i) * 4;
      const startY = anim.bodyBob + 5;
      const height = 45 + Math.sin(time * 1.5 + i * 2) * 20;

      ctx.beginPath();
      ctx.moveTo(offsetX, startY);
      ctx.quadraticCurveTo(offsetX + Math.sin(time + i) * 8, startY - height * 0.5, offsetX, startY - height);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ==========================================================
     DEFENSIVE BARRIER SHIELD
     ========================================================== */
  renderShieldBarrier(ctx) {
    ctx.save();
    const hx = 26;
    const hy = -45;
    const hr = 38;

    // Glowing shield aura
    ctx.strokeStyle = this.themeColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = this.themeColor;
    ctx.shadowBlur = 24;

    const shieldGrad = ctx.createRadialGradient(hx, hy, 10, hx, hy, hr);
    shieldGrad.addColorStop(0, this.type === 'hero' ? 'rgba(0, 240, 255, 0.35)' : 'rgba(255, 0, 85, 0.35)');
    shieldGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shieldGrad;

    // Outer Hexagon
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

    // Inner rotating tech runes
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + this.animTime * 3;
      const px = hx + (hr * 0.6) * Math.cos(a);
      const py = hy + (hr * 0.6) * Math.sin(a);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }
}
