import 'phaser';

const mobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

export default {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  dom: { createContainer: true },
  backgroundColor: '#0b1020',
  render: {
    antialias: false,
    pixelArt: false,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
  fps: {
    target: mobile ? 45 : 60,
    forceSetTimeOut: mobile,
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 1000 },
    },
  },
};