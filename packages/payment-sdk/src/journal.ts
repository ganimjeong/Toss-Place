import type { PaymentAttempt } from './types';

/**
 * 결과를 모르는 결제 시도를 기록해두는 곳.
 * 단말기에 요청을 보내기 전에 먼저 쓰고(write-ahead), 결과가 확정되면 지움.
 * 결제 도중 화면이 닫혀도 다음 실행 때 여기 남은 시도를 조회해서 이중 결제를 막음.
 *
 * 지금 구현은 localStorage라 동기지만, IndexedDB나 셸 프로세스 저장소로 옮길 수 있게 비동기로 둠.
 */
export interface PaymentJournal {
  save(attempt: PaymentAttempt): Promise<void>;
  get(orderId: string): Promise<PaymentAttempt | undefined>;
  remove(orderId: string): Promise<void>;
  list(): Promise<PaymentAttempt[]>;
}

export function createMemoryJournal(): PaymentJournal {
  const attempts = new Map<string, PaymentAttempt>();

  return {
    save(attempt) {
      attempts.set(attempt.orderId, attempt);
      return Promise.resolve();
    },
    get(orderId) {
      return Promise.resolve(attempts.get(orderId));
    },
    remove(orderId) {
      attempts.delete(orderId);
      return Promise.resolve();
    },
    list() {
      return Promise.resolve([...attempts.values()]);
    },
  };
}

type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Web Storage에 저널을 둠. 시도 전체를 키 하나에 JSON으로 저장함.
 * 저장소 쓰기가 실패하면(용량 초과 등) save가 reject되고, 클라이언트는 결제 요청을 보내지 않음.
 */
export function createStorageJournal(storage: KeyValueStorage, key: string): PaymentJournal {
  const read = (): Map<string, PaymentAttempt> => {
    const attempts = new Map<string, PaymentAttempt>();
    for (const value of parseArray(storage.getItem(key))) {
      // 다른 버전이 쓴 값이나 깨진 값은 조회할 수 없으므로 건너뜀
      if (isPaymentAttempt(value)) {
        attempts.set(value.orderId, value);
      }
    }
    return attempts;
  };

  const write = (attempts: Map<string, PaymentAttempt>) => {
    storage.setItem(key, JSON.stringify([...attempts.values()]));
  };

  return {
    save(attempt) {
      return run(() => write(read().set(attempt.orderId, attempt)));
    },
    get(orderId) {
      return run(() => read().get(orderId));
    },
    remove(orderId) {
      return run(() => {
        const attempts = read();
        attempts.delete(orderId);
        write(attempts);
      });
    },
    list() {
      return run(() => [...read().values()]);
    },
  };
}

/** 동기 예외도 reject로 바꿔서 호출하는 쪽이 한 가지 방식으로만 처리하게 함 */
function run<T>(task: () => T): Promise<T> {
  try {
    return Promise.resolve(task());
  } catch (error) {
    return Promise.reject(error instanceof Error ? error : new Error(String(error)));
  }
}

function parseArray(raw: string | null): unknown[] {
  if (raw === null) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isPaymentAttempt(value: unknown): value is PaymentAttempt {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    'orderId' in value &&
    typeof value.orderId === 'string' &&
    'idempotencyKey' in value &&
    typeof value.idempotencyKey === 'string' &&
    'amount' in value &&
    Number.isSafeInteger(value.amount) &&
    'startedAt' in value &&
    typeof value.startedAt === 'string'
  );
}
