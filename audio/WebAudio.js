import * as utils from '../utils';
import { downFile } from '../utils/common';
import audioBufferToWav from './tools/audiobuffer2wav';

const PLAYING = 'playing';
const PAUSED = 'paused';
const FINISHED = 'finished';

export default class WebAudio extends utils.Observer {
  static scriptBufferSize = 256;
  audioContext = null;
  offlineAudioContext = null;
  stateBehaviors = {
    [PLAYING]: {
      init() {
        this.addOnAudioProcess();
      },
      getPlayedPercents() {
        const duration = this.getDuration();
        return this.getCurrentTime() / duration || 0;
      },
      getCurrentTime() {
        return this.startPosition + this.getPlayedTime();
      }
    },
    [PAUSED]: {
      init() {
        this.removeOnAudioProcess();
      },
      getPlayedPercents() {
        const duration = this.getDuration();
        return this.getCurrentTime() / duration || 0;
      },
      getCurrentTime() {
        return this.startPosition;
      }
    },
    [FINISHED]: {
      init() {
        this.removeOnAudioProcess();
        this.fireEvent('finish');
      },
      getPlayedPercents() {
        return 1;
      },
      getCurrentTime() {
        return this.getDuration();
      }
    }
  };

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

  getOfflineAudioContext(sampleRate) {
    if (!window.WaveSurferOfflineAudioContext) {
      window.WaveSurferOfflineAudioContext = new (window.OfflineAudioContext ||
                                                  window.webkitOfflineAudioContext)(1, 2, sampleRate);
    }
    return window.WaveSurferOfflineAudioContext;
  }

  constructor(params) {
    super();
    this.params = params;
    this.ac =
      params.audioContext ||
      (this.supportsWebAudio() ? this.getAudioContext() : {});
    this.offlineAc = null;
    this.lastPlay = this.ac.currentTime;
    this.startPosition = 0;
    this.scheduledPause = null;
    this.states = {
      [PLAYING]: Object.create(this.stateBehaviors[PLAYING]),
      [PAUSED]: Object.create(this.stateBehaviors[PAUSED]),
      [FINISHED]: Object.create(this.stateBehaviors[FINISHED])
    };
    this.analyser = null;
    this.buffer = null;
    this.renderBuffer = null;
    this.editActions = [];
    this.filters = [];
    this.gainNode = null;
    this.gainProcessNode = null;
    this.mergedPeaks = null;
    this.offlineAc = null;
    this.peaks = null;
    this.playbackRate = 1;
    this.analyser = null;
    this.scriptNode = null;
    this.source = null;
    this.splitPeaks = [];
    this.state = null;
    this.explicitDuration = params.duration;
  }

  init() {
    this.createScriptNode();
    this.createVolumeNode();
    this.createAnalyserNode();

    this.setState(PAUSED);
    this.setPlaybackRate(this.params.audioRate);
    this.setLength(0);
  }

  disconnectFilters() {
    if (this.filters) {
      this.filters.forEach(filter => {
        filter && filter.disconnect();
      });
      this.filters = null;
      // Reconnect direct path
      this.analyser.connect(this.gainNode);
    }
  }

  setState(state) {
    if (this.state !== this.states[state]) {
      this.state = this.states[state];
      this.state.init.call(this);
    }
  }

  setFilter(...filters) {
    this.setFilters(filters);
  }

  setFilters(filters) {
    // Remove existing filters
    this.disconnectFilters();

    // Insert filters if filter array not empty
    if (filters && filters.length) {
      this.filters = filters;

      // Disconnect direct path before inserting filters
      this.analyser.disconnect();

      // Connect each filter in turn
      filters
      .reduce((prev, curr) => {
        prev.connect(curr);
        return curr;
      }, this.analyser)
      .connect(this.gainNode);
    }
  }

  //for play and show time line, after gain node, link to destination
  createScriptNode() {
    if (this.params.audioScriptProcessor) {
      this.scriptNode = this.params.audioScriptProcessor;
    } else {
      if (this.ac.createScriptProcessor) {
        this.scriptNode = this.ac.createScriptProcessor(
          WebAudio.scriptBufferSize
        );
      } else {
        this.scriptNode = this.ac.createJavaScriptNode(
          WebAudio.scriptBufferSize
        );
      }
    }
    this.scriptNode.connect(this.ac.destination);
  }

  addOnAudioProcess() {
    this.scriptNode.onaudioprocess = () => {
      const time = this.getCurrentTime();

      if (time >= this.getDuration()) {
        this.setState(FINISHED);
        this.fireEvent('pause');
      } else if (time >= this.scheduledPause) {
        this.pause();
      } else if (this.state === this.states[PLAYING]) {
        this.fireEvent('audioprocess', time);
      }
    };
  }

  removeOnAudioProcess() {
    if (this.scriptNode)
      this.scriptNode.onaudioprocess = () => {};
  }

  //for play and volume controle 
  createVolumeNode() {
    // Create gain node using the AudioContext
    if (this.ac.createGain) {
      this.gainNode = this.ac.createGain();
    } else {
      this.gainNode = this.ac.createGainNode();
    }
    // Add the gain node to the graph
    this.gainNode.connect(this.ac.destination);
  }

  //for play and show
  createAnalyserNode() {
    this.analyser = this.ac.createAnalyser();
    this.analyser.connect(this.gainNode);
  }


  //for offline process gain and audio buffer gain preprocess
  createGainProcessNode() {
    if (this.offlineAc.createGain) {
      this.gainProcessNode = this.offlineAc.createGain();
    } else {
      this.gainProcessNode = this.offlineAc.createGainNode();
    }
    // Add the gain node to the graph
    this.gainProcessNode.connect(this.offlineAc.destination);
  }

  setSinkId(deviceId) {
    if (deviceId) {
      /**
       * The webaudio API doesn't currently support setting the device
       * output. Here we create an HTMLAudioElement, connect the
       * webaudio stream to that element and setSinkId there.
       */
      let audio = new window.Audio();
      if (!audio.setSinkId) {
        return Promise.reject(
          new Error('setSinkId is not supported in your browser')
        );
      }
      audio.autoplay = true;
      var dest = this.ac.createMediaStreamDestination();
      this.gainNode.disconnect();
      this.gainNode.connect(dest);
      audio.srcObject = dest.stream;

      return audio.setSinkId(deviceId);
    } else {
      return Promise.reject(new Error('Invalid deviceId: ' + deviceId));
    }
  }

  setVolume(value) {
    this.gainNode.gain.setValueAtTime(value, this.ac.currentTime);
  }

  getVolume() {
    return this.gainNode.gain.value;
  }

  decodeArrayBuffer(arraybuffer, callback, errback) {
    //if (!this.offlineAc) {
      //this.offlineAc = this.getOfflineAudioContext(
        //this.ac && this.ac.sampleRate ? this.ac.sampleRate : 44100
      //);
    //}
    //this.offlineAc.decodeAudioData(
    this.ac.decodeAudioData(
      arraybuffer,
      data => callback(data),
      errback
    );
  }

  setPeaks(peaks, duration) {
    if (duration != null) {
      this.explicitDuration = duration;
    }
    this.peaks = peaks;
  }

  getNumOfChannels() {
    //console.log("pppppppppppppppppppp", this.buffer);
    return this.buffer ? this.buffer.numberOfChannels : 1;
  }

  setLength(length) {
    // No resize, we can preserve the cached peaks.
    if (this.mergedPeaks && length == 2 * this.mergedPeaks.length - 1 + 2) {
      return;
    }

    this.splitPeaks = [];
    this.mergedPeaks = [];
    // Set the last element of the sparse array so the peak arrays are
    // appropriately sized for other calculations.
    const channels = this.renderBuffer ? this.buffer.numberOfChannels : 1;
    let c;
    for (c = 0; c < channels; c++) {
      this.splitPeaks[c] = [];
      this.splitPeaks[c][2 * (length - 1)] = 0;
      this.splitPeaks[c][2 * (length - 1) + 1] = 0;
    }
    this.mergedPeaks[2 * (length - 1)] = 0;
    this.mergedPeaks[2 * (length - 1) + 1] = 0;
  }

  getPeaks(length, first, last) {
    if (this.peaks) {
      return this.peaks;
    }
    if (!this.renderBuffer) {
      return [];
    }

    first = first || 0;
    last = last || length - 1;

    this.setLength(length);

    if (!this.renderBuffer) {
      return this.params.splitChannels
        ? this.splitPeaks
        : this.mergedPeaks;
    }

    if (!this.renderBuffer.length) {
      const newBuffer = this.createBuffer(1, 4096, this.sampleRate);
      this.renderBuffer = newBuffer.renderBuffer;
    }

    const sampleSize = this.renderBuffer.length / length;
    const sampleStep = ~~(sampleSize / 10) || 1;
    const channels = this.renderBuffer.numberOfChannels;
    let c;

    for (c = 0; c < channels; c++) {
      const peaks = this.splitPeaks[c];
      const chan = this.renderBuffer.getChannelData(c);
      let i;

      for (i = first; i <= last; i++) {
        const start = ~~(i * sampleSize);
        const end = ~~(start + sampleSize);
        let min = 0;
        let max = 0;
        let j;

        for (j = start; j < end; j += sampleStep) {
          const value = chan[j];

          if (value > max) {
            max = value;
          }

          if (value < min) {
            min = value;
          }
        }

        peaks[2 * i] = max;
        peaks[2 * i + 1] = min;

        if (c == 0 || max > this.mergedPeaks[2 * i]) {
          this.mergedPeaks[2 * i] = max;
        }

        if (c == 0 || min < this.mergedPeaks[2 * i + 1]) {
          this.mergedPeaks[2 * i + 1] = min;
        }
      }
    }

    return this.params.splitChannels ? this.splitPeaks : this.mergedPeaks;
  }

  getPlayedPercents() {
    return this.state.getPlayedPercents.call(this);
  }

  disconnectSource() {
    if (this.source) {
      this.source.disconnect();
    }
  }

  disconnectOfflineSource() {
    if (this.offlineSource) {
      this.offlineSource.disconnect();
    }
  }

  destroy() {
    if (!this.isPaused()) {
      this.pause();
    }
    this.unAll();
    this.buffer = null;
    this.renderBuffer = null;
    this.editActions = [];

    this.disconnectFilters();
    this.disconnectSource();
    this.scriptNode.disconnect();
    this.gainNode.disconnect();
    this.analyser.disconnect();

    this.disconnectOfflineSource();
    this.gainProcessNode.disconnect();

    // close the audioContext if closeAudioContext option is set to true
    if (this.params.closeAudioContext) {
      // check if browser supports AudioContext.close()
      if (
        typeof this.ac.close === 'function' &&
          this.ac.state != 'closed'
      ) {
        this.ac.close();
      }
      // clear the reference to the audiocontext
      this.ac = null;
      // clear the actual audiocontext, either passed as param or the
      // global singleton
      if (!this.params.audioContext) {
        window.WaveSurferAudioContext = null;
      } else {
        this.params.audioContext = null;
      }
      // clear the offlineAudioContext
      window.WaveSurferOfflineAudioContext = null;
    }
  }

  load(buffer) {
    this.startPosition = 0;
    this.lastPlay = this.ac.currentTime;
    this.buffer = buffer;
    return this.startRenderBuffer(buffer);
  }

  exportRenderBuffer() {
    console.log("11111111111111", this.renderBuffer);
    let wav = audioBufferToWav(this.renderBuffer);
    downFile(wav, "hehe.wav");
  }

  cutDelete(startTime, endTime) {
    let deltaT = 1. / this.renderBuffer.sampleRate;

    //startOffset and endOffset is the cut range
    let startOffset = parseInt(startTime / deltaT);
    let endOffset = parseInt(endTime / deltaT);

    console.log("@@@1: ", startOffset);
    console.log("@@@2", endOffset);

    let frameCount = this.renderBuffer.length - (endOffset - startOffset); 

    let newRenderBuffer = this.offlineAc.createBuffer(this.renderBuffer.numberOfChannels, 
                                                      frameCount, this.renderBuffer.sampleRate);
    let delBuffer = this.offlineAc.createBuffer(this.renderBuffer.numberOfChannels,
                                                endOffset - startOffset, this.renderBuffer.sampleRate);
    for (let i = 0; i < this.renderBuffer.numberOfChannels; i++) {

      let oldRenderBufferData = this.renderBuffer.getChannelData(i);
      let newRenderBufferData = newRenderBuffer.getChannelData(i);
      let delBufferData = delBuffer.getChannelData(i);

      //[0, startTime) first splite range
      for (let j = 0; j < startOffset; j++) {
        newRenderBufferData[j] = oldRenderBufferData[j]; 
      }

      //[startTime, endTime) delete range
      for (let j = startOffset, k = 0; j < endOffset; j++, k++) {
        delBufferData[k] = oldRenderBufferData[j];
      }

      //[endTime, length-1] second splite range
      for (let j = endOffset, k = 0; j < this.renderBuffer.length; j++, k++) {
        newRenderBufferData[startOffset+k] = oldRenderBufferData[j]; 
      }
    }

    this.editActions.push({
      cmd: "cutDelete",
      data: {
        start: startOffset,
        end: endOffset,
        buffer: delBuffer
      }
    })

    return this.startRenderBuffer(newRenderBuffer);
  }

  recoverAction() {
    let action = this.editActions.pop();

    if (action) {
      if (action.cmd == "cutDelete") {
        return this.recoverDeleteRange(action.data.start, action.data.end, action.data.buffer);
      } 
    }
  }



  recoverDeleteRange(startOffset, endOffset, delBuffer) {
    let frameCount = this.renderBuffer.length + (endOffset - startOffset); 

    let newRenderBuffer = this.offlineAc.createBuffer(this.renderBuffer.numberOfChannels, 
                                                      frameCount, this.renderBuffer.sampleRate);

    for (let i = 0; i < this.renderBuffer.numberOfChannels; i++) {

      let oldRenderBufferData = this.renderBuffer.getChannelData(i);
      let newRenderBufferData = newRenderBuffer.getChannelData(i);
      let delBufferData = delBuffer.getChannelData(i);

      //[0, startTime) first splite range
      for (let j = 0; j < startOffset; j++) {
        newRenderBufferData[j] = oldRenderBufferData[j]; 
      }

      //[startTime, endTime) delete range
      for (let j = startOffset, k=0; j < endOffset; j++, k++) {
        newRenderBufferData[j] = delBufferData[k];
      }

      //[endTime, frameCount-1] second splite range
      for (let j = endOffset, k = 0; j < frameCount; j++, k++) {
        newRenderBufferData[j] = oldRenderBufferData[startOffset+k]; 
      }
    }
    
    return this.startRenderBuffer(newRenderBuffer);
  }


  startRenderBuffer(buffer) {
    this.disconnectOfflineSource();

    //create offline audio context graph, gain node, scripte node, analyser node
    this.offlineAc = new window.OfflineAudioContext(buffer.numberOfChannels, 
                                                    buffer.sampleRate*(parseInt(buffer.duration)+1), 
                                                    buffer.sampleRate);

    this.createGainProcessNode();

    //crate offline source and connect to the gain process node
    this.offlineSource = this.offlineAc.createBufferSource();
    this.offlineSource.buffer = buffer;
    this.offlineSource.connect(this.gainProcessNode);

    //this.gainProcessNode.gain.setValueAtTime(0.3, this.offlineAc.currentTime);
    //this.gainProcessNode.gain.setValueAtTime(3, 30);
    //this.gainProcessNode.gain.setValueAtTime(1, 36);
    this.offlineSource.start();

    let self = this;

    return this.offlineAc.startRendering()
    .then(function(renderBuffer) {
      self.renderBuffer = renderBuffer;
      self.createPlaySource();
      return renderBuffer;
    });

  }

  createPlaySource() {
    this.disconnectSource();

    this.source = this.ac.createBufferSource();

    this.source.start = this.source.start || this.source.noteGrainOn;
    this.source.stop = this.source.stop || this.source.noteOff;

    this.source.playbackRate.setValueAtTime(
      this.playbackRate,
      this.ac.currentTime
    );
    this.source.buffer = this.renderBuffer;
    //this.source.connect(this.ac.destination);
    this.source.connect(this.analyser);
  }

  isPaused() {
    return this.state !== this.states[PLAYING];
  }

  getDuration() {
    if (this.explicitDuration) {
      return this.explicitDuration;
    }
    if (!this.renderBuffer) {
      return 0;
    }
    return this.renderBuffer.duration;
  }

  seekTo(start, end) {
    if (!this.renderBuffer) {
      return;
    }

    this.scheduledPause = null;

    if (start == null) {
      start = this.getCurrentTime();
      if (start >= this.getDuration()) {
        start = 0;
      }
    }
    if (end == null) {
      end = this.getDuration();
    }

    this.startPosition = start;
    this.lastPlay = this.ac.currentTime;

    if (this.state === this.states[FINISHED]) {
      this.setState(PAUSED);
    }

    return {
      start: start,
      end: end
    };
  }

  getPlayedTime() {
    return (this.ac.currentTime - this.lastPlay) * this.playbackRate;
  }

  play(start, end) {
    if (!this.renderBuffer) {
      return;
    }

    // need to re-create source on each playback
    this.createPlaySource();

    const adjustedTime = this.seekTo(start, end);

    start = adjustedTime.start;
    end = adjustedTime.end;

    this.scheduledPause = end;

    this.source.start(0, start, end - start);

    if (this.ac.state == 'suspended') {
      this.ac.resume && this.ac.resume();
    }

    this.setState(PLAYING);

    this.fireEvent('play');
  }

  pause() {
    this.scheduledPause = null;

    this.startPosition += this.getPlayedTime();
    this.source && this.source.stop(0);

    this.setState(PAUSED);

    this.fireEvent('pause');
  }

  getCurrentTime() {
    return this.state.getCurrentTime.call(this);
  }

  getPlaybackRate() {
    return this.playbackRate;
  }

  setPlaybackRate(value) {
    value = value || 1;
    if (this.isPaused()) {
      this.playbackRate = value;
    } else {
      this.pause();
      this.playbackRate = value;
      this.play();
    }
  }
}



