import 'phaser';
import CrazyGames from '../modules/CrazyGames';

export default class GameOverScene extends Phaser.Scene {
  constructor() { super('Over'); }

  create() {
    this.model = this.sys.game.globals.model;
    CrazyGames.gameplayStop();
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(0, 0, w, h, 0x0b1020).setOrigin(0);
    this.add.text(w / 2, 70, 'RUN OVER', { fontSize: '48px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(w / 2, 135, `Survived ${this.model.score}`, { fontSize: '24px', color: '#cbd5e1' }).setOrigin(0.5);
    this.add.text(w / 2, 175, `Best distance: ${Math.floor(this.model.bestDistance / 10)}m`, { fontSize: '18px', color: '#93c5fd' }).setOrigin(0.5);

    this.makeButton(w / 2, 270, '▶ CONTINUE FROM CHECKPOINT', () => this.restart(), 0x2563eb, 310);
    this.makeButton(w / 2, 340, '🎬 WATCH AD • REVIVE', () => this.revive(), 0x16a34a, 310);
    this.makeButton(w / 2, 410, '🎬 WATCH AD • BONUS 2× COINS', () => this.doubleCoins(), 0x7c3aed, 310);
    this.makeButton(w / 2, 480, 'UPGRADE LAB', () => this.scene.start('Upgrades'), 0x475569, 220);
    this.makeButton(w / 2, 545, 'MAIN MENU', () => this.scene.start('Title'), 0x334155, 220);
    this.add.text(w / 2, h - 28, 'Ads are optional. You can always continue without watching.', { fontSize: '13px', color: '#94a3b8' }).setOrigin(0.5);
  }

  makeButton(x, y, label, callback, color, width) {
    const bg = this.add.rectangle(x, y, width, 54, color, 1).setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontSize: '17px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    bg.on('pointerdown', callback);
    bg.on('pointerover', () => bg.setAlpha(0.82));
    bg.on('pointerout', () => bg.setAlpha(1));
    return bg;
  }

  restart() {
    this.scene.start('Game');
    CrazyGames.gameplayStart();
  }

  revive() {
    this.lockButtons();
    const requested = CrazyGames.requestAd('rewarded', () => {
      this.model.resumeX = Math.max(0, this.model.resumeX || 0);
      this.restart();
    });
    if (!requested) this.unlockButtons();
  }

  doubleCoins() {
    this.lockButtons();
    const requested = CrazyGames.requestAd('rewarded', () => {
      this.model.coins += 250;
      this.model.saveProgress();
      this.add.text(this.scale.width / 2, 225, '+250 COINS!', { fontSize: '24px', color: '#ffd166', fontStyle: 'bold' }).setOrigin(0.5);
      this.unlockButtons();
    });
    if (!requested) this.unlockButtons();
  }

  lockButtons() {
    this.input.enabled = false;
    this.add.text(this.scale.width / 2, 225, 'Loading ad…', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
  }

  unlockButtons() {
    this.input.enabled = true;
  }
}
