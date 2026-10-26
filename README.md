# Toss Place POS

매장용 POS 프론트엔드. 웹 기술로 만든 기능을 도메인별 웹뷰 번들로 나누고, Electron 셸이 번들을 띄우는 구조임.
번들은 표준 POS 인터페이스(`@toss-place/pos-bridge`)만 알고 있어서 같은 코드가 데스크톱, 태블릿, 브라우저에서 그대로 동작함.

## 구조

```
apps/
  shell/            Electron 셸. 번들 로딩, 기기 연동(IPC) 담당
bundles/
  order/            주문, 카드 결제, 영수증 출력
  cash/             시재관리. 권종별 현금 세기와 과부족 확인, 금전함 열기
packages/
  payment-sdk/      결제 상태 전이, 중복 요청 방지, 결과를 모르는 결제의 조회와 복구 (npm 배포용)
  pos-bridge/       POS 기기 표준 인터페이스, 브라우저 개발용 mock, IPC 채널 이름
  design-system/    디자인 토큰 (Vanilla Extract)
  utils/            금액 계산 등 공통 유틸
  vite-config/      번들 공통 Vite 설정, 프로덕션 CSP
  eslint-config/    공통 린트 규칙
  tsconfig/         공통 TypeScript 설정
research/           구조와 규칙을 정할 때 참고한 자료 정리
```

- 번들은 다른 번들을 import할 수 없음. 공통 코드는 `packages`로 올림.
- 번들은 Electron API를 직접 쓰지 않음. 기기 기능은 항상 `getPosBridge()`를 거침.
- 카드 결제는 `@toss-place/payment-sdk`를 거침. 결제 중에 화면을 바꾸거나 앱이 꺼져도 다음 실행 때 결과를 조회함. 설계는 [packages/payment-sdk](packages/payment-sdk/README.md) 참고.

## 시작하기

Node 버전은 `.nvmrc`를 따름. 패키지 매니저는 Corepack으로 고정된 Yarn 4를 씀.

```sh
corepack enable
yarn install
```

브라우저에서 번들만 띄우기 (기기 기능은 mock으로 동작)

```sh
yarn dev:order   # http://localhost:5173
yarn dev:cash    # http://localhost:5174
```

Electron 셸로 띄우기 (번들 개발 서버를 먼저 켜둬야 함)

```sh
yarn dev:order
yarn dev:cash
yarn dev:shell
```

셸 메뉴의 화면 항목이나 `Cmd/Ctrl + 1, 2`로 번들을 바꿈.

빌드 결과로 띄우기

```sh
yarn build
yarn workspace @toss-place/shell start
```

## 자주 쓰는 명령

| 명령             | 설명                        |
| ---------------- | --------------------------- |
| `yarn lint`      | ESLint 검사                 |
| `yarn typecheck` | 전체 워크스페이스 타입 검사 |
| `yarn test`      | 전체 워크스페이스 테스트    |
| `yarn build`     | 전체 빌드                   |
| `yarn format`    | Prettier 정리               |

## 기술 스택

React 19, TypeScript, Vite, Electron, TanStack Query, Emotion, Vanilla Extract, overlay-kit, Suspensive, es-toolkit, Vitest, Testing Library, Yarn Berry, GitHub Actions

선택 이유는 [research/02-tech-stack.md](research/02-tech-stack.md)에 정리함.

## 기여 방법

브랜치, 커밋, 리뷰 규칙은 [CONTRIBUTING.md](CONTRIBUTING.md) 참고.
