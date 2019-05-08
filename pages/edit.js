import React from 'react';
import {Provider} from 'mobx-react';
import initRootStore from '../stores';
import EditPage from '../containers/EditPage';

import '../static/antd-custom.less'

export default class Edit extends React.Component {
  //static getInitialProps({req}) {
    //const isServer = !!req;
    //const store = initRootStore(isServer);
    //return {lang: store.lang, isServer};
  //}

  constructor(props) {
    super(props);
    this.store = initRootStore(props.isServer, props.lang);
  }

  render() {
    return (
      <Provider store={this.store}>
        <EditPage />
      </Provider>
    );
  }
}
