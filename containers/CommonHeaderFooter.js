import {Layout} from 'antd';

const {Header, Footer} = Layout;

function CommonHeader() {
  return (
    <Header style={{ background: 'black', padding: 0 }} />
  );
}

function CommonFooter() {
  return (
    <Footer style={{ textAlign: 'center' }}>
      XAudioPro ©2019 Created by luolongzhi 
    </Footer>
  );
}


export {CommonHeader, CommonFooter};
