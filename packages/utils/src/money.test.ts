import { describe, expect, it } from 'vitest';

import { formatWon, splitWon, sumWon } from './money';

describe('sumWon', () => {
  it('금액을 모두 더한다', () => {
    expect(sumWon([4500, 5000, 500])).toBe(10000);
  });

  it('정수가 아닌 금액이 섞이면 에러를 던진다', () => {
    expect(() => sumWon([1000, 0.5])).toThrow(RangeError);
  });
});

describe('splitWon', () => {
  it('나누어 떨어지면 똑같이 나눈다', () => {
    expect(splitWon(30000, 3)).toEqual([10000, 10000, 10000]);
  });

  it('나머지는 앞사람부터 1원씩 더 낸다', () => {
    expect(splitWon(10000, 3)).toEqual([3334, 3333, 3333]);
  });

  it('나눈 금액의 합은 항상 원래 금액과 같다', () => {
    expect(sumWon(splitWon(12345, 7))).toBe(12345);
  });

  it('인원이 1보다 작으면 에러를 던진다', () => {
    expect(() => splitWon(10000, 0)).toThrow(RangeError);
  });
});

describe('formatWon', () => {
  it('천 단위 구분 기호와 원을 붙인다', () => {
    expect(formatWon(1234500)).toBe('1,234,500원');
  });
});
