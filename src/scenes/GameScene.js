import 'phaser';
import Player from '../objects/Player';
import Enemy from '../objects/Enemy';
import Boss from '../objects/Boss';
import MobileControls from '../objects/MobileControls';
import CrazyGames from '../modules/CrazyGames';
import platformTile from '../assets/forest/jungle_pack_05.png';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
    this.gameOptions = { playerSpeed: 330, jumpVelocity: 520, platformWidth: [130, 280], platformGap: [90, 210], platformHeight: [360, 520], enemyChance: 0.22 };
    this.lowPower = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  preload() {
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
    this.lastCleanup = 0;

    this.createTextures();
    this.createBackground();
    this.physics.world.setBounds(0, 0, this.worldWidth, this.scale.height + 500);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.scale.height);

    this.platformGroup = this.physics.add.staticGroup();
    this.enemyGroup = this.physics.add.group({ allowGravity: true, collideWorldBounds: true, maxSize: this.lowPower ? 12 : 20 });
    this.bossGroup = this.physics.add.group({ allowGravity: true, collideWorldBounds: true, maxSize: 1 });
    this.coinGroup = this.physics.add.staticGroup();

    this.generatePlatforms(Math.max(0, this.scoreDistance - 500), this.scoreDistance + 7000);
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

  biomeForX(x) { return Math.min(4, Math.floor(Math.max(0, x) / 20000)); }
  biomeName(index) { return ['GRASSLANDS', 'DESERT', 'FROZEN PEAKS', 'VOLCANO', 'SKY REALM'][index]; }
  biomeColor(index) { return [0x86d8ff, 0xf5c56b, 0xb9e9ff, 0xff7043, 0x8b7cff][index]; }

  createBackground() {
    // No giant world-sized sprites: use one cheap camera-space background.
    this.bg = this.add.rectangle(0, 0, this.scale.width, this.scale.height, this.biomeColor(0)).setOrigin(0).setScrollFactor(0).setDepth(-10);
    this.bg2 = this.add.rectangle(0, this.scale.height * 0.62, this.scale.width, this.scale.height * 0.38, 0x5a8f52, 0.28).setOrigin(0).setScrollFactor(0).setDepth(-9);
  }

  createHud() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(100);
    const fs = this.lowPower ? '15px' : '18px';
    this.healthText = this.add.text(14, 12, '', { fontSize: fs, color: '#ffffff', fontStyle: 'bold' });
    this.statsText = this.add.text(14, 35, '', { fontSize: this.lowPower ? '12px' : '14px', color: '#ffffff' });
    this.worldText = this.add.text(14, 57, '', { fontSize: this.lowPower ? '12px' : '14px', color: '#fff7cc', fontStyle: 'bold' });
    this.helpText = this.add.text(14, 79, this.lowPower ? 'Move • Jump • Attack • Dash' : 'A/D • SPACE/W • J attack • K/SHIFT dash', { fontSize: '11px', color: '#e5e7eb' });
    this.shopButton = this.add.text(this.scale.width - 14, 12, 'UPGRADES', { fontSize: '14px', color: '#fff', backgroundColor: '#2563eb', padding: { left: 8, right: 8, top: 6, bottom: 6 } }).setOrigin(1, 0).setScrollFactor(0).setInteractive();
    this.shopButton.on('pointerdown', () => { this.model.resumeX = Math.max(0, this.player.x); this.model.coins += this.coins; this.model.saveProgress(); this.scene.start('Upgrades'); });
    this.toastText = this.add.text(this.scale.width / 2, 105, '', { fontSize: this.lowPower ? '17px' : '21px', color: '#ffffff', fontStyle: 'bold', backgroundColor: '#111827cc', padding: { left: 10, right: 10, top: 6, bottom: 6 } }).setOrigin(0.5).setAlpha(0);
    this.hud.add([this.healthText, this.statsText, this.worldText, this.helpText, this.shopButton, this.toastText]);
    this.updateHud();
  }

  updateHud() {
    if (!this.player) return;
    const biome = this.biomeForX(this.scoreDistance);
    this.healthText.setText(`HP ${Math.max(0, this.player.health)} / ${this.player.maxHealth}`);
    this.statsText.setText(`Coins ${this.coins}   Lv ${this.player.level}   Kills ${this.enemiesDefeated}   Bosses ${this.bossesDefeated}`);
    this.worldText.setText(`${this.biomeName(biome)}  •  ${Math.floor(this.scoreDistance / 10)}m`);
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
      if (x > 500 && this.enemyGroup.countActive(true) < (this.lowPower ? 8 : 14) && Math.random() < Math.min(0.38, this.gameOptions.enemyChance + biome * 0.035)) this.spawnEnemy(x + width / 2, y - 55);
      if (x > 350) {
        const coinCount = this.lowPower ? 1 : Phaser.Math.Between(1, 2);
        for (let i = 0; i < coinCount; i += 1) this.coinGroup.create(x + 35 + i * 42, y - 48 - (i % 2) * 16, 'coin').setDepth(4);
      }
      x += width + Phaser.Math.Between(this.gameOptions.platformGap[0], this.gameOptions.platformGap[1]);
    }
    this.generatedTo = Math.max(this.generatedTo, endX);
  }

  spawnEnemy(x, y) {
    if (this.enemyGroup.countActive(true) >= (this.lowPower ? 8 : 14)) return;
    const enemy = new Enemy(this, x, y);
    const biome = this.biomeForX(x);
    enemy.health += biome * 12;
    enemy.damage += biome * 3;
    this.enemyGroup.add(enemy);
    enemy.setDepth(5);
  }

  spawnBoss(x, y, biome) {
    if (this.bossGroup.countActive(true)) return;
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
      if (Math.abs(dx) <= range && Math.abs(enemy.y - player.y) < 75 && Math.sign(dx || 1) === player.facing) { enemy.takeDamage(this.attackDamage, player.x, this.time.now); hit = true; }
    });
    this.bossGroup.getChildren().forEach(boss => {
      if (!boss.active) return;
      const dx = boss.x - player.x;
      if (Math.abs(dx) <= range + 12 && Math.abs(boss.y - player.y) < 90 && Math.sign(dx || 1) === player.facing) { boss.takeDamage(this.attackDamage, player.x); hit = true; }
    });
    const slash = this.add.rectangle(player.x + player.facing * 40, player.y - 4, 58, 7, 0xffffff, 0.9).setDepth(20);
    slash.setRotation(player.facing < 0 ? -0.45 : 0.45);
    this.tweens.add({ targets: slash, alpha: 0, scaleX: 1.4, duration: 100, onComplete: () => slash.destroy() });
    if (hit) this.spawnBurst(player.x + player.facing * 50, player.y - 10, 0xffd166);
  }

  enemyTouch(player, enemy) { if (!enemy.active || this.dead) return; player.takeDamage(enemy.damage || 12, this.time.now, enemy.x); }

  collectCoin(player, coin) {
    coin.disableBody(true, true);
    this.coins += 10;
    player.addXp(10);
    if (!this.lowPower) this.spawnBurst(coin.x, coin.y, 0xffd166);
  }

  killEnemy(enemy) {
    if (!enemy.active) return;
    this.enemiesDefeated += 1;
    this.coins += 25;
    this.player.addXp(enemy.xpReward);
    if (!this.lowPower) this.spawnBurst(enemy.x, enemy.y, 0x7c3aed);
    enemy.disableBody(true, true);
  }

  killBoss(boss) {
    if (!boss.active) return;
    this.bossesDefeated += 1;
    this.coins += 250;
    this.player.addXp(boss.xpReward);
    if (!this.lowPower) this.spawnBurst(boss.x, boss.y, 0xffd166);
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
    const count = this.lowPower ? 2 : 5;
    for (let i = 0; i < count; i += 1) {
      const p = this.add.circle(x, y, Phaser.Math.Between(2, 4), color, 1).setDepth(30);
      this.physics.world.enable(p);
      p.body.setVelocity(Phaser.Math.Between(-150, 150), Phaser.Math.Between(-180, 20));
      this.tweens.add({ targets: p, alpha: 0, scale: 0.2, duration: 280, onComplete: () => p.destroy() });
    }
  }

  showToast(message) {
    if (!this.toastText) return;
    this.toastText.setText(message).setAlpha(1);
    this.tweens.killTweensOf(this.toastText);
    this.tweens.add({ targets: this.toastText, alpha: 0, delay: 1400, duration: 350 });
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
    this.time.delayedCall(300, () => this.scene.start('Over'));
  }

  formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const minutes = Math.floor(total / 60); const seconds = total % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  cleanupWorld() {
    const left = this.cameras.main.scrollX - 1200;
    this.platformGroup.getChildren().forEach(p => { if (p.active && p.x < left) p.destroy(); });
    this.coinGroup.getChildren().forEach(c => { if (c.active && c.x < left) c.destroy(); });
    this.enemyGroup.getChildren().forEach(e => { if (e.active && e.x < left) e.disableBody(true, true); });
  }

  update(time) {
    if (this.dead || !this.player) return;
    this.player.update(time);
    this.enemyGroup.getChildren().forEach(enemy => { if (enemy.active) enemy.update(time, this.player); });
    this.bossGroup.getChildren().forEach(boss => { if (boss.active) boss.update(time, this.player); });

    if (this.player.x > this.generatedTo - 2200) this.generatePlatforms(this.generatedTo, this.generatedTo + (this.lowPower ? 6500 : 8000));
    this.scoreDistance = Math.max(this.scoreDistance, this.player.x - 180);
    this.checkpoint();

    const milestone = Math.floor(this.scoreDistance / 20000);
    if (milestone > this.lastMilestone && milestone <= 4) {
      this.lastMilestone = milestone;
      this.spawnBoss(this.scoreDistance + 900, 350, milestone - 1);
      this.showToast(`WORLD ${milestone + 1}: ${this.biomeName(milestone)}`);
    }

    const biome = this.biomeForX(this.scoreDistance);
    this.cameras.main.setBackgroundColor(this.biomeColor(biome));
    this.bg.setFillStyle(this.biomeColor(biome));
    this.bg.setSize(this.scale.width, this.scale.height);
    this.bg2.setSize(this.scale.width, this.scale.height * 0.38);
    this.bg2.y = this.scale.height * 0.62;
    this.updateHud();

    if (time - this.lastCleanup > 1200) {
      this.lastCleanup = time;
      this.cleanupWorld();
    }
  }
}