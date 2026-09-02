import 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.setMaxVelocity(420, 900);
    this.setDragX(1800);
    this.setGravityY(900);
    this.setSize(22, 42, true);

    this.moveSpeed = 330;
    this.airControl = 0.72;
    this.jumpVelocity = 520;
    this.doubleJumpVelocity = 470;
    this.dashSpeed = 720;
    this.dashDuration = 120;
    this.dashCooldown = 650;
    this.attackCooldown = 260;
    this.attackDuration = 120;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.coins = 0;
    this.xp = 0;
    this.level = 1;
    this.jumpsUsed = 0;
    this.lastGrounded = 0;
    this.lastDash = -Infinity;
    this.lastAttack = -Infinity;
    this.dashUntil = 0;
    this.attackUntil = 0;
    this.facing = 1;
    this.invulnerableUntil = 0;

    this.keys = scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.W,
      attack: Phaser.Input.Keyboard.KeyCodes.J,
      dash: Phaser.Input.Keyboard.KeyCodes.K,
    });
    this.cursors = scene.input.keyboard.createCursorKeys();
  }

  update(time) {
    if (!this.active) return;

    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up)
      || Phaser.Input.Keyboard.JustDown(this.keys.up)
      || Phaser.Input.Keyboard.JustDown(this.cursors.space || this.keys.jump);
    const attackPressed = Phaser.Input.Keyboard.JustDown(this.keys.attack);
    const dashPressed = Phaser.Input.Keyboard.JustDown(this.keys.dash) || Phaser.Input.Keyboard.JustDown(this.cursors.shift);

    const grounded = this.body.blocked.down || this.body.touching.down;
    if (grounded) {
      this.jumpsUsed = 0;
      this.lastGrounded = time;
    }

    if (dashPressed && time >= this.lastDash + this.dashCooldown) this.dash(time);
    if (attackPressed) this.attack(time);

    if (time < this.dashUntil) {
      this.setVelocityX(this.facing * this.dashSpeed);
      this.setVelocityY(0);
      return;
    }

    let axis = 0;
    if (left) axis -= 1;
    if (right) axis += 1;
    if (axis !== 0) {
      this.facing = axis;
      this.setFlipX(axis < 0);
      const target = this.moveSpeed * (grounded ? 1 : this.airControl);
      this.setVelocityX(axis * target);
    } else if (grounded) {
      this.setVelocityX(0);
    }

    if (jumpPressed) this.tryJump(grounded, time);

    if (this.y > this.scene.scale.height + 250) {
      this.scene.handlePlayerDeath();
    }
  }

  tryJump(grounded, time) {
    if (grounded || time - this.lastGrounded < 110) {
      this.setVelocityY(-this.jumpVelocity);
      this.jumpsUsed = 1;
      return;
    }
    if (this.jumpsUsed < 2) {
      this.setVelocityY(-this.doubleJumpVelocity);
      this.jumpsUsed = 2;
    }
  }

  dash(time) {
    this.lastDash = time;
    this.dashUntil = time + this.dashDuration;
    this.invulnerableUntil = time + this.dashDuration;
    this.setVelocityX(this.facing * this.dashSpeed);
    this.setVelocityY(0);
    this.scene.spawnBurst(this.x, this.y, 0x5ee7ff);
  }

  attack(time) {
    if (time < this.lastAttack + this.attackCooldown) return;
    this.lastAttack = time;
    this.attackUntil = time + this.attackDuration;
    this.scene.playerAttack(this);
  }

  takeDamage(amount, time, sourceX) {
    if (time < this.invulnerableUntil || !this.active) return false;
    this.health -= amount;
    this.invulnerableUntil = time + 650;
    const knockDirection = this.x >= sourceX ? 1 : -1;
    this.setVelocity(knockDirection * 330, -260);
    this.setTint(0xff6b6b);
    this.scene.time.delayedCall(150, () => this.clearTint());
    this.scene.spawnBurst(this.x, this.y, 0xff6b6b);
    if (this.health <= 0) this.scene.handlePlayerDeath();
    return true;
  }

  addXp(amount) {
    this.xp += amount;
    const required = this.level * 100;
    if (this.xp >= required) {
      this.xp -= required;
      this.level += 1;
      this.maxHealth += 10;
      this.health = this.maxHealth;
      this.scene.showToast(`LEVEL UP! ${this.level}`);
    }
  }
}
