import type { PaymentApproval, PaymentAttempt, PaymentFailureReason } from './types';

/**
 * 주문 하나의 결제 상태.
 * reconciling은 결과를 모르는 결제를 멱등 키로 조회하는 중인 상태임.
 */
export type PaymentState<Reason extends string> =
  | { status: 'idle' }
  | { status: 'requesting'; attempt: PaymentAttempt }
  | { status: 'reconciling'; attempt: PaymentAttempt }
  | { status: 'approved'; attempt: PaymentAttempt; approval: PaymentApproval }
  | { status: 'failed'; attempt: PaymentAttempt; reason: PaymentFailureReason<Reason> }
  | { status: 'unknown'; attempt: PaymentAttempt; reason: PaymentFailureReason<Reason> };

export type PaymentEvent<Reason extends string> =
  | { type: 'REQUEST'; attempt: PaymentAttempt }
  | { type: 'RECONCILE'; attempt: PaymentAttempt }
  | { type: 'APPROVE'; approval: PaymentApproval }
  /** 결제되지 않았음이 확실한 실패 */
  | { type: 'FAIL'; reason: PaymentFailureReason<Reason> }
  /** 응답을 받지 못해 결제 여부를 모름 */
  | { type: 'LOSE' }
  /** 조회를 여러 번 했는데도 결과를 확인하지 못함 */
  | { type: 'GIVE_UP'; reason: PaymentFailureReason<Reason> };

type PaymentStatus = PaymentState<string>['status'];
type PaymentEventType = PaymentEvent<string>['type'];

/**
 * 상태별로 받을 수 있는 이벤트.
 * unknown에서 REQUEST를 받지 않는 게 핵심임. 결과를 모르는 결제가 있으면 먼저 조회해야 함.
 */
export const TRANSITIONS = {
  idle: ['REQUEST', 'RECONCILE'],
  requesting: ['APPROVE', 'FAIL', 'LOSE'],
  reconciling: ['APPROVE', 'FAIL', 'GIVE_UP'],
  approved: ['REQUEST'],
  failed: ['REQUEST'],
  unknown: ['RECONCILE'],
} as const satisfies Record<PaymentStatus, readonly PaymentEventType[]>;

export class InvalidTransitionError extends Error {
  constructor(status: PaymentStatus, eventType: PaymentEventType) {
    super(`${status} 상태에서는 ${eventType} 이벤트를 받을 수 없습니다.`);
    this.name = 'InvalidTransitionError';
  }
}

function canTransition(status: PaymentStatus, eventType: PaymentEventType) {
  const allowed: readonly PaymentEventType[] = TRANSITIONS[status];
  return allowed.includes(eventType);
}

export function transition<Reason extends string>(
  state: PaymentState<Reason>,
  event: PaymentEvent<Reason>,
): PaymentState<Reason> {
  if (!canTransition(state.status, event.type)) {
    throw new InvalidTransitionError(state.status, event.type);
  }

  if (event.type === 'REQUEST') {
    return { status: 'requesting', attempt: event.attempt };
  }
  if (event.type === 'RECONCILE') {
    return { status: 'reconciling', attempt: event.attempt };
  }

  // 나머지 이벤트는 TRANSITIONS상 진행 중인 시도가 있는 상태에서만 들어옴
  if (state.status === 'idle') {
    throw new InvalidTransitionError(state.status, event.type);
  }
  const { attempt } = state;

  switch (event.type) {
    case 'APPROVE':
      return { status: 'approved', attempt, approval: event.approval };
    case 'FAIL':
      return { status: 'failed', attempt, reason: event.reason };
    case 'LOSE':
      return { status: 'reconciling', attempt };
    case 'GIVE_UP':
      return { status: 'unknown', attempt, reason: event.reason };
  }
}
