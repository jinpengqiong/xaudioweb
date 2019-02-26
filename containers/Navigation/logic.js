
let navigation = null

export function setNav(nav) {
  navigation.setNav(nav)
}


export function getRoot() {
  return navigation.root;
}

export function init(selectedStore) {
  navigation = selectedStore
}


