# 기술 스택 정리

토스플레이스 채용 공고(제품, Platform, 디자인 시스템 포지션)를 기준으로 고름. 근거 자료는 [research/02-tech-stack.md](../research/02-tech-stack.md).

## 언어, UI

### TypeScript 6.0 (strict)

- 이점: 빌드 단계에서 실수를 잡음. 함수와 컴포넌트의 입출력을 타입으로 표현할 수 있음
- 선택 이유: 토스 챕터 전체가 모든 코드를 TS로 씀. 최신은 7.x인데 typescript-eslint가 아직 6.0까지만 지원해서 6.0으로 맞춤
- `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`까지 켜서 배열 접근, 옵셔널 값 실수도 막음

### React 19

- 이점: 선언적 UI, Suspense 기반 비동기 처리
- 선택 이유: 모든 공고의 공통 코어

## 빌드

### Vite + SWC (웹뷰 번들)

- 이점: 개발 서버가 빠름. SWC로 트랜스파일이 빠름
- 선택 이유: 웹뷰 번들은 SSR이 필요 없는 SPA라 Next.js보다 가벼운 Vite가 맞음. Vite, SWC 모두 공고에 있음

### tsdown (Electron 셸)

- 이점: 설정이 적고 빠른 TS 번들러. 라이브러리, Node 코드 빌드에 적합
- 선택 이유: 디자인 시스템 공고에 나옴. 셸 코드는 Electron 런타임에서 바로 돌아야 해서 워크스페이스 패키지까지 한 파일로 묶을 필요가 있었음

## 앱 구조

### Electron

- 이점: 웹 코드 하나로 Windows, macOS 데스크톱 앱을 만들고 프린터, 단말기 같은 기기와 통신할 수 있음
- 선택 이유: 토스 POS가 Electron 기반이고 공고 우대 사항임
- 보안상 `contextIsolation`, `sandbox`를 켜고 preload에서 필요한 함수만 노출함

### 웹뷰 번들 + pos-bridge

- 이점: 도메인별로 따로 배포할 수 있음. 번들은 실행 환경(Electron, Android, 브라우저)을 몰라도 됨
- 선택 이유: 토스플레이스가 SLASH 24에서 공개한 구조를 작게 재현함

### electron-builder

- 이점: 설정 파일 하나로 macOS dmg, Windows nsis 설치 파일을 만듦. 서명, 공증, 자동 업데이트까지 같은 도구로 확장할 수 있음
- 선택 이유: Electron Forge보다 설정이 선언적이고 CI에서 OS별로 돌리기 쉬움. 셸에 런타임 의존성이 없어서 node_modules 수집 같은 복잡한 부분을 쓰지 않음
- 패키징한 앱을 `--smoke-test`로 띄워 번들이 실제로 그려지는지 CI에서 확인함

## 상태, 비동기

### TanStack Query (Suspense 모드)

- 이점: 서버 데이터 캐싱, 재요청, 로딩과 에러 상태를 선언적으로 관리함
- 선택 이유: 모든 공고의 공통 상태 관리 도구

### @suspensive/react

- 이점: ErrorBoundary, Suspense를 쓰기 편하게 감싸줌
- 선택 이유: 토스 오픈소스. 컴포넌트 안에서 `isLoading` 분기를 없애고 화면 영역 단위로 로딩, 에러를 처리함

### overlay-kit

- 이점: `overlay.open()` 한 줄로 모달을 띄움. 열림 상태를 props로 들고 다니지 않아도 됨
- 선택 이유: 토스 오픈소스

## 스타일

### Emotion

- 이점: css prop으로 컴포넌트 옆에 스타일을 둠. 동적 스타일이 쉬움
- 선택 이유: 토스 챕터 기본 스타일 도구이고 제품 공고에 나옴

### Vanilla Extract

- 이점: 빌드 타임에 CSS를 만들어서 런타임 비용이 없음. 토큰을 타입 안전한 CSS 변수로 만들 수 있음
- 선택 이유: 디자인 시스템 공고에 나옴. 토큰은 Vanilla Extract로 만들고 Emotion에서는 `var(--...)` 문자열로 그대로 씀

## 유틸

### es-toolkit

- 이점: lodash보다 빠르고 작음. 타입 지원이 좋음
- 선택 이유: 토스 오픈소스

## 패키지 관리

### Yarn 4 (Berry) + Corepack, workspaces

- 이점: 모노레포에서 패키지를 나눠 관리함. Corepack으로 모든 컴퓨터에서 같은 Yarn 버전을 씀
- 선택 이유: 토스 챕터가 Yarn Berry를 씀. 공고에도 나옴

### nodeLinker: pnpm

- 이점: node_modules 구조라 도구 호환성이 좋음. 선언하지 않은 의존성은 import할 수 없어서 엄격함은 PnP와 비슷함
- 선택 이유: 처음엔 PnP로 했는데 Vite가 PnP 지원을 더 이상 챙기지 않는다고 경고함. 공고에 pnpm도 있어서 이 방식으로 바꿈

## 품질 관리

### Vitest + Testing Library

- 이점: Vite 설정을 그대로 씀. API가 Jest와 같음
- 선택 이유: 이전 POS 공고에 Vitest가 나옴. 최근 공고의 Jest로 옮겨도 코드 변경이 거의 없음

### ESLint 9 + typescript-eslint + jsx-a11y + react-hooks

- 이점: `any`, 타입 단언, 중첩 삼항, 접근성 문제를 작성 단계에서 막음
- 선택 이유: Frontend Fundamentals 기준을 규칙으로 강제하려고 씀. jsx-a11y가 아직 ESLint 10을 지원하지 않아서 9로 맞춤

### Prettier, husky, lint-staged, commitlint

- 이점: 커밋할 때 포맷, 린트, 커밋 메시지 형식을 자동으로 검사함
- 선택 이유: 토스가 Conventional Commits를 쓴다고 공개함. 리뷰에서 스타일 얘기를 없애려고 씀

### GitHub Actions

- 이점: PR마다 포맷, 린트, 타입, 테스트, 빌드, PR 제목 형식을 검사함
- 선택 이유: 모든 공고의 공통 CI
