import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Radio, Input, Progress, Button, Upload, Icon, Slider, Switch, Alert} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../components/BaseStyle';
import {CommonHeader, CommonFooter} from './CommonHeaderFooter';

import Navigation from './Navigation';
import langmap from '../config/langmap';

const {Header, Footer, Sider, Content} = Layout;
const RadioGroup = Radio.Group;

const radioStyle = {
  display: 'block',
  height: '30px',
  lineHeight: '30px',
};

class DenoisePage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
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
              <WrapperRelative top={"30px"}>
                <Row>
                  <Col span={24} offset={1}>
                    <RadioGroup onChange={denoise.onChangeMode} value={denoise.mode}>
                      <Radio style={radioStyle} value={"fft_lms_lpf"}>{langmap.DenoiseFFTLMSLPF[lang]}</Radio>
                      <WrapperRelative left={"25px"}>
                        {langmap.DenoiseFFTLMSLPFDesc[lang]}
                      </WrapperRelative>
                      <br/>
                      <Radio style={radioStyle} value={"fft_lms"}>{langmap.DenoiseFFTLMS[lang]}</Radio>
                      <br/>
                      <Radio style={radioStyle} value={"rnn"}>{langmap.DenoiseRNN[lang]}</Radio>
                    </RadioGroup>
                    <br/>
                    <Progress percent={denoise.progress} />


                    <Upload 
                     action=""
                     beforeUpload={denoise.openFile}
                     showUploadList={false}
                     >
                      <Button>
                        <Icon type="upload"/> {"upload"} 
                      </Button>
                    </Upload>
                    <div>{denoise.fileName} </div>
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




