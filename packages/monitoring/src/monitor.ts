import * as Sentry from '@sentry/react';

export type Severity = 'info' | 'warning' | 'error';

/**
 * 번들이 쓰는 모니터링 기능. Sentry API를 그대로 내보내지 않고 필요한 것만 감쌈.
 * 도구를 바꾸거나 테스트에서 가짜로 바꿀 때 이 모양만 맞추면 됨.
 */
export interface Monitor {
  addBreadcrumb(category: string, message: string, data?: Record<string, unknown>): void;
  captureMessage(
    message: string,
    context: {
      level: Severity;
      tags?: Record<string, string>;
      extra?: Record<string, unknown>;
      /** 같은 문제를 하나의 이슈로 묶는 기준. 없으면 Sentry가 메시지로 묶음 */
      fingerprint?: string[];
    },
  ): void;
}

export const monitor: Monitor = {
  addBreadcrumb(category, message, data) {
    Sentry.addBreadcrumb({ category, message, ...(data === undefined ? {} : { data }) });
  },
  captureMessage(message, { level, tags, extra, fingerprint }) {
    Sentry.withScope(scope => {
      scope.setLevel(level);
      if (tags !== undefined) {
        scope.setTags(tags);
      }
      if (extra !== undefined) {
        scope.setExtras(extra);
      }
      if (fingerprint !== undefined) {
        scope.setFingerprint(fingerprint);
      }
      Sentry.captureMessage(message);
    });
  },
};
