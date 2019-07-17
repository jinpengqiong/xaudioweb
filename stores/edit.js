import {types as t, flow, getParent} from 'mobx-state-tree';
import {message} from 'antd';

const EditStore = t
  .model({
    fileName: t.optional(t.string, ''),

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

      //if (!checkValidAudioFile(file)) {
        //message.error("Not wav|flac|ape|mp4|mp3|aac|m4a|ac3|ogg|opus|vorbis|wma file!");
        //return false;
      //}

      //return processFFmpegFile();
      return;
    },




  }));


export default EditStore;

