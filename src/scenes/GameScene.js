import 'phaser';
import Player from '../objects/Player';
import Enemy from '../objects/Enemy';
import Boss from '../objects/Boss';
import MobileControls from '../objects/MobileControls';
import CrazyGames from '../modules/CrazyGames';
import jungleG from '../assets/forest/bg_jungle_layers/bg5_g.png';
import jungleF from '../assets/forest/bg_jungle_layers/bg5_f.png';
import jungleE from '../assets/forest/bg_jungle_layers/bg5_e.png';
import platformTile from '../assets/forest/jungle_pack_05.png';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
    this.gameOptions = { playerSpeed: 330, jumpVelocity: 520, platformWidth: [130, 280], platformGap: [90, 210], platformHeight: [360, 520], enemyChance: 0.28 };
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
    this.scoreDistance = this.model.resumeX || 0;
    this.coins = 0;
    this.enemiesDefeated = 0;
    this.bossesDefeated = 0;
    this.worldWidth = 100000;
    this.generatedTo = this.scoreDistance;
    this.lastCheckpoint = this.scoreDistance;
    this.lastMilestone = Math.floor(this.scoreDistance / 5000);
    this.bossGroup = this.physics.add.group({ allowGravity: true, collideWorldBounds: true });
    this.createTextures();
    this.createBackground();
    this.physics.world.setBounds(0, 0, this.worldWidth, this.scale.height + 500);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.scale.height);
    this.platformGroup = this.physics.add.staticGroup();
    this.enemyGroup = this.physics.add.group({ allowGravity: true, collideWorldBounds: true });
    this.coinGroup = this.physics.add.staticGroup();
    this.generatePlatforms(Math.max(0, this.scoreDistance - 500), this.scoreDistance + 10000);

    this.player = new Player(this, Math.max(180, this.scoreDistance + 180), 350, 'dude');
    this.applyUpgrades();
    this.mobile = new MobileControls(this);
    this.physics.add.collider(this.player, this.platformGroup);
    this.physics.add.collider(this.enemyGroup, this.platformGroup);
    this.physics.add.collider(this.bossGroup, this.platformGroup);
    this.physics.add.collider(this.player, this.enemyGroup, this.enemyTouch, null, this);
    this.physics.add.collider(this.player, this.bossGroup, this.enemyTouch, null, this);
    this.physics.add.overlap(this.player, this.coinGroup, this.collectCoin, null, this);
    this.createHud();
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(240, 140);
    CrazyGames.gameplayStart();
    this.showToast('Explore 5 worlds • SPACE jump • J attack • K dash');
  }

  applyUpgrades() {
    const u = this.model.upgrades || {};
    this.player.maxHealth += (u.health || 0) * 20;
    this.player.health = this.player.maxHealth;
    this.player.moveSpeed += (u.speed || 0) * 18;
    this.player.dashSpeed += (u.dash || 0) * 70;
    this.player.dashCooldown = Math.max(300, this.player.dashCooldown - (u.dash || 0) * 55);
    this.attackDamage = 25 + (u.damage || 0) * 12;
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

  biomeForX(x) {
    return Math.min(4, Math.floor(Math.max(0, x) / 20000));
  }

  biomeName(index) {
    return ['GRASSLANDS', 'DESERT', 'FROZEN PEAKS', 'VOLCANO', 'SKY REALM'][index];
  }

  biomeColor(index) {
    return [0x86d8ff, 0xf5c56b, 0xb9e9ff, 0xff7043, 0x8b7cff][index];
  }

  createBackground() {
    this.cameras.main.setBackgroundColor(this.biomeColor(0));
    for (let x = 0; x < this.worldWidth; x += 1600) {
      this.add.tileSprite(x, 0, 1600, this.scale.height, 'jungleG').setOrigin(0).setScrollFactor(0.05).setDepth(-3);
      this.add.tileSprite(x, 90, 1600, 250, 'jungleF').setOrigin(0).setScrollFactor(0.12).setAlpha(0.9).setDepth(-2);
      this.add.tileSprite(x, 190, 1600, 400, 'jungleE').setOrigin(0).setScrollFactor(0.2).setAlpha(0.92).setDepth(-1);
    }
  }

  createHud() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    this.healthText = this.add.text(18, 16, '', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' });
    this.statsText = this.add.text(18, 44, '', { fontSize: '16px', color: '#ffffff' });
    this.worldText = this.add.text(18, 69, '', { fontSize: '15px', color: '#fff7cc', fontStyle: 'bold' });
    this.helpText = this.add.text(18, 92, '', { fontSize: '12px', color: '#e5e7eb' });
    this.shopButton = this.add.text(this.scale.width - 18, 18, 'UPGRADES', { fontSize: '16px', color: '#fff', backgroundColor: '#2563eb', padding: { left: 10, right: 10, top: 7, bottom: 7 } }).setOrigin(1, 0).setScrollFactor(0).setInteractive();
    this.shopButton.on('pointerdown', () => { this.model.resumeX = Math.max(0, this.player.x); this.model.coins += this.coins; this.model.saveProgress(); this.scene.start('Upgrades'); });
    this.toastText = this.add.text(this.scale.width / 2, 125, '', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#111827cc', padding: { left: 14, right: 14, top: 8, bottom: 8 } }).setOrigin(0.5).setAlpha(0);
    this.hud.add([this.healthText, this.statsText, this.worldText, this.helpText, this.shopButton, this.toastText]);
    this.updateHud();
  }

  updateHud() {
    if (!this.player) return;
    const biome = this.biomeForX(this.scoreDistance);
    this.healthText.setText(`HP ${Math.max(0, this.player.health)} / ${this.player.maxHealth}`);
    this.statsText.setText(`Coins ${this.coins}   Lv ${this.player.level}   Defeated ${this.enemiesDefeated}   Bosses ${this.bossesDefeated}`);
    this.worldText.setText(`${this.biomeName(biome)}  •  ${Math.floor(this.scoreDistance / 10)}m`);
    this.helpText.setText('A/D or arrows move • SPACE/W jump • J attack • K/SHIFT dash');
  }

  generatePlatforms(startX, endX) {
    let x = Math.max(80, startX);
    let y = 500;
    while (x < endX) {
      const biome = this.biomeForX(x);
      const width = Phaser.Math.Between(this.gameOptions.platformWidth[0], this.gameOptions.platformWidth[1]);
      y = Phaser.Math.Clamp(y + Phaser.Math.Between(-70, 70), this.gameOptions.platformHeight[0], this.gameOptions.platformHeight[1]);
      const platform = this.platformGroup.create(x + width / 2, y, 'platform');
      platform.setDisplaySize(width, 32).setTint(this.biomeColor(biome)).refreshBody();
      if (x > 500 && Math.random() < Math.min(0.5, this.gameOptions.enemyChance + biome * 0.04)) this.spawnEnemy(x + width / 2, y - 55);
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
    enemy.health += this.biomeForX(x) * 12;
    enemy.damage += this.biomeForX(x) * 3;
    this.enemyGroup.add(enemy);
    enemy.setDepth(5);
  }

  spawnBoss(x, y, biome) {
    const boss = new Boss(this, x, y, biome);
    this.bossGroup.add(boss);
    boss.setDepth(6);
    this.showToast(`${this.biomeName(biome)} BOSS!`);
  }

  playerAttack(player) {
    const range = 78;
    let hit = false;
    this.enemyGroup.getChildren().forEach(enemy => {
      if (!enemy.active) return;
      const dx = enemy.x - player.x;
      if (Math.abs(dx) <= range && Math.abs(enemy.y - player.y) < 75 && Math.sign(dx || 1) === player.facing) {
        enemy.takeDamage(this.attackDamage, player.x, this.time.now); hit = true;
      }
    });
    this.bossGroup.getChildren().forEach(boss => {
      if (!boss.active) return;
      const dx = boss.x - player.x;
      if (Math.abs(dx) <= range + 12 && Math.abs(boss.y - player.y) < 90 && Math.sign(dx || 1) === player.facing) {
        boss.takeDamage(this.attackDamage, player.x); hit = true;
      }
    });
    const slash = this.add.rectangle(player.x + player.facing * 40, player.y - 4, 58, 8, 0xffffff, 0.9).setDepth(20);
    slash.setRotation(player.facing < 0 ? -0.45 : 0.45);
    this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.4, duration: 110, onComplete: () => slash.destroy() });
    if (hit) this.spawnBurst(player.x + player.facing * 50, player.y - 10, 0xffd166);
  }

  enemyTouch(player, enemy) {
    if (!enemy.active || this.dead) return;
    player.takeDamage(enemy.damage || 12, this.time.now, enemy.x);
  }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.coins += 10;
    player.addXp(10);
    this.spawnBurst(coin.x, coin.y, 0xffd166);
  }

  killEnemy(enemy) {
    if (!enemy.active) return;
    this.enemiesDefeated += 1;
    this.coins += 25;
    this.player.addXp(enemy.xpReward);
    this.spawnBurst(enemy.x, enemy.y, 0x7c3aed);
    enemy.disableBody(true, true);
  }

  killBoss(boss) {
    if (!boss.active) return;
    this.bossesDefeated += 1;
    this.coins += 250;
    this.player.addXp(boss.xpReward);
    this.spawnBurst(boss.x, boss.y, 0xffd166);
    boss.disableBody(true, true);
    this.showToast('BOSS DEFEATED! +250 COINS');
    CrazyGames.requestAd('midgame');
  }

  checkpoint() {
    const checkpoint = Math.floor(this.scoreDistance / 5000) * 5000;
    if (checkpoint > this.lastCheckpoint) {
      this.lastCheckpoint = checkpoint;
      this.model.resumeX = checkpoint;
      this.model.coins += this.coins;
      this.coins = 0;
      this.model.bestDistance = Math.max(this.model.bestDistance, checkpoint);
      this.model.saveProgress();
      this.showToast('CHECKPOINT REACHED!');
    }
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
    CrazyGames.gameplayStop();
    this.model.score = this.formatTime(this.time.now - this.startTime);
    this.model.coins += this.coins;
    this.model.resumeX = this.lastCheckpoint;
    this.model.bestDistance = Math.max(this.model.bestDistance, this.scoreDistance);
    this.model.saveProgress();
    this.player.setVelocity(0, -250).setTint(0xff3b30);
    this.time.delayedCall(350, () => this.scene.start('Over'));
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
    this.bossGroup.getChildren().forEach(boss => boss.update(time, this.player));
    if (this.player.x > this.generatedTo - 2500) this.generatePlatforms(this.generatedTo, this.generatedTo + 9000);
    this.scoreDistance = Math.max(this.scoreDistance, this.player.x - 180);
    this.checkpoint();
    const milestone = Math.floor(this.scoreDistance / 20000);
    if (milestone > this.lastMilestone && milestone <= 4) {
      this.lastMilestone = milestone;
      this.spawnBoss(this.scoreDistance + 1000, 350, milestone - 1);
      this.showToast(`WORLD ${milestone + 1}: ${this.biomeName(milestone)}`);
    }
    const biome = this.biomeForX(this.scoreDistance);
    this.cameras.main.setBackgroundColor(this.biomeColor(biome));
    this.updateHud();
    this.enemyGroup.getChildren().forEach(enemy => {
      if (enemy.active && enemy.x < this.player.x - 900) enemy.disableBody(true, true);
    });
  }
}
