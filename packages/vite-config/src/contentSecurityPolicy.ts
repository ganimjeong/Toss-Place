import type { Plugin } from 'vite';

/**
 * 번들은 셸 안에서 로컬 파일로 열리므로 외부 스크립트를 불러올 일이 없음.
 * Emotion이 런타임에 style 태그를 넣기 때문에 style-src만 inline을 허용함.
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

/** 개발 서버는 HMR용 inline 스크립트가 필요해서 빌드 결과에만 CSP를 넣음 */
export function contentSecurityPolicy(): Plugin {
  return {
    name: 'toss-place:content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CONTENT_SECURITY_POLICY },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}
