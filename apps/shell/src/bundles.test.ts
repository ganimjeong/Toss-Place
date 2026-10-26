import { describe, expect, it } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };
import { BUNDLE_NAMES, BUNDLES, resolveBundleUrl } from './bundles';

describe('BUNDLES', () => {
  it('번들마다 개발 서버 포트가 겹치지 않음', () => {
    const ports = BUNDLE_NAMES.map(name => BUNDLES[name].devServerPort);

    expect(new Set(ports).size).toBe(ports.length);
  });

  it('모든 번들이 셸 의존성으로 선언돼 있음', () => {
    // 루트 yarn build는 --topological-dev라 devDependencies까지 보고 순서를 정함. 선언을 빠뜨리면 셸이 번들보다 먼저 빌드될 수 있음
    const dependencies = Object.keys(packageJson.devDependencies);

    expect(dependencies).toEqual(
      expect.arrayContaining(BUNDLE_NAMES.map(name => `@toss-place/${name}`)),
    );
  });
});

describe('resolveBundleUrl', () => {
  it('개발 중에는 번들의 개발 서버 주소를 돌려줌', () => {
    expect(resolveBundleUrl('cash', { isDev: true })).toBe('http://localhost:5174');
  });

  it('배포 시에는 셸 dist에 복사된 번들 파일 주소를 돌려줌', () => {
    expect(resolveBundleUrl('order', { isDev: false, baseDir: '/app.asar/dist' })).toBe(
      'file:///app.asar/dist/bundles/order/index.html',
    );
  });

  it('경로의 공백과 한글을 URL로 인코딩함', () => {
    expect(
      resolveBundleUrl('order', { isDev: false, baseDir: '/Applications/Mini POS/포스' }),
    ).toBe('file:///Applications/Mini%20POS/%ED%8F%AC%EC%8A%A4/bundles/order/index.html');
  });
});
