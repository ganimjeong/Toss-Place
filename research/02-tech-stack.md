# 기술 스택

## 채용 공고에 나온 스택 [공개]

토스플레이스 Frontend Developer 공고

- 코어: React, TypeScript, Next.js
- 상태 관리: React Query
- 스타일링: Emotion
- 패키지 매니저: Yarn Berry, pnpm
- 빌드: Webpack, ESBuild, SWC, Babel
- 테스트: Jest
- CI/CD: GitHub Actions
- 우대: Electron 및 모바일 앱 내 웹앱 개발 경험, TypeScript나 Flow 정적 타입 경험

이전 POS 공고에는 Vite, Vitest도 함께 나옴.

Frontend Developer (Platform) 공고

- 코어: React, TypeScript
- 패키지 매니저: yarn, pnpm
- 빌드: ESBuild, Vite, Webpack, SWC, Babel
- 인프라: AWS, Terraform
- 모니터링: Sentry, Grafana, Kibana
- CI/CD: GitHub Actions, GoCD
- 모노레포 같은 복잡한 프론트엔드 코드 구조를 운영해본 경험을 찾음

Frontend UX Engineer (Design System) 공고

- 언어와 프레임워크: TypeScript, React, Next.js
- 스타일링: Emotion, Vanilla Extract, Framer Motion, GSAP
- 빌드: Vite, tsdown
- 패키지 매니저: Yarn, pnpm
- 우대: 반응형, 웹 접근성, 웹 표준을 고려한 UI 개발, 디자인 시스템 구축 경험, 공통 모듈 설계 경험

토스 프론트엔드 챕터 전체 [공개]

- 모든 코드를 TypeScript로 작성함
- 웹 대부분이 React이고 Suspense 같은 기술도 적극 도입함
- Next.js의 SSR과 Static Export를 활용함
- Yarn Berry로 의존성을 엄격하게 관리함
- Emotion의 css prop으로 스타일을 다룸
- 비동기 처리는 React Query와 SWR로 선언적으로 관리함
- 챕터가 함께 공용 라이브러리를 만들고, 서비스 코드에서 잘 추상화된 조각이 나오면 라이브러리로 올림

토스 오픈소스 [공개]

- es-toolkit: lodash를 대체하는 유틸 라이브러리
- overlay-kit: 모달, 바텀시트 같은 오버레이를 선언적으로 관리
- suspensive: Suspense, ErrorBoundary 관련 도구
- es-hangul: 한글 처리 유틸
- react-simplikit: 작은 React 훅 모음
- slash는 2025년 12월에 아카이브됨. 기능이 es-toolkit, suspensive 등으로 나뉨

## 이 레포의 선택

| 영역          | 선택                                                           | 이유                                                                                                                          |
| ------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 언어          | TypeScript 6.0, strict                                         | 챕터 전체 기준. typescript-eslint가 아직 7.x를 지원하지 않아 6.0으로 맞춤                                                     |
| UI            | React 19                                                       | 공고 공통                                                                                                                     |
| 번들 빌드     | Vite + SWC                                                     | 웹뷰 번들은 SSR이 필요 없는 SPA라 Next.js 대신 Vite를 씀. 공고의 SWC와도 맞음                                                 |
| 셸            | Electron, tsdown                                               | 공고 우대 사항. 셸 빌드는 디자인 시스템 공고에 나온 tsdown을 씀                                                               |
| 서버 상태     | TanStack Query (Suspense)                                      | 공고 공통                                                                                                                     |
| 비동기 경계   | @suspensive/react                                              | 토스 오픈소스                                                                                                                 |
| 스타일        | 번들은 Emotion, 토큰은 Vanilla Extract                         | 제품 공고는 Emotion, 디자인 시스템 공고는 Vanilla Extract. 토큰을 CSS 변수로 만들어 Emotion에서 그대로 씀                     |
| 오버레이      | overlay-kit                                                    | 토스 오픈소스                                                                                                                 |
| 유틸          | es-toolkit                                                     | 토스 오픈소스                                                                                                                 |
| 패키지 매니저 | Yarn 4 + Corepack, workspaces                                  | 챕터가 Yarn Berry를 씀                                                                                                        |
| 링커          | `nodeLinker: pnpm`                                             | PnP로 시작했는데 Vite가 PnP 지원을 더 이상 챙기지 않는다는 경고를 띄움. 공고에 pnpm도 있어서 pnpm 방식 링커로 엄격함은 유지함 |
| 테스트        | Vitest + Testing Library                                       | Vite와 설정을 공유함. API가 Jest와 같아서 옮기기 쉬움                                                                         |
| 린트          | ESLint 9 flat config, typescript-eslint, jsx-a11y, react-hooks | jsx-a11y가 아직 ESLint 10을 지원하지 않음                                                                                     |
| 커밋 검사     | husky, lint-staged, commitlint                                 | [추정] 공개된 자료는 없음                                                                                                     |
| CI            | GitHub Actions                                                 | 공고 공통                                                                                                                     |

## 나중에 붙일 것

- Sentry (Platform 공고). 번들별 에러 추적
- 번들 버전 관리와 셸의 번들 다운로드, 롤백
- 결제 수단별 번들 분리 (현금, 간편결제)

## 출처

- 토스 프론트엔드 챕터를 소개합니다 https://toss.tech/article/toss-frontend-chapter
- 토스플레이스 Frontend Developer 공고 https://www.bzpp.co.kr/biz/businessDetailView/BR250627A00450
- Frontend Developer (Platform) 공고 https://toss.im/career/job-detail?job_id=7646930003
- Frontend UX Engineer (Design System) 공고 https://zighang.com/recruitment/10ade266-2a59-4374-a532-7ea4f66474e6
- 토스플레이스 채용 https://tossplace.com/recruit
- 토스 GitHub https://github.com/toss
- es-toolkit 기여 가이드 https://github.com/toss/es-toolkit/blob/main/.github/CONTRIBUTING.md
