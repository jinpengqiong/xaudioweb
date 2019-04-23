import React from 'react';
import Router from 'next/router'
import Link from 'next/link';

import {inject, observer} from 'mobx-react';

import {Layout, Icon, Menu, Button} from 'antd';
import {HeaderLogo2} from '../components/BaseStyle';

import langmap from '../config/langmap';

const {Header, Footer, Sider, Content} = Layout;
const SubMenu = Menu.SubMenu;

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
    const {lang, navigation} = this.props.store;

    console.log("1111111111111111", navigation.nav);
    return (
      <Sider
       style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, }}
      >
        <HeaderLogo2 backgroundImage={navigation.logo} />
        <Menu
          onClick={this.handleClick}
          selectedKeys={[navigation.nav]}
          theme="dark"
          mode="inline"
          >

          <Menu.Item key="audio_covert_format">
            <Icon type="swap" />
            <span>{langmap.AudioCovertFormat[lang]}</span>
            <Link href="/fmtcvt">
            <a>{langmap.AudioCovertFormat[lang]}</a>
            </Link>
          </Menu.Item>

          <Menu.Item key="audio_process_denoise">
            <Icon type="filter" />
            <span>{langmap.AudioProcessDenoise[lang]} </span>
            <Link href="/denoise">
            <a>{langmap.AudioProcessDenoise[lang]}</a>
            </Link>
          </Menu.Item>

          <Menu.Item key="audio_process_bgm">
            <Icon type="customer-service" />
            <span>{langmap.AudioProcessBgm[lang]}</span>
            <Link href="/bgm">
            <a>{langmap.AudioProcessBgm[lang]}</a>
            </Link>
          </Menu.Item>




        </Menu>
      </Sider>
    );
  }
}

const key2OpenKey = (key) => {
  if (key == 'audio_process_denoise' ||
      key == 'audio_process_bgm') {
      return 'audio_process';
  } else if (key == 'audio_covert_format') {
      return 'audio_covert';
  }
}

export default inject('store')(observer(Navigation));

      //<Sider
       //collapsible
       //collapsed={navigation.collapsed}
       //onCollapse={navigation.changeCollapsed}
       //style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, }}
      //>
 

