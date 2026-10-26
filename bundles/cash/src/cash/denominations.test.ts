import { describe, expect, it } from 'vitest';

import { createEmptyCashCount, sumCashCount } from './denominations';

describe('sumCashCount', () => {
  it('권종별 장수를 곱해서 모두 더함', () => {
    const count = { ...createEmptyCashCount(), 50000: 2, 1000: 3, 100: 5 };

    expect(sumCashCount(count)).toBe(103500);
  });

  it('아무것도 세지 않으면 0원', () => {
    expect(sumCashCount(createEmptyCashCount())).toBe(0);
  });
});
