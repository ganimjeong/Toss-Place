# @ganimjeong/payment-sdk

POS 결제에서 돈이 두 번 나가거나, 나갔는데 모르는 상황을 막는 SDK.
단말기, PG 같은 결제 수단은 모르고 `PaymentTransport` 모양만 알아서 Electron IPC, HTTP API 어디에나 붙일 수 있음.

## 설치

```sh
npm install @ganimjeong/payment-sdk
```

ESM, CJS 모두 지원하고 타입 선언이 들어 있음. 런타임 의존성은 없음.

## 막는 것

| 상황                          | 처리                                                                      |
| ----------------------------- | ------------------------------------------------------------------------- |
| 결제 버튼 연타                | 주문별 single-flight. 진행 중인 결제가 있으면 같은 Promise를 돌려줌       |
| 단말기 응답 없음 (TIMEOUT 등) | 결제 요청은 다시 보내지 않고, 같은 멱등 키로 승인 내역을 조회해서 확정함  |
| 손님이 아직 카드를 대는 중    | 조회 결과가 `processing`이면 지수 백오프로 다시 조회함                    |
| 조회도 실패                   | `unknown`으로 남기고 같은 주문의 새 결제를 막음. 다음 시도 때 먼저 조회함 |
| 결제 중 화면 이동, 앱 종료    | 요청 전에 저널에 기록하고, 다음 실행 때 `recover()`로 남은 시도를 조회함  |

## 사용법

```ts
import { createPaymentClient, createStorageJournal } from '@ganimjeong/payment-sdk';

const client = createPaymentClient({
  transport: {
    approve: attempt => terminal.approve(attempt), // attempt.idempotencyKey를 그대로 넘김
    lookup: idempotencyKey => terminal.lookup(idempotencyKey),
  },
  // 응답을 못 받아서 결제 여부를 모르는 사유
  isAmbiguous: reason => reason === 'TIMEOUT' || reason === 'DISCONNECTED',
  journal: createStorageJournal(localStorage, 'payment-journal'),
});

// 앱 시작 시
const recovered = await client.recover();

const outcome = await client.pay({ orderId, amount: 4500 });
switch (outcome.status) {
  case 'approved': // 승인
  case 'failed': // 결제되지 않음이 확실함. 다시 결제해도 됨
  case 'unknown': // 돈이 나갔는지 모름. 새 결제를 권하지 않음
}
```

`transport`는 실패를 예외가 아니라 `{ ok: false, reason }`으로 돌려줘야 함. 예외를 던지면 요청이 단말기까지 갔는지 모르는 것으로 보고 조회함.

## 플러그인

결제 흐름을 바꾸지 않고 상태 변화만 지켜봄. 플러그인이 던진 예외는 결제 결과에 영향을 주지 않음.

```ts
const unregister = client.use(
  definePaymentPlugin({
    name: 'logger',
    onStateChange: ({ orderId, previous, next }) => {
      console.info(orderId, previous.status, '->', next.status);
    },
  }),
);
```

## 상태 전이

```
idle ──REQUEST──▶ requesting ──APPROVE──▶ approved
                     │  └──────FAIL─────▶ failed
                     └LOSE▶ reconciling ─APPROVE/FAIL─▶ approved / failed
                              ▲    └──GIVE_UP──▶ unknown
                              └────RECONCILE───────┘
```

`unknown`에서는 `REQUEST`를 받지 않음. 허용 전이는 `TRANSITIONS`에 표로 있음.
