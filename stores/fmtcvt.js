import {types as t, flow, getParent} from 'mobx-state-tree';
import { processFFmpegFile } from '../utils/common';

const FmtcvtStore = t
  .model({
    fileName: t.optional(t.string, ''),
    progress: t.optional(t.number, 0),
    fmt: t.optional(t.string, 'mp3'),
    bitrate: t.optional(t.string, '128'),
    samplerate: t.optional(t.string, '44.1'),
    channel: t.optional(t.string, '2'),

    errCvt: t.optional(t.boolean, false),
    errInfo: t.optional(t.string, ''),
  })
  .views(self => ({
    get root() {
      return getParent(self)
    },

    get fmtList() {
      return ['mp3', 'aac', 'm4a', 'ogg(opus)', 'wma', 'wav'];
    },

    get defaultFmt() {
      return 'mp3';
    },

    get samplerateList() {
      return ['16', '32', '44.1', '48'];
    },

    get mp3BitrateList() {
      return ['32', '64', '96', '112', '128', '160', '192', '256', '320'];
    },

    get mp3DefaultBitrate() {
      return '128';
    },

    get aacBitrateList() {
      return ['24', '32', '48', '64', '96', '112', '128', '160', '192', '256', '320'];
    },

    get aacDefaultBitrate() {
      return '48';
    },

    get oggopusBitrateList() {
      return ['24', '32', '48', '64', '96', '112', '128', '160', '192', '256', '320', '510'];
    },

    get oggopusDefaultBitrate() {
      return '64';
    },

    get wmaBitrateList() {
      return ['32', '64', '96', '112', '128', '160', '192'];
    },

    get wmaDefaultBitrate() {
      return '128';
    },

    get defaultBitrate() {
      switch (self.fmt) {
        case 'mp3':
          return self.mp3DefaultBitrate;
        case 'aac':
          return self.aacDefaultBitrate;
        case 'm4a':
          return self.aacDefaultBitrate;
        case 'wma':
          return self.wmaDefaultBitrate;
        case 'ogg(opus)':
          return self.oggopusDefaultBitrate;
      }
    },

  }))
  .actions(self => ({
    updateAttrs(e) {
      self[e.target.name] = e.target.value; 
    },

    changeFmt(value) {
      self.fmt = value;
      self.bitrate = self.defaultBitrate;
    },

    changeSamplerate(value) {
      console.log('2222222222222222', value);
      self.samplerate = value;
    },

    changeChannel(value) {
      self.channel = value;
    },

    changeBitrate(value) {
      self.bitrate = value;
    },

    setProgress(progress) {
      self.progress = progress;
    },

    setError(errInfo) {
      self.errCvt = true;
      self.errInfo = errInfo;
    },

    resetErr() {
      self.errCvt = false;
      self.errInfo = '';
    },

    openFile(file) {
      self.resetErr();
      return processFFmpegFile(self, file, "../static/ffmpegaudio.worker.js", 
                               toFFmpegArgs(self.fmt, self.samplerate, self.channel, self.bitrate), 
                               "fmtcvt-", 
                               self.fmt,
                               toFFmpegFmtName(self.fmt),
                               toFFmpegFmtCvt(self.fmt));
    },

  }));

const samplerateString = (samplerate) => {
  let sr = parseInt(parseFloat(samplerate)*1000)
  return sr.toString();
}

const toFFmpegArgs = (fmt, samplerate, channel, bitrate) => {
  if (fmt == 'mp3') {
    return ["-c:a", "libmp3lame", "-ar", samplerateString(samplerate), "-ac", channel, "-b:a", bitrate+"000"];
  } else if (fmt == 'aac' || fmt == 'm4a') {
    let bitrateInt = parseInt(bitrate);
    let channelInt = parseInt(channel);

    let bitratePerChn = parseInt(bitrateInt / channelInt);

    if (bitratePerChn <= 24) {
      //user aac_he_v2
      return ["-c:a", "libfdk_aac", "-ar", samplerateString(samplerate), "-ac", channel, "-profile:a", "aac_he_v2", "-b:a", bitrate+"k"]
    } else if(bitratePerChn <= 56) {
      //user aac_he
      return ["-c:a", "libfdk_aac", "-ar", samplerateString(samplerate), "-ac", channel, "-profile:a", "aac_he", "-b:a", bitrate+"k"]
    } else {
      //user aac_low
      return ["-c:a", "libfdk_aac", "-ar", samplerateString(samplerate), "-ac", channel, "-profile:a", "aac_low", "-b:a", bitrate+"k"]
    }
  } else if (fmt == 'ogg(opus)') {
      return ["-c:a", "libopus", "-ar", samplerateString(samplerate), "-ac", channel, "-ab", bitrate+"k"]
  } else if (fmt == 'wma') {
      return ["-ar", samplerateString(samplerate), "-ac", channel, "-ab", bitrate+"k"]
  } else if (fmt == 'wav') {
      return ["-ar", samplerateString(samplerate), "-ac", channel]
  }
}


const toFFmpegFmtName = (fmt) => {
  if (fmt == 'ogg(opus)') {
    return 'ogg';
  } else {
    return fmt;
  }
}

const toFFmpegFmtCvt = (fmt) => {
  if (fmt == 'aac') {
    return 'adts';
  } else if (fmt == 'ogg(opus)') {
    return 'ogg';
  }
}


export default FmtcvtStore;

