import 'phaser';
import buttonTwo from '../assets/ui/blue_button02.png';
import buttonThree from '../assets/ui/blue_button03.png';
import checkedBox from '../assets/ui/blue_boxCheckmark.png';
import box from '../assets/ui/grey_box.png';
import rock from '../assets/rock.png';
import dude from '../assets/player-design/player.png';

export default class PreloaderScene extends Phaser.Scene {
  constructor() {
    super('Preloader');
  }

  preload() {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    const width = this.scale.width;
    const height = this.scale.height;
    const barWidth = Math.min(320, width - 40);
    const barX = (width - barWidth) / 2;
    const barY = height / 2 - 25;

    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(barX, barY, barWidth, 50);
    const loadingText = this.add.text(width / 2, barY - 35, 'Loading...', { fontSize: '20px', color: '#fff' }).setOrigin(0.5);
    const percentText = this.add.text(width / 2, barY + 25, '0%', { fontSize: '18px', color: '#fff' }).setOrigin(0.5);

    this.load.on('progress', value => {
      percentText.setText(`${Math.floor(value * 100)}%`);
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(barX + 10, barY + 10, (barWidth - 20) * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      this.scene.start('Game');
    });

    this.load.image('blueButton1', buttonTwo);
    this.load.image('blueButton2', buttonThree);
    this.load.image('box', box);
    this.load.image('checkedBox', checkedBox);
    this.load.image('rock', rock);
    this.load.spritesheet('dude', dude, { frameWidth: 46, frameHeight: 50 });
  }

  create() {}
}