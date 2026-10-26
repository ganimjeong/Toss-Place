# 모노레포 초기 세팅 회고

Yarn 4 워크스페이스로 Electron 셸, 웹뷰 번들, 공통 패키지를 나누는 기본 구조를 만든 날.

## 한 줄 요약

최신 버전을 그대로 쓰기보다 생태계가 어디까지 따라왔는지 먼저 확인해야 한다. 오늘 막힌 것 대부분이 버전 호환과 런타임 제약이었다.

## 1. 최신 버전끼리 맞지 않음

- 이슈: TypeScript 7, ESLint 10을 넣으려 했는데 린트 도구가 받아주지 않음
- 원인 찾기: `npm view <패키지> peerDependencies`로 typescript-eslint, jsx-a11y의 지원 범위를 확인함. typescript-eslint는 TS 6.1 미만, jsx-a11y는 ESLint 9까지
- 해결: TypeScript 6.0, ESLint 9로 맞춤
- 배운 점: 설치 전에 핵심 도구의 peer 범위부터 본다. 버전 선택 이유는 `tech-stack.md`에 남김

## 2. Vite가 Yarn PnP를 더 이상 챙기지 않음

- 이슈: 빌드는 되는데 "PnP-specific bugs will no longer be actively worked on" 경고가 뜸
- 원인 찾기: 지금 당장 깨지지 않아도 문제가 생기면 고쳐줄 사람이 없다는 뜻이라 리스크로 판단함
- 해결: `nodeLinker: pnpm`으로 바꿈. 선언하지 않은 의존성을 import하지 못하는 엄격함은 유지됨
- 배운 점: 경고도 장기 리스크면 초기에 처리한다. 구조를 바꾸는 비용은 코드가 적을 때 가장 쌈

## 3. Electron preload가 다른 파일을 require함

- 이슈: 실행하면 preload가 불러와지지 않을 상황이었음. 빌드 결과에 `channels-xxxx.cjs` 공용 청크가 생기고 preload가 그걸 require함
- 원인 찾기: `sandbox: true`인 preload는 Electron 내장 모듈 말고는 require할 수 없다는 제약을 확인함. main과 preload를 한 번에 빌드해서 번들러가 공통 코드를 청크로 뽑은 것
- 해결: tsdown 설정을 배열로 나눠 엔트리마다 따로 빌드함
- 재발 방지: 빌드한 셸을 실제로 띄워 `window.posBridge`가 있는지, 메뉴가 그려지는지 확인하는 스모크 테스트를 돌림
- 배운 점: 빌드 성공과 실행 성공은 다르다. 런타임 제약이 있는 코드는 꼭 실제로 실행해본다

## 4. 검사가 통과했는데 아무것도 검사하지 않음

- 이슈: `yarn typecheck`가 1초 만에 "Done"으로 끝남
- 원인 찾기: 너무 빨라서 의심함. 루트 워크스페이스가 `-A`에 포함돼 루트 스크립트가 자기 자신을 다시 부르는 구조였음
- 해결: `--exclude toss-place`로 루트를 뺌. 일부러 `any`를 넣은 파일로 린트가 실제로 에러를 내는지도 확인함
- 배운 점: 통과는 검사가 돌았다는 증거가 아니다. 새 검사를 붙이면 일부러 실패하는 케이스로 한 번 확인한다

## 5. Electron 바이너리가 설치되지 않음

- 이슈: 설치 후 `node_modules/electron/dist`가 없음
- 원인 찾기: Electron 패키지에 postinstall 스크립트가 없는 걸 확인하고 `index.js`를 읽음. 최신 버전은 처음 실행할 때 바이너리를 받음
- 해결: 첫 실행 때 받게 두고, CI에서는 `ELECTRON_SKIP_BINARY_DOWNLOAD=1`로 받지 않음
- 배운 점: 문서보다 패키지 소스가 더 정확할 때가 있다

## 6. CI에서 lockfile 불일치

- 이슈: 로컬은 되는데 CI의 `yarn install --immutable`이 실패함
- 원인 찾기: CI 로그의 diff에 `dependenciesMeta`의 electron 항목이 남아 있었음. `package.json`만 고치고 install을 다시 안 돌림
- 해결: `yarn install`로 lockfile을 갱신해서 `fix:` 커밋으로 올림
- 재발 방지: `package.json`을 고치면 커밋 전에 `yarn install --immutable`을 돌림
- 배운 점: CI는 깨끗한 환경에서 다시 확인해주는 장치다. 로컬 통과만 믿지 않는다

## 7. tsdown 설정의 as const 타입 에러

- 이슈: 공통 설정에 `as const`를 붙였더니 readonly 배열을 넣을 수 없다는 에러가 남
- 해결: `satisfies UserConfig`로 바꿈. 타입 검사는 받으면서 배열이 readonly가 되지 않음
- 배운 점: 설정 객체에는 `as const`보다 `satisfies`가 맞는 경우가 많다
