# 트러블슈팅

## Vite가 Yarn PnP 경고를 띄움

- 증상: 빌드할 때 "Using Yarn PnP with Vite is discouraged and PnP-specific bugs will no longer be actively worked on" 경고가 뜸
- 원인: Vite가 PnP 전용 버그는 더 이상 고치지 않겠다고 정함
- 해결: `.yarnrc.yml`의 `nodeLinker`를 `pnp`에서 `pnpm`으로 바꿈
- 배운 점: Yarn Berry를 쓴다고 PnP를 꼭 써야 하는 건 아님. pnpm 링커로도 선언 안 된 의존성 차단은 유지됨

## Electron preload에서 공용 청크를 require함

- 증상: tsdown으로 main, preload를 같이 빌드하니 `channels-xxxx.cjs` 같은 공용 청크가 생기고 preload가 그 파일을 require함
- 원인: `sandbox: true`인 preload는 Electron 내장 모듈 말고 다른 파일을 require할 수 없음
- 해결: tsdown 설정을 배열로 바꿔 main과 preload를 따로 빌드함. 엔트리마다 파일 하나로 나옴
- 배운 점: sandbox preload는 단일 파일로 빌드해야 함

## Electron 바이너리가 설치되지 않음

- 증상: `yarn install` 후 `node_modules/electron/dist`가 없음
- 원인: 최신 Electron 패키지는 postinstall로 받지 않고 처음 실행할 때 내려받음
- 해결: `yarn electron --version`을 한 번 실행하면 받아짐. CI에서는 `ELECTRON_SKIP_BINARY_DOWNLOAD=1`로 받지 않음

## Yarn이 의존성 빌드 스크립트를 실행하지 않음

- 증상: 설치 로그에 "lists build scripts, but all build scripts have been disabled"가 뜸
- 원인: Yarn 4 최신 버전은 기본적으로 의존성의 install 스크립트를 막음
- 해결: 루트 `package.json`의 `dependenciesMeta`에 꼭 필요한 패키지만 `built: true`로 허용함 (esbuild, @swc/core)

## workspaces foreach가 아무 것도 실행하지 않음

- 증상: `yarn typecheck`가 바로 끝나고 각 패키지의 검사가 돌지 않음
- 원인: `-A`(전체)에 루트 워크스페이스도 포함돼서, 루트의 `typecheck` 스크립트가 다시 foreach를 부르는 구조가 됨
- 해결: `--exclude toss-place`로 루트를 빼고 실행함

## tsdown 설정의 as const 타입 에러

- 증상: 공통 설정 객체에 `as const`를 붙였더니 `readonly ["electron"]`은 `StringOrRegExp[]`에 넣을 수 없다는 에러가 남
- 원인: `as const`는 배열을 readonly로 만드는데 tsdown 타입은 수정 가능한 배열을 요구함
- 해결: `as const` 대신 `satisfies UserConfig`를 씀. 리터럴 타입은 유지되고 배열은 readonly가 되지 않음

## 최신 버전이 서로 맞지 않음

- 증상: TypeScript 7, ESLint 10을 깔면 typescript-eslint, jsx-a11y의 peer dependency 범위를 벗어남
- 해결: `npm view <패키지> peerDependencies`로 범위를 먼저 확인하고 TypeScript 6.0, ESLint 9로 맞춤
- 배운 점: 최신 버전을 바로 쓰기보다 생태계 전체가 따라왔는지 먼저 확인해야 함
