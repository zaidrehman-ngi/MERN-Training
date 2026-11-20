import { listUsers } from "../api/users";
import { usePagedList } from "./usePagedList";

export function useUsers(params) {
  return usePagedList(listUsers, params);
}
