const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const version = require('./package.json').version;

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = (env, options) => {
  const config = {
    entry: options.target
      ? options.target == 'web'
        ? './src/index.js'
        : './src/index.app.js'
      : './src/index.js',
    output: {
      filename: '[name].[hash].js',
      chunkFilename: '[name].[chunkhash].chunk.js',
      path: path.resolve(
        __dirname +
          '/build/' +
          (options.target
            ? options.target == 'web'
              ? 'web'
              : 'electron/renderer'
            : 'web'),
      ),
      publicPath: options.target
        ? options.target == 'web'
          ? '/client/'
          : './'
        : '/client/',
    },
    optimization: {
      splitChunks: {
        cacheGroups: {
          commons: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    },
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: '/node_modules',
          use: ['babel-loader'],
        },
        {
          test: /\.html$/,
          use: [
            {
              loader: 'html-loader',
              options: { minimize: false },
            },
          ],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebPackPlugin({
        template: './index.html',
        filename: 'index.html',
      }),
      new ManifestPlugin({
        fileName: 'assets.json',
      }),
      // new BundleAnalyzerPlugin(),
      new webpack.DefinePlugin({
        SCREEN_OPTION: JSON.stringify(
          options.target ? (options.target == 'web' ? 'G' : 'N') : 'G',
        ),
        DEF_TARGET: JSON.stringify(options.target || 'web'),
        DEF_MODE: JSON.stringify(options.mode),
        EXTENDED_COPY: true, // 채팅방 메시지복사시 작성자+시간 포함여부
        DEVICE_TYPE: JSON.stringify(
          options.target ? (options.target == 'web' ? 'b' : 'd') : 'b',
        ),
        APP_VERSION: JSON.stringify(version),
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/'),
        '@C': path.resolve(__dirname, 'src/components/'),
        '@COMMON': path.resolve(__dirname, 'src/components/common'),
        '@STYLE': path.resolve(__dirname, 'src/css'),
      },
    },
  };

  return config;
};
