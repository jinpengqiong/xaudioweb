import * as _ from 'lodash';

export default class TimelinePlugin {
  static create(params) {
    return {
      name: 'timeline',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      instance: TimelinePlugin
    };
  }

  _onScroll = () => {
    if (this.wrapper && this.drawer.wrapper) {
      this.wrapper.scrollLeft = this.drawer.wrapper.scrollLeft;
    }
  };

  _onRedraw = () => this.render();

  _onReady = () => {
    const wf = this.waveform;
    this.drawer = wf.drawer;
    this.pixelRatio = wf.drawer.params.pixelRatio;
    this.maxCanvasWidth = wf.drawer.maxCanvasWidth || wf.drawer.width;
    this.maxCanvasElementWidth =
      wf.drawer.maxCanvasElementWidth ||
      Math.round(this.maxCanvasWidth / this.pixelRatio);

    // add listeners
    wf.drawer.wrapper.addEventListener('scroll', this._onScroll);
    wf.on('redraw', this._onRedraw);
    wf.on('zoom', this._onZoom);

    this.render();
  };

  _onWrapperClick = e => {
    e.preventDefault();
    const relX = 'offsetX' in e ? e.offsetX : e.layerX;
    this.fireEvent('click', relX / this.wrapper.scrollWidth || 0);
  };

  constructor(params, wf) {
    this.container =
      'string' == typeof params.container
        ? document.querySelector(params.container)
        : params.container;

        if (!this.container) {
          throw new Error('No container for waveform timeline');
        }
        this.waveform = wf;
        this.util = wf.util;
        this.params = this.util.extend(
          {},
          {
            height: 25,
            notchPercentHeight: 30,
            labelPadding: 5,
            unlabeledNotchColor: '#c0c0c0',

            primaryColor: 'rgb(138,138,138)',
            secondaryColor: 'rgb(138,138,138)',
            primaryFontColor: 'rgb(138,138,138)',
            secondaryFontColor: 'rgb(138,138,138)',

            //primaryColor: '#000',
            //secondaryColor: '#c0c0c0',
            //primaryFontColor: '#000',
            //secondaryFontColor: '#000',

            fontFamily: 'Arial',
            fontSize: 10,
            duration: null,
            zoomDebounce: false,
            formatTimeCallback: this.defaultFormatTimeCallback,
            timeInterval: this.defaultTimeInterval,
            primaryLabelInterval: this.defaultPrimaryLabelInterval,
            secondaryLabelInterval: this.defaultSecondaryLabelInterval,
            offset: 0
          },
          params
        );

        this.canvases = [];
        this.wrapper = null;
        this.drawer = null;
        this.pixelRatio = null;
        this.maxCanvasWidth = null;
        this.maxCanvasElementWidth = null;

        this.primaryOffsetArray = [];

        this._onZoom = this.params.zoomDebounce
          ? this.waveform.util.debounce(
            () => this.render(),
            this.params.zoomDebounce
          )
            : () => this.render();
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
    this.waveform.un('zoom', this._onZoom);
    this.waveform.un('ready', this._onReady);
    this.waveform.drawer.wrapper.removeEventListener(
      'scroll',
      this._onScroll
    );
    if (this.wrapper && this.wrapper.parentNode) {
      this.wrapper.removeEventListener('click', this._onWrapperClick);
      this.wrapper.parentNode.removeChild(this.wrapper);
      this.wrapper = null;
    }
  }

  createWrapper() {
    const wfParams = this.waveform.params;
    this.container.innerHTML = '';
    this.wrapper = this.container.appendChild(
      document.createElement('timeline')
    );
    this.util.style(this.wrapper, {
      display: 'block',
      position: 'relative',
      userSelect: 'none',
      webkitUserSelect: 'none',
      height: `${this.params.height}px`,
      width: `${this.params.width}px`,


      borderTopStyle: 'solid',
      borderTopWidth: `1px`,
      borderTopColor: 'black',
      borderLeftStyle: 'solid',
      borderLeftWidth: `1px`,
      borderLeftColor: 'black',
      borderRightStyle: 'solid',
      borderRightWidth: `1px`,
      borderRightColor: 'black',
    });

    if (wfParams.fillParent || wfParams.scrollParent) {
      this.util.style(this.wrapper, {
        width: `${this.params.width}px`,
        overflowX: 'hidden',
        overflowY: 'hidden'
      });
    }

    this.wrapper.addEventListener('click', this._onWrapperClick);
  }

  render() {
    if (!this.wrapper) {
      this.createWrapper();
    }
    this.updateCanvases();
    this.updateCanvasesPositioning();
    this.renderCanvases();

    this.waveform.timexArray = _.clone(this.timexArray);
  }

  addCanvas() {
    const canvas = this.wrapper.appendChild(
      document.createElement('canvas')
    );
    this.canvases.push(canvas);
    this.util.style(canvas, {
      position: 'absolute',
      zIndex: 4
    });
  }

  removeCanvas() {
    const canvas = this.canvases.pop();
    canvas.parentElement.removeChild(canvas);
  }

  updateCanvases() {
    const totalWidth = Math.round(this.drawer.wrapper.scrollWidth);
    const requiredCanvases = Math.ceil(
      totalWidth / this.maxCanvasElementWidth
    );

    while (this.canvases.length < requiredCanvases) {
      this.addCanvas();
    }

    while (this.canvases.length > requiredCanvases) {
      this.removeCanvas();
    }
  }

  updateCanvasesPositioning() {
    // cache length for performance
    const canvasesLength = this.canvases.length;
    this.canvases.forEach((canvas, i) => {
      // canvas width is the max element width, or if it is the last the
      // required width
      const canvasWidth =
        i === canvasesLength - 1
          ? this.drawer.wrapper.scrollWidth -
            this.maxCanvasElementWidth * (canvasesLength - 1)
              : this.maxCanvasElementWidth;
              // set dimensions and style
              canvas.width = canvasWidth * this.pixelRatio;
              // on certain pixel ratios the canvas appears cut off at the bottom,
              // therefore leave 1px extra
              canvas.height = (this.params.height + 1) * this.pixelRatio;
              this.util.style(canvas, {
                width: `${canvasWidth}px`,
                height: `${this.params.height}px`,
                left: `${i * this.maxCanvasElementWidth}px`
              });
    });
  }

  renderCanvases() {
    const duration =
      this.waveform.timeline.params.duration ||
      this.waveform.backend.getDuration();

    if (duration <= 0) {
      return;
    }
    const wfParams = this.waveform.params;
    const fontSize = this.params.fontSize * wfParams.pixelRatio;
    const totalSeconds = parseInt(duration, 10) + 1;
    const width =
      wfParams.fillParent && !wfParams.scrollParent
        ? this.drawer.getWidth()
        : this.drawer.wrapper.scrollWidth * wfParams.pixelRatio;

        const height = this.params.height * this.pixelRatio;
        const height1 = parseInt(this.params.height * (this.params.notchPercentHeight/100)* this.pixelRatio);
        const height2 = parseInt(0.5 * height1);
        const pixelsPerSecond = width / duration;

        const formatTime = this.params.formatTimeCallback;
        // if parameter is function, call the function with
        // pixelsPerSecond, otherwise simply take the value as-is
        const intervalFnOrVal = option =>
        typeof option === 'function' ? option(pixelsPerSecond) : option;
        const timeInterval = intervalFnOrVal(this.params.timeInterval);
        const primaryLabelInterval = intervalFnOrVal(
          this.params.primaryLabelInterval
        );
        const secondaryLabelInterval = intervalFnOrVal(
          this.params.secondaryLabelInterval
        );

        console.log("===>timeInterval: ",timeInterval);
        console.log("==> primarylabelinterval: ", primaryLabelInterval, "  ", secondaryLabelInterval);

        let curPixel = pixelsPerSecond * this.params.offset;
        let curSeconds = 0;
        let i;
        // build an array of position data with index, second and pixel data,
        // this is then used multiple times below
        const positioning = [];

        for (i = 0; i < totalSeconds / timeInterval; i++) {
          positioning.push([i, curSeconds, curPixel]);
          curSeconds += timeInterval;
          curPixel += pixelsPerSecond * timeInterval;
        }

        // iterate over each position
        const renderPositions = cb => {
          positioning.forEach(pos => {
            cb(pos[0], pos[1], pos[2]);
          });
        };

        this.timexArray = [];
        // render primary labels
        this.setFillStyles(this.params.primaryColor);
        this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
        this.setFillStyles(this.params.primaryFontColor);
        renderPositions((i, curSeconds, curPixel) => {
          if (i % primaryLabelInterval === 0) {
            this.fillRect(curPixel, height-height1, 1, height1);

            if (curSeconds == 0) {
              this.fillText(
                formatTime(curSeconds, pixelsPerSecond),
                curPixel + this.params.labelPadding * this.pixelRatio,
                height1
              );
            } else {
              this.fillText(
                formatTime(curSeconds, pixelsPerSecond),
                curPixel - this.params.labelPadding * this.pixelRatio,
                height1
              );
            }

            this.timexArray.push({
                sec: curSeconds,
                offset: curPixel
              });
          }
        });
        //console.log("LLLLLLLLLLLMMMMMMMMMMMMMMMMMMMM:  ", this.timexArray);

        // render secondary labels
        this.setFillStyles(this.params.secondaryColor);
        this.setFonts(`${fontSize}px ${this.params.fontFamily}`);
        this.setFillStyles(this.params.secondaryFontColor);
        renderPositions((i, curSeconds, curPixel) => {
          if (i % secondaryLabelInterval === 0) {
            this.fillRect(curPixel, height-height1, 1, height1);

            if (curSeconds > 0) {
              this.fillText(
                formatTime(curSeconds, pixelsPerSecond),
                curPixel - this.params.labelPadding * this.pixelRatio,
                height1
              );
            }

            this.timexArray.push({
                sec: curSeconds,
                offset: curPixel
              });
          }
        });

        // render the actual notches (when no labels are used)
        this.setFillStyles(this.params.unlabeledNotchColor);
        renderPositions((i, curSeconds, curPixel) => {
          if (
            i % secondaryLabelInterval !== 0 &&
              i % primaryLabelInterval !== 0
          ) {
            this.fillRect(curPixel, height-height2, 1, height2);
          }
        });
  }

  setFillStyles(fillStyle) {
    this.canvases.forEach(canvas => {
      canvas.getContext('2d').fillStyle = fillStyle;
    });
  }

  setFonts(font) {
    this.canvases.forEach(canvas => {
      canvas.getContext('2d').font = font;
    });
  }

  fillRect(x, y, width, height) {
    this.canvases.forEach((canvas, i) => {
      const leftOffset = i * this.maxCanvasWidth;

      const intersection = {
        x1: Math.max(x, i * this.maxCanvasWidth),
        y1: y,
        x2: Math.min(x + width, i * this.maxCanvasWidth + canvas.width),
        y2: y + height
      };

      if (intersection.x1 < intersection.x2) {
        canvas
        .getContext('2d')
        .fillRect(
          intersection.x1 - leftOffset,
          intersection.y1,
          intersection.x2 - intersection.x1,
          intersection.y2 - intersection.y1
        );
      }
    });
  }

  fillText(text, x, y) {
    let textWidth;
    let xOffset = 0;

    this.canvases.forEach(canvas => {
      const context = canvas.getContext('2d');
      const canvasWidth = context.canvas.width;

      if (xOffset > x + textWidth) {
        return;
      }

      if (xOffset + canvasWidth > x) {
        textWidth = context.measureText(text).width;
        context.fillText(text, x - xOffset, y+6*this.pixelRatio);
      }

      xOffset += canvasWidth;
    });
  }

  defaultFormatTimeCallback(seconds, pxPerSec) {
    if (seconds / 60 > 1) {
      // calculate minutes and seconds from seconds count
      const minutes = parseInt(seconds / 60, 10);
      seconds = parseInt(seconds % 60, 10);
      // fill up seconds with zeroes
      seconds = seconds < 10 ? '0' + seconds : seconds;
      return `${minutes}:${seconds}`;
    }
    return Math.round(seconds * 1000) / 1000;
  }

  defaultTimeInterval(pxPerSec) {
    console.log("---------------------->", pxPerSec);
    if (pxPerSec >= 25) {
      return 1;
    } else if (pxPerSec * 5 >= 25) {
      return 5;
    } else if (pxPerSec * 15 >= 25) {
      return 15;
    }
    return Math.ceil(0.5 / pxPerSec) * 60;
  }

  defaultPrimaryLabelInterval(pxPerSec) {
    if (pxPerSec >= 25) {
      return 10;
    } else if (pxPerSec * 5 >= 25) {
      return 6;
    } else if (pxPerSec * 15 >= 25) {
      return 4;
    }
    return 4;
  }

  defaultSecondaryLabelInterval(pxPerSec) {
    if (pxPerSec >= 25) {
      return 5;
    } else if (pxPerSec * 5 >= 25) {
      return 2;
    } else if (pxPerSec * 15 >= 25) {
      return 2;
    }
    return 2;
  }
}
