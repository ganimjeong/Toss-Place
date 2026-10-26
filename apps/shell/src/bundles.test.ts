import { describe, expect, it } from 'vitest';

import { BUNDLE_NAMES, BUNDLES, resolveBundleUrl } from './bundles';

describe('BUNDLES', () => {
  it('번들마다 개발 서버 포트가 겹치지 않음', () => {
    const ports = BUNDLE_NAMES.map(name => BUNDLES[name].devServerPort);

    expect(new Set(ports).size).toBe(ports.length);
  });
});

describe('resolveBundleUrl', () => {
  it('개발 중에는 번들의 개발 서버 주소를 돌려줌', () => {
    expect(resolveBundleUrl('cash', { isDev: true })).toBe('http://localhost:5174');
  });

  it('배포 시에는 빌드된 index.html 파일 주소를 돌려줌', () => {
    expect(resolveBundleUrl('order', { isDev: false })).toMatch(
      /^file:\/\/.*\/bundles\/order\/dist\/index\.html$/,
    );
  });
});
