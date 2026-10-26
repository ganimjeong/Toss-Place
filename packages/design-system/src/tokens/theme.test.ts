import { describe, expect, it } from 'vitest';

import { vars } from './theme.css';

describe('vars', () => {
  it('토큰은 CSS 변수 참조 문자열이다', () => {
    expect(vars.color.textPrimary).toMatch(/^var\(--.+\)$/);
    expect(vars.typography.t1.fontSize).toMatch(/^var\(--.+\)$/);
  });
});
