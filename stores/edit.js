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

  }));


export default EditStore;

