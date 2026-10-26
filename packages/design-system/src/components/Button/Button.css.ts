import { recipe, type RecipeVariants } from '@vanilla-extract/recipes';

import { vars } from '../../tokens/theme.css';

export const button = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.spacing.x2,
    border: 'none',
    borderRadius: vars.radius.medium,
    fontWeight: vars.fontWeight.bold,
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
    selectors: {
      '&:disabled': {
        cursor: 'default',
        opacity: 0.4,
      },
    },
  },
  variants: {
    variant: {
      primary: {
        background: vars.color.primary,
        color: vars.color.textOnPrimary,
        selectors: { '&:not(:disabled):active': { background: vars.color.primaryPressed } },
      },
      secondary: {
        background: vars.color.bgSurface,
        color: vars.color.textSecondary,
        boxShadow: `inset 0 0 0 1px ${vars.color.borderStrong}`,
        selectors: { '&:not(:disabled):active': { background: vars.color.bgBase } },
      },
      danger: {
        background: vars.color.danger,
        color: vars.color.textOnPrimary,
      },
    },
    size: {
      medium: {
        minHeight: '40px',
        padding: `0 ${vars.spacing.x4}`,
        fontSize: vars.typography.t7.fontSize,
      },
      // 결제처럼 자주 누르는 주요 동작은 large를 씀
      large: {
        minHeight: vars.size.touchTarget,
        padding: `0 ${vars.spacing.x5}`,
        fontSize: vars.typography.t5.fontSize,
      },
    },
    fullWidth: {
      true: { width: '100%' },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'large',
  },
});

export type ButtonVariants = NonNullable<RecipeVariants<typeof button>>;
