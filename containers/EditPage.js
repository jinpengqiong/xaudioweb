import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Radio, Input, Progress, 
        Button, Upload, Icon, Slider, Switch, Alert,
        Form, Divider, Spin} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../components/BaseStyle';
import {CommonHeader, CommonFooter, CommonNoteTip} from './CommonHeaderFooter';

import Navigation from './Navigation';
import langmap from '../config/langmap';

import CanvasWave from '../components/CanvasWave';
import WaveForm from '../audio/WaveForm';
import CursorPlugin from '../audio/plugin/cursor';
import TimelinePlugin from '../audio/plugin/timeline';
import RegionsPlugin from '../audio/plugin/regions';
import SectionPlugin from '../audio/plugin/section';
import SpectrumPlugin from '../audio/plugin/spectrogram';
import CommonWrapper from '../components/CommonWrapper';
import * as utils from '../utils';

import { fabric } from 'fabric';

const {Header, Footer, Sider, Content} = Layout;
const antIcon = <Icon type="loading" style={{ fontSize: 18 }} spin />;
const ButtonGroup = Button.Group;


const BG_ID = "canvas__edit_bg";
const BG_COLOR = "#252729";

const WAVE_ID = "canvas__wave";
const WAVE_COLOR = "black";

const CanvasBg = () => {
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '100%'}}></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '1000'}}></canvas>);

  //return (<canvas id={BG_ID} width='1000' height='500' style={{backgroundColor: {BG_COLOR}}}></canvas>);
  //return (<canvas id={BG_ID} width='1000' height='500'></canvas>);
  //return (<canvas id={BG_ID} width='1000'></canvas>);
  return (<canvas id={BG_ID} ></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: "100%", height: 328}}></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '1000'}}></canvas>);
}

const TT4 = () => {
  const canvasWave = CanvasWave.create({container: BG_ID, hRatio: 0.2});

  //canvasWave.load();
  canvasWave.startDecodeAudioData();
}

var wavesurfer = null
var colorMap = null

const loadColorMap = () => {
  WaveForm.util
  .fetchFile({ url: 'static/hot-colormap.json', responseType: 'json' })
  .on('success', cmap => {
    colorMap = cmap 
    console.log("00000llllllllppppppppppppp1111111111111", colorMap);
    tt5();
  });
}

const exportRenderBuffer = () => {
  wavesurfer.exportRenderBuffer();
}

const cutDelete = () => {
  wavesurfer.cutDelete();
}

const recoverAction = () => {
  wavesurfer.recoverAction();
}



const tt5 = () => {
  const aa = new CommonWrapper({
    id: '#hhh',
    wRatio: 1.0,
    hRatio: 0.5,
  });


  wavesurfer = WaveForm.create({
    container: '#waveform',
    waveColor: '#48db95', //'cyan', //'blue',
    //waveColor: 'blue', //'cyan', //'blue',
    progressColor: 'grey',//'white',
    //progressColor: '#48db95',//'white',
    backgroundColor: 'black',
    splitChannels: true,
    height: 128,
    plugins: [
      CursorPlugin.create({
        showTime: true,
        opacity: 1,
        customShowTimeStyle: {
          'background-color': '#000',
          color: '#fff',
          //color: 'blue',
          padding: '2px',
          'font-size': '10px'
        }
      }),

      TimelinePlugin.create({
        container: "#wave-timeline"
      }),

      SectionPlugin.create({
        //section: {
          //start: 10,
          //end: 20,
          //color: 'hsla(190, 40%, 90%, 0.3)'
        //},
        dragSelection: {
          slop: 5
        },
        drag: false
      }),


      //SpectrumPlugin.create({
        //wavesurfer: wavesurfer,
        //container: "#wave-spectrogram",
        //labels: true,
        //colorMap: colorMap
      //}),

    ]

  });


  console.log("mmmmmmmmmmmmmmm----", wavesurfer);


  //wavesurfer.load('static/cc.mp3');
}



class EditPage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
    const {navigation} = this.props.store;
    navigation.setNav('audio_edit');


    //TT4();

    loadColorMap();
    //tt5();
  }

  componentWillUnmount() {}

  render() {
    const {lang, edit} = this.props.store;
    console.log("1111111111111111111", edit.isLoading);


    const loadAudio = (file) => {

      wavesurfer.on('ready', function () {
        //wavesurfer.play();

        console.log("0000000000000000000000000000: ", wavesurfer.getNumOfChannels())
        if (wavesurfer.getNumOfChannels() == 1) {
          console.log("11111111111111ffffffffffffffffffffffffff", window.innerHeight);
          //wavesurfer.setHeight(256) 
          wavesurfer.setHeight(window.innerHeight * 0.5)
        } else {
          wavesurfer.setHeight(window.innerHeight * 0.5 * 0.5)
        }


      });


      wavesurfer.loadBlob(file)

      //document.querySelector('#slider').oninput = function () {
        //wavesurfer.zoom(Number(this.value));
      //};

      //var slider = document.querySelector('[data-action="zoom"]');

      //slider.value = wavesurfer.params.minPxPerSec;
      //slider.min = wavesurfer.params.minPxPerSec;

      //slider.addEventListener('input', function() {
        //wavesurfer.zoom(Number(this.value));
      //});

      //wavesurfer.zoom(slider.value);


    }

    const play = () => {wavesurfer.play()}
    const pause = () => {wavesurfer.pause()}
    const stop = () => {wavesurfer.stop()}
    const fastForward = () => {wavesurfer.skipForward()}


    return (
      <div>
        <Layout style={{ minHeight: '100vh' }}>

          <Navigation/>

          <Layout style={{ marginLeft: 200 }}>
            <CommonHeader/>
            <Content>
              <Row>
                <CommonNoteTip lang={lang}/>
              </Row>
              <WrapperRelative top={"0px"} left={"1px"}>
                <div id="wave-timeline"/>
                <div id="hhh">
                  <div id="waveform"/>
                </div>
                <div id ="wave-spectrogram"/>
                <Row>
                  <Col span={20} offset={0}>
                  <CanvasBg/>
                  </Col>
                </Row>
                <Row>
                  <Upload 
                    action=""
                    beforeUpload={loadAudio}
                    showUploadList={false}
                  >
                    <Col span={4}>
                      <Button disabled={edit.isProcessing}>
                      <Icon type="upload"/> {langmap.UploadProcess[lang]} 
                      </Button>
                    </Col>
                    <Col span={2} offset={18}>
                      <Spin spinning={edit.isLoading} indicator={antIcon} />
                    </Col>
                  </Upload>

                  <ButtonGroup>
                    <Button icon="play-circle" onClick={play}/>
                    <Button icon="pause-circle" onClick={pause}/>
                    <Button icon="stop" onClick={stop}/>
                    <Button icon="fast-forward" onClick={fastForward}/>
                  </ButtonGroup>

                  <Button onClick={exportRenderBuffer}>
                    export
                  </Button>
                  <Button onClick={cutDelete}>
                    cut 
                  </Button>
                  <Button onClick={recoverAction}>
                    recover 
                  </Button>




                </Row>
              </WrapperRelative>
            </Content>
            <CommonFooter/>
          </Layout>

        </Layout>
      </div>
    );
  }
}

export default inject('store')(observer(EditPage))




