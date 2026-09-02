import 'phaser';
import Player from '../objects/Player';
import Enemy from '../objects/Enemy';
import jungleG from '../assets/forest/bg_jungle_layers/bg5_g.png';
import jungleF from '../assets/forest/bg_jungle_layers/bg5_f.png';
import jungleE from '../assets/forest/bg_jungle_layers/bg5_e.png';
import platformTile from '../assets/forest/jungle_pack_05.png';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
    this.gameOptions = { gravity: 1100, playerSpeed: 330, jumpVelocity: 520, platformWidth: [130, 280], platformGap: [90, 210], platformHeight: [360, 520], enemyChance: 0.28 };
  }

  preload() {
    this.load.image('jungleG', jungleG);
    this.load.image('jungleF', jungleF);
    this.load.image('jungleE', jungleE);
    this.load.image('platform', platformTile);
  }

  create() {
    this.model = this.sys.game.globals.model;
    this.startTime = this.time.now;
    this.dead = false;
    this.scoreDistance = 0;
    this.coins = 0;
    this.enemiesDefeated = 0;
    this.worldWidth = 100000;
    this.generatedTo = 0;
    this.createTextures();
    this.createBackground();
    this.physics.world.setBounds(0, 0, this.worldWidth, this.scale.height + 500);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.scale.height);
    this.platformGroup = this.physics.add.staticGroup();
    this.enemyGroup = this.physics.add.group({ allowGravity: true, collideWorldBounds: true });
    this.coinGroup = this.physics.add.staticGroup();
    this.generatePlatforms(0, 10000);
    this.player = new Player(this, 180, 350, 'dude');
    this.player.moveSpeed = this.gameOptions.playerSpeed;
    this.player.jumpVelocity = this.gameOptions.jumpVelocity;
    this.physics.add.collider(this.player, this.platformGroup);
    this.physics.add.collider(this.enemyGroup, this.platformGroup);
    this.physics.add.collider(this.player, this.enemyGroup, this.enemyTouch, null, this);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.createHud();
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(240, 140);
    this.showToast('A/D or arrows move • SPACE jump • J attack • K dash');
  }

  createTextures() {
    if (!this.textures.exists('enemy')) {
      const g = this.add.graphics();
      g.fillStyle(0x7c3aed, 1); g.fillRoundedRect(2, 4, 36, 34, 9);
      g.fillStyle(0xffffff, 1); g.fillCircle(13, 17, 5); g.fillCircle(27, 17, 5);
      g.fillStyle(0x111827, 1); g.fillCircle(13, 17, 2); g.fillCircle(27, 17, 2);
      g.generateTexture('enemy', 40, 42); g.destroy();
    }
    if (!this.textures.exists('coin')) {
      const g = this.add.graphics();
      g.fillStyle(0xffd166, 1); g.fillCircle(10, 10, 9);
      g.lineStyle(2, 0xffffff, 0.8); g.strokeCircle(10, 10, 7);
      g.generateTexture('coin', 20, 20); g.destroy();
    }
  }

  createBackground() {
    this.cameras.main.setBackgroundColor(0x86d8ff);
    for (let x = 0; x < this.worldWidth; x += 1600) {
      this.add.tileSprite(x, 0, 1600, this.scale.height, 'jungleG').setOrigin(0).setScrollFactor(0.05).setDepth(-3);
      this.add.tileSprite(x, 90, 1600, 250, 'jungleF').setOrigin(0).setScrollFactor(0.12).setAlpha(0.9).setDepth(-2);
      this.add.tileSprite(x, 190, 1600, 400, 'jungleE').setOrigin(0).setScrollFactor(0.2).setAlpha(0.92).setDepth(-1);
    }
  }

  createHud() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    this.healthText = this.add.text(18, 16, '', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' });
    this.statsText = this.add.text(18, 44, '', { fontSize: '17px', color: '#ffffff' });
    this.helpText = this.add.text(18, 72, '', { fontSize: '13px', color: '#e5e7eb' });
    this.toastText = this.add.text(this.scale.width / 2, 118, '', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#111827cc', padding: { left: 14, right: 14, top: 8, bottom: 8 } }).setOrigin(0.5).setAlpha(0);
    this.hud.add([this.healthText, this.statsText, this.helpText, this.toastText]);
    this.updateHud();
  }

  updateHud() {
    if (!this.player) return;
    this.healthText.setText(`HP ${Math.max(0, this.player.health)} / ${this.player.maxHealth}`);
    this.statsText.setText(`Coins ${this.coins}   Level ${this.player.level}   Defeated ${this.enemiesDefeated}`);
    this.helpText.setText(`Distance ${Math.floor(this.scoreDistance / 10)}m`);
  }

  generatePlatforms(startX, endX) {
    let x = Math.max(80, startX);
    let y = 500;
    while (x < endX) {
      const width = Phaser.Math.Between(this.gameOptions.platformWidth[0], this.gameOptions.platformWidth[1]);
      y = Phaser.Math.Clamp(y + Phaser.Math.Between(-70, 70), this.gameOptions.platformHeight[0], this.gameOptions.platformHeight[1]);
      const platform = this.platformGroup.create(x + width / 2, y, 'platform');
      platform.setDisplaySize(width, 32).refreshBody();
      if (x > 500 && Math.random() < this.gameOptions.enemyChance) this.spawnEnemy(x + width / 2, y - 55);
      if (x > 350) {
        const coinCount = Phaser.Math.Between(1, 3);
        for (let i = 0; i < coinCount; i += 1) this.coinGroup.create(x + 30 + i * 42, y - 48 - (i % 2) * 16, 'coin').setDepth(4);
      }
      x += width + Phaser.Math.Between(this.gameOptions.platformGap[0], this.gameOptions.platformGap[1]);
    }
    this.generatedTo = Math.max(this.generatedTo, endX);
  }

  spawnEnemy(x, y) {
    const enemy = new Enemy(this, x, y);
    this.enemyGroup.add(enemy);
    enemy.setDepth(5);
  }

  playerAttack(player) {
    const range = 72;
    let hit = false;
    this.enemyGroup.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dx = enemy.x - player.x;
      if (Math.abs(dx) <= range && Math.abs(enemy.y - player.y) < 70 && Math.sign(dx || 1) === player.facing) {
        enemy.takeDamage(25, player.x, this.time.now); hit = true;
      }
    });
    const slash = this.add.rectangle(player.x + player.facing * 40, player.y - 4, 58, 8, 0xffffff, 0.9).setDepth(20);
    slash.setRotation(player.facing < 0 ? -0.45 : 0.45);
    this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.4, duration: 110, onComplete: () => slash.destroy() });
    if (hit) this.spawnBurst(player.x + player.facing * 50, player.y - 10, 0xffd166);
  }

  enemyTouch(player, enemy) {
    if (!enemy.active || this.dead) return;
    player.takeDamage(12, this.time.now, enemy.x);
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.coins += 10;
    player.addXp(10);
    this.spawnBurst(coin.x, coin.y, 0xffd166);
    this.updateHud();
  }

  killEnemy(enemy) {
    if (!enemy.active) return;
    this.enemiesDefeated += 1;
    this.coins += 25;
    this.player.addXp(enemy.xpReward);
    this.spawnBurst(enemy.x, enemy.y, 0x7c3aed);
    enemy.disableBody(true, true);
    this.updateHud();
  }

  spawnBurst(x, y, color) {
    for (let i = 0; i < 7; i += 1) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 1).setDepth(30);
      this.physics.world.enable(p);
      p.body.setVelocity(Phaser.Math.Between(-180, 180), Phaser.Math.Between(-220, 40));
      this.tweens.add({ targets: p, alpha: 0, scale: 0.2, duration: 350, onComplete: () => p.destroy() });
    }
  }

  showToast(message) {
    if (!this.toastText) return;
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1800, duration: 450 });
  }

  handlePlayerDeath() {
    if (this.dead) return;
    this.dead = true;
    this.player.setVelocity(0, -250).setTint(0xff3b30);
    this.model.score = this.formatTime(this.time.now - this.startTime);
    this.model.coins = (this.model.coins || 0) + this.coins;
    this.time.delayedCall(650, () => this.scene.start('Over'));
  }

  formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60); const seconds = total % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  update(time) {
    if (this.dead || !this.player) return;
    this.player.update(time);
    this.enemyGroup.getChildren().forEach(enemy => enemy.update(time, this.player));
    if (this.player.x > this.generatedTo - 2500) this.generatePlatforms(this.generatedTo, this.generatedTo + 9000);
    this.scoreDistance = Math.max(this.scoreDistance, this.player.x - 180);
    this.updateHud();
    this.enemyGroup.getChildren().forEach(enemy => {
      if (enemy.active && enemy.x < this.player.x - 900) enemy.disableBody(true, true);
    });
  }
}
