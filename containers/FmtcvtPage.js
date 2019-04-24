import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Select, Input, Progress, 
        Button, Upload, Icon, Slider, Switch, Alert,
        Form, Divider} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../components/BaseStyle';
import {CommonHeader, CommonFooter, CommonNoteTip} from './CommonHeaderFooter';

import Navigation from './Navigation';
import langmap from '../config/langmap';

const {Header, Footer, Sider, Content} = Layout;
const Option = Select.Option;

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

  for(let i = 0; i < fmtcvtConfig.samplerateList.length; i++) {
    list.push(<Option key={'samplerate'+i.toString()} value={fmtcvtConfig.samplerateList[i]}>{fmtcvtConfig.samplerateList[i] + ' kHz'}</Option>)
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

const BitrateOptions = ({...fmtcvtConfig}) => { 
  let list = [];
  let bitrateList, defaultBitrate, handleChange;

  switch (fmtcvtConfig.fmt) {
    case 'mp3':
      bitrateList = fmtcvtConfig.mp3BitrateList;
      defaultBitrate = fmtcvtConfig.mp3DefaultBitrate;
      break;
    case 'aac':
      bitrateList = fmtcvtConfig.aacBitrateList;
      defaultBitrate = fmtcvtConfig.aacDefaultBitrate;
      break;
  }

  for(let i = 0; i < bitrateList.length; i++) {
    list.push(<Option key={'bitrate'+i.toString()} value={bitrateList[i]}>
              {bitrateName(fmtcvtConfig.lang, bitrateList[i], defaultBitrate)}
              </Option>)
  }

  return (<Select value={fmtcvtConfig.bitrate}  onChange={fmtcvtConfig.changeBitrate}>
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
      mp3BitrateList: fmtcvt.mp3BitrateList,
      mp3DefaultBitrate: fmtcvt.mp3DefaultBitrate,
      aacBitrateList: fmtcvt.aacBitrateList,
      aacDefaultBitrate: fmtcvt.aacDefaultBitrate,

      changeFmt: fmtcvt.changeFmt,
      changeBitrate: fmtcvt.changeBitrate
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
                        <Button>
                          <Icon type="upload"/> {langmap.UploadProcess[lang]} 
                        </Button>
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




