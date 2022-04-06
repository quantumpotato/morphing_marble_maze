module.exports = {
  lintOnSave: false,
  devServer: {
    allowedHosts: ['skewer.localhost'],
    proxy: 'http://localhost:4000',
  },
}

if (process.env.NODE_ENV === 'production') {
  module.exports.publicPath = '/morphing_marble_maze'
}