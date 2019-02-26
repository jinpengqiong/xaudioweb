import React from 'react';
import Router from 'next/router'
import Link from 'next/link';

import {inject, observer} from 'mobx-react';
import R from 'ramda';
import {storeSelector} from '../../utils/common';

import {Layout, Menu, Icon} from 'antd';
import {HeaderLogo2} from '../../components/BaseStyle';
import * as logic from './logic';
import langmap from '../../config/langmap';

const {Header, Footer, Sider, Content} = Layout;

class Navigation extends React.Component {
  componentWillMount() {
    logic.init(this.props.navigation);
  }

  componentWillUnmount() {}

  handleClick = e => {
    logic.setNav(e.key);
  };

  render() {
    const {navigation} = this.props;

    return (
      <Sider style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0 }}>
        <Menu
          onClick={this.handleClick}
          selectedKeys={[navigation.nav]}
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[navigation.nav]}
          style={{lineHeight: '64px'}}>

          <Menu.Item key="main">
            <Icon type="cloud" />
            <span>
            test
            </span>
            <Link href="/index">
            <a></a>
            </Link>
          </Menu.Item>

        </Menu>
      </Sider>
    );
  }
}

export default inject(storeSelector('navigation'))(observer(Navigation));
