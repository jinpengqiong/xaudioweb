import RectWrapper from './RectWrapper';
import WaveCanvas from './WaveCanvas';
import * as utils from './utils';

export default class WaveCanvasGroup extends RectWrapper {
  constructor(container, params) {
    super(container, params);

    this.maxCanvasWidth = params.maxCanvasWidth;
    this.maxCanvasElementWidth = Math.round(params.maxCanvasWidth / params.pixelRatio);
    this.hasProgressCanvas = params.waveColor != params.progressColor;
    this.halfPixel = 0.5 / params.pixelRatio;

    this.canvases = [];
    this.progressWave = null;

    this.overlap = 2 * Math.ceil(params.pixelRatio / 2);
  }

  init() {
    this.createWrapper();
    this.createElements();
  }

  createElements() {
    this.progressWave = this.wrapper.appendChild(
      this.style(document.createElement('wave'), {
      position: 'absolute',
      zIndex: 3,
      left: 0,
      top: 0,
      bottom: 0,
      overflow: 'hidden',
      width: '0',
      display: 'none',
      boxSizing: 'border-box',
      borderRightStyle: 'solid',
      pointerEvents: 'none'
    })
    );

    this.addCanvas();
    this.updateCursor();
  }

  updateCursor() {
    this.style(this.progressWave, {
      borderRightWidth: this.params.cursorWidth + 'px',
      borderRightColor: this.params.cursorColor
    });
  }

  updateSize() {
    const totalWidth = Math.round(this.width / this.params.pixelRatio);
    const requiredCanvases = Math.ceil(
      totalWidth / (this.maxCanvasElementWidth + this.overlap)
    );

    // add required canvases
    while (this.canvases.length < requiredCanvases) {
      this.addCanvas();
    }

    // remove older existing canvases, if any
    while (this.canvases.length > requiredCanvases) {
      this.removeCanvas();
    }

    let canvasWidth = this.maxCanvasWidth + this.overlap;
    const lastCanvas = this.canvases.length - 1;
    this.canvases.forEach((entry, i) => {
      if (i == lastCanvas) {
        canvasWidth = this.width - this.maxCanvasWidth * lastCanvas;
      }
      this.updateDimensions(entry, canvasWidth, this.height);

      entry.clearWave();
    });
  }

  addCanvas() {
    const entry = new WaveCanvas();
    entry.hasProgressCanvas = this.hasProgressCanvas;
    entry.halfPixel = this.halfPixel;
    const leftOffset = this.maxCanvasElementWidth * this.canvases.length;

    // wave
    entry.initWave(
      this.wrapper.appendChild(
        this.style(document.createElement('canvas'), {
      position: 'absolute',
      zIndex: 2,
      left: leftOffset + 'px',
      top: 0,
      bottom: 0,
      height: '100%',
      pointerEvents: 'none'
    })
    )
    );

    // progress
    if (this.hasProgressCanvas) {
      entry.initProgress(
        this.progressWave.appendChild(
          this.style(document.createElement('canvas'), {
        position: 'absolute',
        left: leftOffset + 'px',
        top: 0,
        bottom: 0,
        height: '100%'
      })
      )
      );
    }

    this.canvases.push(entry);
  }

  removeCanvas() {
    let lastEntry = this.canvases[this.canvases.length - 1];

    // wave
    lastEntry.wave.parentElement.removeChild(lastEntry.wave);

    // progress
    if (this.hasProgressCanvas) {
      lastEntry.progress.parentElement.removeChild(lastEntry.progress);
    }

    // cleanup
    if (lastEntry) {
      lastEntry.destroy();
      lastEntry = null;
    }

    this.canvases.pop();
  }

  updateDimensions(entry, width, height) {
    const elementWidth = Math.round(width / this.params.pixelRatio);
    const totalWidth = Math.round(this.width / this.params.pixelRatio);

    // update canvas dimensions
    entry.updateDimensions(elementWidth, totalWidth, width, height);

    // style element
    this.style(this.progressWave, { display: 'block' });
  }

  clearWave() {
    this.canvases.forEach(entry => entry.clearWave());
  }

  drawPeaks(peaks, length, start, end) {
    if (!this.setWidth(length)) {
      this.clearWave();
    }

    this.params.barWidth
      ? this.drawBars(peaks, 0, start, end)
      : this.drawWave(peaks, 0, start, end);
  }

  drawBars(peaks, channelIndex, start, end) {
    return this.prepareDraw(
      peaks,
      channelIndex,
      start,
      end,
      ({ absmax, hasMinVals, height, offsetY, halfH, peaks }) => {
        // if drawBars was called within ws.empty we don't pass a start and
        // don't want anything to happen
        if (start === undefined) {
          return;
        }
        // Skip every other value if there are negatives.
        const peakIndexScale = hasMinVals ? 2 : 1;
        const length = peaks.length / peakIndexScale;
        const bar = this.params.barWidth * this.params.pixelRatio;
        const gap =
          this.params.barGap === null
            ? Math.max(this.params.pixelRatio, ~~(bar / 2))
            : Math.max(
              this.params.pixelRatio,
              this.params.barGap * this.params.pixelRatio
            );
            const step = bar + gap;

            const scale = length / this.width;
            const first = start;
            const last = end;
            let i = first;

            for (i; i < last; i += step) {
              const peak =
                peaks[Math.floor(i * scale * peakIndexScale)] || 0;
              const h = Math.round((peak / absmax) * halfH);
              this.fillRect(
                i + this.halfPixel,
                halfH - h + offsetY,
                bar + this.halfPixel,
                h * 2
              );
            }
      }
    );
  }

  drawWave(peaks, channelIndex, start, end) {
    return this.prepareDraw(
      peaks,
      channelIndex,
      start,
      end,
      ({ absmax, hasMinVals, height, offsetY, halfH, peaks }) => {
        if (!hasMinVals) {
          const reflectedPeaks = [];
          const len = peaks.length;
          let i = 0;
          for (i; i < len; i++) {
            reflectedPeaks[2 * i] = peaks[i];
            reflectedPeaks[2 * i + 1] = -peaks[i];
          }
          peaks = reflectedPeaks;
        }

        // if drawWave was called within ws.empty we don't pass a start and
        // end and simply want a flat line
        if (start !== undefined) {
          this.drawLine(peaks, absmax, halfH, offsetY, start, end);
        }

        // always draw a median line
        this.fillRect(
          0,
          halfH + offsetY - this.halfPixel,
          this.width,
          this.halfPixel
        );
      }
    );
  }

  drawLine(peaks, absmax, halfH, offsetY, start, end) {
    this.canvases.forEach(entry => {
      this.setFillStyles(entry);
      entry.drawLines(peaks, absmax, halfH, offsetY, start, end);
    });
  }

  fillRect(x, y, width, height) {
    const startCanvas = Math.floor(x / this.maxCanvasWidth);
    const endCanvas = Math.min(
      Math.ceil((x + width) / this.maxCanvasWidth) + 1,
      this.canvases.length
    );
    let i = startCanvas;
    for (i; i < endCanvas; i++) {
      const entry = this.canvases[i];
      const leftOffset = i * this.maxCanvasWidth;

      const intersection = {
        x1: Math.max(x, i * this.maxCanvasWidth),
        y1: y,
        x2: Math.min(
          x + width,
          i * this.maxCanvasWidth + entry.wave.width
        ),
        y2: y + height
      };

      if (intersection.x1 < intersection.x2) {
        this.setFillStyles(entry);

        entry.fillRects(
          intersection.x1 - leftOffset,
          intersection.y1,
          intersection.x2 - intersection.x1,
          intersection.y2 - intersection.y1
        );
      }
    }
  }

  prepareDraw(peaks, channelIndex, start, end, fn) {
    return utils.frame(() => {
      // Split channels and call this function with the channelIndex set
      if (peaks[0] instanceof Array) {
        const channels = peaks;
        if (this.params.splitChannels) {
          this.setHeight(
            channels.length *
            this.params.height *
            this.params.pixelRatio
          );
          return channels.forEach((channelPeaks, i) =>
                                  this.prepareDraw(channelPeaks, i, start, end, fn)
                                 );
        }
        peaks = channels[0];
      }
      // calculate maximum modulation value, either from the barHeight
      // parameter or if normalize=true from the largest value in the peak
      // set
      let absmax = 1 / this.params.barHeight;
      if (this.params.normalize) {
        const max = util.max(peaks);
        const min = util.min(peaks);
        absmax = -min > max ? -min : max;
      }

      // Bar wave draws the bottom only as a reflection of the top,
      // so we don't need negative values
      const hasMinVals = [].some.call(peaks, val => val < 0);
      const height = this.params.height * this.params.pixelRatio;
      const offsetY = height * channelIndex || 0;
      const halfH = height / 2;

      return fn({
        absmax: absmax,
        hasMinVals: hasMinVals,
        height: height,
        offsetY: offsetY,
        halfH: halfH,
        peaks: peaks
      });
    })();
  }

  setFillStyles(entry) {
    entry.setFillStyles(this.params.waveColor, this.params.progressColor);
  }

  getImage(format, quality, type) {
    if (type === 'blob') {
      return Promise.all(
        this.canvases.map(entry => {
        return entry.getImage(format, quality, type);
      })
      );
    } else if (type === 'dataURL') {
      let images = this.canvases.map(entry =>
                                     entry.getImage(format, quality, type)
                                    );
                                    return images.length > 1 ? images : images[0];
    }
  }

  updateProgress(position) {
    this.style(this.progressWave, { width: position + 'px' });
  }
}
