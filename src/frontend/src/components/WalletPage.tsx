import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Hash,
  Loader2,
  Wallet,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_pending_approved_rejected } from "../backend.d";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerTransactions,
  useCreateDeposit,
  useCreateWithdrawal,
  useUserProfile,
} from "../hooks/useQueries";

export default function WalletPage() {
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: profile } = useUserProfile();
  const { data: transactions } = useCallerTransactions();
  const createDeposit = useCreateDeposit();
  const createWithdrawal = useCreateWithdrawal();

  const [depositAmount, setDepositAmount] = useState("");
  const [depositRef, setDepositRef] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawUpi, setWithdrawUpi] = useState("");

  const handleDeposit = async () => {
    const amount = Number.parseInt(depositAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (!depositRef.trim()) {
      toast.error("Enter UPI transaction reference");
      return;
    }
    try {
      await createDeposit.mutateAsync({
        amount: BigInt(amount),
        upiRef: depositRef.trim(),
      });
      toast.success("Deposit request submitted! Pending admin approval.");
      setDepositAmount("");
      setDepositRef("");
    } catch (e: any) {
      toast.error(e?.message ?? "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    const amount = Number.parseInt(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (!withdrawUpi.trim()) {
      toast.error("Enter UPI ID");
      return;
    }
    try {
      await createWithdrawal.mutateAsync({
        amount: BigInt(amount),
        upiId: withdrawUpi.trim(),
      });
      toast.success("Withdrawal request submitted! Pending admin approval.");
      setWithdrawAmount("");
      setWithdrawUpi("");
    } catch (e: any) {
      toast.error(e?.message ?? "Withdrawal failed");
    }
  };

  const getTransactionAmount = (tx: any): bigint | null => {
    const type = tx.transactionType.__kind__;
    if (type === "deposit") return tx.transactionType.deposit.amount;
    if (type === "withdrawal") return tx.transactionType.withdrawal.amount;
    if (type === "bet") return tx.transactionType.bet.amount ?? null;
    if (type === "payout") return tx.transactionType.payout.amount ?? null;
    return null;
  };

  const statusBadge = (status: Variant_pending_approved_rejected) => {
    if (status === Variant_pending_approved_rejected.approved)
      return (
        <Badge className="bg-neon/20 text-neon border-neon/30 border text-xs">
          Approved
        </Badge>
      );
    if (status === Variant_pending_approved_rejected.rejected)
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30 border text-xs">
          Rejected
        </Badge>
      );
    return (
      <Badge className="bg-gold/20 text-gold border-gold/30 border text-xs">
        Pending
      </Badge>
    );
  };

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Wallet className="w-16 h-16 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Login to access your wallet</p>
        <Button
          data-ocid="wallet.login.primary_button"
          onClick={login}
          className="bg-neon text-black hover:bg-neon/90 font-bold rounded-full px-8"
        >
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Balance card */}
      <Card className="bg-card-deep border-border">
        <CardContent className="p-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">
              Your Balance
            </p>
            <p className="text-5xl font-bold text-gold">
              ₹{(profile as any)?.wallet?.toString() ?? "0"}
            </p>
            {(profile as any)?.userId != null && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                User ID:{" "}
                <span className="font-mono font-bold text-foreground">
                  #{(profile as any).userId.toString().padStart(4, "0")}
                </span>
              </p>
            )}
          </div>
          <div className="w-20 h-20 rounded-full border-2 border-gold/30 bg-gold/10 flex items-center justify-center">
            <Wallet className="w-8 h-8 text-gold" />
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Deposit */}
        <Card className="bg-card-deep border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-wide">
              <ArrowDownCircle className="w-5 h-5 text-neon" />
              Deposit via UPI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Amount (₹)
              </p>
              <Input
                data-ocid="deposit.amount.input"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-card-mid border-border focus:border-neon text-foreground"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                UPI Transaction Reference
              </p>
              <Input
                data-ocid="deposit.ref.input"
                placeholder="e.g. 123456789012"
                value={depositRef}
                onChange={(e) => setDepositRef(e.target.value)}
                className="bg-card-mid border-border focus:border-neon text-foreground"
              />
            </div>
            <Button
              data-ocid="deposit.submit.primary_button"
              onClick={handleDeposit}
              disabled={createDeposit.isPending}
              className="w-full bg-neon text-black hover:bg-neon/90 font-bold rounded-full neon-glow"
            >
              {createDeposit.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "SUBMIT DEPOSIT REQUEST"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Supports BHIM UPI · GPay · PhonePe
            </p>
          </CardContent>
        </Card>

        {/* Withdrawal */}
        <Card className="bg-card-deep border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-bold uppercase tracking-wide">
              <ArrowUpCircle className="w-5 h-5 text-gold" />
              Withdraw via UPI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                Amount (₹)
              </p>
              <Input
                data-ocid="withdrawal.amount.input"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-card-mid border-border focus:border-neon text-foreground"
              />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-semibold uppercase">
                UPI ID
              </p>
              <Input
                data-ocid="withdrawal.upi.input"
                placeholder="e.g. yourname@upi"
                value={withdrawUpi}
                onChange={(e) => setWithdrawUpi(e.target.value)}
                className="bg-card-mid border-border focus:border-neon text-foreground"
              />
            </div>
            <Button
              data-ocid="withdrawal.submit.secondary_button"
              onClick={handleWithdraw}
              disabled={createWithdrawal.isPending}
              variant="outline"
              className="w-full border-gold text-gold hover:bg-gold/10 font-bold rounded-full gold-glow"
            >
              {createWithdrawal.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "SUBMIT WITHDRAWAL REQUEST"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Withdrawal processed within 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="bg-card-deep border-border">
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-wide">
            Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || (transactions as any[]).length === 0 ? (
            <div
              data-ocid="transactions.empty_state"
              className="text-center py-10 text-muted-foreground text-sm"
            >
              No transactions yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs">
                    Type
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Amount
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Date
                  </TableHead>
                  <TableHead className="text-muted-foreground text-xs">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(transactions as any[]).map((tx: any, idx: number) => {
                  const type = tx.transactionType.__kind__;
                  const amount = getTransactionAmount(tx);
                  const isRejected =
                    tx.status === Variant_pending_approved_rejected.rejected;
                  const rejectionReason =
                    isRejected && tx.rejectionReason
                      ? tx.rejectionReason
                      : null;
                  return (
                    <TableRow
                      key={tx.transactionId.toString()}
                      data-ocid={`transactions.item.${idx + 1}`}
                      className="border-border"
                    >
                      <TableCell>
                        <span className="capitalize text-sm font-semibold">
                          {type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {amount !== null ? `₹${amount.toString()}` : "-"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(
                          Number(tx.timestamp) / 1_000_000,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {statusBadge(tx.status)}
                          {rejectionReason && (
                            <p className="text-xs text-destructive italic">
                              Reason: {rejectionReason}
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
