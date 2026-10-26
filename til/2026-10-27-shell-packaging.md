# 셸 패키징과 릴리스 회고

Electron 셸을 electron-builder로 macOS, Windows 설치 파일로 만들고, GitHub Actions에서 OS별로 패키징, 스모크 테스트, 릴리스까지 하게 만든 작업. PR #7

## 한 줄 요약

개발 환경에서만 맞는 가정(레포 폴더 구조, POSIX 경로, 우연한 빌드 순서, 같은 드라이브)이 패키징과 OS별 CI에서 한꺼번에 드러났다. 그중 두 개는 내가 고친 코드와 테스트 안에 있었다. 고친 방향은 모두 같았다. 환경마다 갈라지는 분기를 만들지 않고 경로 하나로 모으고, 그 경로를 CI가 실제 바이너리로 확인하게 했다.

## 1. 패키징한 앱이 빈 창만 띄움

- 이슈: `electron-builder --mac`은 성공했는데 앱을 열면 빈 창. 에러 화면도 없음
- 원인 찾기: 앱을 `--remote-debugging-port`로 띄워 `/json`에서 페이지 URL을 확인함. `.../Mini POS.app/Contents/bundles/order/dist/index.html`을 열려다 `ERR_FILE_NOT_FOUND`. 번들 경로를 `__dirname/../../../bundles`로 만들고 있었는데, 이건 `apps/shell/dist`에서 레포 루트까지 올라가는 경로라 `app.asar/dist`에서는 엉뚱한 곳을 가리킴. 로드 실패는 `await openBundle()`의 unhandled rejection으로 콘솔에만 남고 화면에는 아무것도 안 나왔음
- 선택지
  - A. 번들을 `extraResources`로 넣고 `app.isPackaged`면 `process.resourcesPath`, 아니면 레포 경로를 씀
  - B. 셸 빌드 때 번들 결과를 `apps/shell/dist/bundles`로 복사하고 항상 `__dirname/bundles`를 씀
- 결정: B. A는 패키징 여부에 따라 경로가 둘로 갈리고, 패키징 쪽 분기는 로컬 개발과 단위 테스트에서 한 번도 실행되지 않음. B는 `yarn workspace @toss-place/shell start`로 띄운 앱과 설치한 앱이 같은 코드 경로를 탐. 대가는 빌드 결과가 번들 크기만큼 복사되는 것
- 재발 방지: 번들 로드 실패를 잡아서 번들 이름과 함께 남김. Sentry를 붙이면 여기서 보고함
- 배운 점: 패키징 여부로 분기하는 코드는 테스트가 닿지 않는 곳에 두 번째 앱을 만드는 것과 같다

## 2. `file://` + 경로 문자열은 URL이 아님

- 이슈: 기존 코드는 `` `file://${join(...)}` ``로 URL을 만들었음. macOS에서는 Chromium이 공백(`Mini POS.app`)을 알아서 `%20`으로 고쳐줘서 드러나지 않았음
- 판단: Windows에서는 `join`이 `C:\Users\...`를 돌려줘서 `file://C:\Users\...`가 됨. 이건 호스트가 `C`인 URL로 읽힐 수 있음. 한글 사용자 이름, `#`이 들어간 폴더도 깨짐
- 해결: `pathToFileURL(...).href`. 드라이브 문자, 백슬래시, 퍼센트 인코딩을 Node가 처리함. 공백과 한글이 들어간 경로 테스트를 추가함
- 배운 점: 경로와 URL은 다른 타입이다. 문자열로 이어 붙이는 순간 플랫폼 차이를 내가 떠안는다

## 3. 빌드 순서가 우연이었음, 그리고 고친 것도 우연이었음

- 이슈: 셸 빌드가 번들 빌드 결과를 복사하게 되면서 "번들이 셸보다 먼저 빌드된다"가 필요해짐. 그런데 셸 `package.json`에는 번들이 없었음. 셸은 번들을 import하지 않고 URL로만 열기 때문임
- 1차 해결: 셸 `devDependencies`에 `@toss-place/order`, `@toss-place/cash`를 선언하고, 복사 스크립트가 번들 위치를 `createRequire().resolve('@toss-place/<name>/package.json')`로 찾게 함. 로컬 `yarn build`, ubuntu CI 모두 통과해서 끝난 줄 알았음
- 다시 이슈: macOS 릴리스 잡에서 `order 번들 빌드 결과가 없습니다`로 실패함. 복사 스크립트에 넣어둔 검사가 걸린 것
- 원인 찾기: 로컬에서 `bundles/*/dist`를 지우고 빌드하니 똑같이 실패함. 로컬 통과는 이전 빌드 결과가 남아 있어서였음. `yarn workspaces foreach --help`를 보니 `-t`는 "regular" 의존성만 보고, devDependencies까지 보려면 `--topological-dev`가 따로 있었음. 선언은 했지만 빌드 순서에는 아무 영향이 없었고, ubuntu CI 통과는 병렬 실행 타이밍이 맞았던 것
- 해결: 루트 빌드를 `foreach -Ap --topological-dev`로 바꿈. dist를 모두 지운 상태에서 통과하는 것까지 확인함
- 재발 방지: `BUNDLES`의 모든 번들이 셸 `devDependencies`에 있는지 확인하는 테스트. 복사 스크립트는 빌드 결과가 없으면 조용히 넘어가지 않고 실패함. 이번에 문제를 잡은 건 테스트가 아니라 이 실패였음
- 배운 점
  - 모노레포에서 "빌드 산출물을 읽는다"도 의존성이다. import가 없다고 의존성이 없는 게 아니다
  - 선언한 것과 도구가 그 선언을 쓰는 방식은 다르다. 고쳤다고 판단하기 전에 도구 문서에서 그 옵션이 무엇을 보는지 확인한다
  - 빌드 산출물에 기대는 검사는 깨끗한 상태에서 한 번 돌려본다. 남아 있는 dist는 검사를 통과시키는 숨은 입력이다

## 4. Windows에서 yarn install이 실패함 (EXDEV)

- 이슈: Windows 잡이 `yarn install --immutable`에서 `EXDEV: cross-device link not permitted`로 실패. `C:\Users\runneradmin\AppData\Local\Yarn\Berry\index\...`에서 `D:\a\Toss-Place\...\node_modules\.store\...`로 링크를 걸다가 남
- 원인 찾기: pnpm 링커는 전역 저장소의 파일을 `node_modules/.store`로 하드링크함. 하드링크는 같은 드라이브 안에서만 됨. GitHub Windows 러너는 홈이 C:, 작업 폴더가 D:라 처음부터 불가능한 조합이었음. macOS, Linux 러너는 같은 볼륨이라 드러나지 않았음
- 해결: install 전에 `YARN_GLOBAL_FOLDER`를 `$RUNNER_TEMP`(D:)로 옮김. 처음엔 job 수준 `env`에 `${{ runner.temp }}`를 넣었는데 `runner` 컨텍스트는 그 위치에서 쓸 수 없어서 `$GITHUB_ENV`에 쓰는 단계로 바꿈
- 배운 점: 링커 선택(PnP, pnpm, node-modules)은 개발 경험만이 아니라 CI 파일 시스템 제약과도 엮인다

## 5. 내 테스트가 POSIX에 묶여 있었음

- 이슈: Windows에서 `resolveBundleUrl` 테스트 2개 실패. 기대값을 `file:///app.asar/dist/...`처럼 POSIX 절대 경로로 적었는데, Windows에서 `/app.asar`는 `D:\app.asar`로 해석돼 `file:///D:/app.asar/...`가 나옴. 구현은 맞고 테스트가 틀렸음
- 해결: 기대 URL 문자열 대신 성질을 검사함. URL을 `fileURLToPath`로 되돌리면 원래 경로와 같아야 하고, URL에 공백, 한글, 백슬래시가 그대로 남으면 안 됨. 예전 구현(`file://` + 경로)으로 되돌려서 이 테스트가 실패하는 것도 확인함
- 배운 점: 크로스 플랫폼 코드의 테스트는 "어떤 문자열이 나오는가"보다 "어떤 성질을 지키는가"로 쓴다. Windows 경로 버그를 막으려고 고친 코드의 테스트가 Windows에서 깨진 건, 그 플랫폼에서 한 번도 돌려보지 않았기 때문이다

## 6. 스모크 테스트를 앱 안에 넣은 이유

- 고민: 패키징한 앱이 실제로 번들을 그리는지 CI에서 확인하고 싶었음. Playwright의 Electron 지원을 쓰면 테스트 코드가 앱 밖에 있어서 깔끔함
- 판단: 확인하고 싶은 건 "설치 파일 안의 바로 그 바이너리가 asar, CSP, OS 경로를 거쳐 번들을 그리는가"였음. Playwright는 보통 `electron` 패키지로 `main.cjs`를 띄우는데, 그러면 asar와 패키징 경로를 건너뜀. 패키징된 실행 파일을 직접 띄우는 게 목적에 맞았음
- 결정: `--smoke-test` 플래그를 주면 창을 띄우지 않고 모든 번들을 차례로 열고, `#root`에 자식이 생길 때까지 기다린 뒤 종료 코드로 결과를 알림. CI가 macOS `.app`, Windows `win-unpacked/Mini POS.exe`를 직접 실행함
- 확인: 처음부터 통과해서, 번들 하나를 지우고 돌려 종료 코드 1과 `cash: ERR_FILE_NOT_FOUND`가 나오는지 봄
- 결과: 위 4, 5번을 고친 뒤 GitHub Actions의 macOS(dmg), Windows(nsis) 러너 모두에서 `[smoke-test] 통과: order, cash`
- 한계: "그려졌다"까지만 봄. 결제 흐름 같은 동작은 단위 테스트와 번들 테스트에 맡김. 스모크 테스트는 넓고 얕게 둠
- 배운 점: 테스트 대상이 "코드"인지 "배포물"인지 먼저 정한다. 배포물을 검사하려면 배포물을 실행해야 한다

## 7. 릴리스 워크플로 설계

- `fail-fast: false`: Windows가 실패해도 macOS 결과를 끝까지 봄. 한 OS 문제를 고치는 동안 다른 OS 상태를 모르면 원인 범위를 좁히기 어려움
- 릴리스는 별도 잡. 모든 OS의 패키징과 스모크 테스트가 통과해야 `gh release create`가 돎. macOS만 올라가고 Windows가 빠진 반쪽 릴리스를 막음
- 태그(`pos@x.y.z`)와 셸 `package.json` 버전이 다르면 패키징 전에 멈춤. 설치 파일 이름에 버전이 들어가서 틀리면 되돌리기 어려움
- PR에서도 돎: 처음엔 `workflow_dispatch`로 수동 확인하려 했는데, 이 이벤트는 워크플로 파일이 기본 브랜치에 있어야 실행할 수 있음. 새 워크플로를 머지 전에 검증할 수 없어서, 셸과 Vite 설정을 바꾸는 PR(`paths`)에서는 릴리스 없이 패키징과 스모크 테스트만 돌게 함. 결과적으로 경로 문제를 태그 전에 잡는 장치가 됨
- 서명: 인증서가 없어서 `CSC_IDENTITY_AUTO_DISCOVERY=false`로 서명하지 않음. 사용자는 macOS에서 우클릭 후 열기, Windows SmartScreen에서 추가 정보 후 실행을 해야 함. README에 적어둠

## 8. 앞선 결정이 패키징을 단순하게 만듦

- electron-builder는 앱의 `dependencies`를 찾아 `node_modules`를 asar에 넣음. 로그에 "no node modules found"가 나왔고 그게 맞는 결과였음
- 초기 세팅 때 tsdown으로 워크스페이스 패키지까지 `main.cjs`, `preload.cjs`에 묶어둬서 셸에 런타임 의존성이 없음. 그래서 pnpm 링커의 심볼릭 링크 구조를 electron-builder가 따라가야 하는 문제가 처음부터 없었음. 네이티브 모듈도 없어서 `npmRebuild: false`
- 배운 점: Electron 앱에서 런타임 의존성 0은 크기보다 패키징 신뢰성 문제다

## 9. 로컬 DMG 생성이 멈춤 (원인 못 찾음)

- 증상: `.app`까지 만든 뒤 DMG 단계에서 dmgbuild 도구 다운로드가 `The server aborted pending request`로 한 번 끊기고, 이후 dmgbuild 프로세스가 20분 넘게 끝나지 않음
- 한 것: 프로세스를 정리하고 `.app` 스모크 테스트는 로컬에서, DMG는 CI에서 확인하기로 함
- CI의 macOS 러너에서는 DMG가 정상으로 만들어지고 스모크 테스트까지 통과함. 로컬 환경 문제로 범위는 좁혔음
- 원인은 확인하지 못함. 네트워크 문제로 받다 만 도구 캐시인지, 로컬 `hdiutil` 권한 문제인지 구분하지 않았음. 증상만 피한 상태로 기록함

## 남은 고민

- 코드 서명과 공증: 매장에 배포하려면 필수. 인증서를 GitHub Secrets에 넣고 같은 워크플로에서 서명하는 구조로 확장할 수 있게 서명 관련 설정은 환경 변수로만 끔
- 자동 업데이트: 셸은 electron-updater로, 번들은 원격에서 내려받아 따로 업데이트하는 게 토스플레이스가 공개한 구조에 가까움. `resolveBundleUrl` 하나만 바꾸면 되도록 경로를 한곳에 모아둔 상태
- Windows arm64 단말기는 빌드 대상에 넣지 않음
