import { queryOptions, useSuspenseQuery } from '@tanstack/react-query';

import { fetchMenus } from '../apis/menu';

export const menuQueries = {
  all: () => queryOptions({ queryKey: ['order', 'menus'], queryFn: fetchMenus }),
};

export function useMenusQuery() {
  return useSuspenseQuery(menuQueries.all());
}
