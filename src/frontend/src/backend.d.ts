import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type BetId = bigint;
export type TransactionId = bigint;
export type Time = bigint;
export interface Bet {
    player: Principal;
    number: bigint;
    timestamp: Time;
    betId: BetId;
    amount: bigint;
    drawId: DrawId;
}
export interface Draw {
    id: DrawId;
    status: {
        __kind__: "closed";
        closed: null;
    } | {
        __kind__: "settled";
        settled: bigint;
    } | {
        __kind__: "open";
        open: null;
    };
    createdAt: Time;
}
export interface UserProfileAdmin {
    userId: bigint;
    isBlocked: boolean;
    user: Principal;
    wallet: bigint;
}
export type DrawId = bigint;
export interface UserProfilePublic {
    userId: bigint;
    wallet: bigint;
}
export interface Transaction {
    status: Variant_pending_approved_rejected;
    transactionType: {
        __kind__: "bet";
        bet: {
            betId: BetId;
            amount: bigint;
        };
    } | {
        __kind__: "deposit";
        deposit: {
            upiRef: string;
            amount: bigint;
        };
    } | {
        __kind__: "withdrawal";
        withdrawal: {
            upiId: string;
            amount: bigint;
        };
    } | {
        __kind__: "payout";
        payout: {
            betId: BetId;
            amount: bigint;
        };
    };
    user: Principal;
    rejectionReason?: string;
    timestamp: Time;
    transactionId: TransactionId;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    addBalance(user: Principal, amount: bigint): Promise<void>;
    approveTransaction(transactionId: TransactionId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    blockUser(user: Principal): Promise<void>;
    closeDraw(drawId: DrawId): Promise<void>;
    createDepositRequest(amount: bigint, upiRef: string): Promise<TransactionId>;
    createWithdrawalRequest(amount: bigint, upiId: string): Promise<TransactionId>;
    deductBalance(user: Principal, amount: bigint): Promise<void>;
    deleteDraw(drawId: DrawId): Promise<void>;
    getActiveDraw(): Promise<Draw | null>;
    getAllBets(): Promise<Array<Bet>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getAllUserProfiles(): Promise<Array<UserProfileAdmin>>;
    getBalance(user: Principal): Promise<bigint>;
    getCallerBets(): Promise<Array<Bet>>;
    getCallerTransactions(): Promise<Array<Transaction>>;
    getCallerUserProfile(): Promise<UserProfilePublic | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDrawHistory(): Promise<Array<Draw>>;
    getPendingRequests(): Promise<Array<Transaction>>;
    getUserBets(user: Principal): Promise<Array<Bet>>;
    getUserByUserId(userId: bigint): Promise<UserProfileAdmin | null>;
    getUserProfile(user: Principal): Promise<UserProfilePublic | null>;
    getUserTransactions(user: Principal): Promise<Array<Transaction>>;
    isCallerAdmin(): Promise<boolean>;
    isCallerBlocked(): Promise<boolean>;
    placeBet(drawId: DrawId, number: bigint, amount: bigint): Promise<BetId>;
    rejectBet(betId: BetId): Promise<void>;
    rejectTransaction(transactionId: TransactionId): Promise<void>;
    rejectTransactionWithReason(transactionId: TransactionId, reason: string): Promise<void>;
    saveCallerUserProfile(arg0: UserProfilePublic): Promise<void>;
    settleDraw(drawId: DrawId, winningNumber: bigint): Promise<void>;
    startDraw(): Promise<DrawId>;
    unblockUser(user: Principal): Promise<void>;
}
