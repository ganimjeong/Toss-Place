import { describe, expect, it } from 'vitest';

import { createMockPosBridge } from './mock';

describe('createMockPosBridge', () => {
  it('같은 멱등 키로 다시 결제하면 처음 승인 결과를 돌려준다', async () => {
    const bridge = createMockPosBridge();
    const request = { idempotencyKey: 'order-1-try', orderId: 'order-1', amount: 12000 };

    const first = await bridge.requestCardPayment(request);
    const second = await bridge.requestCardPayment(request);

    expect(first).toEqual(second);
  });

  it('승인한 결제는 멱등 키로 조회할 수 있다', async () => {
    const bridge = createMockPosBridge();
    const approved = await bridge.requestCardPayment({
      idempotencyKey: 'a',
      orderId: 'o',
      amount: 1000,
    });

    expect(await bridge.getCardPayment('a')).toEqual({
      ok: true,
      value: { status: 'approved', approval: approved.ok && approved.value },
    });
    expect(await bridge.getCardPayment('b')).toEqual({ ok: true, value: { status: 'not-found' } });
  });

  it('멱등 키가 다르면 새 승인 번호를 만든다', async () => {
    const bridge = createMockPosBridge();

    const first = await bridge.requestCardPayment({
      idempotencyKey: 'a',
      orderId: 'o',
      amount: 1000,
    });
    const second = await bridge.requestCardPayment({
      idempotencyKey: 'b',
      orderId: 'o',
      amount: 1000,
    });

    expect(
      first.ok && second.ok && first.value.approvalNumber !== second.value.approvalNumber,
    ).toBe(true);
  });
});
