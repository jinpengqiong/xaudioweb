export default class PlaytimePlugin {
  static create(params) {
    return {
      name: 'playtime',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      staticProps: {},
      instance: PlaytimePlugin
    };
  }

  defaultParams = {
    //opacity: '0.25',
    zIndex: 4,
    width: 256,
    height: 50,
    fontColor: 'rgb(60,161,236)',
    //fontColor: '#0172de',
    fontSize: 30,
    backgroundColor: 'black',
  };

  //_onRedraw = () => this.render();

  _onAudioProcess = (time) => {
    this.formatValue = this.formatTime(time);
    this.render();
  }


  _onReady = () => {
    const wf = this.waveform;

    // add listeners
    //wf.on('redraw', this._onRedraw);
    wf.on('audioprocess', this._onAudioProcess);

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

    this.wrapper = null;
    this.style = wf.util.style;
    this.util = wf.util;
    this.params = wf.util.extend({}, this.defaultParams, params);
    this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.formatValue = this.formatTime(0);
  }

  init() {
    if (!this.wrapper)
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
    this.wrapper = this.container.appendChild(
      document.createElement('div')
    );

    this.util.style(this.wrapper, {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      width: `${this.params.width}px`,
      height: `${this.params.height}px`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
  }

  render() {
    this.wrapper.innerHTML = `${this.formatValue}`;
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

}


