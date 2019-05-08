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

import { fabric } from 'fabric';

const {Header, Footer, Sider, Content} = Layout;
const antIcon = <Icon type="loading" style={{ fontSize: 18 }} spin />;


const BG_ID = "canvas__edit_bg";
const BG_COLOR = "#252729";

const WAVE_ID = "canvas__wave";
const WAVE_COLOR = "black";

const getBgContext = () => {
  let c = document.getElementById(BG_ID);
  let ctx = c.getContext("2d");

  return ctx;
}

const CanvasBg = () => {
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '100%'}}></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '1000'}}></canvas>);

  //return (<canvas id={BG_ID} width='1000' height='500' style={{backgroundColor: {BG_COLOR}}}></canvas>);
  //return (<canvas id={BG_ID} width='1000' height='500'></canvas>);
  return (<canvas id={BG_ID} width='2000' height='2000' ></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: "100%", height: 328}}></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '1000'}}></canvas>);
}


const CanvasWave = () => {
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '100%'}}></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '1000'}}></canvas>);

  //return (<canvas id={BG_ID} width='1000' height='500' style={{backgroundColor: {BG_COLOR}}}></canvas>);
  //return (<canvas id={BG_ID} width='1000' height='500'></canvas>);
  return (<canvas id={WAVE_ID} ></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: "100%", height: 328}}></canvas>);
  //return (<canvas id={BG_ID} style={{backgroundColor: {BG_COLOR},  width: '1000'}}></canvas>);
}


const TT = () => {
  var canvas = new fabric.Canvas(BG_ID);
  //var canvas = new fabric.StaticCanvas(BG_ID);

  var rect = new fabric.Rect({
    top : 0,
    left : 0,
    width : 1000,// window.innerWidth,
    height : 500,//window.innerHeight,
    fill : 'red',
  });

  var line = new fabric.Line([0, 0, 200, 200], {
    left: 0,
    top: 0,
    stroke: 'red',
  });

  var line1 = new fabric.Line([10, 0, 200, 200], {
    left: 10,
    top: 20,
    stroke: 'red',
  });


  canvas.add(rect);
  canvas.add(line);
  canvas.add(line1);

}

const TT1 = () => {
  console.log("11111111", window.innerHeight);
  console.log("2222222222", window.innerWidth);
  let c=document.getElementById(BG_ID);
  let ctx=c.getContext("2d");

  ctx.fillRect(0,0,2000,2000);
  ctx.strokeStyle="grey";
  ctx.stroke();

  //ctx.beginPath();
  //ctx.strokeStyle="red";
  //ctx.moveTo(20,20);
  //ctx.lineTo(20,100);
  //ctx.lineTo(70,100);
  //ctx.stroke();




}


const TT3 = () => {
  console.log("11111111", window.innerHeight);
  console.log("2222222222", window.innerWidth);
  let c=document.getElementById(WAVE_ID);
  let ctx=c.getContext("2d");

  ctx.fillRect(20,20,5000,100);
  ctx.stroke();

  ctx.beginPath();
  ctx.strokeStyle="red";
  ctx.moveTo(20,20);
  ctx.lineTo(20,100);
  ctx.lineTo(70,100);
  ctx.stroke();




}



const TT2 = () =>{
  var wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple'
  });

  wavesurfer.load('/static/cc.mp3');
  //wavesurfer.on('ready', function() {
    //wavesurfer.play();
  //})
}

class EditPage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
    const {navigation} = this.props.store;
    navigation.setNav('audio_edit');

    let ctx = getBgContext();

    //TT();
    TT1();

    TT3();
  }

  componentWillUnmount() {}

  render() {
    const {lang, edit} = this.props.store;


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
                <Row>
                  <Col span={20} offset={0}>
                  <CanvasBg/>
                  <CanvasWave/>
                  </Col>
                </Row>
              </WrapperRelative>
              <div id="waveform"></div>
            </Content>
            <CommonFooter/>
          </Layout>

        </Layout>
      </div>
    );
  }
}

export default inject('store')(observer(EditPage))




