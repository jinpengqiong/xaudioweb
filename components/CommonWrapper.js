import * as utils from '../utils';


class CommonWrapper {
  constructor(params) {
    console.log("kkkkkkjjjjjjjjjjjjjjjjj: ", params);
    this.container = document.querySelector(params.id);

    if (params.width) {
      this.width = params.width;
    } else {
      if (params.wRatio) {
        this.width = window.innerWidth * params.wRatio;
      } else {
        this.width = 1024;
      }
    }

    if (params.height) {
      this.height = params.height;
    } else {
      if (params.hRatio) {
        this.height = window.innerHeight * params.hRatio;
      } else {
        this.height = 256;
      }
    }

    console.log("jjjjjjjjjjjjjjjjj: ", this.container);
    console.log("width: ", window.innerWidth, this.width);
    console.log("height: ", window.innerHeight, this.height);

    utils.style(this.container, {
      display: 'block',
      //backgroundColor: 'red',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none',
      width: this.width + 'px',
      height: this.height + 'px'
    });
  }

  //init() {}

}

export default CommonWrapper;

