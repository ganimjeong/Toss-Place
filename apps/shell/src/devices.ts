import type { PosBridge } from '@toss-place/pos-bridge';

/**
 * 실제 프린터, 금전함, 결제 단말기 연동 전까지 쓰는 임시 구현임.
 * 기기 드라이버가 붙으면 이 파일만 교체하면 됨.
 */
export function createDeviceStub(): PosBridge {
  let approvalCount = 0;

  return {
    printReceipt() {
      return Promise.resolve({ ok: true, value: undefined });
    },
    openCashDrawer() {
      return Promise.resolve({ ok: true, value: undefined });
    },
    requestCardPayment({ amount }) {
      approvalCount += 1;
      return Promise.resolve({
        ok: true,
        value: {
          approvalNumber: String(approvalCount).padStart(8, '0'),
          approvedAt: new Date().toISOString(),
          amount,
        },
      });
    },
  };
}
