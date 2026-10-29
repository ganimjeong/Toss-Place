# 첫 배포와 Trusted Publisher 등록 회고

`@ajinjeong/payment-sdk@0.1.0`을 로컬에서 처음 올리고, Trusted Publisher를 등록한 뒤 `0.1.1`을 CI로 올려 연결을 검증하기까지의 기록.

## 한 줄 요약

문서대로 하면 세 줄이면 끝날 줄 알았던 첫 배포가 네 번 실패함. 실패 원인은 전부 코드가 아니라 계정 상태, CLI 버전, 실행 환경이었고, 에러 메시지는 매번 원인과 다른 곳을 가리켰다.

## 1. 2FA가 꺼진 계정은 직접 배포가 막힘

- 이슈: `npm publish`가 `E403`으로 실패함. 메시지는 "2FA 또는 bypass 2fa 토큰이 필요하다"였고, 뒤에 붙은 기본 문구는 의존성이나 보안 정책 문제처럼 읽힘
- 원인: 계정에 2FA가 꺼져 있었음. 지난번에 본 "2FA 우회 토큰 제한" 공지와 같은 흐름으로, 이제 직접 배포는 2FA가 켜진 계정만 됨
- 해결: 사용자가 계정 설정에서 2FA를 켬. 계정 보안 설정이라 자동화하지 않고 사람이 직접 함
- 배운 점: `E403` 뒤의 일반 안내 문구보다 첫 줄의 구체 메시지를 먼저 읽는다

## 2. 패스키 2FA에는 OTP가 없음

- 이슈: 2FA를 켠 뒤 `EOTP`가 나서 `--otp=<코드>`를 붙였는데 또 `EOTP`
- 가설 1, 시계 차이: 로컬 시각과 `registry.npmjs.org` 응답의 `date` 헤더를 비교함. 초 단위까지 같아서 아님
- 가설 2, 로그인 세션이 2FA 이전 것: 다시 로그인했지만 같음
- 원인: 사용자는 인증 앱이 아니라 구글 패스키로 2FA를 켰음. 6자리 코드 자체가 없었는데, 내가 "인증 앱"을 전제로 안내함. 사용자에게 무엇으로 켰는지 먼저 물었어야 했음
- 해결: 시스템 npm은 10.9.2였고, 이 버전은 publish 2FA를 OTP 입력으로만 받음. npm 11.19.1로 `--auth-type=web`을 주니 브라우저 인증 주소를 줌
- 배운 점: 인증 실패를 디버깅할 때는 먼저 "어떤 인증 수단인가"를 확인한다. 같은 `EOTP`라도 수단에 따라 해결책이 완전히 다름

## 3. 브라우저 인증은 대화형 터미널이 필요함

- 이슈: 에디터 안의 실행 창에서 npm 11 명령을 돌리니 인증 주소가 마스킹되고, npm이 인증을 기다리지 않고 바로 `EOTP`로 끝남
- 원인: 입력을 받을 수 없는 환경이라 npm이 폴링하지 않고 주소만 출력하고 종료함
- 해결: macOS 기본 터미널에서 같은 명령을 실행함. 로그에 `PUT 401`(인증 요구) 뒤 `PUT 202`, `exit 0`이 찍혀 성공함
- 덤: 성공 직후 `npm view`는 404였음. 처음 만든 패키지는 레지스트리 조회에 반영되기까지 약 3분이 걸림. 10초 간격으로 폴링해서 200을 확인한 뒤 다음 단계로 넘어감. 실패로 오판하고 다시 publish했다면 같은 버전 중복으로 `E403`을 받았을 것

## 4. Trusted Publisher 화면이 문서보다 앞서 있었음

- 새로 생긴 것 1, Allowed actions: `npm stage publish`는 항상 허용되고, `npm publish`는 체크해야 허용됨. 체크하면 "권장하지 않음"이 뜸. 끈 상태가 기본 권장이고, 그러면 CI가 올린 버전은 사람이 웹에서 승인해야 공개됨
- 판단: 지금 워크플로는 `npm publish`로 바로 올리는 구조이고 혼자 운영하므로 일단 켬. 사람 승인 단계를 두려면 GitHub Environment 승인과 npm staged publish 중 하나를 고르면 되는데, npm 쪽이 레지스트리에서 강제된다는 점에서 더 강함. 지난 회고(`2026-10-29-release-setup.md`)에서 미뤄 둔 "사람 승인" 고민의 답이 GitHub 바깥에 하나 더 생긴 셈
- 새로 생긴 것 2, Pending validation: 저장 직후 연결이 "검증 대기"이고 약 이틀 안에 이 워크플로로 한 번 배포해야 함. 그래서 코드 변경이 없어도 `0.1.1`을 바로 올려 검증함
- 저장 뒤 수정 불가: 연결의 저장소와 워크플로 값은 고칠 수 없고 지우고 다시 만들어야 함. 입력값은 저장 전에 스크린샷으로 한 번 더 확인함
- 2FA 세션 만료: 처음 저장할 때 패스키 확인이 늦어져 "Something went wrong"이 뜨고 저장이 안 됨. 설정 화면을 새로 열어 연결 목록이 비어 있는지 확인한 뒤 같은 값으로 다시 저장함. 실패 메시지만 보고 "됐겠지"로 넘어가지 않고 결과 상태를 다시 읽는 게 중요했음

## 5. 남은 경고: publishConfig

- 현상: npm 11로 publish하면 `Unknown publishConfig config "main"`(module, types, exports도) 경고가 뜨고, 다음 메이저에서 동작이 바뀐다고 함
- 원인: Yarn은 `publishConfig`의 `main`, `exports` 등을 tarball 최상위에 반영하지만 `publishConfig` 자체도 그대로 남김. npm은 `publishConfig`를 npm 설정 값으로 읽으니 모르는 키라고 경고함
- 지금 고치지 않은 이유: 고치는 방법은 워크스페이스의 `exports`를 소스용 커스텀 condition(`source`)과 배포용 경로로 나누고, 모든 소비 번들의 TS `customConditions`, Vite `resolve.conditions`, Vitest 설정을 맞추는 것. 검증 기한이 있는 배포와 섞으면 실패 원인이 둘이 되므로 분리함
- 다음: npm 12 전에 위 방식으로 바꾸고, tarball의 `package.json`에 `publishConfig`가 `access`만 남는지 확인하는 검사를 `check:package`에 넣음

## 확인

- `0.1.0`: 로컬 배포, `npm view`로 레지스트리 반영 확인
- Trusted Publisher: 저장 뒤 설정 화면에서 `ganimjeong/Toss-Place`, `release-payment-sdk.yml`, 권한 `npm publish`, `npm stage publish` 확인
- Publishing access: 저장 뒤 화면을 다시 열어 "disallow bypass 2fa tokens"가 선택된 상태 확인
- `0.1.1`: `payment-sdk@0.1.1` 태그로 CI 배포 성공. 로그에 `Signed provenance statement`가 찍히고, 레지스트리의 `dist.attestations.provenance`가 SLSA v1로 채워짐. 배포 직후 설정 화면의 연결 상태가 "Pending validation"에서 "Valid"로 바뀜
