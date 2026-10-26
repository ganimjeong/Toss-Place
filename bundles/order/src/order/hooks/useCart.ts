import { sumWon } from '@toss-place/utils';
import { useState } from 'react';

import type { CartItem, Menu } from '../models';

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (menu: Menu) => {
    setItems(prev => {
      const exists = prev.some(item => item.menu.id === menu.id);
      if (!exists) {
        return [...prev, { menu, quantity: 1 }];
      }
      return prev.map(item =>
        item.menu.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item,
      );
    });
  };

  const remove = (menuId: string) => {
    setItems(prev =>
      prev
        .map(item => (item.menu.id === menuId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter(item => item.quantity > 0),
    );
  };

  const clear = () => setItems([]);

  const totalAmount = sumWon(items.map(item => item.menu.price * item.quantity));

  return { items, totalAmount, add, remove, clear };
}
