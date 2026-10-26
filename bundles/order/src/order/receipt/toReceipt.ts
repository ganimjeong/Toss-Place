import type { Receipt } from '@toss-place/pos-bridge';

import type { CartItem } from '../models';

export function toReceipt(
  orderId: string,
  items: readonly CartItem[],
  totalAmount: number,
): Receipt {
  return {
    orderId,
    lines: items.map(({ menu, quantity }) => ({
      name: menu.name,
      quantity,
      amount: menu.price * quantity,
    })),
    totalAmount,
  };
}
