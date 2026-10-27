/**
 * 웹뷰 번들이 POS 기기 기능을 쓰기 위한 표준 인터페이스임.
 * 번들은 이 인터페이스만 알고 Electron이나 Android 같은 실행 환경은 모름.
 */

/** 실패도 정상 흐름이므로 예외 대신 결과 객체로 돌려줌 */
export type BridgeResult<T, Reason extends string> =
  { ok: true; value: T } | { ok: false; reason: Reason };

export type DeviceErrorReason = 'DISCONNECTED' | 'TIMEOUT';

export interface ReceiptLine {
  name: string;
  quantity: number;
  amount: number;
}

export interface Receipt {
  orderId: string;
  lines: readonly ReceiptLine[];
  totalAmount: number;
}

export interface CardPaymentRequest {
  /** 같은 키로 다시 요청하면 새 결제를 만들지 않고 처음 결과를 돌려줌 */
  idempotencyKey: string;
  orderId: string;
  amount: number;
}

export interface CardPaymentApproval {
  approvalNumber: string;
  approvedAt: string;
  amount: number;
}

/**
 * 멱등 키로 조회한 단말기 승인 내역.
 * 응답을 못 받은 결제는 손님이 아직 카드를 대는 중일 수 있어서 processing을 따로 둠
 */
export type CardPaymentLookup =
  | { status: 'approved'; approval: CardPaymentApproval }
  | { status: 'not-found' }
  | { status: 'processing' };

export type ReceiptPrintFailureReason = DeviceErrorReason | 'PAPER_EMPTY';
export type ReceiptPrintResult = BridgeResult<void, ReceiptPrintFailureReason>;

export type CardPaymentFailureReason = DeviceErrorReason | 'DECLINED' | 'CANCELED';
export type CardPaymentResult = BridgeResult<CardPaymentApproval, CardPaymentFailureReason>;

export interface PosBridge {
  printReceipt(receipt: Receipt): Promise<ReceiptPrintResult>;
  openCashDrawer(): Promise<BridgeResult<void, DeviceErrorReason>>;
  requestCardPayment(request: CardPaymentRequest): Promise<CardPaymentResult>;
  getCardPayment(
    idempotencyKey: string,
  ): Promise<BridgeResult<CardPaymentLookup, DeviceErrorReason>>;
}
