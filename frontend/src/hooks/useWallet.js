import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import marketplaceApi from "../api/marketplaceApi";

const WALLET_QUERY_KEY = ["wallet"];
const LEDGER_QUERY_KEY = ["walletLedger"];

export const useWalletMe = (options = {}) => {
  return useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: () =>
      marketplaceApi
        .getWalletMe()
        .then((res) => res?.data || { balance: 0, escrow: 0, pending: 0 })
        .catch(() => ({ balance: 0, escrow: 0, pending: 0 })),
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useDepositWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount) => marketplaceApi.depositWallet(amount),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["wallet"],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["walletLedger"],
        refetchType: "all",
      });
    },
  });
};

const EMPTY_PAGE = {
  data: [],
  pagination: { page: 1, limit: 0, total: 0, totalPages: 1 },
};

/**
 * Legacy: trả về toàn bộ ledger (không phân trang).
 * Chỉ dùng cho list ngắn hoặc tổng hợp; tránh dùng cho list lịch sử của user dài hạn.
 */
export const useWalletLedger = (options = {}) => {
  return useQuery({
    queryKey: [...LEDGER_QUERY_KEY, "all"],
    queryFn: () =>
      marketplaceApi
        .getWalletLedger()
        .then((res) => res?.data || [])
        .catch(() => []),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });
};

/**
 * Server-side pagination cho lịch sử giao dịch ví.
 * Trả về {@code PagedResponse} ({ data, pagination }).
 */
export const useWalletLedgerPaged = ({ page = 1, limit = 10 } = {}, options = {}) => {
  return useQuery({
    queryKey: [...LEDGER_QUERY_KEY, "page", page, limit],
    queryFn: () =>
      marketplaceApi
        .getWalletLedger({ page, limit })
        .then((res) => res?.data || EMPTY_PAGE)
        .catch(() => EMPTY_PAGE),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    ...options,
  });
};
