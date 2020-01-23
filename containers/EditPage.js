import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Radio, Input, Progress,
        Button, Upload, Icon, Slider, Switch, Alert,
        Form, Divider, Spin} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../components/BaseStyle';
import MinimapBarCanvas from '../components/minimapBar';
import {CommonHeader, CommonFooter, CommonNoteTip} from './CommonHeaderFooter';

import Navigation from './Navigation';
import langmap from '../config/langmap';
import * as utils from '../utils';

import WaveForm from '../audio/WaveForm';
import AnchorPlugin from '../audio/plugin/anchor';
import CursorPlugin from '../audio/plugin/cursor';
import FrequencyPlugin from '../audio/plugin/frequency';
import PlaytimePlugin from '../audio/plugin/playtime';
import SelectionviewPlugin from '../audio/plugin/selectionview';
import StatusbarPlugin from '../audio/plugin/statusbar';
import VolmeterPlugin from '../audio/plugin/volmeter';
import TimelinePlugin from '../audio/plugin/timeline';
import DbxlinePlugin from '../audio/plugin/dbxline';
import DbylinePlugin from '../audio/plugin/dbyline';
import SectionPlugin from '../audio/plugin/section';
import MiniMapPlugin from '../audio/plugin/minimap';
import SpectrumPlugin from '../audio/plugin/spectrogram';

import AudioButton from '../components/AudioButton';
import './editPage.less'

const {Header, Footer, Sider, Content} = Layout;

var waveform = null
var colorMap = null

var gWindowWidth, gWindowHeight;


//main module: waveform (including: minibar note, minibar, waveform, play button group)
//
//main margin, top/left/bottom all 2px
var gBgColor = 'rgb(22,22,22)';
var gMainBgColor = 'rgb(33,33,33)';

var gNavWidth = 200;
var gMainMarginTop = 4;
var gMainMarginLeft = 4;
var gMainMarginBottom = 2;
var gSecondMarginTop = 2;

//4 side need 2px padding to draw inner child module(minibar note, minibar,waveform, play buttom group)
var gMainPadding = 4;

//action button bar height
var gActionButtonHeight = 40;
var gActionButtonHeightBig = 50;

//minibar settings
var gMainMiniBarNoteHeight = 30;
var gMainMiniBarHeight = 40;
var gMainMiniBarWidth;

//timeline settings
var gMainTimelineHeight = 25;
var gMainTimelineMarginTop = 10;

//waveform settings
var gMainWaveformMarginTop = 20;
var gMainWaveformMarginBottom = 60;
var gMainWaveformResizeHeight = 7;

var gMainWaveformHeight;
var gMainWaveformWidth;
var gMainDbyHeight;
var gMainDbyWidth = 70;

//volmeter settings
var gVolmeterHeight;
var gVolmeterWidth;

//frequency settings
var gFreqHeight;
var gFreqWidth;

//playtime settings
var gPlaytimeHeight;
var gPlaytimeWidth;

//statusbar settings
var gStatusbarHeight;
var gStatusbarWidth;

//info height
var gFileInfoHeight = 20;

//
const initLayout = () => {

  gWindowWidth = window.innerWidth;
  gWindowHeight = window.innerHeight;

  //let waveMainEl = document.querySelector("#wave-main")
  let waveMainEl = document.querySelector("#wave-waveform")
  let waveMainRect = waveMainEl.getBoundingClientRect();

  gMainWaveformHeight = (waveMainRect.bottom - waveMainRect.top) -
                         gMainMiniBarHeight - gMainPadding -  //minibar top padding + minibar height
                         gMainTimelineHeight - gMainTimelineMarginTop - gMainWaveformResizeHeight;  //timeline height+timeline margin top
  //gMainWaveformWidth = (waveMainRect.right - waveMainRect.left) - gMainDbyWidth - gMainPadding; //left and right padding
  gMainWaveformWidth = (waveMainRect.right - waveMainRect.left) - gMainDbyWidth; //left and right padding

  gMainDbyHeight = gMainWaveformHeight;


  let volmeterEl = document.querySelector("#wave-volmeter")
  let volmeterRect = volmeterEl.getBoundingClientRect();
  gVolmeterHeight = volmeterRect.bottom - volmeterRect.top;
  gVolmeterWidth = volmeterRect.right - volmeterRect.left;

  let freqEl = document.querySelector("#wave-frequency")
  let freqRect = freqEl.getBoundingClientRect();
  gFreqHeight = freqRect.bottom - freqRect.top;
  gFreqWidth = freqRect.right - freqRect.left;

  let playtimeEl = document.querySelector("#wave-playtime")
  let playtimeRect = playtimeEl.getBoundingClientRect();
  gPlaytimeHeight = playtimeRect.bottom - playtimeRect.top;
  gPlaytimeWidth = playtimeRect.right - playtimeRect.left;

  let statusbarEl = document.querySelector("#wave-statusbar")
  let statusbarRect = statusbarEl.getBoundingClientRect();
  gStatusbarHeight = statusbarRect.bottom - statusbarRect.top;
  gStatusbarWidth = statusbarRect.right - statusbarRect.left;


}


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
  waveform.exportRenderBuffer();
}

const cutDelete = () => {
  waveform.cutDelete();
}

const recoverAction = () => {
  waveform.recoverAction();
}

const zoomAmpIn = () => {
}

let zoomValue = 1;
const doZoomIn = () => {
  zoomValue += 10;
  waveform.zoom(zoomValue);
}

const doZoomOut = () => {
  zoomValue -= 10;
  waveform.zoom(zoomValue);
}

const doZoomReset = () => {
  zoomValue = 1;
  waveform.zoom(zoomValue);
}

const doZoomInLeft = () => {
  zoomValue += 10;
  waveform.zoomLeft(zoomValue);
}

const doZoomInRight = () => {
  zoomValue += 10;
  waveform.zoomRight(zoomValue);
}

const doZoomOutLeft = () => {
  zoomValue -= 10;
  waveform.zoomLeft(zoomValue);
}

const doZoomOutRight = () => {
  zoomValue -= 10;
  waveform.zoomRight(zoomValue);
}

const doZoomSelection = () => {
  waveform.zoomSelection();
}

const doZoomFix = () => {
  waveform.zoom(500);
}

const changeZoom = (value) => {
  waveform.zoom(value);
}



const tt5 = () => {

  waveform = WaveForm.create({
    container: '#wave-waveform',
    waveColor: 'rgb(68,219,151)', //'#48db95', //'cyan', //'blue',
    //waveColor: 'blue', //'cyan', //'blue',
    progressColor: 'rgb(95,125,100)',//'rgb(70,115,90)', //'grey',//'white',
    //progressColor: '#48db95',//'white',
    backgroundColor: 'black',
    //backgroundColor: 'red',
    splitChannels: true,
    partialRender: true,
    height: gMainWaveformHeight, //256,
    //width: '100%',
    width: gMainWaveformWidth,
    plugins: [
      AnchorPlugin.create({
        showTime: true,
        opacity: 0.7,
        //style: 'dotted',
        style: 'dashed',
        color: 'red',
        customShowTimeStyle: {
          'background-color': '#000',
          color: '#fff',
          padding: '2px',
          'font-size': '10px'
        }
      }),

      CursorPlugin.create({
        showTime: true,
        //opacity: 1,
        opacity: 0.25,
        color: 'blue',
        customShowTimeStyle: {
          'background-color': '#000',
          color: '#fff',
          padding: '2px',
          'font-size': '10px'
        }
      }),

      TimelinePlugin.create({
        container: "#wave-timeline",
        height: gMainTimelineHeight,
        width: gMainWaveformWidth
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
        drag: false,
      }),

      PlaytimePlugin.create({
        container: "#wave-playtime",
        width: gPlaytimeWidth,
        height: gPlaytimeHeight ,
        fontSize: parseInt(gPlaytimeHeight/2),
        backgroundColor: `${gMainBgColor}`
      }),

      SelectionviewPlugin.create({
        container: "#wave-selectionview",
        //width: gPlaytimeWidth,
        //height: gPlaytimeHeight ,
        fontSize: parseInt(gPlaytimeHeight/10),
        backgroundColor: `${gMainBgColor}`
      }),

      StatusbarPlugin.create({
        container: "#wave-statusbar",
        width: gStatusbarWidth,
        height: gStatusbarHeight ,
        fontSize: parseInt(gStatusbarHeight/2),
        backgroundColor: `${gMainBgColor}`
      }),

      FrequencyPlugin.create({
        container: "#wave-frequency",
        width: gFreqWidth,
        height: gFreqHeight
      }),
      VolmeterPlugin.create({
        container: "#wave-volmeter",
        //width: 512+256,
        width: gVolmeterWidth,
        height: gVolmeterHeight
      }),
      //DbxlinePlugin.create({
        //container: "#wave-db",
        //width: 512+256
      //})
      DbylinePlugin.create({
        container: "#wave-dby",
        height: gMainDbyHeight,
        width: gMainDbyWidth
      }),
      MiniMapPlugin.create({
        container: "#wave-minimap",
        backgroundColor: "black",
        height: gMainMiniBarHeight,
        width: gMainWaveformWidth
      }),




      //SpectrumPlugin.create({
        //waveform: waveform,
        //container: "#wave-spectrogram",
        //labels: true,
        //colorMap: colorMap
      //}),

    ]

  });

  //console.log("mmmmmmmmmmmmmmm----", waveform);

}

const PlaySvg = () => (
  <svg viewBox="0 0 1024 1024" width="1.2em" height="1.2em" fill="currentColor"><path d="M885.93 484.287L170.07 70.986c-21.333-12.317-48 3.079-48 27.713v826.603c0 24.634 26.667 40.03 48 27.713l715.86-413.302c21.333-12.317 21.333-43.109 0-55.426z"></path></svg>
)
const PauseSvg = () => (

  <svg viewBox="0 0 1024 1024" width="1.2em" height="1.2em" fill="currentColor"><path d="M950.857143 109.714286l0 804.571429q0 14.857143-10.857143 25.714286t-25.714286 10.857143l-292.571429 0q-14.857143 0-25.714286-10.857143t-10.857143-25.714286l0-804.571429q0-14.857143 10.857143-25.714286t25.714286-10.857143l292.571429 0q14.857143 0 25.714286 10.857143t10.857143 25.714286zm-512 0l0 804.571429q0 14.857143-10.857143 25.714286t-25.714286 10.857143l-292.571429 0q-14.857143 0-25.714286-10.857143t-10.857143-25.714286l0-804.571429q0-14.857143 10.857143-25.714286t25.714286-10.857143l292.571429 0q14.857143 0 25.714286 10.857143t10.857143 25.714286z" p-id="2015"></path></svg>

)

const ForwardSvg = () => (
<svg viewBox="0 0 1024 1024" width="1.2em" height="1.2em" fill="currentColor"><path d="M575.008 106.016l436 375.008q12.992 12 12.992 30.016t-12.992 28.992L575.008 918.048q-18.016 16.992-40.512 6.496T512 888.032v-752q0-26.016 22.496-36.512t40.512 6.496z m-512 0l436 375.008q12.992 12 12.992 30.016t-12.992 28.992L63.008 918.048q-18.016 16.992-40.512 6.496T0 888.032v-752q0-26.016 22.496-36.512t40.512 6.496z" p-id="4524"></path></svg>

)

const BackwardSvg = () => (
<svg viewBox="0 0 1024 1024" width="1.2em" height="1.2em" fill="currentColor"><path d="M448.992 106.016L12.992 482.016Q0 493.024 0 511.008t12.992 30.016l436 376.992q18.016 16.992 40.512 6.496T512 888V136q0-26.016-22.496-36.512t-40.512 6.496z m512 0l-436 376q-12.992 11.008-12.992 28.992t12.992 30.016l436 376.992q18.016 16.992 40.512 6.496T1024 888V136q0-26.016-22.496-36.512t-40.512 6.496z" p-id="5641"></path></svg>
)

  //<svg  width="1.2em" height="1.2em" viewBox="0 0 1024 1024" fill="currentColor">
    //<path d="M157.538462 157.538462h708.923076v708.923076H157.538462V157.538462z"/>
  //</svg>
const StopSvg = () => (

<svg viewBox="0 0 1024 1024" width="1.2em" height="1.2em" fill="currentColor"><path d="M950.857155 109.714286l0 804.571429q0 14.848-10.825143 25.746286t-25.746286 10.825143l-804.571429 0q-14.848 0-25.746286-10.825143t-10.825143-25.746286l0-804.571429q0-14.848 10.825143-25.746286t25.746286-10.825143l804.571429 0q14.848 0 25.746286 10.825143t10.825143 25.746286z" p-id="1115"></path></svg>

)

let MinimapBarCanvasInstance = null
class EditPage extends React.Component {
  constructor(){
    super()
    this.state = {
      canvasWidth: 300
    }
  }

  componentWillMount() {
  }

  componentDidMount() {
    const {navigation, edit} = this.props.store;
    navigation.setNav('audio_edit');

    initLayout();
    loadColorMap();
    // init minimap Bar

    if (window.pageXOffset < gNavWidth) {
      edit.setSwitchView("right");
    } else {
      edit.setSwitchView("left");
    }

    window.onscroll = () => {
      if (window.pageXOffset < gNavWidth) {
        edit.setSwitchView("right");
      } else {
        edit.setSwitchView("left");
      }
    }
    //点击鼠标右键
    window.oncontextmenu = function(ev){
      document.getElementById("menu").style.display = "block";
      //event--ie  ev--其他浏览器
      var oEvent = event||ev;
      //documentElement--其他游览器    body--谷歌
      var scrollTop = document.documentElement.scrollTop||document.body.scrollTop;
      //菜单的style样式跟随鼠标的位置
      document.getElementById("menu").style.top = oEvent.clientY + scrollTop + "px";
      var scrollLeft = document.documentElement.scrollLeft||document.body.scrollLeft;
      document.getElementById("menu").style.left = oEvent.clientX + scrollLeft + "px";
      //阻止系统默认的右键菜单
      return false;
    }
    //点击页面，自定义菜单消失
    window.document.onclick = function(){
        document.getElementById("menu").style.display = "";
    }
  }

  componentWillUnmount() {}

  render() {
    const {lang, edit} = this.props.store;
    let self = this
    const loadAudio = (file) => {

      console.log("111111111111111111111111========> : ", file);

      waveform.on('ready', function () {
        //console.log("11111111111111ffffffffffffffffffffffffff", window.innerHeight);
        // console.log("waveform", waveform);
        self.setState({ canvasWidth: waveform.params.width })
        MinimapBarCanvasInstance = new MinimapBarCanvas()
        MinimapBarCanvasInstance.initWave()
        MinimapBarCanvasInstance.drawLines(0, 0, self.state.canvasWidth, `${gMainMiniBarHeight}px`)
      });

      waveform.loadBlob(file)

      window.scrollTo({left: gNavWidth, behavior: "smooth" });
    }

    const play = () => {waveform.play(); edit.setPlaying(true)}
    const playSection = () => {
      if (waveform.section.section) {
        let start = waveform.section.getStartTime();
        let end = waveform.section.getEndTime();

        waveform.play(start, end);
      } else {
        waveform.play();
      }

      edit.setPlaying(true);
    }
    const pause = () => {waveform.pause(); edit.setPlaying(false)}
    const stop = () => {waveform.stop(); edit.setPlaying(false)}
    const fastForward = () => {waveform.skipForward()}
    const fastBackward = () => {waveform.skipBackward()}
    const switchView = () => {
      if (edit.switchView == "left") {
        window.scrollTo({left: 0, behavior: "smooth"});
      } else {
        window.scrollTo({left: gNavWidth, behavior: "smooth"});
      }

    }
    const switchViewIcon = () => {
      if (edit.switchView == "left") {
        return "double-right"
      } else {
        return "double-left"
      }
    }

    return (
      <div>
        <ul id="menu">
            <li>返回</li>
            <li>登录</li>
            <li>设置</li>
            <li>属性</li>
        </ul>
        <Layout style={{ minHeight: '100vh', height: '100%', backgroundColor: `${gBgColor}` }}>

          <Navigation/>

          <Layout style={{ marginLeft: gNavWidth}}>
            <Content style={{position: "absolute", backgroundColor: `${gBgColor}`, height: '100%', width: '100%'}}>
              <div style={{position: "relative", marginLeft: `${gMainMarginLeft}px`, backgroundColor: `${gMainBgColor}`,
                           height: `${gActionButtonHeight}px`, width: `calc(100% - ${gMainMarginLeft}px)`}}>
                <AudioButton icon={switchViewIcon()}
                                   iconColor={"#0172de"} iconHoverColor={'rgb(60,161,236)'}
                                   borderRadius={"0px"} borderColor={"rgb(13,13,13)"} backgroundColor={"rgb(13,13,13)"}
                                   onClick={switchView} />
                <Upload
                  action=""
                  beforeUpload={loadAudio}
                  showUploadList={false}
                  marginLeft={"2px"}
                >
                  <AudioButton icon={'folder-open'} iconWorkingColor={'rgb(32,153,34)'}/>
                </Upload>
                <AudioButton icon={'export'}  iconWorkingColor={'yellow'} onClick={exportRenderBuffer} />
                <AudioButton icon={'scissor'}  iconWorkingColor={'yellow'} onClick={cutDelete} />
                <AudioButton icon={'undo'}  iconWorkingColor={'yellow'} onClick={recoverAction} />
              </div>

              <div style={{position: "relative", backgroundColor: `${gBgColor}`, width:"100%", height: `calc(100% - ${gActionButtonHeight+gMainMarginTop}px)`}}>
                <div id="wave-main" style={{position: "relative",
                                            paddingLeft: `${gMainPadding}px`, paddingRight: `${gMainPadding}px`, paddingTop: `${gMainPadding}px`,
                                            marginLeft: `${gMainMarginLeft}px`, marginTop: `${gMainMarginTop}px`,
                                            width: `calc(100% - ${gMainMarginLeft}px)`, height: `calc(80% - ${gMainMarginTop}px)`, backgroundColor: `${gMainBgColor}`}}>
                    <div id="wave-minimap" style={{height: `${gMainMiniBarHeight}px`, backgroundColor: `black`,
                                                   width: `calc(100% - ${gMainDbyWidth+gMainPadding}px)`, position: 'relative'}}>
                      <svg
                        id="bar-chart"
                        width={this.state.canvasWidth}
                        height={`${gMainMiniBarHeight}px`}
                        style={{ position:'absolute' }}
                        >
                        </svg>
                    </div>
                    <div id="wave-timeline" style={{height: `${gMainTimelineHeight}px`, marginTop: `${gMainTimelineMarginTop}px`}}/>
                    <div id="wave-waveform" style={{height: "100%"}}>
                      <div id="wave-dby"/>
                    </div>
                </div>
                <div style={{position: "relative", backgroundColor: `${gBgColor}`, width:"100%", height: `20%`}}>
                  <div style={{position: "relative", marginLeft: `${gMainMarginLeft}px`, marginTop: `${gMainMarginTop}px`,
                               width: `calc(100% - ${gMainMarginLeft}px)`, height: `${gActionButtonHeightBig}px`, backgroundColor: `${gBgColor}`}}>
                    <div style={{position: "relative", float: "left", width: `${gActionButtonHeightBig*6}px`, backgroundColor: `${gMainBgColor}`}}>
                      <AudioButton width={'50px'} height={'50px'} isWorking={edit.isPlaying} iconSvg={PlaySvg}  iconWorkingColor={'rgb(32,153,34)'} onClick={play} />
                      <AudioButton width={'50px'} height={'50px'} isWorking={edit.isPlaying} iconSvg={PlaySvg}  iconWorkingColor={'rgb(32,153,34)'} onClick={playSection} />
                      <AudioButton width={'50px'} height={'50px'} iconSvg={PauseSvg}  iconWorkingColor={'yellow'} onClick={pause} />
                      <AudioButton width={'50px'} height={'50px'} iconSvg={BackwardSvg}  iconWorkingColor={'yellow'} onClick={fastBackward} />
                      <AudioButton width={'50px'} height={'50px'} iconSvg={ForwardSvg}  iconWorkingColor={'yellow'} onClick={fastForward} />
                      <AudioButton width={'50px'} height={'50px'} iconSvg={StopSvg}  iconWorkingColor={'yellow'} onClick={stop} />
                    </div>

                    <div id="wave-playtime" style={{position: "relative", float: "left", marginLeft: `${gMainMarginLeft}px`,
                                 width: "15%", height: `100%`, backgroundColor: `${gMainBgColor}`, }}>
                    </div>

                    <div style={{position: "relative", float: "left", width: `400px`, height: `${gActionButtonHeightBig}px`,
                                 marginLeft: `${gMainMarginLeft}px`, backgroundColor: `${gMainBgColor}`}}>
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-in'}  iconWorkingColor={'yellow'} onClick={doZoomIn} />
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-out'}  iconWorkingColor={'yellow'} onClick={doZoomOut} />
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-out'}  iconWorkingColor={'yellow'} onClick={doZoomReset} />
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-in'}  iconWorkingColor={'yellow'} onClick={doZoomInLeft} />
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-out'}  iconWorkingColor={'yellow'} onClick={doZoomOutLeft} />
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-in'}  iconWorkingColor={'yellow'} onClick={doZoomInRight} />
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-out'}  iconWorkingColor={'yellow'} onClick={doZoomOutRight} />
                      <AudioButton width={`${gActionButtonHeightBig}px`} height={`${gActionButtonHeightBig}px`} icon={'zoom-in'}  iconWorkingColor={'yellow'} onClick={doZoomSelection} />
                    </div>

                    <div id="wave-selectionview" style={{position: "relative", float: "right", width: `calc(85% - ${50*6+50*8+gMainMarginLeft*3}px)`, height: "100%",
                                                         marginLeft: `${gMainMarginLeft}px`, backgroundColor: `${gMainBgColor}`}}>
                    </div>
                  </div>
                  <div style={{position: "relative", backgroundColor: `${gBgColor}`, width:"100%", height: `calc(100% - ${gActionButtonHeightBig+gFileInfoHeight+gMainMarginTop+gSecondMarginTop}px)`}}>
                    <div style={{position: "relative", float: "left", marginLeft: `${gMainMarginLeft}px`,
                                                    width: "80%", height: `100%`, backgroundColor: `${gMainBgColor}`}}>
                      <div id="wave-volmeter" style={{height: `100%`}}/>
                    </div>
                    <div id="wave-frequency" style={{position: "relative", float: "left",marginTop: `${gMainMarginTop}px`,
                                 width: `calc(20% - 2*${gMainMarginLeft}px)`, height: `calc(100% - ${gMainMarginTop}px)`, backgroundColor: `${gMainBgColor}`, }}>
                    </div>

                  </div>

                  <div id="wave-statusbar" style={{position: "relative", marginLeft: `${gMainMarginLeft}px`, marginTop: `${gSecondMarginTop}px`,
                               width: `calc(100% - ${gMainMarginLeft}px)`, height: `${gFileInfoHeight}px`, backgroundColor: `${gMainBgColor}`}}>
                  </div>
                </div>
              </div>
            </Content>
          </Layout>
        </Layout>
      </div>
    );
  }
}

export default inject('store')(observer(EditPage))


//play, playselect,pause,back,forward,stop
//gain2, zoom..., vol/speed control


                  //<Slider
                    //min={20}
                    //max={600}
                    //step={1}
                    //defaultValue={20}
                    //onChange={changeZoom}
                  ///>
//calc(100% - ${gActionButtonHeightBig*5-50}px)
//rgb(32,153,34)
//#5DADE2
  //<AudioButton width={'50px'} height={'50px'} isWorking={edit.isPlaying} iconSvg={PlaySvg}  iconWorkingColor={'rgb(32,153,34)'} onClick={play} />
