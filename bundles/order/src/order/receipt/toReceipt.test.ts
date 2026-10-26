import { describe, expect, it } from 'vitest';

import { toReceipt } from './toReceipt';

describe('toReceipt', () => {
  it('장바구니 항목을 영수증 줄로 바꾸고 줄마다 수량을 곱한 금액을 넣음', () => {
    const receipt = toReceipt(
      'order-1',
      [{ menu: { id: 'latte', name: '카페라떼', price: 5000 }, quantity: 2 }],
      10000,
    );

    expect(receipt).toEqual({
      orderId: 'order-1',
      lines: [{ name: '카페라떼', quantity: 2, amount: 10000 }],
      totalAmount: 10000,
    });
  });
});
