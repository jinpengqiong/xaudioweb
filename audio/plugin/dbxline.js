export default class DbxlinePlugin {
  static create(params) {
    return {
      name: 'dbxline',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      instance: DbxlinePlugin
    };
  }

  _onRedraw = () => this.render();

  _onReady = () => {
    const wf = this.waveform;
    this.drawer = wf.drawer;
    this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;

    this.maxCanvasWidth = wf.drawer.maxCanvasWidth || wf.drawer.width;
    this.maxCanvasElementWidth =
      wf.drawer.maxCanvasElementWidth ||
      Math.round(this.maxCanvasWidth / this.pixelRatio);

    this.render();
  };

  constructor(params, wf) {
    this.container =
      'string' == typeof params.container
        ? document.querySelector(params.container)
        : params.container;

        if (!this.container) {
          throw new Error('No container for waveform dbxline');
        }
        this.waveform = wf;
        this.util = wf.util;
        this.params = this.util.extend(
          {},
          {
            height: 20,
            width: 256,
            mainNotchPercentHeight: 40,
            slaveNotchPercentHeight: 20,
            labelPadding: 6,
            unlabeledNotchColor: '#c0c0c0',
            primaryColor: 'black', //'#000',
            secondaryColor: 'red', //'#c0c0c0',
            primaryFontColor: 'blue', //'#000',
            secondaryFontColor: '#000',
            fontFamily: 'Arial',
            fontSize: 10,
            dbInterval: this.defaultDbInterval,
            primaryLabelInterval: this.defaultPrimaryLabelInterval,
            secondaryLabelInterval: this.defaultSecondaryLabelInterval,
            offset: 0
          },
          params
        );

        this.canvas = null;
        this.wrapper = null;
        this.drawer = null;
        this.pixelRatio = null;
        this.maxCanvasWidth = null;
        this.maxCanvasElementWidth = null;
  }

  init() {
    if (this.waveform.isReady) {
      this._onReady();
    } else {
      this.waveform.once('ready', this._onReady);
    }
  }

  destroy() {
    this.unAll();
    this.waveform.un('redraw', this._onRedraw);
    this.waveform.un('ready', this._onReady);
  }

  createWrapper() {
    this.container.innerHTML = '';
    this.wrapper = this.container.appendChild(
      document.createElement('dbxline')
    );
    this.util.style(this.wrapper, {
      display: 'block',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none',
      height: `${this.params.height}px`,
      width: `${this.params.width}px`,
      overflowX: 'hidden',
      overflowY: 'hidden'
    });
  }

  render() {
    if (!this.wrapper) {
      this.createWrapper();
    }
    this.createCanvas();
    this.renderCanvas();
  }

  createCanvas() {
    this.canvas = this.wrapper.appendChild(
      document.createElement('canvas')
    );

    this.canvas.width = this.params.width * this.pixelRatio;
    this.canvas.height = this.params.height * this.pixelRatio;

    this.util.style(this.canvas, {
      width: `${this.params.width}px`,
      height: `${this.params.height}px`,
      position: 'absolute',
      zIndex: 4
    });
  }

  renderCanvas() {
    const fontSize = this.params.fontSize * this.pixelRatio;
    const totalDb = 60; //parseInt(duration, 10) + 1;
    const width = this.params.width * this.pixelRatio;
    const height1 = this.params.height * (this.params.mainNotchPercentHeight / 100) * this.pixelRatio;
    const height2 = this.params.height * (this.params.slaveNotchPercentHeight / 100) * this.pixelRatio;
    const height3 = this.params.height * this.pixelRatio;
    const pixelsPerDb = (width - 10) / totalDb; // 5 is the reserv width below -60 dB no need show

    // if parameter is function, call the function with
    // pixelsPerDb, otherwise simply take the value as-is
    const intervalFnOrVal = option =>
    typeof option === 'function' ? option(pixelsPerDb) : option;

    const dbInterval = intervalFnOrVal(this.params.dbInterval);
    const primaryLabelInterval = intervalFnOrVal(this.params.primaryLabelInterval);
    const secondaryLabelInterval = intervalFnOrVal(this.params.secondaryLabelInterval);
    //const secondaryLabelInterval = primaryLabelInterval / dbInterval;

    console.log("rrrrrrrrrrrrrr: ", dbInterval, "  ", primaryLabelInterval, "  ", secondaryLabelInterval);

    let curPixel = pixelsPerDb * this.params.offset;
    let curDb = 0;
    let i;
    // build an array of position data with index, second and pixel data,
    // this is then used multiple times below
    const positioning = [];
    let dbCount = totalDb / dbInterval + 1;

    for (i = 0; i < dbCount; i++) {
      console.log("------", i, "", curDb-totalDb, " ", dbCount);
      if (i == 0)
        positioning.push([i, 'dB', curPixel]);
      else
        positioning.push([i, curDb-totalDb, curPixel]);
      curDb += dbInterval;
      curPixel += pixelsPerDb * dbInterval;
    }

    console.log("99999999999: ", positioning);

    // iterate over each position
    const renderPositions = cb => {
      positioning.forEach(pos => {
        cb(pos[0], pos[1], pos[2]);
      });
    };

    // render primary labels
    this.setFillStyles(this.params.primaryColor);
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
    this.setFillStyles(this.params.primaryFontColor);
    renderPositions((i, curDb, curPixel) => {
      //if (i % primaryLabelInterval === 0) {
      this.fillRect(curPixel, 0, 1, height2);
      //this.fillText(
      //curDb,
      //curPixel - this.params.labelPadding * this.pixelRatio,
      //height3
      //);
      //}
    });

    // render secondary labels
    this.setFillStyles(this.params.secondaryColor);
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
    this.setFillStyles(this.params.secondaryFontColor);
    renderPositions((i, curDb, curPixel) => {
      //if (i % secondaryLabelInterval === 0) {
      console.log("pppppppppppppppppp----------------------->>>", i);
      if (Math.abs(curDb) % primaryLabelInterval === 0) {
        this.fillRect(curPixel, 0, 1, height1);
        this.fillText(
          curDb,
          curPixel - this.params.labelPadding * this.pixelRatio,
          height3
        );
      }
    });

  }

  setFillStyles(fillStyle) {
    this.canvas.getContext('2d').fillStyle = fillStyle;
  }

  setFonts(font) {
    this.canvas.getContext('2d').font = font;
  }

  fillRect(x, y, width, height) {
    this.canvas.getContext('2d').fillRect(x, y, width, height);
  }

  fillText(text, x, y) {
    let textWidth;
    let xOffset = 0;

    const context = this.canvas.getContext('2d');
    const canvasWidth = context.canvas.width;

    if (xOffset > x + textWidth) {
      return;
    }

    if (xOffset + canvasWidth > x) {
      textWidth = context.measureText(text).width;
      context.fillText(text, x - xOffset, y);
    }

    xOffset += canvasWidth;
  }

  defaultDbInterval(pxPerDb) {
    console.log("----------------=====> ", pxPerDb);
    if (pxPerDb >= 8) {
      return 1;
    } else if (pxPerDb * 2 >= 8) {
      return 2;
    } else { //if (pxPerDb * 12 >= 6) {
      return 12;
    }
  }

  defaultPrimaryLabelInterval(pxPerDb) {
    if (pxPerDb >= 12) {
      return 3;
    } else if (pxPerDb * 2 >= 12) {
      return 6;
    } else if (pxPerDb * 3 >= 12) {
      return 12;
    } else {
      return 36;
    }
  }

  defaultSecondaryLabelInterval(pxPerDb) {
    if (pxPerDb >= 12) {
      return 1;
    } else if (pxPerDb * 2 >= 12) {
      return 2;
    } else { //if (pxPerSec * 15 >= 25) {
      return 12;
    }
  }
}
