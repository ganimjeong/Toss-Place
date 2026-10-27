import type { Plugin } from 'vite';

interface PolicyOptions {
  /** 번들이 요청을 보내도 되는 외부 출처. 에러 리포팅 서버 등 */
  connectSources?: readonly string[];
}

/**
 * 번들은 셸 안에서 로컬 파일로 열리므로 외부 스크립트를 불러올 일이 없음.
 * Emotion이 런타임에 style 태그를 넣기 때문에 style-src만 inline을 허용함.
 * 외부로 나가는 요청은 connect-src에 출처 단위로만 열어둠.
 */
export function createContentSecurityPolicy({ connectSources = [] }: PolicyOptions = {}) {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    ["connect-src 'self'", ...connectSources].join(' '),
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
}

/** 개발 서버는 HMR용 inline 스크립트가 필요해서 빌드 결과에만 CSP를 넣음 */
export function contentSecurityPolicy(options?: PolicyOptions): Plugin<{ policy: string }> {
  const policy = createContentSecurityPolicy(options);

  return {
    name: 'toss-place:content-security-policy',
    apply: 'build',
    // 최종 정책을 밖에서 확인할 수 있게 둠. 설정 조립이 맞는지 테스트에서 읽음
    api: { policy },
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}
