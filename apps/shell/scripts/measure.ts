/**
 * 셸 빌드 결과를 Electron으로 띄우고 Chrome DevTools Protocol로 성능을 잼.
 * 매장 단말기는 개발 PC보다 CPU가 느려서, CPU 스로틀링을 걸어 같은 조건을 흉내 냄.
 *
 * 사용: yarn workspace @toss-place/shell measure [--runs 7] [--payments 300] [--out 결과.json]
 *
 * 1. 번들 첫 화면: 번들로 이동한 뒤 #root가 처음 그려지는 시점, 메뉴가 그려지는 시점, 스크립트 실행 시간, 메인 스레드 점유
 * 2. 입력 반응: 메뉴를 누른 뒤 바뀐 화면이 그려질 때까지 걸린 시간(INP와 같은 구간)
 * 3. 장시간 운영: 결제를 수백 건 반복하면서 GC 후 힙 크기, DOM 노드 수, 누르는 동작의 반응 시간
 */
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const require = createRequire(import.meta.url);
// electron 패키지를 Node에서 require하면 실행 파일 경로를 돌려줌
const electronModule: unknown = require('electron');
if (typeof electronModule !== 'string') {
  throw new Error('electron 실행 파일 경로를 찾지 못함');
}
const electronPath = electronModule;

const { values: args } = parseArgs({
  options: {
    runs: { type: 'string', default: '7' },
    payments: { type: 'string', default: '300' },
    out: { type: 'string' },
    // 결제를 마친 뒤 기다렸다가 한 번 더 잼. React Query가 끝난 mutation을 gcTime(기본 5분) 동안 들고 있어서, 시간이 지나면 풀리는 것과 계속 남는 것을 나눠 보려는 것
    'settle-ms': { type: 'string', default: '0' },
    // 장시간 운영 측정에 걸 CPU 스로틀링 배율. 저사양 단말에서 쌓인 것이 반응 시간에 영향을 주는지 봄
    'session-throttle': { type: 'string', default: '1' },
  },
});
const RUNS = Number(args.runs);
const PAYMENTS = Number(args.payments);
const SETTLE_MS = Number(args['settle-ms']);
const SESSION_THROTTLE = Number(args['session-throttle']);
const THROTTLE_RATES = [1, 4, 6] as const;
const PORT = 9333;

// 새 문서마다 먼저 실행해 측정 값을 window.__perf에 모음
// 입력 반응: 클릭 시점(event.timeStamp)부터 그 클릭으로 바뀐 화면이 그려진 다음 프레임까지. INP가 재는 구간과 같음
// 로딩 중 메인 스레드 점유: 50ms 넘는 long task의 초과분 합(TBT와 같은 방식)
const COLLECTOR = `
  window.__perf = { taps: [], blockingMs: 0 };
  new PerformanceObserver(list => {
    for (const e of list.getEntries()) window.__perf.blockingMs += Math.max(0, e.duration - 50);
  }).observe({ type: 'longtask', buffered: true });
  addEventListener('click', event => {
    const start = event.timeStamp;
    requestAnimationFrame(() => setTimeout(() => window.__perf.taps.push(performance.now() - start), 0));
  }, true);
  new MutationObserver(() => {
    const root = document.getElementById('root');
    if (root && root.childElementCount > 0 && window.__perf.rootAt === undefined) window.__perf.rootAt = performance.now();
    if (document.querySelector('main ul button') && window.__perf.menuAt === undefined) window.__perf.menuAt = performance.now();
  }).observe(document, { childList: true, subtree: true });
`;

interface CdpResponse {
  id?: number;
  result?: unknown;
  error?: { message: string };
}

interface CdpTarget {
  type: string;
  url: string;
  webSocketDebuggerUrl: string;
}

async function readTargets(response: Response): Promise<CdpTarget[]> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- /json 응답 모양은 CDP HTTP 엔드포인트 문서를 따름
  return (await response.json()) as CdpTarget[];
}

function isCdpResponse(value: unknown): value is CdpResponse {
  return typeof value === 'object' && value !== null;
}

class Cdp {
  private nextId = 0;
  private readonly pending = new Map<number, (response: CdpResponse) => void>();
  // Node가 타입만 지우고 실행해서 생성자 매개변수 프로퍼티 문법을 쓸 수 없음
  private readonly socket: WebSocket;

  private constructor(socket: WebSocket) {
    this.socket = socket;
    socket.addEventListener('message', event => {
      const message: unknown = JSON.parse(String(event.data));
      if (isCdpResponse(message) && message.id !== undefined) {
        this.pending.get(message.id)?.(message);
        this.pending.delete(message.id);
      }
    });
  }

  static async connect(url: string) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new Cdp(socket);
  }

  send<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
    const id = ++this.nextId;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      this.pending.set(id, response => {
        if (response.error) reject(new Error(`${method}: ${response.error.message}`));
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- 응답 모양은 호출한 CDP 메서드의 프로토콜 문서를 따름
        else resolve(response.result as T);
      });
    });
  }

  async evaluate<T>(expression: string): Promise<T> {
    const { result } = await this.send<{ result: { value: T } }>('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return result.value;
  }

  close() {
    this.socket.close();
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function waitFor(cdp: Cdp, expression: string, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await cdp.evaluate<boolean>(`Boolean(${expression})`).catch(() => false)) return;
    await sleep(10);
  }
  throw new Error(`시간 안에 조건을 만족하지 못함: ${expression}`);
}

async function launch() {
  const child = spawn(
    electronPath,
    [join(import.meta.dirname, '..'), '--measure', `--remote-debugging-port=${PORT}`],
    {
      env: { ...process.env, POS_STUB_CARD_DELAY_MS: '50' },
      stdio: 'ignore',
    },
  );
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    const targets = await fetch(`http://127.0.0.1:${PORT}/json`)
      .then(response => readTargets(response))
      .catch(() => []);
    const page = targets.find(target => target.type === 'page' && target.url.startsWith('file://'));
    if (page) {
      const cdp = await Cdp.connect(page.webSocketDebuggerUrl);
      await cdp.send('Page.enable');
      await cdp.send('Performance.enable');
      await cdp.send('Page.addScriptToEvaluateOnNewDocument', { source: COLLECTOR });
      return { child, cdp, orderUrl: page.url };
    }
    await sleep(100);
  }
  child.kill();
  throw new Error('Electron 셸에 연결하지 못함');
}

async function readMetrics(cdp: Cdp) {
  const { metrics } = await cdp.send<{ metrics: { name: string; value: number }[] }>(
    'Performance.getMetrics',
  );
  const pick = (name: string) => metrics.find(metric => metric.name === name)?.value ?? 0;
  return {
    script: pick('ScriptDuration') * 1000,
    nodes: pick('Nodes'),
    heap: pick('JSHeapUsedSize'),
  };
}

async function click(cdp: Cdp, selector: string) {
  const point = await cdp.evaluate<{ x: number; y: number } | null>(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  if (point === null) throw new Error(`요소 없음: ${selector}`);
  const base = { x: point.x, y: point.y, button: 'left', clickCount: 1 };
  await cdp.send('Input.dispatchMouseEvent', { ...base, type: 'mousePressed' });
  await cdp.send('Input.dispatchMouseEvent', { ...base, type: 'mouseReleased' });
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;
}

const round = (value: number) => Math.round(value * 10) / 10;

async function takeTaps(cdp: Cdp) {
  return cdp.evaluate<number[]>('window.__perf.taps.splice(0)');
}

async function measureStartup(cdp: Cdp, orderUrl: string) {
  const urls = { order: orderUrl, cash: orderUrl.replace('/order/', '/cash/') };
  const result: Record<string, unknown> = {};
  for (const rate of THROTTLE_RATES) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    for (const [name, url] of Object.entries(urls)) {
      const samples: { rootAt: number; menuAt: number | null; script: number; blocking: number }[] =
        [];
      for (let run = 0; run < RUNS; run++) {
        await cdp.send('Page.navigate', { url });
        await waitFor(cdp, name === 'order' ? 'window.__perf?.menuAt' : 'window.__perf?.rootAt');
        await sleep(300);
        // 이동하면 지표가 새 문서 기준으로 다시 시작함
        const { script } = await readMetrics(cdp);
        const perf = await cdp.evaluate<{ rootAt: number; menuAt?: number; blockingMs: number }>(
          'window.__perf',
        );
        samples.push({
          rootAt: perf.rootAt,
          menuAt: perf.menuAt ?? null,
          script,
          blocking: perf.blockingMs,
        });
      }
      result[`${name}@${rate}x`] = {
        firstRenderMs: round(median(samples.map(s => s.rootAt))),
        ...(name === 'order'
          ? { menuVisibleMs: round(median(samples.map(s => s.menuAt ?? 0))) }
          : {}),
        scriptMs: round(median(samples.map(s => s.script))),
        blockingMs: round(median(samples.map(s => s.blocking))),
      };
    }
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return result;
}

async function measureInput(cdp: Cdp, orderUrl: string) {
  const result: Record<string, unknown> = {};
  for (const rate of THROTTLE_RATES) {
    await cdp.send('Page.navigate', { url: orderUrl });
    await waitFor(cdp, 'window.__perf?.menuAt');
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await takeTaps(cdp);
    for (let index = 0; index < 30; index++) {
      await click(cdp, `main ul li:nth-child(${(index % 6) + 1}) button`);
      await sleep(120);
    }
    await sleep(300);
    const durations = await takeTaps(cdp);
    result[`menuTap@${rate}x`] = {
      p75Ms: round(percentile(durations, 0.75)),
      maxMs: round(Math.max(0, ...durations)),
    };
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  return result;
}

/** 결제 → 결과 다이얼로그 확인을 반복함. 영업시간 내내 켜 두는 포스에서 쌓이는 것이 있는지 봄 */
async function measureLongSession(cdp: Cdp, orderUrl: string) {
  await cdp.send('Page.navigate', { url: orderUrl });
  await waitFor(cdp, 'window.__perf?.menuAt');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: SESSION_THROTTLE });
  const checkpoints: Record<string, unknown>[] = [];
  const snapshot = async (payments: number) => {
    await cdp.send('HeapProfiler.collectGarbage');
    const metrics = await readMetrics(cdp);
    const taps = await takeTaps(cdp);
    checkpoints.push({
      payments,
      heapMb: round(metrics.heap / 1024 / 1024),
      domNodes: metrics.nodes,
      tapP75Ms: round(percentile(taps, 0.75)),
      tapMaxMs: round(Math.max(0, ...taps)),
    });
  };

  await snapshot(0);
  for (let payment = 1; payment <= PAYMENTS; payment++) {
    await click(cdp, 'main ul li:nth-child(1) button');
    await waitFor(
      cdp,
      `[...document.querySelectorAll('button')].some(b => b.textContent === '카드 결제' && !b.disabled)`,
    );
    await click(cdp, 'section[aria-label="장바구니"] > button');
    await waitFor(cdp, `document.querySelector('[role="dialog"]')`);
    await click(cdp, '[role="dialog"] button:last-child');
    await waitFor(cdp, `!document.querySelector('[role="dialog"]')`);
    if (payment % Math.max(1, Math.floor(PAYMENTS / 6)) === 0 || payment === PAYMENTS)
      await snapshot(payment);
  }
  if (SETTLE_MS > 0) {
    await sleep(SETTLE_MS);
    await snapshot(PAYMENTS);
  }
  return checkpoints;
}

/* eslint-disable no-console -- 측정 결과를 터미널에 보여주는 CLI임 */
const { child, cdp, orderUrl } = await launch();
try {
  const startup = await measureStartup(cdp, orderUrl);
  console.log('번들 첫 화면', startup);
  const input = await measureInput(cdp, orderUrl);
  console.log('입력 반응', input);
  const longSession = await measureLongSession(cdp, orderUrl);
  console.log('장시간 운영');
  console.table(longSession);
  if (args.out) {
    writeFileSync(
      args.out,
      `${JSON.stringify({ measuredAt: new Date().toISOString(), runs: RUNS, startup, input, longSession }, null, 2)}\n`,
    );
  }
} finally {
  cdp.close();
  child.kill();
}
