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

const {Header, Footer, Sider, Content} = Layout;
const RadioGroup = Radio.Group;
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
    sm: { span: 6 },
  },
};


class BgmPage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
    const {navigation} = this.props.store;
    navigation.setNav('audio_process_bgm');
  }

  componentWillUnmount() {}

  render() {
    const {lang, bgm} = this.props.store;


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
                    {langmap.BgmNote[lang]}
                  </Col>
                </Row>
                <br/>
                <Row>
                  <Col span={30} offset={1}>
                    <Col span={20}>
                      <Progress percent={bgm.progress} />
                      <br/>
                      <Upload 
                       action=""
                       beforeUpload={bgm.openFile}
                       showUploadList={false}
                       >
                        <Col span={4}>
                          <Button disabled={bgm.isProcessing}>
                            <Icon type="upload"/> {langmap.UploadProcess[lang]} 
                          </Button>
                        </Col>
                        <Col span={2} offset={18}>
                          <Spin spinning={bgm.isLoading} indicator={antIcon} />
                        </Col>
                      </Upload>
                      <div>{bgm.fileName} </div>
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

export default inject('store')(observer(BgmPage))




