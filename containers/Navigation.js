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
       collapsible
       collapsed={navigation.collapsed}
       onCollapse={navigation.changeCollapsed}
      >
        <HeaderLogo2 backgroundImage={navigation.logo} />
        <br/>
        <Menu
          onClick={this.handleClick}
          selectedKeys={[navigation.nav]}
          defaultOpenKeys={['audio_process']}
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[navigation.nav]}
          >

          <SubMenu key="audio_process" title={<span><Icon type="mail" /><span>{langmap.AudioProcess[lang]}</span></span>}>
            <Menu.Item key="audio_process_denoise">
              {langmap.AudioProcessDenoise[lang]}
            </Menu.Item>
          </SubMenu>

          <SubMenu key="audio_covert" title={<span><Icon type="mail" /><span>{langmap.AudioCovert[lang]}</span></span>}>
            <Menu.Item key="audio_covert_format">
              {langmap.AudioCovertFormat[lang]}
            </Menu.Item>
          </SubMenu>


        </Menu>
      </Sider>
    );
  }
}

export default inject('store')(observer(Navigation));



