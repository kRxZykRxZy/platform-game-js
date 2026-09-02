import 'phaser';
import CrazyGames from '../modules/CrazyGames';

export default class UpgradeScene extends Phaser.Scene {
  constructor() { super('Upgrades'); }

  create() {
    this.model = this.sys.game.globals.model;
    CrazyGames.gameplayStop();
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(0, 0, w, h, 0x101827).setOrigin(0);
    this.add.text(w / 2, 55, 'UPGRADE LAB', { fontSize: '38px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.coinText = this.add.text(w / 2, 105, '', { fontSize: '22px', color: '#ffd166' }).setOrigin(0.5);
    const types = [
      ['health', 'MAX HEALTH', 'More health every run'],
      ['speed', 'RUN SPEED', 'Move faster'],
      ['damage', 'ATTACK DAMAGE', 'Hit enemies harder'],
      ['dash', 'DASH POWER', 'Faster dash + shorter cooldown'],
    ];
    types.forEach((item, i) => this.makeUpgrade(item[0], item[1], item[2], 180 + i * 88));
    this.makeButton(w / 2, h - 65, 'BACK TO GAME', () => {
      this.scene.start('Game');
      CrazyGames.gameplayStart();
    }, 0x2563eb, 220, 54);
    this.refresh();
  }

  makeUpgrade(type, title, desc, y) {
    const w = this.scale.width;
    this.add.rectangle(w / 2, y, Math.min(620, w - 30), 72, 0x1f2937, 0.95).setOrigin(0.5);
    this.add.text(35, y - 23, title, { fontSize: '20px', color: '#fff', fontStyle: 'bold' });
    this.add.text(35, y + 4, desc, { fontSize: '14px', color: '#cbd5e1' });
    const button = this.makeButton(w - 100, y, 'BUY', () => {
      if (this.model.buyUpgrade(type)) this.refresh();
      else this.flash('Not enough coins');
    }, 0x16a34a, 100, 48);
    button.setData('type', type);
  }

  makeButton(x, y, label, callback, color, width, height) {
    const bg = this.add.rectangle(x, y, width, height, color, 1).setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, { fontSize: '17px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    bg.on('pointerdown', callback);
    bg.on('pointerover', () => bg.setAlpha(0.8));
    bg.on('pointerout', () => bg.setAlpha(1));
    return bg;
  }

  refresh() {
    this.coinText.setText(`Coins: ${this.model.coins}`);
    this.children.list.filter(x => x.getData && x.getData('type')).forEach(button => {
      const type = button.getData('type');
      const cost = this.model.upgradeCost(type);
      const level = this.model.upgrades[type] || 0;
      button.setFillStyle(this.model.coins >= cost ? 0x16a34a : 0x475569);
      const text = this.children.list.find(x => x.type === 'Text' && x.text === 'BUY' && Math.abs(x.x - button.x) < 2 && Math.abs(x.y - button.y) < 2);
      if (text) text.setText(`BUY ${cost}`);
      const levelText = this.add.text(button.x - 160, button.y, `Lv ${level}`, { fontSize: '16px', color: '#93c5fd' }).setOrigin(0.5);
      this.time.delayedCall(0, () => levelText.setDepth(2));
    });
  }

  flash(message) {
    const t = this.add.text(this.scale.width / 2, 140, message, { fontSize: '20px', color: '#fca5a5', backgroundColor: '#111827', padding: 8 }).setOrigin(0.5);
    this.tweens.add({ targets: t, alpha: 0, y: 115, duration: 900, onComplete: () => t.destroy() });
  }
}
