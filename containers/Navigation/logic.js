
let store = null

export function setNav(nav) {
  store.navigation.setNav(nav)
}

export function getRoot() {
  //return navigation.root;
  return store;
}

export function init(selectedStore) {
  store = selectedStore
}


