/**
 * Player - Handles keyboard input mappings to fighter actions.
 */
class Player extends Fighter {
  constructor(x, y, facing) {
    super(x, y, facing, {
      name: 'PLAYER',
      themeColor: '#00f0ff',
      secondaryColor: '#0077cc',
      visorColor: '#00f0ff',
      trailColor: '#00f0ff'
    });
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
    if (window.inputManager) {
      this.handleInput(window.inputManager, opponent);
    }
    super.update(dt, opponent);
  }
}
