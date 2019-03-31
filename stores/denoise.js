import {types as t, flow, getParent} from 'mobx-state-tree';


const DenoiseStore = t
  .model({
    mode: t.optional(t.string, 'fft_lms_lpf'),
    gain: t.optional(t.number, 1.0),
    lpf_fc: t.optional(t.number, 0.6),
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

  }));

export default DenoiseStore;

