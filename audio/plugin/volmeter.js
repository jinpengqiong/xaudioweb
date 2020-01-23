//double scaledValue = UCHAR_MAX * (dbMag - minDecibels) * rangeScaleFactor;
//rangescalefactor = 1./(max-min)
//real dB = value/(255*rangescalefactor) + minDB

import { initLog10Tab, getScaleVuDB } from '../tools/vu'

export default class VolmeterPlugin {
  static create(params) {
    return {
      name: 'volmeter',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      staticProps: {},
      instance: VolmeterPlugin
    };
  }

  defaultParams = {
    enableResize: false,
    opacity: '0.25',
    zIndex: 4,
    width: 512,
    height: 60,
    backgroundColor: 'black',

    //dbxline scale
    dbHeight: 20,
    dbWidth: 512,
    mainNotchPercentHeight: 40,
    slaveNotchPercentHeight: 20,
    labelPadding: 6,
    unlabeledNotchColor: 'rgb(138,138,138)',
    primaryColor: 'rgb(138,138,138)', //'#000',
    secondaryColor: 'rgb(138,138,138)', //'#c0c0c0',
    primaryFontColor: 'rgb(138,138,138)', //'#000',
    secondaryFontColor: 'rgb(138,138,138)',
    fontFamily: 'Arial',
    fontSize: 10,
    dbInterval: this.defaultDbInterval,
    primaryLabelInterval: this.defaultPrimaryLabelInterval,
    secondaryLabelInterval: this.defaultSecondaryLabelInterval,
    dbOffset: 0

  };

  _onPlay = () => {
    this.stopFlag = false;
    this.render();
  };

  _onStop = () => {
    this.stopFlag = true;
  };

  _onReady = () => {
    const wf = this.waveform;

    // add listeners
    wf.on('play', this._onPlay);
    wf.on('pause', this._onStop);

    initLog10Tab();

    this.render();
  };

  constructor(params, wf) {
    this.container =
      'string' == typeof params.container
        ? document.querySelector(params.container)
        : params.container;

        if (!this.container) {
          throw new Error('No container for waveform volmeter');
        }
        this.waveform = wf;
        this.stopFlag = false;

        this.wrapper = null;
        this.style = wf.util.style;
        this.util = wf.util;

        this.params = wf.util.extend({}, this.defaultParams, params);
        this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;

        this.titleHeight = 5; //20;
        this.leftOffset = 5;
        this.rightOffset = 5;
        this.resizeWidth = 4;
        this.resizeHeight = 5; //4;
        this.scaleHeight = this.params.dbHeight;
        this.bottomHeight = 12;


        this.width = Number(this.params.width) || 512;
        this.height = Number(this.params.height) || 60;

        //vu meter

        this.vuMaxCurrent = [];
        this.vuMaxValue = [];

        //db scale

        //resize params
        this.scrollSpeed = 1;;

  }


  init() {
    this.vuCanvas = [];
    this.hCanvas = [];

    this.createAll();
    this.resizeAll();

    this.renderBg();
    this.renderDB();

    if (this.waveform.isReady) {
      this._onReady();
    } else {
      this.waveform.once('ready', this._onReady);
    }

  }

  createResizeCross() {
    this.handleColResize = this.wrapper.appendChild(
      document.createElement('handle')
    );
    this.handleColResize.className = 'volmeter-handle volmeter-handle-col';

    this.handleRowResize = this.wrapper.appendChild(
      document.createElement('handle')
    );
    this.handleRowResize.className = 'volmeter-handle volmeter-handle-row';
  }

  renderResizeCross() {
    let cssCol = {
      //cursor: 'col-resize',
      position: 'absolute',
      left: `${this.width - this.resizeWidth}px`,
      top: '-1px', // border 1 px, so from -1 offset px
      width: `${this.resizeWidth+1}px`,
      height: `${this.height+2}px`,
      backgroundColor: 'rgb(22,22,22)',
      zIndex: 8 
    };
    let cssRow = {
      //cursor: 'row-resize',
      position: 'absolute',
      left: `0px`,
      top: '-1px', // border 1 px, so from -1 offset px
      width: `${this.width}px`,
      height: `${this.resizeHeight}px`,
      backgroundColor: 'rgb(22,22,22)',
      zIndex: 8 
    };

    if (this.params.enableResize) {
      cssCol.cursor = 'col-resize';
      cssRow.cursor = 'row-resize';
    }

    this.util.style(this.handleColResize, cssCol);
    this.util.style(this.handleRowResize, cssRow);

    if (this.params.enableResize) {
      if (this.resizeStatus) {
        this.util.style(document.body, {
          cursor: 'col-resize',
        })
      } else {
        this.util.style(document.body, {
          cursor: 'default',
        })
      }
    }
  }

  createAll() {
    this.createWrapper();

    this.createBg();
    this.createMeter();
    this.createVu();
    this.createDB();
  }

  resizeAll() {
    this.resizeWrapper();
    this.renderResizeCross();

    this.resizeBg();
    this.resizeMeter();
    this.resizeVu();
    this.resizeDB();
  }

  createWrapper() {
    this.container.innerHTML = '';
    this.wrapper = this.container.appendChild(
      document.createElement('volmeter')
    );

    this.createResizeCross();
    this.renderResizeCross();

    if (this.params.enableResize)
      this.bindEvents();
  }

  resizeWrapper() {
    const wfParams = this.waveform.params;

    if (this.wrapper) {
      this.util.style(this.wrapper, {
        //cursor: 'col-resize',
        display: 'block',
        position: 'relative',
        userSelect: 'none',
        webkitUserSelect: 'none',
        height: `${this.height}px`,
        width: `${this.width}px`
      });

      if (wfParams.fillParent || wfParams.scrollParent) {
        this.util.style(this.wrapper, {
          //width: '100%',
          overflowX: 'hidden',
          overflowY: 'hidden'
        });
      }
    }
  }


  //bg resize and render
  createBg() {
    this.bgCanvas = this.wrapper.appendChild(
      document.createElement('canvas')
    )
  }

  resizeBg() {
    this.bgCanvas.width = this.width * this.pixelRatio;
    this.bgCanvas.height = this.height * this.pixelRatio;
    this.util.style(this.bgCanvas, {
      position: 'absolute',
      zIndex: 4,
      width: `${this.width}px`,
      height: `${this.height}px` 
    });
  }

  renderBg() {
    let ctx = this.bgCanvas.getContext('2d');
    //ctx.fillStyle = 'rgb(0,100,0)'
    //ctx.fillStyle = 'darkgrey'
    ctx.fillStyle = 'rgb(35,35,35)'
    ctx.fillRect(0, 0, this.width*this.pixelRatio, this.height*this.pixelRatio);
  }


  //meter and vu resize and render
  createMeter() {
    this.meterCanvas = this.wrapper.appendChild(
      document.createElement('canvas')
    );
  }

  resizeMeter() {
    this.meterWidth = this.width - (this.leftOffset + this.rightOffset + this.resizeWidth);
    this.meterHeight = this.height - (this.titleHeight + this.scaleHeight + this.bottomHeight + this.resizeHeight);

    this.meterCanvas.width = this.meterWidth * this.pixelRatio;
    this.meterCanvas.height = this.meterHeight * this.pixelRatio;
    this.util.style(this.meterCanvas, {
      position: 'absolute',
      zIndex: 5,
      width: `${this.meterWidth}px`,
      height: `${this.meterHeight}px` ,
      top: `${this.resizeHeight+this.titleHeight}px`,
      left: `${this.leftOffset}px`,
      borderStyle: 'solid',
      borderWidth: `1px`,
      borderColor: 'black',
    });
  }

  createVu() {
    //let chn = this.waveform.getNumOfChannels();
    let chn = 2; //default is stereo
    let hwidth = 8;

    if (this.waveform.isReady) {
      chn = this.waveform.getNumOfChannels();
    }

    for (let i = 0; i < chn; i++) {
      this.vuCanvas[i] = this.wrapper.appendChild(
        document.createElement('canvas')
      );

      this.hCanvas[i] = this.wrapper.appendChild(
        document.createElement('canvas')
      );
    }
  }

  resizeVu() {
    let chn = 2; //default is stereo
    let hwidth = 8;

    if (this.waveform.isReady) {
      chn = this.waveform.getNumOfChannels();
    }

    this.vuWidth = this.meterWidth - hwidth;
    this.vuHeight = (this.meterHeight - 2 - (chn-1)) / chn; //3: up border, down border, split row, each 1 pixel
    let splitHeight = this.meterHeight / chn;

    for (let i = 0; i < chn; i++) {
      this.vuCanvas[i].width = this.vuWidth * this.pixelRatio;
      this.vuCanvas[i].height = this.vuHeight * this.pixelRatio;
      this.util.style(this.vuCanvas[i], {
        position: 'absolute',
        zIndex: 5,
        width: `${this.vuWidth}px`,
        height: `${this.vuHeight}px` ,
        top: `${this.resizeHeight+this.titleHeight+1+i*(this.vuHeight+1)}px`,
        left: `${this.leftOffset+1}px`,
        //borderRightStyle: 'solid',
        //borderRightWidth: `1px`,
        //borderRightColor: 'black',
      });


      this.hCanvas[i].width = hwidth * this.pixelRatio;
      this.hCanvas[i].height = this.vuHeight * this.pixelRatio;
      this.util.style(this.hCanvas[i], {
        position: 'absolute',
        zIndex: 5,
        width: `${hwidth}px`,
        height: `${this.vuHeight+1}px` ,
        top: `${this.resizeHeight+this.titleHeight+i*(this.vuHeight+1)}px`,
        left: `${this.leftOffset+this.vuWidth}px`,
        borderStyle: 'solid',
        borderWidth: `1px`,
        borderColor: 'black',
      });

    }
  }

  renderVu(i) {
    //let ctx = this.vuCanvas[i].getContext('2d');
    //let width = this.vuWidth;
    //let height = this.vuHeight;
    let ratio = this.pixelRatio;

    let analyser = this.waveform.backend.analyserSplit[i];

    let self = this;

    let vuMaxCount = 40;

    let startFlag = false;

    allcnt1++;
    let ccnt = allcnt1;

    function updateMeterCanvas() {
      //request next frame draw
      //console.log("22222222222222222---------------: ", ccnt);

      if (self.stopFlag)
        return;

      window.requestAnimationFrame(updateMeterCanvas);

      let ctx = self.vuCanvas[i].getContext('2d');

      let greenOffset = (42/60)*self.vuWidth;
      let yellowOffset = (54/60)*self.vuWidth;

      //draw green, yellow, red section vu 
      ctx.fillStyle = 'rgb(67,237,82)';
      ctx.fillRect(0, 0, greenOffset*ratio, self.vuHeight*ratio);
      ctx.fillStyle = 'rgb(244,208,23)';
      ctx.fillRect(greenOffset*ratio, 0, (yellowOffset-greenOffset)*ratio, self.vuHeight*ratio);
      ctx.fillStyle = 'rgb(242,72,75)';
      ctx.fillRect(yellowOffset*ratio, 0, (self.vuWidth-yellowOffset)*ratio, self.vuHeight*ratio);

      //draw real vu show
      ctx.fillStyle = 'rgb(29,29,29)';
      let inputData = new Float32Array(analyser.fftSize);
      analyser.getFloatTimeDomainData(inputData);
      let vuShow = getScaleVuDB(inputData, analyser.fftSize, 90, self.vuWidth);
      ctx.fillRect(vuShow*ratio, 0, self.vuWidth*ratio,  self.vuHeight*ratio);

      //draw yellow temp vu max show, 1 pixel, use 60 frame update when alway big

      //console.log(": ", i, "vuShow:", vuShow,  "maxVaule", self.vuMaxValue[i], "maxCurrent", self.vuMaxCurrent[i]);

      if (vuShow >= self.vuMaxValue[i]) {
        ctx.fillStyle = 'rgb(255,253,56)'
        ctx.fillRect((vuShow)*ratio, 0, ratio,  self.vuHeight*ratio);

        self.vuMaxValue[i] = vuShow;
        self.vuMaxCurrent[i] = 0;
      } else {
        if (self.vuMaxCurrent[i] > vuMaxCount) {
          ctx.fillStyle = 'rgb(255,253,56)'
          ctx.fillRect((vuShow)*ratio, 0, ratio,  self.vuHeight*ratio);

          self.vuMaxValue[i] = vuShow;
          self.vuMaxCurrent[i] = 0;
        } else {
          ctx.fillStyle = 'rgb(255,253,56)'
          ctx.fillRect((self.vuMaxValue[i])*ratio, 0, ratio,  self.vuHeight*ratio);
        }

        self.vuMaxCurrent[i] = self.vuMaxCurrent[i] + 1;
      }

    }

    if (!startFlag) {
      setTimeout(updateMeterCanvas, 0);
      startFlag = true;
    }
  }

  onResize() {
    this.resizeAll();

    //because vu is animate, once start can not start repeatlly, so this way only render static stuffs
    this.renderStatic();
  }

  bindEvents() {

    (() => {
      const scrollSpeed = this.scrollSpeed;
      let touchId;
      let resize = false;
      let scrollDirection = null;
      let wrapperRect;

      const onDown = e => {
        if (e.touches && e.touches.length > 1) {
          return;
        }
        touchId = e.targetTouches ? e.targetTouches[0].identifier : null;

          // Store for scroll calculations
        wrapperRect = this.wrapper.getBoundingClientRect();

        if (e.target.tagName.toLowerCase() == 'handle') {
          if (e.target.classList.contains( 'volmeter-handle-col')) {
            resize = 'col';
          } else {
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
          scrollDirection = null;
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

        if (resize == 'col') {
          //console.log("1111111111111", e, "  resize: ", resize, "  left: ", wrapperRect, ", x:", e.clientX, ", ooo: ");

          let newWidth = e.clientX - wrapperRect.left;

          this.width = newWidth;
          this.onResize();
        }

        if (resize == 'row') {
          let newHeight = e.clientY - wrapperRect.top;

          this.height = newHeight;
          this.onResize();
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

      this.waveform.on('destroy', () => {
        document.body.removeEventListener('mouseup', onUp);
        document.body.removeEventListener('touchend', onUp);
      });
    })();


  }

  renderStatic() {
    this.renderBg();
    this.renderDB();

    if (this.resizeStatus) {
      this.renderResizeCross();
    }
  }

  render() {
    this.renderStatic();

    if (this.waveform.isReady) {
      let chn = this.waveform.getNumOfChannels();

      for (let i = 0; i < chn; i++) {
        this.vuMaxValue[i] = 0;
        this.vuMaxCurrent[i] = 0;
        this.renderVu(i);
      }
    }
  }

  destroy() {
    this.unAll();
    this.waveform.un('ready', this._onReady);
  }

  //draw db scale
  createDB() {
    this.dbWrapper = this.wrapper.appendChild(
      document.createElement('dbxline')
    );

    this.dbCanvas = this.dbWrapper.appendChild(
      document.createElement('canvas')
    );
  }

  resizeDB() {
    this.params.dbWidth = this.vuWidth;
    //this.params.dbHeight = this.height - this.titleHeight - this.meterHeight;
    this.util.style(this.dbWrapper, {
      display: 'block',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none',
      height: `${this.params.dbHeight}px`,
      width: `${this.params.dbWidth}px`,
      top: `${this.resizeHeight+this.titleHeight+1+this.meterHeight+2}px`,
      left: `${this.leftOffset+1}px`,
      overflowX: 'hidden',
      overflowY: 'hidden'
    });

    this.dbCanvas.width = this.params.dbWidth * this.pixelRatio;
    this.dbCanvas.height = this.params.dbHeight * this.pixelRatio;

    this.util.style(this.dbCanvas, {
      width: `${this.params.dbWidth}px`,
      height: `${this.params.dbHeight}px`,
      position: 'absolute',
      zIndex: 4
    });
  }

  renderDB() {
    const fontSize = this.params.fontSize * this.pixelRatio;
    const totalDb = 60; //parseInt(duration, 10) + 1;
    const width = this.params.dbWidth * this.pixelRatio;
    const height1 = this.params.dbHeight * (this.params.mainNotchPercentHeight / 100) * this.pixelRatio;
    const height2 = this.params.dbHeight * (this.params.slaveNotchPercentHeight / 100) * this.pixelRatio;
    const height3 = this.params.dbHeight * this.pixelRatio;
    const pixelsPerDb = (width-2) / totalDb; // 2: 1 pixel is start offset, 1 pixel is end

    // if parameter is function, call the function with
    // pixelsPerDb, otherwise simply take the value as-is
    const intervalFnOrVal = option =>
    typeof option === 'function' ? option(pixelsPerDb) : option;

    const dbInterval = intervalFnOrVal(this.params.dbInterval);
    const primaryLabelInterval = intervalFnOrVal(this.params.primaryLabelInterval);
    const secondaryLabelInterval = intervalFnOrVal(this.params.secondaryLabelInterval);
    //const secondaryLabelInterval = primaryLabelInterval / dbInterval;

    //console.log("rrrrrrrrrrrrrr: ", dbInterval, "  ", primaryLabelInterval, "  ", secondaryLabelInterval);

    let curPixel = pixelsPerDb * this.params.dbOffset;
    let curDb = 0;
    let i;
    // build an array of position data with index, second and pixel data,
    // this is then used multiple times below
    const positioning = [];
    let dbCount = totalDb / dbInterval + 1;

    for (i = 0; i < dbCount; i++) {
      //console.log("------", i, "", curDb-totalDb, " ", dbCount);
      if (i == 0) 
        positioning.push([i, 'dB', curPixel]);
      else
        positioning.push([i, curDb-totalDb, curPixel]);
      curDb += dbInterval;
      curPixel += pixelsPerDb * dbInterval;
    }

    //console.log("99999999999: ", positioning);

    // iterate over each position
    const renderPositions = cb => {
      positioning.forEach(pos => {
        cb(pos[0], pos[1], pos[2]);
      });
    };

    // render primary labels
    this.setFillStyles(this.params.primaryColor);
    this.setFonts(`${fontSize-2}px ${this.params.fontFamily}`);
    this.setFillStyles(this.params.primaryFontColor);
    renderPositions((i, curDb, curPixel) => {
      this.fillRect(curPixel, 0, 1, height2);
      if (curDb == 'dB') {
        this.fillText(
          curDb,
          curPixel + 12 - this.params.labelPadding * this.pixelRatio, //12 is the db show offset, padding
          height3
        );
      }
    });

    // render secondary labels
    this.setFillStyles(this.params.secondaryColor);
    this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
    this.setFillStyles(this.params.secondaryFontColor);
    renderPositions((i, curDb, curPixel) => {
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
    this.dbCanvas.getContext('2d').fillStyle = fillStyle;
  }

  setFonts(font) {
    this.dbCanvas.getContext('2d').font = font;
  }

  fillRect(x, y, width, height) {
    this.dbCanvas.getContext('2d').fillRect(x, y, width, height);
  }

  fillText(text, x, y) {
    let textWidth;
    let xOffset = 0;

    const context = this.dbCanvas.getContext('2d');
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


var allcnt1 = 0;


