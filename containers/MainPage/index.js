
import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../../config/theme';
import env from '../../config/env';
import * as logic from './logic';

import {Layout, Row, Col, Menu, Breadcrumb} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../../components/BaseStyle';

import Navigation from '../Navigation';

const {Header, Footer, Sider, Content} = Layout;


class MainPage extends React.Component {
  componentWillMount() {
    logic.init(this.props);
  }

  componentDidMount() {
    //logic.init(this.props);
  }

  componentWillUnmount() {}

  render() {
    const {store} = this.props;

    console.log('1111111111111', store)
    return (
      <div>
        <Layout style={{ minHeight: '100vh' }}>

          <Navigation/>

          <Layout style={{ marginLeft: 200 }}>
            <Content>
              <WrapperRelative>
              网站在建中
              </WrapperRelative>
            </Content>
          </Layout>


        </Layout>
      </div>
    );
  }
}

export default inject('store')(observer(MainPage))




