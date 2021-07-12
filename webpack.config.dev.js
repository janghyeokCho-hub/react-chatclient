const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;
const version = require('./package.json').version;

module.exports = (env, options) => {
  const config = {
    entry: options.target
      ? options.target == 'web'
        ? './src/index.js'
        : './src/index.app.js'
      : './src/index.js',
    devtool: 'inline-source-map',
    output: {
      filename: '[name].[hash].js',
      path: path.resolve(
        __dirname +
          '/dev-build/' +
          (options.target
            ? options.target == 'web'
              ? 'web'
              : 'electron/renderer'
            : 'web'),
      ),
      publicPath: options.target ? (options.target == 'web' ? '/' : './') : '/',
      pathinfo: false, // dev only
    },
    optimization: {
      // dev only
      splitChunks: false,
      removeAvailableModules: false,
      removeEmptyChunks: false,
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: '/node_modules',
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: ['react-hot-loader/babel'],
          },
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
        {
          test: /\.css$/i,
          use: ["style-loader", "css-loader"],
        }
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebPackPlugin({
        template: './index.dev.html',
        filename: 'index.html',
        showErrors: true, // 에러 발생시 메세지가 브라우저 화면에 노출 된다.
      }),
      new ManifestPlugin({
        fileName: 'assets.json',
        basePath: '/',
      }),
      new HardSourceWebpackPlugin(),
      // new BundleAnalyzerPlugin(),
      new webpack.DefinePlugin({
        SCREEN_OPTION: JSON.stringify(
          options.target ? (options.target == 'web' ? 'G' : 'N') : 'G',
        ),
        DEF_TARGET: JSON.stringify(options.target || 'web'),
        DEF_MODE: JSON.stringify(options.mode),
        DEVICE_TYPE: JSON.stringify(
          options.target ? (options.target == 'web' ? 'b' : 'd') : 'b',
        ),
        APP_VERSION: JSON.stringify(version),
      }),
    ],
    devServer: {
      contentBase: path.join(
        __dirname,
        './dev-build/' +
          (options.target
            ? options.target == 'web'
              ? 'web'
              : 'electron/renderer'
            : 'web') +
          '/',
      ),
      port: 3000,
      historyApiFallback: true,
      stats: {
        color: true,
      },
    },
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
