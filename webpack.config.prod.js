const path = require('path');
const webpack = require('webpack');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const version = require('./package.json').version;

const BundleAnalyzerPlugin = require('webpack-bundle-analyzer')
  .BundleAnalyzerPlugin;

module.exports = (env, options) => {
  const isWebBuild = options?.target === 'web';
  const buildEntry = isWebBuild ? './src/index.js' : './src/index.app.js';
  const outDir = isWebBuild ? `prod/web/${version}` : 'build/electron/renderer';
  const publicPath = isWebBuild ? '/client/' : './';
  const config = {
    entry: buildEntry,
    output: {
      filename: '[name].[hash].js',
      chunkFilename: '[name].[chunkhash].chunk.js',
      path: path.resolve(__dirname, outDir),
      publicPath,
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
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
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
        SCREEN_OPTION: JSON.stringify(isWebBuild ? 'G' : 'N'),
        DEF_TARGET: JSON.stringify(options.target || 'web'),
        DEF_MODE: JSON.stringify(options.mode),
        DEVICE_TYPE: JSON.stringify(isWebBuild ? 'b' : 'd'),
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
