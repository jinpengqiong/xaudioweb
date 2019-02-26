import React from 'react';
import {inject, observer} from 'mobx-react';

import R from 'ramda';

import theme from '../../config/theme';
import env from '../../config/env';
import {storeSelector} from '../../utils/common';

import {Layout, Row, Col, Menu, Breadcrumb} from 'antd';
import {ZeroWrapper, MainWrapper} from '../../components/BaseStyle';

import Navigation from '../Navigation';

const {Header, Footer, Sider, Content} = Layout;


class MainPage extends React.Component {
  componentWillMount() {
    //this.props.store.navigation.setNav('main');
  }

  componentWillUnmount() {}

  render() {
    const {store} = this.props;

    return (
      <div>
        <Layout style={{ minHeight: '100vh' }}>

          <Navigation/>

        </Layout>
      </div>
    );
  }
}

export default inject(storeSelector('store'))(observer(MainPage))

