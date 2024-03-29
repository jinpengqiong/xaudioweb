export default class CursorPlugin {
  static create(params) {
    console.log('params',params);
    return {
      name: 'cursor',
      deferInit: params && params.deferInit ? params.deferInit : false,
      params: params,
      staticProps: {},
      instance: CursorPlugin
    };
  }

  defaultParams = {
    hideOnBlur: true,
    width: '1px',
    //color: 'red', //'black',
    color: 'grey', //'black',
    opacity: '0.25',
    style: 'solid',
    zIndex: 4,
    customStyle: {},
    customShowTimeStyle: {},
    showTime: false,
    followCursorY: false,
    formatTimeCallback: null
  };

  _onMousemove = e => {
    const bbox = this.waveform.container.getBoundingClientRect();
    let y = 0;
    let x = e.clientX - bbox.left;

    if (this.params.showTime && this.params.followCursorY) {
      // follow y-position of the mouse
      y = e.clientY - (bbox.top + bbox.height / 2);
    }

    this.updateCursorPosition(x, y);
  };

  _onMouseenter = () => this.showCursor();

  _onMouseleave = () => this.hideCursor();

  constructor(params, wf) {
    this.waveform = wf;
    this.style = wf.util.style;
    this.cursor = null;
    this.showTime = null;
    this.displayTime = null;
    this.params = wf.util.extend({}, this.defaultParams, params);
  }

  init() {
    this.wrapper = this.waveform.container;
    this.cursor = this.wrapper.appendChild(
      this.style(
        document.createElement('cursor'),
        this.waveform.util.extend(
          {
          position: 'absolute',
          zIndex: this.params.zIndex,
          left: 0,
          top: 0,
          bottom: 0,
          width: '0',
          display: 'flex',
          borderRightStyle: this.params.style,
          borderRightWidth: this.params.width,
          borderRightColor: this.params.color,
          opacity: this.params.opacity,
          pointerEvents: 'none'
        },
        this.params.customStyle
        )
    )
    );
    if (this.params.showTime) {
      this.showTime = this.wrapper.appendChild(
        this.style(
          document.createElement('showTitle'),
          this.waveform.util.extend(
            {
            position: 'absolute',
            zIndex: this.params.zIndex,
            left: 0,
            top: 0,
            bottom: 0,
            width: 'auto',
            display: 'flex',
            opacity: this.params.opacity,
            pointerEvents: 'none',
            height: '100%'
          },
          this.params.customStyle
          )
      )
      );
      this.displayTime = this.showTime.appendChild(
        this.style(
          document.createElement('div'),
          this.waveform.util.extend(
            {
            display: 'inline',
            pointerEvents: 'none',
            margin: 'auto'
          },
          this.params.customShowTimeStyle
          )
      )
      );
    }

    this.wrapper.addEventListener('mousemove', this._onMousemove);
    if (this.params.hideOnBlur) {
      // ensure elements are hidden initially
      this.hideCursor();
      this.wrapper.addEventListener('mouseenter', this._onMouseenter);
      this.wrapper.addEventListener('mouseleave', this._onMouseleave);
    }
  }

  destroy() {
    if (this.params.showTime) {
      this.cursor.parentNode.removeChild(this.showTime);
    }
    this.cursor.parentNode.removeChild(this.cursor);
    this.wrapper.removeEventListener('mousemove', this._onMousemove);
    if (this.params.hideOnBlur) {
      this.wrapper.removeEventListener('mouseenter', this._onMouseenter);
      this.wrapper.removeEventListener('mouseleave', this._onMouseleave);
    }
  }

  updateCursorPosition(xpos, ypos) {
    this.style(this.cursor, {
      left: `${xpos}px`
    });
    if (this.params.showTime) {
      const duration = this.waveform.getDuration();
      const elementWidth =
        this.waveform.drawer.width /
        this.waveform.params.pixelRatio;
      const scrollWidth = this.waveform.drawer.getScrollX();

      const scrollTime =
        (duration / this.waveform.drawer.width) * scrollWidth;

      const timeValue =
        Math.max(0, (xpos / elementWidth) * duration) + scrollTime;
      const formatValue = this.formatTime(timeValue);
      this.style(this.showTime, {
        left: `${xpos}px`,
        top: `${ypos}px`
      });
      this.displayTime.innerHTML = `${formatValue}`;
    }
  }

  showCursor() {
    this.style(this.cursor, {
      display: 'flex'
    });
    if (this.params.showTime) {
      this.style(this.showTime, {
        display: 'flex'
      });
    }
  }

  hideCursor() {
    this.style(this.cursor, {
      display: 'none'
    });
    if (this.params.showTime) {
      this.style(this.showTime, {
        display: 'none'
      });
    }
  }

  formatTime(cursorTime) {
    cursorTime = isNaN(cursorTime) ? 0 : cursorTime;
    //console.log("111111111111111111111111:", cursorTime, "##222:", typeof(cursorTime));

    if (this.params.formatTimeCallback) {
      return this.params.formatTimeCallback(cursorTime);
    }
    return [cursorTime].map(time =>
                            [
                              Math.floor((time % 3600) / 60), // minutes
                              ('00' + Math.floor(time % 60)).slice(-2), // seconds
                              ('000' + Math.floor((time % 1) * 1000)).slice(-3) // milliseconds
                            ].join(':')
                           );
  }
}
