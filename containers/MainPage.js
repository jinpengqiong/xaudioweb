import React from 'react';
import {inject, observer} from 'mobx-react';

import theme from '../config/theme';
import env from '../config/env';

import {Layout, Row, Col, Menu, Breadcrumb} from 'antd';
import {ZeroWrapper, MainWrapper, WrapperRelative} from '../components/BaseStyle';

import Navigation from './Navigation';

const {Header, Footer, Sider, Content} = Layout;


class MainPage extends React.Component {
  componentWillMount() {
  }

  componentDidMount() {
  }

  componentWillUnmount() {}

  render() {
    const {store} = this.props;

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




