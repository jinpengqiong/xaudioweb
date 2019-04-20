import {types as t, flow, getParent} from 'mobx-state-tree';
import { processFFmpegFile } from '../utils/common';

const FmtcvtStore = t
  .model({
    fileName: t.optional(t.string, ''),
    progress: t.optional(t.number, 0),
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

    setProgress(progress) {
      self.progress = progress;
    },

    openFile(file) {
      //return processFFmpegFile(selfEnv, file, "../static/ffmpegaudio.worker.js", workerArgs, "fmtcvt-", "aac");
      return processFFmpegFile(self, file, "../static/ffmpegaudio.worker.js", ["-c:a", "libfdk_aac", "-profile:a", "aac_he_v2", "-b:a", "24k"], "fmtcvt-", "adts");
    },

  }));

export default FmtcvtStore;

