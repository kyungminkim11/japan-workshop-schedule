# 일본 워크샵 보안 일정 웹앱

GitHub Pages + Supabase 기반의 모바일 우선 일정 기록 앱입니다.

회사 일정이 포함되어 있으므로 **로그인 전에는 기본 일정도 공개하지 않는 구조**로 사용합니다.

## 모드

| 모드 | 대상 | 볼 수 있는 것 | 수정 가능 |
|---|---|---|---|
| 관리자 | 경민님 | 전체 일정, 메모, 사진, 위치, 지출, 접속 기록, 코드 관리 | 가능 |
| 여자친구 | 여자친구 | 일정, 공유 상태, 체크인, 공유 사진, 여자친구 부탁 리스트 | 불가 |
| 가족 | 부모님/이모 | 일정, 공유 상태, 체크인, 가족 공유 사진 | 불가 |

## 주요 기능

- 역할별 접속 코드: 관리자 / 여자친구 / 가족
- 접속 코드는 대소문자와 공백을 구분하지 않음
- 관리자 페이지에서 현재 접속 코드 확인 가능
- 최근 접속 역할, 시간, 기기 정보 확인 가능
- 사진 업로드, 관리자 메모, 위치 체크인을 메인 타임라인에서 확인
- 지출 기록: 현금/카드/회사 지원/기타/직접입력 태그, 메모, 영수증 사진 업로드
- 모바일에서 현장 기록, 노트북에서 자료 다운로드 가능
- 선택 날짜 TXT 다운로드, 전체 JSON 백업 다운로드 가능
- 일정 JSON 가져오기 가능

## 1. Supabase SQL 실행

1. Supabase 프로젝트를 만듭니다.
2. `supabase/schema.sql`을 엽니다.
3. 아래 placeholder를 실제 접속 코드로 바꿉니다.

```text
CHANGE_ADMIN_CODE
CHANGE_GIRLFRIEND_CODE
CHANGE_FAMILY_CODE
```

4. Supabase Dashboard > SQL Editor > New query에 전체 SQL을 붙여넣습니다.
5. Run을 누릅니다.

접속 코드는 `pgcrypto`의 `crypt()` 해시로 저장됩니다. 다만 관리자 화면에서 코드 확인이 가능해야 하므로 `display_code`에는 관리자에게 보여줄 표시용 코드가 저장됩니다.

**중요:** 실제 접속 코드는 GitHub에 커밋하지 마세요. `schema.sql` 파일에는 placeholder만 유지합니다.

## 2. config.js 설정

`config.js`에는 공개 프론트엔드에서 써도 되는 값만 넣습니다.

```js
window.WORKSHOP_SUPABASE = {
  url: "https://YOUR-PROJECT-REF.supabase.co",
  key: "YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
};
```

Supabase Dashboard의 Project URL과 anon public key 또는 publishable key만 사용하세요.

절대 넣으면 안 되는 값:

- service_role key
- secret key
- database password
- JWT secret

## 3. GitHub Pages 배포

1. GitHub 저장소로 푸시합니다.
2. Repository > Settings > Pages로 이동합니다.
3. Build and deployment를 `Deploy from a branch`로 설정합니다.
4. Branch는 `main`, folder는 `/ (root)`를 선택합니다.
5. 저장 후 몇 분 뒤 아래 주소로 접속합니다.

```text
https://kyungminkim11.github.io/japan-workshop-schedule/
```

## 4. 테스트 방법

### 관리자 모드

1. 페이지 접속 후 관리자 접속 코드를 입력합니다.
2. 일정 관리에서 일정을 추가하거나 JSON으로 가져옵니다.
3. 날짜 탭과 장소 카드를 누릅니다.
4. 장소 상세에서 구글맵, 관리자 메모, 사진 업로드, 현재 위치 체크인을 확인합니다.
5. 메모, 사진, 체크인을 저장한 뒤 메인 타임라인에 표시되는지 확인합니다.
6. 휴대폰에서 저장한 뒤 노트북에서 같은 관리자 코드로 접속해 같은 데이터가 보이는지 확인합니다.
7. 접속 코드 관리에서 현재 코드와 최근 접속 시간을 확인합니다.
8. 선택 날짜 TXT 다운로드, 전체 JSON 다운로드가 되는지 확인합니다.
9. 지출 기록에서 금액, 태그, 관련 일정, 메모, 영수증 사진을 저장한 뒤 새로고침해도 유지되는지 확인합니다.

### 여자친구 모드

1. 로그아웃 후 여자친구 접속 코드로 접속합니다.
2. 일정, 공유 상태, 체크인, 공유 사진, 여자친구 부탁 리스트가 보이는지 확인합니다.
3. 관리자 메모, 회사 업무 메모, 구매 체크리스트, 지출 기록, 일정 수정 UI가 보이지 않는지 확인합니다.

### 가족 모드

1. 로그아웃 후 가족 접속 코드로 접속합니다.
2. 일정, 공유 상태, 체크인, 가족 공유 사진이 보이는지 확인합니다.
3. 여자친구 부탁 리스트, 관리자용 상세 메모, 지출 기록이 보이지 않는지 확인합니다.

## 5. 보안 구조

- 프론트엔드는 Supabase anon public key 또는 publishable key만 사용합니다.
- 모든 앱 테이블에 RLS를 켭니다.
- `anon` / `authenticated` 역할의 직접 테이블 권한을 제거합니다.
- 앱은 테이블을 직접 `select`, `insert`, `update`, `delete`하지 않고 RPC 함수만 호출합니다.
- 로그인 전에는 기본 일정이 `app.js`에 들어있지 않으므로 코드 보기로 일정이 노출되지 않습니다.
- 관리자 모드만 `notes`, `shoppingItems`, `expenses`, 접속 코드, 접속 기록을 볼 수 있습니다.
- 여자친구 모드에는 `girlfriendRequests`만 추가로 노출됩니다.
- 가족 모드에는 여자친구 부탁 리스트와 관리자 메모가 노출되지 않습니다.
- 영수증/지출 사진은 가족·여자친구 공유를 끈 상태로 저장해 비관리자 사진 응답에서도 제외합니다.
- 세션 토큰은 브라우저에는 원문이 저장되지만, DB에는 SHA-256 해시만 저장합니다.
- 접속 코드를 변경하면 해당 역할의 기존 세션은 만료됩니다.
- 사진은 브라우저에서 축소한 data URL을 RPC로 저장합니다. 대량 원본 사진 보관 용도는 아닙니다.

## 6. 주의사항

- GitHub 저장소가 public이면 과거 커밋 기록에 민감한 일정이 남아있을 수 있습니다. 가능하면 저장소를 Private으로 전환하세요.
- 접속 코드는 너무 짧게 만들지 마세요.
- 접속 코드는 대소문자와 공백을 무시하므로 `My Code`, `mycode`, `MY CODE`는 같은 코드로 처리됩니다.
- 사진이 많아지면 Supabase DB 용량이 빨리 늘 수 있습니다. 장기적으로는 Supabase Storage + Edge Function 구조로 확장하는 편이 좋습니다.
