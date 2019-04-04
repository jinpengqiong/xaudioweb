import {types as t, flow, getParent} from 'mobx-state-tree';

//import Worker from '../worker/xaudiopro.worker.js';
import { downFile } from '../utils/common';

const DenoiseStore = t
  .model({
    //mode: t.optional(t.string, 'fft_lms_lpf'),
    mode: t.optional(t.string, 'rnn'),
    gain: t.optional(t.number, 1.0),
    lpf_fc: t.optional(t.number, 0.6),
    fileName: t.optional(t.string, ''),
    progress: t.optional(t.number, 0),
  })
  .views(self => ({
    get root() {
      return getParent(self)
    },

  }))
  .actions(self => ({
    onChangeMode(e) {
      self.mode = e.target.value;
    },

    setProgress(progress) {
      self.progress = progress;
    },

    openFile(file) {
      let worker = new Worker("../static/xaudiopro.worker.js");

      let inputFileName = file.name;
      let outputFileName = "denoise-" + inputFileName;

      let reader = new FileReader();
      let fileSize = file.size;
      let pp = 0;

      console.log("111111111111: ", file.size);
      self.setProgress(0);
      self.fileName = inputFileName;

      reader.onload = () => {
        let arrayBuffer = reader.result;

        //console.log(arrayBuffer.byteLength);
        //console.log("00000000000000000000-----------", self.mode, " jj: ", parseMode(self.mode));
        worker.postMessage({
          type: "run", 
          MEMFS: [{name: inputFileName, data: arrayBuffer}],
          arguments: ["-t", parseMode(self.mode), "-i", inputFileName, "-o", outputFileName],
        });

      };
      reader.readAsArrayBuffer(file);

      worker.onmessage = (e) => {
        var msg = e.data;
        switch (msg.type) {
          case "ready":
            console.log("=======================> is ready");
            self.setProgress(2);
            break;
          case "stdout":
            let p = parseProgress(fileSize, msg.data);
            if (p >= 0) {
              if (pp != p) {
                console.log("===========> progress=", self.progress);
                self.setProgress(p);
                pp = p;
              }
            }
            break;
          case "stderr":
            break;
          case "exit":
            //console.log(stdout);
            worker.terminate();
            break;
          case "done":
            self.setProgress(100);
            //console.log("44444444444444: ", msg.data);
            //downFile(msg.data, outputFileName);
            break;
        }
      };
      //console.log("-eeeeeeeeeeeeeeeeeeeeeeee end");
    },

  }));

const parseProgress = (fileSize, info) => {
  let p = -1;
/*
  if (info.indexOf("progress") >= 0) {
    p = parseInt(info.split("=")[1]);
  }
*/

  if (info.indexOf("current_size") >= 0) {
    p = parseInt(info.split("=")[1]);

    return parseInt(p*100/fileSize);
  }

  return p;
}

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

