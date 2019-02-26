import Document, { Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

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
          <title>管理后台</title>
          <link
            href="/static/antd.min.css"
            rel="stylesheet"
          />

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

            //href="https://cdn.bootcss.com/antd/3.11.6/antd.css"
          //<script src="https://cdn.bootcss.com/jquery/3.2.1/jquery.min.js"></script>

            //href="https://cdn.bootcss.com/antd/3.1.6/antd.css"
            //href="https://cdn.bootcss.com/antd/2.13.11/antd.min.css"
            //href="http://image.mzliaoba.com/lib/antd.css"
            //href="https://cdn.bootcss.com/antd/2.13.5/antd.min.css"
            //href="https://cdnjs.cloudflare.com/ajax/libs/antd/3.0.0/antd.min.css"

