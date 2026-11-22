/**
 * UI Manager - Orchestrates screens, HUD updates, modal dialogues, and user settings.
 */
class UIManager {
  constructor() {
    // Screens & Modals
    this.mainMenu = document.getElementById('main-menu');
    this.battleHud = document.getElementById('battle-hud');
    this.difficultyModal = document.getElementById('difficulty-modal');
    this.howToPlayModal = document.getElementById('how-to-play-modal');
    this.settingsModal = document.getElementById('settings-modal');
    this.pauseModal = document.getElementById('pause-modal');
    this.resultsModal = document.getElementById('results-modal');
    this.aiDebugHud = document.getElementById('ai-debug-hud');
    this.comboDisplay = document.getElementById('combo-display');

    // HUD Elements
    this.playerHealthBar = document.getElementById('player-health-bar');
    this.playerHealthLag = document.getElementById('player-health-lag');
    this.playerHealthText = document.getElementById('player-health-text');
    this.playerEnergyBar = document.getElementById('player-energy-bar');
    this.playerEnergyText = document.getElementById('player-energy-text');

    this.aiHealthBar = document.getElementById('ai-health-bar');
    this.aiHealthLag = document.getElementById('ai-health-lag');
    this.aiHealthText = document.getElementById('ai-health-text');
    this.aiEnergyBar = document.getElementById('ai-energy-bar');
    this.aiEnergyText = document.getElementById('ai-energy-text');
    this.aiModeTitle = document.getElementById('ai-mode-title');

    this.roundTimer = document.getElementById('round-timer');
    this.difficultyBadge = document.getElementById('difficulty-badge');
    this.currentDiffLabel = document.getElementById('current-diff-label');

    // AI Debug Inspector elements
    this.aiStateIndicator = document.getElementById('ai-state-indicator');
    this.aiBtreeNode = document.getElementById('ai-btree-node');
    this.aiDistanceVal = document.getElementById('ai-distance-val');
    this.aiStatJump = document.getElementById('ai-stat-jump');
    this.aiStatSpam = document.getElementById('ai-stat-spam');
    this.aiStatGuard = document.getElementById('ai-stat-guard');
    this.aiPredictedAction = document.getElementById('ai-predicted-action');

    // Results Elements
    this.resultsBanner = document.getElementById('results-banner');
    this.resultsSubtitle = document.getElementById('results-subtitle');
    this.statDuration = document.getElementById('stat-duration');
    this.statHealth = document.getElementById('stat-health');
    this.statMaxCombo = document.getElementById('stat-max-combo');
    this.statDifficulty = document.getElementById('stat-difficulty');
    this.statDamageDealt = document.getElementById('stat-damage-dealt');
    this.statDamageTaken = document.getElementById('stat-damage-taken');

    // Settings Controls
    this.musicSlider = document.getElementById('music-volume');
    this.musicValText = document.getElementById('music-val-text');
    this.sfxSlider = document.getElementById('sfx-volume');
    this.sfxValText = document.getElementById('sfx-val-text');
    this.screenshakeToggle = document.getElementById('toggle-screenshake');
    this.particlesToggle = document.getElementById('toggle-particles');
    this.aiDebugToggle = document.getElementById('toggle-ai-debug');
    this.touchControlsSelect = document.getElementById('select-touch-controls');
    this.orientationPrompt = document.getElementById('orientation-prompt');
    this.orientationDismissed = sessionStorage.getItem('orientation_dismissed') === 'true';

    // Combo banner timer
    this.comboTimer = null;

    // Attach listeners
    this.initEventListeners();
    this.checkOrientation();
    window.addEventListener('resize', () => this.checkOrientation());
    window.addEventListener('orientationchange', () => this.checkOrientation());
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', () => this.checkOrientation());
    }
  }

  checkOrientation() {
    if (!this.orientationPrompt) return;
    if (this.orientationDismissed) {
      this.orientationPrompt.classList.add('hidden', 'dismissed');
      this.orientationPrompt.style.display = 'none';
      return;
    }

    // Determine orientation reliably
    let isPortrait = false;
    if (window.screen && window.screen.orientation && window.screen.orientation.type) {
      isPortrait = window.screen.orientation.type.startsWith('portrait');
    } else if (typeof window.orientation !== 'undefined') {
      isPortrait = window.orientation === 0 || window.orientation === 180;
    } else {
      isPortrait = window.innerHeight > window.innerWidth;
    }

    const isSmallDevice = Math.min(window.innerWidth, window.innerHeight) <= 768;

    if (isPortrait && isSmallDevice) {
      this.orientationPrompt.classList.remove('hidden');
      this.orientationPrompt.style.display = 'flex';
    } else {
      this.orientationPrompt.classList.add('hidden');
      this.orientationPrompt.style.display = 'none';
    }
  }

  initEventListeners() {
    // Button Hover / Click retro SFX
    document.querySelectorAll('.cyber-btn, .hud-btn, .select-diff-btn').forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        if (window.audioManager) window.audioManager.playUIHover();
      });
      btn.addEventListener('click', () => {
        if (window.audioManager) window.audioManager.playUIClick();
      });
    });

    // Start Battle Button
    document.getElementById('btn-start-game').addEventListener('click', () => {
      if (window.game) window.game.startMatch();
    });

    // Enter Key shortcut to start battle on main menu
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.mainMenu.classList.contains('active')) {
        if (window.game) window.game.startMatch();
      }
    });

    // Difficulty Menu Open/Close
    document.getElementById('btn-difficulty-menu').addEventListener('click', () => {
      this.showDifficultyModal();
    });
    document.getElementById('btn-close-difficulty').addEventListener('click', () => {
      this.hideDifficultyModal();
    });

    // Difficulty Selection Cards
    document.querySelectorAll('.select-diff-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const diff = e.target.getAttribute('data-diff');
        if (window.game) window.game.setDifficulty(diff);
        this.selectDifficultyCard(diff);
        this.hideDifficultyModal();
      });
    });

    // How to Play Open/Close
    document.getElementById('btn-how-to-play').addEventListener('click', () => {
      this.showModal(this.howToPlayModal);
    });
    document.getElementById('btn-close-howtoplay').addEventListener('click', () => {
      this.hideModal(this.howToPlayModal);
    });
    document.getElementById('btn-pause-howtoplay').addEventListener('click', () => {
      this.showModal(this.howToPlayModal);
    });

    // Settings Open/Close
    document.getElementById('btn-settings').addEventListener('click', () => {
      this.showModal(this.settingsModal);
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
      this.hideModal(this.settingsModal);
    });

    // Settings Slider Inputs
    this.musicSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.musicValText.textContent = `${val}%`;
      if (window.audioManager) window.audioManager.setMusicVolume(val / 100);
    });

    this.sfxSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.sfxValText.textContent = `${val}%`;
      if (window.audioManager) window.audioManager.setSfxVolume(val / 100);
    });

    this.screenshakeToggle.addEventListener('change', (e) => {
      if (window.game && window.game.camera) {
        window.game.camera.setShakeEnabled(e.target.checked);
      }
    });

    this.particlesToggle.addEventListener('change', (e) => {
      if (window.particleSystem) {
        window.particleSystem.setEnabled(e.target.checked);
      }
    });

    this.aiDebugToggle.addEventListener('change', (e) => {
      if (e.target.checked && window.game && window.game.isPlaying) {
        this.aiDebugHud.classList.remove('hidden');
      } else {
        this.aiDebugHud.classList.add('hidden');
      }
    });

    if (this.touchControlsSelect) {
      this.touchControlsSelect.addEventListener('change', (e) => {
        if (window.inputManager) {
          window.inputManager.setTouchMode(e.target.value);
        }
      });
    }

    const btnDismissOrientation = document.getElementById('btn-dismiss-orientation');
    if (btnDismissOrientation) {
      btnDismissOrientation.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.orientationDismissed = true;
        try { sessionStorage.setItem('orientation_dismissed', 'true'); } catch (err) {}
        if (this.orientationPrompt) {
          this.orientationPrompt.classList.add('dismissed', 'hidden');
          this.orientationPrompt.style.display = 'none';
        }
      });
    }

    // In-game Pause Button & Keyboard Esc
    document.getElementById('btn-pause-ingame').addEventListener('click', () => {
      if (window.game) window.game.togglePause();
    });

    // Pause Menu actions
    document.getElementById('btn-resume').addEventListener('click', () => {
      if (window.game) window.game.togglePause();
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      this.hideModal(this.pauseModal);
      if (window.game) window.game.restartMatch();
    });
    document.getElementById('btn-quit-to-menu').addEventListener('click', () => {
      this.hideModal(this.pauseModal);
      if (window.game) window.game.quitToMainMenu();
    });

    // Results Menu actions
    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.hideModal(this.resultsModal);
      if (window.game) window.game.restartMatch();
    });
    document.getElementById('btn-results-menu').addEventListener('click', () => {
      this.hideModal(this.resultsModal);
      if (window.game) window.game.quitToMainMenu();
    });
  }

  showModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('active');
  }

  hideModal(modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
  }

  showDifficultyModal() {
    this.showModal(this.difficultyModal);
  }

  hideDifficultyModal() {
    this.hideModal(this.difficultyModal);
  }

  selectDifficultyCard(diff) {
    document.querySelectorAll('.diff-card').forEach(card => {
      if (card.getAttribute('data-diff') === diff) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    this.currentDiffLabel.textContent = diff.toUpperCase();
    this.updateDifficultyBadge(diff);
  }

  updateDifficultyBadge(diff) {
    this.difficultyBadge.className = `badge-${diff}`;
    this.difficultyBadge.textContent = diff.toUpperCase();

    if (diff === 'easy') {
      this.aiModeTitle.textContent = 'STANDARD SYNTH';
    } else if (diff === 'medium') {
      this.aiModeTitle.textContent = 'TACTICAL ANDROID';
    } else {
      this.aiModeTitle.textContent = 'NEURAL ADAPTIVE KILLER';
    }
  }

  showMainMenu() {
    this.battleHud.classList.add('hidden');
    this.aiDebugHud.classList.add('hidden');
    this.comboDisplay.classList.add('hidden');
    if (window.inputManager) window.inputManager.updateControlsVisibility(false);
    this.mainMenu.classList.remove('hidden');
    this.mainMenu.classList.add('active');
  }

  showBattleHud() {
    this.mainMenu.classList.remove('active');
    this.mainMenu.classList.add('hidden');
    this.battleHud.classList.remove('hidden');
    if (window.inputManager) window.inputManager.updateControlsVisibility(true);
    if (this.aiDebugToggle.checked) {
      this.aiDebugHud.classList.remove('hidden');
    }
  }

  showPauseMenu() {
    this.showModal(this.pauseModal);
  }

  hidePauseMenu() {
    this.hideModal(this.pauseModal);
  }

  showResults(results) {
    this.hideModal(this.pauseModal);
    this.battleHud.classList.add('hidden');
    this.aiDebugHud.classList.add('hidden');
    this.comboDisplay.classList.add('hidden');
    if (window.inputManager) window.inputManager.updateControlsVisibility(false);

    if (results.isVictory) {
      this.resultsBanner.textContent = 'VICTORY';
      this.resultsBanner.className = 'results-banner victory';
      this.resultsSubtitle.textContent = 'NEXUS-9 HAS BEEN DECOMMISSIONED';
    } else {
      this.resultsBanner.textContent = 'DEFEAT';
      this.resultsBanner.className = 'results-banner defeat';
      this.resultsSubtitle.textContent = 'NEURAL SIMULATION TERMINATED BY ENEMY';
    }

    this.statDuration.textContent = results.duration;
    this.statHealth.textContent = `${Math.round(results.remainingHealth)} HP (${Math.round(results.remainingHealth / 10)}%)`;
    this.statMaxCombo.textContent = `${results.maxCombo} HITS`;
    this.statDifficulty.textContent = results.difficulty.toUpperCase();
    this.statDamageDealt.textContent = results.damageDealt;
    this.statDamageTaken.textContent = results.damageTaken;

    this.showModal(this.resultsModal);
  }

  showCombo(hits) {
    const hitsEl = document.getElementById('combo-hits');
    hitsEl.textContent = hits;
    this.comboDisplay.classList.remove('hidden');

    // Reset banner animation
    this.comboDisplay.style.animation = 'none';
    this.comboDisplay.offsetHeight; // trigger reflow
    this.comboDisplay.style.animation = 'combo-pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

    if (this.comboTimer) clearTimeout(this.comboTimer);
    this.comboTimer = setTimeout(() => {
      this.comboDisplay.classList.add('hidden');
    }, 1400);
  }

  updateHUD(player, ai, timeLeft) {
    // 1. Update Timer
    const displayTime = Math.max(0, Math.ceil(timeLeft));
    this.roundTimer.textContent = displayTime < 10 ? `0${displayTime}` : displayTime;

    // 2. Player Health & Energy
    const pHealthPct = Math.max(0, (player.health / player.maxHealth) * 100);
    this.playerHealthBar.style.width = `${pHealthPct}%`;
    this.playerHealthLag.style.width = `${pHealthPct}%`;
    this.playerHealthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

    const pEnergyPct = Math.max(0, (player.energy / player.maxEnergy) * 100);
    this.playerEnergyBar.style.width = `${pEnergyPct}%`;
    this.playerEnergyText.textContent = `${Math.floor(player.energy)} / ${player.maxEnergy} SP`;

    // 3. AI Health & Energy
    const aiHealthPct = Math.max(0, (ai.health / ai.maxHealth) * 100);
    this.aiHealthBar.style.width = `${aiHealthPct}%`;
    this.aiHealthLag.style.width = `${aiHealthPct}%`;
    this.aiHealthText.textContent = `${Math.ceil(ai.health)} / ${ai.maxHealth}`;

    const aiEnergyPct = Math.max(0, (ai.energy / ai.maxEnergy) * 100);
    this.aiEnergyBar.style.width = `${aiEnergyPct}%`;
    this.aiEnergyText.textContent = `${Math.floor(ai.energy)} / ${ai.maxEnergy} SP`;

    // 4. Update AI Debug Inspector (if active)
    if (this.aiDebugToggle.checked && ai.controller) {
      const ctrl = ai.controller;
      this.aiStateIndicator.textContent = ctrl.fsm.currentState;
      this.aiBtreeNode.textContent = ctrl.activeNodeName;
      this.aiDistanceVal.textContent = `${Math.round(Math.abs(player.x - ai.x))} px`;

      this.aiStatJump.style.width = `${Math.round(ctrl.patternTracker.jumpTendency * 100)}%`;
      this.aiStatSpam.style.width = `${Math.round(ctrl.patternTracker.spamTendency * 100)}%`;
      this.aiStatGuard.style.width = `${Math.round(ctrl.patternTracker.guardTendency * 100)}%`;

      this.aiPredictedAction.textContent = ctrl.predictedActionName;
    }
  }
}

window.uiManager = new UIManager();
