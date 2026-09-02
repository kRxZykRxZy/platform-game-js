export default class Model {
  constructor() {
    this.sound = true;
    this.music = true;
    this.bgMusicPl = false;
    this.sc = '00:00';
    this.userNa = 'no name';
    this.leader = false;
    this.coins = Number(localStorage.getItem('coins') || 0);
    this.bestDistance = Number(localStorage.getItem('bestDistance') || 0);
    this.upgrades = JSON.parse(localStorage.getItem('upgrades') || '{"health":0,"speed":0,"damage":0,"dash":0}');
    localStorage.setItem('userName', 'no name');
  }

  set musicOn(value) { this.music = value; }
  get musicOn() { return this.music; }
  set soundOn(value) { this.sound = value; }
  get soundOn() { return this.sound; }
  set bgMusicPlaying(value) { this.bgMusicPl = value; }
  get bgMusicPlaying() { return this.bgMusicPl; }
  set score(value) { this.sc = value; localStorage.setItem('score', value); }
  get score() { return this.sc; }
  set userName(value) { this.userNa = value; localStorage.setItem('userName', value); }
  get userName() { return this.userNa; }
  set leaderboard(value) { this.leader = value; }
  get leaderboard() { return this.leader; }

  saveProgress() {
    localStorage.setItem('coins', String(this.coins));
    localStorage.setItem('bestDistance', String(this.bestDistance));
    localStorage.setItem('upgrades', JSON.stringify(this.upgrades));
  }

  upgradeCost(type) {
    const level = this.upgrades[type] || 0;
    return 100 + level * 150;
  }

  buyUpgrade(type) {
    const cost = this.upgradeCost(type);
    if (this.coins < cost) return false;
    this.coins -= cost;
    this.upgrades[type] = (this.upgrades[type] || 0) + 1;
    this.saveProgress();
    return true;
  }
}
