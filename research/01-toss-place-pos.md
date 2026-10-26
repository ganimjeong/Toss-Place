# 토스플레이스 POS

## 제품

- 오프라인 매장 운영용 POS. 주문, 결제, 고객 예약 관리, 포인트와 스탬프와 쿠폰 기반 CRM, 결제 단말기와 영수증 프린터 통신까지 다룸 [공개]
- 같은 챕터가 키오스크, 테이블오더, 픽업오더, B2B 플러그인 SDK와 개발자센터, 토스플레이스 파트너스, 플레이스원, 프랜차이즈 대시보드도 만듦 [공개]
- POS는 Windows로 먼저 나왔고 이후 Android, iOS, macOS로 확장됨 [공개]

## 프론트엔드 구조

- 웹 기술로 단일 소스코드를 만들어 Windows, macOS, Android, iOS를 모두 지원함 [공개]
- 웹 브라우저를 넘어 Electron 기반 네이티브 앱까지 다룸 [공개]
- 앱을 네이티브 영역과 웹뷰 영역으로 나누고 웹뷰 영역만 업데이트함 [공개]
- 성격이 비슷한 서비스끼리 묶은 단위를 웹뷰 번들이라고 부름. 결제, 시재관리, 주문 등을 번들로 나누고 각 사일로가 독립적으로 운영함. 한 번들의 업데이트가 다른 번들에 영향을 주지 않음 [공개]
- 전체 앱 재설치 방식은 100MB 이상, 약 20분이 걸렸는데 웹뷰 번들 방식은 약 5MB, 1분 내외로 줄어서 하루에 수십 번 배포할 수 있게 됨 [공개]
- POS 기능을 API로 표준화해서 새 OS 구현이 쉬워짐. iPad POS 요청 후 Android, iOS POS 출시까지 약 한 달 걸림 [공개]
- Platform 포지션 업무로 POS 환경에 맞춘 마이크로 프론트엔드 설계, 매장 내 여러 기기를 하나처럼 묶는 Mesh 네트워크, 배포 파이프라인, 모니터링과 옵저빌리티, 코드베이스 관리 전략이 나옴 [공개]

## 공개되지 않은 부분

- 웹뷰와 네이티브 사이 통신 방식
- 오프라인(네트워크 끊김) 동작 방식
- 결제 단말기, 프린터 연동 방식
- 번들 버전 관리와 롤백 방식

## 이 레포에 반영한 것

- `apps/shell`: Electron 셸. 네이티브 영역 역할
- `bundles/*`: 도메인별 웹뷰 번들. 지금은 `order`만 있음
- `packages/pos-bridge`: 표준화된 POS API. 번들은 이 인터페이스만 알고 셸이 구현을 주입함. 브라우저에서는 mock이 주입됨 [추정]
- 기기 호출 실패를 예외 대신 결과 객체로 돌려주고, 결제 요청에는 멱등 키를 붙임 [추정]

## 출처

- 토스플레이스 Frontend Developer 공고 (원티드) https://www.wanted.co.kr/wd/207573
- 토스플레이스 Frontend Developer 공고 (비즈니스피플) https://www.bzpp.co.kr/biz/businessDetailView/BR250627A00450
- Frontend Developer (Platform) 공고 https://toss.im/career/job-detail?job_id=7646930003
- 토스플레이스, 하루에 수십번 포스 업데이트가 가능한 이유 (바이라인네트워크, 토스 SLASH 24 발표 기사) https://byline.network/2024/09/12-329/
- 토스플레이스, 전 운영체계에서 사용할 수 있는 포스 공개 (토스피드) https://toss.im/tossfeed/article/tossplace-all-OS
- 이젠 휴대폰에서도 토스 포스를 이용할 수 있어요 https://tossplace.com/story/tosspos_mobile_available
