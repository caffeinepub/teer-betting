import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DrawId, TransactionId } from "../backend.d";
import { useActor } from "./useActor";

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useActiveDraw() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activeDraw"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getActiveDraw();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useDrawHistory() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["drawHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDrawHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerBets() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerBets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerBets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllBets() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allBets"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllBets();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllTransactions() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allTransactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePendingRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pendingRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRequests();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useAllUserProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUserProfiles"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePlaceBet() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      drawId,
      number,
      amount,
    }: {
      drawId: DrawId;
      number: bigint;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.placeBet(drawId, number, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerBets"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useCreateDeposit() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      upiRef,
    }: {
      amount: bigint;
      upiRef: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createDepositRequest(amount, upiRef);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerTransactions"] });
    },
  });
}

export function useCreateWithdrawal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      upiId,
    }: {
      amount: bigint;
      upiId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createWithdrawalRequest(amount, upiId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerTransactions"] });
    },
  });
}

export function useApproveTransaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: TransactionId) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveTransaction(transactionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingRequests"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
      qc.invalidateQueries({ queryKey: ["allUserProfiles"] });
    },
  });
}

export function useRejectTransaction() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (transactionId: TransactionId) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectTransaction(transactionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingRequests"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
    },
  });
}

export function useStartDraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      return actor.startDraw();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeDraw"] });
      qc.invalidateQueries({ queryKey: ["drawHistory"] });
    },
  });
}

export function useCloseDraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (drawId: DrawId) => {
      if (!actor) throw new Error("Not connected");
      return actor.closeDraw(drawId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeDraw"] });
      qc.invalidateQueries({ queryKey: ["drawHistory"] });
    },
  });
}

export function useSettleDraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      drawId,
      winningNumber,
    }: {
      drawId: DrawId;
      winningNumber: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.settleDraw(drawId, winningNumber);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["activeDraw"] });
      qc.invalidateQueries({ queryKey: ["drawHistory"] });
      qc.invalidateQueries({ queryKey: ["allBets"] });
    },
  });
}
