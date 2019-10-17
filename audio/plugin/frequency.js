export default class FrequencyPlugin {
    static create(params) {
        return {
            name: 'frequency',
            deferInit: params && params.deferInit ? params.deferInit : false,
            params: params,
            staticProps: {},
            instance: FrequencyPlugin
        };
    }

    defaultParams = {
        opacity: '0.25',
        zIndex: 4,
        width: 256,
        height: 60,
        backgroundColor: 'black',
    };

    _onRedraw = () => this.render();

    _onReady = () => {
        const ws = this.wavesurfer;

        // add listeners
        ws.on('redraw', this._onRedraw);
        //ws.on('audioprocess', this._onAudioProcess);

        this.render();
    };

    constructor(params, ws) {
        this.container =
            'string' == typeof params.container
                ? document.querySelector(params.container)
                : params.container;

        if (!this.container) {
            throw new Error('No container for wavesurfer frequency');
        }
        this.wavesurfer = ws;

        this.wrapper = null;
        this.style = ws.util.style;
        this.util = ws.util;
        this.params = ws.util.extend({}, this.defaultParams, params);
        this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    }

    init() {
      if (!this.wrapper)
        this.createWrapper();

      console.log("&&&&&&&&&&&&&&&&&&&&&&", this.params.height);
      //init bg canvas
      this.bgCanvas = this.wrapper.appendChild(
        document.createElement('canvas')
      )
      this.util.style(this.bgCanvas, {
        position: 'absolute',
        zIndex: 4,
        width: '100%',
        height: `${this.params.height}` 
      });

      //init meter canvas
      this.meterCanvas = this.wrapper.appendChild(
        document.createElement('canvas')
      )
      this.meterCanvas.width = this.params.width * this.pixelRatio;
      this.meterCanvas.height = this.params.height * this.pixelRatio;
      this.util.style(this.meterCanvas, {
        position: 'absolute',
        zIndex: 5,
        //width: '100%',
        //height: '100%' 
        width: `${this.params.width}px`,
        height: `${this.params.height}px` 
      });

      this.drawBg();

      if (this.wavesurfer.isReady) {
        this._onReady();
      } else {
        this.wavesurfer.once('ready', this._onReady);
      }

    }

    createWrapper() {
      const wsParams = this.wavesurfer.params;
      this.container.innerHTML = '';
      this.wrapper = this.container.appendChild(
        document.createElement('frequency')
      );

      this.util.style(this.wrapper, {
          display: 'block',
          position: 'relative',
          userSelect: 'none',
          webkitUserSelect: 'none',
          height: `${this.params.height}px`
      });

      if (wsParams.fillParent || wsParams.scrollParent) {
          this.util.style(this.wrapper, {
              width: '100%',
              overflowX: 'hidden',
              overflowY: 'hidden'
          });
      }
    }

    drawBg() {
      let ctx = this.bgCanvas.getContext('2d');
      let width = this.params.width;
      let height = this.params.height;
      ctx.fillStyle = 'rgb(0,100,0)'
      ctx.fillRect(0, 0, this.params.width, this.params.height);
      console.log("111111111111111111111", width, '  ', height);
    }

    drawMeter() {
      let ctx = this.meterCanvas.getContext('2d');
      let width = this.params.width;
      let height = this.params.height;

      let analyser = this.wavesurfer.backend.analyser;

      let bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);

      //analyser.fftSize = 512;

      function updateMeterCanvas() {
        window.requestAnimationFrame(updateMeterCanvas);

        analyser.getByteFrequencyData(dataArray, analyser.frequencyBinCount);

        //console.log("--------> curTime: ", ac.currentTime);
        ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillRect(0, 0, width, height);

        //console.log("----> width: ", width, '  length: ', bufferLength);
        var barWidth = 1; //(width/ bufferLength) * 2.5 - 1;
        //var barWidth = (width/ bufferLength);
        var barHeight;
        var x = 0;

        for(var i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
          //ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          ctx.fillStyle = 'red';
          //ctx.fillRect(x, height-barHeight/2, barWidth, barHeight/2);
          ctx.fillRect(x, height-barHeight, barWidth, barHeight);
          x += barWidth;
        }
      }

      setTimeout(updateMeterCanvas, 0);
    }

    render() {
      console.log("0000000000000000ready");
      this.drawMeter();
    }

    destroy() {
    }


}

