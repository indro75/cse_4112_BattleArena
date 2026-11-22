/**
 * AI Controller - Coordinates Finite State Machine, Behavior Trees, Pattern Recognition,
 * and Predictive Movement across Easy, Medium, and Hard difficulty levels.
 */
class AIController {
  constructor(aiFighter, difficulty = 'medium') {
    this.ai = aiFighter;
    this.difficulty = difficulty;

    this.fsm = new AIStateMachine('IDLE');
    this.patternTracker = new PatternTracker();
    this.behaviorTree = null;

    // Decision delay buffer (simulating reaction speed)
    this.decisionTimer = 0;
    this.activeDecision = null;
    this.activeNodeName = 'CombatSelector';
    this.predictedActionName = 'NEUTRAL';

    // Combat tuning profiles
    this.profiles = {
      easy: {
        reactionTime: 0.45,       // Slow reaction (450ms)
        attackChance: 0.22,       // Low aggression
        blockChance: 0.15,        // Rarely blocks
        dodgeChance: 0.10,        // Rarely dodges
        comboCapability: 1,       // Single hits only
        specialChance: 0.20,      // Rare specials
        chaseSpeedMultiplier: 0.85,
        usePrediction: false,
        usePatternAdaptation: false
      },
      medium: {
        reactionTime: 0.18,       // Balanced reaction (180ms)
        attackChance: 0.55,       // Active aggression
        blockChance: 0.55,        // Blocks incoming attacks
        dodgeChance: 0.40,        // Dodges specials/heavy attacks
        comboCapability: 2,       // Chains 2-hit combos
        specialChance: 0.60,      // Uses special attacks when charged
        chaseSpeedMultiplier: 1.0,
        usePrediction: false,
        usePatternAdaptation: false
      },
      hard: {
        reactionTime: 0.06,       // Pro esports human reaction (60ms)
        attackChance: 0.85,       // Relentless adaptive aggression
        blockChance: 0.88,        // High block & parry reflexes
        dodgeChance: 0.75,        // Strategic i-frame dodge rolls
        comboCapability: 3,       // Full 3-hit combo strings
        specialChance: 0.90,      // Strategic specials
        chaseSpeedMultiplier: 1.05,
        usePrediction: true,      // Leads projectiles & anti-airs
        usePatternAdaptation: true // Adapts to player's habits
      }
    };

    this.setupFSM();
    this.buildBehaviorTree();
  }

  setDifficulty(diff) {
    if (this.profiles[diff]) {
      this.difficulty = diff;
      this.buildBehaviorTree();
    }
  }

  get config() {
    return this.profiles[this.difficulty] || this.profiles.medium;
  }

  /* ==========================================================
     FINITE STATE MACHINE SETUP
     ========================================================== */
  setupFSM() {
    // 1. IDLE
    this.fsm.registerState('IDLE', {
      enter: (ctx) => {
        ctx.ai.stopMove();
      },
      update: (dt, ctx) => {
        // Face player
        if (ctx.player.x < ctx.ai.x) ctx.ai.facing = -1;
        else ctx.ai.facing = 1;
      }
    });

    // 2. CHASE
    this.fsm.registerState('CHASE', {
      update: (dt, ctx) => {
        const dist = ctx.player.x - ctx.ai.x;
        const dir = dist > 0 ? 1 : -1;
        ctx.ai.move(dir);

        // In Hard mode, if player is jumping, predict landing spot
        if (this.config.usePrediction && !ctx.player.onGround) {
          const predictedX = ctx.player.x + ctx.player.vx * 0.25;
          const predDir = predictedX > ctx.ai.x ? 1 : -1;
          ctx.ai.move(predDir);
        }
      }
    });

    // 3. ATTACK
    this.fsm.registerState('ATTACK', {
      enter: (ctx) => {
        // Face player immediately
        ctx.ai.facing = ctx.player.x > ctx.ai.x ? 1 : -1;
        ctx.ai.startAttack(1);
        ctx.comboStep = 1;
      },
      update: (dt, ctx) => {
        // Combo execution logic based on difficulty capability
        if (this.config.comboCapability >= 2 && ctx.ai.state === 'ATTACK_1' && ctx.ai.stateTimer > 0.14) {
          ctx.ai.comboBufferedAttack = true;
        }
        if (this.config.comboCapability >= 3 && ctx.ai.state === 'ATTACK_2' && ctx.ai.stateTimer > 0.16) {
          ctx.ai.comboBufferedAttack = true;
        }

        if (ctx.ai.state === 'IDLE') {
          this.fsm.changeState('IDLE', ctx);
        }
      }
    });

    // 4. DEFEND
    this.fsm.registerState('DEFEND', {
      enter: (ctx) => {
        ctx.ai.facing = ctx.player.x > ctx.ai.x ? 1 : -1;
        ctx.ai.startBlock();
      },
      update: (dt, ctx) => {
        ctx.ai.facing = ctx.player.x > ctx.ai.x ? 1 : -1;
        // Stop blocking if player is not attacking and threat passed
        if (!ctx.player.state.startsWith('ATTACK_') && ctx.player.state !== 'SPECIAL' && this.fsm.stateTimer > 0.4) {
          ctx.ai.stopBlock();
          // Counterattack opportunity!
          if (this.difficulty !== 'easy' && Math.random() < 0.6) {
            this.fsm.changeState('COUNTERATTACK', ctx);
          } else {
            this.fsm.changeState('IDLE', ctx);
          }
        }
      },
      exit: (ctx) => {
        ctx.ai.stopBlock();
      }
    });

    // 5. DODGE
    this.fsm.registerState('DODGE', {
      enter: (ctx) => {
        // In Hard mode, dodge toward and through player if cornered or if player is attacking
        if (this.difficulty === 'hard') {
          const toPlayer = ctx.player.x > ctx.ai.x ? 1 : -1;
          ctx.ai.facing = toPlayer; // dash through player to get behind their back
        } else {
          // Dodge backward away from threat
          const awayFromPlayer = ctx.player.x > ctx.ai.x ? -1 : 1;
          ctx.ai.facing = awayFromPlayer;
        }
        ctx.ai.dodge();
      },
      update: (dt, ctx) => {
        if (ctx.ai.state !== 'DODGE') {
          this.fsm.changeState('IDLE', ctx);
        }
      }
    });

    // 6. COUNTERATTACK
    this.fsm.registerState('COUNTERATTACK', {
      enter: (ctx) => {
        ctx.ai.facing = ctx.player.x > ctx.ai.x ? 1 : -1;
        ctx.ai.startAttack(1);
        if (this.config.comboCapability >= 2) {
          ctx.ai.comboBufferedAttack = true;
        }
      },
      update: (dt, ctx) => {
        if (ctx.ai.state === 'IDLE') {
          this.fsm.changeState('IDLE', ctx);
        }
      }
    });

    // 7. RETREAT
    this.fsm.registerState('RETREAT', {
      update: (dt, ctx) => {
        const awayDir = ctx.player.x > ctx.ai.x ? -1 : 1;
        ctx.ai.move(awayDir);

        // Turn around to face player while stepping back
        if (this.fsm.stateTimer > 0.6 || ctx.ai.x <= ctx.ai.minX + 30 || ctx.ai.x >= ctx.ai.maxX - 30) {
          this.fsm.changeState('IDLE', ctx);
        }
      }
    });

    // 8. SPECIAL_ATTACK
    this.fsm.registerState('SPECIAL_ATTACK', {
      enter: (ctx) => {
        ctx.ai.facing = ctx.player.x > ctx.ai.x ? 1 : -1;
        ctx.ai.startSpecial();
      },
      update: (dt, ctx) => {
        if (ctx.ai.state === 'IDLE') {
          this.fsm.changeState('IDLE', ctx);
        }
      }
    });
  }

  /* ==========================================================
     BEHAVIOR TREE ARCHITECTURE
     ========================================================== */
  buildBehaviorTree() {
    // Top-level Combat Selector
    this.behaviorTree = new BTSelector('RootCombatSelector', [
      // Branch 1: Urgent Threat Response (Incoming attacks / projectiles)
      new BTSequence('DefensiveResponse', [
        new BTCondition('IsThreatIncoming', (ctx) => this.checkIncomingThreat(ctx)),
        new BTSelector('DefensiveTactic', [
          // Tactical Dodge
          new BTSequence('TryDodge', [
            new BTCondition('CanDodge', (ctx) => ctx.ai.dodgeCooldown <= 0 && ctx.ai.energy >= 15),
            new BTCondition('ShouldDodgeRoll', (ctx) => Math.random() < this.config.dodgeChance),
            new BTAction('ExecuteDodge', (ctx) => {
              this.predictedActionName = 'TACTICAL_DODGE';
              this.fsm.changeState('DODGE', ctx);
              return BTState.SUCCESS;
            })
          ]),
          // Block / Parry
          new BTSequence('TryBlock', [
            new BTCondition('ShouldBlock', (ctx) => Math.random() < this.config.blockChance),
            new BTAction('ExecuteBlock', (ctx) => {
              this.predictedActionName = 'GUARD_DEFENSE';
              this.fsm.changeState('DEFEND', ctx);
              return BTState.SUCCESS;
            })
          ])
        ])
      ]),

      // Branch 2: Punish Player Whiff / Recovery (Counter-strike)
      new BTSequence('PunishWhiff', [
        new BTCondition('IsPlayerVulnerable', (ctx) => {
          if (this.difficulty === 'easy') return false;
          // Player is in recovery or whiffed attack
          return (ctx.player.state.startsWith('ATTACK_') && ctx.player.stateTimer > 0.22) ||
                 (ctx.player.state === 'FALL');
        }),
        new BTCondition('IsWithinPunishRange', (ctx) => Math.abs(ctx.player.x - ctx.ai.x) < 140),
        new BTAction('ExecutePunish', (ctx) => {
          this.predictedActionName = 'WHIFF_PUNISH';
          this.fsm.changeState('COUNTERATTACK', ctx);
          return BTState.SUCCESS;
        })
      ]),

      // Branch 3: Anti-Air Intercept (Hard mode counters jumping players)
      new BTSequence('AntiAirIntercept', [
        new BTCondition('IsPlayerJumping', (ctx) => {
          if (!this.config.usePrediction) return false;
          return !ctx.player.onGround && ctx.player.y < ctx.ai.y - 40;
        }),
        new BTCondition('IsUnderJumpArc', (ctx) => Math.abs(ctx.player.x - ctx.ai.x) < 120),
        new BTAction('ExecuteAntiAir', (ctx) => {
          this.predictedActionName = 'ANTI_AIR_UPPERCUT';
          ctx.ai.facing = ctx.player.x > ctx.ai.x ? 1 : -1;
          ctx.ai.jump();
          ctx.ai.startAttack(1);
          return BTState.SUCCESS;
        })
      ]),

      // Branch 4: Special Attack Zone
      new BTSequence('RangedSpecial', [
        new BTCondition('HasSpecialEnergy', (ctx) => ctx.ai.energy >= 40),
        new BTCondition('IsInRangeForSpecial', (ctx) => {
          const dist = Math.abs(ctx.player.x - ctx.ai.x);
          return dist > 180 && dist < 650;
        }),
        new BTCondition('RollSpecialChance', (ctx) => Math.random() < this.config.specialChance),
        new BTAction('ExecuteSpecial', (ctx) => {
          this.predictedActionName = 'SPECIAL_BLAST';
          this.fsm.changeState('SPECIAL_ATTACK', ctx);
          return BTState.SUCCESS;
        })
      ]),

      // Branch 5: Melee Attack Combo
      new BTSequence('MeleeAssault', [
        new BTCondition('IsInRangeForMelee', (ctx) => {
          const dist = Math.abs(ctx.player.x - ctx.ai.x);
          return dist <= 95;
        }),
        new BTCondition('RollAttackChance', (ctx) => Math.random() < this.config.attackChance),
        new BTAction('ExecuteMelee', (ctx) => {
          this.predictedActionName = 'MELEE_COMBO';
          this.fsm.changeState('ATTACK', ctx);
          return BTState.SUCCESS;
        })
      ]),

      // Branch 6: Adaptive Pattern-Based Tactics (Hard Mode Only)
      new BTSequence('PatternTactics', [
        new BTCondition('IsHardAdaptive', () => this.config.usePatternAdaptation),
        new BTSelector('AdaptiveChoices', [
          // If player spams attack, AI retreats slightly to bait, then rushes
          new BTSequence('BaitSpammer', [
            new BTCondition('IsPlayerSpamming', () => this.patternTracker.spamTendency > 0.4),
            new BTAction('StepBackBait', (ctx) => {
              this.predictedActionName = 'BAIT_WHIFF';
              this.fsm.changeState('RETREAT', ctx);
              return BTState.SUCCESS;
            })
          ]),
          // If player turtles with block, AI approaches to point-blank range for chip/strike
          new BTSequence('BreakTurtle', [
            new BTCondition('IsPlayerGuarding', () => this.patternTracker.guardTendency > 0.35),
            new BTAction('PressAdvantage', (ctx) => {
              this.predictedActionName = 'GUARD_PRESSURE';
              this.fsm.changeState('CHASE', ctx);
              return BTState.SUCCESS;
            })
          ])
        ])
      ]),

      // Branch 7: Low Health Tactical Spacing
      new BTSequence('LowHealthReposition', [
        new BTCondition('IsAILowHealth', (ctx) => ctx.ai.health < 250 && ctx.ai.health < ctx.player.health),
        new BTCondition('IsTooClose', (ctx) => Math.abs(ctx.player.x - ctx.ai.x) < 140),
        new BTAction('ExecuteRetreat', (ctx) => {
          this.predictedActionName = 'TACTICAL_RETREAT';
          this.fsm.changeState('RETREAT', ctx);
          return BTState.SUCCESS;
        })
      ]),

      // Branch 8: Default Chase / Approach
      new BTAction('ApproachPlayer', (ctx) => {
        this.predictedActionName = 'CHASE_TARGET';
        this.fsm.changeState('CHASE', ctx);
        return BTState.SUCCESS;
      })
    ]);
  }

  /* ==========================================================
     THREAT DETECTION
     ========================================================== */
  checkIncomingThreat(ctx) {
    const dist = Math.abs(ctx.player.x - ctx.ai.x);

    // 1. Incoming player melee attack in range
    if (ctx.player.state.startsWith('ATTACK_') && dist < 120) {
      // Is player facing AI?
      const playerFacesAI = (ctx.player.x < ctx.ai.x && ctx.player.facing === 1) ||
                            (ctx.player.x > ctx.ai.x && ctx.player.facing === -1);
      if (playerFacesAI) return true;
    }

    // 2. Incoming projectile approaching AI
    for (const proj of ctx.player.projectiles) {
      if (proj.spent) continue;
      const projDist = Math.abs(proj.x - ctx.ai.x);
      const projMovingToAI = (proj.vx > 0 && proj.x < ctx.ai.x) || (proj.vx < 0 && proj.x > ctx.ai.x);
      if (projDist < 180 && projMovingToAI) {
        return true;
      }
    }

    return false;
  }

  /* ==========================================================
     MAIN UPDATE TICK
     ========================================================== */
  update(dt, player) {
    if (this.ai.isDefeated) return;

    // 1. Update Pattern Recognition
    this.patternTracker.update(dt, player, this.ai);

    // 2. Reaction delay gate
    this.decisionTimer += dt;
    const context = {
      ai: this.ai,
      player,
      dt,
      controller: this,
      activeNodeName: this.activeNodeName
    };

    if (this.decisionTimer >= this.config.reactionTime) {
      this.decisionTimer = 0;
      // Evaluate Behavior Tree
      if (this.behaviorTree) {
        this.behaviorTree.evaluate(context);
        this.activeNodeName = context.activeNodeName || 'CombatSelector';
      }
    }

    // 3. Update FSM State
    this.fsm.update(dt, context);
  }
}
