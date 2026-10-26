import { Global, css } from '@emotion/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vars } from '@toss-place/design-system';
import { OverlayProvider } from 'overlay-kit';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <OverlayProvider>
        <Global styles={globalStyle} />
        {children}
      </OverlayProvider>
    </QueryClientProvider>
  );
}

const globalStyle = css`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    font-family:
      'Pretendard',
      -apple-system,
      BlinkMacSystemFont,
      sans-serif;
    color: ${vars.color.textPrimary};
    background: ${vars.color.bgBase};
    user-select: none;
  }
`;
