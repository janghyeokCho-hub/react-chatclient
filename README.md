# chatclient
## chatclient (PC)
PC앱의 경우 react + electron을 기반으로 제작됨.
### Requirements
Common
+ node 12.x
+ npm 6.x (node에서 설치되는 버전으로 사용)

Windows
+ Windows SDK (up to 10.x version)

#### PC Environment
||Build|Runtime|
|--|--|--|
|CPU | 4core  | 2core |
|RAM | 8GB  | 4GB |
#### Operating System
||Minimum|Recommended|
|--|--|--|
|Windows | up to Windows 8.1 | Windows 10 |
|MacOS | up to MacOS X | MacOS 11.x |
#### Internet Browser
https://kangax.github.io/compat-table/es2016plus/

### Installation (Common)
```bash
 git clone http://10.10.10.90/chatclient/chatclient
 git fetch
 cd ./chatclient
 npm install
```

### Installation (Windows)
```bash
 git clone http://10.10.10.90/chatclient/chatclient
 git fetch
```

### Test & Product Build Commands
```javascript
 npm run start                  // 웹 브라우저 테스트 빌드
 npm run electron-dev-all       // electron 테스트 빌드
 npm run build                  // 웹 브라우저 product 빌드
 npm run make:x64               // windows x64  (64비트) product 빌드 
 npm run make:ia32              // windows ia32 (32비트) product 빌드
 npm run make:macos             // MacOS product 빌드
```



## chatmobile (Mobile)
### Installation
