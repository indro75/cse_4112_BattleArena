/**
 * Input Manager - Handles keyboard input and mobile virtual touch controls with
 * justPressed / isDown / justReleased tracking and multi-touch support.
 */
class InputManager {
  constructor() {
    this.bindings = {
      moveLeft: ['KeyA', 'ArrowLeft'],
      moveRight: ['KeyD', 'ArrowRight'],
      jump: ['KeyW', 'ArrowUp', 'Space'],
      crouch: ['KeyS', 'ArrowDown'],
      attack: ['KeyJ', 'KeyZ'],
      special: ['KeyK', 'KeyX'],
      block: ['KeyL', 'KeyC'],
      dodge: ['ShiftLeft', 'ShiftRight'],
      pause: ['Escape', 'KeyP']
    };

    // Keyboard state
    this.keysDown = new Set();
    this.keysJustPressed = new Set();
    this.keysJustReleased = new Set();

    // Virtual Touch state
    this.virtualDown = new Set();
    this.virtualJustPressed = new Set();
    this.virtualJustReleased = new Set();

    // Active touch tracking: Map of touchId -> action
    this.activeTouches = new Map();

    // Mobile device capability
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.touchMode = 'auto'; // 'auto', 'always', 'never'

    this.setupListeners();
    this.setupTouchControls();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling with Space / Arrow keys during game
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.keysDown.has(e.code)) {
        this.keysJustPressed.add(e.code);
      }
      this.keysDown.add(e.code);

      // Audio unlock on any key
      if (window.audioManager) {
        window.audioManager.ensureContext();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysJustReleased.add(e.code);
    });

    window.addEventListener('blur', () => {
      this.reset();
    });

    // Audio unlock on screen touch anywhere
    window.addEventListener('touchstart', () => {
      if (window.audioManager) {
        window.audioManager.ensureContext();
      }
    }, { passive: true });
  }

  setupTouchControls() {
    const virtualControlsEl = document.getElementById('virtual-controls');
    if (!virtualControlsEl) return;

    // Attach listeners to all virtual touch buttons
    const buttons = virtualControlsEl.querySelectorAll('.touch-btn');

    buttons.forEach((btn) => {
      const action = btn.getAttribute('data-action');
      if (!action || action === 'none') return;

      // Touch Start
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          this.activeTouches.set(touch.identifier, { action, btn });
          this.pressVirtual(action, btn);
        }

        if (window.audioManager) window.audioManager.ensureContext();
      }, { passive: false });

      // Touch End
      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const record = this.activeTouches.get(touch.identifier);
          if (record) {
            this.releaseVirtual(record.action, record.btn);
            this.activeTouches.delete(touch.identifier);
          }
        }
      }, { passive: false });

      // Touch Cancel
      btn.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const record = this.activeTouches.get(touch.identifier);
          if (record) {
            this.releaseVirtual(record.action, record.btn);
            this.activeTouches.delete(touch.identifier);
          }
        }
      }, { passive: false });

      // Mouse click support for testing virtual buttons on desktop
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        this.pressVirtual(action, btn);
      });

      btn.addEventListener('mouseup', (e) => {
        e.preventDefault();
        this.releaseVirtual(action, btn);
      });

      btn.addEventListener('mouseleave', () => {
        if (this.virtualDown.has(action)) {
          this.releaseVirtual(action, btn);
        }
      });
    });

    // Touch Move for sliding across D-pad
    virtualControlsEl.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        const elUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        const btnUnderTouch = elUnderTouch ? elUnderTouch.closest('.touch-btn') : null;
        const currentRecord = this.activeTouches.get(touch.identifier);

        if (btnUnderTouch) {
          const newAction = btnUnderTouch.getAttribute('data-action');
          if (newAction && newAction !== 'none') {
            if (!currentRecord || currentRecord.action !== newAction) {
              if (currentRecord) {
                this.releaseVirtual(currentRecord.action, currentRecord.btn);
              }
              this.activeTouches.set(touch.identifier, { action: newAction, btn: btnUnderTouch });
              this.pressVirtual(newAction, btnUnderTouch);
            }
          }
        } else if (currentRecord) {
          this.releaseVirtual(currentRecord.action, currentRecord.btn);
          this.activeTouches.delete(touch.identifier);
        }
      }
    }, { passive: false });
  }

  pressVirtual(action, btn) {
    if (!this.virtualDown.has(action)) {
      this.virtualJustPressed.add(action);
    }
    this.virtualDown.add(action);
    if (btn) btn.classList.add('touch-active');
  }

  releaseVirtual(action, btn) {
    this.virtualDown.delete(action);
    this.virtualJustReleased.add(action);
    if (btn) btn.classList.remove('touch-active');
  }

  setTouchMode(mode) {
    this.touchMode = mode;
    this.updateControlsVisibility();
  }

  updateControlsVisibility(isMatchActive = false) {
    const el = document.getElementById('virtual-controls');
    if (!el) return;

    let shouldShow = false;
    if (this.touchMode === 'always') {
      shouldShow = isMatchActive;
    } else if (this.touchMode === 'never') {
      shouldShow = false;
    } else {
      // Auto: show if touch device or mobile/tablet screen dimensions
      const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || this.isTouchDevice;
      const isMobileScreen = window.innerWidth <= 1024 || window.innerHeight <= 600;
      shouldShow = isMatchActive && (isTouch || isMobileScreen);
    }

    if (shouldShow) {
      el.classList.remove('hidden');
      el.style.display = 'flex';
    } else {
      el.classList.add('hidden');
      el.style.display = 'none';
    }
  }

  isDown(action) {
    if (this.virtualDown.has(action)) return true;
    const codes = this.bindings[action];
    if (!codes) return false;
    return codes.some(code => this.keysDown.has(code));
  }

  isJustPressed(action) {
    if (this.virtualJustPressed.has(action)) return true;
    const codes = this.bindings[action];
    if (!codes) return false;
    return codes.some(code => this.keysJustPressed.has(code));
  }

  isJustReleased(action) {
    if (this.virtualJustReleased.has(action)) return true;
    const codes = this.bindings[action];
    if (!codes) return false;
    return codes.some(code => this.keysJustReleased.has(code));
  }

  // Clear single-frame flags at end of frame
  update() {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.virtualJustPressed.clear();
    this.virtualJustReleased.clear();
  }

  reset() {
    this.keysDown.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();

    // Release all active touch buttons
    for (const [id, record] of this.activeTouches) {
      if (record.btn) record.btn.classList.remove('touch-active');
    }
    this.activeTouches.clear();
    this.virtualDown.clear();
    this.virtualJustPressed.clear();
    this.virtualJustReleased.clear();
  }
}

window.inputManager = new InputManager();
