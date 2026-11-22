/**
 * Combat System - Resolves collisions, damage, blocking, dodging, hitstop, and combo tracking.
 */
class CombatSystem {
  constructor() {
    this.hitstopTimer = 0;
    this.combos = {
      player: 0,
      ai: 0
    };
    this.comboTimers = {
      player: 0,
      ai: 0
    };
    this.maxCombos = {
      player: 0,
      ai: 0
    };
    this.totalDamageDealt = {
      player: 0,
      ai: 0
    };
  }

  reset() {
    this.hitstopTimer = 0;
    this.combos = { player: 0, ai: 0 };
    this.comboTimers = { player: 0, ai: 0 };
    this.maxCombos = { player: 0, ai: 0 };
    this.totalDamageDealt = { player: 0, ai: 0 };
  }

  update(dt, player, ai, camera) {
    // Handle hitstop freeze frame
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      return true; // Game should skip movement physics during hitstop
    }

    // Update combo decay timers
    if (this.comboTimers.player > 0) {
      this.comboTimers.player -= dt;
      if (this.comboTimers.player <= 0) {
        this.combos.player = 0;
      }
    }
    if (this.comboTimers.ai > 0) {
      this.comboTimers.ai -= dt;
      if (this.comboTimers.ai <= 0) {
        this.combos.ai = 0;
      }
    }

    // Check Player Melee Attack vs AI
    if (player.activeHitbox && !player.hasHitTarget) {
      this.checkAttackHit(player, ai, 'player', camera);
    }

    // Check AI Melee Attack vs Player
    if (ai.activeHitbox && !ai.hasHitTarget) {
      this.checkAttackHit(ai, player, 'ai', camera);
    }

    // Check Projectiles
    this.checkProjectiles(player, ai, camera);

    return false;
  }

  checkAttackHit(attacker, defender, attackerRole, camera) {
    if (defender.isDefeated) return;

    const hurtbox = defender.getHurtbox();
    const hitbox = attacker.activeHitbox;

    if (Hitbox.intersects(hitbox, hurtbox)) {
      attacker.hasHitTarget = true; // prevent multi-hits on single swing frame
      this.applyHit(attacker, defender, hitbox, attackerRole, camera);
    }
  }

  checkProjectiles(player, ai, camera) {
    // Player projectiles vs AI
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const proj = player.projectiles[i];
      if (proj.spent) continue;

      const hurtbox = ai.getHurtbox();
      if (Hitbox.intersects(proj.getHitbox(), hurtbox)) {
        proj.spent = true;
        this.applyHit(player, ai, proj.toHitbox(), 'player', camera, true);
        window.particleSystem.emitShockwave(proj.x, proj.y, '#00f0ff', 60);
      }
    }

    // AI projectiles vs Player
    for (let i = ai.projectiles.length - 1; i >= 0; i--) {
      const proj = ai.projectiles[i];
      if (proj.spent) continue;

      const hurtbox = player.getHurtbox();
      if (Hitbox.intersects(proj.getHitbox(), hurtbox)) {
        proj.spent = true;
        this.applyHit(ai, player, proj.toHitbox(), 'ai', camera, true);
        window.particleSystem.emitShockwave(proj.x, proj.y, '#ff0055', 60);
      }
    }
  }

  applyHit(attacker, defender, hitbox, attackerRole, camera, isProjectile = false) {
    const impactX = (hitbox.x + hitbox.width / 2 + defender.x) / 2;
    const impactY = defender.y - 45;

    // 1. Check Dodge / Invulnerability Frames
    if (defender.isDodging || defender.isInvulnerable) {
      window.damageTextSystem.add('DODGE!', defender.x, defender.y - 70, 'dodge');
      if (window.audioManager) window.audioManager.playDodge();
      return;
    }

    // 2. Check Blocking
    // Defender must be in BLOCK state and facing toward the attacker
    const facingAttacker = (attacker.x < defender.x && defender.facing === -1) ||
                           (attacker.x > defender.x && defender.facing === 1);

    if (defender.isBlocking && facingAttacker) {
      // 75% Damage Reduction on Block
      const blockedDamage = Math.max(1, Math.round(hitbox.damage * 0.25));
      defender.takeDamage(blockedDamage, 0, false);
      this.totalDamageDealt[attackerRole] += blockedDamage;

      // Small stamina depletion on block
      defender.energy = Math.max(0, defender.energy - 10);

      // Pushback on defender and attacker
      defender.vx = attacker.facing * 160;
      attacker.vx = -attacker.facing * 120;

      // Visuals & Sound
      window.damageTextSystem.add(`-${blockedDamage}`, impactX, impactY, 'block');
      window.particleSystem.emitShieldBlock(impactX, impactY, defender.themeColor || '#00f0ff');
      if (window.audioManager) window.audioManager.playBlock();
      if (camera) camera.shake(4, 0.15);

      // Successful block resets opponent's combo
      this.combos[attackerRole] = 0;
      return;
    }

    // 3. Normal or Heavy Hit Lands!
    const isHeavy = hitbox.attackType === 3 || isProjectile;
    const isCritical = isHeavy;
    let finalDamage = hitbox.damage;

    // Apply damage
    defender.takeDamage(finalDamage, hitbox.hitstun, true);
    this.totalDamageDealt[attackerRole] += finalDamage;

    // Apply Knockback
    const knockDir = attacker.x < defender.x ? 1 : -1;
    defender.vx = knockDir * hitbox.knockbackX;
    defender.vy = hitbox.knockbackY;

    // Award Energy to Attacker
    attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + (isHeavy ? 20 : 12));

    // Update Combo
    this.combos[attackerRole]++;
    this.comboTimers[attackerRole] = 1.6; // Combo reset timer
    if (this.combos[attackerRole] > this.maxCombos[attackerRole]) {
      this.maxCombos[attackerRole] = this.combos[attackerRole];
    }

    // Show Combo Banner if player combo >= 2
    if (attackerRole === 'player' && this.combos.player >= 2) {
      if (window.uiManager) {
        window.uiManager.showCombo(this.combos.player);
      }
    }

    // Audio Impact
    if (window.audioManager) {
      window.audioManager.playHit(isHeavy);
    }

    // Visual Sparks & Cyber Blood
    const sparkColor = attackerRole === 'player' ? '#00f0ff' : '#ff0055';
    window.particleSystem.emitSparks(impactX, impactY, '#ffea00', isHeavy ? 24 : 14, isHeavy ? 450 : 250);
    window.particleSystem.emitCyberBlood(impactX, impactY, sparkColor, isHeavy ? 18 : 10);

    // Camera Shake & Hitstop Freeze Frame
    if (camera) {
      camera.shake(isHeavy ? 14 : 7, isHeavy ? 0.35 : 0.2);
    }
    this.hitstopTimer = isHeavy ? 0.08 : 0.05;

    // Floating Damage Text
    const textType = isCritical ? 'critical' : (isProjectile ? 'special' : 'normal');
    window.damageTextSystem.add(`-${finalDamage}`, impactX, impactY, textType);
  }
}

window.combatSystem = new CombatSystem();
