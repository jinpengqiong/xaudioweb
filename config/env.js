import config from './env/dev'
//import config from './env/test'

//import config from './env/prod'

const normal = {
  PAGE_SIZE: 50,
  DANGROUP_PAGE_SIZE: 30,
  RESULT_PAGE_SIZE: 100,

  SCROLL_X: 1900,
  SCROLL_Y: 400

}

const env = {...config, ...normal}

export default env 
