import * as _ from 'lodash';

export default class DbylinePlugin {
  static create(params) {
    return {
      name: 'dbyline',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      instance: DbylinePlugin
    };
  }

  _onRedraw = () => this.render();

  _onReady = () => {
    const wf = this.waveform;
    this.drawer = wf.drawer;

    this.render();
  };

  constructor(params, wf) {
    this.container =
      'string' == typeof params.container
        ? document.querySelector(params.container)
        : params.container;

    if (!this.container) {
      throw new Error('No container for waveform dbyline');
    }
    this.waveform = wf;
    this.util = wf.util;
    this.params = this.util.extend(
      {},
      {
        enableResize: false,
        height: 256,
        width: 70,
        mainNotchPercentWidth: 6,
        slaveNotchPercentWidth: 3,
        labelPadding: 3,
        unlabeledNotchColor: '#c0c0c0',
        primaryColor: 'rgb(138,138,138)', //'#000',
        //secondaryColor: 'red', //'#c0c0c0',
        secondaryColor: 'rgb(138,138,138)', //'#c0c0c0',
        fontFamily: 'Arial',
        fontSize: 10,
        offset: 0
      },
      params
    );

    this.canvas = null;
    this.wrapper = null;
    this.drawer = null;
    this.maxCanvasWidth = null;
    this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.stereoSize = 16;

    this.dbyArray = [];

    // add listeners
    wf.on('resize', this._onResizeByWavform);

    this.createAll();
  }

  init() {
    if (this.waveform.isReady) {
      this._onReady();
    } else {
      this.waveform.once('ready', this._onReady);
    }

    if (this.params.enableResize)
      this.bindResizeEvents();

    this.resizeWrapper();
    //this.resizeCanvas();

  }

  destroy() {
    this.unAll();
    this.waveform.un('redraw', this._onRedraw);
    this.waveform.un('ready', this._onReady);
  }

  render() {
    this.resizeAll();
    this.waveform.setDbyArray(this.dbyArray);
    this.waveform.resizeAndDrawAll();
  }

  _onResizeByWavform = (size) => {
    this.params.height = size.height;
    this.resizeAll();
    this.waveform.setDbyArray(this.dbyArray);
  }

  _onResize = () => {
    this.resizeAll();

    this.waveform.setHeight(this.params.height);
    this.waveform.setDbyArray(this.dbyArray);
    this.waveform.resizeAndDrawAll();
  };

  createAll() {
    this.createWrapper();
    this.createCanvas();
    this.createResizeCross();
  }

  resizeAll() {
    this.resizeWrapper();
    this.resizeCanvas();

    this.renderCanvas();
    //after resize, draw pull bar
    this.renderResizeCross();
  }

  createWrapper() {
    this.container.innerHTML = '';
    this.wrapper = this.container.appendChild(
      document.createElement('dbyline')
    );
  }

  resizeWrapper() {
    this.util.style(this.wrapper, {
      position: 'absolute',
      userSelect: 'none',
      webkitUserSelect: 'none',
      height: `${this.params.height+this.waveform.resizeHeight}px`,
      width: `${this.params.width}px`,
      left: `${this.waveform.params.width}px`,
      overflowX: 'hidden',
      overflowY: 'hidden',
      backgroundColor: 'rgb(33,33,33)',
      //backgroundColor: 'blue',

      borderTopStyle: 'solid',
      borderTopWidth: `1px`,
      borderTopColor: 'black',
      borderRightStyle: 'solid',
      borderRightWidth: `1px`,
      borderRightColor: 'black',

    });
  }

  createCanvas() {
    this.canvas = this.wrapper.appendChild(
      document.createElement('canvas')
    );
  }

  resizeCanvas() {
    this.canvas.width = this.params.width * this.pixelRatio;
    this.canvas.height = this.params.height * this.pixelRatio;

    //console.log("params width: ", this.params.width, ", c height: ", this.params.height, ", ratio: ", this.pixelRatio);
    //console.log("c width: ", this.canvas.width, ", c height: ", this.canvas.height);

    this.util.style(this.canvas, {
      width: `${this.params.width}px`,
      height: `${this.params.height}px`,
      position: 'absolute',
      zIndex: 4
    });


    //draw split black line when channel > 1
    let chn = this.waveform.getNumOfChannels();
    if (chn > 1) {
      this.setFillStyles('black');
      let splitHeight = this.canvas.height / chn;
      let hPosition;
      for (let i = 1; i < chn; i++) {
        hPosition = splitHeight*i;
        this.fillRect(0, hPosition, this.canvas.width, 1*this.pixelRatio);
      }
    }


    //recalculate the height interval
    this.dbyHeight = this.params.height/(2*this.waveform.getNumOfChannels());

    this.heightInterval = calHeightInterval(this.dbyHeight);

    this.mainInterval = selectMainInterval([], 0, this.heightInterval, 0);
    this.secondaryInterval = selectSecondaryInterval([], this.mainInterval, 0, this.heightInterval, this.pixelRatio);

    //stereo label offset when resize
    this.stereoLabelOffset = this.params.width - 5 - this.stereoSize;
  }

  drawChannelDby(direction, heightOffset, chnIndex) {
    const fontSize = this.params.fontSize * this.pixelRatio;
    const width1 = this.params.width* (this.params.mainNotchPercentWidth/ 100) * this.pixelRatio;
    const width2 = this.params.width * (this.params.slaveNotchPercentWidth/ 100) * this.pixelRatio;

    // render primary labels
    this.setFillStyles(this.params.primaryColor);
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);

    if (direction == 1) {
      this.mainInterval.forEach((v)=> {
        let hPosition = this.dbyHeight - this.dbyHeight*v.ratio + heightOffset;
        this.fillRect(0, hPosition*this.pixelRatio, width1, 1);
        this.dbyArray.push({
          chn: chnIndex,
          height: hPosition*this.pixelRatio
        });

        if (v.db == 0) {
          this.fillText(
            'dB',
            20,
            (hPosition+3*this.params.labelPadding) * this.pixelRatio
          );
        } else {
          this.fillText(
            v.db,
            20,
            (hPosition+this.params.labelPadding) * this.pixelRatio
          );
        }
      })

      // render secondary labels
      this.setFillStyles(this.params.secondaryColor);
      this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
      this.secondaryInterval.forEach((v)=> {
        this.fillRect(0, (this.dbyHeight - this.dbyHeight*v.ratio + heightOffset)*this.pixelRatio, width2, 1);
      })
    } else {
      this.mainInterval.forEach((v)=> {
        let hPosition = this.dbyHeight + this.dbyHeight*v.ratio + heightOffset;
        this.fillRect(0, hPosition*this.pixelRatio, width1, 1);
        this.dbyArray.push({
          chn: chnIndex,
          height: hPosition*this.pixelRatio
        });

        if (v.db == 0) {
          this.fillText(
            0,
            20,
            (hPosition-this.params.labelPadding) * this.pixelRatio
          );
        } else {
          this.fillText(
            v.db,
            20,
            (hPosition+this.params.labelPadding) * this.pixelRatio
          );
        }
      })

      // render secondary labels
      this.setFillStyles(this.params.secondaryColor);
      this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
      this.secondaryInterval.forEach((v)=> {
        this.fillRect(0, (this.dbyHeight + this.dbyHeight*v.ratio + heightOffset)*this.pixelRatio, width2, 1);
      })
    }
  }

  drawInfinite(heightOffset) {
    const fontSize = 1.2*this.params.fontSize * this.pixelRatio;
    const width1 = this.params.width* (this.params.mainNotchPercentWidth/ 100) * this.pixelRatio;

    // render primary labels
    this.setFillStyles(this.params.primaryColor);
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);

    let hPosition = this.dbyHeight + heightOffset;
    this.fillRect(0, hPosition*this.pixelRatio, width1, 1);
    this.fillText(
      '-∞',
      20,
      (hPosition+this.params.labelPadding+1) * this.pixelRatio
    );
  }

  drawStereoLabel(heightOffset, isLeft) {
    const fontSize = this.params.fontSize * this.pixelRatio;

    // render primary labels
    let x = this.stereoLabelOffset*this.pixelRatio;
    let y = (this.dbyHeight + heightOffset - this.stereoSize/2)*this.pixelRatio;
    this.setFillStyles('rgb(49,49,49)');
    this.fillRect(x, y, this.stereoSize*this.pixelRatio, 1*this.pixelRatio);
    this.fillRect(x, y, 1*this.pixelRatio              , this.stereoSize*this.pixelRatio);
    this.fillRect(x+this.stereoSize*this.pixelRatio, y, 1*this.pixelRatio, this.stereoSize*this.pixelRatio);
    this.fillRect(x, y+this.stereoSize*this.pixelRatio, this.stereoSize*this.pixelRatio, 1*this.pixelRatio);

    this.setFillStyles('rgb(22,22,22)');
    this.fillRect(x+this.pixelRatio, y+this.pixelRatio, (this.stereoSize-1)*this.pixelRatio, (this.stereoSize-1)*this.pixelRatio);

    this.setFillStyles('rgb(50,146,228)');
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);

    if (isLeft) {
      this.fillText(
        'L',
        (x+6*this.pixelRatio),
        (y+12*this.pixelRatio)
      );
    } else {
      this.fillText(
        'R',
        (x+5*this.pixelRatio),
        (y+12*this.pixelRatio)
      );
    }
  }

  renderCanvas() {
    let chn = this.waveform.getNumOfChannels();

    this.dbyArray = [];
    for (let i = 0; i < chn; i++) {
      this.drawChannelDby(1, this.dbyHeight*2*i, i);
      this.drawChannelDby(0, this.dbyHeight*2*i, i);
      this.drawInfinite(this.dbyHeight*2*i);
    }

    if (chn == 2) {
      this.drawStereoLabel(0, true);
      this.drawStereoLabel(this.dbyHeight*2, false);
    }
  }


  createResizeCross() {
    this.handleRowResize = this.wrapper.appendChild(
    //this.handleRowResize = this.container.appendChild(
      document.createElement('handle')
    );
    this.handleRowResize.className = 'dbyline-cross-handle dbyline-cross-handle-row';
  }

  renderResizeCross() {
    let cssRow = {
      //cursor: 'row-resize',
      position: 'absolute',
      left: `0px`,
      //left: `${thos.waveform.params.width}px`,
      top: `${this.params.height}px`, // border 1 px, so from -1 offset px
      width: `${this.params.width}px`,
      height: `${this.waveform.resizeHeight}px`,
      backgroundColor: 'rgb(49,49,49)',
      zIndex: 8 
    };
    
    if (this.params.enableResize)
      cssRow.cursor = 'row-resize';

    this.util.style(this.handleRowResize, cssRow);
  }

  bindResizeEvents() {

    (() => {
      let touchId;
      let resize = false;
      let wrapperRect;

      const onDown = e => {
        if (e.touches && e.touches.length > 1) {
          return;
        }
        touchId = e.targetTouches ? e.targetTouches[0].identifier : null;

          // Store for scroll calculations
        wrapperRect = this.wrapper.getBoundingClientRect();

        if (e.target.tagName.toLowerCase() == 'handle') {
          if (e.target.classList.contains( 'dbyline-cross-handle-row')) {
            resize = 'row';
          } 
        } else {
          resize = false;
        }
        this.resizeStatus = resize;
      };

      const onUp = e => {
        if (e.touches && e.touches.length > 1) {
          return;
        }

        if (resize) {
          resize = false;
          this.resizeStatus = resize;

          this.renderResizeCross();
        }
      };

      const onMove = e => {
        if (e.touches && e.touches.length > 1) {
          return;
        }

        if (e.targetTouches && e.targetTouches[0].identifier != touchId) {
          return;
        }

        if (resize == 'row') {
          let newHeight = e.clientY - wrapperRect.top;

          this.params.height = parseInt(newHeight);
          this._onResize();
        }
      };

      this.wrapper.addEventListener('mousedown', onDown);
      this.wrapper.addEventListener('touchstart', onDown);

      //this.wrapper.addEventListener('mousemove', onMove);
      document.body.addEventListener('mousemove', onMove);
      document.body.addEventListener('touchmove', onMove);

      document.body.addEventListener('mouseup', onUp);
      document.body.addEventListener('touchend', onUp);

      this.on('remove', () => {
        document.body.removeEventListener('mouseup', onUp);
        document.body.removeEventListener('touchend', onUp);
        this.wrapper.removeEventListener('mousemove', onMove);
        this.wrapper.removeEventListener('touchmove', onMove);
      });

    })();
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
    const context = this.canvas.getContext('2d');
    context.fillText(text, x, y);
  }

}


function selectMainInterval(mainInterval, selectIndex, allInterval, tryIndex) {
  let curHeight = allInterval[selectIndex].height;
  let nextHeight;
  let diff;

  let minInterval = 12; //main notch interval, for text height maybe 14 pixel

  //try every 3 db
  if (tryIndex + 3 >= allInterval.length) {
    return mainInterval;
  }

  //console.log("selectIndex: ", selectIndex, ", tryIndex", tryIndex);

  nextHeight = allInterval[tryIndex+3].height;
  diff = curHeight - nextHeight;

  //if current try index height is bigger than minInterval(for text height and padding)
  //then record this interval, and increase selectIndex to the next try loop
  if (diff > minInterval) {
    if (selectIndex == 0) {
      mainInterval.push(allInterval[0]);
    }

    mainInterval.push(allInterval[tryIndex+3]);
    selectIndex = tryIndex + 3;
  } else {
    tryIndex += 3;
  }

  return selectMainInterval(mainInterval, selectIndex, allInterval, tryIndex);
}

function selectSecondaryInterval(secondaryInterval, mainInterval, mainIndex, allInterval, pixelRatio) {
  //this is minPixel for represent db interval labels, maybe 1 db, maybe 3db, maybe 6db,or 9 db
  //let minPixelDb = 6;
  let minPixelDb = 3;

  if (mainIndex >= mainInterval.length - 1) {
    return secondaryInterval;
  }

  //get main
  let diffHeight = Math.abs(mainInterval[mainIndex+1].height - mainInterval[mainIndex].height);
  let diffDb     = Math.abs(mainInterval[mainIndex+1].db - mainInterval[mainIndex].db);

  //console.log("diffHeight: ", diffHeight*pixelRatio, ", diffDB: ", diffDb*minPixelDb);

  if (diffHeight*pixelRatio > diffDb*minPixelDb) {
    for (let i = mainInterval[mainIndex].index+1; i <= mainInterval[mainIndex+1].index-1; i++) {
      secondaryInterval.push(allInterval[i]);
    }
  } else {
    let step = diffDb / 3;
    for (let i = mainInterval[mainIndex].index+step; i <= mainInterval[mainIndex+1].index-step; i+=step) {
      secondaryInterval.push(allInterval[i]);
    }
  }

  return selectSecondaryInterval(secondaryInterval, mainInterval, mainIndex+1, allInterval, pixelRatio);
}



function calHeightInterval(height) {
  let interval = [];

  for(let i = 0, j = 0; i >= -21; i--, j++) {
    let ratio = Math.pow(10, i/20);
    interval.push({
      index: j,
      db: i,
      ratio: ratio,
      height: height * ratio
    });
  }

  return interval;
}




