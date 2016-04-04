const path = require('path');
const autoprefixer = require('autoprefixer');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  context: path.join(__dirname, '../js'),

  entry: [
    './app.js',
  ],

  output: {
    path: path.join(__dirname, '../build'),
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
      },
    ],
  },

  resolve: {
    extensions: ['', '.js', '.jsx'],
  },

  postcss: [
    autoprefixer,
  ],

  plugins: [
    new CopyWebpackPlugin([{ from: 'to-root' }]),
  ],
};
