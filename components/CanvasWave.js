import * as util from 'util';
import WebAudio from '../utils/webaudio';
import { EventEmitter } from  'events';
import * as _ from 'lodash';


class CanvasWave extends EventEmitter {
  defaultParams = {
    container: null,

    wRatio: 0.7,
    hRatio: 0.4,

    backgroundColor: 'black',
    waveColor: 'green',
    progressColor: 'red',
    cursorColor: '#333',
    cursorWidth: 1,
  }

  constructor(params) {
    super();

    this.params = _.extend({}, this.defaultParams, params);

    //init canvas container and elemnt and context
    this.container = this.params.container;
    this.canvasElement = document.getElementById(this.container);
    this.canvasContext = this.canvasElement.getContext("2d");

    //canvas wave height and width
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
    this.hRatio = this.params.hRatio;
    this.wRatio = this.params.wRatio;
    this.height = this.innerHeight * this.hRatio;
    this.width = this.innerWidth * this.wRatio;
    this.canvasElement.width = this.width;
    this.canvasElement.height = this.height;

    //set each color
    this.setBackgroundColor(this.params.backgroundColor);
    this.setWaveColor(this.params.waveColor);
    this.setProgressColor(this.params.progressColor);
    this.setCursorColor(this.params.cursorColor);

    //set audio context
    this.backend = new WebAudio()

    console.log("current params: ", this.params);
  }

  static create(params) {
    const canvasWave = new CanvasWave(params);
    return canvasWave.init();
  }

  init() {
    return this;
  }

  load() {
    this.drawBackground();
    this.drawWave();
  }

  drawBackground() {
    this.canvasContext.fillRect(0, 0, this.width, this.height);
    this.canvasContext.strokeStyle = this.backgroundColor;
    this.canvasContext.stroke();
  }

  drawWave() {
    this.canvasContext.fillRect(20,20,5000,100);
    this.canvasContext.stroke();

    this.canvasContext.beginPath();
    this.canvasContext.strokeStyle="red";
    this.canvasContext.moveTo(20,20);
    this.canvasContext.lineTo(20,100);
    this.canvasContext.lineTo(70,100);
    this.canvasContext.stroke();
  }

  drawFrequency(freqArray, bufferLength) {
    //drawVisual = requestAnimationFrame(this.drawFrequency);

    window.requestAnimationFrame(this.drawFrequency);

    console.log("333333333333333333-------");
    this.canvasContext.fillStyle = 'rgb(0, 0, 0)';
    this.canvasContext.fillRect(0, 0, 500, 500);

    var barWidth = (500 / bufferLength) * 2.5;
    var barHeight;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {
      barHeight = freqArray[i];
      this.canvasContext.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
      this.canvasContext.fillRect(x,500-barHeight/2,barWidth,barHeight/2);
      x += barWidth + 1;
    }
  }

  startDecodeAudioData(rawData) {
    let ac = this.backend.ac;

    ac.decodeAudioData(rawData, (buffer) => {
      //create buffer source node and frequency analyser
      let audioBufferSourceNode = ac.createBufferSource();

      let analyser = ac.createAnalyser();
      analyser.fftSize = 256;

      //destination is the play sound card
      audioBufferSourceNode.connect(analyser);
      analyser.connect(ac.destination);
      console.log(ac.destination)

      //play audio
      audioBufferSourceNode.buffer = buffer;
      audioBufferSourceNode.start();
            
      //draw bin freq
      let bufferLength = analyser.frequencyBinCount;
      console.log(bufferLength);
      var dataArray = new Uint8Array(bufferLength);
      console.log(dataArray)

      analyser.getByteFrequencyData(dataArray, analyser.frequencyBinCount);
      //this.drawFrequency(dataArray)

      let canvasContext = this.canvasContext;
      canvasContext.clearRect(0, 0, 500, 500);

      function drawFrequency() {
        //drawVisual = requestAnimationFrame(this.drawFrequency);

        window.requestAnimationFrame(drawFrequency);

        console.log("333333333333333333-------");
        canvasContext.fillStyle = 'rgb(0, 0, 0)';
        canvasContext.fillRect(0, 0, 500, 500);

        var barWidth = (500 / bufferLength) * 2.5;
        var barHeight;
        var x = 0;

        for(var i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];
          canvasContext.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          canvasContext.fillRect(x,500-barHeight/2,barWidth,barHeight/2);
          x += barWidth + 1;
        }
      }

      drawFrequency();


    })
  }

  setBackgroundColor(color) {
    this.params.backgroundColor = color;
    //util.style(this.container, { background: this.params.backgroundColor });
  }

  setWaveColor(color) {
  }

  setProgressColor(color) {
  }

  setCursorColor(color) {
  }


}

export default CanvasWave;




