import 'phaser';

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = 'enemy') {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setGravityY(900);
    this.setSize(28, 38, true);
    this.setBounce(0.05);
    this.speed = Phaser.Math.Between(70, 105);
    this.maxHealth = 40;
    this.health = this.maxHealth;
    this.damage = 15;
    this.attackRange = 58;
    this.attackCooldown = 850;
    this.lastAttack = -Infinity;
    this.facing = -1;
    this.stunUntil = 0;
    this.xpReward = 30;
  }

  update(time, player) {
    if (!this.active || !player || !player.active) return;
    if (time < this.stunUntil) {
      this.setVelocityX(0);
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    if (Math.abs(dx) < 430 && Math.abs(dy) < 180) {
      this.facing = dx >= 0 ? 1 : -1;
      this.setFlipX(this.facing < 0);
      if (Math.abs(dx) > this.attackRange) {
        this.setVelocityX(this.facing * this.speed);
      } else {
        this.setVelocityX(0);
        if (time >= this.lastAttack + this.attackCooldown) {
          this.lastAttack = time;
          player.takeDamage(this.damage, time, this.x);
        }
      }
    } else {
      this.setVelocityX(0);
    }
  }

  takeDamage(amount, sourceX, time) {
    if (!this.active) return false;
    this.health -= amount;
    this.stunUntil = time + 220;
    const direction = this.x >= sourceX ? 1 : -1;
    this.setVelocity(direction * 300, -180);
    this.setTint(0xffd166);
    this.scene.time.delayedCall(120, () => {
      if (this.active) this.clearTint();
    });
    if (this.health <= 0) {
      this.scene.killEnemy(this);
    }
    return true;
  }
}
