import 'phaser';

export default class Boss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, biome) {
    if (!scene.textures.exists('boss')) {
      const g = scene.add.graphics();
      g.fillStyle(0xdc2626, 1); g.fillRoundedRect(4, 4, 68, 58, 16);
      g.fillStyle(0xfff, 1); g.fillCircle(22, 25, 7); g.fillCircle(54, 25, 7);
      g.fillStyle(0x111827, 1); g.fillCircle(22, 25, 3); g.fillCircle(54, 25, 3);
      g.generateTexture('boss', 76, 68); g.destroy();
    }
    super(scene, x, y, 'boss');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);
    this.setGravityY(900);
    this.setSize(58, 58, true);
    this.health = 260 + biome * 90;
    this.maxHealth = this.health;
    this.damage = 24 + biome * 5;
    this.speed = 95 + biome * 12;
    this.xpReward = 180 + biome * 70;
    this.lastAttack = 0;
    this.stunUntil = 0;
    this.biome = biome;
  }

  update(time, player) {
    if (!this.active || !player || time < this.stunUntil) return;
    const dx = player.x - this.x;
    if (Math.abs(dx) < 650) {
      this.setVelocityX(Math.sign(dx) * this.speed);
      this.setFlipX(dx < 0);
      if (Math.abs(dx) < 70 && Math.abs(player.y - this.y) < 90 && time > this.lastAttack + 900) {
        this.lastAttack = time;
        player.takeDamage(this.damage, time, this.x);
      }
      if (Math.abs(dx) < 360 && Math.abs(player.y - this.y) < 150 && Math.random() < 0.008) {
        this.setVelocityY(-470);
      }
    } else this.setVelocityX(0);
  }

  takeDamage(amount, sourceX) {
    this.health -= amount;
    this.stunUntil = this.scene.time.now + 120;
    this.setTint(0xffffff);
    this.setVelocity((this.x >= sourceX ? 1 : -1) * 220, -170);
    this.scene.time.delayedCall(100, () => this.clearTint());
    if (this.health <= 0) this.scene.killBoss(this);
  }
}
