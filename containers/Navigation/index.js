
import React from 'react';
import Router from 'next/router'
import Link from 'next/link';

import {inject, observer} from 'mobx-react';
//import {checkLoginExpired, storeSelector} from '../../utils/common';

import {Layout, Menu, Icon} from 'antd';
import * as logic from './logic';
import langmap from '../../config/langmap';

const {Header, Footer, Sider, Content} = Layout;

class Navigation extends React.Component {
  componentWillMount() {
    console.log("5555555555555555555555555", this.props);
    logic.init(this.props.store);
  }

  componentWillUnmount() {}

  handleClick = e => {
    logic.setNav(e.key);
  };

  render() {
    console.log("66666666666666", this.props);

    const {navigation} = this.props.store;

    console.log("77777777777777",navigation);

    return (
      <Sider style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0 }}>

        <Menu
          onClick={this.handleClick}
          selectedKeys={[navigation.nav]}
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[navigation.nav]}
          style={{lineHeight: '64px'}}>
          <Menu.Item key="stream1">
            <Icon type="cloud" />
            我的生活
          </Menu.Item>
          <Menu.Item key="stream2">
            <Icon type="cloud" />
            我的生活
          </Menu.Item>


        </Menu>
      </Sider>
    );
  }
}

export default inject('store')(observer(Navigation));



