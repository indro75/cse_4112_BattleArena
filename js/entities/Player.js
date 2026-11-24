/**
 * Player - Handles keyboard input mappings to fighter actions.
 */
class Player extends Fighter {
  constructor(x, y, facing) {
    super(x, y, facing, {
      type: 'hero',
      name: 'PLAYER',
      title: 'CYBER WARRIOR',
      themeColor: '#00f0ff',
      secondaryColor: '#0066cc',
      accentColor: '#ffffff',
      visorColor: '#00ffff',
      trailColor: '#00f0ff',
      coreColor: '#66ffff'
    });

    this.level = 1;
    this.pendingSecondWave = 0;
  }

  applyLevel(level = 1) {
    const config = window.ProgressionSystem ? window.ProgressionSystem.getHeroConfig(level) : null;
    if (!config) return;

    this.level = config.level;
    this.title = config.title;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.maxEnergy = config.maxEnergy;
    this.energy = config.maxEnergy;
    this.attackMultiplier = config.attackMultiplier;
    this.moveSpeedBonus = config.moveSpeedBonus;
    this.energyRegenRate = config.energyRegenRate;
    this.dashRefund = config.dashRefund;
    this.passiveAura = config.passiveAura;
    this.twinProjectile = !!config.twinProjectile;
    this.lightningProc = !!config.lightningProc;
    this.blockReflect = config.blockReflect || 0;
    this.emperorNova = !!config.emperorNova;
    this.lifeSteal = config.lifeSteal || 0;
    this.superArmor = !!config.superArmor;
    this.levelData = config;
  }

  spawnSpecialProjectile() {
    const projX = this.x + this.facing * 42;
    const projY = this.y - 48;

    if (this.emperorNova) {
      // Level 5 Ultimate: Emperor Dragon Nova
      const proj = new Projectile(projX, projY, 640, 0, this.facing, this, '#ffd700', Math.round(260 * this.attackMultiplier), 1.85);
      this.projectiles.push(proj);
      if (window.particleSystem) {
        window.particleSystem.emitShockwave(projX, projY, '#ffd700', 100);
        window.particleSystem.emitSparks(projX, projY, '#00f0ff', 24, 380);
      }
      if (window.game && window.game.camera) {
        window.game.camera.shake(12, 0.35);
      }
    } else if (this.twinProjectile) {
      // Level 3-4 Skill: Twin Lightning Crescent Waves
      const proj1 = new Projectile(projX, projY - 6, 620, 0, this.facing, this, '#00f0ff', Math.round(140 * this.attackMultiplier), 1.05);
      this.projectiles.push(proj1);
      this.pendingSecondWave = 0.12;
    } else {
      // Standard Level 1-2 Dragon Wave
      const proj = new Projectile(projX, projY, 600, 0, this.facing, this, this.themeColor, Math.round(185 * this.attackMultiplier), 1.0);
      this.projectiles.push(proj);
    }
  }

  handleInput(input, opponent) {
    if (this.isDefeated) return;

    // Auto-face opponent when in neutral IDLE state and not attacking
    if (this.state === 'IDLE' && opponent) {
      if (opponent.x < this.x - 20) {
        this.facing = -1;
      } else if (opponent.x > this.x + 20) {
        this.facing = 1;
      }
    }

    // Dodge action (Highest priority mobility)
    if (input.isJustPressed('dodge')) {
      this.dodge();
      return;
    }

    // Special attack
    if (input.isJustPressed('special')) {
      this.startSpecial();
      return;
    }

    // Basic attack (chains combo)
    if (input.isJustPressed('attack')) {
      this.startAttack(1);
      return;
    }

    // Block action (held down)
    if (input.isDown('block')) {
      this.startBlock();
      return;
    } else if (this.isBlocking) {
      this.stopBlock();
    }

    // Jump
    if (input.isJustPressed('jump')) {
      this.jump();
    }

    // Crouch / Fast Drop
    if (input.isDown('crouch')) {
      this.crouch();
    } else if (this.state === 'CROUCH') {
      this.uncrouch();
    }

    // Horizontal Movement
    const left = input.isDown('moveLeft');
    const right = input.isDown('moveRight');

    if (left && !right) {
      this.move(-1);
    } else if (right && !left) {
      this.move(1);
    } else {
      this.stopMove();
    }
  }

  update(dt, opponent) {
    if (this.pendingSecondWave > 0) {
      this.pendingSecondWave -= dt;
      if (this.pendingSecondWave <= 0) {
        this.pendingSecondWave = 0;
        const projX = this.x + this.facing * 44;
        const projY = this.y - 48 + 10;
        const proj2 = new Projectile(projX, projY, 640, 0, this.facing, this, '#ffd700', Math.round(140 * this.attackMultiplier), 1.05);
        this.projectiles.push(proj2);
        if (window.particleSystem) {
          window.particleSystem.emitSparks(projX, projY, '#ffd700', 12, 220);
        }
      }
    }

    if (window.inputManager) {
      this.handleInput(window.inputManager, opponent);
    }
    super.update(dt, opponent);
  }
}
