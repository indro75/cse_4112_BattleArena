/**
 * Game Engine - Main loop, match state controller, physics coordination, and rendering pipeline.
 */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Canvas Virtual Dimensions
    this.width = 1280;
    this.height = 720;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Game State: 'MENU', 'BATTLE', 'PAUSED', 'GAMEOVER'
    this.state = 'MENU';
    this.difficulty = 'medium';

    // Subsystems
    this.camera = new Camera(this.width, this.height);
    this.arena = new Arena(this.width, this.height);
    this.combat = window.combatSystem;
    this.particles = window.particleSystem;
    this.damageTexts = window.damageTextSystem;
    this.audio = window.audioManager;
    this.input = window.inputManager;
    this.ui = window.uiManager;

    // Combat Entities
    this.player = new Player(340, 580, 1);
    this.ai = new AIPlayer(940, 580, -1, this.difficulty);

    // Match Rules & Timers
    this.roundTime = 99; // seconds
    this.matchTimer = this.roundTime;
    this.matchElapsedTime = 0;
    this.endSequenceTimer = 0;

    // Fixed timestep loop
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.step = 1 / 60; // 60 updates per second

    // Window resize handler
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Start render loop
    requestAnimationFrame((t) => this.loop(t));
  }

  handleResize() {
    if (this.input) {
      this.input.updateControlsVisibility(this.state === 'BATTLE');
    }
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    if (this.ai) {
      this.ai.setDifficulty(diff);
    }
  }

  get isPlaying() {
    return this.state === 'BATTLE';
  }

  startMatch() {
    this.state = 'BATTLE';
    this.matchTimer = this.roundTime;
    this.matchElapsedTime = 0;
    this.endSequenceTimer = 0;

    // Reset entities to initial spawn points
    this.player.reset(340, 580, 1);
    this.ai.reset(940, 580, -1);
    this.ai.setDifficulty(this.difficulty);

    // Reset combat & particles
    this.combat.reset();
    this.particles.clear();
    this.damageTexts.clear();

    // Show Battle HUD
    this.ui.showBattleHud();
    this.ui.updateDifficultyBadge(this.difficulty);

    // Start Dynamic Cyberpunk Combat BGM
    if (this.audio) {
      this.audio.startBGM();
    }
  }

  restartMatch() {
    this.startMatch();
  }

  togglePause() {
    if (this.state === 'BATTLE') {
      this.state = 'PAUSED';
      this.ui.showPauseMenu();
      if (this.audio) this.audio.stopBGM();
    } else if (this.state === 'PAUSED') {
      this.state = 'BATTLE';
      this.ui.hidePauseMenu();
      if (this.audio) this.audio.startBGM();
    }
  }

  quitToMainMenu() {
    this.state = 'MENU';
    if (this.audio) this.audio.stopBGM();
    this.ui.showMainMenu();
  }

  finishMatch(isVictory) {
    this.state = 'GAMEOVER';
    if (this.audio) {
      this.audio.stopBGM();
      if (isVictory) {
        this.audio.playVictory();
      } else {
        this.audio.playDefeat();
      }
    }

    // Set animation states
    if (isVictory) {
      this.player.changeState('VICTORY');
      this.ai.changeState('DEFEATED');
    } else {
      this.player.changeState('DEFEATED');
      this.ai.changeState('VICTORY');
    }

    // Format match duration (MM:SS)
    const mins = Math.floor(this.matchElapsedTime / 60);
    const secs = Math.floor(this.matchElapsedTime % 60);
    const durationFormatted = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const resultsData = {
      isVictory,
      duration: durationFormatted,
      remainingHealth: isVictory ? this.player.health : 0,
      maxCombo: this.combat.maxCombos.player,
      difficulty: this.difficulty,
      damageDealt: this.combat.totalDamageDealt.player,
      damageTaken: this.combat.totalDamageDealt.ai
    };

    setTimeout(() => {
      this.ui.showResults(resultsData);
    }, 1200);
  }

  /* ==========================================================
     MAIN GAME LOOP
     ========================================================== */
  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // Check Pause Key shortcut
    if (this.input.isJustPressed('pause')) {
      if (this.state === 'BATTLE' || this.state === 'PAUSED') {
        this.togglePause();
      }
    }

    // Simulation updates
    if (this.state === 'BATTLE') {
      this.accumulator += dt;
      while (this.accumulator >= this.step) {
        this.update(this.step);
        this.accumulator -= this.step;
      }
    } else {
      // Menu background ambient simulation
      this.arena.update(dt);
      this.particles.update(dt);
    }

    // Render frame
    this.render();

    // Clear single-frame key states
    this.input.update();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.matchElapsedTime += dt;
    this.matchTimer -= dt;

    // Round Timer Expired Check
    if (this.matchTimer <= 0) {
      this.matchTimer = 0;
      const isPlayerWin = this.player.health >= this.ai.health;
      this.finishMatch(isPlayerWin);
      return;
    }

    // Check Victory / Defeat
    if (this.player.health <= 0) {
      this.finishMatch(false);
      return;
    }
    if (this.ai.health <= 0) {
      this.finishMatch(true);
      return;
    }

    // Update Arena Background & Spotlights
    this.arena.update(dt);

    // Update Combat System (returns true if hitstop freeze frame active)
    const hitstop = this.combat.update(dt, this.player, this.ai, this.camera);

    if (!hitstop) {
      // Update Entities
      this.player.update(dt, this.ai);
      this.ai.update(dt, this.player);

      // Prevent fighters from passing completely through each other in normal states
      this.resolveFighterPush();
    }

    // Update Particles & Damage Numbers
    this.particles.update(dt);
    this.damageTexts.update(dt);

    // Update Dynamic Camera
    this.camera.update(dt, this.player, this.ai);

    // Update UI HUD Elements
    this.ui.updateHUD(this.player, this.ai, this.matchTimer);
  }

  resolveFighterPush() {
    // If neither is dodging, apply subtle separation when bounding boxes overlap
    if (!this.player.isDodging && !this.ai.isDodging) {
      const dist = this.ai.x - this.player.x;
      const minDistance = 42;
      if (Math.abs(dist) < minDistance) {
        const overlap = (minDistance - Math.abs(dist)) * 0.5;
        const dir = dist >= 0 ? 1 : -1;
        this.player.x -= dir * overlap;
        this.ai.x += dir * overlap;
      }
    }
  }

  /* ==========================================================
     RENDERING PIPELINE
     ========================================================== */
  render() {
    // Clear screen
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.state === 'BATTLE' || this.state === 'PAUSED' || this.state === 'GAMEOVER') {
      // Apply Camera Viewport Transform (Zoom + Follow + Shake)
      this.camera.apply(this.ctx);

      // 1. Arena Background & Parallax layers
      this.arena.renderBackground(this.ctx);

      // 2. Arena Floor
      this.arena.renderFloor(this.ctx);

      // 3. Combat Particles (Background layer, like dust & ghost trails)
      this.particles.render(this.ctx);

      // 4. Combatants (Sorted so active attacker is drawn on top)
      if (this.player.state.startsWith('ATTACK_')) {
        this.ai.render(this.ctx);
        this.player.render(this.ctx);
      } else {
        this.player.render(this.ctx);
        this.ai.render(this.ctx);
      }

      // 5. Floating Damage Text & Combat Alerts
      this.damageTexts.render(this.ctx);

      // 6. Arena Atmospheric Foreground Fog
      this.arena.renderForeground(this.ctx);

      // Restore camera transform
      this.camera.restore(this.ctx);

    } else {
      // Main Menu Cinematic Background Render
      this.arena.renderBackground(this.ctx);
      this.arena.renderFloor(this.ctx);
      this.particles.render(this.ctx);
      this.arena.renderForeground(this.ctx);
    }
  }
}

window.Game = Game;
