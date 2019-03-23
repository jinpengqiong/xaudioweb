import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import theme from '../config/theme';
import env from '../config/env';
import langmap from '../config/langmap';
import {Menu, Dropdown, Icon} from 'antd';
import * as utils from '../utils/common';


const LangConfig = ({lang, onChange}) => {
  const menu = (
    <Menu onClick={onChange}>
      <Menu.Item key="zh">
        中文
      </Menu.Item>
      <Menu.Item key="en">
        english
      </Menu.Item>
    </Menu>
  );

  return (
    <div>
      <Dropdown overlay={menu}>
        <a className="ant-dropdown-link" href="#">
        {langmap.langText[lang]} <Icon type="down" />
        </a>
      </Dropdown>

    </div>
  );
}

LangConfig.propTypes = {
  lang: PropTypes.string.isRequired,
  onChange: PropTypes.func
};

LangConfig.defaultProps = {
  lang: 'zh',
};

export default LangConfig;
