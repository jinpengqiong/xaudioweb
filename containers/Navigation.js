
import React from 'react';
import Router from 'next/router'
import Link from 'next/link';

import {inject, observer} from 'mobx-react';

import {Layout, Menu, Icon} from 'antd';
import langmap from '../config/langmap';

const {Header, Footer, Sider, Content} = Layout;

class Navigation extends React.Component {
  componentWillMount() {
  }

  componentDidMount() {
  }

  componentWillUnmount() {}

  handleClick = e => {
    const {navigation} = this.props.store;
    navigation.setNav(e.key);
  };

  render() {
    const {navigation} = this.props.store;

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



