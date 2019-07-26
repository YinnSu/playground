'use strict';

const path = require('path');
const { HotModuleReplacementPlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const samplePath = path.resolve('../samples.generative.fm/src/samples');

module.exports = {
  mode: 'development',
  devtool: 'sourcemap',
  devServer: {
    //contentBase: samplePath,
  },
  plugins: [new HotModuleReplacementPlugin(), new HtmlWebpackPlugin()],
};
