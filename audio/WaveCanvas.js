import style from '../utils/style';
import getId from '../utils/getid';

export default class WaveCanvas {
  constructor() {
    this.wave = null;
    this.waveCtx = null;
    this.progress = null;
    this.progressCtx = null;

    this.start = 0;
    this.end = 1;

    this.id = getId(this.constructor.name.toLowerCase() + '_');
  }

  initWave(element) {
    this.wave = element;
    this.waveCtx = this.wave.getContext('2d');
  }

  initProgress(element) {
    this.progress = element;
    this.progressCtx = this.progress.getContext('2d');
  }

  updateDimensions(elementWidth, totalWidth, width, height) {
    // where the canvas starts and ends in the waveform, represented as a
    // decimal between 0 and 1
    this.start = this.wave.offsetLeft / totalWidth || 0;
    this.end = this.start + elementWidth / totalWidth;

    // set wave canvas dimensions
    this.wave.width = width;
    this.wave.height = height;
    let elementSize = { width: elementWidth + 'px' };
    style(this.wave, elementSize);

    if (this.hasProgressCanvas) {
      // set progress canvas dimensions
      this.progress.width = width;
      this.progress.height = height;
      style(this.progress, elementSize);
    }
  }

  clearWave() {
    // wave
    this.waveCtx.clearRect(0, 0, this.waveCtx.canvas.width, this.waveCtx.canvas.height);

    // progress
    if (this.hasProgressCanvas) {
      this.progressCtx.clearRect(0, 0, this.progressCtx.canvas.width, this.progressCtx.canvas.height);
    }
  }

  setFillStyles(waveColor, progressColor) {
    this.waveCtx.fillStyle = waveColor;

    if (this.hasProgressCanvas) {
      this.progressCtx.fillStyle = progressColor;
    }
  }

  fillRects(x, y, width, height) {
    this.fillRectToContext(this.waveCtx, x, y, width, height);

    if (this.hasProgressCanvas) {
      this.fillRectToContext(this.progressCtx, x, y, width, height);
    }
  }

  fillRectToContext(ctx, x, y, width, height) {
    if (!ctx) {
      return;
    }
    ctx.fillRect(x, y, width, height);
  }

  drawLines(peaks, absmax, halfH, offsetY, start, end) {
    this.drawLineToContext(this.waveCtx, peaks, absmax, halfH, offsetY, start, end);

    if (this.hasProgressCanvas) {
      this.drawLineToContext(this.progressCtx, peaks, absmax, halfH, offsetY, start, end);
    }
  }

  drawLineToContext(ctx, peaks, absmax, halfH, offsetY, start, end) {
    if (!ctx) {
      return;
    }

    const length = peaks.length / 2;
    const first = Math.round(length * this.start);

    // use one more peak value to make sure we join peaks at ends -- unless,
    // of course, this is the last canvas
    const last = Math.round(length * this.end) + 1;

    const canvasStart = first;
    const canvasEnd = last;
    const scale = this.wave.width / (canvasEnd - canvasStart - 1);

    // optimization
    const halfOffset = halfH + offsetY;
    const absmaxHalf = absmax / halfH;

    ctx.beginPath();
    ctx.moveTo((canvasStart - first) * scale, halfOffset);

    ctx.lineTo(
      (canvasStart - first) * scale,
      halfOffset - Math.round((peaks[2 * canvasStart] || 0) / absmaxHalf)
    );

    let i, peak, h;
    for (i = canvasStart; i < canvasEnd; i++) {
      peak = peaks[2 * i] || 0;
      h = Math.round(peak / absmaxHalf);
      ctx.lineTo((i - first) * scale + this.halfPixel, halfOffset - h);
    }

    // draw the bottom edge going backwards, to make a single
    // closed hull to fill
    let j = canvasEnd - 1;
    for (j; j >= canvasStart; j--) {
      peak = peaks[2 * j + 1] || 0;
      h = Math.round(peak / absmaxHalf);
      ctx.lineTo((j - first) * scale + this.halfPixel, halfOffset - h);
    }

    ctx.lineTo(
      (canvasStart - first) * scale,
      halfOffset -
        Math.round((peaks[2 * canvasStart + 1] || 0) / absmaxHalf)
    );

    ctx.closePath();
    ctx.fill();
  }

  destroy() {
    this.waveCtx = null;
    this.wave = null;

    this.progressCtx = null;
    this.progress = null;
  }

  getImage(format, quality, type) {
    if (type === 'blob') {
      return new Promise(resolve => {
        this.wave.toBlob(resolve, format, quality);
      });
    } else if (type === 'dataURL') {
      return this.wave.toDataURL(format, quality);
    }
  }
}
