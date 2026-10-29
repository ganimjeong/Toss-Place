# 기여 가이드

## 브랜치

- `main`이 배포 버전임. 따로 develop, release 브랜치를 두지 않음.
- 작업은 `main`에서 짧게 브랜치를 따서 하고, PR로 합침.
- 브랜치 이름은 `<type>/<짧은-설명>` 형식. 예: `feat/order-split-bill`, `fix/receipt-reprint`

## 커밋 메시지

Conventional Commits를 따름. 커밋 훅(commitlint)이 형식을 검사함.

```
<type>(<scope>): <요약>

<본문: 왜 바꿨는지>
```

- type: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `ci`, `build`
- scope: 바꾼 번들이나 패키지 이름. 예: `order`, `pos-bridge`, `design-system`, `shell`
- 요약은 한국어로 짧게, 마침표 없이 씀
- 본문에는 무엇을 했는지보다 왜 했는지를 씀

예시

```
feat(order): 테이블 합석 주문 추가
fix(pos-bridge): 단말기 응답 지연 시 TIMEOUT 반환
refactor(utils): 금액 나누기 로직을 splitWon으로 분리
```

## PR

- PR 하나에 하나의 목적만 담음. 변경량은 300~400줄 안쪽을 권장함.
- PR 제목도 커밋 메시지와 같은 형식으로 씀. squash merge하면 PR 제목이 그대로 `main` 커밋이 됨.
- 모든 PR은 리뷰를 받고 합침. CI(포맷, 린트, 타입, 테스트, 빌드)가 통과해야 함.
- 리뷰 코멘트에는 의도를 붙임. 예: `[필수]` 머지 전에 고쳐야 함, `[제안]` 고려해볼 만함, `[질문]` 이해를 위한 질문

## 코드 작성 원칙

[Frontend Fundamentals](https://frontend-fundamentals.com/code-quality/code/)의 네 가지 기준을 리뷰 기준으로 씀.

가독성

- 같이 실행되지 않는 코드는 분리함 (권한별, 상태별 분기를 한 컴포넌트에 섞지 않음)
- 복잡한 조건과 매직 넘버에는 이름을 붙임
- 중첩 삼항 연산자는 쓰지 않음 (린트로 막음)

예측 가능성

- 같은 종류의 함수는 반환 형태를 맞춤. 예: 기기 호출은 모두 `{ ok, value }` 또는 `{ ok, reason }`
- 이름과 다른 일을 하는 함수를 만들지 않음. 부수 효과가 있으면 이름에 드러냄

응집도

- 함께 바뀌는 파일은 같은 디렉토리에 둠. 번들 안에서는 도메인 폴더(`src/order/...`) 단위로 묶음
- 전역 `components`, `hooks` 폴더에는 여러 도메인에서 실제로 쓰는 것만 둠

결합도

- 섣불리 공통화하지 않음. 두 곳의 변경 이유가 다르면 중복을 허용함
- props drilling은 먼저 컴포넌트 조합으로 풀고, 그래도 안 되면 Context를 씀

## 그라운드 룰

1. `any`, 타입 단언(`as`), non-null 단언(`!`)은 쓰지 않음. 꼭 필요하면 `eslint-disable` 주석에 이유를 남김.
2. 색상, 글자 크기, 간격 값을 직접 쓰지 않고 `@toss-place/design-system`의 `vars`를 씀.
3. 비동기 데이터는 `useSuspenseQuery`로 가져오고, 화면 영역 단위로 `ErrorBoundary`와 `Suspense`를 둠. 컴포넌트 안에서 `isLoading` 분기를 하지 않음.
4. 로딩 화면은 실제 레이아웃과 같은 크기의 스켈레톤으로 만들어 화면이 밀리지 않게 함.
5. 모달, 다이얼로그는 `overlay-kit`의 `overlay.open`으로 띄움. 열림 상태를 여기저기 들고 다니지 않음.
6. 금액은 원 단위 정수로만 다루고, 계산은 `@toss-place/utils`의 금액 함수를 씀. 금액 표시에는 `tabular-nums`를 적용함.
7. 카드 결제는 `@ganimjeong/payment-sdk`의 `pay`로만 요청함. 멱등 키, 결과를 모르는 결제의 조회, 저널은 SDK가 맡음. 번들에서 `requestCardPayment`를 직접 부르면 린트가 막음.
8. 기기 기능은 `getPosBridge()`로만 호출하고 실패 사유별 안내 문구를 둠. 번들에서 Electron API를 직접 쓰지 않음.
9. 버튼처럼 누르는 요소는 `vars.size.touchTarget` 이상 크기로 만듦.
10. 접근성 린트(jsx-a11y) 경고를 무시하지 않음. 아이콘 버튼에는 `aria-label`을 붙임.
11. 코드 주석은 음슴체로 씀. 무엇을 하는지보다 왜 그렇게 했는지를 적음.
12. 에러 리포팅은 `@toss-place/monitoring`으로만 함. 번들에서 `@sentry/*`를 직접 import하면 린트가 막음. 이벤트에는 주문 ID, 금액처럼 문제를 맞춰보는 데 필요한 값만 담고 손님 정보는 담지 않음.

## 새 번들 추가하기

1. `bundles/cash`를 참고해 `bundles/<name>`을 만듦
2. `package.json`의 `name`을 `@toss-place/<name>`으로 정함
3. `vite.config.ts`에서 `createBundleConfig({ port })`로 겹치지 않는 포트를 정함
4. `apps/shell/src/bundles.ts`의 `BUNDLES`에 같은 포트로 등록하고, 셸 `package.json`의 `devDependencies`에 `@toss-place/<name>`을 추가함. 빠뜨리면 빌드 순서가 보장되지 않고 셸 테스트가 실패함
5. `packages/eslint-config/index.mjs`의 번들 간 참조 금지 목록에 이름을 추가함

## 배포

| 대상                                 | 방법                          | 필요한 설정                                   |
| ------------------------------------ | ----------------------------- | --------------------------------------------- |
| 결제 SDK (`@ganimjeong/payment-sdk`) | `payment-sdk@x.y.z` 태그 push | npmjs.com의 Trusted Publisher 등록. 토큰 없음 |
| POS 앱 (macOS dmg, Windows exe)      | `pos@x.y.z` 태그 push         | 없음. Sentry를 켜려면 아래 시크릿과 변수      |

태그의 버전은 해당 `package.json`의 `version`과 같아야 함. 다르면 워크플로가 패키징 전에 멈춤.

### 처음 한 번 하는 설정

npm

저장소에 npm 토큰을 두지 않고 Trusted Publishing(OIDC)으로 배포함. 2FA를 우회하는 토큰은 2027년 1월부터 직접 배포를 못 하게 바뀌어서 처음부터 이 방식으로 둠.

1. 첫 버전은 npm에 패키지가 있어야 신뢰 설정을 할 수 있으므로, 로그인한 사람이 로컬에서 한 번 직접 올림
   ```sh
   npm login
   yarn workspace @ganimjeong/payment-sdk pack --out package.tgz
   npm publish packages/payment-sdk/package.tgz --access public
   ```
2. npmjs.com의 패키지 Settings → Trusted Publisher → GitHub Actions에 아래 값을 넣음
   - Organization or user: `ganimjeong`
   - Repository: `Toss-Place`
   - Workflow filename: `release-payment-sdk.yml`
3. 같은 화면에서 Publishing access를 "Require two-factor authentication and disallow tokens"로 바꿔 토큰 배포를 막음
4. 이후 버전은 `payment-sdk@x.y.z` 태그만 올리면 됨

Sentry

1. sentry.io에서 조직을 만들고 플랫폼이 React인 프로젝트를 만듦
2. Settings → Projects → 프로젝트 → Client Keys에서 DSN을 복사해 `gh secret set SENTRY_DSN`
3. Settings → Auth Tokens에서 조직 토큰을 만들어 `gh secret set SENTRY_AUTH_TOKEN`. 소스맵 업로드에만 씀
4. `gh variable set SENTRY_ORG --body <조직 slug>`, `gh variable set SENTRY_PROJECT --body <프로젝트 slug>`

DSN은 앱에 그대로 들어가는 공개 값이지만, 저장소 코드에 박지 않고 시크릿으로 둬서 포크한 저장소의 빌드가 같은 프로젝트로 이벤트를 보내지 않게 함.
