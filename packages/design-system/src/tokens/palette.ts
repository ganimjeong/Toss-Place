/**
 * 원시 색상. 컴포넌트에서 직접 쓰지 않고 semantic 토큰을 통해서만 씀.
 * 그래서 패키지 밖으로 내보내지 않음.
 * 단계는 50부터 900까지이고 숫자가 클수록 진함.
 */
export const palette = {
  grey50: '#f9fafb',
  grey100: '#f2f4f6',
  grey200: '#e5e8eb',
  grey300: '#d1d6db',
  grey400: '#b0b8c1',
  grey500: '#8b95a1',
  grey600: '#6b7684',
  grey700: '#4e5968',
  grey800: '#333d4b',
  grey900: '#191f28',

  blue50: '#e8f3ff',
  blue100: '#c9e2ff',
  blue200: '#90c2ff',
  blue300: '#64a8ff',
  blue400: '#4593fc',
  blue500: '#3182f6',
  blue600: '#2272eb',
  blue700: '#1b64da',
  blue800: '#1957c2',
  blue900: '#194aa6',

  red50: '#ffeeee',
  red500: '#f04452',
  red700: '#d22030',

  green50: '#f0faf6',
  green500: '#03b26c',
  green700: '#028450',

  orange50: '#fff3e0',
  orange500: '#fe9800',

  white: '#ffffff',
  black: '#000000',
} as const;
