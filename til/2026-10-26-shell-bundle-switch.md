# 셸 번들 전환과 CSP 회고

셸에서 주문, 시재관리 번들을 메뉴와 단축키로 바꾸고, 빌드된 번들에 Content Security Policy를 넣은 작업.

## 한 줄 요약

Providers는 중복을 남겼고 Vite 설정은 공통화했다. 기준은 "같은 이유로 함께 바뀌는가"였다.

## 1. 무엇을 공통화할까

- 고민: 두 번들의 `vite.config.ts`가 포트만 빼고 똑같았음. 지난 작업에서 `Providers`는 중복을 남기기로 했는데 이건 어떻게 할지
- 판단: CSP 같은 보안 정책이나 빌드 방식은 번들마다 다를 이유가 없고, 바꿀 때는 모든 번들이 같이 바뀌어야 함. 한 번들만 빠뜨리면 보안 구멍이 됨
- 결정: `@toss-place/vite-config`의 `createBundleConfig({ port })`로 올림
- 배운 점: 중복 허용과 공통화는 반대가 아니라 같은 질문(함께 바뀌는가)의 두 답이다

## 2. 설정 패키지를 Vite가 못 읽음

- 이슈: 빌드하니 `Cannot find module '.../vite-config/src/contentSecurityPolicy'` 에러가 남. 같은 코드를 번들 안에 둘 때는 됐음
- 원인 찾기: 에러 메시지가 Node의 `ERR_MODULE_NOT_FOUND`라서 Vite가 아니라 Node가 파일을 읽고 있다고 봄. Vite는 설정 파일을 번들링할 때 node_modules로 연결된 패키지는 제외하고 Node에 맡김. Node 24는 TS 타입을 지워서 바로 실행하지만, ESM 규칙대로 확장자 없는 상대 경로는 찾지 않음
- 해결: `./contentSecurityPolicy.ts`처럼 확장자를 붙이고 공통 tsconfig에 `allowImportingTsExtensions`를 켬. 모든 패키지가 `noEmit`이라 부작용이 없음
- 배운 점: 같은 TS 파일이라도 누가 실행하느냐(번들러, Node)에 따라 규칙이 다르다. 에러 코드가 어느 레이어에서 나왔는지부터 본다

## 3. CSP는 빌드에만

- 이슈: CSP를 개발 서버에도 넣으면 Vite HMR과 React Refresh의 inline 스크립트가 막힘
- 해결: Vite 플러그인에 `apply: 'build'`를 줘서 빌드 결과 `index.html`에만 meta 태그를 넣음
- 정책: 스크립트는 `'self'`만 허용함. Emotion이 런타임에 style 태그를 넣어서 `style-src`에만 `'unsafe-inline'`을 둠
- 확인: 빌드한 셸을 띄워 두 번들이 CSP 아래에서 그려지는지, 메뉴로 바뀌는지, 위반 로그와 Electron 보안 경고가 사라졌는지 봄

## 4. 번들 목록과 포트

- 번들 이름, 제목, 개발 서버 포트를 셸의 `BUNDLES` 한곳에 둠. 포트가 겹치지 않는지 테스트로 확인함
- 번들 주소를 정하는 `resolveBundleUrl`을 분리해 둠. 나중에 번들을 원격에서 내려받아 업데이트하는 구조로 가면 이 함수만 바꾸면 됨
