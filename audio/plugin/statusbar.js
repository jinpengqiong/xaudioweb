export default class StatusbarPlugin {
  static create(params) {
    return {
      name: 'statusbar',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      staticProps: {},
      instance: StatusbarPlugin
    };
  }

  defaultParams = {
    //opacity: '0.25',
    zIndex: 4,
    width: 256,
    height: 30,
    fontFamily: 'Arial',
    fontColor: 'rgb(130,130,130)',
    fontSize: 10,
    backgroundColor: 'rgb(33,33,33)',
  };

  //_onRedraw = () => this.render();

  _onAudioProcess = (time) => {
    //this.formatValue = this.formatTime(time);
    //this.render();
  }


  _onReady = () => {
    const wf = this.waveform;


    // add listeners
    //wf.on('redraw', this._onRedraw);
    wf.on('audioprocess', this._onAudioProcess);
    wf.on('play', () => {this.status='playing';this.renderPlayStatus()});
    wf.on('pause', () => {this.status='pause';this.renderPlayStatus()});
    wf.on('stop', () => {this.status='stopped';this.renderPlayStatus()});

    this.status = 'ready';

    this.render();
  };

  constructor(params, wf) {
    this.container =
      'string' == typeof params.container
        ? document.querySelector(params.container)
        : params.container;

    if (!this.container) {
      throw new Error('No container for waveform playtime');
    }
    this.waveform = wf;

    this.statusWrapper = null;
    this.fileInfoWrapper = null;

    this.style = wf.util.style;
    this.util = wf.util;
    this.params = wf.util.extend({}, this.defaultParams, params);
    this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;

    this.status = "";
  }

  init() {
    this.createWrapper();

    if (this.waveform.isReady) {
      this._onReady();
    } else {
      this.waveform.once('ready', this._onReady);
    }
  }

  createWrapper() {
    const wfParams = this.waveform.params;
    this.container.innerHTML = '';

    this.statusWrapper = this.container.appendChild(
      document.createElement('div')
    );

    this.fileInfoWrapper = this.container.appendChild(
      document.createElement('div')
    );

    this.util.style(this.statusWrapper, {
      display: 'flex',
      float: 'left',
      justifyContent: 'left',
      alignItems: 'center',
      paddingTop: '6px',
      width: `15%`,
      height: `100%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });

    this.util.style(this.fileInfoWrapper, {
      display: 'flex',
      float: 'right',
      justifyContent: 'right',
      alignItems: 'center',
      paddingTop: '8px',
      width: `25%`,
      height: `80%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontFamily: `${this.params.fontFamily}`,
      fontSize: `${this.params.fontSize}px`,

      //borderRightStyle: 'solid',
      //borderRightWidth: `1px`,
      //borderRightColor: 'red',

    });
  }

  renderPlayStatus() {
    this.statusWrapper.innerHTML = `${this.status}`;
  }

  render() {
    this.renderPlayStatus();

    let fileName, mode, size, decodeSize, duration;
    let channels = this.waveform.getNumOfChannels();
    if (channels == 1) {
      mode = 'Mono';
    } else if (channels == 2) {
      mode = 'Stereo'
    } else {
      mode = 'Stereo'
    }

    fileName = this.waveform.fileName;
    size = this.formatSize(this.waveform.fileSize);
    decodeSize = this.formatSize(this.waveform.fileDecodeSize);
    duration = this.formatTime(this.waveform.fileDuration);


    this.fileInfoWrapper.innerHTML = 
      `${this.waveform.fileSampleRate}&nbspHz&nbsp&nbsp●&nbsp&nbsp${mode}&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp${size}/${decodeSize}&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp${duration}`;
  }

  destroy() {
  }

  formatTime(anchorTime) {
    anchorTime = isNaN(anchorTime) ? 0 : anchorTime;
    //console.log("111111111111111111111111:", anchorTime, "##222:", typeof(anchorTime));

    return [anchorTime].map(time =>
                            [
                              Math.floor((time % 3600) / 60), // minutes
                              ('00' + Math.floor(time % 60)).slice(-2), // seconds
                              ('000' + Math.floor((time % 1) * 1000)).slice(-3) // milliseconds
                            ].join(':')
                           );
  }

  formatSize(size) {
    if (size < 1024) {
      return `${size}bytes`;
    } else if (size < 1024*1024) {
      let sizeKB = (size/1024).toFixed(2);
      return `${sizeKB}KB`;
    } else if (size < 1024*1024*1024) {
      let sizeMB = (size/(1024*1024)).toFixed(2);
      return `${sizeMB}MB`;
    } else {
      let sizeGB = (size/(1024*1024*1024)).toFixed(2);
      return `${sizeGB}GB`;
    }
  }

}


