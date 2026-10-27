import { describe, expect, it } from 'vitest';

import { createStorageJournal } from './journal';

function createFakeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

const attempt = {
  orderId: 'order-1',
  amount: 4500,
  idempotencyKey: 'key-1',
  startedAt: '2026-10-27T00:00:00.000Z',
};

describe('createStorageJournal', () => {
  it('다시 만들어도 저장한 시도를 읽어옴', async () => {
    const storage = createFakeStorage();
    await createStorageJournal(storage, 'journal').save(attempt);

    expect(await createStorageJournal(storage, 'journal').get('order-1')).toEqual(attempt);
  });

  it('깨진 값과 모양이 다른 값은 건너뜀', async () => {
    const storage = createFakeStorage({
      journal: JSON.stringify([attempt, { orderId: 'order-2', amount: 0.5 }, 'broken']),
    });

    expect(await createStorageJournal(storage, 'journal').list()).toEqual([attempt]);
  });

  it('JSON이 아니면 빈 저널로 봄', async () => {
    const storage = createFakeStorage({ journal: '{' });

    expect(await createStorageJournal(storage, 'journal').list()).toEqual([]);
  });

  it('저장소 쓰기가 실패하면 reject됨', async () => {
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };

    await expect(createStorageJournal(storage, 'journal').save(attempt)).rejects.toThrow(
      'QuotaExceededError',
    );
  });
});
