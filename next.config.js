module.exports = {
  exportPathMap: () => ({
    '/': { page: '/index' },
  }),


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
}
