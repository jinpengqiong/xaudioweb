import {types as t, flow, getParent} from 'mobx-state-tree';
import {message} from 'antd';
import { processEditFile } from '../utils/common';

const EditStore = t
  .model({
    fileName: t.optional(t.string, ''),
    isLoading: t.optional(t.boolean, false),
    isProcessing: t.optional(t.boolean, false),
    isPlaying: t.optional(t.boolean, false),
    switchView: t.optional(t.string, 'right'),
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


    openFile(file) {
      //self.resetErr();
      self.isLoading = true;
      self.isProcessing = true;


      //console.log("11111111111", file);


      //if (!checkValidAudioFile(file)) {
        //message.error("Not wav|flac|ape|mp4|mp3|aac|m4a|ac3|ogg|opus|vorbis|wma file!");
        //return false;
      //}

      //return processFFmpegFile();

      return processEditFile(self, file)
    },

    setPlaying(status) {
      self.isPlaying = status;
    },

    setSwitchView(v) {
      self.switchView = v;
    },



  }));


export default EditStore;

