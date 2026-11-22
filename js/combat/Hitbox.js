/**
 * Hitbox and Hurtbox collision bounding boxes.
 */
class Hitbox {
  constructor(x, y, width, height, damage = 0, knockbackX = 0, knockbackY = 0, hitstun = 0.25, attackType = 1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.damage = damage;
    this.knockbackX = knockbackX;
    this.knockbackY = knockbackY;
    this.hitstun = hitstun;
    this.attackType = attackType;
  }

  static intersects(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  // Debug rendering if needed
  render(ctx, color = 'rgba(255, 0, 0, 0.4)') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }
}
