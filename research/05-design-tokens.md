# 디자인 토큰

## TDS 토큰 구조 [공개]

색상 (`@toss/tds-colors`)

- 이름은 계열 + 단계 숫자. 예: `blue500`, `grey900`
- 계열: grey, blue, red, orange, yellow, green, teal, purple, greyOpacity
- 단계는 50부터 900까지, 숫자가 클수록 진함
- 배경용 의미 토큰: `background`, `greyBackground`, `layeredBackground`, `floatedBackground`
- 대표값: blue500 `#3182f6`, grey900 `#191f28`, red500 `#f04452`, green500 `#03b26c`

타이포그래피

- Typography 1부터 7까지 주요 단계와 그 사이 sub 단계가 있음
- 주요 단계: 30/40, 26/35, 22/31, 20/29, 17/25.5, 15/22.5, 13/19.5 (글자 크기/줄 높이, px)
- 줄 높이는 대략 글자 크기의 1.5배
- 값을 하드코딩하지 말고 토큰을 그대로 쓰라고 안내함

## 사용 조건 [공개]

- TDS 사용 권한은 앱인토스 서비스 제공을 위한 제한적인 권한임
- 그래서 이 레포는 TDS 패키지를 쓰지 않고 같은 구조로 자체 토큰을 만듦
- 토스플레이스도 디자인 시스템을 따로 만드는 포지션이 있고, 스타일 도구로 Vanilla Extract를 씀

## 디자인 시스템 포지션에서 다루는 것 [공개]

- 반응형, 키보드 사용성, 로딩 같은 UX 규칙 정의
- 디자이너가 디자인 에디터에서 바로 UX 제안을 받는 디자인 린터
- 고성능 컴포넌트, 재사용 가능한 UI와 애니메이션 라이브러리

## 이 레포의 토큰 설계

```
packages/design-system/src/tokens/
  palette.ts      원시 색상. 패키지 밖으로 내보내지 않음
  theme.css.ts    의미 토큰 계약(createThemeContract)과 기본 테마 값
```

- 컴포넌트는 `vars`만 씀. `vars.color.textPrimary`는 `var(--...)` 문자열이라 Emotion에서도 그대로 쓸 수 있음
- 계약과 값을 나눠서 다크 테마나 고객용 화면 테마를 이름 변경 없이 추가할 수 있음
- 색상은 text, bg, border, 상태색으로 나눔
- 타이포그래피는 t1부터 t7. POS 화면은 떨어져서 보기 때문에 모바일보다 한 단계 정도 크게 잡음 [추정]
- 간격은 4px 단위, 누르는 요소의 최소 크기는 `size.touchTarget`(56px) [추정]

## 출처

- TDS Mobile https://tossmini-docs.toss.im/tds-mobile/
- TDS Colors https://tossmini-docs.toss.im/tds-mobile/foundation/colors/
- TDS Typography https://tossmini-docs.toss.im/tds-mobile/foundation/typography/
- 앱인토스 디자인 컴포넌트 https://developers-apps-in-toss.toss.im/design/components
- Frontend UX Engineer (Design System) 공고 https://zighang.com/recruitment/10ade266-2a59-4374-a532-7ea4f66474e6
