export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};
