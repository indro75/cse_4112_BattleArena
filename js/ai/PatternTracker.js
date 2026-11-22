/**
 * Pattern Tracker - Analyzes human player tendencies, habits, and combat patterns in real-time.
 */
class PatternTracker {
  constructor() {
    this.history = [];
    this.maxHistoryTime = 12.0; // sliding 12-second window

    // Tracked metrics
    this.jumpCount = 0;
    this.attackCount = 0;
    this.blockDuration = 0;
    this.dodgeCount = 0;
    this.whiffCount = 0;
    this.distanceSamples = [];

    // Calculated tendencies (0.0 to 1.0)
    this.jumpTendency = 0.1;
    this.spamTendency = 0.1;
    this.guardTendency = 0.1;
    this.dodgeTendency = 0.1;
    this.averageDistance = 300;
  }

  reset() {
    this.history = [];
    this.jumpCount = 0;
    this.attackCount = 0;
    this.blockDuration = 0;
    this.dodgeCount = 0;
    this.whiffCount = 0;
    this.distanceSamples = [];
    this.jumpTendency = 0.1;
    this.spamTendency = 0.1;
    this.guardTendency = 0.1;
    this.dodgeTendency = 0.1;
    this.averageDistance = 300;
  }

  recordEvent(eventType, details = {}) {
    this.history.push({
      time: performance.now() / 1000,
      type: eventType,
      details
    });
  }

  update(dt, player, ai) {
    const now = performance.now() / 1000;
    const dist = Math.abs(player.x - ai.x);

    // Sample player distance
    this.distanceSamples.push(dist);
    if (this.distanceSamples.length > 60) {
      this.distanceSamples.shift();
    }

    // Prune history older than sliding window
    while (this.history.length > 0 && now - this.history[0].time > this.maxHistoryTime) {
      this.history.shift();
    }

    // Tally events in sliding window
    let jumps = 0;
    let attacks = 0;
    let dodges = 0;
    let whiffs = 0;

    for (const ev of this.history) {
      if (ev.type === 'jump') jumps++;
      if (ev.type === 'attack') attacks++;
      if (ev.type === 'dodge') dodges++;
      if (ev.type === 'whiff') whiffs++;
    }

    // Track block time
    if (player.isBlocking) {
      this.blockDuration += dt;
    } else {
      this.blockDuration = Math.max(0, this.blockDuration - dt * 0.5);
    }

    // Calculate tendencies normalized between 0 and 1
    // High jump rate: > 3 jumps in 10s
    this.jumpTendency = Math.min(1.0, jumps / 4.0);

    // High attack spam: > 5 attacks in 10s
    this.spamTendency = Math.min(1.0, attacks / 6.0);

    // High guard tendency: blocking for significant time
    this.guardTendency = Math.min(1.0, this.blockDuration / 2.5);

    // Dodge tendency
    this.dodgeTendency = Math.min(1.0, dodges / 3.0);

    // Average distance
    if (this.distanceSamples.length > 0) {
      const sum = this.distanceSamples.reduce((a, b) => a + b, 0);
      this.averageDistance = sum / this.distanceSamples.length;
    }
  }
}
