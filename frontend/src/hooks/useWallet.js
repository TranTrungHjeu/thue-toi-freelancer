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

export const useWalletLedger = (options = {}) => {
  return useQuery({
    queryKey: LEDGER_QUERY_KEY,
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
