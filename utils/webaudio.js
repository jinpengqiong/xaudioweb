
class WebAudio {
  audioContext = null;

  supportsWebAudio() {
    return !!(window.AudioContext || window.webkitAudioContext);
  }


  getAudioContext() {
    if (!window.WaveSurferAudioContext) {
      window.WaveSurferAudioContext = new (window.AudioContext ||
                                           window.webkitAudioContext)();
    }
    return window.WaveSurferAudioContext;
  }


  constructor(params) {
    //super();
    this.params = params;
    this.ac = (this.supportsWebAudio() ? this.getAudioContext() : {});
    this.lastPlay = this.ac.currentTime;
    this.startPosition = 0;
    this.scheduledPause = null;
    this.analyser = null;
    this.buffer = null;
    this.filters = [];
    this.gainNode = null;
    this.mergedPeaks = null;
    this.offlineAc = null;
    this.peaks = null;
    this.playbackRate = 1;
    this.analyser = null;
    this.scriptNode = null;
    this.source = null;
    this.splitPeaks = [];
    this.state = null;
  }



}


export default WebAudio;

