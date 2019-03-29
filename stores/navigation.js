import {types as t, flow, getParent} from 'mobx-state-tree';


const NavigationStore = t
  .model({
    logo: t.optional(t.string, '/static/xaudiopro_logo'),
    collapsed: t.optional(t.boolean, false),
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

    changeCollapsed() {
      self.collapsed = !self.collapsed;
      console.log("1111111111111", self.collapsed);
    },

  }));

export default NavigationStore;

