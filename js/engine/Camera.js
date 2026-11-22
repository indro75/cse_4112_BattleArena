/**
 * Camera System - Handles smooth tracking, dynamic zoom framing, and screen shake.
 */
class Camera {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    this.x = canvasWidth / 2;
    this.y = canvasHeight / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    this.zoom = 1.0;
    this.targetZoom = 1.0;

    // Screen Shake properties
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.enabledShake = true;

    // Bounds of arena
    this.minX = 400;
    this.maxX = 880;
    this.minY = 320;
    this.maxY = 400;
  }

  setShakeEnabled(enabled) {
    this.enabledShake = enabled;
  }

  // Trigger shake with intensity (pixels) and duration (seconds)
  shake(intensity = 8, duration = 0.25) {
    if (!this.enabledShake) return;
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeTimer = duration;
  }

  update(dt, player, ai) {
    if (player && ai) {
      // Midpoint between combatants
      const midX = (player.x + ai.x) / 2;
      const midY = (player.y + ai.y) / 2 - 40;

      this.targetX = Math.max(this.minX, Math.min(this.maxX, midX));
      this.targetY = Math.max(this.minY, Math.min(this.maxY, midY));

      // Dynamic framing zoom: closer when clashing, zoomed out when spaced apart
      const dist = Math.abs(player.x - ai.x);
      const desiredZoom = Math.max(0.9, Math.min(1.15, 1.15 - (dist / 1400)));
      this.targetZoom = desiredZoom;
    }

    // Smooth lerp camera movement
    const lerpSpeed = 5 * dt;
    this.x += (this.targetX - this.x) * lerpSpeed;
    this.y += (this.targetY - this.y) * lerpSpeed;
    this.zoom += (this.targetZoom - this.zoom) * lerpSpeed;

    // Update screen shake
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const progress = this.shakeTimer / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * progress;
      this.shakeOffset.x = (Math.random() * 2 - 1) * currentIntensity;
      this.shakeOffset.y = (Math.random() * 2 - 1) * currentIntensity;
    } else {
      this.shakeOffset.x = 0;
      this.shakeOffset.y = 0;
      this.shakeIntensity = 0;
    }
  }

  apply(ctx) {
    ctx.save();
    // Center point of canvas
    ctx.translate(this.canvasWidth / 2, this.canvasHeight / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(
      -this.x + this.shakeOffset.x,
      -this.y + this.shakeOffset.y
    );
  }

  restore(ctx) {
    ctx.restore();
  }
}
