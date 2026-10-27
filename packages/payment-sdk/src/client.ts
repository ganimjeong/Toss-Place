import { createMemoryJournal, type PaymentJournal } from './journal';
import type { PaymentPlugin } from './plugin';
import { transition, type PaymentEvent, type PaymentState } from './state';
import type {
  PaymentApproval,
  PaymentAttempt,
  PaymentFailureReason,
  PaymentLookup,
  PaymentOutcome,
  PaymentRequest,
  PaymentTransport,
  Result,
} from './types';

export interface ReconcileOptions {
  /** 조회를 최대 몇 번 할지. 처음 조회를 포함함 */
  maxAttempts?: number;
  /** n번째 재조회 전에 기다릴 시간(ms). n은 1부터 시작함 */
  delayMs?: (retryCount: number) => number;
}

export interface PaymentClientOptions<Reason extends string> {
  transport: PaymentTransport<Reason>;
  /**
   * 응답을 받지 못해 결제 여부를 알 수 없는 실패인지.
   * true면 같은 멱등 키로 조회해서 결과를 확인하고, false면 결제되지 않은 것으로 확정함.
   */
  isAmbiguous: (reason: Reason) => boolean;
  journal?: PaymentJournal;
  plugins?: readonly PaymentPlugin<Reason>[];
  reconcile?: ReconcileOptions;
  createIdempotencyKey?: () => string;
  now?: () => Date;
  onPluginError?: (error: unknown, pluginName: string) => void;
}

export interface PaymentClient<Reason extends string> {
  /**
   * 주문 하나를 결제함.
   * - 같은 주문의 결제가 진행 중이면 새로 요청하지 않고 진행 중인 결과를 같이 기다림
   * - 결과를 모르는 이전 시도가 남아 있으면 먼저 조회하고, 결제되지 않았을 때만 새로 요청함
   */
  pay(request: PaymentRequest): Promise<PaymentOutcome<Reason>>;
  /** 저널에 남은 시도를 모두 조회함. 앱을 시작할 때 부름 */
  recover(): Promise<PaymentOutcome<Reason>[]>;
  getState(orderId: string): PaymentState<Reason>;
  /** 플러그인을 등록하고, 해제 함수를 돌려줌 */
  use(plugin: PaymentPlugin<Reason>): () => void;
}

const DEFAULT_RECONCILE = {
  maxAttempts: 5,
  delayMs: (retryCount: number) => Math.min(500 * 2 ** (retryCount - 1), 4000),
} satisfies Required<ReconcileOptions>;

export function createPaymentClient<Reason extends string>(
  options: PaymentClientOptions<Reason>,
): PaymentClient<Reason> {
  const {
    transport,
    isAmbiguous,
    journal = createMemoryJournal(),
    createIdempotencyKey = () => crypto.randomUUID(),
    now = () => new Date(),
    onPluginError = (error, pluginName) => {
      console.error(`[payment-sdk] ${pluginName} 플러그인에서 에러가 났습니다.`, error);
    },
  } = options;
  const reconcileOptions = { ...DEFAULT_RECONCILE, ...options.reconcile };

  const plugins = new Set(options.plugins);
  const states = new Map<string, PaymentState<Reason>>();
  const inflight = new Map<string, Promise<PaymentOutcome<Reason>>>();

  const getState = (orderId: string): PaymentState<Reason> =>
    states.get(orderId) ?? { status: 'idle' };

  const dispatch = (orderId: string, event: PaymentEvent<Reason>) => {
    const previous = getState(orderId);
    const next = transition(previous, event);
    states.set(orderId, next);
    for (const plugin of plugins) {
      notify(plugin, () => plugin.onStateChange?.({ orderId, previous, next }));
    }
  };

  const notify = (plugin: PaymentPlugin<Reason>, call: () => void | Promise<void>) => {
    try {
      void Promise.resolve(call()).catch((error: unknown) => onPluginError(error, plugin.name));
    } catch (error) {
      onPluginError(error, plugin.name);
    }
  };

  /** 같은 주문에 대한 작업은 한 번에 하나만 돌게 함 */
  const singleFlight = (orderId: string, task: () => Promise<PaymentOutcome<Reason>>) => {
    const running = inflight.get(orderId);
    if (running !== undefined) {
      return running;
    }
    const promise = task().finally(() => inflight.delete(orderId));
    inflight.set(orderId, promise);
    return promise;
  };

  const settle = async (
    attempt: PaymentAttempt,
    event: Extract<PaymentEvent<Reason>, { type: 'APPROVE' | 'FAIL' }>,
  ): Promise<PaymentOutcome<Reason>> => {
    // 결과가 확정된 뒤에 저널을 지움. 순서가 바뀌면 그 사이에 꺼졌을 때 기록이 사라짐
    await journal.remove(attempt.orderId);
    dispatch(attempt.orderId, event);
    return event.type === 'APPROVE'
      ? { status: 'approved', attempt, approval: event.approval }
      : { status: 'failed', attempt, reason: event.reason };
  };

  const lookup = async (
    idempotencyKey: string,
  ): Promise<Result<PaymentLookup, PaymentFailureReason<Reason>>> => {
    try {
      return await transport.lookup(idempotencyKey);
    } catch {
      return { ok: false, reason: 'TRANSPORT_ERROR' };
    }
  };

  /**
   * reconciling 상태에서 멱등 키로 결과를 확인함.
   * 조회는 읽기라서 자동으로 여러 번 해도 안전함. 결제 요청 자체는 자동으로 다시 보내지 않음.
   */
  const reconcile = async (
    attempt: PaymentAttempt,
    reason: PaymentFailureReason<Reason>,
  ): Promise<PaymentOutcome<Reason>> => {
    let lastReason = reason;

    for (let count = 0; count < reconcileOptions.maxAttempts; count += 1) {
      if (count > 0) {
        await sleep(reconcileOptions.delayMs(count));
      }

      const result = await lookup(attempt.idempotencyKey);
      if (!result.ok) {
        lastReason = result.reason;
        continue;
      }
      if (result.value.status === 'approved') {
        return settle(attempt, { type: 'APPROVE', approval: result.value.approval });
      }
      if (result.value.status === 'not-found') {
        return settle(attempt, { type: 'FAIL', reason });
      }
      // processing이면 손님이 아직 카드를 대는 중일 수 있으므로 계속 기다림
    }

    dispatch(attempt.orderId, { type: 'GIVE_UP', reason: lastReason });
    return { status: 'unknown', attempt, reason: lastReason };
  };

  const request = async ({ orderId, amount }: PaymentRequest): Promise<PaymentOutcome<Reason>> => {
    const previous = await journal.get(orderId);
    if (previous !== undefined) {
      dispatch(orderId, { type: 'RECONCILE', attempt: previous });
      const outcome = await reconcile(previous, 'INTERRUPTED');
      // 이전 시도가 승인됐거나 아직 모르면 새 결제를 만들지 않음
      if (outcome.status !== 'failed') {
        return outcome;
      }
    }

    const attempt: PaymentAttempt = {
      orderId,
      amount,
      idempotencyKey: createIdempotencyKey(),
      startedAt: now().toISOString(),
    };
    const requestEvent = { type: 'REQUEST', attempt } as const;
    // transition은 순수 함수라 상태를 바꾸지 않고 전이 가능 여부만 먼저 확인할 수 있음.
    // 저널에 쓰고 나서 막히면 결과를 모르는 이전 시도의 멱등 키를 덮어쓰게 됨
    transition(getState(orderId), requestEvent);
    // 단말기에 보내기 전에 기록함. 저장에 실패하면 여기서 reject되고 결제 요청은 나가지 않음
    await journal.save(attempt);
    dispatch(orderId, requestEvent);

    let result: Result<PaymentApproval, Reason>;
    try {
      result = await transport.approve(attempt);
    } catch {
      // 요청이 단말기까지 갔는지 알 수 없으므로 응답 없음과 같게 다룸
      dispatch(orderId, { type: 'LOSE' });
      return reconcile(attempt, 'TRANSPORT_ERROR');
    }

    if (result.ok) {
      return settle(attempt, { type: 'APPROVE', approval: result.value });
    }
    if (!isAmbiguous(result.reason)) {
      return settle(attempt, { type: 'FAIL', reason: result.reason });
    }
    dispatch(orderId, { type: 'LOSE' });
    return reconcile(attempt, result.reason);
  };

  return {
    pay(paymentRequest) {
      assertAmount(paymentRequest.amount);
      return singleFlight(paymentRequest.orderId, () => request(paymentRequest));
    },

    async recover() {
      const attempts = await journal.list();
      return Promise.all(
        attempts.map(attempt =>
          singleFlight(attempt.orderId, () => {
            dispatch(attempt.orderId, { type: 'RECONCILE', attempt });
            return reconcile(attempt, 'INTERRUPTED');
          }),
        ),
      );
    },

    getState,

    use(plugin) {
      plugins.add(plugin);
      return () => {
        plugins.delete(plugin);
      };
    },
  };
}

function assertAmount(amount: number) {
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new RangeError(`결제 금액은 1원 이상의 정수여야 합니다. (받은 값: ${amount})`);
  }
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
