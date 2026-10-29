import type { CardPaymentApproval, PosBridge } from '@toss-place/pos-bridge';

/**
 * 손님이 카드를 꽂고 승인이 나기까지 걸리는 시간을 흉내 냄.
 * 결제 수백 건을 반복하는 성능 측정(scripts/measure.ts)에서만 환경 변수로 줄임
 */
const CARD_APPROVAL_DELAY_MS = Number(process.env.POS_STUB_CARD_DELAY_MS ?? 3000);

/**
 * 실제 프린터, 금전함, 결제 단말기 연동 전까지 쓰는 임시 구현임.
 * 기기 드라이버가 붙으면 이 파일만 교체하면 됨.
 *
 * 결제는 메인 프로세스에서 처리되므로 웹뷰가 다시 그려져도 승인은 그대로 남음.
 * 결제 중에 다른 번들로 바꿨다 돌아와도 멱등 키로 결과를 조회할 수 있음.
 */
export function createDeviceStub(): PosBridge {
  const approvals = new Map<string, CardPaymentApproval>();
  const processing = new Map<string, Promise<CardPaymentApproval>>();

  const approve = async (idempotencyKey: string, amount: number) => {
    await new Promise(resolve => setTimeout(resolve, CARD_APPROVAL_DELAY_MS));
    const approval: CardPaymentApproval = {
      approvalNumber: String(approvals.size + 1).padStart(8, '0'),
      approvedAt: new Date().toISOString(),
      amount,
    };
    approvals.set(idempotencyKey, approval);
    processing.delete(idempotencyKey);
    return approval;
  };

  return {
    printReceipt() {
      return Promise.resolve({ ok: true, value: undefined });
    },
    openCashDrawer() {
      return Promise.resolve({ ok: true, value: undefined });
    },
    async requestCardPayment({ idempotencyKey, amount }) {
      const approved = approvals.get(idempotencyKey);
      if (approved !== undefined) {
        return { ok: true, value: approved };
      }
      // 같은 키로 처리 중인 요청이 있으면 새로 승인하지 않고 같은 결과를 기다림
      const pending = processing.get(idempotencyKey) ?? approve(idempotencyKey, amount);
      processing.set(idempotencyKey, pending);
      return { ok: true, value: await pending };
    },
    getCardPayment(idempotencyKey) {
      const approval = approvals.get(idempotencyKey);
      if (approval !== undefined) {
        return Promise.resolve({ ok: true, value: { status: 'approved', approval } });
      }
      const status = processing.has(idempotencyKey) ? 'processing' : 'not-found';
      return Promise.resolve({ ok: true, value: { status } });
    },
  };
}
