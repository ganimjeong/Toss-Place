import { describe, expect, it } from 'vitest';

import { InvalidTransitionError, transition, type PaymentState } from './state';
import type { PaymentAttempt } from './types';

const attempt: PaymentAttempt = {
  orderId: 'order-1',
  amount: 4500,
  idempotencyKey: 'key-1',
  startedAt: '2026-10-27T00:00:00.000Z',
};
const approval = {
  approvalNumber: '00000001',
  approvedAt: '2026-10-27T00:00:01.000Z',
  amount: 4500,
};

describe('transition', () => {
  it('응답을 못 받은 결제는 조회 상태를 거쳐서만 승인으로 확정됨', () => {
    const requesting = transition({ status: 'idle' }, { type: 'REQUEST', attempt });
    const reconciling = transition(requesting, { type: 'LOSE' });
    const approved = transition(reconciling, { type: 'APPROVE', approval });

    expect(approved).toEqual({ status: 'approved', attempt, approval });
  });

  it('결과를 모르는 상태에서는 새 결제를 요청할 수 없음', () => {
    const unknown: PaymentState<'TIMEOUT'> = { status: 'unknown', attempt, reason: 'TIMEOUT' };

    expect(() => transition(unknown, { type: 'REQUEST', attempt })).toThrow(InvalidTransitionError);
  });

  it('결제 중에는 다른 결제를 시작할 수 없음', () => {
    const requesting = transition({ status: 'idle' }, { type: 'REQUEST', attempt });

    expect(() => transition(requesting, { type: 'REQUEST', attempt })).toThrow(
      InvalidTransitionError,
    );
  });

  it('승인이나 확정 실패 뒤에는 다시 결제할 수 있음', () => {
    const failed: PaymentState<'DECLINED'> = { status: 'failed', attempt, reason: 'DECLINED' };

    expect(transition(failed, { type: 'REQUEST', attempt }).status).toBe('requesting');
  });
});
