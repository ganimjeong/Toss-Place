import * as Sentry from '@sentry/react';
import type { RootOptions } from 'react-dom/client';

interface InitOptions {
  /** 이슈를 번들별로 나눠 보기 위한 태그. 예: order, cash */
  bundle: string;
  dsn?: string;
  release?: string;
}

/**
 * 번들 시작 시 한 번 부름. DSN이 없으면 아무것도 하지 않고 false를 돌려줌.
 * 수집 정책(개인정보, 릴리스 이름, 태그)은 모든 번들이 같아야 해서 여기서만 정함.
 */
export function initMonitoring({
  bundle,
  dsn = import.meta.env.SENTRY_DSN,
  release = import.meta.env.BUNDLE_RELEASE,
}: InitOptions): boolean {
  if (dsn === '') {
    return false;
  }

  Sentry.init({
    dsn,
    release,
    environment: import.meta.env.MODE,
    // v11부터 수집 범위를 dataCollection으로 정하고 기본값이 대부분 수집임.
    // 매장 기기에서 도는 앱이라 사용자, 쿠키, 헤더, 본문, 쿼리를 모두 끄고 필요한 값은 이벤트에 직접 담음
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false,
    },
    initialScope: {
      tags: {
        bundle,
        // 같은 번들이 셸과 브라우저에서 모두 돌기 때문에 어디서 난 문제인지 나눠 봄
        runtime: 'posBridge' in window ? 'pos-shell' : 'browser',
      },
    },
  });
  return true;
}

/**
 * React 19 루트 에러 훅.
 * ErrorBoundary가 잡은 에러는 window.onerror까지 올라가지 않아서, 경계마다 onError를 붙이지 않고 루트에서 한 번에 보냄.
 */
export const rootErrorHandlers = {
  onCaughtError: toRootErrorHandler(Sentry.reactErrorHandler()),
  onUncaughtError: toRootErrorHandler(Sentry.reactErrorHandler()),
  onRecoverableError: toRootErrorHandler(Sentry.reactErrorHandler()),
} satisfies Pick<RootOptions, 'onCaughtError' | 'onUncaughtError' | 'onRecoverableError'>;

/**
 * React 루트 훅 셋은 errorInfo 모양이 조금씩 다르고 componentStack이 없을 수도 있음(string | undefined).
 * Sentry 핸들러는 React의 ErrorInfo(string | null)를 받음. exactOptionalPropertyTypes에서 둘이 안 맞아서 맞춰줌
 */
function toRootErrorHandler(
  handler: ReturnType<typeof Sentry.reactErrorHandler>,
): (error: unknown, errorInfo: { componentStack?: string | undefined }) => void {
  return (error, errorInfo) => {
    handler(error, { componentStack: errorInfo.componentStack ?? null });
  };
}
