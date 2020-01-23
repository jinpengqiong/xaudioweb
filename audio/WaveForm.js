import * as utils from '../utils';
import WebAudio from './WebAudio';
import WaveCanvasGroup from './WaveCanvasGroup';
import PeakCache from './PeakCache';
import * as _ from 'lodash';


class PluginClass {
    create(params) {}
    constructor(params, ws) {}
    init() {}
    destroy() {}
}

export default class WaveForm extends utils.Observer {
  defaultParams = {
    enableResize: false,
    audioContext: null,
    audioScriptProcessor: null,
    audioRate: 1,
    autoCenter: true,
    backgroundColor: null,
    barHeight: 1,
    barGap: null,
    container: null,
    cursorColor: 'red', //'#333',
    cursorWidth: 1,
    dragSelection: true,
    duration: null,
    fillParent: true,
    forceDecode: false,
    height: 256,
    hideScrollbar: false,
    interact: true,
    loopSelection: true,
    maxCanvasWidth: 4000,
    minPxPerSec: 20,
    normalize: false,
    partialRender: false,
    pixelRatio: window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI,
    plugins: [],
    progressColor: '#555',
    responsive: false,
    rtl: false,
    scrollParent: false,
    skipLength: 2,
    splitChannels: false,
    waveColor: '#999',
    xhr: {}
  };

  static create(params) {
    const waveform = new WaveForm(params);
    return waveform.init();
  }


  util = utils;

  static util = utils;


  constructor(params) {
    super();

    this.params = utils.extend({}, this.defaultParams, params);

    /** @private */
    this.container =
      'string' == typeof params.container
        ? document.querySelector(this.params.container)
        : this.params.container;

        if (!this.container) {
          throw new Error('Container element not found');
        }

        if (this.params.maxCanvasWidth <= 1) {
          throw new Error('maxCanvasWidth must be greater than 1');
        } else if (this.params.maxCanvasWidth % 2 == 1) {
          throw new Error('maxCanvasWidth must be an even number');
        }

        if (this.params.rtl === true) {
          utils.style(this.container, { transform: 'rotateY(180deg)' });
        }

        //when set backgroud, set width also
        if (this.params.backgroundColor) {
          this.setBackgroundColor(this.params.backgroundColor);
        }

        this.savedVolume = 0;
        this.isMuted = false;

        //Will hold a list of event descriptors that need to be canceled on subsequent loads of audio
        this.tmpEvents = [];

        //Holds any running audio downloads
        this.currentRequest = null;

        this.arraybuffer = null;
        this.drawer = null;
        this.backend = null;
        this.peakCache = null;

        // cache constructor objects
        this.Drawer = WaveCanvasGroup; 
        this.Backend = WebAudio;

        this.initialisedPluginList = {};
        this.isDestroyed = false;

        this.isReady = false;

        //resize params
        this.resizeHeight = 7;


        //db array
        this.dbyArray = [];
        this.timexArray = [];

        //file info
        this.fileName = "";
        this.fileSize = 0;
        this.fileDecodeSize = 0;
        this.fileDuration = 0;
        this.fileSampleRate = 0;
        this.fileChannels = 0;
        this.fileBitsPerSample = 0;

        //rebegin time
        this.rebeginTime = 0;
        
        // responsive debounced event listener. If this.params.responsive is not
        // set, this is never called. Use 100ms or this.params.responsive as
        // timeout for the debounce function.
        let prevWidth = 0;

        this._onResize = utils.debounce(
          () => {
          if (
            prevWidth != this.drawer.wrapper.clientWidth &&
              !this.params.scrollParent
          ) {
            this.resizeAll();

            prevWidth = this.drawer.wrapper.clientWidth;
            this.drawer.fireEvent('redraw');
          }
        },
        typeof this.params.responsive === 'number'
          ? this.params.responsive
          : 100
        );

        this._onResize2 = (() => {
          this.resizeAll();
        });


        return this;
  }

  init() {
    this.registerPlugins(this.params.plugins);


    this.createDrawer();
    this.createBackend();
    this.createPeakCache();

    this.createResizeCross();
    this.renderResizeCross();

    //must resize container here, for should style this container with posistion
    //then the resize bar can position ok
    this.resizeContainer();

    if (this.params.enableResize)
      this.bindResizeEvents();

    return this;
  }

  registerPlugins(plugins) {
    plugins.forEach(plugin => this.addPlugin(plugin));

    plugins.forEach(plugin => {
      //console.log("===========> ", plugin.name, '   ', plugin.deferInit);
      if (!plugin.deferInit) {
        this.initPlugin(plugin.name);
      }
    });
    this.fireEvent('plugins-registered', plugins);
    return this;
  }

  getActivePlugins() {
    return this.initialisedPluginList;
  }

  addPlugin(plugin) {
    if (!plugin.name) {
      throw new Error('Plugin does not have a name!');
    }
    if (!plugin.instance) {
      throw new Error(
        `Plugin ${plugin.name} does not have an instance property!`
      );
    }

    if (plugin.staticProps) {
      Object.keys(plugin.staticProps).forEach(pluginStaticProp => {
        this[pluginStaticProp] = plugin.staticProps[pluginStaticProp];
      });
    }

    const Instance = plugin.instance;

    //turn plugin instance into a observer
    const observerPrototypeKeys = Object.getOwnPropertyNames(
      utils.Observer.prototype
    );
    observerPrototypeKeys.forEach(key => {
      Instance.prototype[key] = utils.Observer.prototype[key];
    });

    this[plugin.name] = new Instance(plugin.params || {}, this);
    this.fireEvent('plugin-added', plugin.name);
    return this;
  }

  initPlugin(name) {
    if (!this[name]) {
      throw new Error(`Plugin ${name} has not been added yet!`);
    }
    if (this.initialisedPluginList[name]) {
      // destroy any already initialised plugins
      this.destroyPlugin(name);
    }
    this[name].init();
    this.initialisedPluginList[name] = true;
    this.fireEvent('plugin-initialised', name);
    return this;
  }

  destroyPlugin(name) {
    if (!this[name]) {
      throw new Error(
        `Plugin ${name} has not been added yet and cannot be destroyed!`
      );
    }
    if (!this.initialisedPluginList[name]) {
      throw new Error(
        `Plugin ${name} is not active and cannot be destroyed!`
      );
    }
    if (typeof this[name].destroy !== 'function') {
      throw new Error(`Plugin ${name} does not have a destroy function!`);
    }

    this[name].destroy();
    delete this.initialisedPluginList[name];
    this.fireEvent('plugin-destroyed', name);
    return this;
  }

  destroyAllPlugins() {
    Object.keys(this.initialisedPluginList).forEach(name => this.destroyPlugin(name));
  }


  createDrawer() {
    this.drawer = new this.Drawer(this.container, this.params);
    this.drawer.init();
    this.fireEvent('drawer-created', this.drawer);

    if (this.params.responsive !== false) {
      window.addEventListener('resize', this._onResize, true);
      window.addEventListener('orientationchange', this._onResize, true);
    }

    this.drawer.on('redraw', () => {
      this.drawBuffer(true);
      this.drawer.progress(this.backend.getPlayedPercents());
    });

    // Click-to-seek
    this.drawer.on('click', (e, progress) => {
      setTimeout(() => this.seekTo(progress), 0);
    });

    // Relay the scroll event from the drawer
    this.drawer.on('scroll', e => {
      if (this.params.partialRender) {
        this.drawBuffer(true);
      }
      this.fireEvent('scroll', e);
    });
  }

  getViewStartTime() {
    let scrollLeft = this.drawer.getScrollX() / this.params.pixelRatio;

    return (scrollLeft / this.drawer.wrapper.scrollWidth) * (this.backend.getDuration());
  }

  getViewEndTime() {
    let scrollRight = (this.drawer.getScrollX() / this.params.pixelRatio) + this.drawer.wrapper.clientWidth;
    let duration = this.backend.getDuration();

    return Math.min(duration, (scrollRight / this.drawer.wrapper.scrollWidth) * (duration));
  }

  resizeContainer() {
    let chn = this.getNumOfChannels();
    let height = chn * this.params.height;

    //must set position value!!!!
    if (this.params.width)
      utils.style(this.container, { 
        position: 'relative',
        background: this.params.backgroundColor, 
        width: this.params.width+'px', 
        height: height+'px'
      });
    else
      utils.style(this.container, { 
        position: 'relative',
        background: this.params.backgroundColor, 
        height: height+'px'
      });

    return {
      name: 'waveform-wrapper',
      width: this.params.width,
      height: height
    };
    
  }

  setDbyArray(dbyArray) {
    this.dbyArray = _.clone(dbyArray);
  }

  resizeAndDrawAll() {
    let size;
    
    //when container update, resize immediatly to relative plugins, then draw buffer, for maybe
    //need update some value such as dbyArray by plugins, so draw buffer later
    size = this.resizeContainer();
    this.fireEvent('resize', size);

    this.renderResizeCross();
    this.renderWavbuffer();

    return size;
  }

  resizeAll() {
    this.resizeAndDrawAll();
  }


  createBackend() {
    if (this.backend) {
      this.backend.destroy();
    }

    this.backend = new this.Backend(this.params);
    this.backend.init();
    this.fireEvent('backend-created', this.backend);

    this.backend.on('finish', () => {
      this.drawer.progress(this.backend.getPlayedPercents());
      this.fireEvent('finish');
    });
    this.backend.on('play', () => this.fireEvent('play'));
    this.backend.on('pause', () => this.fireEvent('pause'));

    this.backend.on('audioprocess', time => {
      //console.log("current scroll left time: ", time, ",   ",  (this.drawer.getScrollX()/(2*this.drawer.wrapper.scrollWidth))*(this.backend.getDuration()));
      this.drawer.progress(this.backend.getPlayedPercents());

      //time > viewEndTime need rebegin, but is scrollLeft+clientWidth must > currenttime, is small means we scroll the bar
      //use rebeginTime can avoid scroll to switch view, when scroll, the viewEndTime < rebgeinTime, so is will now switchview
      if (time >= this.getViewEndTime() && this.rebeginTime < this.getViewEndTime()) {
        let pos = this.backend.getPlayedPercents()*this.drawer.wrapper.scrollWidth;
        this.drawer.rebeginOnPosition(pos, true);
      }
      this.rebeginTime = time;

      this.fireEvent('audioprocess', time);
    });

    this.backend.on('audioprocessdata', e => {
      this.fireEvent('audioprocessdata', e);
    });

    this.backend.on('audioprocessdata_split', e => {
      this.fireEvent('audioprocessdata_split', e);
    });


  }

  createPeakCache() {
    if (this.params.partialRender) {
      this.peakCache = new PeakCache();
    }
  }

  createResizeCross() {
    this.handleRowResize = this.container.appendChild(
    //this.handleRowResize = this.drawer.wrapper.appendChild(
      document.createElement('handle')
    );
    this.handleRowResize.className = 'waveform-cross-handle waveform-cross-handle-row';
  }

  //for drawer wrapper need draw all waves
  //so we need use fixed position to place the resize cross bar
  //
  //and this bar need relative change by the waveform wrapper change
  renderResizeCross() {
    let chn = this.getNumOfChannels();
    let top = chn * this.params.height;

    let wrapperRect = this.drawer.wrapper.getBoundingClientRect();

    let cssRow = {
      //cursor: 'row-resize',
      position: 'absolute',
      left: `0px`,
      top: `${top}px`, // border 1 px, so from -1 offset px
      width: `${this.params.width}px`,
      height: `${this.resizeHeight}px`,
      backgroundColor: 'rgb(49,49,49)',
      //backgroundColor: 'red',
      zIndex: 8 
    };

    if (this.params.enableResize)
      cssRow.cursor = 'row-resize';

    this.util.style(this.handleRowResize, cssRow);
  }

  renderWavbuffer() {
    this.drawBuffer(false);
    this.drawer.progress(this.backend.getPlayedPercents());
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
        wrapperRect = this.container.getBoundingClientRect();

        if (e.target.tagName.toLowerCase() == 'handle') {
          if (e.target.classList.contains( 'waveform-cross-handle-row')) {
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
          let chn = this.getNumOfChannels();

          this.params.height = parseInt(newHeight/chn);
          this._onResize2();
        }
      };

      this.container.addEventListener('mousedown', onDown);
      this.container.addEventListener('touchstart', onDown);

      //this.wrapper.addEventListener('mousemove', onMove);
      document.body.addEventListener('mousemove', onMove);
      document.body.addEventListener('touchmove', onMove);

      document.body.addEventListener('mouseup', onUp);
      document.body.addEventListener('touchend', onUp);

      this.on('remove', () => {
        document.body.removeEventListener('mouseup', onUp);
        document.body.removeEventListener('touchend', onUp);
        this.container.removeEventListener('mousemove', onMove);
        this.container.removeEventListener('touchmove', onMove);
      });

    })();


  }



  getDuration() {
    return this.backend.getDuration();
  }

  getCurrentTime() {
    return this.backend.getCurrentTime();
  }

  setCurrentTime(seconds) {
    if (seconds >= this.getDuration()) {
      this.seekTo(1);
    } else {
      this.seekTo(seconds / this.getDuration());
    }
  }

  play(start, end) {
    this.fireEvent('interaction', () => this.play(start, end));

    this.rebeginTime = this.backend.getCurrentTime();

    return this.backend.play(start, end);
  }

  pause() {
    if (!this.backend.isPaused()) {
      return this.backend.pause();
    }
  }

  playPause() {
    return this.backend.isPaused() ? this.play() : this.pause();
  }

  isPlaying() {
    return !this.backend.isPaused();
  }

  skipBackward(seconds) {
    this.skip(-seconds || -this.params.skipLength);
  }

  skipForward(seconds) {
    this.skip(seconds || this.params.skipLength);
  }

  skip(offset) {
    const duration = this.getDuration() || 1;
    let position = this.getCurrentTime() || 0;
    position = Math.max(0, Math.min(duration, position + (offset || 0)));
    this.seekAndCenter(position / duration);
  }

  seekAndCenter(progress) {
    this.seekTo(progress);
    this.drawer.recenter(progress);
  }

  seekTo(progress) {
    // return an error if progress is not a number between 0 and 1
    if (
      typeof progress !== 'number' ||
        !isFinite(progress) ||
          progress < 0 ||
            progress > 1
    ) {
      throw new Error(
        'Error calling waveform.seekTo, parameter must be a number between 0 and 1!'
      );
    }
    this.fireEvent('interaction', () => this.seekTo(progress));

    const paused = this.backend.isPaused();
    // avoid draw wrong position while playing backward seeking
    if (!paused) {
      this.backend.pause();
    }
    // avoid small scrolls while paused seeking
    const oldScrollParent = this.params.scrollParent;
    this.params.scrollParent = false;
    this.backend.seekTo(progress * this.getDuration());
    this.drawer.progress(progress);

    if (!paused) {
      this.backend.play();
    }
    this.params.scrollParent = oldScrollParent;

    this.fireEvent('seek', progress);
    console.log("uuuuuuuuuuuuuuuuuuuuuuuuuuu");
  }

  stop() {
    this.pause();
    this.seekTo(0);
    this.drawer.progress(0);
    this.fireEvent('stop');
  }

  setSinkId(deviceId) {
    return this.backend.setSinkId(deviceId);
  }

  setVolume(newVolume) {
    this.backend.setVolume(newVolume);
    this.fireEvent('volume', newVolume);
  }

  getVolume() {
    return this.backend.getVolume();
  }

  setPlaybackRate(rate) {
    this.backend.setPlaybackRate(rate);
  }

  getPlaybackRate() {
    return this.backend.getPlaybackRate();
  }

  toggleMute() {
    this.setMute(!this.isMuted);
  }

  setMute(mute) {
    // ignore all muting requests if the audio is already in that state
    if (mute === this.isMuted) {
      this.fireEvent('mute', this.isMuted);
      return;
    }

    if (mute) {
      // If currently not muted then save current volume,
      // turn off the volume and update the mute properties
      this.savedVolume = this.backend.getVolume();
      this.backend.setVolume(0);
      this.isMuted = true;
      this.fireEvent('volume', 0);
    } else {
      // If currently muted then restore to the saved volume
      // and update the mute properties
      this.backend.setVolume(this.savedVolume);
      this.isMuted = false;
      this.fireEvent('volume', this.savedVolume);
    }
    this.fireEvent('mute', this.isMuted);
  }

  getMute() {
    return this.isMuted;
  }

  getFilters() {
    return this.backend.filters || [];
  }

  toggleScroll() {
    this.params.scrollParent = !this.params.scrollParent;
    this.drawBuffer(true);
  }

  toggleInteraction() {
    this.params.interact = !this.params.interact;
  }

  getWaveColor() {
    return this.params.waveColor;
  }

  setWaveColor(color) {
    this.params.waveColor = color;
    this.drawBuffer(true);
  }

  getProgressColor() {
    return this.params.progressColor;
  }

  setProgressColor(color) {
    this.params.progressColor = color;
    this.drawBuffer(true);
  }

  getBackgroundColor() {
    return this.params.backgroundColor;
  }

  setBackgroundColor(color) {
    this.params.backgroundColor = color;

    if (this.params.width)
      utils.style(this.container, { background: this.params.backgroundColor , width: this.params.width+'px'});
    else
      utils.style(this.container, { background: this.params.backgroundColor});
  }

  getCursorColor() {
    return this.params.cursorColor;
  }

  setCursorColor(color) {
    this.params.cursorColor = color;
    this.drawer.updateCursor();
  }

  getHeight() {
    return this.params.height;
  }

  getNumOfChannels() {
    return this.backend.getNumOfChannels();
  }

  //for this.params.height in rectwraaper is the one channel height 
  //so after load audio, we should readjust the params height by real
  //rect range
  adjustHeight() {
    let wrapperRect = this.container.getBoundingClientRect();
    let newHeight = wrapperRect.bottom - wrapperRect.top;
    let chn = this.getNumOfChannels();

    this.params.height = parseInt(newHeight/chn);
  }

  setHeight(height) {
    let chn = this.getNumOfChannels();
    this.params.height = height;

    if (chn == 1) {
      this.params.height = height;
    } else {
      this.params.height = parseInt(height/chn);
    }

    this.drawer.setHeight(this.params.height * this.params.pixelRatio);
    this.drawBuffer(false);
  }

  drawBuffer(useFrame) {
    const nominalWidth = Math.round(
      this.getDuration() *
      this.params.minPxPerSec *
      this.params.pixelRatio
    );
    const parentWidth = this.drawer.getWidth();
    let width = nominalWidth;
    // always start at 0 after zooming for scrolling : issue redraw left part
    let start = 0;
    let end = Math.max(start + parentWidth, width);
    // Fill container
    if (
      this.params.fillParent &&
        (!this.params.scrollParent || nominalWidth < parentWidth)
    ) {
      width = parentWidth;
      start = 0;
      end = width;
    }

    let peaks;
    if (this.params.partialRender) {
      const newRanges = this.peakCache.addRangeToPeakCache(
        width,
        start,
        end
      );
      let i;
      for (i = 0; i < newRanges.length; i++) {
        peaks = this.backend.getPeaks(
          width,
          newRanges[i][0],
          newRanges[i][1]
        );

        if (useFrame) {
          this.drawer.updateGridHeight(this.dbyArray);
          this.drawer.drawPeaks2( peaks, width, newRanges[i][0], newRanges[i][1]);
        } else {
          this.drawer.updateGridHeight(this.dbyArray);
          this.drawer.drawPeaks2( peaks, width, newRanges[i][0], newRanges[i][1]);
        }
      }
    } else {
      peaks = this.backend.getPeaks(width, start, end);
      if (useFrame) {
        this.drawer.updateGridHeight(this.dbyArray);
        this.drawer.drawPeaks2(peaks, width, start, end);
      } else {
        this.drawer.updateGridHeight(this.dbyArray);
        this.drawer.drawPeaks2(peaks, width, start, end);
      }
    }

    this.fireEvent('redraw', peaks, width);
  }


  _zoom(pxPerSec) {
    if (!pxPerSec) {
      this.params.minPxPerSec = this.defaultParams.minPxPerSec;
      this.params.scrollParent = false;
    } else {
      this.params.minPxPerSec = pxPerSec;
      this.params.scrollParent = true;
    }

    this.drawBuffer(true);
    this.drawer.progress(this.backend.getPlayedPercents());
  }

  zoom(pxPerSec) {
    this._zoom(pxPerSec)

    this.drawer.recenter(this.getCurrentTime() / this.getDuration());
    this.fireEvent('zoom', pxPerSec);
  }

  zoomLeft(pxPerSec) {
    this._zoom(pxPerSec)

    if (this.section.section) {
      this.drawer.recenter(this.section.getStartTime() / this.getDuration());
    } else {
      this.drawer.recenter(this.getCurrentTime() / this.getDuration());
    }

    this.fireEvent('zoom', pxPerSec);
  }

  zoomRight(pxPerSec) {
    this._zoom(pxPerSec)

    if (this.section.section) {
      this.drawer.recenter(this.section.getEndTime() / this.getDuration());
    } else {
      this.drawer.recenter(this.getCurrentTime() / this.getDuration());
    }

    this.fireEvent('zoom', pxPerSec);
  }

  zoomSelection() {
    let start = this.section.getStartTime();
    let end = this.section.getEndTime();

    let width = this.drawer.wrapper.clientWidth;
    let pxPerSec = width / (end-start)

    this._zoom(pxPerSec)

    this.drawer.recenter((this.section.getStartTime()+(end-start)/2) / this.getDuration());
  }


  loadArrayBuffer(arraybuffer) {
    this.decodeArrayBuffer(arraybuffer, data => {
      if (!this.isDestroyed) {
        this.loadDecodedBuffer(data);
      }
    });
  }

  loadDecodedBuffer(buffer) {
    console.log("22222222222222222: ",buffer);
    this.fileDecodeSize = buffer.length;
    this.fileDuration = buffer.duration;
    this.fileSampleRate = buffer.sampleRate;
    this.fileChannels = buffer.numberOfChannels;

    this.backend.load(buffer)
    .then(renderBuffer => {
      //adjust up to the channels of audio
      this.adjustHeight();

      this.isReady = true;
      this.fireEvent('ready');

      //update timexline in drawer to draw time/db grid
      this.drawer.updateGridWidth(this.timexArray);
      this.drawBuffer(true);

    });
  }

  loadBlob(blob) {
    this.fileName = blob.name;
    this.fileSize = blob.size;


    // Create file reader
    const reader = new FileReader();
    reader.addEventListener('progress', e => this.onProgress(e));
    reader.addEventListener('load', e => this.loadArrayBuffer(e.target.result));
    reader.addEventListener('error', () => this.fireEvent('error', 'Error reading file'));
    reader.readAsArrayBuffer(blob);
    this.empty();
  }

  load(url, peaks, duration) {
    this.empty();
    return this.loadBuffer(url, peaks, duration);
  }

  loadBuffer(url, peaks, duration) {
    const load = action => {
      if (action) {
        this.tmpEvents.push(this.once('ready', action));
      }
      return this.getArrayBuffer(url, data => this.loadArrayBuffer(data));
    };

    if (peaks) {
      this.backend.setPeaks(peaks, duration);
      this.drawBuffer(true);
      this.tmpEvents.push(this.once('interaction', load));
    } else {
      return load();
    }
  }

  decodeArrayBuffer(arraybuffer, callback) {
    this.arraybuffer = arraybuffer;
    this.backend.decodeArrayBuffer(
      arraybuffer,
      data => {
        // Only use the decoded data if we haven't been destroyed or
        // another decode started in the meantime
        if (!this.isDestroyed && this.arraybuffer == arraybuffer) {
          callback(data);
          this.arraybuffer = null;
        }
      },
      () => this.fireEvent('error', 'Error decoding audiobuffer')
    );
  }

  getArrayBuffer(url, callback) {
    let options = utils.extend({
      url: url,
      responseType: 'arraybuffer'
    }, this.params.xhr);

    const request = utils.fetchFile(options);

    this.currentRequest = request;

    this.tmpEvents.push(
      request.on('progress', e => { this.onProgress(e); }),
      request.on('success', data => { callback(data); this.currentRequest = null; }),
      request.on('error', e => { this.fireEvent('error', 'fetch error: ' + e.message); this.currentRequest = null; })
    );

    return request;
  }

  onProgress(e) {
    let percentComplete;
    if (e.lengthComputable) {
      percentComplete = e.loaded / e.total;
    } else {
      // Approximate progress with an asymptotic
      // function, and assume downloads in the 1-3 MB range.
      percentComplete = e.loaded / (e.loaded + 1000000);
    }
    this.fireEvent('loading', Math.round(percentComplete * 100), e.target);
  }

  exportPCM(length, accuracy, noWindow, start) {
    length = length || 1024;
    start = start || 0;
    accuracy = accuracy || 10000;
    noWindow = noWindow || false;
    const peaks = this.backend.getPeaks(length, start);
    const arr = [].map.call(
      peaks,
      val => Math.round(val * accuracy) / accuracy
    );
    const json = JSON.stringify(arr);
    if (!noWindow) {
      window.open(
        'data:application/json;charset=utf-8,' +
        encodeURIComponent(json)
      );
    }
    return json;
  }

  exportImage(format, quality, type) {
    if (!format) {
      format = 'image/png';
    }
    if (!quality) {
      quality = 1;
    }
    if (!type) {
      type = 'dataURL';
    }

    return this.drawer.getImage(format, quality, type);
  }

  exportRenderBuffer() {
    //console.log("11111111111: ", this.backend);
    this.backend.exportRenderBuffer()
  }

  cutDelete() {
    let start = this.section.getStartTime();
    let end = this.section.getEndTime();

    this.backend.cutDelete(start, end)
    .then(renderBuffer => {
      this.drawBuffer(true);
      this.section.clear();
      //this.fireEvent('ready');
      //this.isReady = true;
    });

  }

  recoverAction() {
    this.backend.recoverAction()
    .then(result => {
      if (!result.action)
        return;

      if (result.action.cmd == "cutDelete") {
        this.section.clear();
        this.section.add({
          start: result.action.data.start,
          end: result.action.data.end,
        });
      }

      this.drawBuffer(true);
      //this.fireEvent('ready');
      //this.isReady = true;
    });
  }

  cancelAjax() {
    if (this.currentRequest && this.currentRequest.controller) {
      this.currentRequest.controller.abort();
      this.currentRequest = null;
    }
  }

  clearTmpEvents() {
    this.tmpEvents.forEach(e => e.un());
  }

  empty() {
    if (!this.backend.isPaused()) {
      this.stop();
      this.backend.disconnectSource();
    }
    this.isReady = false;
    this.cancelAjax();
    this.clearTmpEvents();
    this.drawer.progress(0);
    this.drawer.setWidth(0);
    this.drawer.drawPeaks({ length: this.drawer.getWidth() }, 0);
  }

  destroy() {
    this.destroyAllPlugins();

    this.fireEvent('destroy');
    this.cancelAjax();
    this.clearTmpEvents();
    this.unAll();
    if (this.params.responsive !== false) {
      window.removeEventListener('resize', this._onResize, true);
      window.removeEventListener(
        'orientationchange',
        this._onResize,
        true
      );
    }
    this.backend.destroy();
    this.drawer.destroy();
    this.isDestroyed = true;
    this.isReady = false;
    this.arraybuffer = null;
  }
}
