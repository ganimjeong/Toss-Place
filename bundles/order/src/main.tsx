import { initMonitoring, rootErrorHandlers } from '@toss-place/monitoring';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Providers } from './app/Providers';
import { OrderPage } from './pages/OrderPage';

initMonitoring({ bundle: 'order' });

const container = document.getElementById('root');
if (container === null) {
  throw new Error('#root 요소를 찾을 수 없습니다.');
}

createRoot(container, rootErrorHandlers).render(
  <StrictMode>
    <Providers>
      <OrderPage />
    </Providers>
  </StrictMode>,
);
