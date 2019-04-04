import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Radio, Input, Progress, Button, Upload, Icon} from 'antd';
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
              <WrapperRelative>
                <RadioGroup onChange={denoise.onChangeMode} value={denoise.mode}>
                  <Radio style={radioStyle} value={"rnn"}>{langmap.DenoiseRNN[lang]}</Radio>
                  <Radio style={radioStyle} value={"fft_lms"}>{langmap.DenoiseFFTLMS[lang]}</Radio>
                  <Radio style={radioStyle} value={"fft_lms_lpf"}>{langmap.DenoiseFFTLMSLPF[lang]}</Radio>
                </RadioGroup>

                <Progress percent={denoise.progress} />


                <Upload 
                 action=""
                 beforeUpload={denoise.openFile}
                 >
                  <Button>
                    <Icon type="upload"/> {"upload"} 
                  </Button>
                </Upload>


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
export default inject('store')(observer(DenoisePage))




