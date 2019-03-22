import {types as t, flow, getParent} from 'mobx-state-tree';

import NavigationStore from '../NavigationStore';
import env from '../../config/env';

const RootStore = t
  .model({
    lang: t.optional(t.string, 'zh') ,
    navigation: t.optional(NavigationStore, {nav: 'main'}),
  })
  .views(self => ({
  }))
  .actions(self => ({
    afterCreate() {
    },

    setHost(host) {
      self.host = 'http://192.168.20.187/api' 
    },

    updateAttrs(key, value) {
      self[key] = value
    },

    load: flow(function* getSystem() {
    }),

    setLang: flow(function* setLang({key}) {
    }),


  }));

export default RootStore;
