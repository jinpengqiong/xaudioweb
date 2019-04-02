import {types as t, flow, getParent} from 'mobx-state-tree';

//import Worker from '../worker/xaudiopro.worker.js';
import { downFile } from '../utils/common';

const DenoiseStore = t
  .model({
    mode: t.optional(t.string, 'fft_lms_lpf'),
    gain: t.optional(t.number, 1.0),
    lpf_fc: t.optional(t.number, 0.6),
    fileName: t.optional(t.string, ''),
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

    openFile(e) {
      let input = e.target;
      let stdout = "";
      let stderr = "";
      let worker = new Worker("../static/xaudiopro.worker.js");

      console.log("--------------", input);
      let inputFileName = input.files[0].name;
      let outputFileName = "denoise-" + inputFileName;

      let reader = new FileReader();
      reader.onload = () => {
        let arrayBuffer = reader.result;

        console.log(arrayBuffer.byteLength);

        worker.postMessage({
          type: "run", 
          MEMFS: [{name: inputFileName, data: arrayBuffer}],
          arguments: ["-i", inputFileName, "-o", outputFileName],
        });

      };
      reader.readAsArrayBuffer(input.files[0]);

      worker.onmessage = (e) => {
        var msg = e.data;
        switch (msg.type) {
          case "ready":
            console.log("=======================> is ready");
            break;
          case "stdout":
            console.log("stdout: ", msg.data);
            stdout += msg.data + "\n";
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
            console.log("44444444444444: ", msg.data);
            downFile(msg.data, outputFileName);
            break;
        }
      };
    },


  }));

export default DenoiseStore;

