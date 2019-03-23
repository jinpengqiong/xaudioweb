import RootStore from './root';

let rootStore = null;

const createRootStore = (isServer, langSetup) => {
  return RootStore.create({lang: langSetup});
};

function initRootStore(isServer = false, langSetup) {
  if (rootStore === null) {
    rootStore = createRootStore(isServer, langSetup);
  }

  return rootStore;
}

export default initRootStore;
