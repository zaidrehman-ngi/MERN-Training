import type { Changes } from "../types/changes.ts";

export interface Repository<T, New, Query, ListItem = T> {
  findAll(query: Query): Promise<ListItem[]>;
  findById(id: string): Promise<T | null>;
  create(data: New): Promise<T>;
  updateById(id: string, changes: Changes<New>): Promise<T | null>;
}

export interface DeletableRepository<
  T,
  New,
  Query,
  ListItem = T,
> extends Repository<T, New, Query, ListItem> {
  deleteById(id: string): Promise<boolean>;
}
