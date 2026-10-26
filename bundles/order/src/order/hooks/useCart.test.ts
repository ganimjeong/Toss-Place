import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCart } from './useCart';

const americano = { id: 'americano', name: '아메리카노', price: 4500 };
const latte = { id: 'latte', name: '카페라떼', price: 5000 };

describe('useCart', () => {
  it('같은 메뉴를 다시 담으면 수량이 늘어난다', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.add(americano);
      result.current.add(americano);
    });

    expect(result.current.items).toEqual([{ menu: americano, quantity: 2 }]);
    expect(result.current.totalAmount).toBe(9000);
  });

  it('수량이 0이 되면 장바구니에서 빠진다', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.add(americano);
      result.current.add(latte);
      result.current.remove(americano.id);
    });

    expect(result.current.items).toEqual([{ menu: latte, quantity: 1 }]);
  });
});
