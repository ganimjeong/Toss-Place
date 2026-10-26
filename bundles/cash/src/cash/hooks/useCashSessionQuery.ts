import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { fetchCashSession } from '../apis/cashSession';

export const cashQueries = {
  session: () => queryOptions({ queryKey: ['cash', 'session'], queryFn: fetchCashSession }),
};

export function useCashSessionQuery() {
  return useSuspenseQuery(cashQueries.session());
}
