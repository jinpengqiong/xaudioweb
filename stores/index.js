import RootStore from './RootStore';

let rootStore = null;

const createRootStore = (isServer, langSetup) => {
  return RootStore.create({lang: langSetup});
};

function initRootStore(isServer = false, langSetup) {
  if (rootStore === null) {
    rootStore = createRootStore(isServer, langSetup);
  }

  console.log("rrrrrrrrrrrrrr ", rootStore);
  return rootStore;
}

export default initRootStore;
