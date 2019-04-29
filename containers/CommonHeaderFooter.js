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
    <Margin left='0px' right='0px' top='65px' bottom='10px'>
      <Alert banner showIcon={true} message={langmap.CommonTip[lang]} type='info'/>  
    </Margin>
  )
}

function CommonFooter() {
  return (
    <div>
      <Footer style={{ textAlign: 'center' }}>
        <font color="#9e9e9e" size="2" >
          剪音网 www.xudiopro.com ©2019 Created by luolongzhi  (网站备案号: 蜀ICP备17042496号-2)  --- QQ技术支持群: 568123255
        </font>
      </Footer>
    </div>
  );
}


export {CommonHeader, CommonFooter, CommonNoteTip};
