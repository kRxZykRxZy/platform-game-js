const CrazyGames = {
  ready: false,
  initPromise: null,

  async init() {
    if (this.ready) return true;
    if (!window.CrazyGames || !window.CrazyGames.SDK) return false;
    if (!this.initPromise) {
      this.initPromise = window.CrazyGames.SDK.init()
        .then(() => { this.ready = true; return true; })
        .catch(() => false);
    }
    return this.initPromise;
  },

  gameplayStart() {
    if (this.ready) {
      try { window.CrazyGames.SDK.game.gameplayStart(); } catch (e) { /* local/non-CrazyGames host */ }
    }
  },

  gameplayStop() {
    if (this.ready) {
      try { window.CrazyGames.SDK.game.gameplayStop(); } catch (e) { /* local/non-CrazyGames host */ }
    }
  },

  requestAd(type, onReward) {
    if (!this.ready || !window.CrazyGames.SDK.ad) return false;
    let rewarded = false;
    try {
      window.CrazyGames.SDK.ad.requestAd(type, {
        adStarted: () => {
          this.gameplayStop();
          if (window.game && window.game.sound) window.game.sound.mute = true;
        },
        adError: () => {
          if (window.game && window.game.sound) window.game.sound.mute = false;
          this.gameplayStart();
        },
        adFinished: () => {
          if (window.game && window.game.sound) window.game.sound.mute = false;
          this.gameplayStart();
          if (type === 'rewarded' && !rewarded) {
            rewarded = true;
            if (onReward) onReward();
          }
        },
      });
      return true;
    } catch (e) {
      if (window.game && window.game.sound) window.game.sound.mute = false;
      this.gameplayStart();
      return false;
    }
  },
};

export default CrazyGames;
