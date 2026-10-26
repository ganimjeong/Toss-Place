/**
 * 번들이 이 파일을 소스 그대로 컴파일하므로 번들의 jsxImportSource(Emotion) 설정이 적용됨.
 * 디자인 시스템은 Emotion에 의존하지 않으니 파일 단위로 React 런타임을 고정함.
 * @jsxImportSource react
 */
import type { ButtonHTMLAttributes, Ref } from 'react';

import { button, type ButtonVariants } from './Button.css';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonVariants & {
    ref?: Ref<HTMLButtonElement>;
  };

export function Button({
  variant,
  size,
  fullWidth,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  const recipeClassName = button({ variant, size, fullWidth });

  return (
    <button
      type={type}
      className={className === undefined ? recipeClassName : `${recipeClassName} ${className}`}
      {...props}
    />
  );
}
