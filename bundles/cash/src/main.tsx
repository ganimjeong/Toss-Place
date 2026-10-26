import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Providers } from './app/Providers';
import { CashPage } from './pages/CashPage';

const container = document.getElementById('root');
if (container === null) {
  throw new Error('#root 요소를 찾을 수 없습니다.');
}

createRoot(container).render(
  <StrictMode>
    <Providers>
      <CashPage />
    </Providers>
  </StrictMode>,
);
