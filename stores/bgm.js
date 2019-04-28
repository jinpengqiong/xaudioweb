import {types as t, flow, getParent} from 'mobx-state-tree';
import { processAudioFile } from '../utils/common';
import {message} from 'antd';

const BgmStore = t
  .model({
    gain: t.optional(t.string, "1.0"),
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

      const isWav = (file.type === 'audio/wav');
      if (!isWav) {
        message.error("Not wav file!");
        return false;
      }

      return processAudioFile(self, file, "../static/xabgm.worker.js", [], "bgm-");
    },

  }));

export default BgmStore;

