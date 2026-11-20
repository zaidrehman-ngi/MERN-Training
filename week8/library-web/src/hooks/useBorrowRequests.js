import { listBorrowRequests } from "../api/borrowRequests";
import { usePagedList } from "./usePagedList";

export function useBorrowRequests(params) {
  return usePagedList(listBorrowRequests, params);
}
