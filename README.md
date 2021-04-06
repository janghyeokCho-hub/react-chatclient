# chatclient
## chatclient (PC)
PC앱의 경우 react + electron을 기반으로 제작됨.
+ 작업 Process

  1. 이슈 등록하기
  2. 브랜치 만들기 (hotfix, feature, test)
  3. 작업 후 commit, push
  4. 작업 완료 후 테스트 진행
  5. 테스트 완료 후 PR 요청 
  6. PR 완료 후 develop에 등록
  7. develop 적용 후 main 브랜치로 PR 요청
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
