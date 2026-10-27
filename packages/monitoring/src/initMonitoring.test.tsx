import * as Sentry from '@sentry/react';
import { Component, type ReactNode } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { initMonitoring, rootErrorHandlers } from './initMonitoring';

const reportedErrors = vi.hoisted((): unknown[] => []);

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  reactErrorHandler: () => (error: unknown) => {
    reportedErrors.push(error);
  },
}));

afterEach(() => {
  vi.clearAllMocks();
  reportedErrors.length = 0;
});

describe('initMonitoring', () => {
  it('DSN이 없으면 Sentry를 켜지 않음', () => {
    expect(initMonitoring({ bundle: 'order', dsn: '' })).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('사용자, 쿠키, 헤더, 본문, 쿼리 수집을 끄고 번들 태그를 붙임', () => {
    initMonitoring({ bundle: 'order', dsn: 'https://public@o1.ingest.sentry.io/1', release: 'r' });

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        release: 'r',
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: false,
          httpBodies: [],
          urlQueryParams: false,
        },
        initialScope: { tags: { bundle: 'order', runtime: 'browser' } },
      }),
    );
  });
});

class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? <p>대체 화면</p> : this.props.children;
  }
}

function Broken(): ReactNode {
  throw new Error('렌더링 실패');
}

describe('rootErrorHandlers', () => {
  it('ErrorBoundary가 잡아서 화면에는 안 보이는 에러도 보고함', () => {
    const container = document.createElement('div');
    const root = createRoot(container, rootErrorHandlers);

    act(() => {
      root.render(
        <Boundary>
          <Broken />
        </Boundary>,
      );
    });

    expect(container.textContent).toBe('대체 화면');
    expect(reportedErrors).toEqual([new Error('렌더링 실패')]);
    root.unmount();
  });
});
