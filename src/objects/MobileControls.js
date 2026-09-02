import 'phaser';

export default class MobileControls {
  constructor(scene) {
    this.scene = scene;
    this.state = { left: false, right: false, jump: false, attack: false, dash: false };
    this.buttons = [];
    this.enabled = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || scene.scale.width < 700;
    if (this.enabled) this.create();
  }

  createButton(x, y, label, key, size = 64) {
    const button = this.scene.add.circle(x, y, size / 2, 0x111827, 0.68)
      .setScrollFactor(0).setDepth(200).setInteractive();
    const text = this.scene.add.text(x, y, label, { fontSize: `${Math.max(18, size * 0.32)}px`, color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5).setScrollFactor(0).setDepth(201);
    const press = () => { this.state[key] = true; button.setAlpha(0.95); };
    const release = () => { this.state[key] = false; button.setAlpha(0.68); };
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointercancel', release);
    this.buttons.push(button, text);
  }

  create() {
    const h = this.scene.scale.height;
    const w = this.scene.scale.width;
    this.createButton(72, h - 78, '◀', 'left', 68);
    this.createButton(152, h - 78, '▶', 'right', 68);
    this.createButton(w - 170, h - 88, 'JUMP', 'jump', 78);
    this.createButton(w - 78, h - 145, 'ATK', 'attack', 64);
    this.createButton(w - 78, h - 65, 'DASH', 'dash', 64);
  }

  consume(key) {
    const value = this.state[key];
    this.state[key] = false;
    return value;
  }

  destroy() {
    this.buttons.forEach(item => item.destroy());
    this.buttons = [];
  }
}
