import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import marketplaceApi from "../api/marketplaceApi";

// Root key — dùng để invalidate mọi biến thể phân trang ("withdrawals", "me", *).
const WITHDRAWALS_ROOT_KEY = ["withdrawals", "me"];

const EMPTY_PAGE = {
  data: [],
  pagination: { page: 1, limit: 0, total: 0, totalPages: 1 },
};

/**
 * Legacy: trả về list đầy đủ (không phân trang).
 * Vẫn giữ để các nơi khác đang dùng không vỡ — chỉ dùng cho list ngắn.
 */
export const useMyWithdrawals = (options = {}) =>
  useQuery({
    queryKey: [...WITHDRAWALS_ROOT_KEY, "all"],
    queryFn: () =>
      marketplaceApi
        .getMyWithdrawals()
        .then((res) => res?.data || [])
        .catch(() => []),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });

/**
 * Server-side pagination cho list yêu cầu rút tiền của user.
 * Trả về toàn bộ {@code PagedResponse} ({ data, pagination }) để FE biết totalPages.
 */
export const useMyWithdrawalsPaged = ({ page = 1, limit = 10 } = {}, options = {}) =>
  useQuery({
    queryKey: [...WITHDRAWALS_ROOT_KEY, "page", page, limit],
    queryFn: () =>
      marketplaceApi
        .getMyWithdrawals({ page, limit })
        .then((res) => res?.data || EMPTY_PAGE)
        .catch(() => EMPTY_PAGE),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev, // giữ dữ liệu cũ khi chuyển trang -> tránh flicker.
    ...options,
  });

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => marketplaceApi.createWithdrawal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WITHDRAWALS_ROOT_KEY });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletLedger"] });
      queryClient.invalidateQueries({ queryKey: ["bankAccounts"] });
    },
  });
};

export const useCancelWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => marketplaceApi.cancelWithdrawal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WITHDRAWALS_ROOT_KEY });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["walletLedger"] });
    },
  });
};
