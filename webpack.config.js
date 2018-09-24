'use strict';

const { HotModuleReplacementPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devServer: {
    //hot: true
  },
  plugins: [new HotModuleReplacementPlugin(), new HtmlWebpackPlugin()],
};
