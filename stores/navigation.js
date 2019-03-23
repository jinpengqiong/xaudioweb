import {types as t, flow, getParent} from 'mobx-state-tree';


const NavigationStore = t
  .model({
    nav: t.optional(t.string, 'main'),  //main page, help...
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

  }));

export default NavigationStore;

