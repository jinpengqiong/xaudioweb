//double scaledValue = UCHAR_MAX * (dbMag - minDecibels) * rangeScaleFactor;
//rangescalefactor = 1./(max-min)
//real dB = value/(255*rangescalefactor) + minDB


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
        ws.on('audioprocessdata', this._onAudioProcess);

        this.render();
    };


    _onAudioProcess = (e) => {

      let ctx = this.meterCanvas.getContext('2d');
      let width = this.params.width;
      let height = this.params.height;
      //ctx.fillStyle = 'rgb(0,0,0)'
      //ctx.fillRect(0, 0, this.params.width, this.params.height);

      let analyser = this.wavesurfer.backend.analyser;

      let bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);

      const doaverage = (args) => {
        var numbers;
        if (args[0] instanceof Array) {
          numbers = args[0];
        }
        else if (typeof args[0] == "number") {
          numbers = args;
        }
        var sum= 0;
        var average= 0;
        for (var i = 0; i < numbers.length; i++) {
          sum += numbers[i];
        }
        average = sum / numbers.length;
        return average;
      }




      function updateMeterCanvas() {

        //analyser.getByteFrequencyData(dataArray, analyser.frequencyBinCount);
        //analyser.getByteTimeDomainData(dataArray);
        analyser.getByteFrequencyData(dataArray);

        //console.log("--------> curTime: ", ac.currentTime);
        //ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, width, height);


        let vuMax = 0, vuAvg = 0;
        let vu;
        for(var i = 0; i < bufferLength; i++) {
          vu = dataArray[i];
          if (vu > vuMax)
            vuMax = vu;

          vuAvg += vu;
        }

        let vvv;
        vvv = doaverage(dataArray);
        console.log("1111111111111", vvv);

        vuAvg = parseInt(vuAvg/bufferLength);
        //ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        ctx.fillStyle = 'black'
        //ctx.fillRect(0, 0, Math.max(vu, vuAvg), height);
        ctx.fillRect(Math.max(vuMax, vuAvg), 0, width, height);
        //ctx.fillRect(Math.max(vu, vvv), 0, width, height);
        //ctx.fillRect(vuMax, 0, width, height);
        //ctx.fillRect(vvv, 0, width, height);
        //ctx.fillRect(0, 0, vuAvg, height);
      }


      updateMeterCanvas();


    };

    constructor(params, ws) {
        this.container =
            'string' == typeof params.container
                ? document.querySelector(params.container)
                : params.container;

        if (!this.container) {
            throw new Error('No container for wavesurfer volmeter');
        }
        this.wavesurfer = ws;

        this.wrapper = null;
        this.style = ws.util.style;
        this.util = ws.util;
        this.params = ws.util.extend({}, this.defaultParams, params);
        this.pixelRatio = window.devicePixelRatio || screen.deviceXDPI / screen.logicalXDPI;
    }

    init() {
      console.log("33333333333333", this.wrapper);
      if (!this.wrapper)
        this.createWrapper();

      //init bg canvas
      this.bgCanvas = this.wrapper.appendChild(
        document.createElement('canvas')
      )
      this.util.style(this.bgCanvas, {
        position: 'absolute',
        zIndex: 4,
        width: `${this.params.width}px`,
        height: `${this.params.height}px` 
      });

      //init meter canvas
      this.meterCanvas = this.wrapper.appendChild(
        document.createElement('canvas')
      );
      this.meterCanvas.width = this.params.width * this.pixelRatio;
      this.meterCanvas.height = this.params.height * this.pixelRatio;
      this.util.style(this.meterCanvas, {
        position: 'absolute',
        zIndex: 5,
        width: `${this.params.width}px`,
        height: `${this.params.height}px` 
      });

      this.drawBg();

      if (this.wavesurfer.isReady) {
        this._onReady();
      } else {
        this.wavesurfer.once('ready', this._onReady);
      }

      //this.wavesurfer.on('audioprocess', 

    }

    createWrapper() {
      const wsParams = this.wavesurfer.params;
      this.container.innerHTML = '';
      this.wrapper = this.container.appendChild(
        document.createElement('volmeter')
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
      //ctx.fillStyle = 'rgb(0,0,0)'
      //ctx.fillRect(0, 0, this.params.width, this.params.height);

      let analyser = this.wavesurfer.backend.analyser;

      let bufferLength = analyser.frequencyBinCount;
      var dataArray = new Uint8Array(bufferLength);

      function updateMeterCanvas() {
        window.requestAnimationFrame(updateMeterCanvas);

        //analyser.getByteFrequencyData(dataArray, analyser.frequencyBinCount);
        analyser.getByteTimeDomainData(dataArray);

        //console.log("--------> curTime: ", ac.currentTime);
        //ctx.fillStyle = 'rgb(0, 0, 0)';
        ctx.fillStyle = 'green';
        ctx.fillRect(0, 0, width, height);


        let vuMax = 0, vuAvg = 0;
        let vu;
        for(var i = 0; i < bufferLength; i++) {
          vu = dataArray[i];
          if (vu > vuMax)
            vuMax = vu;

          vuAvg += vu;
        }

        vuAvg = parseInt(vuAvg/bufferLength);
        //ctx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        ctx.fillStyle = 'black'
        //ctx.fillRect(0, 0, Math.max(vu, vuAvg), height);
        //ctx.fillRect(Math.max(vuMax, vuAvg), 0, width, height);
        ctx.fillRect(vuMax, 0, width, height);
        //ctx.fillRect(0, 0, vuAvg, height);
      }

      setTimeout(updateMeterCanvas, 0);
    }

    render() {
      console.log("0000000000000000ready");
      //this.drawMeter();
    }

    destroy() {
    }


}
