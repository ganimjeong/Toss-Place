import { delay } from 'es-toolkit';

import type { Menu } from '../models';

// 서버 붙기 전까지 쓰는 고정 데이터임
const MENUS: Menu[] = [
  { id: 'americano', name: '아메리카노', price: 4500 },
  { id: 'latte', name: '카페라떼', price: 5000 },
  { id: 'vanilla-latte', name: '바닐라라떼', price: 5500 },
  { id: 'cold-brew', name: '콜드브루', price: 5000 },
  { id: 'croissant', name: '크루아상', price: 4000 },
  { id: 'cheesecake', name: '치즈케이크', price: 6500 },
];

const FAKE_NETWORK_DELAY_MS = 300;

export async function fetchMenus(): Promise<Menu[]> {
  await delay(FAKE_NETWORK_DELAY_MS);
  return MENUS;
}
