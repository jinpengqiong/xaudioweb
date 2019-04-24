import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Radio, Input, Progress, 
        Button, Upload, Icon, Slider, Switch, Alert,
        Form, Divider} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../components/BaseStyle';
import {CommonHeader, CommonFooter, CommonNoteTip} from './CommonHeaderFooter';

import Navigation from './Navigation';
import langmap from '../config/langmap';

const {Header, Footer, Sider, Content} = Layout;
const RadioGroup = Radio.Group;

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
    sm: { span: 6 },
  },
};

const DescriptionFont = ({desc}) => {
  return (
    <div>
      <br/>
      <br/>
      <font color="#9e9e9e" size="1" style={{fontStyle: "italic"}}>
        {desc}
      </font>
    </div>
  );
};


class DenoisePage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
    const {navigation} = this.props.store;
    navigation.setNav('audio_process_denoise');
  }

  componentWillUnmount() {}

  render() {
    const {lang, denoise} = this.props.store;


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
                    <RadioGroup onChange={denoise.onChangeMode} value={denoise.mode}>
                      <Radio style={radioStyle} value={"fft_lms_lpf"}>{langmap.DenoiseFFTLMSLPF[lang]}</Radio>
                      <WrapperRelative left={"25px"}>
                        <WrapperRelative top={"20px"}>
                          <Form >
                            <Form.Item {...formItemLayout} label={langmap.DenoiseGain[lang] }>
                              <Input value={denoise.gain} name="gain" onChange={denoise.updateAttrs} addonAfter="[0.5 - 3.0]"/>
                            </Form.Item>
                            <Form.Item {...formItemLayout} label={langmap.DenoiseLPFFc[lang]}>
                              <Input value={denoise.lpfFc} name="lpfFc" onChange={denoise.updateAttrs} addonAfter="[0.3 - 1.0]"/>
                            </Form.Item>
                          </Form>
                        </WrapperRelative>
                        <DescriptionFont desc={langmap.DenoiseFFTLMSLPFDesc[lang]}/>
                      </WrapperRelative>
                      <Divider />
                      <Radio style={radioStyle} value={"fft_lms"}>{langmap.DenoiseFFTLMS[lang]}</Radio>
                      <WrapperRelative left={"25px"}>
                        <WrapperRelative top={"20px"}>
                          <Form >
                            <Form.Item {...formItemLayout} label={langmap.DenoiseGain[lang] }>
                              <Input value={denoise.gain} name="gain" onChange={denoise.updateAttrs} addonAfter="[0.5 - 3.0]"/>
                            </Form.Item>
                          </Form>
                        </WrapperRelative>
                        <DescriptionFont desc={langmap.DenoiseFFTLMSDesc[lang]}/>
                      </WrapperRelative>
                      <Divider />
                      <Radio style={radioStyle} value={"rnn"}>{langmap.DenoiseRNN[lang]}</Radio>
                      <WrapperRelative left={"25px"}>
                        <DescriptionFont desc={langmap.DenoiseRNNDesc[lang]}/>
                      </WrapperRelative>

                    </RadioGroup>
                    <Divider />
                    <br/>
                    <Col span={20}>
                      <Progress percent={denoise.progress} />
                      <br/>
                      <Upload 
                       action=""
                       beforeUpload={denoise.openFile}
                       showUploadList={false}
                       >
                        <Button>
                          <Icon type="upload"/> {langmap.UploadProcess[lang]} 
                        </Button>
                      </Upload>
                      <div>{denoise.fileName} </div>
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

                //<Input type='file' onChange={denoise.openFile}/>
                        //<Alert message={langmap.DenoiseFFTLMSLPFDesc[lang]} type="warning" />
export default inject('store')(observer(DenoisePage))




