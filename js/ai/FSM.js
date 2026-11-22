/**
 * Finite State Machine for AI Tactical Postures.
 * States: IDLE, CHASE, ATTACK, DEFEND, DODGE, COUNTERATTACK, RETREAT, SPECIAL_ATTACK
 */
class AIStateMachine {
  constructor(initialState = 'IDLE') {
    this.currentState = initialState;
    this.stateTimer = 0;
    this.states = {};
  }

  registerState(name, config) {
    this.states[name] = {
      enter: config.enter || (() => {}),
      update: config.update || (() => {}),
      exit: config.exit || (() => {})
    };
  }

  changeState(newState, context) {
    if (this.currentState === newState) return;

    if (this.states[this.currentState] && this.states[this.currentState].exit) {
      this.states[this.currentState].exit(context);
    }

    this.currentState = newState;
    this.stateTimer = 0;

    if (this.states[this.currentState] && this.states[this.currentState].enter) {
      this.states[this.currentState].enter(context);
    }
  }

  update(dt, context) {
    this.stateTimer += dt;
    if (this.states[this.currentState] && this.states[this.currentState].update) {
      this.states[this.currentState].update(dt, context);
    }
  }
}
