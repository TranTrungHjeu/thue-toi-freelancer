import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import marketplaceApi from "../api/marketplaceApi";

const BANK_ACCOUNTS_KEY = ["bankAccounts"];

export const useBankAccounts = (options = {}) =>
  useQuery({
    queryKey: BANK_ACCOUNTS_KEY,
    queryFn: () =>
      marketplaceApi
        .getMyBankAccounts()
        .then((res) => res?.data || [])
        .catch(() => []),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    ...options,
  });

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => marketplaceApi.createBankAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });
};

export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => marketplaceApi.updateBankAccount(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });
};

export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => marketplaceApi.deleteBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });
};

export const useSetDefaultBankAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => marketplaceApi.setDefaultBankAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BANK_ACCOUNTS_KEY });
    },
  });
};
