import 'phaser';

export default class MobileControls {
  constructor(scene) {
    this.scene = scene;
    this.state = { left: false, right: false, jump: false, attack: false, dash: false };
    this.buttons = [];
    this.refs = {};
    this.enabled = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || scene.scale.width < 700;
    if (this.enabled) {
      this.create();
      this.scene.scale.on('resize', this.resize, this);
    }
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
    this.refs[key] = { button, text, size };
  }

  create() {
    const h = this.scene.scale.height;
    const w = this.scene.scale.width;
    this.createButton(72, h - 72, '◀', 'left', 64);
    this.createButton(148, h - 72, '▶', 'right', 64);
    this.createButton(w - 165, h - 82, 'JUMP', 'jump', 72);
    this.createButton(w - 76, h - 138, 'ATK', 'attack', 60);
    this.createButton(w - 76, h - 64, 'DASH', 'dash', 60);
  }

  resize(gameSize) {
    if (!this.enabled) return;
    const w = gameSize.width;
    const h = gameSize.height;
    const bottom = Math.max(58, Math.min(86, h * 0.14));
    const leftY = h - bottom;
    const positions = {
      left: [72, leftY],
      right: [148, leftY],
      jump: [w - 165, h - bottom - 10],
      attack: [w - 76, h - bottom - 66],
      dash: [w - 76, h - bottom + 8],
    };
    Object.keys(positions).forEach(key => {
      const ref = this.refs[key];
      if (!ref) return;
      const [x, y] = positions[key];
      ref.button.setPosition(x, y);
      ref.text.setPosition(x, y);
    });
  }

  consume(key) {
    const value = this.state[key];
    this.state[key] = false;
    return value;
  }

  destroy() {
    if (this.enabled) this.scene.scale.off('resize', this.resize, this);
    this.buttons.forEach(item => item.destroy());
    this.buttons = [];
    this.refs = {};
  }
}
