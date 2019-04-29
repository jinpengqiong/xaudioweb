import {types as t, flow, getParent} from 'mobx-state-tree';
import { processAudioFile } from '../utils/common';
import {message} from 'antd';

const DenoiseStore = t
  .model({
    mode: t.optional(t.string, 'fft_lms_lpf'),
    gain: t.optional(t.string, "1.0"),
    lpfFc: t.optional(t.string, "0.6"),
    fileName: t.optional(t.string, ''),
    progress: t.optional(t.number, 0),


    isLoading: t.optional(t.boolean, false),
    isProcessing: t.optional(t.boolean, false),
  })
  .views(self => ({
    get root() {
      return getParent(self)
    },

  }))
  .actions(self => ({
    updateAttrs(e) {
      self[e.target.name] = e.target.value; 
    },

    onChangeMode(e) {
      self.mode = e.target.value;
    },

    setLoading(value) {
      self.isLoading = value;
    },

    setProcessing(value) {
      self.isProcessing = value;
    },

    setProgress(progress) {
      self.progress = progress;
    },

    openFile(file) {
      self.isLoading = true;
      self.isProcessing = true;

      const isWav = (file.type === 'audio/wav') || (file.type === 'audio/x-wav');
      if (!isWav) {
        message.error("Not wav file!");
        return false;
      }

      return processAudioFile(self, file, "../static/xadenoise.worker.js", ["-t", parseMode(self.mode)], "denoise-");
    },

  }));

const parseMode = (modeName) => {
  if (modeName == "rnn") {
    return "0";
  } else if (modeName == "fft_lms") {
    return "2";
  } else if (modeName == "fft_lms_lpf") {
    return "3";
  } else {
    return "2";
  }
}

export default DenoiseStore;

