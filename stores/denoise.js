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

    openFile(e) {
      let input = e.target;
      let stdout = "";
      let stderr = "";
      let worker = new Worker("../static/xaudiopro.worker.js");

      console.log("--------------", input);
      let inputFileName = input.files[0].name;
      let outputFileName = "denoise-" + inputFileName;

      let reader = new FileReader();

      self.setProgress(0);

      reader.onload = () => {
        let arrayBuffer = reader.result;

        console.log(arrayBuffer.byteLength);

        console.log("00000000000000000000-----------", self.mode, " jj: ", parseMode(self.mode));
        worker.postMessage({
          type: "run", 
          MEMFS: [{name: inputFileName, data: arrayBuffer}],
          arguments: ["-t", parseMode(self.mode), "-i", inputFileName, "-o", outputFileName],
        });

      };
      reader.readAsArrayBuffer(input.files[0]);

      worker.onmessage = (e) => {
        var msg = e.data;
        switch (msg.type) {
          case "ready":
            //console.log("=======================> is ready");
            break;
          case "stdout":
            console.log("stdout: ", msg.data);
            stdout += msg.data + "\n";
            //self.setProgress(parseProgress(msg.data));
            let p = parseProgress(msg.data);
            if (p >= 0)
              self.setProgress(p);
            console.log("===========> progress=", self.progress);
            break;
          case "stderr":
            console.log("stderr", msg.data);
            stderr += msg.data + "\n";
            break;
          case "exit":
            console.log("Process exited with code " + msg.data);
            console.log(stdout);
            worker.terminate();
            break;
          case "done":
            self.setProgress(100);
            //console.log("44444444444444: ", msg.data);
            downFile(msg.data, outputFileName);
            break;
        }
      };
    },

  }));

const parseProgress = (info) => {
  let p = -1;

  if (info.indexOf("progress") >= 0) {
    p = parseInt(info.split("=")[1]);
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

