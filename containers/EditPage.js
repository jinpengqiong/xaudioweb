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
import CommonWrapper from '../components/CommonWrapper';

import { fabric } from 'fabric';

const {Header, Footer, Sider, Content} = Layout;
const antIcon = <Icon type="loading" style={{ fontSize: 18 }} spin />;


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

const tt5 = () => {
  const aa = new CommonWrapper({
    id: '#hhh',
    wRatio: 1.0,
    hRatio: 0.5,
  });


  wavesurfer = WaveForm.create({
    container: '#waveform',
    waveColor: 'green',
    progressColor: 'white',
    backgroundColor: 'black',
    splitChannels: true,
    height: 256

  });

  wavesurfer.on('ready', function () {
    wavesurfer.play();
  });

  //wavesurfer.load('static/cc.mp3');
}



class EditPage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
    const {navigation} = this.props.store;
    navigation.setNav('audio_edit');


    //TT4();

    tt5();
  }

  componentWillUnmount() {}

  render() {
    const {lang, edit} = this.props.store;
    console.log("1111111111111111111", edit.isLoading);


    const loadAudio = (file) => {
      wavesurfer.loadBlob(file)
      //edit.openFile(file)
    }


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
                <div id="hhh">
                  <div id="waveform"/>
                </div>
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




