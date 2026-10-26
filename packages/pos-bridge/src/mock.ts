import type { CardPaymentApproval, PosBridge } from './types';

/**
 * 브라우저에서 번들만 띄워 개발할 때 쓰는 가짜 기기임.
 * 같은 멱등 키로 결제를 다시 요청하면 처음 승인 결과를 그대로 돌려줌.
 */
export function createMockPosBridge(): PosBridge {
  const approvals = new Map<string, CardPaymentApproval>();

  return {
    printReceipt() {
      return Promise.resolve({ ok: true, value: undefined });
    },
    openCashDrawer() {
      return Promise.resolve({ ok: true, value: undefined });
    },
    requestCardPayment({ idempotencyKey, amount }) {
      const approved = approvals.get(idempotencyKey);
      if (approved !== undefined) {
        return Promise.resolve({ ok: true, value: approved });
      }

      const approval: CardPaymentApproval = {
        approvalNumber: String(approvals.size + 1).padStart(8, '0'),
        approvedAt: new Date().toISOString(),
        amount,
      };
      approvals.set(idempotencyKey, approval);
      return Promise.resolve({ ok: true, value: approval });
    },
  };
}
