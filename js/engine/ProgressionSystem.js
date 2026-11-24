/**
 * ProgressionSystem - Level 1 to Level 5 Boss & Hero Progression System.
 * Defines scaling hitpoints, attack power, unique perks, and visual aura evolutions.
 */

const PROGRESSION = {
  HERO: {
    1: {
      level: 1,
      title: 'CYBER BLADEMASTER',
      maxHealth: 1000,
      maxEnergy: 100,
      attackMultiplier: 1.0,
      moveSpeedBonus: 0,
      energyRegenRate: 14,
      dashRefund: 0,
      passiveAura: null,
      upgradeName: 'CYBER BLADEMASTER PROTOCOL',
      upgradeSubtitle: 'Standard cyberware synchronized',
      perks: [
        'Plasma Katana 3-hit combo chain',
        'Dragon Crescent Plasma Wave (40 SP)',
        'Kinetic jet thrusters & dash'
      ]
    },
    2: {
      level: 2,
      title: 'OVERDRIVE BLADEMASTER',
      maxHealth: 1300,
      maxEnergy: 115,
      attackMultiplier: 1.25,
      moveSpeedBonus: 40,
      energyRegenRate: 17,
      dashRefund: 6,
      passiveAura: 'overdrive',
      upgradeName: 'PLASMA OVERDRIVE CORE',
      upgradeSubtitle: 'Hyper Jet Greaves & Attack Amplification',
      perks: [
        '+300 Max HP (1300 Total) & 115 Max SP',
        '+25% Attack Damage on all strikes',
        'Jet Greaves Overdrive: +15% move & jump speed',
        'Phantom Dash: Refunds +6 SP on successful dodge'
      ]
    },
    3: {
      level: 3,
      title: 'THUNDER DRAGON SHINOBI',
      maxHealth: 1650,
      maxEnergy: 130,
      attackMultiplier: 1.55,
      moveSpeedBonus: 65,
      energyRegenRate: 21,
      dashRefund: 8,
      twinProjectile: true,
      lightningProc: true,
      passiveAura: 'thunder',
      upgradeName: 'THUNDER DRAGON HARNESS',
      upgradeSubtitle: 'Twin Lightning Blast & Electric Discharge',
      perks: [
        '+350 Max HP (1650 Total) & 130 Max SP',
        '+55% Attack Damage scaling',
        'NEW SKILL: Twin Lightning Crescent Waves (Rapid fire)',
        'Static Discharge: 3rd combo attack shocks for bonus electric burst'
      ]
    },
    4: {
      level: 4,
      title: 'AEGIS CYBER WARDEN',
      maxHealth: 2050,
      maxEnergy: 145,
      attackMultiplier: 1.90,
      moveSpeedBonus: 85,
      energyRegenRate: 25,
      dashRefund: 10,
      twinProjectile: true,
      lightningProc: true,
      blockReflect: 0.35,
      passiveAura: 'aegis',
      upgradeName: 'AEGIS NANO-MATRIX',
      upgradeSubtitle: 'Reactive Parry Counter & Fast Energy Generator',
      perks: [
        '+400 Max HP (2050 Total) & 145 Max SP',
        '+90% Attack Damage scaling',
        'NEW SKILL: Aegis Counter (Reflects 35% damage back to boss on block)',
        'Aegis Surge: Blocking successfully restores +15 SP immediately'
      ]
    },
    5: {
      level: 5,
      title: 'AWAKENED DRAGON EMPEROR',
      maxHealth: 2500,
      maxEnergy: 165,
      attackMultiplier: 2.35,
      moveSpeedBonus: 110,
      energyRegenRate: 30,
      dashRefund: 12,
      twinProjectile: true,
      lightningProc: true,
      blockReflect: 0.45,
      emperorNova: true,
      lifeSteal: 0.12,
      superArmor: true,
      passiveAura: 'emperor',
      upgradeName: 'AWAKENED DRAGON EMPEROR MATRIX',
      upgradeSubtitle: 'Divine Dragon Nova, Life-Steal & Super Armor',
      perks: [
        '+450 Max HP (2500 Total) & 165 Max SP',
        '+135% Attack Damage (GOD-TIER POWER)',
        'ULTIMATE: Emperor Dragon Nova (Colossal screen-wide annihilation wave)',
        'Nanite Vampire: 12% Life-Steal heal on all hits',
        'Super Armor: Heavy attacks cannot be interrupted'
      ]
    }
  },

  VILLAIN: {
    1: {
      level: 1,
      name: 'MALIK-X: PROTO',
      title: 'CYBER PROTO-SLAYER',
      maxHealth: 1000,
      maxEnergy: 100,
      attackMultiplier: 1.0,
      moveSpeedBonus: 0,
      specialType: 'normal',
      aura: 'crimson_proto',
      threatLevel: 'CLASS D (STANDARD)',
      bossPerks: [
        'Standard melee cleaver combos',
        'Single Dark Matter Skull projectile',
        'Tactical evasion and basic guards'
      ]
    },
    2: {
      level: 2,
      name: 'MALIK-X: WARLORD',
      title: 'HEAVY SIEGE WARLORD',
      maxHealth: 1400,
      maxEnergy: 110,
      attackMultiplier: 1.25,
      moveSpeedBonus: 30,
      specialType: 'twin',
      aura: 'crimson_fire',
      threatLevel: 'CLASS C (ADVANCED)',
      bossPerks: [
        'HP increased to 1400 (+40%)',
        'Attack power increased by +25%',
        'Twin Dark Matter Skull artillery barrage',
        'Faster dash counterattacks'
      ]
    },
    3: {
      level: 3,
      name: 'MALIK-X: VOID TYRANT',
      title: 'VOID RIFT TYRANT',
      maxHealth: 1850,
      maxEnergy: 125,
      attackMultiplier: 1.55,
      moveSpeedBonus: 55,
      specialType: 'void_burst',
      aura: 'void_purple',
      superArmorFinisher: true,
      threatLevel: 'CLASS B (LETHAL)',
      bossPerks: [
        'HP increased to 1850 (+85%)',
        'Attack power increased by +55%',
        'Void Singularity projectile with exploding shockwave',
        'Finisher attacks have Super Armor'
      ]
    },
    4: {
      level: 4,
      name: 'MALIK-X: ABYSS REAPER',
      title: 'ABYSSAL TITAN REAPER',
      maxHealth: 2350,
      maxEnergy: 135,
      attackMultiplier: 1.90,
      moveSpeedBonus: 75,
      specialType: 'abyss_pierce',
      aura: 'abyssal_inferno',
      fastDodge: true,
      superArmorFinisher: true,
      threatLevel: 'CLASS A (EXTREME)',
      bossPerks: [
        'HP increased to 2350 (+135%)',
        'Attack power increased by +90%',
        'Abyssal Piercing Skull with hyper velocity',
        'Shadow Dash: Faster dodge recovery & punishes'
      ]
    },
    5: {
      level: 5,
      name: 'MALIK-X: APOCALYPSE',
      title: 'OMEGA APOCALYPSE GOD',
      maxHealth: 3000,
      maxEnergy: 155,
      attackMultiplier: 2.30,
      moveSpeedBonus: 95,
      specialType: 'apocalypse_cluster',
      aura: 'apocalypse_omega',
      enragePhase: true,
      superArmorFinisher: true,
      threatLevel: 'CLASS S+ (APOCALYPSE)',
      bossPerks: [
        'HP increased to 3000 (FINAL BOSS TITAN)',
        'Attack power increased by +130%',
        'Apocalypse Cluster: Triple homing dark singularities',
        'BERZERK ENRAGE: Speed & shockwaves at <50% HP'
      ]
    }
  }
};

class ProgressionSystem {
  static getHeroConfig(level = 1) {
    const lvl = Math.max(1, Math.min(5, level));
    return PROGRESSION.HERO[lvl];
  }

  static getVillainConfig(level = 1) {
    const lvl = Math.max(1, Math.min(5, level));
    return PROGRESSION.VILLAIN[lvl];
  }
}

window.ProgressionSystem = ProgressionSystem;
window.PROGRESSION = PROGRESSION;
