
import Router from 'next/router'
import {validToken} from './net';
import {message} from 'antd';
import langmap from '../config/langmap';
import { saveAs } from 'file-saver';

//export const DEFAULT_LIMIT = 20;
export const DEFAULT_LIMIT = 2;

function number (n) {
	if (!n) return 10;
	return (typeof n === 'number') ? n : parseInt(n, 10);
}

function randomKey (len, chars) {
	var str = '';
	if (typeof len === 'object') { // cheap array check
		var min = number(len[0]);
		var max = number(len[1]);
		len = Math.round(Math.random() * (max - min)) + min;
	} else {
		len = number(len);
	}
	chars = chars || '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
	for (var i = 0; i < len; i++) {
		str += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return str;
}

export const randomString = (len, chars) => {
  return randomKey(len, chars);
};

export const genAntChildNumTab = (len, prefix, width) => {
  let children = [];

  for(let i = 0; i < len; i++) {
    children.push({
      title: (i+1).toString(),
      dataIndex: `${prefix}${i+1}`,
      key: `${prefix}${i+1}`,
      width: width
    })
  }

  return children;
}

export const sortAsc = src => {
  return src.sort(function(a, b) {
    return a - b;
  });
};

export const sortDesc = src => {
  return src.sort(function(a, b) {
    return b - a;
  });
};


export const mobxState2Plain = store => {
  let keys = R.keys(store);
  let obj = {};

  keys.map(key => {
    if (store[key].toJSON)
      obj[key] = store[key].toJSON();
    else
      obj[key] = store[key];
  })

  return obj;
};

export const checkCurToken = (host) => {

  let token = localStorage.getItem("token");

  if (token != undefined && token != null && token.length > 10) {
    return validToken(host, token)
    .then(result => {
      if (!result)
        localStorage.clear();
      return result;
    })
  } else {
    localStorage.clear();
    return new Promise(resolve => resolve(false));
  }

};


export const checkLoginExpired = (logic) => {
  let curLang = localStorage.getItem("lang");

  checkCurToken(logic.getHost())
  .then((result) => {
    if (result) {
      logic.loadData()
    } else {
      message.info(langmap.tokenInvalid[curLang]);
      Router.push("/login")
    }
  })

}

export function logout() {
  localStorage.clear()
  Router.push("/login")
}


export function downFile(data, fileName) {
/*
  var blob = new Blob([data], { type: 'application/octet-stream' });

  if (window.navigator.msSaveOrOpenBlob) {
    navigator.msSaveBlob(blob, fileName);
  } else {
    var link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(link.href);
  }
*/

  //download( new Blob([data]), fileName, "application/octet-stream" );

  var blob = new Blob([data], {type: "application/octet-stream"});
  saveAs(blob, fileName);

}

let gFFmpegDuration = 0;
let gFFmpegProgress = 0;

let gError = 0;

export function processFFmpegFile(selfEnv, file, workerPath, workerArgs, outputPrefix, fmt, outputFmtName, outputFmtCvt) {

  let worker = new Worker(workerPath);

  let inputFileName = file.name;
  //let outputFileName = outputPrefix + inputFileName;
  let tmpName = inputFileName.split(".");
  let outputFileName = tmpName[tmpName.length-2] + "." + outputFmtName;

  let reader = new FileReader();
  let fileSize = file.size;
  let pp = 0;

  selfEnv.setProgress(0);
  selfEnv.fileName = inputFileName;

  reader.onload = () => {
    let arrayBuffer = reader.result;

    gFFmpegDuration = 0;
    gFFmpegProgress = 0;

    gError = 0;

    if (outputFmtCvt != "") {
      worker.postMessage({
        type: "run", 
        MEMFS: [{name: inputFileName, data: arrayBuffer}],
        arguments: ["-y", "-i", inputFileName].concat(workerArgs).concat(["-f", outputFmtCvt, outputFileName]),
      });
    } else {
      worker.postMessage({
        type: "run", 
        MEMFS: [{name: inputFileName, data: arrayBuffer}],
        arguments: ["-y", "-i", inputFileName].concat(workerArgs).concat([outputFileName]),
      });
    };
  };
  reader.readAsArrayBuffer(file);

  worker.onmessage = (e) => {
    var msg = e.data;
    switch (msg.type) {
      case "ready":
        //console.log("=======================> is ready");
        selfEnv.setProgress(0);
        break;
      case "stdout":
      case "stderr":
        //console.log("===========> out, err data=", msg.data);
        if (checkError(msg.data)) {
          gError = 1;
          selfEnv.setError(msg.data);
        } else {
          let tmpProgress = parseFFmpegProgress(gFFmpegDuration, gFFmpegProgress, msg.data);
          gFFmpegDuration = tmpProgress.duration;
          gFFmpegProgress = tmpProgress.progress;

          if (gFFmpegProgress > 0) {
            //console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
            selfEnv.setLoading(false);
          }
          selfEnv.setProgress(gFFmpegProgress);
        }

        break;
      case "exit":
        //console.log(stdout);
        selfEnv.setProcessing(false);
        selfEnv.setLoading(false);
        worker.terminate();
        break;
      case "done":
        selfEnv.setProgress(100);
        selfEnv.setLoading(false);
        selfEnv.setProcessing(false);
        //console.log("44444444444444: ", msg.data);
        if (!gError)
          downFile(msg.data, outputFileName);
        break;
    }
  };
  //console.log("-eeeeeeeeeeeeeeeeeeeeeeee end");
  return true;

}





export function processAudioFile(selfEnv, file, workerPath, workerArgs, outputPrefix) {

  let worker = new Worker(workerPath);

  let inputFileName = file.name;
  let outputFileName = outputPrefix + inputFileName;

  let reader = new FileReader();
  let fileSize = file.size;
  let pp = 0;

  selfEnv.setProgress(0);
  selfEnv.fileName = inputFileName;

  reader.onload = () => {
    let arrayBuffer = reader.result;

    //console.log(arrayBuffer.byteLength);
    //console.log("00000000000000000000-----------", self.mode, " jj: ", parseMode(self.mode));
    worker.postMessage({
      type: "run", 
      MEMFS: [{name: inputFileName, data: arrayBuffer}],
      arguments: ["-i", inputFileName, "-o", outputFileName].concat(workerArgs),
    });

  };
  reader.readAsArrayBuffer(file);

  worker.onmessage = (e) => {
    var msg = e.data;
    switch (msg.type) {
      case "ready":
        //console.log("=======================> is ready");
        selfEnv.setProgress(2);
        break;
      case "stdout":
        let p = parseProgress(fileSize, msg.data);
        if (p >= 0) {
          if (pp != p) {
            //console.log("===========> progress=", self.progress);
            selfEnv.setLoading(false);
            selfEnv.setProgress(p);
            pp = p;
          }
        }
        break;
      case "stderr":
        break;
      case "exit":
        //console.log(stdout);
        selfEnv.setLoading(false);
        selfEnv.setProcessing(false);
        worker.terminate();
        break;
      case "done":
        selfEnv.setProgress(100);
        selfEnv.setLoading(false);
        selfEnv.setProcessing(false);
        //console.log("44444444444444: ", msg.data);
        downFile(msg.data, outputFileName);

        break;
    }
  };
  //console.log("-eeeeeeeeeeeeeeeeeeeeeeee end");
  return true;

}

const parseFFmpegProgress = (duration, progress, info) => {
  if (duration == 0) {
    if (info.indexOf("Duration") >= 0) {
      let timeArray = info.replace(/\s*/g,"").split(",")[0].split(":");
      let hour = parseInt(timeArray[1]);
      let min = parseInt(timeArray[2]);
      let sec = parseInt(timeArray[3].split(".")[0]);

      return {
        duration: hour*3600 + min*60 + sec,
        progress: 0 
      };
    } else {
      return {duration: 0, progress: 0};
    }
  } else {
    if (info.indexOf("time=") >= 0) {
      let timeArray = info.replace(/\s*/g, "").split("bitrate")[0].split("time=")[1].split(":");
      let hour = parseInt(timeArray[0]);
      let min = parseInt(timeArray[1]);
      let sec = parseInt(timeArray[2].split(".")[0]);

      return {
        duration: duration,
        progress: parseInt((hour*3600+min*60+sec)*100 / duration)
      }
    } else {
      return {
        duration: duration, 
        progress: progress 
      };
    }

  }
}

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

const checkError = (info) => {
  let result = false;

  if (info.indexOf("Conversion failed!") >= 0) {
    result = true;
  } else {
    result = false;
  }

  return result;
}








