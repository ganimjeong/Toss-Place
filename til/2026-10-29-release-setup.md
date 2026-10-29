# 배포 설정 회고

결제 SDK를 npm에 실제로 올릴 수 있게 이름과 메타데이터를 정하고, 토큰 없는 Trusted Publishing으로 배포 방식을 바꾸고, npm과 Sentry 설정 절차를 CONTRIBUTING에 정리한 작업.

## 한 줄 요약

배포 워크플로는 이미 있었지만 "올릴 수 있는 상태"는 아니었다. 이름, 저장소 정보, 비밀값처럼 코드 밖의 전제가 빠져 있었고, 그 전제는 실패해야 드러나는 종류였다.

## 1. 공개 이름은 내부 이름과 다를 수 있음

- 이슈: 워크스페이스 패키지가 전부 `@toss-place/*`라 SDK도 `@toss-place/payment-sdk`였음. npm scope는 계정이나 조직이 소유해야 쓸 수 있고, `@toss-place`는 내 것이 아님
- 고민: 가능하더라도 `toss-place`라는 이름으로 공개 패키지를 올리면 토스 공식 패키지로 오해받을 수 있음
- 결정: npm에 공개되는 SDK만 `@ganimjeong/payment-sdk`로 바꿈. 나머지 패키지는 레포 안에서만 쓰는 이름이라 그대로 둠
- 대가: 레포 안에 scope가 두 개가 됨. 대신 "이 패키지만 공개된다"는 사실이 import 경로에서 드러남
- 지난 회고(`2026-10-27-payment-sdk.md`)의 `@toss-place/payment-sdk` 표기는 그때의 결정 기록이라 고치지 않음

## 2. provenance는 package.json의 repository를 검사함

- 이슈: 배포 워크플로는 provenance로 "어느 저장소, 어느 커밋에서 빌드됐는지"를 서명해서 올림(아래 3번 이후로는 Trusted Publishing이 자동으로 붙임). SDK `package.json`에는 `repository` 필드가 없었음
- 원인 찾기: npm 문서와 다른 프로젝트들의 사례를 보니, provenance는 서명된 빌드 저장소와 `package.json`의 `repository.url`을 비교하고, 비어 있거나 다르면 `E422`로 거절함. 저장소도 public이어야 함
- 해결: `repository`(모노레포라 `directory`까지), `homepage`, `bugs`를 넣음. 저장소가 public인 것도 확인함
- 배운 점: 첫 배포가 실패하는 이유는 대부분 코드가 아니라 메타데이터다. 실패하면 태그를 다시 찍어야 해서, 미리 확인할 수 있는 건 미리 막는다

## 3. 토큰 방식에서 Trusted Publishing으로 바꿈

- 처음 결정: `NPM_TOKEN` 시크릿에 Granular Access Token을 두고, 토큰이 없으면 설치 직후 멈추게 함. 토큰이 없으면 테스트까지 다 돈 뒤 `npm publish`에서야 `ENEEDAUTH`로 실패하기 때문이었음
- 바꾼 계기: 토큰을 만들려고 npm에 들어가니 로그인 화면 위에 2FA를 우회하는 토큰을 제한한다는 공지가 떠 있었음. GitHub changelog를 확인하니 2026년 8월부터 계정, 패키지 관리에서 2FA 우회가 막혔고, 2027년 1월쯤에는 직접 배포 권한도 잃음. CI 배포 대안으로 Trusted Publishing(OIDC)을 권함
- 판단: 지금 토큰으로 설정하면 몇 달 뒤 배포가 깨짐. 그리고 Trusted Publishing은 저장소에 장기 토큰이 아예 없어서, 토큰이 새는 경우 자체가 없어짐
- 바꾼 것
  - 워크플로에서 토큰 검사와 `NODE_AUTH_TOKEN`을 빼고 `id-token: write`로 인증함
  - `setup-node`의 `registry-url`을 뺌. 이 옵션은 `NODE_AUTH_TOKEN`을 읽는 `.npmrc`를 만들어서, 토큰 없는 OIDC 인증과 섞이지 않게 하려는 것
  - `--provenance`를 뺌. Trusted Publishing은 public 저장소, public 패키지면 provenance를 자동으로 붙임
  - Trusted Publishing은 npm CLI 11.5.1부터 동작해서, 버전이 낮으면 publish 전에 멈추는 검사를 둠. 경계값(11.5.0, 11.5.1, 11.19.1, 10.9.2)으로 검사식을 확인함
- 제약: 신뢰 설정은 npmjs.com의 패키지 설정 화면에서 함. 패키지가 먼저 있어야 해서 첫 버전은 로그인한 사람이 로컬에서 2FA로 직접 올림. 첫 버전에는 provenance가 붙지 않음. 설정 뒤에는 Publishing access를 "2FA 필수, 토큰 금지"로 바꿔서 토큰 배포 경로를 닫음
- 배운 점: 배포 방식은 코드보다 생태계 정책에 더 빨리 낡는다. 설정하기 직전에 레지스트리의 현재 공지를 보는 게 문서를 한 번 더 읽는 것보다 정확했다

## 4. 비밀값은 사람이 직접 넣음

- npm은 토큰이 없어졌으니 남은 비밀값은 Sentry뿐임
- 등록은 `gh secret set NAME`으로 터미널에서 직접 붙여 넣게 함. 값이 셸 기록, 파일, 채팅에 남지 않음
- Sentry DSN은 앱 번들에 그대로 들어가는 공개 값이지만 저장소 코드에는 넣지 않음. 포크한 저장소의 빌드가 같은 Sentry 프로젝트로 이벤트를 보내지 않게 하려는 것
- Sentry는 npm과 반대로 시크릿이 없어도 실패하지 않고 모니터링 없이 빌드함. SDK는 인증 없이는 배포 자체가 불가능하지만, 앱은 모니터링이 없어도 배포할 가치가 있다고 봄. 같은 "설정 없음"이라도 배포의 필수 조건인지에 따라 다르게 처리함

## 확인

- `yarn pack` 결과 tarball에 `LICENSE`, `README.md`, `dist`, `package.json`만 들어가는지 봄
- attw, publint 통과
- 실제 배포는 첫 로컬 배포와 Trusted Publisher 등록 뒤 태그로 확인해야 함

## 남은 고민

- 첫 버전(0.1.0)은 로컬 배포라 provenance가 없음. 다음 버전부터 붙음
- 릴리스 워크플로에 GitHub Environment를 두고 승인자를 지정하면, 태그만으로 바로 배포되지 않고 사람 승인을 한 번 거치게 할 수 있음. 혼자 운영하는 지금은 두지 않음
