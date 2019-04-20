import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Radio, Input, Progress, 
        Button, Upload, Icon, Slider, Switch, Alert,
        Form, Divider} from 'antd';
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

const formItemLayout = {
  labelCol: {
    xs: { span: 12 },
    sm: { span: 3 },
    style: {"text-align": "left"}
  },
  wrapperCol: {
    xs: { span: 6 },
    sm: { span: 6 },
  },
};


class FmtcvtPage extends React.Component {

  componentWillMount() {
  }

  componentDidMount() {
  }

  componentWillUnmount() {}

  render() {
    const {lang, fmtcvt} = this.props.store;


    return (
      <div>
        <Layout style={{ minHeight: '100vh' }}>

          <Navigation/>

          <Layout style={{ marginLeft: 200 }}>
            <CommonHeader/>
            <Content>
              <WrapperRelative top={"30px"}>
                <Row>
                  <Col span={30} offset={1}>
                    <Col span={20}>
                      <Progress percent={fmtcvt.progress} />
                      <br/>
                      <Upload 
                       action=""
                       beforeUpload={fmtcvt.openFile}
                       showUploadList={false}
                       >
                        <Button>
                          <Icon type="upload"/> {"upload"} 
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




