import type { Page } from "../types/page.ts";

export const pageBody = <T>({ items, page, limit, total }: Page<T>) => ({
  data: items,
  meta: { page, limit, total },
});
