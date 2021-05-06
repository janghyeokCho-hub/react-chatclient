const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const version = require('./package.json').version;
const appId = require('./package.json').appId;

module.exports = (env, options) => {
  const config = {
    entry: './electron/index.js',
    output: {
      filename: 'main.js',
      path: path.resolve(
        __dirname +
          `/${
            options.mode
              ? options.mode == 'production'
                ? 'build'
                : 'dev-build'
              : 'dev-build'
          }/electron`,
      ),
    },
    externals: [
      {
        knex: 'commonjs knex',
      },
      {
        'electron-windows-notifications':
          'commonjs electron-windows-notifications',
      },
      {
        '@journeyapps/sqlcipher': 'commonjs @journeyapps/sqlcipher',
      },
    ],
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: '/node_modules',
          loader: 'babel-loader',
        },
        {
          test: /\.node$/,
          use: 'node-loader',
        },
      ],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
    target: 'electron-main',
    plugins: [
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [],
        cleanAfterEveryBuildPatterns: ['vc_redist*.exe'],
      }),
      new webpack.DefinePlugin({
        DEF_MODE: JSON.stringify(options.mode),
        APP_VERSION: JSON.stringify(version),
        APP_ID: JSON.stringify(appId),
      }),
      new CopyPlugin(
        options.mode == 'production' &&
        (options.arch == 'x64' || options.arch == 'x86')
          ? [
              {
                from: 'electron/templates/*',
                to: 'templates/[name].[ext]',
                toType: 'template',
              },
              {
                from: 'resources/icons/*',
                to: 'icons/[name].[ext]',
                toType: 'template',
              },
              {
                //vc_redist.x86.exe, vc_redist.x64.exe
                from: `resources/vcredist/vc_redist.${options.arch}.exe`,
                to: `vcredist/vc_redist.${options.arch}.exe`,
                toType: 'file',
              },
            ]
          : [
              {
                from: 'electron/templates/*',
                to: 'templates/[name].[ext]',
                toType: 'template',
              },
              {
                from: 'resources/icons/*',
                to: 'icons/[name].[ext]',
                toType: 'template',
              },
            ],
      ),
      new webpack.NormalModuleReplacementPlugin(
        /\.\.migrate/,
        '../util/noop.js',
      ),
      new webpack.NormalModuleReplacementPlugin(/\.\.seed/, '../util/noop.js'),
      new webpack.IgnorePlugin(/mariasql/, /knex/),
      new webpack.IgnorePlugin(/mysql/, /knex/),
      new webpack.IgnorePlugin(/mssql/, /knex/),
      new webpack.IgnorePlugin(/oracle/, /knex/),
      new webpack.IgnorePlugin(/oracledb/, /knex/),
      new webpack.IgnorePlugin(/postgres/, /knex/),
      new webpack.IgnorePlugin(/redshift/, /knex/),
      new webpack.IgnorePlugin(/pg-query-stream/, /knex/),
      new webpack.IgnorePlugin(/mysql2/, /knex/),
      new webpack.IgnorePlugin(/strong-oracle/, /knex/),
      new webpack.IgnorePlugin(/pg-native/, /pg/),
    ],
  };

  return config;
};
