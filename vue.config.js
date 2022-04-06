module.exports = {
  lintOnSave: false,
  devServer: {
    allowedHosts: ['skewer.localhost'],
    proxy: 'http://localhost:4000',
  },
}
