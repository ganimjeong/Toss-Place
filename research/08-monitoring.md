# 모니터링: Sentry를 웹뷰 번들과 Electron 셸에 붙이는 방법

Sentry 연결 전에 SDK 버전별 차이, Electron 크래시 수집 방식, React 19의 에러 훅을 확인함. 조사 시점 Sentry JS SDK는 11.9.0.

## Sentry JS SDK 11의 수집 범위 설정 [공개]

- 설치한 `@sentry/core` 11.9.0의 타입 정의(`types/options.d.ts`, `types/datacollection.d.ts`)를 직접 읽음
- 이전 버전의 `sendDefaultPii`는 없고, `dataCollection` 하나로 범주별 수집을 정함
- 기본값이 대부분 수집임. `userInfo: true`, `cookies: true`, `httpHeaders: { request: true, response: true }`, `httpBodies`는 모든 방향, `urlQueryParams: true`
- 키나 토큰처럼 민감한 값은 항상 걸러낸다고 되어 있지만, 매장 기기에서 도는 앱이라 이 레포는 모두 끄고 필요한 값만 이벤트에 직접 담음

## Electron 크래시 수집 [공개]

- Sentry는 minidump 업로드 주소를 따로 둠. `https://<host>/api/<projectId>/minidump/?sentry_key=<key>`로 `POST`, 파일 필드 이름은 `upload_file_minidump`
- 압축한 요청은 40MB, 이벤트 페이로드는 1MB까지
- Electron 내장 `crashReporter.start({ submitURL })`가 같은 필드 이름(`upload_file_minidump`)으로 multipart 업로드를 함. 로컬에서 가짜 수집 서버로 받아 확인함

## @sentry/electron을 쓰지 않은 이유 [이 레포의 판단]

`@sentry/electron`은 메인과 렌더러를 IPC로 이어 이벤트를 합쳐줌. 대신 렌더러 쪽에서 `@sentry/electron/renderer`를 써야 함.

- 이 레포의 번들은 실행 환경(Electron, 브라우저)을 모른다는 원칙이 있음. 번들이 Electron 전용 SDK를 import하면 원칙이 깨짐
- 셸은 런타임 의존성이 없어서 electron-builder가 node_modules를 모을 일이 없음. SDK를 넣으면 이 구조가 바뀜
- 그래서 번들은 브라우저용 `@sentry/react`, 셸은 의존성 없는 `crashReporter`로 나눔. 대가는 메인 프로세스 JS 예외와 렌더러 이벤트를 한 이벤트로 이어 보지 못하는 것

## React 19 루트 에러 훅 [공개]

- `createRoot(container, { onCaughtError, onUncaughtError, onRecoverableError })`
- ErrorBoundary가 잡은 에러는 `window.onerror`까지 올라가지 않음. `onCaughtError`로 루트에서 한 번에 받을 수 있음
- Sentry는 `reactErrorHandler()`를 제공함. React의 `componentStack` 타입(`string | undefined`)과 Sentry가 받는 타입(`string | null`)이 달라 `exactOptionalPropertyTypes`에서는 감싸서 넘겨야 함

## 출처

- Sentry Minidumps https://docs.sentry.io/platforms/native/guides/minidumps/
- React createRoot https://react.dev/reference/react-dom/client/createRoot
- Electron crashReporter https://www.electronjs.org/docs/latest/api/crash-reporter
