const withLess = require('@zeit/next-less')
const lessToJS = require('less-vars-to-js')
const fs = require('fs')
const path = require('path')

// Where your antd-custom.less file lives
const themeVariables = lessToJS(
  fs.readFileSync(path.resolve(__dirname, './static/antd-custom.less'), 'utf8')
  )
// fix: prevents error when .less files are required by node

if (typeof require !== 'undefined') {
  require.extensions['.less'] = file => {}
}


module.exports = withLess({
  exportPathMap: () => ({
    '/': { page: '/index' },
  }),

  lessLoaderOptions: {
    javascriptEnabled: true,
    modifyVars: themeVariables // make your antd custom effective
  },

  webpack: (config, { buildId, dev }) => {
    // Perform customizations to webpack config


    config.module.rules.push({
      test: /\.worker\.js$/,
      loader: 'worker-loader',
      //options: { name: '[hash].worker.js', publicPath: '/static/' }
      //options: { publicPath: '/static/' }
    })

    // Important: return the modified config
    return config
  },

  webpackDevMiddleware: config => {
    // Perform customizations to webpack dev middleware config

    // Important: return the modified config
    return config
  }
})
