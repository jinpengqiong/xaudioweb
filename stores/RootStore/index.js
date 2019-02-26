import {types as t, flow, getParent} from 'mobx-state-tree';

import NavigationStore from '../NavigationStore';
import env from '../../config/env';

const RootStore = t
  .model({
    host: t.optional(t.string, 'http://localhost'),
    title: t.optional(t.string, '网络管理'),
    //lang: t.optional(t.enumeration('lang', ['zh', 'en'])),
    lang: t.optional(t.string, 'default'),
    navigation: t.optional(NavigationStore, {nav: 'stream'}),
  })
  .views(self => ({
  }))
  .actions(self => ({
    afterCreate() {
    },

    setHost(host) {
      //self.host = 'http://' + host
      //self.host = 'http://192.168.20.182/api' 
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
