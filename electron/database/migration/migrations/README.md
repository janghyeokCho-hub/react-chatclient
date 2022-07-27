# Runtime DB migration

## 목적
- db 스키마에 변경이 필요할 경우, 영향도가 작은 변경건은 버전 릴리즈시 '로컬데이터 초기화' 옵션 없이도 runtime에 migration을 수행하여 불필요한 로컬데이터 초기화를 최소화하기 위함

## 사용 방법

❗️ 참고: [Knex Migration API](http://knexjs.org/guide/migrations.html#migration-api)

1. `electron/database/migration/migrations` 디렉토리에 `번호-이름.js` 추가 (1개의 migration 작업은 하나의 파일로 구성)

2. 생성한 파일에서, knex connection 객체를 파라미터로 받아서 db스키마 변경을 수행하는 함수 작성 > default로 내보내기

```javascript
// Example: database/migration/migrations/2_something.js
export const migrateSomething = {
    /**
     * @param {Knex} knex 
     * @returns
     */
  async up(knex) {
    // botInfo column을 추가하기 전에 중복인지 미리 검사
    const isBotInfoExists = await knex.schema.hasColumn('message', 'botInfo');
    if (isBotInfoExists) {
      return;
    }
    // botInfo가 없는지 확인 후 alter table 실행
    const result = await knex.schema.table('message', table => {
      table.json('botInfo');
    });
    return result;
  },
  down() {
    return true;
  },
};

export default migrateSomething;
```

3. 작성한 migration을 `electron/database/migration/migrations/index.js` 파일의 migration 목록에 추가
```javascript
import migrateChatbot from './migrations/1_chatbot';
import migrateSomething from './migrations/2_something'; // new
export const migrationPlans = {
  '1-chatbot': migrateChatbot,
  '2-something': migrateSomething, // new
};
```

## ❗️주의사항❗️
- 한 번 운영에 배포했던 migration은 수정하면 안 됨
  - migration의 이름(`migrationPlans`의 1-chatbot 등)을 변경하거나 새로 추가한 migration과의 순서가 꼬이면, 해당 migration을 이미 완료한 버전의 db파일에서는 다음 실행시 오류 발생 위험 > 로컬데이터 초기화 필요