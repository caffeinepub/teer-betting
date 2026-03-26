import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DrawId,
  Transaction,
  TransactionId,
  UserProfileAdmin,
} from "../backend.d";
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
      return actor.getCallerUserProfile() as any;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
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
      return actor.getCallerTransactions() as any;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
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
      return actor.getAllTransactions() as any;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function usePendingRequests() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["pendingRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingRequests() as any;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useAllUserProfiles() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["allUserProfiles"],
    queryFn: async (): Promise<UserProfileAdmin[]> => {
      if (!actor) return [];
      return (actor as any).getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
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
      qc.invalidateQueries({ queryKey: ["pendingRequests"] });
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
      qc.invalidateQueries({ queryKey: ["pendingRequests"] });
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
      qc.invalidateQueries({ queryKey: ["userProfile"] });
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

export function useRejectTransactionWithReason() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      transactionId,
      reason,
    }: {
      transactionId: TransactionId;
      reason: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).rejectTransactionWithReason(transactionId, reason);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendingRequests"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
      qc.invalidateQueries({ queryKey: ["callerTransactions"] });
    },
  });
}

export function useDeductBalance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      amount,
    }: {
      user: Principal;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).deductBalance(user, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUserProfiles"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useGetUserByUserId() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (userId: bigint): Promise<UserProfileAdmin | null> => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).getUserByUserId(userId);
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
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["allUserProfiles"] });
    },
  });
}

export function useAddBalance() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user,
      amount,
    }: {
      user: Principal;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).addBalance(user, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUserProfiles"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).blockUser(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUserProfiles"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).unblockUser(user);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUserProfiles"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useGetUserTransactions() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (user: Principal): Promise<Transaction[]> => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).getUserTransactions(user) as any;
    },
  });
}

export function useRejectBet() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (betId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).rejectBet(betId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allBets"] });
      qc.invalidateQueries({ queryKey: ["allUserProfiles"] });
      qc.invalidateQueries({ queryKey: ["allTransactions"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useDeleteDraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (drawId: bigint) => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).deleteDraw(drawId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["drawHistory"] });
      qc.invalidateQueries({ queryKey: ["activeDraw"] });
    },
  });
}

export function useGetUserBets() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async (user: any): Promise<any[]> => {
      if (!actor) throw new Error("Not connected");
      return (actor as any).getUserBets(user) as any;
    },
  });
}

export function useIsCallerBlocked() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerBlocked"],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as any).isCallerBlocked();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}
