import { createPaymentClient, createStorageJournal } from '@ajinjeong/payment-sdk';
import { getPosBridge, type CardPaymentFailureReason } from '@toss-place/pos-bridge';

import { createPaymentMonitoringPlugin } from './paymentMonitoringPlugin';

/** 단말기 응답을 받지 못해서 실제로 승인됐는지 알 수 없는 사유 */
const AMBIGUOUS_REASONS = new Set<CardPaymentFailureReason>(['TIMEOUT', 'DISCONNECTED']);

/**
 * 주문 번들의 결제 클라이언트.
 * 브릿지는 테스트에서 바꿔 끼울 수 있게 호출할 때마다 가져옴.
 * 저널은 localStorage에 둬서 결제 중에 화면을 바꾸거나 앱이 꺼져도 남게 함.
 */
export const paymentClient = createPaymentClient({
  transport: {
    approve: attempt => getPosBridge().requestCardPayment(attempt),
    lookup: idempotencyKey => getPosBridge().getCardPayment(idempotencyKey),
  },
  isAmbiguous: reason => AMBIGUOUS_REASONS.has(reason),
  journal: createStorageJournal(window.localStorage, 'toss-place:order:payment-journal'),
  plugins: [createPaymentMonitoringPlugin()],
});
