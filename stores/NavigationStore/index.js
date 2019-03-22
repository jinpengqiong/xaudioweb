import {types as t, flow, getParent} from 'mobx-state-tree';


const NavigationStore = t
  .model({
    logo: t.optional(t.string, '/static/play_logo'),
    nav: t.optional(t.string, 'stream1'),  //网络管理，帮助反馈
  })
  .views(self => ({
    get root() {
      return getParent(self)
    },

  }))
  .actions(self => ({
    setNav(nav) {
      self.nav= nav;
    },

    setLogo(logo) {
      self.logo = logo
    }

  }));

export default NavigationStore;

