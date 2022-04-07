const path = require('path');
const { version, appId, name } = require('./package.json');

const red = str => `\x1b[31m${str}\x1b[0m`;
const cyan = str => `\x1b[36m${str}\x1b[0m`;
const validateOption = options => options.every(arg => process.argv.includes(arg));
const installPerUser = process.env['INSTALL_PERUSER'];

let arch = '';
let platform = '';
if (validateOption(['--macos']) === true) {
  arch = 'macos-x64';
  platform = 'macos';
} else if (validateOption(['--win', '--ia32']) === true) {
  arch = 'win-ia32';
  platform = 'win';
} else if (validateOption(['--win', '--x64']) === true) {
  arch = 'win-x64';
  platform = 'win';
} else {
  console.log(red(`Unsupported platform. Please specify target platform.`));
  process.exit(0);
}
const outDir = path.resolve(__dirname, `prod/${arch}/${version}`);
console.log(cyan(`Build Application   > ${name} (${appId})`));
console.log(cyan(`Target Architecture > ${arch}`));
console.log(cyan(`Output Path    > ${outDir}`));

const excludeDeps = [
  '!node_modules/@material-ui',
  '!node_modules/@emotion',
  '!node_modules/@jjordy',
  '!node_modules/@icons',
  '!node_modules/@toast-ui',
  '!node_modules/css-line-break',
  '!node_modules/material-table',
  '!node_modules/popper.js',
  '!node_modules/preact',
  '!node_modules/react',
  '!node_modules/react-beautiful-dnd',
  '!node_modules/react-color',
  '!node_modules/react-draggable',
  '!node_modules/react-redux',
  '!node_modules/react-rnd',
  '!node_modules/react-transition-group',
  '!node_modules/redux',
  '!node_modules/spectre.css/**/*',
  '!node_modules/styled-components',
  '!node_modules/swr',
  '!node_modules/jszip/**/*',
  '!node_modules/jspdf',
  '!node_modules/canvg',
  '!node_modules/dompurify',
];

module.exports = {
  productName: 'eumtalk',
  appId,
  asar: true,
  files: ['build/electron/templates/**', 'build/electron/main.js', ...excludeDeps],
  extraFiles: [
    {
      from: 'build/electron/renderer',
      to: 'resources/renderer',
    },
    {
      from: `./resources/${arch}`,
      to: 'resources',
    },
    {
      from: `./resources/${platform}`,
      to: 'resources',
    },
    {
      from: './resources/common',
      to: 'resources',
    },
  ],
  mac: {
    target: ['default'],
    icon: 'resources/common/icons/main_dmg.png',
  },
  dmg: {
    title: 'eumtalk',
    icon: 'resources/common/icons/main_dmg.png',
  },
  win: {
    target: ['nsis'],
    icon: 'resources/common/icons/main.ico',
    certificateFile: 'make/cert/www.covision.co.kr.pfx',
    certificatePassword: 'covicovi',
  },
  nsis: {
    oneClick: false,
    perMachine: !installPerUser,
    allowToChangeInstallationDirectory: false,
    language: 1042,
    shortcutName: 'eumtalk',
    createStartMenuShortcut: true,
    include: 'make/installer.nsh',
    license: 'make/license.html',
    deleteAppDataOnUninstall: true,
  },
  directories: {
    output: `prod/${arch}/${version}`
  },
  publish: {
    provider: "generic",
    url: ""
  }
};
