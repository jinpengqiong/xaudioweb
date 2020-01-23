export default class SelectionviewPlugin {
  static create(params) {
    return {
      name: 'selectionview',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      staticProps: {},
      instance: SelectionviewPlugin
    };
  }

  defaultParams = {
    //opacity: '0.25',
    zIndex: 4,
    width: '100%', //256,
    height: '100%', //50,
    fontColor: 'rgb(60,161,236)',
    //fontColor: '#0172de',
    fontSize: 30,
    backgroundColor: 'black',
  };

  //_onRedraw = () => this.render();

  _onAudioProcess = (time) => {
    if (this.waveform.section.section)
      return;

    let curtime = this.waveform.getCurrentTime();

    this.selectionStartTime = this.formatTime(curtime);
    this.selectionEndTime = this.formatTime(curtime);
    this.selectionDurationTime = this.formatTime(0);

    this.render();
  }

  _onScroll = () => {
    const wf = this.waveform;

    let start = wf.getViewStartTime();
    let end = wf.getViewEndTime();

    this.viewStartTime = this.formatTime(start);
    this.viewEndTime = this.formatTime(end);
    this.viewDurationTime = this.formatTime(end-start);

    this.render();
  }

  _onSectionUpdated = () => {
    const wf = this.waveform;

    let start = wf.section.getStartTime();
    let end = wf.section.getEndTime();

    this.selectionStartTime = this.formatTime(start);
    this.selectionEndTime = this.formatTime(end);
    this.selectionDurationTime = this.formatTime(end-start);

    this.render();
  }

  _onSectionRemoved = () => {

    this.selectionStartTime = this.formatTime(0);
    this.selectionEndTime = this.formatTime(0);
    this.selectionDurationTime = this.formatTime(0);

    this.render();
  }

  _onSeek = () => {
    let curtime = this.waveform.getCurrentTime();

    this.selectionStartTime = this.formatTime(curtime);
    this.selectionEndTime = this.formatTime(curtime);
    this.selectionDurationTime = this.formatTime(0);

    this.render();
  }


  _onReady = () => {
    const wf = this.waveform;

    // add listeners
    //wf.on('redraw', this._onRedraw);
    wf.on('audioprocess', this._onAudioProcess);

    wf.on('scroll', this._onScroll);
    wf.on('section-updated', this._onSectionUpdated);
    wf.on('section-removed', this._onSectionRemoved);

    wf.on('seek', this._onSeek);

    this.viewStartTime = this.formatTime(0);
    this.viewEndTime = this.formatTime(wf.getDuration());
    this.viewDurationTime = this.formatTime(wf.getDuration());

    this.render();
  };

  constructor(params, wf) {
    this.container =
      'string' == typeof params.container
        ? document.querySelector(params.container)
        : params.container;

    if (!this.container) {
      throw new Error('No container for waveform selectionview');
    }
    this.waveform = wf;

    this.wrapper = null;
    this.style = wf.util.style;
    this.util = wf.util;
    this.params = wf.util.extend({}, this.defaultParams, params);
    this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    this.selectionStartTime = this.formatTime(0);
    this.selectionEndTime = this.formatTime(0);
    this.selectionDurationTime = this.formatTime(0);
    this.viewStartTime = this.formatTime(0);
    this.viewEndTime = this.formatTime(0);
    this.viewDurationTime = this.formatTime(0);
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
    this.wrapper = this.container.appendChild(document.createElement('div'));

    this.titleStartWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.titleEndWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.titleDurationWrapper = this.wrapper.appendChild(document.createElement('div'));

    this.selectionNameWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.selectionStartWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.selectionEndWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.selectionDurationWrapper = this.wrapper.appendChild(document.createElement('div'));

    this.viewNameWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.viewStartWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.viewEndWrapper = this.wrapper.appendChild(document.createElement('div'));
    this.viewDurationWrapper = this.wrapper.appendChild(document.createElement('div'));


    this.util.style(this.wrapper, {
      //display: 'flex',
      //justifyContent: 'center',
      //alignItems: 'center',
      //width: `${this.params.width}px`,
      //height: `${this.params.height}px`,
      width: '100%',
      height: '100%',
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });

    this.util.style(this.titleStartWrapper, {
      position: 'relative',
      float: 'left',
      width: `40%`,
      height: `30%`,
      paddingLeft: `10%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.titleStartWrapper.innerHTML = `开始`;

    this.util.style(this.titleEndWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.titleEndWrapper.innerHTML = `结束`;

    this.util.style(this.titleDurationWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.titleDurationWrapper.innerHTML = `持续时间`;

    this.util.style(this.selectionNameWrapper, {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      float: 'left',
      width: `10%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.selectionNameWrapper.innerHTML = `选区`;


    this.util.style(this.selectionStartWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.selectionStartWrapper.innerHTML = `${this.selectionStartTime}`;

    this.util.style(this.selectionEndWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.selectionEndWrapper.innerHTML = `${this.selectionEndTime}`;

    this.util.style(this.selectionDurationWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.selectionDurationWrapper.innerHTML = `${this.selectionDurationTime}`;


    this.util.style(this.viewNameWrapper, {
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      float: 'left',
      width: `10%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.viewNameWrapper.innerHTML = `视图`;

    this.util.style(this.viewStartWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.viewStartWrapper.innerHTML = `${this.viewStartTime}`;

    this.util.style(this.viewEndWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.viewEndWrapper.innerHTML = `${this.viewEndTime}`;

    this.util.style(this.viewDurationWrapper, {
      position: 'relative',
      float: 'left',
      width: `30%`,
      height: `30%`,
      backgroundColor: `${this.params.backgroundColor}`,
      color: `${this.params.fontColor}`,
      fontSize: `${this.params.fontSize}px`,
    });
    this.viewDurationWrapper.innerHTML = `${this.viewDurationTime}`;


  }

  render() {
    //this.wrapper.innerHTML = `${this.formatValue}`;

    this.viewStartWrapper.innerHTML = `${this.viewStartTime}`;
    this.viewEndWrapper.innerHTML = `${this.viewEndTime}`;
    this.viewDurationWrapper.innerHTML = `${this.viewDurationTime}`;

    this.selectionStartWrapper.innerHTML = `${this.selectionStartTime}`;
    this.selectionEndWrapper.innerHTML = `${this.selectionEndTime}`;
    this.selectionDurationWrapper.innerHTML = `${this.selectionDurationTime}`;
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


