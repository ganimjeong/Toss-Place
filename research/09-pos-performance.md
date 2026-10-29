# 포스 화면 성능: 무엇을 재고 어떤 조건으로 재는가

성능 측정 스크립트(`apps/shell/scripts/measure.ts`)를 만들기 전에 토스 프론트엔드가 공개 발표에서 성능을 어떻게 다루는지, 포스가 일반 웹과 어떤 조건이 다른지 정리함.

## 토스가 성능을 다루는 방식 [공개]

- 화면이 그려지는 구간을 네트워크, 스크립트 실행(HTML과 JS 평가), 데이터 패칭으로 나눔. 저사양 기기에서는 JS 처리가 느려 초기 화면 지연이 더 커짐 (TMC25 토스뱅크)
- 번들 분석기로 안 쓰는 의존성, 무거운 라이브러리, 버전이 다른 같은 라이브러리를 찾아 줄임. JS 평가 시간이 줄면 렌더링과 인터랙션 가능 시점이 빨라짐 (TMC25 토스뱅크)
- 한 컴포넌트에서 `useSuspenseQuery`를 연달아 쓰면 요청이 직렬로 나가는 워터폴이 생김 (TMC25 토스뱅크)
- 개선한 뒤에도 다시 느려지므로 변경 이력과 지표를 함께 보고, 지표를 정기적으로 받아 튈 때 원인을 봄 (TMC25 토스뱅크)
- 렉과 발열 같은 체감에서 시작해 리페인트 횟수 같은 측정값으로 원인을 찾음. transform, opacity 애니메이션은 컴포지터 스레드에서 처리돼 JS 스레드를 비움 (테크톡톡 2026 토스증권)
- 토스 포스는 웹뷰 번들을 CDN에서 받아 로컬에서 띄우고, 영업시간 동안 하루 수십만 건 결제를 처리함 (SLASH 24 토스플레이스)

## 포스가 일반 웹과 다른 점 [이 레포의 판단]

| 조건         | 일반 웹         | 포스                         | 그래서 재는 것                              |
| ------------ | --------------- | ---------------------------- | ------------------------------------------- |
| 번들 위치    | 네트워크로 받음 | 로컬 파일                    | 네트워크보다 파싱, 실행 비용                |
| 기기         | 다양함          | 개발 PC보다 느린 단말기      | CPU 스로틀링 4배, 6배                       |
| 켜 두는 시간 | 몇 분           | 영업시간 내내                | 결제를 수백 건 반복한 뒤 GC 후 힙, DOM 노드 |
| 입력         | 스크롤, 클릭    | 손님 앞에서 메뉴와 결제 버튼 | 클릭부터 바뀐 화면이 그려질 때까지          |

## 측정 방식 [이 레포의 판단]

- 셸 빌드 결과를 Electron으로 띄우고 Chrome DevTools Protocol로 조작함. 패키징한 앱과 같은 file:// 경로를 탐
- CPU 스로틀링은 `Emulation.setCPUThrottlingRate`. Lighthouse 모바일 기본값이 4배라 4배와 6배를 봄 [추정: 실제 단말기와의 비율은 기기로 확인해야 함]
- 입력 반응은 클릭의 `event.timeStamp`부터 다음 프레임 뒤까지. Event Timing API는 16ms 미만을 기록하지 않아 이 앱처럼 빠른 화면에서는 값이 비어서 직접 잼
- 메모리는 `HeapProfiler.collectGarbage` 뒤 `JSHeapUsedSize`. 늘어난 게 무엇인지는 힙 스냅샷 두 장을 떠서 이름별 개수와 크기를 비교함
- 측정 창은 투명하게 띄우고 포커스를 가져가지 않음. 가려진 창은 Chromium이 렌더링과 requestAnimationFrame을 멈추므로 측정 중에만 백그라운드 처리를 끔

## 출처

- SLASH 24, 토스가 오프라인 결제를 빠르고 안정적으로 혁신하는 방법 https://www.youtube.com/watch?v=wMKmr6AwEjk
- TMC25, 더 나은 UX를 위한 프론트엔드 전략 https://www.youtube.com/watch?v=Q-_crvz4tv8
- 테크톡톡 2026, 토스증권 AI 개발로 배운 실전 인터랙션 팁 https://www.youtube.com/watch?v=G7yn-oqYcUA
- Chrome DevTools Protocol Emulation.setCPUThrottlingRate https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setCPUThrottlingRate
- Event Timing API durationThreshold https://www.w3.org/TR/event-timing/
