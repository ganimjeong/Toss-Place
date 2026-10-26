# 디자인 시스템 Button 추출 회고

주문 번들 세 군데에 복사돼 있던 버튼 스타일을 디자인 시스템 `Button`으로 올린 작업. PR #1

## 한 줄 요약

워크스페이스 패키지를 빌드하지 않고 소스로 공유하면, 그 소스는 쓰는 쪽의 컴파일 설정을 따른다.

## 1. 디자인 시스템 파일에 Emotion 런타임이 적용됨

- 이슈: 주문 번들에서 타입 검사를 하니 `Button.tsx`에 "`@emotion/react/jsx-runtime`을 찾을 수 없다"는 에러가 남. 디자인 시스템 자체 검사는 통과함
- 원인 찾기: 디자인 시스템은 `exports`로 `.ts` 소스를 그대로 내보냄. 그래서 주문 번들이 이 파일을 자기 tsconfig(`jsxImportSource: @emotion/react`)로 컴파일함. 디자인 시스템은 Emotion에 의존하지 않고, 엄격한 링커가 Emotion을 찾지 못하게 막음
- 해결: `Button.tsx` 상단에 `@jsxImportSource react` 프라그마를 둠. 파일 단위 설정이라 누가 컴파일하든 React 런타임을 씀
- 재발 방지: 새 컴포넌트를 만들 때 같은 프라그마를 둠. 컴포넌트가 늘어나면 디자인 시스템을 tsdown으로 빌드해서 내보내는 방식을 검토함
- 배운 점: 엄격한 링커 덕분에 숨은 의존성이 런타임 전에 드러났다. PnP를 포기했어도 pnpm 링커를 고른 효과가 있었음

## 2. 테스트 사이에 렌더링 결과가 남음

- 이슈: 두 번째 테스트부터 "같은 이름의 button이 여러 개"라는 에러가 남
- 원인 찾기: 이전 테스트의 DOM이 지워지지 않았음. Testing Library의 자동 cleanup은 테스트 러너의 전역 `afterEach`가 있을 때만 등록되는데, Vitest는 globals를 기본으로 끔
- 해결: `vitest.setup.ts`에서 `afterEach(cleanup)`을 직접 등록함. 주문 번들에도 같이 넣음
- 배운 점: 기존 `renderHook` 테스트는 우연히 통과하고 있었다. 테스트가 하나뿐일 때는 이런 문제가 드러나지 않는다

## 결정 기록

- Button 스타일은 Vanilla Extract의 `recipe`로 만듦. variant 조합이 타입으로 나와서 `variant="primry"` 같은 오타를 컴파일 단계에서 막음
- 바깥 `className`은 기본 스타일 뒤에 붙임. 번들에서 Emotion css prop으로 덮어써도 동작함
- 메뉴 카드 버튼은 Button으로 바꾸지 않음. 모양과 바뀌는 이유가 달라서 지금은 중복이 아니라고 판단함
