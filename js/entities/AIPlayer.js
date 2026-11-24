/**
 * AIPlayer - Fighter entity governed by AIController.
 */
class AIPlayer extends Fighter {
  constructor(x, y, facing, difficulty = 'medium') {
    super(x, y, facing, {
      type: 'villain',
      name: 'NEXUS-9',
      title: 'CRIMSON REAPER',
      themeColor: '#ff0055',
      secondaryColor: '#88002a',
      accentColor: '#ffbb00',
      visorColor: '#ff0033',
      trailColor: '#ff0055',
      coreColor: '#ff3300'
    });

    this.controller = new AIController(this, difficulty);
    this.level = 1;
    this.specialType = 'normal';
    this.enragePhase = false;
    this.isEnraged = false;
  }

  applyLevel(level = 1) {
    const config = window.ProgressionSystem ? window.ProgressionSystem.getVillainConfig(level) : null;
    if (!config) return;

    this.level = config.level;
    this.name = config.name;
    this.title = config.title;
    this.maxHealth = config.maxHealth;
    this.health = config.maxHealth;
    this.maxEnergy = config.maxEnergy;
    this.energy = config.maxEnergy;
    this.attackMultiplier = config.attackMultiplier;
    this.moveSpeedBonus = config.moveSpeedBonus;
    this.specialType = config.specialType;
    this.passiveAura = config.aura;
    this.superArmorFinisher = !!config.superArmorFinisher;
    this.fastDodge = !!config.fastDodge;
    this.enragePhase = !!config.enragePhase;
    this.isEnraged = false;
    this.levelData = config;

    if (this.fastDodge) {
      this.dodgeCooldown = 0.45;
    }
  }

  spawnSpecialProjectile() {
    const projX = this.x + this.facing * 42;
    const projY = this.y - 48;
    const baseDmg = Math.round(185 * this.attackMultiplier);

    if (this.specialType === 'twin') {
      // Level 2: Twin Skulls
      const p1 = new Projectile(projX, projY - 12, 600, 0, this.facing, this, '#ff0055', Math.round(baseDmg * 0.65), 1.0);
      const p2 = new Projectile(projX, projY + 12, 600, 0, this.facing, this, '#ff3300', Math.round(baseDmg * 0.65), 1.0);
      this.projectiles.push(p1, p2);
    } else if (this.specialType === 'void_burst') {
      // Level 3: Void Singularity Skull (Burst)
      const p = new Projectile(projX, projY, 580, 0, this.facing, this, '#a855f7', Math.round(baseDmg * 1.15), 1.35);
      this.projectiles.push(p);
      if (window.particleSystem) {
        window.particleSystem.emitShockwave(projX, projY, '#a855f7', 85);
      }
    } else if (this.specialType === 'abyss_pierce') {
      // Level 4: Hyper-Velocity Piercing Abyssal Skull
      const p = new Projectile(projX, projY, 820, 0, this.facing, this, '#ff0033', Math.round(baseDmg * 1.2), 1.25);
      this.projectiles.push(p);
      if (window.particleSystem) {
        window.particleSystem.emitSpeedlines(projX, projY, this.facing, true);
      }
    } else if (this.specialType === 'apocalypse_cluster') {
      // Level 5: Apocalypse Cluster (Triple Homing Skulls)
      const pCenter = new Projectile(projX, projY, 620, 0, this.facing, this, '#ff0055', Math.round(baseDmg * 0.75), 1.2);
      const pUp = new Projectile(projX, projY - 16, 590, -120, this.facing, this, '#ff3300', Math.round(baseDmg * 0.75), 1.1);
      const pDown = new Projectile(projX, projY + 16, 590, 120, this.facing, this, '#ff0033', Math.round(baseDmg * 0.75), 1.1);
      this.projectiles.push(pCenter, pUp, pDown);
      if (window.particleSystem) {
        window.particleSystem.emitShockwave(projX, projY, '#ff0055', 110);
      }
    } else {
      // Standard Level 1
      const p = new Projectile(projX, projY, 600, 0, this.facing, this, this.themeColor, baseDmg, 1.0);
      this.projectiles.push(p);
    }
  }

  setDifficulty(diff) {
    this.controller.setDifficulty(diff);
  }

  reset(x, y, facing) {
    super.reset(x, y, facing);
    this.controller.fsm.changeState('IDLE', { ai: this });
    this.controller.patternTracker.reset();
  }

  update(dt, player) {
    // Check Enrage Phase (< 50% HP on Level 5)
    if (this.enragePhase && !this.isEnraged && this.health < this.maxHealth * 0.5) {
      this.isEnraged = true;
      this.attackMultiplier *= 1.25;
      if (window.damageTextSystem) {
        window.damageTextSystem.add('BERZERK ENRAGED!!', this.x, this.y - 75, 'special');
      }
      if (window.particleSystem) {
        window.particleSystem.emitShockwave(this.x, this.y - 45, '#ff0055', 90);
        window.particleSystem.emitSparks(this.x, this.y - 45, '#ffea00', 25, 350);
      }
    }

    // Run AI Controller decisions
    this.controller.update(dt, player);

    // Call base physics & animation update
    super.update(dt, player);
  }
}
