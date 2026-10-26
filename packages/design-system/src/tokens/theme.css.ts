import { createGlobalTheme, createThemeContract } from '@vanilla-extract/css';

import { palette } from './palette';

/**
 * 컴포넌트가 쓰는 토큰의 이름표. 값은 테마마다 바뀌고 이름은 바뀌지 않음.
 * vars.color.textPrimary 같은 값은 실제로 var(--...) 문자열이라 Emotion에서도 그대로 쓸 수 있음.
 */
export const vars = createThemeContract({
  color: {
    textPrimary: null,
    textSecondary: null,
    textTertiary: null,
    textOnPrimary: null,
    textDanger: null,

    bgBase: null,
    bgSurface: null,
    bgLayered: null,

    borderSubtle: null,
    borderStrong: null,

    primary: null,
    primaryPressed: null,
    danger: null,
    success: null,
    warning: null,
  },
  // POS는 화면을 조금 떨어져서 보기 때문에 모바일보다 한 단계씩 크게 잡음
  typography: {
    t1: { fontSize: null, lineHeight: null },
    t2: { fontSize: null, lineHeight: null },
    t3: { fontSize: null, lineHeight: null },
    t4: { fontSize: null, lineHeight: null },
    t5: { fontSize: null, lineHeight: null },
    t6: { fontSize: null, lineHeight: null },
    t7: { fontSize: null, lineHeight: null },
  },
  fontWeight: {
    regular: null,
    medium: null,
    bold: null,
  },
  spacing: {
    x1: null,
    x2: null,
    x3: null,
    x4: null,
    x5: null,
    x6: null,
    x8: null,
    x10: null,
  },
  radius: {
    small: null,
    medium: null,
    large: null,
    full: null,
  },
  size: {
    /** 손가락으로 누르는 요소의 최소 크기 */
    touchTarget: null,
  },
});

createGlobalTheme(':root', vars, {
  color: {
    textPrimary: palette.grey900,
    textSecondary: palette.grey700,
    textTertiary: palette.grey500,
    textOnPrimary: palette.white,
    textDanger: palette.red500,

    bgBase: palette.grey100,
    bgSurface: palette.white,
    bgLayered: palette.white,

    borderSubtle: palette.grey200,
    borderStrong: palette.grey400,

    primary: palette.blue500,
    primaryPressed: palette.blue700,
    danger: palette.red500,
    success: palette.green500,
    warning: palette.orange500,
  },
  typography: {
    t1: { fontSize: '32px', lineHeight: '42px' },
    t2: { fontSize: '28px', lineHeight: '38px' },
    t3: { fontSize: '24px', lineHeight: '33px' },
    t4: { fontSize: '22px', lineHeight: '31px' },
    t5: { fontSize: '19px', lineHeight: '28px' },
    t6: { fontSize: '17px', lineHeight: '25.5px' },
    t7: { fontSize: '15px', lineHeight: '22.5px' },
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
  spacing: {
    x1: '4px',
    x2: '8px',
    x3: '12px',
    x4: '16px',
    x5: '20px',
    x6: '24px',
    x8: '32px',
    x10: '40px',
  },
  radius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    full: '9999px',
  },
  size: {
    touchTarget: '56px',
  },
});
