import type { PaymentState } from './state';

export interface PaymentStateChange<Reason extends string> {
  orderId: string;
  previous: PaymentState<Reason>;
  next: PaymentState<Reason>;
}

/**
 * 결제 흐름을 바꾸지 않고 지켜보는 확장 지점. 로깅, 에러 리포팅, 지표 수집에 씀.
 * 플러그인이 던진 예외는 결제 결과에 영향을 주지 않음.
 */
export interface PaymentPlugin<Reason extends string> {
  name: string;
  onStateChange?(change: PaymentStateChange<Reason>): void | Promise<void>;
}

/** 타입 추론용. Reason을 직접 적지 않아도 클라이언트에 넣을 때 맞춰짐 */
export function definePaymentPlugin<Reason extends string = string>(
  plugin: PaymentPlugin<Reason>,
): PaymentPlugin<Reason> {
  return plugin;
}
