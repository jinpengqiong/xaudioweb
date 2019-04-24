import {Alert, Layout} from 'antd';

const {Row, Col, Header, Footer} = Layout;

import {Margin} from '../components/BaseStyle';
import langmap from '../config/langmap';


function CommonHeader() {
  return (
    <Header style={{ background: '#001528', padding: 0, position: "fixed", zIndex: 1, width: '100%' }} >
      <Margin left='18px'>
        <font color="white" size="4">
        XAudioPro
        </font>
      </Margin>
    </Header>
  );
}

function CommonNoteTip({lang}) {
  return (
    <Margin left='0px' right='0px' top='0px' bottom='10px'>
      <Alert banner showIcon={true} message={langmap.CommonTip[lang]} type='info'/>  
    </Margin>
  )
}

function CommonFooter() {
  return (
    <Footer style={{ textAlign: 'center' }}>
      XAudioPro ©2019 Created by luolongzhi 
    </Footer>
  );
}


export {CommonHeader, CommonFooter, CommonNoteTip};
