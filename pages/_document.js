import Document, { Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

import env from '../config/env';

const baidujs = () => {
  if (env.BAIDU) {
    return (<script src="/static/baidu.js"> </script>)
  }
}

/* eslint-disable */
export default class MyDocument extends Document {
  render() {
    const sheet = new ServerStyleSheet()
    const main = sheet.collectStyles(<Main />)
    const styleTags = sheet.getStyleElement()
    let _hmt = _hmt || [];

    return (
      <html>
        <Head>
          <title>剪音网</title>
          <link rel="shortcut icon" href="/static/favicon.ico" />
          <link rel="bookmark" href="/static/favicon.ico" type="image/x-icon"　/> 
          <script src="https://unpkg.com/wavesurfer.js"></script>

          {baidujs()}

          {styleTags}
        </Head>
        <body>
          <div className="root">{main}</div>
          <NextScript />
        </body>
      </html>
    )
  }
}

          //<script src="/static/download.js"> </script>
