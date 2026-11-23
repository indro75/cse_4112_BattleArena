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
    // Run AI Controller decisions
    this.controller.update(dt, player);

    // Call base physics & animation update
    super.update(dt, player);
  }
}
