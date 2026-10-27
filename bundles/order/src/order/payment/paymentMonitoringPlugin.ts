import { monitor, type Monitor } from '@toss-place/monitoring';
import { definePaymentPlugin } from '@toss-place/payment-sdk';
import type { CardPaymentFailureReason } from '@toss-place/pos-bridge';

/**
 * 결제 상태 변화를 모니터링으로 보냄.
 * - 모든 전이: breadcrumb. 다른 에러가 났을 때 직전 결제 흐름을 같이 볼 수 있게 함
 * - unknown으로 끝난 결제: warning 이벤트. 돈이 나갔는지 사람이 확인해야 하는 사건이라 알림 대상으로 봄
 *
 * 카드 정보는 SDK까지 오지 않고, 주문 ID와 금액, 멱등 키만 담음. 멱등 키가 있어야 단말기 내역과 맞춰볼 수 있음.
 */
export function createPaymentMonitoringPlugin(target: Monitor = monitor) {
  return definePaymentPlugin<CardPaymentFailureReason>({
    name: 'monitoring',
    onStateChange({ orderId, previous, next }) {
      target.addBreadcrumb('payment', `${previous.status} -> ${next.status}`, { orderId });

      if (next.status === 'unknown') {
        target.captureMessage('결제 결과를 확인하지 못함', {
          level: 'warning',
          tags: { 'payment.reason': next.reason },
          extra: {
            orderId,
            amount: next.attempt.amount,
            idempotencyKey: next.attempt.idempotencyKey,
            startedAt: next.attempt.startedAt,
          },
          // 주문마다 이슈가 따로 생기지 않게 사유 단위로 묶음
          fingerprint: ['payment-unknown', next.reason],
        });
      }
    },
  });
}
