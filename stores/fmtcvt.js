import {types as t, flow, getParent} from 'mobx-state-tree';
import { processFFmpegFile } from '../utils/common';

const FmtcvtStore = t
  .model({
    fileName: t.optional(t.string, ''),
    progress: t.optional(t.number, 0),
    fmt: t.optional(t.string, 'mp3'),
    bitrate: t.optional(t.string, '128'),
    samplerate: t.optional(t.string, '44.1'),
    channel: t.optional(t.string, '2')
  })
  .views(self => ({
    get root() {
      return getParent(self)
    },

    get fmtList() {
      return ['mp3', 'aac', 'm4a', 'wma', 'wav'];
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

    get defaultBitrate() {
      switch (self.fmt) {
        case 'mp3':
          return self.mp3DefaultBitrate;
        case 'aac':
          return self.aacDefaultBitrate;
        case 'm4a':
          return self.aacDefaultBitrate;
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
      self.samplerate = value;
    },

    changeBitrate(value) {
      self.bitrate = value;
    },

    setProgress(progress) {
      self.progress = progress;
    },

    openFile(file) {
      return processFFmpegFile(self, file, "../static/ffmpegaudio.worker.js", ["-c:a", "libfdk_aac", "-profile:a", "aac_he_v2", "-b:a", "24k"], "fmtcvt-", "adts");
    },

  }));

export default FmtcvtStore;

