/** 실패도 정상 흐름이므로 예외 대신 결과 객체로 돌려줌 */
export type Result<T, Reason extends string> =
  { ok: true; value: T } | { ok: false; reason: Reason };

export interface PaymentRequest {
  orderId: string;
  /** 원 단위 정수 */
  amount: number;
}

export interface PaymentApproval {
  approvalNumber: string;
  approvedAt: string;
  amount: number;
}

/** 단말기나 PG에 보낸 결제 시도 하나. 결과를 모르는 동안 저널에 남아 있음 */
export interface PaymentAttempt extends PaymentRequest {
  idempotencyKey: string;
  startedAt: string;
}

/**
 * 멱등 키로 승인 내역을 조회한 결과.
 * 응답이 없던 결제는 아직 처리 중일 수 있어서 '없음'과 '처리 중'을 구분함.
 */
export type PaymentLookup =
  | { status: 'approved'; approval: PaymentApproval }
  | { status: 'not-found' }
  | { status: 'processing' };

/**
 * 결제 수단과의 통신을 맡는 쪽. 단말기 IPC든 PG HTTP API든 이 모양만 맞추면 됨.
 * 같은 멱등 키로 approve를 다시 부르면 새 결제를 만들지 않아야 함.
 */
export interface PaymentTransport<Reason extends string> {
  approve(attempt: PaymentAttempt): Promise<Result<PaymentApproval, Reason>>;
  lookup(idempotencyKey: string): Promise<Result<PaymentLookup, Reason>>;
}

/**
 * SDK가 직접 만드는 실패 사유.
 * - TRANSPORT_ERROR: transport가 결과 객체 대신 예외를 던짐 (IPC 끊김 등)
 * - INTERRUPTED: 결과를 받기 전에 화면이 닫혀서 다음 실행 때 저널로 발견함
 */
export type SdkFailureReason = 'TRANSPORT_ERROR' | 'INTERRUPTED';

export type PaymentFailureReason<Reason extends string> = Reason | SdkFailureReason;

/**
 * pay와 recover가 돌려주는 최종 결과.
 * unknown은 실패가 아님. 돈이 나갔는지 모르는 상태라 같은 주문으로 새 결제를 만들지 않음.
 */
export type PaymentOutcome<Reason extends string> =
  | { status: 'approved'; attempt: PaymentAttempt; approval: PaymentApproval }
  | { status: 'failed'; attempt: PaymentAttempt; reason: PaymentFailureReason<Reason> }
  | { status: 'unknown'; attempt: PaymentAttempt; reason: PaymentFailureReason<Reason> };
