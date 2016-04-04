const merge = require('lodash.merge');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const baseConfig = require('./config.base');

module.exports = merge(baseConfig, {
  entry: baseConfig.entry.concat([
    'webpack-hot-middleware/client',
  ]),

  output: {
    filename: 'static/bundle.js',
  },

  module: {
    loaders: baseConfig.module.loaders.concat([
      {
        test: /\.css$/,
        loaders: [
          'style',
          'css?modules&sourceMap&localIdentName=[name]---[local]---[hash:base64:5]',
          'postcss',
        ],
      },
    ]),
  },

  devtool: '#sourcemap',

  plugins: baseConfig.plugins.concat([
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new HtmlWebpackPlugin({ template: '../index.html', hash: true, inject: false }),
  ]),
});
