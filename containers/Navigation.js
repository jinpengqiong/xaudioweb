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

    return (
      <Sider
       style={{ overflow: 'auto', height: '100vh', position: 'fixed', left: 0, }}
      >
        <HeaderLogo2 backgroundImage={navigation.logo} />
        <br/>
        <Menu
          onClick={this.handleClick}
          defaultSelectedKeys={[navigation.nav]}
          defaultOpenKeys={[key2OpenKey(navigation.nav)]}
          theme="dark"
          mode="inline"
          >

          <SubMenu key="audio_process" title={<span><Icon type="tool" /><span>{langmap.AudioProcess[lang]}</span></span>}>
            <Menu.Item key="audio_process_denoise">
              <Link href="/denoise">
              <a>{langmap.AudioProcessDenoise[lang]}</a>
              </Link>
            </Menu.Item>
            <Menu.Item key="audio_process_bgm">
              <Link href="/bgm">
              <a>{langmap.AudioProcessBgm[lang]}</a>
              </Link>
            </Menu.Item>
          </SubMenu>

          <SubMenu key="audio_covert" title={<span><Icon type="swap" /><span>{langmap.AudioCovert[lang]}</span></span>}>
            <Menu.Item key="audio_covert_format">
              <Link href="/fmtcvt">
              <a>{langmap.AudioCovertFormat[lang]}</a>
              </Link>
            </Menu.Item>
          </SubMenu>


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
 

