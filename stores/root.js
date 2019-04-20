import {types as t, flow, getParent} from 'mobx-state-tree';

import env from '../config/env';
import NavigationStore from './navigation';
import DenoiseStore from './denoise';
import BgmStore from './bgm';
import FmtcvtStore from './fmtcvt';

const RootStore = t
  .model({
    logo: t.optional(t.string, '/static/play_logo'),
    lang: t.optional(t.string, 'zh') ,
    navigation: t.optional(NavigationStore, {nav: 'audio_process_denoise'}),
    denoise: t.optional(DenoiseStore, {}),
    bgm: t.optional(BgmStore, {}),
    fmtcvt: t.optional(FmtcvtStore, {}),
  })
  .views(self => ({
  }))
  .actions(self => ({
    afterCreate() {
    },

    load: flow(function* load() {
    }),

    setLogo(logo) {
      self.logo = logo
    },

    setLang: flow(function* setLang({key}) {
    }),


  }));

export default RootStore;
