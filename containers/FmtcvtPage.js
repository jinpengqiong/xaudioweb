import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Select, Input, Progress, 
        Button, Upload, Icon, Slider, Switch, Alert,
        Form, Divider, Spin} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../components/BaseStyle';
import {CommonHeader, CommonFooter, CommonNoteTip} from './CommonHeaderFooter';

import Navigation from './Navigation';
import langmap from '../config/langmap';

const {Header, Footer, Sider, Content} = Layout;
const Option = Select.Option;
const antIcon = <Icon type="loading" style={{ fontSize: 18 }} spin />;

const radioStyle = {
  display: 'block',
  height: '30px',
  lineHeight: '30px',
};

const formItemLayout = {
  labelCol: {
    xs: { span: 12 },
    sm: { span: 3 },
    style: {"textAlign": "left"}
  },

  wrapperCol: {
    xs: { span: 6 },
    sm: { span: 4 },
  },
};


const OutputFormatOptions = ({...fmtcvtConfig}) => { 
  let list = [];

  for(let i = 0; i < fmtcvtConfig.fmtList.length; i++) {
    list.push(<Option key={'fmt'+i.toString()} value={fmtcvtConfig.fmtList[i]}>{fmtcvtConfig.fmtList[i]}</Option>)
  }

  return (<Select value={fmtcvtConfig.fmt}  onChange={fmtcvtConfig.changeFmt}>
          {list}
         </Select>)
};

const SamplerateOptions = ({...fmtcvtConfig}) => { 
  let list = [];
  let samplerateList;

  if (fmtcvtConfig.fmt == 'ogg(opus)') {
    samplerateList = fmtcvtConfig.oggopusSamplerateList;
  } else if (fmtcvtConfig.fmt == 'opus') {
    samplerateList = fmtcvtConfig.opusSamplerateList;
  } else if (fmtcvtConfig.fmt == 'ac3') {
    samplerateList = fmtcvtConfig.ac3SamplerateList;
  } else {
    samplerateList = fmtcvtConfig.samplerateList;
  }

  for(let i = 0; i < samplerateList.length; i++) {
    list.push(<Option key={'samplerate'+i.toString()} value={samplerateList[i]}>{samplerateList[i] + ' kHz'}</Option>)
  }

  return (<Select value={fmtcvtConfig.samplerate}  onChange={fmtcvtConfig.changeSamplerate}>
          {list}
         </Select>)
};


const ChannelOptions = ({...fmtcvtConfig}) => { 
  return (<Select value={fmtcvtConfig.channel}  onChange={fmtcvtConfig.changeChannel}>
            <Option key={'channel_stereo'} value={'2'}>{langmap.Stereo[fmtcvtConfig.lang]}</Option>
            <Option key={'channel_mono'} value={'1'}>{langmap.Mono[fmtcvtConfig.lang]}</Option>
         </Select>)
};


const bitrateName = (lang, bitrate, defaultBitrate) => {
  if (bitrate == defaultBitrate) {
    return bitrate + ' kbps (' + langmap.Recommend[lang] + ')';
  } else {
    return bitrate + ' kbps';
  }
}

const disableBitrate = (fmt) => {
  if (fmt == 'wav' || fmt == 'flac')
    return true;
  else 
    return false;
}

const BitrateOptions = ({...fmtcvtConfig}) => { 
  let list = [];
  let bitrateList, defaultBitrate, handleChange;

  switch (fmtcvtConfig.fmt) {
    case 'mp3':
      bitrateList = fmtcvtConfig.mp3BitrateList;
      defaultBitrate = fmtcvtConfig.mp3DefaultBitrate;
      break;
    case 'aac':
    case 'm4a':
      bitrateList = fmtcvtConfig.aacBitrateList;
      defaultBitrate = fmtcvtConfig.aacDefaultBitrate;
      break;
    case 'ogg(opus)':
      bitrateList = fmtcvtConfig.oggopusBitrateList;
      defaultBitrate = fmtcvtConfig.oggopusDefaultBitrate;
      break;
    case 'opus':
      bitrateList = fmtcvtConfig.opusBitrateList;
      defaultBitrate = fmtcvtConfig.opusDefaultBitrate;
      break;
    case 'wma':
      bitrateList = fmtcvtConfig.wmaBitrateList;
      defaultBitrate = fmtcvtConfig.wmaDefaultBitrate;
      break;
    case 'ac3':
      bitrateList = fmtcvtConfig.ac3BitrateList;
      defaultBitrate = fmtcvtConfig.ac3DefaultBitrate;
      break;
    case 'wav':
    case 'flac':
      bitrateList = [];
      defaultBitrate = '';
      break;
  }

  for(let i = 0; i < bitrateList.length; i++) {
    list.push(<Option key={'bitrate'+i.toString()} value={bitrateList[i]}>
              {bitrateName(fmtcvtConfig.lang, bitrateList[i], defaultBitrate)}
              </Option>)
  }

  return (<Select value={fmtcvtConfig.bitrate}  onChange={fmtcvtConfig.changeBitrate} disabled={disableBitrate(fmtcvtConfig.fmt)}>
          {list}
         </Select>)
};


class FmtcvtPage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
    const {navigation} = this.props.store;
    navigation.setNav('audio_covert_format');
  }

  componentWillUnmount() {}

  render() {
    const {lang, fmtcvt} = this.props.store;

    let fmtcvtConfig = {
      lang: lang,
      fmt: fmtcvt.fmt,
      bitrate: fmtcvt.bitrate,
      samplerate: fmtcvt.samplerate,
      channel: fmtcvt.channel,

      fmtList: fmtcvt.fmtList,
      defaultFmt: fmtcvt.defaultFmt,

      samplerateList: fmtcvt.samplerateList,
      oggopusSamplerateList: fmtcvt.oggopusSamplerateList,
      opusSamplerateList: fmtcvt.opusSamplerateList,
      ac3SamplerateList: fmtcvt.ac3SamplerateList,

      mp3BitrateList: fmtcvt.mp3BitrateList,
      mp3DefaultBitrate: fmtcvt.mp3DefaultBitrate,
      aacBitrateList: fmtcvt.aacBitrateList,
      aacDefaultBitrate: fmtcvt.aacDefaultBitrate,
      oggopusBitrateList: fmtcvt.oggopusBitrateList,
      oggopusDefaultBitrate: fmtcvt.oggopusDefaultBitrate,
      opusBitrateList: fmtcvt.opusBitrateList,
      opusDefaultBitrate: fmtcvt.opusDefaultBitrate,
      wmaBitrateList: fmtcvt.wmaBitrateList,
      wmaDefaultBitrate: fmtcvt.wmaDefaultBitrate,
      ac3BitrateList: fmtcvt.ac3BitrateList,
      ac3DefaultBitrate: fmtcvt.ac3DefaultBitrate,

      changeFmt: fmtcvt.changeFmt,
      changeBitrate: fmtcvt.changeBitrate,
      changeSamplerate: fmtcvt.changeSamplerate,
      changeChannel: fmtcvt.changeChannel,

      isLoading: fmtcvt.isLoading,
      isProcessing: fmtcvt.isProcessing,

    };

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
              <Row>
                <Col span={30} offset={1}>
                {langmap.AudioCovertInputSupport[lang]}
                </Col>
              </Row>

              <WrapperRelative top={"30px"}>
                <Row>
                  <Col span={30} offset={1}>
                    <Form >
                      <Form.Item {...formItemLayout} label={langmap.OutputFormat[lang] }>
                        <OutputFormatOptions {...fmtcvtConfig}/>
                      </Form.Item>

                      <Form.Item {...formItemLayout} label={langmap.SampleRate[lang] }>
                        <SamplerateOptions {...fmtcvtConfig}/>
                      </Form.Item>

                      <Form.Item {...formItemLayout} label={langmap.Channel[lang] }>
                        <ChannelOptions {...fmtcvtConfig}/>
                      </Form.Item>

                      <Form.Item {...formItemLayout} label={langmap.Bitrate[lang] }>
                        <BitrateOptions {...fmtcvtConfig}/>
                      </Form.Item>
                    </Form>

                    <Col span={20}>
                      <Progress percent={fmtcvt.progress} />
                      <br/>
                      <Upload 
                       action=""
                       beforeUpload={fmtcvt.openFile}
                       showUploadList={false}
                       >
                        <Col span={4}>
                          <Button disabled={fmtcvt.isProcessing}>
                            <Icon type="upload"/> {langmap.UploadProcess[lang]} 
                          </Button>
                        </Col>
                        <Col span={2} offset={18}>
                          <Spin spinning={fmtcvt.isLoading} indicator={antIcon} />
                        </Col>
                      </Upload>
                      <div>{fmtcvt.fileName} </div>
                    </Col>
                  </Col>
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

export default inject('store')(observer(FmtcvtPage))




