# 일본 워크샵 일정 웹앱

GitHub Pages + Supabase 기반의 모바일 우선 일정 기록 앱입니다.

- 일정 기간: 2026년 6월 17일 ~ 6월 20일
- 관리자 모드: 메모, 사진, 위치 체크인, 구매 체크리스트 저장, PIN 변경, 일정 수정
- 가족 모드: 보기 전용
- 인증 방식: 정식 계정 로그인 대신 관리자 PIN / 가족 PIN

## 1. Supabase SQL 실행

1. Supabase 프로젝트를 만듭니다.
2. `supabase/schema.sql`을 엽니다.
3. 아래 placeholder를 실제 PIN으로 바꿉니다.
   - `CHANGE_ADMIN_PIN`
   - `CHANGE_FAMILY_PIN`
4. Supabase Dashboard > SQL Editor > New query에 전체 SQL을 붙여넣습니다.
5. Run을 누릅니다.

PIN은 `pgcrypto`의 `crypt()` 해시로 저장됩니다. PIN 원문은 DB에 저장하지 않습니다.

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

관리자 모드:

1. 페이지 접속 후 관리자 PIN을 입력합니다.
2. 날짜 탭과 장소 카드를 누릅니다.
3. 장소 상세에서 구글맵, 관리자 메모, 사진 업로드, 현재 위치 체크인을 확인합니다.
4. 메모와 구매 체크리스트를 저장한 뒤 새로고침해도 유지되는지 확인합니다.
5. 휴대폰에서 저장한 뒤 노트북에서 같은 관리자 PIN으로 접속해 같은 데이터가 보이는지 확인합니다.
6. 접속 코드 관리에서 관리자 PIN 또는 가족 PIN을 변경할 수 있는지 확인합니다.
7. 일정 관리에서 선택한 일정을 수정하거나 새 일정을 추가한 뒤 지도와 가족 화면에 반영되는지 확인합니다.

가족 모드:

1. 로그아웃 후 가족 PIN으로 접속합니다.
2. 일정, 가족 공유 상태, 방문 완료 표시, 체크인 기록, 공유 사진이 보이는지 확인합니다.
3. 관리자 메모 입력창, 사진 업로드, 체크리스트 저장 UI가 보이지 않는지 확인합니다.
4. 관리자용 상세 메모가 노출되지 않는지 확인합니다.

## 5. 보안 구조

- 프론트엔드는 Supabase anon public key 또는 publishable key만 사용합니다.
- 모든 앱 테이블에 RLS를 켭니다.
- `anon` / `authenticated` 역할의 직접 테이블 권한을 제거합니다.
- 앱은 테이블을 직접 `select`, `insert`, `update`, `delete`하지 않고 RPC 함수만 호출합니다.
- 가족 모드의 `workshop_get_state` 응답은 서버에서 `notes`, `shopping`을 제외합니다.
- 가족 모드의 `workshop_get_state` 응답에는 커스텀 일정은 포함하지만 관리자 메모와 구매 체크리스트는 포함하지 않습니다.
- 세션 토큰은 브라우저에는 원문이 저장되지만, DB에는 SHA-256 해시만 저장합니다.
- 관리자 PIN 또는 가족 PIN을 변경하면 새 PIN은 다시 bcrypt 해시로 저장되고 해당 역할의 기존 세션은 만료됩니다.
- 사진은 브라우저에서 축소한 data URL을 RPC로 저장합니다. 대량 원본 사진 보관 용도는 아닙니다.

Supabase 보안 어드바이저가 공개 RPC의 `SECURITY DEFINER` 경고를 표시할 수 있습니다. 이 앱에서는 PIN 검증과 관리자/가족 데이터 필터링을 위해 의도적으로 제한된 RPC만 `anon`에 열어둔 구조입니다.

## 6. 남은 주의사항

- PIN 방식은 간단한 공유용 인증입니다. 너무 짧은 PIN은 쓰지 말고 6자리 이상, 가능하면 더 긴 PIN을 사용하세요.
- 사진은 DB에 압축본으로 저장합니다. 많은 원본 사진을 장기 보관하려면 Supabase Storage + Edge Function 구조로 확장하는 편이 좋습니다.
- `config.js`는 공개 저장소에 올라가므로 public key만 넣어야 합니다.
