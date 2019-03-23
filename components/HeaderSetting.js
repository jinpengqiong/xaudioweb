import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import theme from '../config/theme';
import env from '../config/env';
import langmap from '../config/langmap';
import {Header, Button, Row, Col, Menu, Dropdown, Icon} from 'antd';
import {Margin} from './BaseStyle';
import LangConfig from './LangConfig';
import * as utils from '../utils/common';


const HeaderSetting = ({version, lang, setLang, logout}) => {
  return (
    <Margin top='10px'>
      <Row>
        <Col span={4} offset={0}>
          <Margin left='25px' top="5px">
            <font color="darkblue" size="1">
              version: {version}
            </font>
          </Margin>
        </Col>

        <Col span={1} offset={15}>
          <Margin top="5px">
            <LangConfig lang={lang} onChange={setLang}/>
          </Margin>
        </Col>

        <Col span={1} offset={1}>
          <Button icon="arrow-right" shape="circle" onClick={logout}/>
        </Col>
      </Row>
    </Margin>
  );
}

HeaderSetting.propTypes = {
};

HeaderSetting.defaultProps = {
};

export default HeaderSetting;
